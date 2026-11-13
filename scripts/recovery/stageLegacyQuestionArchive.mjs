#!/usr/bin/env node
/**
 * Controlled staging importer for the verified, private pre-reset Echelon archive.
 *
 * This importer restores only non-OIT legacy QUESTION rows into the clean database
 * as `in_review`. Staged rows are excluded from every learner-facing question query
 * by questionGovernance. It deliberately never imports learner/customer records,
 * payments, purchases, subscriptions, organizations, seats, attempts, metadata, or
 * study notes. Commerce remains governed separately by commercialAvailability.
 *
 * Usage:
 *   node scripts/recovery/stageLegacyQuestionArchive.mjs preflight \
 *     --archive /private/echelon-db-before-reset.json.gz \
 *     --report /private/legacy-question-preflight.json
 *
 * Apply is one-time and requires the exact archive confirmation token:
 *   CONFIRM_LEGACY_QUESTION_STAGING=STAGE_VERIFIED_ARCHIVE_eeebf74d564065c8d931043fa76adcb1a410ff6da5043f302ab2af31c5d17646 \
 *   LEGACY_STAGE_BACKUP_KEY_HEX='<externally escrowed 32-byte hexadecimal key>' \
 *   DATABASE_URL='mysql://…' \
 *   node scripts/recovery/stageLegacyQuestionArchive.mjs stage \
 *     --archive /private/echelon-db-before-reset.json.gz \
 *     --report /private/legacy-question-stage-result.json
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import mysql from "mysql2/promise";

export const EXPECTED_ARCHIVE_SHA256 = "eeebf74d564065c8d931043fa76adcb1a410ff6da5043f302ab2af31c5d17646";
export const EXPECTED_TARGET_QUESTION_COUNT = 18_052;
export const EXPECTED_TARGET_BANK_COUNT = 33;
export const STAGING_CONFIRMATION = `STAGE_VERIFIED_ARCHIVE_${EXPECTED_ARCHIVE_SHA256}`;
export const EXPECTED_BANK_COUNTS = Object.freeze({
  "class1-wastewater": 600, "class1-wastewater-coll": 500, "class1-water": 600, "class1-water-dist": 500,
  "class2-wastewater": 500, "class2-wastewater-coll": 500, "class2-water": 500, "class2-water-dist": 500,
  "class3-wastewater": 499, "class3-wastewater-coll": 500, "class3-water": 500, "class3-water-dist": 625,
  "class4-wastewater": 700, "class4-wastewater-coll": 500, "class4-water": 500, "class4-water-dist": 500,
  "wpi-class1-wastewater": 594, "wpi-class1-wastewater-coll": 499, "wpi-class1-water": 598, "wpi-class1-water-dist": 500,
  "wpi-class2-wastewater": 599, "wpi-class2-wastewater-coll": 503, "wpi-class2-water": 598, "wpi-class2-water-dist": 595,
  "wpi-class3-wastewater": 607, "wpi-class3-wastewater-coll": 503, "wpi-class3-water": 531, "wpi-class3-water-dist": 590,
  "wpi-class4-wastewater": 606, "wpi-class4-wastewater-coll": 503, "wpi-class4-water": 592, "wpi-class4-water-dist": 610,
  "wqa": 500,
});

/** Immutable release-safe course inventory. This excludes the ambiguous legacy
 * class1 alias, the two already-restored OIT banks, and versioned 309A content. */
