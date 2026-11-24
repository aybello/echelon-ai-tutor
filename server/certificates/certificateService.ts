/**
 * Certificate service — all database access for operator licence expiry
 * tracking (see shared/certificates.ts for the domain contracts).
 *
 * Scoping rule: every manager-side operation takes the caller's organization
 * id (resolved by resolveOrgManager in the router) and filters on it, so a
 * manager can only ever see or change their own organization's records.
 */
import { and, asc, eq } from "drizzle-orm";
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

export interface CertificateView extends Certificate {
  certificateLabel: string;
  daysUntilExpiry: number;
  statusBand: CertificateStatusBand;
  /** Echelon course that prepares the operator to renew this certificate. */
  courseKey: string | null;
  /** Client route for that course, for renewal links. */
  coursePath: string | null;
}

export function toCertificateView(cert: Certificate, now: Date): CertificateView {
  const days = daysUntilExpiry(cert.expiresAt, now);
  const courseKey = courseKeyForCertificateType(cert.certificateType);
  return {
    ...cert,
    certificateLabel: certificateTypeLabel(cert.certificateType),
    daysUntilExpiry: days,
    statusBand: statusBandForDays(days),
    courseKey,
    coursePath: courseKey ? (getCourseByKey(courseKey)?.quizPath ?? null) : null,
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

/** Finds the Echelon user id for an email, or null when there is no account. */
export async function findUserIdByEmail(db: Db, email: string): Promise<number | null> {
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
export async function resolveOperatorEmail(db: Db, cert: Certificate): Promise<string | null> {
  if (cert.operatorUserId != null) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, cert.operatorUserId))
      .limit(1);
    if (user?.email) return normalizeEmail(user.email);
  }
  const members = await db
    .select({ email: organizationMembers.email, name: organizationMembers.name })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, cert.organizationId),
        eq(organizationMembers.status, "assigned"),
      ),
    );
  const target = cert.operatorName.trim().toLowerCase();
  const match = members.find((m) => (m.name ?? "").trim().toLowerCase() === target);
  return match ? normalizeEmail(match.email) : null;
}

export async function listCertificatesForOrg(orgId: number, now = new Date()): Promise<CertificateView[]> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.organizationId, orgId))
    .orderBy(asc(certificates.expiresAt));
  return rows.map((row) => toCertificateView(row, now));
}

export async function getCertificateSummaryForOrg(orgId: number, now = new Date()): Promise<CertificateSummary> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.organizationId, orgId));
  return summarizeCertificates(
    rows.map((row) => ({ operatorKey: operatorKeyFor(row), expiresAt: row.expiresAt })),
    now,
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
  input: CreateCertificateInput,
): Promise<CertificateView> {
  const db = await requireDb();
  const operatorUserId = input.operatorEmail ? await findUserIdByEmail(db, input.operatorEmail) : null;
  const [created] = await db
    .insert(certificates)
    .values({
      organizationId: orgId,
      operatorUserId,
      operatorName: input.operatorName.trim(),
      certificateType: input.certificateType,
      certificateNumber: input.certificateNumber.trim(),
      issuedAt: input.issuedAt ?? null,
      expiresAt: input.expiresAt,
      createdByUserId,
    })
    .$returningId();
  const [row] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.id, created.id), eq(certificates.organizationId, orgId)))
    .limit(1);
  return toCertificateView(row, new Date());
}

