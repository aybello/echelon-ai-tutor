#!/usr/bin/env node
/**
 * Controlled public release for the exact non-OIT legacy question archive staged
 * on September 17, 2026. This promotes only archived question rows currently in
 * quarantine. It never reads or changes learner, payment, purchase, Team,
 * organization, entitlement, attempt, or email data.
 *
 * A source-backed blueprint was not preserved for these legacy rows. The script
 * therefore creates only factual bank metadata: exact stored question count and
 * the module labels already present in each bank. It deliberately leaves mock
 * module targets, formula links, calculation minimums, and recall targets null.
 *
 * Usage:
 *   node scripts/recovery/releaseLegacyQuestionBanks.mjs preflight \
 *     --archive /private/echelon-db-before-reset.json.gz \
 *     --report /private/legacy-bank-release-preflight.json
 *
 * Apply requires a fresh private backup key and the exact digest produced by the
 * preflight. The backup key remains in operator-controlled private storage and
 * is never written into reports or Git.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import mysql from "mysql2/promise";
import {
  EXPECTED_ARCHIVE_SHA256,
  EXPECTED_BANK_COUNTS as STAGED_BANK_COUNTS,
  TARGET_BANK_KEYS as STAGED_BANK_KEYS,
  buildStagingPackageFromArchiveBytes,
  digest,
} from "./stageLegacyQuestionArchive.mjs";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
export const RELEASE_KEY = `legacy-bank-public-release-${EXPECTED_ARCHIVE_SHA256.slice(0, 12)}`;
export const RELEASE_ACTOR = `owner-authorized-release:${RELEASE_KEY}`;
export const EXCLUDED_ALREADY_RELEASED_BANKS = Object.freeze(["wpi-class4-wastewater-coll"]);
export const TARGET_BANK_KEYS = Object.freeze(
  STAGED_BANK_KEYS.filter((bankKey) => !EXCLUDED_ALREADY_RELEASED_BANKS.includes(bankKey)).sort(),
);
export const EXPECTED_BANK_COUNTS = Object.freeze(
  Object.fromEntries(TARGET_BANK_KEYS.map((bankKey) => [bankKey, STAGED_BANK_COUNTS[bankKey]])),
);
export const EXPECTED_QUESTION_COUNT = Object.values(EXPECTED_BANK_COUNTS).reduce((total, count) => total + count, 0);

const QUESTION_COLUMNS = Object.freeze([
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation",
  "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl",
  "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
]);
const META_COLUMNS = Object.freeze([
  "bankKey", "modules", "moduleTargets", "formulaLinks", "totalQuestions", "contentVersion", "blueprintVersion",
  "minCalcPerMock", "recallTargetPct",
]);
const CUSTOMER_TABLES = Object.freeze([
  "users", "purchases", "subscriptions", "organizations", "organization_members", "team_flex_orders",
  "team_flex_order_items", "team_flex_licences", "team_flex_extensions", "question_attempts", "exam_results",
  "student_profiles", "trigger_logs", "ai_chat_sessions", "bookmarks", "waitlist", "trial_emails",
]);

function fail(message) {
  throw new Error(`Legacy bank public release blocked: ${message}`);
}
function assert(condition, message) {
  if (!condition) fail(message);
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function safeTableName(name) {
  assert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(name), "unsafe table name");
  return `\`${name}\``;
}
function assertPrivateArtifactPath(pathname, label) {
  const repositoryPrefix = `${REPOSITORY_ROOT}/`;
  assert(pathname !== REPOSITORY_ROOT && !pathname.startsWith(repositoryPrefix), `${label} must remain outside the repository`);
}
function iso(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}
function normaliseJson(value, label) {
  if (value === null || value === undefined || value === "") return null;
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value);
  } catch {
    fail(`${label} is not valid JSON`);
  }
}
function rowForHash(row) {
  return Object.fromEntries(QUESTION_COLUMNS.map((column) => [column, iso(row[column])]));
}
function orderedRowsForHash(rows) {
  return rows.map(rowForHash).sort((left, right) =>
    left.bankKey.localeCompare(right.bankKey) || Number(left.questionNum) - Number(right.questionNum),
  );
}
function metadataForHash(row) {
  return {
    bankKey: row.bankKey,
    modules: normaliseJson(row.modules, `${row.bankKey} modules`),
    moduleTargets: normaliseJson(row.moduleTargets, `${row.bankKey} module targets`),
    formulaLinks: normaliseJson(row.formulaLinks, `${row.bankKey} formula links`),
    totalQuestions: Number(row.totalQuestions),
    contentVersion: Number(row.contentVersion),
    blueprintVersion: Number(row.blueprintVersion),
    minCalcPerMock: row.minCalcPerMock === null || row.minCalcPerMock === undefined ? null : Number(row.minCalcPerMock),
    recallTargetPct: row.recallTargetPct === null || row.recallTargetPct === undefined ? null : Number(row.recallTargetPct),
  };
}
function orderedMetadataForHash(rows) {
  return rows.map(metadataForHash).sort((left, right) => left.bankKey.localeCompare(right.bankKey));
}
function countByBank(rows) {
  const counts = new Map();
  for (const row of rows) counts.set(row.bankKey, (counts.get(row.bankKey) ?? 0) + 1);
  return counts;
}
function matchingCounts(counts, expectedCounts) {
  if (counts.size !== Object.keys(expectedCounts).length) return false;
  return Object.entries(expectedCounts).every(([bankKey, count]) => counts.get(bankKey) === count);
}

/** Builds factual metadata without inventing a source-backed exam blueprint. */
export function buildReleaseMetadata(rows, bankKeys = TARGET_BANK_KEYS) {
  const rowsByBank = new Map(bankKeys.map((bankKey) => [bankKey, []]));
  for (const row of rows) {
    if (rowsByBank.has(row.bankKey)) rowsByBank.get(row.bankKey).push(row);
  }
  return bankKeys.map((bankKey) => {
    const bankRows = rowsByBank.get(bankKey) ?? [];
    const modules = [...new Set(bankRows.map((row) => row.module))].sort((left, right) => left.localeCompare(right));
    assert(bankRows.length > 0, `${bankKey} has no rows for release metadata`);
    assert(modules.length > 0 && modules.every((module) => typeof module === "string" && module.trim()), `${bankKey} has invalid module labels`);
    return {
      bankKey,
      modules: JSON.stringify(modules),
      moduleTargets: null,
      formulaLinks: null,
      totalQuestions: bankRows.length,
      contentVersion: 1,
      blueprintVersion: 1,
      minCalcPerMock: null,
      recallTargetPct: null,
    };
  });
}