export const TARGET_BANK_KEYS = Object.freeze([
  "class1-wastewater", "class1-wastewater-coll", "class1-water", "class1-water-dist",
  "class2-wastewater", "class2-wastewater-coll", "class2-water", "class2-water-dist",
  "class3-wastewater", "class3-wastewater-coll", "class3-water", "class3-water-dist",
  "class4-wastewater", "class4-wastewater-coll", "class4-water", "class4-water-dist",
  "wpi-class1-wastewater", "wpi-class1-wastewater-coll", "wpi-class1-water", "wpi-class1-water-dist",
  "wpi-class2-wastewater", "wpi-class2-wastewater-coll", "wpi-class2-water", "wpi-class2-water-dist",
  "wpi-class3-wastewater", "wpi-class3-wastewater-coll", "wpi-class3-water", "wpi-class3-water-dist",
  "wpi-class4-wastewater", "wpi-class4-wastewater-coll", "wpi-class4-water", "wpi-class4-water-dist",
  "wqa",
].sort());
const TARGET_BANK_SET = new Set(TARGET_BANK_KEYS);
const TABLES = Object.freeze({ questions: "questions", metadata: "question_bank_meta", overviews: "module_overviews" });
const REQUIRED_ARCHIVE_INTEGRITY_TABLES = new Set([
  "ai_chat_sessions", "bookmarks", "contact_submissions", "dashboard_otps", "diagnostic_sessions", "email_otp_codes",
  "exam_outcomes", "exam_results", "flashcard_progress", "magic_links", "organization_members", "organization_term_operator_usage",
  "organizations", "purchases", "question_attempts", "stripe_event_log", "student_profiles", "subscriptions", "team_flex_extensions",
  "team_flex_licences", "team_flex_order_items", "team_flex_orders", "trial_emails", "trigger_logs", "users", "waitlist",
]);
const QUESTION_COLUMNS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation",
  "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl",
  "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
];
const INSERT_COLUMNS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation",
  "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl",
  "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
];