/** Fetches one certificate scoped to the org, or null when it is not theirs. */
export async function getCertificateForOrg(orgId: number, certificateId: number): Promise<Certificate | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.id, certificateId), eq(certificates.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export interface UpdateCertificateInput {
  operatorName?: string;
  certificateType?: string;
  certificateNumber?: string;
  issuedAt?: Date | null;
  expiresAt?: Date;
}

export async function updateCertificate(
  orgId: number,
  certificateId: number,
  patch: UpdateCertificateInput,
): Promise<CertificateView | null> {
  const db = await requireDb();
  const existing = await getCertificateForOrg(orgId, certificateId);
  if (!existing) return null;
  await db
    .update(certificates)
    .set({
      ...(patch.operatorName !== undefined ? { operatorName: patch.operatorName.trim() } : {}),
      ...(patch.certificateType !== undefined ? { certificateType: patch.certificateType } : {}),
      ...(patch.certificateNumber !== undefined ? { certificateNumber: patch.certificateNumber.trim() } : {}),
      ...(patch.issuedAt !== undefined ? { issuedAt: patch.issuedAt } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
    })
    .where(and(eq(certificates.id, certificateId), eq(certificates.organizationId, orgId)));
  const updated = await getCertificateForOrg(orgId, certificateId);
  return updated ? toCertificateView(updated, new Date()) : null;
}

export async function deleteCertificate(orgId: number, certificateId: number): Promise<boolean> {
  const db = await requireDb();
  const existing = await getCertificateForOrg(orgId, certificateId);
  if (!existing) return false;
  await db
    .delete(certificates)
    .where(and(eq(certificates.id, certificateId), eq(certificates.organizationId, orgId)));
  return true;
}

/**
 * Records a renewal: the expiry date moves forward. Past alert log rows stay
 * bound to the old expiry date, so the new expiry starts a fresh alert cycle
 * with no extra work here.
 */
export async function renewCertificate(
  orgId: number,
  certificateId: number,
  input: { expiresAt: Date; issuedAt?: Date | null },
): Promise<CertificateView | null> {
  return updateCertificate(orgId, certificateId, {
    expiresAt: input.expiresAt,
    ...(input.issuedAt !== undefined ? { issuedAt: input.issuedAt } : {}),
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
  mapping: CertificateCsvMapping,
): Promise<ImportCertificatesResult> {
  const db = await requireDb();
  const { validRows, failures } = validateCertificateCsv(csvText, mapping);
  // Roster name -> email, used to link imported operators to their accounts.
  const members = await db
    .select({ email: organizationMembers.email, name: organizationMembers.name })
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.status, "assigned")),
    );
  const emailByName = new Map<string, string>();
  for (const member of members) {
    if (member.name) emailByName.set(member.name.trim().toLowerCase(), normalizeEmail(member.email));
  }
  let imported = 0;
  for (const row of validRows) {
    const memberEmail = emailByName.get(row.operatorName.trim().toLowerCase());
    const operatorUserId = memberEmail ? await findUserIdByEmail(db, memberEmail) : null;
    await db.insert(certificates).values({
      organizationId: orgId,
      operatorUserId,
      operatorName: row.operatorName,
      certificateType: row.certificateType,
      certificateNumber: row.certificateNumber,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      createdByUserId,
    });
    imported += 1;
  }
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
  now = new Date(),
): Promise<CertificateView[]> {
  const db = await requireDb();
  const byId = new Map<number, Certificate>();
  const linked = await db
    .select()
    .from(certificates)
    .where(eq(certificates.operatorUserId, userId));
  for (const row of linked) byId.set(row.id, row);

  const memberships = await db
    .select({ orgId: organizationMembers.orgId, name: organizationMembers.name })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.email, normalizeEmail(email)),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned"),
      ),
    );
  for (const membership of memberships) {
    if (!membership.name) continue;
    const target = membership.name.trim().toLowerCase();
    const orgRows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.organizationId, membership.orgId));
    for (const row of orgRows) {
      if (row.operatorName.trim().toLowerCase() === target) byId.set(row.id, row);
    }
  }
  return [...byId.values()]
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
    .map((row) => toCertificateView(row, now));
}

// ── Alert job support ────────────────────────────────────────────────────────

export interface AlertRecipients {
  orgName: string;
  /** Organization manager emails (org owner + roster managers). */
  managerEmails: string[];
  operatorEmail: string | null;
}

/** Everyone who should receive an expiry alert for one certificate. */
export async function getAlertRecipients(db: Db, cert: Certificate): Promise<AlertRecipients> {
  const [org] = await db
    .select({ name: organizations.name, managerEmail: organizations.managerEmail })
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
        eq(organizationMembers.status, "assigned"),
      ),
    );
  const managerEmails = new Set<string>();
  if (org?.managerEmail) managerEmails.add(normalizeEmail(org.managerEmail));
  for (const member of managerMembers) managerEmails.add(normalizeEmail(member.email));
  return {
    orgName: org?.name ?? "Your organization",
    managerEmails: [...managerEmails],
    operatorEmail: await resolveOperatorEmail(db, cert),
  };
}

export async function hasAlertBeenSent(
  db: Db,
  certificateId: number,
  thresholdDays: number,
  expiresAt: Date,
  recipientEmail: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: certificateAlerts.id })
    .from(certificateAlerts)
    .where(
      and(
        eq(certificateAlerts.certificateId, certificateId),
        eq(certificateAlerts.thresholdDays, thresholdDays),
        eq(certificateAlerts.expiresAt, expiresAt),
        eq(certificateAlerts.recipientEmail, normalizeEmail(recipientEmail)),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function recordAlertSent(
  db: Db,
  input: {
    certificateId: number;
    thresholdDays: number;
    expiresAt: Date;
    recipientEmail: string;
    recipientUserId: number | null;
  },
): Promise<void> {
  await db.insert(certificateAlerts).values({
    certificateId: input.certificateId,
    thresholdDays: input.thresholdDays,
    expiresAt: input.expiresAt,
    recipientEmail: normalizeEmail(input.recipientEmail),
    recipientUserId: input.recipientUserId,
  });
}
