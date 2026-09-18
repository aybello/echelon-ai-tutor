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
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import mysql from "mysql2/promise";
import { normalizeStripeRows } from "./normalizeStripeRecoveryExport.mjs";
import {
  UTILITIES_KINGSTON_RECOVERY_KEY,
  UTILITIES_KINGSTON_SCRIPT_VERSION,
  assertRecoveryEvidenceRows,
  confirmationTokenForPlan,
  recoveryExternalReference,
  recoveryPlanDigest,
  safeRecoverySummary,
  sha256,
  stableJson,
  validateUtilitiesKingstonPlan,
} from "./utilitiesKingstonRecovery.mjs";

const LOCK_NAME = "echelon:utilities-kingston-recovery:v1";
const BACKUP_HEADER = Buffer.from("ECLUK1");
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

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (!new Set(["preflight", "apply"]).has(mode)) fail("Usage requires preflight or apply mode.");
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

function writePrivate(pathname, value) {
  const absolute = resolve(pathname);
  const repoRoot = resolve(process.cwd());
  if (absolute.startsWith(`${repoRoot}/`)) fail("Recovery artifacts must remain outside the repository.");
  mkdirSync(dirname(absolute), { recursive: true, mode: 0o700 });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function assertPrivatePath(pathname, label) {
  const absolute = resolve(pathname);
  if (!existsSync(absolute)) fail(`${label} is unavailable.`);
  if (absolute.startsWith(`${resolve(process.cwd())}/`)) fail(`${label} must remain outside the repository.`);
  return absolute;
}

function hashToken(value) {
  return sha256(`echelon-utilities-kingston-recovery-token:v1:${value}`);
}

function encryptBackup(value, key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) fail("Recovery backup key must be exactly 32 bytes.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([BACKUP_HEADER, iv, tag, ciphertext]);
}

function decryptBackup(payload, key) {
  if (!Buffer.isBuffer(payload) || !payload.subarray(0, BACKUP_HEADER.length).equals(BACKUP_HEADER)) {
    fail("Recovery backup header is invalid.");
  }
  const offset = BACKUP_HEADER.length;
  const iv = payload.subarray(offset, offset + 12);
  const tag = payload.subarray(offset + 12, offset + 28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(payload.subarray(offset + 28)), decipher.final()]).toString("utf8"));
}

