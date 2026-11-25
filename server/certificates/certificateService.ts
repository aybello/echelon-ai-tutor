/**
 * Certificate service — all database access for operator licence expiry
 * tracking (see shared/certificates.ts for the domain contracts).
 *
 * Scoping rule: every manager-side operation takes the caller's organization
 * id (resolved by resolveOrgManager in the router) and filters on it, so a
 * manager can only ever see or change their own organization's records.
 */
import { and, asc, eq, isNull, lte, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  certificateAlerts,
  certificateAuditLog,
  certificateEvidence,
  certificates,
  organizationMembers,
  organizations,
  users,
  type Certificate,
} from "../../drizzle/schema";
import {
  certificateTypeLabel,
  courseKeyForCertificateType,
  daysUntilExpiry,
  statusBandForDays,
  summarizeCertificates,
  validateCertificateCsv,
  type CertificateCsvFailure,
  type CertificateCsvMapping,
  type CertificateStatusBand,
  type CertificateSummary,
} from "../../shared/certificates";
import { getCourseByKey } from "../../shared/courseRegistry";
import { normalizeEmail } from "../_core/access";
import { getDb } from "../db";
import { storageGet, storagePut } from "../storage";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function findActiveOperatorMemberByEmail(
  db: Db,
  orgId: number,
  email: string
) {
  const normalized = normalizeEmail(email);
  const rows = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.email, normalized),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned")
      )
    );
  return rows.length === 1 ? rows[0] : null;
}

export interface CertificateView extends Certificate {
  certificateLabel: string;
  daysUntilExpiry: number;
  statusBand: CertificateStatusBand;
  /** Echelon course that prepares the operator to renew this certificate. */
  courseKey: string | null;
  /** Client route for that course, for renewal links. */
  coursePath: string | null;
}

export function toCertificateView(
  cert: Certificate,
  now: Date
): CertificateView {
  const days = daysUntilExpiry(cert.expiresAt, now);
  const courseKey = courseKeyForCertificateType(cert.certificateType);
  return {
    ...cert,
    certificateLabel: certificateTypeLabel(cert.certificateType),
    daysUntilExpiry: days,
    statusBand: statusBandForDays(days),
    courseKey,
    coursePath: courseKey
      ? (getCourseByKey(courseKey)?.quizPath ?? null)
      : null,
  };
}

function operatorKeyFor(cert: Certificate): string {
  return cert.operatorUserId != null
    ? `user:${cert.operatorUserId}`
    : `name:${cert.operatorName.trim().toLowerCase()}`;
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

function canonicalUtcDay(value: Date): Date {
  const result = new Date(value.getTime());
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/** Finds the Echelon user id for an email, or null when there is no account. */
export async function findUserIdByEmail(
  db: Db,
  email: string
): Promise<number | null> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Resolves the email alerts should be sent to for a certificate's operator.
 * Certificates without an explicit member link do not get rebound by display
 * name, because a later roster change could send a private certificate alert
 * to the wrong person.
 */
export async function resolveOperatorEmail(
  db: Db,
  cert: Certificate
): Promise<string | null> {
  if (cert.operatorMemberId != null) {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, cert.operatorMemberId),
          eq(organizationMembers.orgId, cert.organizationId),
          eq(organizationMembers.role, "operator"),
          eq(organizationMembers.status, "assigned")
        )
      )
      .limit(1);
    return member ? normalizeEmail(member.email) : null;
  }
  if (cert.operatorUserId == null) return null;
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, cert.operatorUserId))
    .limit(1);
  if (!user?.email) return null;
  const [activeMembership] = await db
    .select({ email: organizationMembers.email, name: organizationMembers.name })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, cert.organizationId),
        eq(organizationMembers.email, normalizeEmail(user.email)),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned")
      )
    )
    .limit(1);
  if (!activeMembership) return null;
  return (activeMembership.name ?? "").trim().toLowerCase() ===
      cert.operatorName.trim().toLowerCase()
    ? normalizeEmail(activeMembership.email)
    : null;
}

export async function listCertificatesForOrg(
  orgId: number,
  now = new Date()
): Promise<CertificateView[]> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.organizationId, orgId))
    .orderBy(asc(certificates.expiresAt));
  return rows.map(row => toCertificateView(row, now));
}

export async function getCertificateSummaryForOrg(
  orgId: number,
  now = new Date()
): Promise<CertificateSummary> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.organizationId, orgId));
  return summarizeCertificates(
    rows.map(row => ({
      operatorKey: operatorKeyFor(row),
      expiresAt: row.expiresAt,
    })),
    now
  );
}

