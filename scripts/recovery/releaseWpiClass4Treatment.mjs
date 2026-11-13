#!/usr/bin/env node
/**
 * Release the previously reviewed WPI Class IV Wastewater Treatment package
 * into the clean recovery database without touching learner or customer data.
 *
 * The approved private handoff stays outside GitHub. The caller supplies its
 * extracted canonical payloads plus the original ZIP so this script can pin
 * the exact September 11 archive before planning any database change.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  WPI_CLASS4_NEW_RANGE,
  WPI_CLASS4_WASTEWATER_BANK,
  hashWpiNewQuestionRows,
  hashWpiQuestionRows,
} from "../lib/wpiClass4Release.mjs";

export const BANK_KEY = WPI_CLASS4_WASTEWATER_BANK;
export const APPROVED_ARCHIVE_SHA256 = "57f41898a17bdf7920f419b9be5cce1c99fc59e80525a1d2f1fde712945d1f1f";
export const APPROVED_BASELINE_SHA256 = "043fced6fbc3878a58070bc691255ab0c875421bc83d299ee2b36fa5c5321857";
export const CLEAN_STAGED_COUNT = 606;
export const REVIEWED_EXISTING_COUNT = 657;
export const REVIEWED_ADDITION_COUNT = 250;
export const FINAL_COUNT = REVIEWED_EXISTING_COUNT + REVIEWED_ADDITION_COUNT;
export const RELEASE_KEY = `wpi-class4-treatment-${APPROVED_ARCHIVE_SHA256.slice(0, 12)}`;
export const REVIEW_ACTOR = `batch-release:${RELEASE_KEY}`;

export const MODULES = Object.freeze([
  "Equipment Evaluation, Maintenance & Operation",
  "Treatment Process Evaluation & Adjustment",
  "Laboratory Analysis",
  "Security, Safety & Administrative Procedures",
]);
export const MODULE_TARGETS = Object.freeze({
  [MODULES[0]]: 28,
  [MODULES[1]]: 42,
  [MODULES[2]]: 15,
  [MODULES[3]]: 15,
});
export const PLANNED_METADATA = Object.freeze({
  bankKey: BANK_KEY,
  modules: JSON.stringify(MODULES),
  moduleTargets: JSON.stringify(MODULE_TARGETS),
  formulaLinks: null,
  totalQuestions: FINAL_COUNT,
  contentVersion: 1,
  blueprintVersion: 2025,
  minCalcPerMock: 16,
  recallTargetPct: 25,
});

const CONTENT_FIELDS = Object.freeze([
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective",
]);
const SNAPSHOT_FIELDS = Object.freeze([
  ...CONTENT_FIELDS, "reviewStatus", "reviewedBy", "reviewedAt",
]);
const INSERT_FIELDS = Object.freeze([
  ...CONTENT_FIELDS, "reviewStatus", "reviewedBy", "reviewedAt",
]);
const MODULE_ALIASES = Object.freeze({
  "Treatment Process": MODULES[1],
  "Equipment Operation & Maintenance": MODULES[0],
  "Safety & Admin": MODULES[3],
});
const BLUEPRINT = Object.freeze([
  { module: MODULES[0], total: 28, recall: 6, calculations: 7 },
  { module: MODULES[1], total: 42, recall: 7, calculations: 4 },
  { module: MODULES[2], total: 15, recall: 7, calculations: 0 },
  { module: MODULES[3], total: 15, recall: 5, calculations: 5 },
]);

function fail(message) { throw new Error(`WPI Class IV Treatment release blocked: ${message}`); }
function canonical(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
export function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
function fileSha256(path) { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function parseJsonFile(path, label) {
  if (!path) fail(`${label} path is required`);
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { fail(`${label} is unreadable or invalid JSON: ${error.message}`); }
}
function canonicalJson(value, label) {
  if (value === null || value === undefined || value === "") return null;
  try { return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value); }
  catch { fail(`${label} is not valid JSON`); }
}
function normalizeField(field, value, label) {
  if (field === "options" || field === "steps") return canonicalJson(value, label);
  if (["id", "questionNum", "correctIndex"].includes(field)) return value === null || value === undefined ? null : Number(value);
  return canonical(value);
}
export function contentRow(row) {
  return Object.fromEntries(CONTENT_FIELDS.map(field => [
    field,
    normalizeField(field, row[field], `${row.bankKey ?? "unknown"}#${row.questionNum ?? "unknown"} ${field}`),
  ]));
}
export function snapshotPayload(row) {
  return Object.fromEntries(SNAPSHOT_FIELDS.map(field => [field, canonical(row[field])]));
}
function metadataComparable(row) {
  if (!row) return null;
  return {
    bankKey: row.bankKey,
    modules: canonicalJson(row.modules, "metadata modules"),
    moduleTargets: canonicalJson(row.moduleTargets, "metadata module targets"),
    formulaLinks: canonicalJson(row.formulaLinks, "metadata formula links"),
    totalQuestions: Number(row.totalQuestions),
    contentVersion: Number(row.contentVersion),
    blueprintVersion: Number(row.blueprintVersion),
    minCalcPerMock: row.minCalcPerMock === null ? null : Number(row.minCalcPerMock),
    recallTargetPct: row.recallTargetPct === null ? null : Number(row.recallTargetPct),
  };
}
function normalizeModule(module) { return MODULE_ALIASES[module] ?? module; }
function rowsByNumber(rows, expectedCount, label) {
  if (!Array.isArray(rows) || rows.length !== expectedCount) fail(`${label} must contain exactly ${expectedCount} rows`);
  const result = new Map();
  for (const row of rows) {
    const questionNum = Number(row?.questionNum);
    if (row?.bankKey !== BANK_KEY || !Number.isInteger(questionNum) || questionNum < 1 || result.has(questionNum)) {
      fail(`${label} contains an invalid bank or duplicate question number`);
    }
    result.set(questionNum, { ...row, questionNum });
  }
  return result;
}
function validateQuestion(row, label) {
  const options = canonicalJson(row.options, `${label} options`);
  const parsed = JSON.parse(options);
  if (parsed.length !== 4 || parsed.some(option => typeof option !== "string" || !option.trim()) ||
      new Set(parsed.map(option => option.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " "))).size !== 4) {
    fail(`${label} must contain four distinct, non-blank options`);
  }
  const correctIndex = Number(row.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) fail(`${label} has an invalid answer key`);
  if (typeof row.question !== "string" || !row.question.trim()) fail(`${label} has a blank stem`);
  if (typeof row.explanation !== "string" || !row.explanation.trim()) fail(`${label} has a blank explanation`);
  if (!['yes', 'no'].includes(row.isCalc)) fail(`${label} has an invalid calculation flag`);
  if (!['recall', 'application'].includes(row.cognitiveLevel)) fail(`${label} has no reviewed cognitive classification`);
}
function validateBlueprint(rows) {
  const normalized = rows.map(row => ({
    ...row,
    module: normalizeModule(row.module),
    isCalc: row.isCalc === "yes",
  }));
  for (const area of BLUEPRINT) {
    const candidates = normalized.filter(row => row.module === area.module);
    const counts = {
      rc: candidates.filter(row => row.cognitiveLevel === "recall" && row.isCalc).length,
      rn: candidates.filter(row => row.cognitiveLevel === "recall" && !row.isCalc).length,
      ac: candidates.filter(row => row.cognitiveLevel === "application" && row.isCalc).length,
      an: candidates.filter(row => row.cognitiveLevel === "application" && !row.isCalc).length,
    };
    const application = area.total - area.recall;
    const low = Math.max(0, area.calculations - application, area.recall - counts.rn, area.calculations - counts.ac);
    const high = Math.min(area.recall, area.calculations, counts.rc, counts.an - application + area.calculations);
    if (low > high) fail(`reviewed package cannot satisfy the 2025 mock quotas for ${area.module}`);
  }
}
function normalizeBaselinePayload(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.questions)) return value.questions;
  if (Array.isArray(value?.patches)) return value.patches.map(patch => patch.before);
  fail("baseline payload must be a row array, a questions array, or a complete before/after patch package");
}
function normalizeExistingPayload(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.questions)) return value.questions;
  if (Array.isArray(value?.patches)) return value.patches.map(patch => patch.after);
  fail("existing payload must be a row array, a questions array, or a complete before/after patch package");
}
function normalizeNewPayload(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.questions)) return value.questions;
  fail("addition payload must be a row array or questions array");
}

export function validateApprovedPackage({ archiveSha256, manifest, baselineRows, existingRows, additionRows }, expectations = {}) {
  const expectedArchive = expectations.archiveSha256 ?? APPROVED_ARCHIVE_SHA256;
  const expectedBaseline = expectations.baselineSha256 ?? APPROVED_BASELINE_SHA256;
  const existingCount = expectations.existingCount ?? REVIEWED_EXISTING_COUNT;
  const additionCount = expectations.additionCount ?? REVIEWED_ADDITION_COUNT;
  if (archiveSha256 !== expectedArchive) fail("private handoff ZIP SHA-256 is not the approved September 11 archive");
  const baseline = rowsByNumber(baselineRows, existingCount, "approved baseline");
  const existing = rowsByNumber(existingRows, existingCount, "reviewed existing package");
  const additions = rowsByNumber(additionRows, additionCount, "reviewed addition package");
  const orderedBaseline = [...baseline.values()].sort((a, b) => a.questionNum - b.questionNum);
  const orderedExisting = [...existing.values()].sort((a, b) => a.questionNum - b.questionNum);
  const orderedAdditions = [...additions.values()].sort((a, b) => a.questionNum - b.questionNum);
  if (hashWpiQuestionRows(orderedBaseline) !== expectedBaseline) fail("657-row source baseline checksum is not approved");
  if (manifest?.targetBankKey !== BANK_KEY) fail("release manifest targets a different bank");
  if (manifest?.sourcePackageBaselineRowsSha256 !== expectedBaseline) fail("release manifest baseline checksum is not approved");
  if (hashWpiQuestionRows(orderedExisting) !== manifest?.existingRowsSha256) fail("reviewed existing-row checksum does not match the release manifest");
  if (hashWpiNewQuestionRows(orderedAdditions) !== manifest?.newRowsSha256) fail("reviewed addition checksum does not match the release manifest");
  if (hashWpiNewQuestionRows(orderedAdditions.map(row => ({ ...row, reviewStatus: "approved" }))) !== manifest?.promotedNewRowsSha256) {
    fail("approved addition checksum does not match the release manifest");
  }
  for (const [questionNum, row] of existing) {
    if (!baseline.has(questionNum)) fail(`reviewed existing question ${questionNum} has no approved baseline`);
    validateQuestion(row, `existing question ${questionNum}`);
  }
  for (const row of orderedAdditions) {
    if (row.questionNum < WPI_CLASS4_NEW_RANGE.start || row.questionNum > WPI_CLASS4_NEW_RANGE.end) {
      fail(`addition ${row.questionNum} is outside the governed 2001-2250 range`);
    }
    validateQuestion(row, `addition ${row.questionNum}`);
  }
  if (new Set([...existing.keys(), ...additions.keys()]).size !== existingCount + additionCount) fail("reviewed question numbers overlap");
  const stems = new Set();
  for (const row of [...orderedExisting, ...orderedAdditions]) {
    const stem = row.question.normalize("NFKC").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    if (!stem || stems.has(stem)) fail(`duplicate or blank normalized stem at question ${row.questionNum}`);
    stems.add(stem);
  }
  validateBlueprint([...orderedExisting, ...orderedAdditions]);
  return { manifest, baseline, existing, additions, orderedExisting, orderedAdditions };
}

export function buildReleasePlan(currentRows, currentMetadata, approved, expectations = {}) {
  const cleanCount = expectations.cleanCount ?? CLEAN_STAGED_COUNT;
  const existingCount = expectations.existingCount ?? REVIEWED_EXISTING_COUNT;
  const additionCount = expectations.additionCount ?? REVIEWED_ADDITION_COUNT;
  const finalCount = existingCount + additionCount;
  const metadata = expectations.metadata ?? PLANNED_METADATA;
  if (!Array.isArray(currentRows)) fail("current bank rows are unavailable");
  if (currentMetadata && digest(metadataComparable(currentMetadata)) === digest(metadata)) {
    const currentMap = new Map(currentRows.map(row => [Number(row.questionNum), row]));
    const allFinal = [...approved.orderedExisting, ...approved.orderedAdditions];
    const exact = currentRows.length === finalCount && allFinal.every(row => {
      const live = currentMap.get(row.questionNum);
      return live && digest(contentRow(live)) === digest(contentRow(row)) && live.reviewStatus === "approved" && live.reviewedBy === REVIEW_ACTOR;
    });
    if (exact) return { status: "already_released", releaseKey: RELEASE_KEY, updates: [], inserts: [] };
  }
  if (currentMetadata) fail("unexpected Treatment metadata exists; reconcile it before the first clean-database release");
  if (currentRows.length !== cleanCount) fail(`clean staged bank must contain exactly ${cleanCount} rows`);
  const current = new Map();
  for (const row of currentRows) {
    const questionNum = Number(row.questionNum);
    if (row.bankKey !== BANK_KEY || !Number.isInteger(questionNum) || current.has(questionNum)) fail("clean staged bank has an invalid identity");
    if (row.reviewStatus !== "in_review" || row.reviewedBy !== null || row.reviewedAt !== null) fail(`question ${questionNum} is not in untouched quarantine`);
    if (approved.additions.has(questionNum)) fail(`clean staged bank unexpectedly occupies governed addition number ${questionNum}`);
    current.set(questionNum, row);
  }
  const updates = [];
  let beforeMatches = 0;
  let afterMatches = 0;
  for (const [questionNum, live] of current) {
    const before = approved.baseline.get(questionNum);
    const after = approved.existing.get(questionNum);
    if (!before || !after) fail(`clean staged question ${questionNum} is outside the approved 657-row history`);
    const liveDigest = digest(contentRow(live));
    const beforeDigest = digest(contentRow(before));
    const afterDigest = digest(contentRow(after));
    if (liveDigest === beforeDigest) beforeMatches += 1;
    else if (liveDigest === afterDigest) afterMatches += 1;
    else fail(`clean staged question ${questionNum} matches neither the approved before-image nor reviewed final row`);
    updates.push({ id: live.id, questionNum, before: live, after: { ...after, id: live.id } });
  }
  const missingExisting = approved.orderedExisting.filter(row => !current.has(row.questionNum));
  if (missingExisting.length !== existingCount - cleanCount) fail(`expected ${existingCount - cleanCount} missing reviewed existing rows; found ${missingExisting.length}`);
  const inserts = [...missingExisting, ...approved.orderedAdditions];
  if (updates.length + inserts.length !== finalCount) fail("release plan does not reconcile to the reviewed 907-row inventory");
  const liveBaselineDigest = digest(updates.map(update => ({ id: update.id, row: contentRow(update.before) })));
  const confirmationDigest = digest({
    releaseKey: RELEASE_KEY,
    archiveSha256: APPROVED_ARCHIVE_SHA256,
    liveBaselineDigest,
    beforeMatches,
    afterMatches,
    missingExisting: missingExisting.map(row => row.questionNum),
    additionRange: WPI_CLASS4_NEW_RANGE,
    metadata,
  });
  return {
    status: "ready", releaseKey: RELEASE_KEY, updates, inserts, missingExisting,
    beforeMatches, afterMatches, liveBaselineDigest, confirmationDigest, metadata,
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function loadPackageFromArgs() {
  const archivePath = argument("--archive");
  if (!archivePath) fail("pass --archive /private/WPI-Class-IV-Manus-Handoff-907-Questions.zip");
  const archiveSha256 = fileSha256(archivePath);
  const manifest = parseJsonFile(argument("--manifest"), "release manifest");
  const baselineRows = normalizeBaselinePayload(parseJsonFile(argument("--baseline"), "baseline payload"));
  const existingRows = normalizeExistingPayload(parseJsonFile(argument("--existing"), "reviewed existing payload"));
  const additionRows = normalizeNewPayload(parseJsonFile(argument("--additions"), "reviewed addition payload"));
  return validateApprovedPackage({ archiveSha256, manifest, baselineRows, existingRows, additionRows });
}
async function verifyRequiredTables(connection) {
  const [rows] = await connection.execute(
    "SELECT `TABLE_NAME` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA`=DATABASE() AND `TABLE_NAME` IN ('questions','question_bank_meta','question_content_snapshots')",
  );
  const names = new Set(rows.map(row => row.TABLE_NAME));
  for (const table of ["questions", "question_bank_meta", "question_content_snapshots"]) {
    if (!names.has(table)) fail(`required table ${table} is missing`);
  }
}
async function readLockedState(connection) {
  const [questions] = await connection.execute("SELECT * FROM `questions` WHERE `bankKey`=? ORDER BY `questionNum` FOR UPDATE", [BANK_KEY]);
  const [metadata] = await connection.execute("SELECT * FROM `question_bank_meta` WHERE `bankKey`=? FOR UPDATE", [BANK_KEY]);
  if (metadata.length > 1) fail("duplicate Treatment metadata rows exist");
  return { questions, metadata: metadata[0] ?? null };
}
function insertValues(row, reviewedAt) {
  const approved = { ...row, reviewStatus: "approved", reviewedBy: REVIEW_ACTOR, reviewedAt };
  return INSERT_FIELDS.map(field => approved[field] ?? null);
}
async function applyPlan(connection, plan) {
  const reviewedAt = new Date();
  for (const update of plan.updates) {
    const payload = snapshotPayload(update.before);
    await connection.execute(
      "INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)",
      [RELEASE_KEY, BANK_KEY, update.id, update.questionNum, 0, digest(payload), JSON.stringify(payload)],
    );
    const after = { ...update.after, reviewStatus: "approved", reviewedBy: REVIEW_ACTOR, reviewedAt };
    const [result] = await connection.execute(
      "UPDATE `questions` SET `module`=?,`difficulty`=?,`question`=?,`options`=?,`correctIndex`=?,`explanation`=?,`steps`=?,`tip`=?,`isCalc`=?,`topic`=?,`cognitiveLevel`=?,`sourceTitle`=?,`sourceReference`=?,`sourceUrl`=?,`blueprintObjective`=?,`reviewStatus`='approved',`reviewedBy`=?,`reviewedAt`=? WHERE `id`=? AND `bankKey`=? AND `questionNum`=?",
      [after.module, after.difficulty, after.question, canonicalJson(after.options, "update options"), Number(after.correctIndex), after.explanation,
        canonicalJson(after.steps, "update steps"), after.tip, after.isCalc, after.topic, after.cognitiveLevel, after.sourceTitle,
        after.sourceReference, after.sourceUrl, after.blueprintObjective, REVIEW_ACTOR, reviewedAt, update.id, BANK_KEY, update.questionNum],
    );
    if (result.affectedRows !== 1) fail(`question ${update.questionNum} was not updated exactly once`);
  }
  const placeholders = `(${INSERT_FIELDS.map(() => "?").join(",")})`;
  const insertSql = `INSERT INTO \`questions\` (${INSERT_FIELDS.map(field => `\`${field}\``).join(",")}) VALUES ${placeholders}`;
  for (const row of plan.inserts) await connection.execute(insertSql, insertValues(row, reviewedAt));
  const metadata = plan.metadata;
  await connection.execute(
    "INSERT INTO `question_bank_meta` (`bankKey`,`modules`,`moduleTargets`,`formulaLinks`,`totalQuestions`,`contentVersion`,`blueprintVersion`,`minCalcPerMock`,`recallTargetPct`) VALUES (?,?,?,?,?,?,?,?,?)",
    [metadata.bankKey, metadata.modules, metadata.moduleTargets, metadata.formulaLinks, metadata.totalQuestions,
      metadata.contentVersion, metadata.blueprintVersion, metadata.minCalcPerMock, metadata.recallTargetPct],
  );
}
async function verifyReleasedState(connection, approved) {
  const state = await readLockedState(connection);
  if (state.questions.length !== FINAL_COUNT) fail(`post-release inventory is ${state.questions.length}; expected ${FINAL_COUNT}`);
  if (digest(metadataComparable(state.metadata)) !== digest(PLANNED_METADATA)) fail("post-release metadata mismatch");
  const current = new Map(state.questions.map(row => [Number(row.questionNum), row]));
  for (const row of [...approved.orderedExisting, ...approved.orderedAdditions]) {
    const live = current.get(row.questionNum);
    if (!live || digest(contentRow(live)) !== digest(contentRow(row)) || live.reviewStatus !== "approved" || live.reviewedBy !== REVIEW_ACTOR) {
      fail(`post-release question ${row.questionNum} does not match the reviewed package`);
    }
  }
  const [snapshots] = await connection.execute("SELECT COUNT(*) AS count FROM `question_content_snapshots` WHERE `releaseKey`=?", [RELEASE_KEY]);
  if (Number(snapshots[0]?.count) !== CLEAN_STAGED_COUNT) fail("post-release before-image snapshot count mismatch");
}

async function runCli() {
  const approved = loadPackageFromArgs();
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is required for plan and apply modes");
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    await verifyRequiredTables(connection);
    const state = await readLockedState(connection);
    const plan = buildReleasePlan(state.questions, state.metadata, approved);
    if (plan.status === "already_released") {
      await connection.rollback();
      console.log(`${BANK_KEY} already matches ${RELEASE_KEY}; no changes made.`);
      return;
    }
    console.log(JSON.stringify({
      mode: process.argv.includes("--apply") ? "apply-requested" : "plan",
      bankKey: BANK_KEY,
      releaseKey: RELEASE_KEY,
      confirmationDigest: plan.confirmationDigest,
      existingRowsUpdated: plan.updates.length,
      missingReviewedRowsInserted: plan.missingExisting.length,
      additionsInserted: REVIEWED_ADDITION_COUNT,
      finalLearnerVisibleRows: FINAL_COUNT,
      baselineMatches: { before: plan.beforeMatches, alreadyFinal: plan.afterMatches },
      customerTablesTouched: [],
    }, null, 2));
    if (!process.argv.includes("--apply")) {
      await connection.rollback();
      console.log("Plan complete. Transaction rolled back; production was not changed.");
      return;
    }
    if (process.env.CONFIRM_WPI_TREATMENT_RELEASE !== plan.confirmationDigest) {
      fail(`set CONFIRM_WPI_TREATMENT_RELEASE=${plan.confirmationDigest} to confirm this exact clean baseline and package`);
    }
    if (!process.env.WPI_TREATMENT_BACKUP_EVIDENCE?.trim()) fail("WPI_TREATMENT_BACKUP_EVIDENCE is required");
    await applyPlan(connection, plan);
    await verifyReleasedState(connection, approved);
    await connection.commit();
    console.log(`Released ${FINAL_COUNT} WPI Class IV Wastewater Treatment questions under ${RELEASE_KEY}.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
