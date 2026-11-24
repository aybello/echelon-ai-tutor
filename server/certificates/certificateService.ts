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
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
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
 * Resolves the email alerts should be sent to for a certificate's operator:
 * their account email when linked, otherwise the roster (organization
 * member) email of the member in the same org with the same name.
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
  const members = await db
    .select({
      email: organizationMembers.email,
      name: organizationMembers.name,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, cert.organizationId),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned")
      )
    );
  const matches = members.filter(
    m =>
      (m.name ?? "").trim().toLowerCase() ===
      cert.operatorName.trim().toLowerCase()
  );
  return matches.length === 1 ? normalizeEmail(matches[0].email) : null;
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
  expectedVersion?: number;
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
  if (patch.expectedVersion != null && affected !== 1)
    throw new Error("CERTIFICATE_VERSION_CONFLICT");
  const updated = await getCertificateForOrg(orgId, certificateId);
  return updated ? toCertificateView(updated, new Date()) : null;
}

export async function deleteCertificate(
  orgId: number,
  certificateId: number,
  expectedVersion?: number
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

/**
 * Records a renewal: the expiry date moves forward. Past alert log rows stay
 * bound to the old expiry date, so the new expiry starts a fresh alert cycle
 * with no extra work here.
 */
export async function renewCertificate(
  orgId: number,
  certificateId: number,
  input: { expiresAt: Date; issuedAt?: Date | null; expectedVersion?: number }
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
      await tx.insert(certificates).values({
        organizationId: orgId,
        operatorUserId,
        operatorMemberId: row.member?.id ?? null,
        operatorName: row.operatorName,
        certificateType: row.certificateType,
        certificateNumber: row.certificateNumber,
        issuedAt: row.issuedAt,
        expiresAt: row.expiresAt,
        createdByUserId,
      });
      imported += 1;
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
    return inserted[0]?.id ? { id: inserted[0].id, token } : null;
  } catch {
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
    const result = await db
      .update(certificateAlerts)
      .set({
        status: "pending",
        claimToken: token,
        leaseUntil,
        attemptCount: (existing.attemptCount ?? 0) + 1,
        lastError: null,
      })
      .where(
        and(
          eq(certificateAlerts.id, existing.id),
          or(
            eq(certificateAlerts.status, "failed"),
            and(
              eq(certificateAlerts.status, "pending"),
              or(
                isNull(certificateAlerts.leaseUntil),
                lte(certificateAlerts.leaseUntil, now)
              )
            )
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