export interface CreateCertificateInput {
  operatorName: string;
  /** Optional: when the operator is on the roster, links their account. */
  operatorEmail?: string;
  certificateType: string;
  certificateNumber: string;
  issuedAt?: Date | null;
  expiresAt: Date;
}

export async function createCertificate(
  orgId: number,
  createdByUserId: number | null,
  input: CreateCertificateInput
): Promise<CertificateView> {
  const db = await requireDb();
  const expiresAt = canonicalUtcDay(input.expiresAt);
  const issuedAt = input.issuedAt ? canonicalUtcDay(input.issuedAt) : null;
  if (issuedAt && issuedAt.getTime() > expiresAt.getTime())
    throw new Error("Issue date must be on or before expiry date.");
  const member = input.operatorEmail
    ? await findActiveOperatorMemberByEmail(db, orgId, input.operatorEmail)
    : null;
  if (input.operatorEmail && !member)
    throw new Error(
      "Operator email must belong to an active operator in this organization."
    );
  const operatorUserId = member
    ? await findUserIdByEmail(db, member.email)
    : null;
  const [created] = await db
    .insert(certificates)
    .values({
      organizationId: orgId,
      operatorUserId,
      operatorMemberId: member?.id ?? null,
      operatorName: input.operatorName.trim(),
      certificateType: input.certificateType,
      certificateNumber: input.certificateNumber.trim(),
      issuedAt,
      expiresAt,
      createdByUserId,
    })
    .$returningId();
  const [row] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.id, created.id),
        eq(certificates.organizationId, orgId)
      )
    )
    .limit(1);
  return toCertificateView(row, new Date());
}

/** Fetches one certificate scoped to the org, or null when it is not theirs. */
export async function getCertificateForOrg(
  orgId: number,
  certificateId: number
): Promise<Certificate | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.id, certificateId),
        eq(certificates.organizationId, orgId)
      )
    )
    .limit(1);
  return row ?? null;
}

export interface UpdateCertificateInput {
  operatorName?: string;
  certificateType?: string;
  certificateNumber?: string;
  issuedAt?: Date | null;
  expiresAt?: Date;
  expectedVersion: number;
}

export async function updateCertificate(
  orgId: number,
  certificateId: number,
  patch: UpdateCertificateInput
): Promise<CertificateView | null> {
  const db = await requireDb();
  const existing = await getCertificateForOrg(orgId, certificateId);
  if (!existing) return null;
  const nextIssuedAt =
    patch.issuedAt !== undefined
      ? patch.issuedAt
        ? canonicalUtcDay(patch.issuedAt)
        : null
      : existing.issuedAt
        ? canonicalUtcDay(existing.issuedAt)
        : null;
  const nextExpiresAt =
    patch.expiresAt !== undefined
      ? canonicalUtcDay(patch.expiresAt)
      : canonicalUtcDay(existing.expiresAt);
  if (nextIssuedAt && nextIssuedAt.getTime() > nextExpiresAt.getTime())
    throw new Error("Issue date must be on or before expiry date.");
  const result = await db
    .update(certificates)
    .set({
      ...(patch.operatorName !== undefined
        ? { operatorName: patch.operatorName.trim() }
        : {}),
      ...(patch.certificateType !== undefined
        ? { certificateType: patch.certificateType }
        : {}),
      ...(patch.certificateNumber !== undefined
        ? { certificateNumber: patch.certificateNumber.trim() }
        : {}),
      ...(patch.issuedAt !== undefined ? { issuedAt: nextIssuedAt } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: nextExpiresAt } : {}),
      version: (existing.version ?? 1) + 1,
    })
    .where(
      and(
        eq(certificates.id, certificateId),
        eq(certificates.organizationId, orgId),
        ...(patch.expectedVersion != null
          ? [eq(certificates.version, patch.expectedVersion)]
          : [])
      )
    );
  const affected = Number(
    (result as any)?.affectedRows ??
      (Array.isArray(result) ? (result as any)[0]?.affectedRows : 0)
  );
  if (affected !== 1) throw new Error("CERTIFICATE_VERSION_CONFLICT");
  const changes = Object.fromEntries(
    Object.entries(patch).filter(([key]) => key !== "expectedVersion")
  );
  if (Object.keys(changes).length > 0) {
    await db.insert(certificateAuditLog).values({
      organizationId: orgId,
      certificateId,
      actorUserId: null,
      action: "update",
      changes: JSON.stringify(changes),
    });
  }
  const updated = await getCertificateForOrg(orgId, certificateId);
  return updated ? toCertificateView(updated, new Date()) : null;
}