/** Returns the exact protected archive package eligible for this release. */
export function buildReleasePackageFromArchiveBytes(archiveBytes) {
  const staged = buildStagingPackageFromArchiveBytes(archiveBytes);
  const rows = staged.rows.filter((row) => TARGET_BANK_KEYS.includes(row.bankKey));
  const banks = staged.banks.filter((bank) => TARGET_BANK_KEYS.includes(bank.bankKey));
  assert(staged.archiveSha256 === EXPECTED_ARCHIVE_SHA256, "archive hash does not match the verified pre-reset export");
  assert(rows.length === EXPECTED_QUESTION_COUNT, `archive release subset has ${rows.length} questions; expected ${EXPECTED_QUESTION_COUNT}`);
  assert(banks.length === TARGET_BANK_KEYS.length, `archive release subset has ${banks.length} banks; expected ${TARGET_BANK_KEYS.length}`);
  assert(matchingCounts(countByBank(rows), EXPECTED_BANK_COUNTS), "archive release subset does not match immutable per-bank counts");
  return {
    archiveSha256: staged.archiveSha256,
    sourceQuestionChecksum: digest(orderedRowsForHash(rows)),
    bankCount: banks.length,
    questionCount: rows.length,
    banks: banks.map(({ bankKey, count, questionChecksum }) => ({ bankKey, count, questionChecksum })),
    rows,
    metadata: buildReleaseMetadata(rows),
  };
}

