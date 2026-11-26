#!/usr/bin/env node
/**
 * Controlled, one-time release for WPI Class IV Wastewater Collection.
 *
 * The legacy archive is only the immutable pre-staging reference. This tool
 * never imports users, purchases, attempts, organizations, or customer data.
 * It compares the current quarantined bank against that archive, applies the
 * separately reviewed 503-item editorial package, activates the Collection
 * mock profile, and promotes only this bank to learner visibility.
 *
 * Usage:
 *   node scripts/release-wpi-class4-collection.mjs preflight \
 *     --archive /private/echelon-db-before-reset.json.gz \
 *     --release-key wpi-class4-collection-2026-09-17 \
 *     --report /private/wpi-collection-preflight.json
 *
 * Apply additionally requires:
 *   CONFIRM_WPI_COLLECTION_RELEASE=RELEASE_WPI_COLLECTION_<release-key>
 *   WPI_COLLECTION_RELEASE_BACKUP_KEY_HEX=<32-byte external-escrow key>
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { chmodSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import mysql from "mysql2/promise";
import {
  AREAS,
  CALCULATION_IDS,
  CALCULATION_TARGETS,
  parseCorrections,
  RECALL_TARGETS,
  REVIEW_FILES,
  screenQuestion,
  SOURCES,
  TARGETS,
  TASK_MAP,
} from "./lib/collectionReview.mjs";

export const COURSE_KEY = "wpi-class4-water-coll";
export const BANK_KEY = "wpi-class4-wastewater-coll";
export const PRODUCT_KEY = "wpi-class4-water-coll";
export const EXPECTED_ARCHIVE_SHA256 = "eeebf74d564065c8d931043fa76adcb1a410ff6da5043f302ab2af31c5d17646";
export const EXPECTED_QUESTION_COUNT = 503;
export const RELEASED_REVIEW_STATUS = "approved";
export const WPI_COLLECTION_BLUEPRINT_VERSION = 2025;
export const CONTENT_FIELDS = Object.freeze([
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective",
]);
export const MUTABLE_RELEASE_FIELDS = Object.freeze([
  "module", "question", "options", "explanation", "steps", "tip", "isCalc", "topic",
  "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective",
]);
export const RELEASE_MODULES = Object.freeze(Object.values(AREAS));
export const PRIVATE_RECOVERY_ROOT = resolve("/home/ubuntu/private/echelon-recovery");
export const RELEASE_TARGETS = Object.freeze(Object.fromEntries(
  Object.entries(TARGETS).map(([area, count]) => [AREAS[area], count]),
));

function fail(message) { throw new Error(`WPI Collection release blocked: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function textDigest(value) { return sha256(JSON.stringify(value)); }
function stable(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function canonicalJson(value, label) {
  if (value === null || value === undefined || value === "") return null;
  try { return JSON.stringify(stable(typeof value === "string" ? JSON.parse(value) : value)); }
  catch { fail(`${label} is invalid JSON`); }
}
function textOrNull(value) { return value === null || value === undefined || value === "" ? null : String(value); }
function integer(value, label) {
  const parsed = Number(value);
  assert(Number.isSafeInteger(parsed), `${label} must be an integer`);
  return parsed;
}
export function projectContent(row) {
  return {
    bankKey: textOrNull(row.bankKey),
    questionNum: integer(row.questionNum, "question number"),
    module: textOrNull(row.module),
    difficulty: textOrNull(row.difficulty),
    question: textOrNull(row.question),
    options: canonicalJson(row.options, "options"),
    correctIndex: integer(row.correctIndex, "correct index"),
    explanation: textOrNull(row.explanation),
    steps: canonicalJson(row.steps, "steps"),
    tip: textOrNull(row.tip),
    isCalc: textOrNull(row.isCalc) ?? "no",
    topic: textOrNull(row.topic),
    cognitiveLevel: textOrNull(row.cognitiveLevel),
    sourceTitle: textOrNull(row.sourceTitle),
    sourceReference: textOrNull(row.sourceReference),
    sourceUrl: textOrNull(row.sourceUrl),
    blueprintObjective: textOrNull(row.blueprintObjective),
  };
}
function contentRowsDigest(rows) {
  return textDigest(rows.map(projectContent).sort((left, right) => left.questionNum - right.questionNum));
}
function questionRowDigest(row) { return textDigest(projectContent(row)); }
function sourceRowsByNumber(rows, label) {
  assert(Array.isArray(rows) && rows.length === EXPECTED_QUESTION_COUNT, `${label} must contain exactly ${EXPECTED_QUESTION_COUNT} rows`);
  const byNumber = new Map();
  for (const row of rows) {
    const projected = projectContent(row);
    assert(projected.bankKey === BANK_KEY, `${label} contains a different bank`);
    assert(projected.questionNum >= 1 && projected.questionNum <= EXPECTED_QUESTION_COUNT, `${label} contains an invalid question number`);
    assert(!byNumber.has(projected.questionNum), `${label} contains a duplicate question number`);
    assert(projected.module && projected.question && projected.explanation, `${label} contains blank required content`);
    assert(["yes", "no"].includes(projected.isCalc), `${label} has an invalid calculation flag`);
    assert(projected.correctIndex >= 0 && projected.correctIndex <= 3, `${label} has an invalid answer index`);
    const options = JSON.parse(projected.options);
    assert(Array.isArray(options) && options.length === 4 && options.every(option => typeof option === "string" && option.trim()), `${label} has invalid options`);
    byNumber.set(projected.questionNum, projected);
  }
  assert(byNumber.size === EXPECTED_QUESTION_COUNT, `${label} does not map every question`);
  return byNumber;
}
function correctionMap() {
  const corrections = parseCorrections(REVIEW_FILES.map(name => readFileSync(new URL(`../content/wpi-class4-collection/review/${name}`, import.meta.url), "utf8")));
  assert(corrections.length === EXPECTED_QUESTION_COUNT, "authored corrections are incomplete");
  const objectives = new Map();
  for (const group of TASK_MAP.groups) for (const questionNum of group.questionNums) {
    assert(!objectives.has(questionNum), "task map contains a duplicate question number");
    objectives.set(questionNum, group);
  }
  assert(objectives.size === EXPECTED_QUESTION_COUNT, "task map is incomplete");
  return { corrections: new Map(corrections.map(correction => [correction.questionNum, correction])), objectives };
}
export function buildRepairedRows(currentRows) {
  const currentByNumber = sourceRowsByNumber(currentRows, "current bank");
  const { corrections, objectives } = correctionMap();
  const repaired = [];
  for (let questionNum = 1; questionNum <= EXPECTED_QUESTION_COUNT; questionNum += 1) {
    const before = currentByNumber.get(questionNum);
    const correction = corrections.get(questionNum);
    const objective = objectives.get(questionNum);
    assert(before && correction && objective, `missing repair inputs for question ${questionNum}`);
    assert(objective.area === correction.area, `task-map area mismatch for question ${questionNum}`);
    const source = SOURCES[correction.source];
    assert(source, `missing source declaration for question ${questionNum}`);
    const options = [...correction.wrong];
    options.splice(before.correctIndex, 0, correction.correct);
    const after = {
      ...before,
      module: AREAS[correction.area],
      question: correction.question,
      options: JSON.stringify(options),
      explanation: correction.explanation,
      steps: null,
      tip: null,
      isCalc: CALCULATION_IDS.has(questionNum) ? "yes" : "no",
      topic: AREAS[correction.area],
      cognitiveLevel: correction.cognitiveLevel,
      sourceTitle: source.title,
      sourceReference: source.note,
      sourceUrl: source.url,
      blueprintObjective: `${objective.key}: ${objective.task} (guide pp. ${objective.guidePages.join(", ")})`,
    };
    const findings = screenQuestion(after);
    assert(findings.length === 0, `repaired question ${questionNum} fails automated screening: ${findings.join(",")}`);
    assert(after.module.length <= 128 && (after.topic?.length ?? 0) <= 128, `repaired question ${questionNum} exceeds module field limits`);
    assert((after.sourceTitle?.length ?? 0) <= 255 && (after.sourceReference?.length ?? 0) <= 512 && (after.sourceUrl?.length ?? 0) <= 1024 && (after.blueprintObjective?.length ?? 0) <= 255, `repaired question ${questionNum} exceeds governance field limits`);
    repaired.push(after);
  }
  const coverage = Object.fromEntries(Object.entries(AREAS).map(([area, name]) => {
    const rows = repaired.filter(row => row.module === name);
    return [name, {
      total: rows.length,
      recall: rows.filter(row => row.cognitiveLevel === "recall").length,
      application: rows.filter(row => row.cognitiveLevel === "application").length,
      calculations: rows.filter(row => row.isCalc === "yes").length,
      requiredRecall: RECALL_TARGETS[area],
    }];
  }));
  return { repaired, coverage };
}
function sameContent(left, right) { return textDigest(projectContent(left)) === textDigest(projectContent(right)); }
function sourceArchiveRows(archiveBytes) {
  assert(sha256(archiveBytes) === EXPECTED_ARCHIVE_SHA256, "archive checksum does not match the verified pre-reset export");
  let archive;
  try { archive = JSON.parse(gunzipSync(archiveBytes).toString("utf8")); }
  catch { fail("archive cannot be decompressed and parsed"); }
  assert(Array.isArray(archive.tables), "archive table list is missing");
  const tables = new Map();
  for (const table of archive.tables) {
    assert(table && typeof table.name === "string" && Array.isArray(table.rows), "archive contains an invalid table");
    assert(!tables.has(table.name), `archive has duplicate table ${table.name}`);
    tables.set(table.name, table.rows);
  }
  const rows = tables.get("questions")?.filter(row => row.bankKey === BANK_KEY) ?? [];
  const metadata = tables.get("question_bank_meta")?.filter(row => row.bankKey === BANK_KEY) ?? [];
  const overviews = tables.get("module_overviews")?.filter(row => row.bankKey === BANK_KEY) ?? [];
  assert(metadata.length === 1, "archive must contain exactly one Collection metadata row");
  assert(overviews.length <= 1, "archive has unexpected Collection module overviews");
  return { rows, metadata: metadata[0], archiveDigest: contentRowsDigest(rows) };
}
function buildMetadata(sourceMetadata) {
  return {
    bankKey: BANK_KEY,
    modules: JSON.stringify(RELEASE_MODULES),
    moduleTargets: JSON.stringify(RELEASE_TARGETS),
    formulaLinks: sourceMetadata.formulaLinks ?? null,
    totalQuestions: EXPECTED_QUESTION_COUNT,
    contentVersion: 1,
    blueprintVersion: WPI_COLLECTION_BLUEPRINT_VERSION,
    minCalcPerMock: 16,
    recallTargetPct: 20,
  };
}
function validateBlueprint(rows) {
  for (const [area, module] of Object.entries(AREAS)) {
    const candidates = rows.filter(row => row.module === module);
    const total = TARGETS[area];
    const recall = RECALL_TARGETS[area];
    const calculations = CALCULATION_TARGETS[area];
    const rc = candidates.filter(row => row.cognitiveLevel === "recall" && row.isCalc === "yes").length;
    const rn = candidates.filter(row => row.cognitiveLevel === "recall" && row.isCalc !== "yes").length;
    const ac = candidates.filter(row => row.cognitiveLevel === "application" && row.isCalc === "yes").length;
    const an = candidates.filter(row => row.cognitiveLevel === "application" && row.isCalc !== "yes").length;
    const application = total - recall;
    const minimumRecallCalculations = Math.max(0, calculations - application, recall - rn, calculations - ac);
    const maximumRecallCalculations = Math.min(recall, calculations, rc, an - application + calculations);
    assert(candidates.length >= total && minimumRecallCalculations <= maximumRecallCalculations, `mock blueprint cannot satisfy the joint quota for ${module}`);
  }
}
export function planCollectionRelease({ currentRows, currentMetadata, currentOverviews, attempts, snapshots, archiveBytes }) {
  const archive = sourceArchiveRows(archiveBytes);
  const currentByNumber = sourceRowsByNumber(currentRows, "current bank");
  const archiveByNumber = sourceRowsByNumber(archive.rows, "archive bank");
  assert((currentMetadata ?? []).length === 0, "target metadata already exists; manual reconciliation is required");
  assert((currentOverviews ?? []).length === 0, "target module overview already exists; manual reconciliation is required");
  assert(Number(attempts ?? 0) === 0, "learner attempts exist; historical session reconciliation is required");
  assert(Number(snapshots ?? 0) === 0, "prior release snapshots exist; release key reuse or reconciliation is required");
  const ids = new Set();
  for (const row of currentRows) {
    assert(Number.isSafeInteger(Number(row.id)) && !ids.has(Number(row.id)), "current bank has invalid or duplicate row identities");
    ids.add(Number(row.id));
    assert(row.reviewStatus === "in_review" && row.reviewedBy == null && row.reviewedAt == null, "current bank is no longer fully quarantined");
    const expected = archiveByNumber.get(Number(row.questionNum));
    assert(expected && sameContent(row, expected), `current bank diverges from the verified archive at question ${row.questionNum}`);
  }
  assert(currentByNumber.size === archiveByNumber.size, "current bank and archive inventory differ");
  const { repaired, coverage } = buildRepairedRows(currentRows);
  validateBlueprint(repaired);
  return {
    ready: true,
    bankKey: BANK_KEY,
    courseKey: COURSE_KEY,
    productKey: PRODUCT_KEY,
    questionCount: EXPECTED_QUESTION_COUNT,
    currentContentSha256: contentRowsDigest(currentRows),
    archiveContentSha256: archive.archiveDigest,
    repairedContentSha256: contentRowsDigest(repaired),
    coverage,
    metadata: buildMetadata(archive.metadata),
    repaired,
  };
}
function parseArgs(argv) {
  const [mode, ...tokens] = argv;
  assert(["preflight", "apply"].includes(mode), "usage requires preflight or apply mode");
  const args = { mode, archive: null, releaseKey: null, report: null };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--archive") args.archive = tokens[++index];
    else if (token === "--release-key") args.releaseKey = tokens[++index];
    else if (token === "--report") args.report = tokens[++index];
    else fail(`unknown argument ${token}`);
  }
  assert(args.archive && args.releaseKey && args.report, "archive, release key, and report are required");
  assert(/^[a-z0-9][a-z0-9-]{7,100}$/.test(args.releaseKey), "release key format is invalid");
  return args;
}
function privatePath(pathname, label) {
  const absolute = resolve(pathname);
  assert(absolute.startsWith(`${PRIVATE_RECOVERY_ROOT}/`), `${label} must remain in protected recovery storage`);
  return absolute;
}
function writePrivate(pathname, bytes) {
  mkdirSync(dirname(pathname), { recursive: true, mode: 0o700 });
  chmodSync(dirname(pathname), 0o700);
  const descriptor = openSync(pathname, "wx", 0o600);
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally { closeSync(descriptor); }
  chmodSync(pathname, 0o600);
}
function encryptBackup(snapshot, key) {
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be 32 bytes");
  const plaintext = gzipSync(Buffer.from(JSON.stringify(stable(snapshot))));
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { encrypted: Buffer.concat([Buffer.from("ECL2"), iv, cipher.getAuthTag(), ciphertext]), plaintextSha256: sha256(plaintext) };
}
function decryptBackup(encrypted, key) {
  assert(encrypted.subarray(0, 4).toString("utf8") === "ECL2", "backup header is invalid");
  const decipher = createDecipheriv("aes-256-gcm", key, encrypted.subarray(4, 16));
  decipher.setAuthTag(encrypted.subarray(16, 32));
  const plaintext = Buffer.concat([decipher.update(encrypted.subarray(32)), decipher.final()]);
  return JSON.parse(gunzipSync(plaintext).toString("utf8"));
}
function queryProjection(row) {
  return { ...projectContent(row), id: Number(row.id), reviewStatus: row.reviewStatus, reviewedBy: row.reviewedBy ?? null, reviewedAt: row.reviewedAt ?? null };
}
async function readLockedState(connection) {
  const fields = ["id", ...CONTENT_FIELDS, "reviewStatus", "reviewedBy", "reviewedAt"].map(field => `\`${field}\``).join(", ");
  const [currentRows] = await connection.execute(`SELECT ${fields} FROM questions WHERE bankKey = ? ORDER BY questionNum, id FOR UPDATE`, [BANK_KEY]);
  const [metadata] = await connection.execute("SELECT * FROM question_bank_meta WHERE bankKey = ? FOR UPDATE", [BANK_KEY]);
  const [overviews] = await connection.execute("SELECT * FROM module_overviews WHERE bankKey = ? FOR UPDATE", [BANK_KEY]);
  const [attempts] = await connection.execute("SELECT COUNT(*) AS count FROM question_attempts WHERE bankKey = ?", [BANK_KEY]);
  const [snapshots] = await connection.execute("SELECT COUNT(*) AS count FROM question_content_snapshots WHERE bankKey = ?", [BANK_KEY]);
  return { currentRows, metadata, overviews, attempts: Number(attempts[0]?.count ?? 0), snapshots: Number(snapshots[0]?.count ?? 0) };
}
function reportPlan(plan) {
  return {
    ready: plan.ready,
    bankKey: plan.bankKey,
    courseKey: plan.courseKey,
    productKey: plan.productKey,
    questionCount: plan.questionCount,
    currentContentSha256: plan.currentContentSha256,
    archiveContentSha256: plan.archiveContentSha256,
    repairedContentSha256: plan.repairedContentSha256,
    coverage: plan.coverage,
    metadata: plan.metadata,
  };
}
async function applyRelease(connection, state, plan, releaseKey, backupPath, key) {
  const currentPlan = planCollectionRelease({ ...state, archiveBytes: readFileSync(plan.archivePath) });
  assert(currentPlan.currentContentSha256 === plan.currentContentSha256, "bank content changed after preflight");
  assert(state.metadata.length === 0, "target metadata already exists before release writes");
  assert(state.overviews.length === 0, "target module overview already exists before release writes");
  assert(state.currentRows.length === currentPlan.repaired.length, "reviewed package cardinality changed after preflight");
  const repairedByQuestionNum = new Map(currentPlan.repaired.map(row => [Number(row.questionNum), row]));
  assert(repairedByQuestionNum.size === currentPlan.repaired.length, "reviewed package contains duplicate question numbers");
  assert(state.currentRows.every(row => repairedByQuestionNum.has(Number(row.questionNum))), "reviewed package does not map every locked question row");
  const [releaseSnapshots] = await connection.execute("SELECT COUNT(*) AS count FROM question_content_snapshots WHERE releaseKey = ? FOR UPDATE", [releaseKey]);
  assert(Number(releaseSnapshots[0]?.count ?? 0) === 0, "release key already has immutable snapshots");
  const moduleOverviewsSha256 = textDigest(state.overviews);
  const backupSnapshot = {
    format: "echelon-wpi-collection-release-backup-v1",
    releaseKey,
    bankKey: BANK_KEY,
    savedAtUtc: new Date().toISOString(),
    questions: state.currentRows.map(queryProjection),
    metadata: state.metadata,
    moduleOverviews: state.overviews,
  };
  const encryptedBackup = encryptBackup(backupSnapshot, key);
  writePrivate(backupPath, encryptedBackup.encrypted);
  const restored = decryptBackup(readFileSync(backupPath), key);
  assert(textDigest(stable(restored)) === textDigest(stable(backupSnapshot)), "encrypted backup restore rehearsal failed");
  key.fill(0);
  const snapshotSql = "INSERT INTO question_content_snapshots (releaseKey, bankKey, questionId, questionNum, sourceContentVersion, contentHash, payload) VALUES (?, ?, ?, ?, ?, ?, ?)";
  for (const row of state.currentRows) {
    const snapshot = queryProjection(row);
    await connection.execute(snapshotSql, [releaseKey, BANK_KEY, snapshot.id, snapshot.questionNum, 0, questionRowDigest(snapshot), JSON.stringify(snapshot)]);
  }
  const updateSql = `UPDATE questions SET ${MUTABLE_RELEASE_FIELDS.map(field => `\`${field}\` = ?`).join(", ")}, \`reviewStatus\` = ?, \`reviewedBy\` = ?, \`reviewedAt\` = UTC_TIMESTAMP() WHERE id = ? AND bankKey = ? AND questionNum = ? AND reviewStatus = 'in_review' AND reviewedBy IS NULL AND reviewedAt IS NULL`;
  for (let index = 0; index < state.currentRows.length; index += 1) {
    const current = state.currentRows[index];
    const next = repairedByQuestionNum.get(Number(current.questionNum));
    assert(next, `missing reviewed content for question ${current.questionNum}`);
    const values = [...MUTABLE_RELEASE_FIELDS.map(field => next[field] ?? null), RELEASED_REVIEW_STATUS, "controlled-release", Number(current.id), BANK_KEY, Number(current.questionNum)];
    const [updated] = await connection.execute(updateSql, values);
    assert(updated.affectedRows === 1, `question ${current.questionNum} was not updated exactly once`);
  }
  const metadata = currentPlan.metadata;
  const [insertedMetadata] = await connection.execute(
    "INSERT INTO question_bank_meta (bankKey, modules, moduleTargets, formulaLinks, totalQuestions, contentVersion, blueprintVersion, minCalcPerMock, recallTargetPct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [metadata.bankKey, metadata.modules, metadata.moduleTargets, metadata.formulaLinks, metadata.totalQuestions, metadata.contentVersion, metadata.blueprintVersion, metadata.minCalcPerMock, metadata.recallTargetPct],
  );
  assert(insertedMetadata.affectedRows === 1, "Collection metadata was not inserted exactly once");
  const after = await readLockedState(connection);
  assert(after.currentRows.length === EXPECTED_QUESTION_COUNT, "post-release bank count is incorrect");
  assert(after.currentRows.every(row => row.reviewStatus === RELEASED_REVIEW_STATUS && row.reviewedBy === "controlled-release" && row.reviewedAt != null), "not every released row is approved with release provenance");
  assert(contentRowsDigest(after.currentRows) === currentPlan.repairedContentSha256, "post-release content checksum does not match the reviewed package");
  assert(after.metadata.length === 1 && Number(after.metadata[0].totalQuestions) === EXPECTED_QUESTION_COUNT && Number(after.metadata[0].contentVersion) === 1 && Number(after.metadata[0].blueprintVersion) === WPI_COLLECTION_BLUEPRINT_VERSION && Number(after.metadata[0].minCalcPerMock) === 16 && Number(after.metadata[0].recallTargetPct) === 20, "released metadata is not exact");
  assert(after.attempts === 0, "learner attempts changed during release");
  assert(textDigest(after.overviews) === moduleOverviewsSha256, "module overviews changed during release");
  const [snapshotRows] = await connection.execute("SELECT questionId, questionNum, contentHash FROM question_content_snapshots WHERE releaseKey = ? AND bankKey = ? ORDER BY questionNum, questionId", [releaseKey, BANK_KEY]);
  assert(snapshotRows.length === EXPECTED_QUESTION_COUNT, "immutable snapshot count is incorrect");
  return {
    backup: { encryptedPath: backupPath, encryptedSha256: sha256(encryptedBackup.encrypted), compressedPlaintextSha256: encryptedBackup.plaintextSha256, restoreRehearsal: "passed", keyStorage: "operator-supplied external escrow" },
    snapshots: { releaseKey, rowCount: snapshotRows.length, beforeContentSha256: currentPlan.currentContentSha256 },
    after: { learnerVisibleRows: after.currentRows.length, contentSha256: contentRowsDigest(after.currentRows), metadata: currentPlan.metadata },
  };
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const archivePath = privatePath(args.archive, "archive");
  const reportPath = privatePath(args.report, "report");
  assert(existsSync(archivePath), "private archive is unavailable");
  assert(!existsSync(reportPath), "report path already exists");
  assert(process.env.DATABASE_URL, "DATABASE_URL is required");
  if (args.mode === "apply") {
    assert(process.env.CONFIRM_WPI_COLLECTION_RELEASE === `RELEASE_WPI_COLLECTION_${args.releaseKey}`, "exact release confirmation token is required");
    assert(/^[0-9a-fA-F]{64}$/.test(process.env.WPI_COLLECTION_RELEASE_BACKUP_KEY_HEX ?? ""), "WPI_COLLECTION_RELEASE_BACKUP_KEY_HEX must be a 32-byte hexadecimal key");
  }
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, dateStrings: true, timezone: "Z" });
  let open = false;
  let committed = false;
  let backupPath = null;
  let backupKey = null;
  try {
    await connection.beginTransaction();
    open = true;
    const state = await readLockedState(connection);
    const plan = planCollectionRelease({ ...state, archiveBytes: readFileSync(archivePath) });
    plan.archivePath = archivePath;
    if (args.mode === "preflight") {
      await connection.rollback();
      open = false;
      const report = { format: "echelon-wpi-collection-release-report-v1", mode: "preflight", releaseKey: args.releaseKey, generatedAtUtc: new Date().toISOString(), plan: reportPlan(plan), transaction: "rolled_back", safety: { customerDataRead: false, customerDataWritten: false, purchasesCreated: false, accessGranted: false, teamsChanged: false, emailsSent: false, pricingChanged: false } };
      writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      console.log(JSON.stringify({ mode: report.mode, reportPath, plan: report.plan }, null, 2));
      return;
    }
    backupPath = privatePath(resolve(dirname(reportPath), "backups", `${args.releaseKey}-${randomBytes(8).toString("hex")}.json.gz.enc`), "backup");
    assert(!existsSync(backupPath), "backup path already exists");
    backupKey = Buffer.from(process.env.WPI_COLLECTION_RELEASE_BACKUP_KEY_HEX, "hex");
    const result = await applyRelease(connection, state, plan, args.releaseKey, backupPath, backupKey);
    await connection.commit();
    open = false;
    committed = true;
    const report = { format: "echelon-wpi-collection-release-report-v1", mode: "applied", releaseKey: args.releaseKey, appliedAtUtc: new Date().toISOString(), plan: reportPlan(plan), ...result, safety: { customerDataRead: false, customerDataWritten: false, purchasesCreated: false, accessGranted: false, teamsChanged: false, emailsSent: false, pricingChanged: false } };
    writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ mode: report.mode, reportPath, bankKey: BANK_KEY, learnerVisibleRows: result.after.learnerVisibleRows, contentSha256: result.after.contentSha256, pricingChanged: false }, null, 2));
  } catch (error) {
    if (open) await connection.rollback();
    if (!committed && backupPath && existsSync(backupPath)) rmSync(backupPath, { force: true });
    throw error;
  } finally {
    if (backupKey) backupKey.fill(0);
    await connection.end();
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