export async function deleteCertificate(
  orgId: number,
  certificateId: number,
  expectedVersion: number
): Promise<boolean> {
  const db = await requireDb();
  const existing = await getCertificateForOrg(orgId, certificateId);
  if (!existing) return false;
  const result = await db
    .delete(certificates)
    .where(
      and(
        eq(certificates.id, certificateId),
        eq(certificates.organizationId, orgId),
        ...(expectedVersion != null
          ? [eq(certificates.version, expectedVersion)]
          : [])
      )
    );
  const affected = Number(
    (result as any)?.affectedRows ??
      (Array.isArray(result) ? (result as any)[0]?.affectedRows : 0)
  );
  if (expectedVersion != null && affected !== 1)
    throw new Error("CERTIFICATE_VERSION_CONFLICT");
  return affected === 1;
}

export async function listCertificateAudit(orgId: number, certificateId: number) {
  const db = await requireDb();
  return db.select().from(certificateAuditLog).where(and(eq(certificateAuditLog.organizationId, orgId), eq(certificateAuditLog.certificateId, certificateId))).orderBy(asc(certificateAuditLog.createdAt));
}

export async function setCertificateWorkflow(orgId: number, certificateId: number, actorUserId: number | null, input: { followUpOwner?: string | null; followUpStatus?: string; rosterReviewStatus?: string }) {
  const db = await requireDb();
  const existing = await getCertificateForOrg(orgId, certificateId);
  if (!existing) return null;
  await db.update(certificates).set({
    ...(input.followUpOwner !== undefined ? { followUpOwner: input.followUpOwner?.trim() || null } : {}),
    ...(input.followUpStatus !== undefined ? { followUpStatus: input.followUpStatus } : {}),
    ...(input.rosterReviewStatus !== undefined ? { rosterReviewStatus: input.rosterReviewStatus } : {}),
  }).where(and(eq(certificates.id, certificateId), eq(certificates.organizationId, orgId)));
  await db.insert(certificateAuditLog).values({ organizationId: orgId, certificateId, actorUserId, action: "workflow", changes: JSON.stringify(input) });
  return getCertificateForOrg(orgId, certificateId);
}

const EVIDENCE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export async function listCertificateEvidence(orgId: number, certificateId: number) {
  const db = await requireDb();
  return db.select().from(certificateEvidence).where(and(eq(certificateEvidence.organizationId, orgId), eq(certificateEvidence.certificateId, certificateId))).orderBy(asc(certificateEvidence.createdAt));
}

export async function addCertificateEvidence(orgId: number, certificateId: number, actorUserId: number | null, input: { fileName: string; contentType: string; dataBase64: string }) {
  const db = await requireDb();
  if (!EVIDENCE_TYPES.has(input.contentType)) throw new Error("Evidence must be a PDF, PNG, or JPEG.");
  const data = Buffer.from(input.dataBase64, "base64");
  if (!data.length || data.length > MAX_EVIDENCE_BYTES) throw new Error("Evidence must be no larger than 5 MB.");
  if (!(await getCertificateForOrg(orgId, certificateId))) return null;
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-160) || "evidence";
  const key = `certificate-evidence/org-${orgId}/certificate-${certificateId}/${randomUUID()}-${safeName}`;
  const stored = await storagePut(key, data, input.contentType);
  const [created] = await db.insert(certificateEvidence).values({ organizationId: orgId, certificateId, objectKey: stored.key, fileName: safeName, contentType: input.contentType, byteSize: data.length }).$returningId();
  await db.insert(certificateAuditLog).values({ organizationId: orgId, certificateId, actorUserId, action: "evidence_added", changes: JSON.stringify({ fileName: safeName, byteSize: data.length }) });
  return { id: created.id, fileName: safeName, contentType: input.contentType, byteSize: data.length, reviewed: false };
}

export async function getCertificateEvidenceUrl(orgId: number, evidenceId: number) {
  const db = await requireDb();
  const [row] = await db.select().from(certificateEvidence).where(and(eq(certificateEvidence.id, evidenceId), eq(certificateEvidence.organizationId, orgId))).limit(1);
  if (!row) return null;
  return { ...(await storageGet(row.objectKey)), fileName: row.fileName, contentType: row.contentType };
}