/** Fixture helper for unit tests. It is never used by the production CLI. */
export function buildReleasePlan(currentRows, currentMetadata, packageInfo, expectations = {}) {
  const bankKeys = expectations.bankKeys ?? TARGET_BANK_KEYS;
  const expectedCounts = expectations.bankCounts ?? EXPECTED_BANK_COUNTS;
  const expectedQuestionCount = expectations.questionCount ?? EXPECTED_QUESTION_COUNT;
  const expectedMetadata = expectations.metadata ?? packageInfo.metadata;
  assert(packageInfo.questionCount === expectedQuestionCount, "release package total does not match the immutable release scope");
  assert(packageInfo.bankCount === bankKeys.length, "release package bank count does not match the immutable release scope");
  assert(matchingCounts(countByBank(packageInfo.rows), expectedCounts), "release package counts do not match immutable per-bank counts");
  assert(currentRows.length === expectedQuestionCount, `current quarantined rows are ${currentRows.length}; expected ${expectedQuestionCount}`);
  assert(matchingCounts(countByBank(currentRows), expectedCounts), "current quarantined rows do not match immutable per-bank counts");
  const expectedQuarantineChecksum = packageInfo.sourceQuestionChecksum;
  const currentChecksum = digest(orderedRowsForHash(currentRows));
  const expectedVisibleRows = packageInfo.rows.map((row) => ({ ...row, reviewStatus: "unreviewed", reviewedBy: null, reviewedAt: null }));
  const expectedVisibleChecksum = digest(orderedRowsForHash(expectedVisibleRows));
  const expectedMetadataChecksum = digest(orderedMetadataForHash(expectedMetadata));
  const metadataChecksum = digest(orderedMetadataForHash(currentMetadata));
  const allQuarantined = currentRows.every((row) => row.reviewStatus === "in_review" && row.reviewedBy === null && row.reviewedAt === null);
  const allVisible = currentRows.every((row) => row.reviewStatus === "unreviewed" && row.reviewedBy === null && row.reviewedAt === null);

  if (allVisible && currentChecksum === expectedVisibleChecksum && metadataChecksum === expectedMetadataChecksum) {
    return {
      status: "already_released",
      releaseKey: RELEASE_KEY,
      confirmationDigest: digest({ releaseKey: RELEASE_KEY, archiveSha256: packageInfo.archiveSha256, currentChecksum, metadataChecksum }),
      expectedMetadata,
    };
  }
  assert(currentMetadata.length === 0, "release metadata already exists but does not match this completed release");
  assert(allQuarantined, "all target questions must remain in untouched in_review quarantine before release");
  assert(currentChecksum === expectedQuarantineChecksum, "quarantined question checksum differs from the verified pre-reset archive");
  const confirmationDigest = digest({
    releaseKey: RELEASE_KEY,
    archiveSha256: packageInfo.archiveSha256,
    quarantineChecksum: currentChecksum,
    visibleChecksum: expectedVisibleChecksum,
    metadataChecksum: expectedMetadataChecksum,
    bankCounts: expectedCounts,
  });
  return {
    status: "ready",
    releaseKey: RELEASE_KEY,
    confirmationDigest,
    expectedMetadata,
    quarantineChecksum: currentChecksum,
    visibleChecksum: expectedVisibleChecksum,
    metadataChecksum: expectedMetadataChecksum,
  };
}