function createVerifiedBackup(snapshot, reportPath, key) {
  const backupDirectory = resolve(dirname(reportPath), "backups");
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const encryptedPath = resolve(backupDirectory, `utilities-kingston-pre-recovery-${stamp}.json.enc`);
  const encrypted = encryptBackup(snapshot, key);
  writeFileSync(encryptedPath, encrypted, { mode: 0o600 });
  const restored = decryptBackup(readFileSync(encryptedPath), key);
  if (stableJson(restored) !== stableJson(snapshot)) fail("Recovery backup restore rehearsal failed.");
  return {
    encryptedPath,
    encryptedSha256: sha256(encrypted),
    backupKeyStorage: "operator-supplied external escrow",
    restoreRehearsal: "passed",
  };
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

async function recoveryBatch(connection, recoveryKey, { forUpdate = false } = {}) {
  const [rows] = await connection.execute(
    `SELECT id, recoveryKey, planDigest, archiveSha256, authorizationRef, scriptVersion,
            beforeSnapshotSha256, outputDigest, appliedAt
       FROM customer_recovery_batches
      WHERE recoveryKey = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [recoveryKey],
  );
  return rows[0] ?? null;
}

async function verifyNoConflicts(connection, evidenceRows) {
  const managerEmails = evidenceRows.map((row) => row.normalizedEmail);
  const placeholders = managerEmails.map(() => "?").join(",");
  const [managerOrgs] = await connection.execute(
    `SELECT id FROM organizations WHERE managerEmail IN (${placeholders})`,
    managerEmails,
  );
  if (managerOrgs.length > 0) fail("An approved recovery manager already has an organization record.");

  const [existingItems] = await connection.execute(
    `SELECT id FROM customer_recovery_import_items WHERE evidenceId IN (${evidenceRows.map(() => "?").join(",")})`,
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
    evidence.paymentCreatedAt = archive.paymentCreatedAt;
    modelRows.push({ group, evidence, archive });
  }
  assertRecoveryEvidenceRows(plan, modelRows.map((row) => row.evidence));
  return modelRows;
}

async function buildPreflight(connection, plan, archive, { forUpdate = false } = {}) {
  const keys = plan.groups.map((group) => group.sourceEvidenceKey);
  const evidenceRows = await selectEvidence(connection, keys, { forUpdate });
  const modelRows = buildRecoveryModel(plan, evidenceRows, archive.rows);
  const batch = await recoveryBatch(connection, plan.recoveryKey, { forUpdate });

  if (batch) {
    const samePlan = batch.planDigest === recoveryPlanDigest(plan)
      && batch.archiveSha256 === archive.sourceSha256
      && batch.authorizationRef === plan.authorizationRef
      && batch.scriptVersion === UTILITIES_KINGSTON_SCRIPT_VERSION;
    if (!samePlan) fail("An existing recovery batch does not match this approved plan.");
    return { state: "already_applied", batch, evidenceRows, modelRows, counts: await tableCounts(connection) };
  }

  await verifyNoConflicts(connection, evidenceRows);
  return { state: "ready", evidenceRows, modelRows, counts: await tableCounts(connection) };
}

function safePreflightDocument(plan, archive, preflight) {
  const summary = safeRecoverySummary(plan, preflight.modelRows.map((row) => row.evidence));
  return {
    format: "echelon-utilities-kingston-recovery-preflight-v1",
    generatedAtUtc: new Date().toISOString(),
    recoveryKey: plan.recoveryKey,
    scriptVersion: UTILITIES_KINGSTON_SCRIPT_VERSION,
    planDigest: recoveryPlanDigest(plan),
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
  if (process.env.UTILITIES_KINGSTON_RECOVERY_APPROVED !== expectedToken) {
    fail("Recovery apply requires the exact plan-bound confirmation token.");
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX ?? "")) {
    fail("Recovery apply requires a 32-byte external backup key in UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX.");
  }
  if (preflightReport.recoveryKey !== plan.recoveryKey || preflightReport.planDigest !== recoveryPlanDigest(plan)) {
    fail("The supplied preflight report does not match the approved recovery plan.");
  }
  if (preflightReport.preflightDigest !== preflightDigest(preflightReport.document)) {
    fail("The supplied preflight report digest is invalid.");
  }
  return Buffer.from(process.env.UTILITIES_KINGSTON_RECOVERY_BACKUP_KEY_HEX, "hex");
}

async function acquireLock(connection) {
  const [rows] = await connection.execute("SELECT GET_LOCK(?, 20) AS acquired", [LOCK_NAME]);
  if (Number(rows[0]?.acquired ?? 0) !== 1) fail("Recovery lock is unavailable. Retry only after the active operation is resolved.");
}

async function releaseLock(connection) {
  try { await connection.execute("SELECT RELEASE_LOCK(?)", [LOCK_NAME]); } catch { /* Connection close also releases lock. */ }
}

async function createPreRecoverySnapshot(connection, evidenceRows) {
  const emails = evidenceRows.map((row) => row.normalizedEmail);
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
  const startsAt = new Date(archive.paymentCreatedAt);
  const endsAt = new Date(startsAt);
  endsAt.setUTCFullYear(endsAt.getUTCFullYear() + 1);
  if (endsAt.getUTCMonth() !== startsAt.getUTCMonth()) endsAt.setUTCDate(0);
  const reference = recoveryExternalReference(plan.recoveryKey, group.group);

  const [orgResult] = await connection.execute(
    `INSERT INTO organizations
      (name, province, tier, stream, seatsTotal, managerEmail, stripeSubscriptionId, stripeCustomerId, termStart, termEnd, billingType, status)
     VALUES (?, 'ontario', 'all-access', ?, ?, ?, NULL, NULL, ?, ?, 'recovery', 'active')`,
    [group.organizationName, group.group, group.seatCount, evidence.normalizedEmail, startsAt, endsAt],
  );
  const organizationId = Number(orgResult.insertId);
  if (!Number.isInteger(organizationId) || organizationId < 1) fail("Recovery organization insert failed.");

  const [memberResult] = await connection.execute(
    `INSERT INTO organization_members (orgId, email, role, status, courseKey, courseKeys)
     VALUES (?, ?, 'manager', 'assigned', NULL, NULL)`,
    [organizationId, evidence.normalizedEmail],
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
        SET reviewStatus = 'imported', importedAt = UTC_TIMESTAMP(), reviewedAt = COALESCE(reviewedAt, UTC_TIMESTAMP()),
            reviewNote = CONCAT(COALESCE(reviewNote, ''), CASE WHEN reviewNote IS NULL OR reviewNote = '' THEN '' ELSE '\n' END, ?)
      WHERE id = ? AND importedAt IS NULL AND paymentStatus = 'succeeded' AND recoverySubjectType = 'organization_manager'`,
    [`Imported through ${reference}; creates a separate recovery organization dashboard only.`, evidence.id],
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
  const expected = {
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
  };
  for (const [table, expectedValue] of Object.entries(expected)) {
    if (delta[table] !== expectedValue) fail(`Unexpected recovery delta for ${table}.`);
  }
}

async function postCommitSummary(connection, plan) {
  const batch = await recoveryBatch(connection, plan.recoveryKey);
  if (!batch) fail("Recovery batch is absent after commit.");
  const [items] = await connection.execute(
    `SELECT recoveryGroup, seatCount, termStart, termEnd FROM customer_recovery_import_items WHERE batchId = ? ORDER BY recoveryGroup`,
    [batch.id],
  );
  if (items.length !== 2) fail("Recovery batch has an unexpected item count.");
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

async function run(args) {
  const planPath = assertPrivatePath(args.plan, "Protected recovery plan");
  const reportPath = resolve(args.report);
  const plan = validateUtilitiesKingstonPlan(readJson(planPath, "Protected recovery plan"));
  const archive = archiveEvidenceFacts(plan);
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is required for controlled recovery.");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    if (args.mode === "preflight") {
      const preflight = await buildPreflight(connection, plan, archive);
      const document = safePreflightDocument(plan, archive, preflight);
      const result = { document, preflightDigest: preflightDigest(document) };
      writePrivate(reportPath, result);
      console.log(JSON.stringify({ mode: "preflight", state: preflight.state, report: reportPath, digest: result.preflightDigest, groups: document.summary.groups.map((group) => ({ group: group.group, seats: group.seatCount, termEnd: group.termEnd })) }));
      return;
    }

    const preflightReport = readJson(assertPrivatePath(args.preflight, "Protected recovery preflight"), "Protected recovery preflight");
    const backupKey = assertApplyEnvironment(plan, preflightReport);
    const currentPreflight = await buildPreflight(connection, plan, archive);
    const currentDocument = safePreflightDocument(plan, archive, currentPreflight);
    const currentDigest = preflightDigest(currentDocument);
    if (preflightReport.preflightDigest !== currentDigest) fail("Recovery database state changed after preflight. Run a fresh preflight before apply.");
    if (currentPreflight.state === "already_applied") {
      const summary = await postCommitSummary(connection, plan);
      const report = { mode: "already_applied", recoveryKey: plan.recoveryKey, scriptVersion: UTILITIES_KINGSTON_SCRIPT_VERSION, summary };
      writePrivate(reportPath, report);
      console.log(JSON.stringify({ mode: "already_applied", report: reportPath, groups: summary.groups.map((group) => ({ group: group.group, seats: group.seatCount })) }));
      return;
    }

    const beforeSnapshot = await createPreRecoverySnapshot(connection, currentPreflight.evidenceRows);
    const backup = createVerifiedBackup(beforeSnapshot, reportPath, backupKey);
    await acquireLock(connection);
    let committed = false;
    try {
      await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      await connection.beginTransaction();
      const lockedPreflight = await buildPreflight(connection, plan, archive, { forUpdate: true });
      if (lockedPreflight.state !== "ready") fail("Recovery changed state while waiting for the import lock.");
      const lockedDocument = safePreflightDocument(plan, archive, lockedPreflight);
      if (preflightDigest(lockedDocument) !== currentDigest) fail("Recovery preconditions changed while waiting for the import lock.");

      const [batchResult] = await connection.execute(
        `INSERT INTO customer_recovery_batches
          (recoveryKey, planDigest, archiveSha256, authorizationRef, confirmationTokenSha256, scriptVersion, beforeSnapshotSha256)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [plan.recoveryKey, recoveryPlanDigest(plan), archive.sourceSha256, plan.authorizationRef, hashToken(process.env.UTILITIES_KINGSTON_RECOVERY_APPROVED), UTILITIES_KINGSTON_SCRIPT_VERSION, backup.encryptedSha256],
      );
      const batchId = Number(batchResult.insertId);
      if (!Number.isInteger(batchId) || batchId < 1) fail("Recovery batch insert failed.");

      const created = [];
      for (const modelRow of lockedPreflight.modelRows.sort((a, b) => a.group.group.localeCompare(b.group.group))) {
        created.push(await insertRecoveredOrganization(connection, plan, modelRow, batchId));
      }

      const afterCounts = await tableCounts(connection);
      const delta = expectedDelta(lockedPreflight.counts, afterCounts);
      assertExpectedDelta(delta);
      const outputDigest = sha256(stableJson({ created: created.map((item) => ({ group: item.group, organizationId: item.organizationId, managerMemberId: item.managerMemberId, evidenceId: item.evidenceId, seatCount: item.seatCount, termStart: item.termStart.toISOString(), termEnd: item.termEnd.toISOString() })), delta }));
      const [batchUpdate] = await connection.execute(
        `UPDATE customer_recovery_batches SET outputDigest = ?, appliedAt = UTC_TIMESTAMP() WHERE id = ? AND appliedAt IS NULL`,
        [outputDigest, batchId],
      );
      if (Number(batchUpdate.affectedRows) !== 1) fail("Recovery batch finalization failed.");
      await connection.commit();
      committed = true;

      const summary = await postCommitSummary(connection, plan);
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
        try { await connection.rollback(); }
        catch (rollbackError) { throw new AggregateError([error, rollbackError], "Recovery and rollback both failed."); }
      }
      throw error;
    } finally {
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
  buildRecoveryModel,
  expectedDelta,
  parseArgs,
  preflightDigest,
  safePreflightDocument,
};