export async function deleteCertificateEvidence(orgId: number, evidenceId: number, actorUserId: number | null) {
  const db = await requireDb();
  const [row] = await db.select().from(certificateEvidence).where(and(eq(certificateEvidence.id, evidenceId), eq(certificateEvidence.organizationId, orgId))).limit(1);
  if (!row) return false;
  await db.delete(certificateEvidence).where(and(eq(certificateEvidence.id, evidenceId), eq(certificateEvidence.organizationId, orgId)));
  await db.insert(certificateAuditLog).values({ organizationId: orgId, certificateId: row.certificateId, actorUserId, action: "evidence_deleted", changes: JSON.stringify({ fileName: row.fileName }) });
  return true;
}

export async function reviewCertificateEvidence(orgId: number, evidenceId: number, actorUserId: number | null) {
  const db = await requireDb();
  const [row] = await db.select().from(certificateEvidence).where(and(eq(certificateEvidence.id, evidenceId), eq(certificateEvidence.organizationId, orgId))).limit(1);
  if (!row) return null;
  const reviewedAt = new Date();
  await db.update(certificateEvidence).set({ reviewedByUserId: actorUserId, reviewedAt }).where(and(eq(certificateEvidence.id, evidenceId), eq(certificateEvidence.organizationId, orgId)));
  return { ...row, reviewedByUserId: actorUserId, reviewedAt };
}

/**
 * Records a renewal: the expiry date moves forward. Past alert log rows stay
 * bound to the old expiry date, so the new expiry starts a fresh alert cycle
 * with no extra work here.
 */
export async function renewCertificate(
  orgId: number,
  certificateId: number,
  input: { expiresAt: Date; issuedAt?: Date | null; expectedVersion: number }
): Promise<CertificateView | null> {
  const existing = await getCertificateForOrg(orgId, certificateId);
  if (!existing) return null;
  const expiresAt = canonicalUtcDay(input.expiresAt);
  if (expiresAt.getTime() <= canonicalUtcDay(existing.expiresAt).getTime())
    throw new Error("Renewal expiry must move forward.");
  return updateCertificate(orgId, certificateId, {
    expiresAt,
    ...(input.issuedAt !== undefined ? { issuedAt: input.issuedAt } : {}),
    expectedVersion: input.expectedVersion,
  });
}

export interface ImportCertificatesResult {
  imported: number;
  failures: CertificateCsvFailure[];
}

/**
 * Imports a municipal spreadsheet (CSV text + the manager's column mapping).
 * Valid rows are inserted; invalid rows are reported back with reasons and
 * are never silently dropped.
 */
export async function importCertificates(
  orgId: number,
  createdByUserId: number | null,
  csvText: string,
  mapping: CertificateCsvMapping
): Promise<ImportCertificatesResult> {
  const db = await requireDb();
  const { validRows, failures } = validateCertificateCsv(csvText, mapping);
  // Roster name -> email, used to link imported operators to their accounts.
  const members = await db
    .select({
      id: organizationMembers.id,
      email: organizationMembers.email,
      name: organizationMembers.name,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned")
      )
    );
  const memberByName = new Map<string, (typeof members)[number] | null>();
  for (const member of members) {
    if (!member.name) continue;
    const key = member.name.trim().toLowerCase();
    memberByName.set(key, memberByName.has(key) ? null : member);
  }
  const existing = await db
    .select({
      certificateType: certificates.certificateType,
      certificateNumber: certificates.certificateNumber,
    })
    .from(certificates)
    .where(eq(certificates.organizationId, orgId));
  const existingKeys = new Set(
    existing.map(
      row =>
        `${row.certificateType}:${row.certificateNumber.trim().toLowerCase()}`
    )
  );
  const seen = new Set<string>();
  const rowsToInsert = [] as Array<
    (typeof validRows)[number] & { member: (typeof members)[number] | null }
  >;
  for (const row of validRows) {
    const dedupeKey = `${row.certificateType}:${row.certificateNumber.toLowerCase()}`;
    if (existingKeys.has(dedupeKey)) {
      failures.push({
        rowNumber: row.rowNumber,
        raw: [],
        reason: "Certificate already exists in this organization.",
      });
      continue;
    }
    if (seen.has(dedupeKey)) {
      failures.push({
        rowNumber: row.rowNumber,
        raw: [],
        reason: "Duplicate certificate type and number in this import.",
      });
      continue;
    }
    seen.add(dedupeKey);
    rowsToInsert.push({
      ...row,
      member: memberByName.get(row.operatorName.trim().toLowerCase()) ?? null,
    });
  }
  let imported = 0;
  await db.transaction(async tx => {
    for (const row of rowsToInsert) {
      const operatorUserId = row.member
        ? await findUserIdByEmail(tx as Db, row.member.email)
        : null;
      try {
        await tx.insert(certificates).values({
          organizationId: orgId,
          operatorUserId,
          operatorMemberId: row.member?.id ?? null,
          operatorName: row.operatorName,
          certificateType: row.certificateType,
          certificateNumber: row.certificateNumber,
          issuedAt: row.issuedAt ? canonicalUtcDay(row.issuedAt) : null,
          expiresAt: canonicalUtcDay(row.expiresAt),
          createdByUserId,
        });
        imported += 1;
      } catch (error) {
        if (!isCertificateUniqueDuplicate(error)) throw error;
        failures.push({
          rowNumber: row.rowNumber,
          raw: [],
          reason: "Certificate already exists in this organization.",
        });
      }
    }
  });
  return { imported, failures };
}

