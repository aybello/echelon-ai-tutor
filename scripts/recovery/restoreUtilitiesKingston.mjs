#!/usr/bin/env node
/**
 * One-time, evidence-bound Utilities Kingston organization recovery.
 *
 * This tool is intentionally separate from ordinary sales fulfilment and normal
 * customer recovery. It never contacts Stripe, sends mail, creates a user,
 * creates an operator, creates a subscription, or grants a learner course seat.
 *
 * Usage:
 *   node scripts/recovery/restoreUtilitiesKingston.mjs preflight --plan /private/plan.json --report /private/preflight.json
 *
 * Apply requires the preflight digest, a backup key held outside the repository,
 * and the plan-derived confirmation token. The token is recorded as a digest in
 * the durable recovery batch record and is consumed only by a successful commit.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { chmodSync, closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { normalizeStripeRows } from "./normalizeStripeRecoveryExport.mjs";
import {
  UTILITIES_KINGSTON_RECOVERY_KEY,
  UTILITIES_KINGSTON_SCRIPT_VERSION,
  assertApprovedUtilitiesKingstonPlan,
  assertRecoveryEvidenceRows,
  confirmationTokenForPlan,
  deriveOneYearTerm,
  recoveryExternalReference,
  recoveryPlanDigest,
  safeRecoverySummary,
  sha256,
  stableJson,
  validateUtilitiesKingstonPlan,
} from "./utilitiesKingstonRecovery.mjs";

const LOCK_NAME = "echelon:utilities-kingston-recovery:v1";
const BACKUP_HEADER = Buffer.from("ECLUK2");
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REQUIRED_TABLES = [
  "customer_recovery_evidence",
  "customer_recovery_batches",
  "customer_recovery_import_items",
  "organizations",
  "organization_members",
  "organization_term_operator_usage",
  "subscriptions",
  "team_flex_licences",
  "purchases",
  "users",
];
const EXPECTED_DELTAS = Object.freeze({
  customer_recovery_evidence: 0,
  customer_recovery_batches: 1,
  customer_recovery_import_items: 2,
  organizations: 2,
  organization_members: 2,
  organization_term_operator_usage: 0,
  subscriptions: 0,
  team_flex_licences: 0,
  purchases: 0,
  users: 0,
});

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (!new Set(["approve-evidence", "preflight", "apply"]).has(mode)) fail("Usage requires approve-evidence, preflight, or apply mode.");
  const args = { mode, plan: null, report: null, preflight: null };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--plan") args.plan = rest[++index];
    else if (token === "--report") args.report = rest[++index];
    else if (token === "--preflight") args.preflight = rest[++index];
    else fail(`Unknown argument: ${token}`);
  }
  if (!args.plan || !args.report) fail("Both --plan and --report are required.");
  if (mode === "apply" && !args.preflight) fail("Apply requires --preflight with the exact prior preflight report.");
  return args;
}

function readJson(pathname, label) {
  try { return JSON.parse(readFileSync(pathname, "utf8")); }
  catch { fail(`${label} is unreadable or invalid JSON.`); }
}

function assertOutsideRepository(absolute, label) {
  if (absolute === REPO_ROOT || absolute.startsWith(`${REPO_ROOT}/`)) fail(`${label} must remain outside the repository.`);
}

function writePrivateBytes(pathname, payload) {
  const requested = resolve(pathname);
  assertOutsideRepository(requested, "Recovery artifacts");
  mkdirSync(dirname(requested), { recursive: true, mode: 0o700 });
  const parent = realpathSync(dirname(requested));
  assertOutsideRepository(parent, "Recovery artifacts");
  const absolute = resolve(parent, basename(requested));
  if (existsSync(absolute) && lstatSync(absolute).isSymbolicLink()) fail("Recovery artifact target cannot be a symbolic link.");
  const temporary = resolve(parent, `.${basename(absolute)}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`);
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, payload);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  renameSync(temporary, absolute);
  chmodSync(absolute, 0o600);
  const directoryDescriptor = openSync(parent, "r");
  try { fsyncSync(directoryDescriptor); }
  finally { closeSync(directoryDescriptor); }
  return absolute;
}

function writePrivate(pathname, value) {
  return writePrivateBytes(pathname, `${JSON.stringify(value, null, 2)}\n`);
}

function assertPrivatePath(pathname, label) {
  const absolute = resolve(pathname);
  if (!existsSync(absolute)) fail(`${label} is unavailable.`);
  const resolved = realpathSync(absolute);
  assertOutsideRepository(resolved, label);
  return resolved;
}

function hashToken(value) {
  return sha256(`echelon-utilities-kingston-recovery-token:v1:${value}`);
}

function backupKeyFingerprint(key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) fail("Recovery backup key must be exactly 32 bytes.");
  return createHash("sha256").update(key).digest();
}

function encryptBackup(value, key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) fail("Recovery backup key must be exactly 32 bytes.");
  const keyFingerprint = backupKeyFingerprint(key);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([BACKUP_HEADER, keyFingerprint, iv, tag, ciphertext]);
}

function decryptBackup(payload, key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) fail("Recovery backup key must be exactly 32 bytes.");
  if (!Buffer.isBuffer(payload) || !payload.subarray(0, BACKUP_HEADER.length).equals(BACKUP_HEADER)) {
    fail("Recovery backup header is invalid.");
  }
  if (payload.length < BACKUP_HEADER.length + 60) {
    fail("Recovery backup payload is truncated.");
  }
  const offset = BACKUP_HEADER.length;
  const storedFingerprint = payload.subarray(offset, offset + 32);
  const expectedFingerprint = backupKeyFingerprint(key);
  if (!timingSafeEqual(storedFingerprint, expectedFingerprint)) {
    fail("Recovery backup key does not match the applied batch.");
  }
  const iv = payload.subarray(offset + 32, offset + 44);
  const tag = payload.subarray(offset + 44, offset + 60);
  if (iv.length !== 12 || tag.length !== 16) fail("Recovery backup encryption fields are invalid.");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    return JSON.parse(Buffer.concat([decipher.update(payload.subarray(offset + 60)), decipher.final()]).toString("utf8"));
  } catch {
    fail("Recovery backup authentication failed.");
  }
}

function createVerifiedBackup(snapshot, reportPath, key) {
  const backupDirectory = resolve(dirname(reportPath), "backups");
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const encryptedPath = resolve(backupDirectory, `utilities-kingston-pre-recovery-${stamp}.json.enc`);
  const encrypted = encryptBackup(snapshot, key);
  writePrivateBytes(encryptedPath, encrypted);
  const restored = decryptBackup(readFileSync(encryptedPath), key);
  if (stableJson(restored) !== stableJson(snapshot)) fail("Recovery backup restore rehearsal failed.");
  return {
    encryptedPath,
    encryptedSha256: sha256(encrypted),
    backupKeyStorage: "operator-supplied external escrow",
    restoreRehearsal: "passed",
  };
}

function assertRecoverableBackup(batch, key) {
  const backupPath = assertPrivatePath(batch.backupArtifactPath, "Recovery backup");
  const payload = readFileSync(backupPath);
  if (sha256(payload) !== batch.beforeSnapshotSha256) fail("Recovery backup checksum does not match the applied batch.");
  const restored = decryptBackup(payload, key);
  if (!restored || typeof restored !== "object" || !restored.counts) fail("Recovery backup restore rehearsal is incomplete.");
  return backupPath;
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function archiveEvidenceFacts(plan) {
  const archivePath = assertPrivatePath(plan.sourceArchive.path, "Protected Stripe archive");
  const sourceBytes = readFileSync(archivePath);
  const sourceSha256 = sha256(sourceBytes);
  if (sourceSha256 !== plan.sourceArchive.sha256) fail("Protected Stripe archive checksum does not match the signed recovery plan.");
  const normalized = normalizeStripeRows(sourceBytes.toString("utf8"));
  const byKey = new Map(normalized.records.map((row) => [row.sourceEvidenceKey, row]));
  const matches = plan.groups.map((group) => {
    const row = byKey.get(group.sourceEvidenceKey);
    if (!row) fail("A plan evidence key is absent from the protected Stripe archive.");
    if (row.paymentStatus !== "succeeded") fail("A plan evidence record is not a successful historical payment.");
    if (!row.paymentCreatedAt) fail("A plan evidence record lacks a purchase timestamp.");
    return row;
  });
  return { archivePath, sourceSha256, rows: matches };
}

function sanitizeRow(row) {
  return {
    id: Number(row.id),
    sourceEvidenceKey: String(row.sourceEvidenceKey),
    normalizedEmail: normalizeEmail(row.normalizedEmail),
    paymentStatus: String(row.paymentStatus),
    paymentCreatedAt: row.paymentCreatedAt ? new Date(row.paymentCreatedAt) : null,
    recoverySubjectType: row.recoverySubjectType ?? null,
    recoveryOrganizationGroup: row.recoveryOrganizationGroup ?? null,
    recoverySeatCount: row.recoverySeatCount === null ? null : Number(row.recoverySeatCount),
    reviewStatus: String(row.reviewStatus),
    importedAt: row.importedAt ? new Date(row.importedAt) : null,
  };
}

async function selectEvidence(connection, keys, { forUpdate = false } = {}) {
  if (!Array.isArray(keys) || keys.length !== 2 || new Set(keys).size !== 2) {
    fail("Recovery requires two distinct evidence keys.");
  }
  const placeholders = keys.map(() => "?").join(",");
  const [rows] = await connection.execute(
    `SELECT id, sourceEvidenceKey, normalizedEmail, paymentStatus, paymentCreatedAt,
            recoverySubjectType, recoveryOrganizationGroup, recoverySeatCount,
            reviewStatus, importedAt
       FROM customer_recovery_evidence
      WHERE sourceEvidenceKey IN (${placeholders})
      ORDER BY sourceEvidenceKey${forUpdate ? " FOR UPDATE" : ""}`,
    keys,
  );
  return rows.map(sanitizeRow);
}

async function tableCounts(connection) {
  const output = {};
  for (const table of REQUIRED_TABLES) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    output[table] = Number(rows[0]?.count ?? 0);
  }
  return output;
}

function evidenceBindingDigest(evidenceRows) {
  if (!Array.isArray(evidenceRows) || evidenceRows.length !== 2) {
    fail("Recovery evidence digest requires exactly two rows.");
  }
  return sha256(stableJson(evidenceRows.map((row) => ({
    id: Number(row.id),
    sourceEvidenceKey: String(row.sourceEvidenceKey),
    paymentStatus: String(row.paymentStatus),
    paymentCreatedAt: row.paymentCreatedAt ? new Date(row.paymentCreatedAt).toISOString() : null,
    recoverySubjectType: row.recoverySubjectType ?? null,
    recoveryOrganizationGroup: row.recoveryOrganizationGroup ?? null,
    recoverySeatCount: row.recoverySeatCount === null ? null : Number(row.recoverySeatCount),
    reviewStatus: String(row.reviewStatus),
    importedAt: row.importedAt ? new Date(row.importedAt).toISOString() : null,
  })).sort((left, right) => left.sourceEvidenceKey.localeCompare(right.sourceEvidenceKey))));
}

function assertRecoveryStartingState(counts) {
  for (const table of ["customer_recovery_batches", "customer_recovery_import_items", "organizations", "organization_members"]) {
    if (Number(counts[table] ?? -1) !== 0) {
      fail(`Recovery requires an empty ${table} table before the first import.`);
    }
  }
}

async function recoveryBatch(connection, recoveryKey, { forUpdate = false } = {}) {
  const [rows] = await connection.execute(
    `SELECT id, recoveryKey, planDigest, archiveSha256, authorizationRef, scriptVersion,
            beforeSnapshotSha256, backupArtifactPath, status, outputDigest, appliedAt
       FROM customer_recovery_batches
      WHERE recoveryKey = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [recoveryKey],
  );
  return rows[0] ?? null;
}

async function verifyNoConflicts(connection, plan, evidenceRows) {
  if (!Array.isArray(evidenceRows) || evidenceRows.length !== 2) {
    fail("Recovery conflict checks require exactly two evidence rows.");
  }
  const managerEmails = plan.groups.map((group) => group.managerEmail);
  const placeholders = managerEmails.map(() => "?").join(",");
  const [managerOrgs] = await connection.execute(
    `SELECT id FROM organizations WHERE managerEmail IN (${placeholders}) FOR UPDATE`,
    managerEmails,
  );
  if (managerOrgs.length > 0) fail("An approved recovery manager already has an organization record.");

  const [existingItems] = await connection.execute(
    `SELECT id FROM customer_recovery_import_items WHERE evidenceId IN (${evidenceRows.map(() => "?").join(",")}) FOR UPDATE`,
    evidenceRows.map((row) => row.id),
  );
  if (existingItems.length > 0) fail("An approved recovery evidence record already has an organization import mapping.");
}

function buildRecoveryModel(plan, evidenceRows, archiveRows) {
  const archiveByKey = new Map(archiveRows.map((row) => [row.sourceEvidenceKey, row]));
  const evidenceByKey = new Map(evidenceRows.map((row) => [row.sourceEvidenceKey, row]));
  const modelRows = [];
  for (const group of plan.groups) {
    const evidence = evidenceByKey.get(group.sourceEvidenceKey);
    const archive = archiveByKey.get(group.sourceEvidenceKey);
    if (!evidence || !archive) fail("Recovery evidence binding is incomplete.");
    if (normalizeEmail(archive.normalizedEmail) !== evidence.normalizedEmail) {
      fail("Recovery archive identity does not match the staged evidence identity.");
    }
    if (evidence.paymentCreatedAt && new Date(evidence.paymentCreatedAt).toISOString() !== new Date(archive.paymentCreatedAt).toISOString()) {
      fail("Recovery archive timestamp conflicts with staged evidence.");
    }
    modelRows.push({ group, evidence: { ...evidence, paymentCreatedAt: archive.paymentCreatedAt }, archive });
  }
  assertRecoveryEvidenceRows(plan, modelRows.map((row) => row.evidence));
  return modelRows;
}

async function buildPreflight(connection, plan, archive, { forUpdate = false } = {}) {
  const keys = plan.groups.map((group) => group.sourceEvidenceKey);
  const evidenceRows = await selectEvidence(connection, keys, { forUpdate });
  const batch = await recoveryBatch(connection, plan.recoveryKey, { forUpdate });

  if (batch) {
    const samePlan = batch.planDigest === recoveryPlanDigest(plan)
      && batch.archiveSha256 === archive.sourceSha256
      && batch.authorizationRef === plan.authorizationRef
      && batch.scriptVersion === UTILITIES_KINGSTON_SCRIPT_VERSION;
    if (!samePlan) fail("An existing recovery batch does not match this approved plan.");
    if (batch.status !== "applied" || !batch.outputDigest || !batch.appliedAt || !batch.backupArtifactPath) {
      fail("An existing recovery batch is incomplete and requires manual reconciliation.");
    }
    if (evidenceRows.length !== 2 || evidenceRows.some((row) => !row.importedAt)) {
      fail("An applied recovery batch no longer has both imported evidence rows.");
    }
    const priorModelRows = buildRecoveryModel(
      plan,
      evidenceRows.map((row) => ({ ...row, importedAt: null, reviewStatus: "approved" })),
      archive.rows,
    );
    return { state: "already_applied", batch, evidenceRows, modelRows: priorModelRows, counts: await tableCounts(connection) };
  }

  const modelRows = buildRecoveryModel(plan, evidenceRows, archive.rows);
  await verifyNoConflicts(connection, plan, evidenceRows);
  const counts = await tableCounts(connection);
  assertRecoveryStartingState(counts);
  return { state: "ready", evidenceRows, modelRows, counts };
}

function safePreflightDocument(plan, archive, preflight) {
  assertApprovedUtilitiesKingstonPlan(plan);
  const summary = safeRecoverySummary(plan, preflight.modelRows.map((row) => row.evidence));
  return {
    format: "echelon-utilities-kingston-recovery-preflight-v1",
    generatedAtUtc: new Date().toISOString(),
    recoveryKey: plan.recoveryKey,
    scriptVersion: UTILITIES_KINGSTON_SCRIPT_VERSION,
    planDigest: recoveryPlanDigest(plan),
    evidenceBindingDigest: evidenceBindingDigest(preflight.evidenceRows),
    archive: { basename: basename(archive.archivePath), sha256: archive.sourceSha256 },
    state: preflight.state,
    summary,
    baselineCounts: preflight.counts,
    safety: {
      createsOrganizations: preflight.state === "ready" ? 2 : 0,
      createsManagerMemberships: preflight.state === "ready" ? 2 : 0,
      createsOperatorMemberships: 0,
      createsSubscriptions: 0,
      createsTeamFlexLicences: 0,
      createsPurchases: 0,
      createsUsers: 0,
      sendsEmail: false,
      callsStripe: false,
    },
  };
}

function preflightDigest(document) {
  const clone = { ...document };
  delete clone.generatedAtUtc;
  return sha256(stableJson(clone));
}

function assertApplyEnvironment(plan, preflightReport) {
  const expectedToken = confirmationTokenForPlan(plan);
  const approvalToken = process.env.UTILITIES_KINGSTON_RECOVERY_APPROVED;
  if (approvalToken !== expectedToken) {
    fail("Recovery apply requires the exact plan-bound confirmation token.");
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX ?? "")) {
    fail("Recovery apply requires a 32-byte external backup key in UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX.");
  }
  if (preflightReport.document?.recoveryKey !== plan.recoveryKey || preflightReport.document?.planDigest !== recoveryPlanDigest(plan)) {
    fail("The supplied preflight report does not match the approved recovery plan.");
  }
  if (preflightReport.preflightDigest !== preflightDigest(preflightReport.document)) {
    fail("The supplied preflight report digest is invalid.");
  }
  return {
    approvalToken,
    backupKey: Buffer.from(process.env.UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX, "hex"),
  };
}

async function acquireLock(connection) {
  const [rows] = await connection.execute("SELECT GET_LOCK(?, 20) AS acquired", [LOCK_NAME]);
  if (Number(rows[0]?.acquired ?? 0) !== 1) fail("Recovery lock is unavailable. Retry only after the active operation is resolved.");
}

async function releaseLock(connection) {
  try { await connection.execute("SELECT RELEASE_LOCK(?)", [LOCK_NAME]); } catch { /* Connection close also releases lock. */ }
}