function fail(message) { throw new Error(`Legacy question staging blocked: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function iso(value) { return value instanceof Date ? value.toISOString() : value; }
function canonical(value) {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}
export function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function shortText(value, max, label, allowNull = true) {
  if (value === null || value === undefined || value === "") return allowNull ? null : fail(`${label} is required`);
  assert(typeof value === "string", `${label} must be text`);
  assert(value.trim().length > 0, `${label} cannot be blank`);
  assert(value.length <= max, `${label} exceeds ${max} characters`);
  return value;
}
function parseJson(value, label) {
  if (value === null || value === undefined || value === "") return null;
  try { return typeof value === "string" ? JSON.parse(value) : value; }
  catch { fail(`${label} is not valid JSON`); }
}
function canonicalJson(value, label) {
  const parsed = parseJson(value, label);
  return parsed === null ? null : JSON.stringify(parsed);
}
function normalizeOptions(value, label) {
  const options = parseJson(value, label);
  assert(Array.isArray(options) && options.length === 4, `${label} must contain exactly four options`);
  assert(options.every((option) => typeof option === "string" && option.trim().length > 0), `${label} contains a blank option`);
  return JSON.stringify(options);
}
function normalizeSteps(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const steps = parseJson(value, label);
  assert(Array.isArray(steps), `${label} must be an array when present`);
  assert(steps.every((step) => step && typeof step === "object" && !Array.isArray(step)), `${label} contains an invalid step`);
  return JSON.stringify(steps);
}
function normalizeQuestion(row, expectedBankKey) {
  assert(row && typeof row === "object" && !Array.isArray(row), "archive contains a malformed question row");
  assert(row.bankKey === expectedBankKey, `question bank mismatch for ${expectedBankKey}`);
  const questionNum = Number(row.questionNum);
  assert(Number.isSafeInteger(questionNum) && questionNum > 0, `${expectedBankKey} has an invalid question number`);
  const correctIndex = Number(row.correctIndex);
  assert(Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex <= 3, `${expectedBankKey}#${questionNum} has an invalid answer index`);
  const isCalc = row.isCalc ?? "no";
  assert(isCalc === "yes" || isCalc === "no", `${expectedBankKey}#${questionNum} has an invalid calculation flag`);
  const cognitiveLevel = row.cognitiveLevel === null || row.cognitiveLevel === undefined || row.cognitiveLevel === ""
    ? null : row.cognitiveLevel;
  assert(cognitiveLevel === null || cognitiveLevel === "recall" || cognitiveLevel === "application", `${expectedBankKey}#${questionNum} has an invalid cognitive level`);
  return {
    bankKey: expectedBankKey,
    questionNum,
    module: shortText(row.module, 128, `${expectedBankKey}#${questionNum} module`, false),
    difficulty: shortText(row.difficulty, 16, `${expectedBankKey}#${questionNum} difficulty`),
    question: shortText(row.question, 60_000, `${expectedBankKey}#${questionNum} question`, false),
    options: normalizeOptions(row.options, `${expectedBankKey}#${questionNum} options`),
    correctIndex,
    explanation: shortText(row.explanation, 60_000, `${expectedBankKey}#${questionNum} explanation`, false),
    steps: normalizeSteps(row.steps, `${expectedBankKey}#${questionNum} steps`),
    tip: shortText(row.tip, 60_000, `${expectedBankKey}#${questionNum} tip`),
    isCalc,
    topic: shortText(row.topic, 128, `${expectedBankKey}#${questionNum} topic`),
    cognitiveLevel,
    sourceTitle: shortText(row.sourceTitle, 255, `${expectedBankKey}#${questionNum} source title`),
    sourceReference: shortText(row.sourceReference, 512, `${expectedBankKey}#${questionNum} source reference`),
    sourceUrl: shortText(row.sourceUrl, 1024, `${expectedBankKey}#${questionNum} source URL`),
    blueprintObjective: shortText(row.blueprintObjective, 255, `${expectedBankKey}#${questionNum} blueprint objective`),
    reviewStatus: "in_review",
    reviewedBy: null,
    reviewedAt: null,
  };
}
function asTableMap(source) {
  assert(source && typeof source === "object" && Array.isArray(source.tables), "archive is missing its table list");
  const map = new Map();
  for (const table of source.tables) {
    assert(table && typeof table.name === "string" && Array.isArray(table.rows), "archive has an invalid table entry");
    assert(!map.has(table.name), `archive contains duplicate table ${table.name}`);
    map.set(table.name, table.rows);
  }
  for (const tableName of REQUIRED_ARCHIVE_INTEGRITY_TABLES) {
    assert(map.has(tableName), `archive is not the complete verified pre-reset export: missing ${tableName}`);
  }
  return map;
}
function buildStagingPackage(archiveBytes, expectedArchiveSha256) {
  const archiveHash = sha256(archiveBytes);
  assert(archiveHash === expectedArchiveSha256, "archive SHA-256 does not match the verified pre-reset export");
  assert(digest(TARGET_BANK_KEYS) === digest(Object.keys(EXPECTED_BANK_COUNTS).sort()), "immutable target-bank manifest is inconsistent");
  assert(Object.values(EXPECTED_BANK_COUNTS).reduce((total, count) => total + count, 0) === EXPECTED_TARGET_QUESTION_COUNT, "immutable bank-count manifest is invalid");
  let archive;
  try { archive = JSON.parse(gunzipSync(archiveBytes).toString("utf8")); }
  catch { fail("archive cannot be decompressed and parsed"); }
  const tables = asTableMap(archive);
  const sourceQuestions = tables.get("questions");
  assert(Array.isArray(sourceQuestions), "archive is missing questions");
  const byBank = new Map(TARGET_BANK_KEYS.map((bankKey) => [bankKey, []]));
  for (const sourceRow of sourceQuestions) {
    if (!TARGET_BANK_SET.has(sourceRow.bankKey)) continue;
    byBank.get(sourceRow.bankKey).push(normalizeQuestion(sourceRow, sourceRow.bankKey));
  }
  const banks = [];
  const rows = [];
  for (const bankKey of TARGET_BANK_KEYS) {
    const bankRows = byBank.get(bankKey).sort((left, right) => left.questionNum - right.questionNum);
    assert(bankRows.length > 0, `${bankKey} is absent from the verified archive`);
    assert(bankRows.length === EXPECTED_BANK_COUNTS[bankKey], `${bankKey} has ${bankRows.length} rows; expected ${EXPECTED_BANK_COUNTS[bankKey]}`);
    const seenNumbers = new Set();
    for (const row of bankRows) {
      assert(!seenNumbers.has(row.questionNum), `${bankKey} has duplicate question number ${row.questionNum}`);
      seenNumbers.add(row.questionNum);
    }
    const bankChecksum = digest(orderedQuestionRows(bankRows));
    banks.push({ bankKey, count: bankRows.length, questionChecksum: bankChecksum, minQuestionNum: bankRows[0].questionNum, maxQuestionNum: bankRows.at(-1).questionNum });
    rows.push(...bankRows);
  }
  assert(banks.length === EXPECTED_TARGET_BANK_COUNT, `expected ${EXPECTED_TARGET_BANK_COUNT} target banks, received ${banks.length}`);
  assert(rows.length === EXPECTED_TARGET_QUESTION_COUNT, `expected ${EXPECTED_TARGET_QUESTION_COUNT} target questions, received ${rows.length}`);
  return {
    format: "echelon-legacy-question-stage-package-v1",
    archiveSha256: archiveHash,
    bankCount: banks.length,
    questionCount: rows.length,
    questionChecksum: digest(orderedQuestionRows(rows)),
    banks,
    rows,
  };
}
/** Production path. The verified pre-reset archive hash is intentionally not configurable. */
export function buildStagingPackageFromArchiveBytes(archiveBytes) {
  return buildStagingPackage(archiveBytes, EXPECTED_ARCHIVE_SHA256);
}
/** Fixture-only helper. The CLI never calls this function. */
export function buildStagingPackageFromFixtureBytes(archiveBytes, expectedArchiveSha256) {
  return buildStagingPackage(archiveBytes, expectedArchiveSha256);
}
function safeTableName(tableName) {
  assert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName), "unsafe table name");
  return `\`${tableName}\``;
}
function rowForHash(row) {
  return Object.fromEntries(QUESTION_COLUMNS.map((column) => [column, iso(row[column] ?? null)]));
}
function orderedQuestionRows(rows) {
  return rows.map(rowForHash).sort((left, right) =>
    left.bankKey.localeCompare(right.bankKey) || left.questionNum - right.questionNum,
  );
}
function snapshotForHash(snapshot) {
  return {
    questions: snapshot.questions.map(rowForHash),
    metadata: snapshot.metadata.map((row) => canonical(row)),
    overviews: snapshot.overviews.map((row) => canonical(row)),
  };
}
function targetRows(snapshot) { return snapshot.questions.filter((row) => TARGET_BANK_SET.has(row.bankKey)); }
function nonTargetQuestions(snapshot) { return orderedQuestionRows(snapshot.questions.filter((row) => !TARGET_BANK_SET.has(row.bankKey))); }
function targetOtherRows(rows) { return rows.filter((row) => TARGET_BANK_SET.has(row.bankKey)); }
export async function readContentSnapshot(connection, tables = TABLES) {
  const questionTable = safeTableName(tables.questions);
  const metaTable = safeTableName(tables.metadata);
  const overviewTable = safeTableName(tables.overviews);
  const [questions] = await connection.execute(`SELECT ${QUESTION_COLUMNS.map((column) => `\`${column}\``).join(", ")} FROM ${questionTable} ORDER BY \`bankKey\`, \`questionNum\`, \`id\``);
  const [metadata] = await connection.execute(`SELECT \`bankKey\`, \`modules\`, \`moduleTargets\`, \`formulaLinks\`, \`totalQuestions\`, \`contentVersion\`, \`blueprintVersion\`, \`minCalcPerMock\`, \`recallTargetPct\` FROM ${metaTable} ORDER BY \`bankKey\`, \`id\``);
  const [overviews] = await connection.execute(`SELECT \`bankKey\`, \`overviewsJson\` FROM ${overviewTable} ORDER BY \`bankKey\`, \`id\``);
  return { questions, metadata, overviews };
}
export function validateCleanBaseline(snapshot) {
  assert(targetRows(snapshot).length === 0, "a target bank already contains question rows");
  assert(targetOtherRows(snapshot.metadata).length === 0, "a target bank already contains metadata rows");
  assert(targetOtherRows(snapshot.overviews).length === 0, "a target bank already contains module overview rows");
  const oitCounts = new Map(snapshot.questions.filter((row) => row.bankKey === "oit" || row.bankKey === "oit-ww").map((row) => [row.bankKey, 0]));
  for (const row of snapshot.questions) if (row.bankKey === "oit" || row.bankKey === "oit-ww") oitCounts.set(row.bankKey, (oitCounts.get(row.bankKey) ?? 0) + 1);
  assert(oitCounts.get("oit") === 489 && oitCounts.get("oit-ww") === 483, "clean OIT baseline has changed");
  return {
    contentChecksum: digest(snapshotForHash(snapshot)),
    nonTargetQuestionChecksum: digest(nonTargetQuestions(snapshot)),
    counts: {
      questions: snapshot.questions.length,
      metadata: snapshot.metadata.length,
      overviews: snapshot.overviews.length,
      oit: oitCounts.get("oit"),
      oitWastewater: oitCounts.get("oit-ww"),
    },
  };
}
async function lockContentTables(connection, tables = TABLES) {
  await connection.execute(`SELECT \`id\` FROM ${safeTableName(tables.questions)} ORDER BY \`id\` FOR UPDATE`);
  await connection.execute(`SELECT \`id\` FROM ${safeTableName(tables.metadata)} ORDER BY \`id\` FOR UPDATE`);
  await connection.execute(`SELECT \`id\` FROM ${safeTableName(tables.overviews)} ORDER BY \`id\` FOR UPDATE`);
}
async function verifyQuestionUniquenessConstraint(connection, tables = TABLES) {
  const [indexes] = await connection.execute(`SHOW INDEX FROM ${safeTableName(tables.questions)}`);
  const columns = indexes
    .filter((index) => index.Key_name === "bank_question_idx")
    .sort((left, right) => Number(left.Seq_in_index) - Number(right.Seq_in_index))
    .map((index) => index.Column_name);
  assert(digest(columns) === digest(["bankKey", "questionNum"]), "questions table is missing the required bank_question_idx uniqueness constraint");
}
function insertValues(row) {
  const quarantined = { ...row, reviewStatus: "in_review", reviewedBy: null, reviewedAt: null };
  return INSERT_COLUMNS.map((column) => quarantined[column]);
}
async function insertQuestionBatch(connection, rows, tables = TABLES) {
  const placeholders = rows.map(() => `(${INSERT_COLUMNS.map(() => "?").join(", ")})`).join(", ");
  await connection.execute(
    `INSERT INTO ${safeTableName(tables.questions)} (${INSERT_COLUMNS.map((column) => `\`${column}\``).join(", ")}) VALUES ${placeholders}`,
    rows.flatMap(insertValues),
  );
}
export async function stagePackage(connection, packageInfo, baseline, { tables = TABLES, batchSize = 250 } = {}) {
  assert(packageInfo.archiveSha256 === EXPECTED_ARCHIVE_SHA256, "package archive hash is unexpected");
  assert(packageInfo.bankCount === EXPECTED_TARGET_BANK_COUNT, "package bank count is unexpected");
  assert(packageInfo.questionCount === EXPECTED_TARGET_QUESTION_COUNT, "package total is unexpected");
  assert(Object.values(EXPECTED_BANK_COUNTS).reduce((total, count) => total + count, 0) === EXPECTED_TARGET_QUESTION_COUNT, "immutable bank-count manifest is invalid");
  assert(digest(QUESTION_COLUMNS) === digest(INSERT_COLUMNS), "question persistence and checksum column contracts diverged");
  assert(["reviewStatus", "reviewedBy", "reviewedAt"].every((column) => INSERT_COLUMNS.includes(column)), "quarantine columns are missing from the insert contract");
  assert(packageInfo.rows.length === EXPECTED_TARGET_QUESTION_COUNT, "package row array is unexpected");
  assert(packageInfo.rows.every((row) => TARGET_BANK_SET.has(row.bankKey)), "package contains a non-target bank");
  assert(Array.isArray(packageInfo.banks) && packageInfo.banks.length === EXPECTED_TARGET_BANK_COUNT, "package bank manifest is unexpected");
  for (const bankKey of TARGET_BANK_KEYS) {
    const manifest = packageInfo.banks.find((bank) => bank.bankKey === bankKey);
    const rowCount = packageInfo.rows.filter((row) => row.bankKey === bankKey).length;
    assert(manifest?.count === EXPECTED_BANK_COUNTS[bankKey] && rowCount === EXPECTED_BANK_COUNTS[bankKey], `${bankKey} package count is unexpected`);
  }
  await verifyQuestionUniquenessConstraint(connection, tables);
  await connection.beginTransaction();
  let committed = false;
  try {
    await lockContentTables(connection, tables);
    const lockedSnapshot = await readContentSnapshot(connection, tables);
    const lockedBaseline = validateCleanBaseline(lockedSnapshot);
    assert(lockedBaseline.contentChecksum === baseline.contentChecksum, "content baseline drifted before transaction");
    assert(lockedBaseline.nonTargetQuestionChecksum === baseline.nonTargetQuestionChecksum, "existing question baseline drifted before transaction");
    assert(digest(lockedBaseline.counts) === digest(baseline.counts), "content counts drifted before transaction");
    for (let index = 0; index < packageInfo.rows.length; index += batchSize) {
      await insertQuestionBatch(connection, packageInfo.rows.slice(index, index + batchSize), tables);
    }
    const stagedSnapshot = await readContentSnapshot(connection, tables);
    const stagedRows = orderedQuestionRows(targetRows(stagedSnapshot));
    assert(stagedRows.length === packageInfo.questionCount, "staged row count does not match the package");
    assert(stagedRows.every((row) => row.reviewStatus === "in_review" && row.reviewedBy === null && row.reviewedAt === null), "staged rows are not fully quarantined");
    assert(digest(stagedRows) === packageInfo.questionChecksum, "staged content checksum does not match the archive package");
    assert(digest(nonTargetQuestions(stagedSnapshot)) === baseline.nonTargetQuestionChecksum, "an existing question changed during staging");
    assert(digest(snapshotForHash({ questions: [], metadata: stagedSnapshot.metadata, overviews: [] }).metadata) === digest(snapshotForHash({ questions: [], metadata: lockedSnapshot.metadata, overviews: [] }).metadata), "metadata changed during question staging");
    assert(digest(snapshotForHash({ questions: [], metadata: [], overviews: stagedSnapshot.overviews }).overviews) === digest(snapshotForHash({ questions: [], metadata: [], overviews: lockedSnapshot.overviews }).overviews), "module overviews changed during question staging");
    await connection.commit();
    committed = true;
    return {
      applied: true,
      mode: "quarantined_question_staging",
      stagedQuestionCount: stagedRows.length,
      stagedBankCount: packageInfo.bankCount,
      stagedQuestionChecksum: digest(stagedRows),
    };
  } catch (error) {
    if (!committed) {
      try { await connection.rollback(); }
      catch (rollbackError) { throw new AggregateError([error, rollbackError], "legacy staging and rollback both failed"); }
    }
    throw error;
  }
}
export function encryptBackupJson(snapshot, key) {
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be 32 bytes");
  const plaintext = gzipSync(Buffer.from(JSON.stringify(snapshotForHash(snapshot))));
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted: Buffer.concat([Buffer.from("ECL1"), iv, tag, ciphertext]), plaintextSha256: sha256(plaintext) };
}
export function decryptBackupJson(encrypted, key) {
  assert(Buffer.isBuffer(encrypted) && encrypted.subarray(0, 4).toString("utf8") === "ECL1", "invalid encrypted backup header");
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be 32 bytes");
  const iv = encrypted.subarray(4, 16);
  const tag = encrypted.subarray(16, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted.subarray(32)), decipher.final()]);
  return JSON.parse(gunzipSync(plaintext).toString("utf8"));
}
function writePrivate(pathname, bytes) {
  mkdirSync(dirname(pathname), { recursive: true, mode: 0o700 });
  writeFileSync(pathname, bytes, { mode: 0o600 });
}
function createVerifiedBackup(snapshot, reportPath, key) {
  const backupDirectory = resolve(dirname(reportPath), "backups");
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const encryptedPath = resolve(backupDirectory, `pre-legacy-question-stage-${stamp}.json.gz.enc`);
  const { encrypted, plaintextSha256 } = encryptBackupJson(snapshot, key);
  writePrivate(encryptedPath, encrypted);
  const restored = decryptBackupJson(readFileSync(encryptedPath), key);
  assert(digest(restored) === digest(snapshotForHash(snapshot)), "encrypted backup rehearsal failed");
  return {
    encryptedPath,
    encryptedSha256: sha256(encrypted),
    backupKeyStorage: "operator-supplied external escrow",
    compressedPlaintextSha256: plaintextSha256,
    restoreRehearsal: "passed",
  };
}
function publicManifest(packageInfo) {
  return {
    format: packageInfo.format,
    archiveSha256: packageInfo.archiveSha256,
    targetBankCount: packageInfo.bankCount,
    targetQuestionCount: packageInfo.questionCount,
    targetQuestionChecksum: packageInfo.questionChecksum,
    banks: packageInfo.banks,
    safety: {
      customerDataImported: false,
      entitlementsGranted: false,
      paymentsImported: false,
      organizationsCreated: false,
      attemptsImported: false,
      metadataImported: false,
      moduleOverviewsImported: false,
      learnerVisibility: "blocked_by_in_review_status",
      commerceAvailabilityChanged: false,
    },
  };
}
function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (!new Set(["preflight", "stage"]).has(mode)) fail("usage requires preflight or stage mode");
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
  assert(existsSync(archivePath), "private archive is unavailable");
  assert(!reportPath.startsWith(resolve(process.cwd())), "report must remain outside the repository");
  const packageInfo = buildStagingPackageFromArchiveBytes(readFileSync(archivePath));
  const report = {
    generatedAtUtc: new Date().toISOString(),
    sourceArchiveFile: basename(archivePath),
    package: publicManifest(packageInfo),
    mode: args.mode,
  };
  if (args.mode === "preflight") {
    assert(process.env.DATABASE_URL, "DATABASE_URL is required for preflight");
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try { report.baseline = validateCleanBaseline(await readContentSnapshot(connection)); }
    finally { await connection.end(); }
    writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ mode: "preflight", report: reportPath, targetQuestionCount: packageInfo.questionCount, targetBankCount: packageInfo.bankCount, ready: true }));
    return;
  }
  assert(process.env.CONFIRM_LEGACY_QUESTION_STAGING === STAGING_CONFIRMATION, "missing exact staging confirmation");
  assert(process.env.DATABASE_URL, "DATABASE_URL is required for staging");
  assert(/^[0-9a-fA-F]{64}$/.test(process.env.LEGACY_STAGE_BACKUP_KEY_HEX ?? ""), "LEGACY_STAGE_BACKUP_KEY_HEX must be a 32-byte hexadecimal key supplied from external escrow");
  const backupKey = Buffer.from(process.env.LEGACY_STAGE_BACKUP_KEY_HEX, "hex");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const before = await readContentSnapshot(connection);
    const baseline = validateCleanBaseline(before);
    report.baseline = baseline;
    report.backup = createVerifiedBackup(before, reportPath, backupKey);
    report.transaction = await stagePackage(connection, packageInfo, baseline);
    const after = await readContentSnapshot(connection);
    const targetAfter = orderedQuestionRows(targetRows(after));
    assert(targetAfter.length === packageInfo.questionCount, "post-commit target count mismatch");
    assert(digest(targetAfter) === packageInfo.questionChecksum, "post-commit target checksum mismatch");
    assert(digest(nonTargetQuestions(after)) === baseline.nonTargetQuestionChecksum, "post-commit existing question checksum changed");
    report.postCommit = {
      stagedQuestionCount: targetAfter.length,
      stagedQuestionChecksum: digest(targetAfter),
      learnerVisibleStagedQuestions: 0,
      unchangedExistingQuestionChecksum: baseline.nonTargetQuestionChecksum,
    };
  } finally {
    await connection.end();
  }
  writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ mode: "staged", report: reportPath, stagedQuestionCount: packageInfo.questionCount, stagedBankCount: packageInfo.bankCount, learnerVisibleStagedQuestions: 0 }));
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