/**
 * The operator's own certificates: rows linked to their account, plus rows in
 * organizations where they are on the roster under the same name (imported
 * registers may predate their account).
 */
export async function listCertificatesForOperator(
  userId: number,
  email: string,
  now = new Date()
): Promise<CertificateView[]> {
  const db = await requireDb();
  const memberships = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.email, normalizeEmail(email)),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned")
      )
    );
  const byId = new Map<number, Certificate>();
  for (const membership of memberships) {
    const orgRows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.organizationId, membership.orgId));
    for (const row of orgRows) {
      const explicitMatch = row.operatorMemberId === membership.id;
      const legacyAccountMatch =
        row.operatorMemberId == null && row.operatorUserId === userId;
      if (explicitMatch || legacyAccountMatch) byId.set(row.id, row);
    }
  }
  return [...byId.values()]
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
    .map(row => toCertificateView(row, now));
}

// ── Alert job support ────────────────────────────────────────────────────────

export interface AlertRecipients {
  orgName: string;
  /** Organization manager emails (org owner + roster managers). */
  managerEmails: string[];
  operatorEmail: string | null;
}

/** Everyone who should receive an expiry alert for one certificate. */
export async function getAlertRecipients(
  db: Db,
  cert: Certificate
): Promise<AlertRecipients> {
  const [org] = await db
    .select({
      name: organizations.name,
      managerEmail: organizations.managerEmail,
    })
    .from(organizations)
    .where(eq(organizations.id, cert.organizationId))
    .limit(1);
  const managerMembers = await db
    .select({ email: organizationMembers.email })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, cert.organizationId),
        eq(organizationMembers.role, "manager"),
        eq(organizationMembers.status, "assigned")
      )
    );
  const managerEmails = new Set<string>();
  if (org?.managerEmail) managerEmails.add(normalizeEmail(org.managerEmail));
  for (const member of managerMembers)
    managerEmails.add(normalizeEmail(member.email));
  return {
    orgName: org?.name ?? "Your organization",
    managerEmails: [...managerEmails],
    operatorEmail: await resolveOperatorEmail(db, cert),
  };
}

function isCertificateUniqueDuplicate(error: unknown): boolean {
  const seen = new Set<unknown>();
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const candidate = value as {
      code?: unknown;
      errno?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    const message =
      typeof candidate.message === "string" ? candidate.message : "";
    if (
      (candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062) &&
      message.includes("certificates_org_type_number_idx")
    )
      return true;
    return visit(candidate.cause);
  };
  return visit(error);
}

function isCertificateAlertUniqueDuplicate(error: unknown): boolean {
  const seen = new Set<unknown>();
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const candidate = value as {
      code?: unknown;
      errno?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    const code = candidate.code;
    const errno = candidate.errno;
    const message =
      typeof candidate.message === "string" ? candidate.message : "";
    const indexMatch = message.includes("certificate_alerts_unique_idx");
    if ((code === "ER_DUP_ENTRY" || errno === 1062) && indexMatch) return true;
    return visit(candidate.cause);
  };
  return visit(error);
}