async function raiseRecoveryIsolation(connection) {
  try {
    await connection.query("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    return { engine: "mysql", resetRequired: true, useGlobalCountAssertions: true };
  } catch (error) {
    const isTidbIsolationRejection = Number(error?.errno) === 8048
      || String(error?.message ?? error).includes("tidb_skip_isolation_level_check");
    if (!isTidbIsolationRejection) throw error;
  }
  // TiDB does not provide SQL-standard SERIALIZABLE. Run an explicit pessimistic
  // transaction so the named lock, FOR UPDATE rows, unique constraints, and guarded
  // state transitions remain the concurrency controls. Do not use global table-count
  // assertions in this mode because unrelated live traffic can legitimately change them.
  await connection.query("SET SESSION tidb_txn_mode = 'pessimistic'");
  const [rows] = await connection.query("SELECT @@tidb_txn_mode AS txnMode");
  if (String(rows?.[0]?.txnMode ?? "").toLowerCase() !== "pessimistic") {
    fail("TiDB must use pessimistic transaction mode before running controlled recovery.");
  }
  return { engine: "tidb", resetRequired: false, useGlobalCountAssertions: false };
}

async function beginRecoveryTransaction(connection, isolation) {
  if (isolation.engine === "tidb") {
    await connection.query("BEGIN PESSIMISTIC");
    return;
  }
  await connection.beginTransaction();
}

async function createPreRecoverySnapshot(connection, plan, evidenceRows) {
  if (!Array.isArray(evidenceRows) || evidenceRows.length !== 2) {
    fail("Recovery backup requires exactly two evidence rows.");
  }
  const emails = plan.groups.map((group) => group.managerEmail);
  const keys = evidenceRows.map((row) => row.sourceEvidenceKey);
  const [evidence] = await connection.execute(
    `SELECT * FROM customer_recovery_evidence WHERE sourceEvidenceKey IN (${keys.map(() => "?").join(",")}) ORDER BY sourceEvidenceKey`,
    keys,
  );
  const [organizations] = await connection.execute(
    `SELECT * FROM organizations WHERE managerEmail IN (${emails.map(() => "?").join(",")}) ORDER BY id`,
    emails,
  );
  const [members] = await connection.execute(
    `SELECT * FROM organization_members WHERE email IN (${emails.map(() => "?").join(",")}) ORDER BY id`,
    emails,
  );
  const [subscriptions] = await connection.execute(
    `SELECT * FROM subscriptions WHERE email IN (${emails.map(() => "?").join(",")}) ORDER BY id`,
    emails,
  );
  return { capturedAtUtc: new Date().toISOString(), evidence, organizations, members, subscriptions, counts: await tableCounts(connection) };
}

async function insertRecoveredOrganization(connection, plan, modelRow, batchId) {
  const { group, evidence, archive } = modelRow;
  const { startsAt, endsAt } = deriveOneYearTerm(archive.paymentCreatedAt);
  const reference = recoveryExternalReference(plan.recoveryKey, group.group);

  const [orgResult] = await connection.execute(
    `INSERT INTO organizations
      (name, province, tier, stream, seatsTotal, managerEmail, stripeSubscriptionId, stripeCustomerId, termStart, termEnd, billingType, status)
     VALUES (?, 'ontario', 'all-access', ?, ?, ?, NULL, NULL, ?, ?, 'invoice', 'active')`,
    [group.organizationName, group.group, group.seatCount, group.managerEmail, startsAt, endsAt],
  );
  const organizationId = Number(orgResult.insertId);
  if (!Number.isInteger(organizationId) || organizationId < 1) fail("Recovery organization insert failed.");
  const [organizationRows] = await connection.execute(
    `SELECT billingType, status, stripeSubscriptionId, stripeCustomerId, seatsTotal, termStart, termEnd
       FROM organizations WHERE id = ? FOR UPDATE`,
    [organizationId],
  );
  const organization = organizationRows[0];
  if (!organization || organization.billingType !== "invoice" || organization.status !== "active" || organization.stripeSubscriptionId !== null || organization.stripeCustomerId !== null || Number(organization.seatsTotal) !== group.seatCount || new Date(organization.termStart).getTime() !== startsAt.getTime() || new Date(organization.termEnd).getTime() !== endsAt.getTime()) {
    fail("Recovered organization did not persist its required non-Stripe annual contract.");
  }

  const [memberResult] = await connection.execute(
    `INSERT INTO organization_members (orgId, email, role, status, courseKey, courseKeys)
     VALUES (?, ?, 'manager', 'assigned', NULL, NULL)`,
    [organizationId, group.managerEmail],
  );
  const managerMemberId = Number(memberResult.insertId);
  if (!Number.isInteger(managerMemberId) || managerMemberId < 1) fail("Recovery manager membership insert failed.");

  const [mappingResult] = await connection.execute(
    `INSERT INTO customer_recovery_import_items
      (batchId, evidenceId, organizationId, managerMemberId, recoveryGroup, seatCount, termStart, termEnd, externalReference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [batchId, evidence.id, organizationId, managerMemberId, group.group, group.seatCount, startsAt, endsAt, reference],
  );
  if (Number(mappingResult.affectedRows) !== 1) fail("Recovery evidence mapping insert failed.");

  const [evidenceResult] = await connection.execute(
    `UPDATE customer_recovery_evidence
        SET reviewStatus = 'imported', recoveryOrganizationGroup = ?, importedAt = UTC_TIMESTAMP(), reviewedAt = COALESCE(reviewedAt, UTC_TIMESTAMP()),
            reviewNote = CONCAT(COALESCE(reviewNote, ''), CASE WHEN reviewNote IS NULL OR reviewNote = '' THEN '' ELSE '\n' END, ?)
      WHERE id = ? AND importedAt IS NULL AND reviewStatus = 'approved' AND paymentStatus = 'succeeded' AND recoverySubjectType = 'organization_manager'`,
    [group.group, `Imported through ${reference}; creates a separate recovery organization dashboard only.`, evidence.id],
  );
  if (Number(evidenceResult.affectedRows) !== 1) fail("Recovery evidence state transition failed.");

  return { group: group.group, organizationId, managerMemberId, evidenceId: evidence.id, seatCount: group.seatCount, termStart: startsAt, termEnd: endsAt };
}

function expectedDelta(before, after) {
  const delta = {};
  for (const table of REQUIRED_TABLES) delta[table] = Number(after[table] ?? 0) - Number(before[table] ?? 0);
  return delta;
}

function assertExpectedDelta(delta) {
  if (Object.keys(delta).length !== REQUIRED_TABLES.length || Object.keys(EXPECTED_DELTAS).length !== REQUIRED_TABLES.length) {
    fail("Recovery side-effect ledger is incomplete.");
  }
  for (const table of REQUIRED_TABLES) {
    if (!Object.hasOwn(EXPECTED_DELTAS, table) || !Object.hasOwn(delta, table)) {
      fail("Recovery side-effect expectation is missing.");
    }
    const expectedValue = EXPECTED_DELTAS[table];
    if (delta[table] !== expectedValue) fail(`Unexpected recovery delta for ${table}.`);
  }
}

async function postCommitSummary(connection, plan, archiveRows, backupKey, { verifyBackup = false } = {}) {
  const batch = await recoveryBatch(connection, plan.recoveryKey);
  if (!batch || batch.status !== "applied" || !batch.outputDigest || !batch.appliedAt || !batch.backupArtifactPath) {
    fail("Recovery batch is absent or incomplete after commit.");
  }
  if (verifyBackup) assertRecoverableBackup(batch, backupKey);
  const [items] = await connection.execute(
    `SELECT recoveryGroup, seatCount, termStart, termEnd FROM customer_recovery_import_items WHERE batchId = ? ORDER BY recoveryGroup`,
    [batch.id],
  );
  if (items.length !== 2) fail("Recovery batch has an unexpected item count.");
  const itemByGroup = new Map(items.map((item) => [String(item.recoveryGroup), item]));
  const archiveByKey = new Map(archiveRows.map((row) => [row.sourceEvidenceKey, row]));
  for (const group of plan.groups) {
    const item = itemByGroup.get(group.group);
    const archive = archiveByKey.get(group.sourceEvidenceKey);
    const expectedTerm = deriveOneYearTerm(archive?.paymentCreatedAt);
    if (!item || Number(item.seatCount) !== group.seatCount || new Date(item.termStart).getTime() !== expectedTerm.startsAt.getTime() || new Date(item.termEnd).getTime() !== expectedTerm.endsAt.getTime()) {
      fail("Recovery batch output does not match the approved group, seats, or annual term.");
    }
  }
  return {
    batchId: Number(batch.id),
    groups: items.map((item) => ({
      group: String(item.recoveryGroup),
      seatCount: Number(item.seatCount),
      termStart: new Date(item.termStart).toISOString(),
      termEnd: new Date(item.termEnd).toISOString(),
      dashboardSeparated: true,
    })),
  };
}

function approvalBackupKey(plan) {
  const approvalToken = process.env.UTILITIES_KINGSTON_RECOVERY_APPROVED;
  if (approvalToken !== confirmationTokenForPlan(plan)) {
    fail("Evidence approval requires the exact plan-bound confirmation token.");
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX ?? "")) {
    fail("Evidence approval requires a 32-byte external backup key in UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX.");
  }
  return Buffer.from(process.env.UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX, "hex");
}

function assertStagedEvidenceApproval(plan, evidenceRows, archiveRows) {
  const evidenceByKey = new Map(evidenceRows.map((row) => [row.sourceEvidenceKey, row]));
  const prepared = plan.groups.map((group) => {
    const evidence = evidenceByKey.get(group.sourceEvidenceKey);
    if (!evidence || evidence.reviewStatus !== "staged" || evidence.importedAt) {
      fail("Recovery evidence approval requires exactly two unimported staged rows.");
    }
    if (evidence.recoveryOrganizationGroup !== "unspecified" && evidence.recoveryOrganizationGroup !== group.group) {
      fail("Staged recovery evidence conflicts with the approved group mapping.");
    }
    return { ...evidence, reviewStatus: "approved", recoveryOrganizationGroup: group.group };
  });
  return buildRecoveryModel(plan, prepared, archiveRows);
}

function assertApprovalCounts(before, after) {
  for (const table of REQUIRED_TABLES) {
    if (Number(before[table] ?? -1) !== Number(after[table] ?? -1)) {
      fail(`Evidence approval changed the ${table} row count.`);
    }
  }
}

async function approveEvidenceForRecovery(connection, plan, archive, reportPath) {
  const backupKey = approvalBackupKey(plan);
  await acquireLock(connection);
  let committed = false;
  let sessionIsolationRaised = false;
  let backupArtifactPath = null;
  try {
    const isolation = await raiseRecoveryIsolation(connection);
    sessionIsolationRaised = isolation.resetRequired;
    await beginRecoveryTransaction(connection, isolation);
    const evidenceRows = await selectEvidence(connection, plan.groups.map((group) => group.sourceEvidenceKey), { forUpdate: true });
    assertRecoveryStartingState(await tableCounts(connection));
    assertStagedEvidenceApproval(plan, evidenceRows, archive.rows);
    const beforeCounts = isolation.useGlobalCountAssertions ? await tableCounts(connection) : null;
    const backup = createVerifiedBackup(await createPreRecoverySnapshot(connection, plan, evidenceRows), reportPath, backupKey);
    backupArtifactPath = backup.encryptedPath;
    for (const group of plan.groups) {
      const [update] = await connection.execute(
        `UPDATE customer_recovery_evidence
            SET reviewStatus = 'approved', recoveryOrganizationGroup = ?, reviewedAt = UTC_TIMESTAMP(),
                reviewNote = CONCAT(COALESCE(reviewNote, ''), CASE WHEN reviewNote IS NULL OR reviewNote = '' THEN '' ELSE '\n' END, ?)
          WHERE sourceEvidenceKey = ?
            AND reviewStatus = 'staged'
            AND importedAt IS NULL
            AND paymentStatus = 'succeeded'
            AND recoverySubjectType = 'organization_manager'
            AND recoveryOrganizationGroup IN ('unspecified', ?)`,
        [group.group, "Owner-approved Utilities Kingston 14/10 organization recovery evidence.", group.sourceEvidenceKey, group.group],
      );
      if (Number(update.affectedRows) !== 1) fail("Recovery evidence approval did not transition a required row.");
    }
    if (beforeCounts) assertApprovalCounts(beforeCounts, await tableCounts(connection));
    await connection.commit();
    committed = true;
    return backup;
  } catch (error) {
    if (!committed) {
      let rollbackFailure = null;
      try { await connection.rollback(); } catch (rollbackError) { rollbackFailure = rollbackError; }
      let approvalMayHaveCommitted = rollbackFailure !== null;
      if (!approvalMayHaveCommitted) {
        try {
          const rows = await selectEvidence(connection, plan.groups.map((group) => group.sourceEvidenceKey));
          approvalMayHaveCommitted = rows.length === 2 && plan.groups.every((group) => {
            const row = rows.find((candidate) => candidate.sourceEvidenceKey === group.sourceEvidenceKey);
            return row?.reviewStatus === "approved" && row.recoveryOrganizationGroup === group.group;
          });
        } catch {
          approvalMayHaveCommitted = true;
        }
      }
      if (backupArtifactPath && !approvalMayHaveCommitted) {
        try { unlinkSync(backupArtifactPath); } catch { /* Preserve the primary failure if encrypted cleanup is unavailable. */ }
      }
      if (rollbackFailure) throw new AggregateError([error, rollbackFailure], "Evidence approval and rollback both failed.");
    }
    throw error;
  } finally {
    if (sessionIsolationRaised) {
      try { await connection.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ"); } catch { /* Connection closes immediately after approval. */ }
    }
    await releaseLock(connection);
  }
}

async function run(args) {
  const planPath = assertPrivatePath(args.plan, "Protected recovery plan");
  const reportPath = resolve(args.report);
  assertOutsideRepository(reportPath, "Recovery artifacts");
  const plan = assertApprovedUtilitiesKingstonPlan(readJson(planPath, "Protected recovery plan"));
  const archive = archiveEvidenceFacts(plan);
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is required for controlled recovery.");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    if (args.mode === "approve-evidence") {
      const backup = await approveEvidenceForRecovery(connection, plan, archive, reportPath);
      const report = { mode: "evidence_approved", recoveryKey: plan.recoveryKey, planDigest: recoveryPlanDigest(plan), approvedRows: 2, backup, noEmail: true, noStripe: true };
      writePrivate(reportPath, report);
      console.log(JSON.stringify({ mode: "evidence_approved", report: reportPath, approvedRows: 2, noEmail: true, noStripe: true }));
      return;
    }
    if (args.mode === "preflight") {
      const preflight = await buildPreflight(connection, plan, archive);
      const document = safePreflightDocument(plan, archive, preflight);
      const result = { document, preflightDigest: preflightDigest(document) };
      writePrivate(reportPath, result);
      console.log(JSON.stringify({ mode: "preflight", state: preflight.state, report: reportPath, digest: result.preflightDigest, groups: document.summary.groups.map((group) => ({ group: group.group, seats: group.seatCount, termEnd: group.termEnd })) }));
      return;
    }

    const preflightReport = readJson(assertPrivatePath(args.preflight, "Protected recovery preflight"), "Protected recovery preflight");
    const { backupKey, approvalToken } = assertApplyEnvironment(plan, preflightReport);
    const currentPreflight = await buildPreflight(connection, plan, archive);
    const currentDocument = safePreflightDocument(plan, archive, currentPreflight);
    const currentDigest = preflightDigest(currentDocument);
    if (currentPreflight.state === "already_applied") {
      const summary = await postCommitSummary(connection, plan, archive.rows, backupKey);
      const report = { mode: "already_applied", recoveryKey: plan.recoveryKey, scriptVersion: UTILITIES_KINGSTON_SCRIPT_VERSION, summary };
      writePrivate(reportPath, report);
      console.log(JSON.stringify({ mode: "already_applied", report: reportPath, groups: summary.groups.map((group) => ({ group: group.group, seats: group.seatCount })) }));
      return;
    }
    if (preflightReport.preflightDigest !== currentDigest) fail("Recovery database state changed after preflight. Run a fresh preflight before apply.");

    await acquireLock(connection);
    let committed = false;
    let sessionIsolationRaised = false;
    let backupArtifactPath = null;
    try {
      const isolation = await raiseRecoveryIsolation(connection);
      sessionIsolationRaised = isolation.resetRequired;
      await beginRecoveryTransaction(connection, isolation);
      const lockedPreflight = await buildPreflight(connection, plan, archive, { forUpdate: true });
      if (lockedPreflight.state !== "ready") fail("Recovery changed state while waiting for the import lock.");
      const lockedDocument = safePreflightDocument(plan, archive, lockedPreflight);
      if (preflightDigest(lockedDocument) !== currentDigest) fail("Recovery preconditions changed while waiting for the import lock.");
      const beforeSnapshot = await createPreRecoverySnapshot(connection, plan, lockedPreflight.evidenceRows);
      const backup = createVerifiedBackup(beforeSnapshot, reportPath, backupKey);
      backupArtifactPath = backup.encryptedPath;

      const [batchResult] = await connection.execute(
        `INSERT INTO customer_recovery_batches
          (recoveryKey, planDigest, archiveSha256, authorizationRef, confirmationTokenSha256, scriptVersion, beforeSnapshotSha256, backupArtifactPath, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'applying')`,
        [plan.recoveryKey, recoveryPlanDigest(plan), archive.sourceSha256, plan.authorizationRef, hashToken(approvalToken), UTILITIES_KINGSTON_SCRIPT_VERSION, backup.encryptedSha256, backup.encryptedPath],
      );
      const batchId = Number(batchResult.insertId);
      if (!Number.isInteger(batchId) || batchId < 1) fail("Recovery batch insert failed.");

      const created = [];
      for (const modelRow of lockedPreflight.modelRows.sort((a, b) => a.group.group.localeCompare(b.group.group))) {
        created.push(await insertRecoveredOrganization(connection, plan, modelRow, batchId));
      }

      const afterCounts = isolation.useGlobalCountAssertions ? await tableCounts(connection) : null;
      const delta = afterCounts ? expectedDelta(lockedPreflight.counts, afterCounts) : EXPECTED_DELTAS;
      if (afterCounts) assertExpectedDelta(delta);
      const outputDigest = sha256(stableJson({ created: created.map((item) => ({ group: item.group, organizationId: item.organizationId, managerMemberId: item.managerMemberId, evidenceId: item.evidenceId, seatCount: item.seatCount, termStart: item.termStart.toISOString(), termEnd: item.termEnd.toISOString() })), delta }));
      const [batchUpdate] = await connection.execute(
        `UPDATE customer_recovery_batches SET status = 'applied', outputDigest = ?, appliedAt = UTC_TIMESTAMP() WHERE id = ? AND status = 'applying' AND appliedAt IS NULL`,
        [outputDigest, batchId],
      );
      if (Number(batchUpdate.affectedRows) !== 1) fail("Recovery batch finalization failed.");
      await connection.commit();
      committed = true;

      const summary = await postCommitSummary(connection, plan, archive.rows, backupKey, { verifyBackup: true });
      const report = {
        mode: "applied",
        recoveryKey: plan.recoveryKey,
        scriptVersion: UTILITIES_KINGSTON_SCRIPT_VERSION,
        preflightDigest: currentDigest,
        backup,
        summary,
        safety: {
          organizationsCreated: 2,
          managerMembershipsCreated: 2,
          operatorMembershipsCreated: 0,
          subscriptionsCreated: 0,
          licencesCreated: 0,
          purchasesCreated: 0,
          usersCreated: 0,
          emailSent: false,
          stripeCalled: false,
        },
      };
      writePrivate(reportPath, report);
      console.log(JSON.stringify({ mode: "applied", report: reportPath, groups: summary.groups.map((group) => ({ group: group.group, seats: group.seatCount, termEnd: group.termEnd })), noEmail: true, noStripe: true }));
    } catch (error) {
      if (!committed) {
        let rollbackFailure = null;
        try { await connection.rollback(); }
        catch (rollbackError) { rollbackFailure = rollbackError; }
        let recoveryMayHaveCommitted = rollbackFailure !== null;
        if (!recoveryMayHaveCommitted) {
          try {
            recoveryMayHaveCommitted = (await recoveryBatch(connection, plan.recoveryKey))?.status === "applied";
          } catch {
            recoveryMayHaveCommitted = true;
          }
        }
        if (backupArtifactPath && !recoveryMayHaveCommitted) {
          try { unlinkSync(backupArtifactPath); } catch { /* Preserve failure context if encrypted cleanup is unavailable. */ }
        }
        if (rollbackFailure) throw new AggregateError([error, rollbackFailure], "Recovery and rollback both failed.");
      }
      throw error;
    } finally {
      if (sessionIsolationRaised) {
        try { await connection.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ"); } catch { /* Connection closes immediately after the recovery run. */ }
      }
      await releaseLock(connection);
    }
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export {
  archiveEvidenceFacts,
  assertExpectedDelta,
  assertRecoveryStartingState,
  buildRecoveryModel,
  decryptBackup,
  evidenceBindingDigest,
  encryptBackup,
  expectedDelta,
  parseArgs,
  preflightDigest,
  safePreflightDocument,
};