async function verifyRequiredTables(connection) {
  const names = [...new Set(["questions", "question_bank_meta", ...CUSTOMER_TABLES])];
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${names.map(() => "?").join(",")})`,
    names,
  );
  const present = new Set(rows.map((row) => row.TABLE_NAME));
  for (const name of names) assert(present.has(name), `required table ${name} is missing`);
  const [indexes] = await connection.execute("SHOW INDEX FROM `questions`");
  const columns = indexes
    .filter((index) => index.Key_name === "bank_question_idx")
    .sort((left, right) => Number(left.Seq_in_index) - Number(right.Seq_in_index))
    .map((index) => index.Column_name);
  assert(digest(columns) === digest(["bankKey", "questionNum"]), "questions table is missing the required bank_question_idx uniqueness constraint");
}
async function customerTableCounts(connection) {
  const result = {};
  for (const table of CUSTOMER_TABLES) {
    const [rows] = await connection.execute(`SELECT COUNT(*) AS count FROM ${safeTableName(table)}`);
    result[table] = Number(rows[0]?.count ?? 0);
  }
  return result;
}
async function readLockedState(connection) {
  const placeholders = TARGET_BANK_KEYS.map(() => "?").join(",");
  const [currentRows] = await connection.execute(
    `SELECT ${QUESTION_COLUMNS.map((column) => `\`${column}\``).join(",")} FROM \`questions\` WHERE \`bankKey\` IN (${placeholders}) ORDER BY \`bankKey\`, \`questionNum\` FOR UPDATE`,
    TARGET_BANK_KEYS,
  );
  const [currentMetadata] = await connection.execute(
    `SELECT ${META_COLUMNS.map((column) => `\`${column}\``).join(",")} FROM \`question_bank_meta\` WHERE \`bankKey\` IN (${placeholders}) ORDER BY \`bankKey\` FOR UPDATE`,
    TARGET_BANK_KEYS,
  );
  const [nonTargetRows] = await connection.execute(
    `SELECT ${QUESTION_COLUMNS.map((column) => `\`${column}\``).join(",")} FROM \`questions\` WHERE \`bankKey\` NOT IN (${placeholders}) ORDER BY \`bankKey\`, \`questionNum\` FOR UPDATE`,
    TARGET_BANK_KEYS,
  );
  const [nonTargetMetadata] = await connection.execute(
    `SELECT ${META_COLUMNS.map((column) => `\`${column}\``).join(",")} FROM \`question_bank_meta\` WHERE \`bankKey\` NOT IN (${placeholders}) ORDER BY \`bankKey\` FOR UPDATE`,
    TARGET_BANK_KEYS,
  );
  return { currentRows, currentMetadata, nonTargetRows, nonTargetMetadata };
}
function snapshotForBackup(state) {
  return {
    releaseKey: RELEASE_KEY,
    targetRows: orderedRowsForHash(state.currentRows),
    targetMetadata: orderedMetadataForHash(state.currentMetadata),
  };
}
function encryptBackup(snapshot, key) {
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be a 32-byte value");
  const plaintext = gzipSync(Buffer.from(JSON.stringify(snapshot)));
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([Buffer.from("ECL2"), iv, cipher.update(plaintext), cipher.final()]);
  return { encrypted: Buffer.concat([encrypted, cipher.getAuthTag()]), compressedPlaintextSha256: sha256(plaintext) };
}
function decryptBackup(encrypted, key) {
  assert(encrypted.subarray(0, 4).toString("utf8") === "ECL2", "invalid release backup header");
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be a 32-byte value");
  const iv = encrypted.subarray(4, 16);
  const tag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(16, encrypted.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(gunzipSync(Buffer.concat([decipher.update(ciphertext), decipher.final()])).toString("utf8"));
}
function writePrivate(pathname, data) {
  mkdirSync(dirname(pathname), { recursive: true, mode: 0o700 });
  writeFileSync(pathname, data, { mode: 0o600 });
}
function createVerifiedBackup(state, reportPath, key) {
  const snapshot = snapshotForBackup(state);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(dirname(reportPath), "backups", `pre-legacy-bank-public-release-${stamp}.json.gz.enc`);
  const { encrypted, compressedPlaintextSha256 } = encryptBackup(snapshot, key);
  writePrivate(backupPath, encrypted);
  const restored = decryptBackup(readFileSync(backupPath), key);
  assert(digest(restored) === digest(snapshot), "encrypted release backup restore rehearsal failed");
  return {
    encryptedPath: backupPath,
    encryptedSha256: sha256(encrypted),
    compressedPlaintextSha256,
    keyStorage: "operator-controlled private escrow",
    keyFingerprint: sha256(key).slice(0, 16),
    restoreRehearsal: "passed",
  };
}
async function applyPlan(connection, plan) {
  const placeholders = TARGET_BANK_KEYS.map(() => "?").join(",");
  const [updated] = await connection.execute(
    `UPDATE \`questions\` SET \`reviewStatus\`='unreviewed', \`reviewedBy\`=NULL, \`reviewedAt\`=NULL WHERE \`bankKey\` IN (${placeholders}) AND \`reviewStatus\`='in_review' AND \`reviewedBy\` IS NULL AND \`reviewedAt\` IS NULL`,
    TARGET_BANK_KEYS,
  );
  assert(Number(updated.affectedRows) === EXPECTED_QUESTION_COUNT, `question promotion affected ${updated.affectedRows}; expected ${EXPECTED_QUESTION_COUNT}`);
  for (const row of plan.expectedMetadata) {
    await connection.execute(
      "INSERT INTO `question_bank_meta` (`bankKey`,`modules`,`moduleTargets`,`formulaLinks`,`totalQuestions`,`contentVersion`,`blueprintVersion`,`minCalcPerMock`,`recallTargetPct`) VALUES (?,?,?,?,?,?,?,?,?)",
      META_COLUMNS.map((column) => row[column]),
    );
  }
}
async function verifyReleasedState(connection, packageInfo, plan, nonTargetQuestionChecksum, nonTargetMetadataChecksum, customerCountsBefore) {
  const state = await readLockedState(connection);
  const verified = buildReleasePlan(state.currentRows, state.currentMetadata, packageInfo);
  assert(verified.status === "already_released", "post-release rows or metadata do not match the exact public release package");
  assert(digest(orderedRowsForHash(state.nonTargetRows)) === nonTargetQuestionChecksum, "a non-target question changed during release");
  assert(digest(orderedMetadataForHash(state.nonTargetMetadata)) === nonTargetMetadataChecksum, "non-target bank metadata changed during release");
  const customerCountsAfter = await customerTableCounts(connection);
  assert(digest(customerCountsAfter) === digest(customerCountsBefore), "a protected customer table changed during content-only release");
  assert(verified.confirmationDigest === digest({ releaseKey: RELEASE_KEY, archiveSha256: packageInfo.archiveSha256, currentChecksum: plan.visibleChecksum, metadataChecksum: plan.metadataChecksum }), "post-release idempotency digest mismatch");
  return { state, customerCountsAfter };
}
function parseArgs(argv) {
  const [mode, ...rest] = argv;
  assert(mode === "preflight" || mode === "apply", "usage requires preflight or apply mode");
  const args = { mode, archive: null, report: null };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--archive") args.archive = rest[++index];
    else if (token === "--report") args.report = rest[++index];
    else fail(`unknown argument ${token}`);
  }
  assert(args.archive && args.report, "both --archive and --report are required");
  return args;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const archivePath = resolve(args.archive);
  const reportPath = resolve(args.report);
  assert(existsSync(archivePath), "private pre-reset archive is unavailable");
  assertPrivateArtifactPath(reportPath, "release report");
  assert(process.env.DATABASE_URL, "DATABASE_URL is required");
  const archiveBytes = readFileSync(archivePath);
  assert(sha256(archiveBytes) === EXPECTED_ARCHIVE_SHA256, "archive file does not match the protected pre-reset checksum");
  const packageInfo = buildReleasePackageFromArchiveBytes(archiveBytes);
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const report = {
    generatedAtUtc: new Date().toISOString(),
    mode: args.mode,
    releaseKey: RELEASE_KEY,
    sourceArchiveFile: basename(archivePath),
    package: {
      archiveSha256: packageInfo.archiveSha256,
      bankCount: packageInfo.bankCount,
      questionCount: packageInfo.questionCount,
      sourceQuestionChecksum: packageInfo.sourceQuestionChecksum,
      banks: packageInfo.banks,
      safety: {
        learnerDataRead: false,
        learnerDataChanged: false,
        customerDataChanged: false,
        paymentsChanged: false,
        entitlementsGranted: false,
        organizationsCreated: false,
        emailsSent: false,
        pricingChanged: false,
        teamsCommerceEnabled: false,
        sourceBackedBlueprintInvented: false,
      },
    },
  };
  try {
    await connection.beginTransaction();
    await verifyRequiredTables(connection);
    const customerCountsBefore = await customerTableCounts(connection);
    const state = await readLockedState(connection);
    const plan = buildReleasePlan(state.currentRows, state.currentMetadata, packageInfo);
    report.preflight = {
      status: plan.status,
      confirmationDigest: plan.confirmationDigest,
      quarantinedQuestionChecksum: plan.quarantineChecksum ?? null,
      visibleQuestionChecksum: plan.visibleChecksum ?? null,
      metadataChecksum: plan.metadataChecksum ?? null,
      bankMetadata: plan.expectedMetadata,
      protectedCustomerTableCounts: customerCountsBefore,
    };
    if (args.mode === "preflight" || plan.status === "already_released") {
      await connection.rollback();
      writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      console.log(JSON.stringify({ mode: args.mode, status: plan.status, report: reportPath, questionCount: packageInfo.questionCount, bankCount: packageInfo.bankCount, confirmationDigest: plan.confirmationDigest }));
      return;
    }
    assert(process.env.CONFIRM_LEGACY_BANK_PUBLIC_RELEASE === plan.confirmationDigest, "missing exact CONFIRM_LEGACY_BANK_PUBLIC_RELEASE confirmation digest");
    assert(/^[0-9a-fA-F]{64}$/.test(process.env.LEGACY_BANK_RELEASE_BACKUP_KEY_HEX ?? ""), "LEGACY_BANK_RELEASE_BACKUP_KEY_HEX must be a 32-byte hexadecimal key from private escrow");
    const backupKey = Buffer.from(process.env.LEGACY_BANK_RELEASE_BACKUP_KEY_HEX, "hex");
    report.backup = createVerifiedBackup(state, reportPath, backupKey);
    const nonTargetQuestionChecksum = digest(orderedRowsForHash(state.nonTargetRows));
    const nonTargetMetadataChecksum = digest(orderedMetadataForHash(state.nonTargetMetadata));
    await applyPlan(connection, plan);
    const verification = await verifyReleasedState(
      connection,
      packageInfo,
      plan,
      nonTargetQuestionChecksum,
      nonTargetMetadataChecksum,
      customerCountsBefore,
    );
    await connection.commit();
    report.transaction = {
      status: "committed",
      questionRowsPromoted: packageInfo.questionCount,
      bankMetadataRowsInserted: plan.expectedMetadata.length,
      protectedCustomerTableCountsUnchanged: digest(verification.customerCountsAfter) === digest(customerCountsBefore),
    };
    writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ mode: "apply", status: "released", report: reportPath, questionCount: packageInfo.questionCount, bankCount: packageInfo.bankCount, confirmationDigest: plan.confirmationDigest }));
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