export async function claimAlertSend(
  db: Db,
  input: {
    certificateId: number;
    thresholdDays: number;
    expiresAt: Date;
    recipientEmail: string;
    recipientUserId: number | null;
    leaseMs?: number;
  }
): Promise<{ id: number; token: string } | null> {
  const email = normalizeEmail(input.recipientEmail);
  const token = randomUUID();
  const now = new Date();
  const leaseUntil = new Date(
    now.getTime() + (input.leaseMs ?? 15 * 60 * 1000)
  );
  try {
    const inserted = await db
      .insert(certificateAlerts)
      .values({
        certificateId: input.certificateId,
        thresholdDays: input.thresholdDays,
        expiresAt: input.expiresAt,
        recipientEmail: email,
        recipientUserId: input.recipientUserId,
        status: "pending",
        claimToken: token,
        leaseUntil,
        attemptCount: 1,
        sentAt: null,
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Certificate alert claim returned no insert id.");
    return { id, token };
  } catch (error) {
    if (!isCertificateAlertUniqueDuplicate(error)) throw error;
    const [existing] = await db
      .select()
      .from(certificateAlerts)
      .where(
        and(
          eq(certificateAlerts.certificateId, input.certificateId),
          eq(certificateAlerts.thresholdDays, input.thresholdDays),
          eq(certificateAlerts.expiresAt, input.expiresAt),
          eq(certificateAlerts.recipientEmail, email)
        )
      )
      .limit(1);
    if (!existing || existing.status === "sent") return null;
    const reclaimable =
      existing.status === "failed" ||
      (existing.status === "pending" &&
        (!existing.leaseUntil ||
          existing.leaseUntil.getTime() <= now.getTime()));
    if (!reclaimable) return null;
    const patch = {
      status: "pending" as const,
      claimToken: token,
      leaseUntil,
      attemptCount: (existing.attemptCount ?? 0) + 1,
      lastError: null,
    };
    const failedResult = await db
      .update(certificateAlerts)
      .set(patch)
      .where(
        and(
          eq(certificateAlerts.id, existing.id),
          eq(certificateAlerts.status, "failed")
        )
      );
    const failedAffected = Number(
      (failedResult as any)?.affectedRows ??
        (Array.isArray(failedResult) ? (failedResult as any)[0]?.affectedRows : 0)
    );
    const result =
      failedAffected === 1
        ? failedResult
        : await db
            .update(certificateAlerts)
            .set(patch)
            .where(
              and(
                eq(certificateAlerts.id, existing.id),
                eq(certificateAlerts.status, "pending"),
                or(
                  isNull(certificateAlerts.leaseUntil),
                  lte(certificateAlerts.leaseUntil, now)
                )
              )
            );
    const affected = Number(
      (result as any)?.affectedRows ??
        (Array.isArray(result) ? (result as any)[0]?.affectedRows : 0)
    );
    return affected === 1 ? { id: existing.id, token } : null;
  }
}

export async function markAlertSent(
  db: Db,
  id: number,
  token: string
): Promise<boolean> {
  const result = await db
    .update(certificateAlerts)
    .set({ status: "sent", sentAt: new Date(), leaseUntil: null })
    .where(
      and(
        eq(certificateAlerts.id, id),
        eq(certificateAlerts.claimToken, token),
        eq(certificateAlerts.status, "pending")
      )
    );
  return (
    Number(
      (result as any)?.affectedRows ??
        (Array.isArray(result) ? (result as any)[0]?.affectedRows : 0)
    ) === 1
  );
}

export async function markAlertFailed(
  db: Db,
  id: number,
  token: string,
  error: string
): Promise<void> {
  await db
    .update(certificateAlerts)
    .set({ status: "failed", lastError: error.slice(0, 500), leaseUntil: null })
    .where(
      and(
        eq(certificateAlerts.id, id),
        eq(certificateAlerts.claimToken, token),
        eq(certificateAlerts.status, "pending")
      )
    );
}

/**
 * SMTP can accept a message and the process can then lose the database
 * finalization race. Do not turn that state into an automatically retryable
 * failure: a retry could deliver the same alert twice. It requires operator
 * reconciliation instead.
 */
export async function markAlertUncertain(
  db: Db,
  id: number,
  token: string,
  error: string
): Promise<boolean> {
  const result = await db
    .update(certificateAlerts)
    .set({ status: "uncertain", lastError: error.slice(0, 500), leaseUntil: null })
    .where(
      and(
        eq(certificateAlerts.id, id),
        eq(certificateAlerts.claimToken, token),
        eq(certificateAlerts.status, "pending")
      )
    );
  return (
    Number(
      (result as any)?.affectedRows ??
        (Array.isArray(result) ? (result as any)[0]?.affectedRows : 0)
    ) === 1
  );
}
