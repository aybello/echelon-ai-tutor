#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const BANK_KEY = "wpi-class4-wastewater-coll";
export const COURSE_KEY = "wpi-class4-water-coll";
export const QUESTION_COUNT = 503;
export const PACKAGE_DIGEST = "e5aaa005de5231f58c6715a618837d2d6561d82b9a18967c12ffdb90b104268a";
export const RELEASE_KEY = `wpi-class4-collection-${PACKAGE_DIGEST.slice(0, 12)}`;
export const MODULES = [
  "Equipment Operation, Evaluation & Maintenance",
  "Collection System O&M & Restoration",
  "Lift Station Operation & Maintenance",
  "Collection System Monitoring, Evaluation & Adjustment",
  "Security, Safety & Administrative Procedures",
];
export const MODULE_TARGETS = Object.freeze({
  [MODULES[0]]: 23,
  [MODULES[1]]: 23,
  [MODULES[2]]: 16,
  [MODULES[3]]: 20,
  [MODULES[4]]: 18,
});
export const PLANNED_METADATA = Object.freeze({
  bankKey: BANK_KEY,
  modules: JSON.stringify(MODULES),
  moduleTargets: JSON.stringify(MODULE_TARGETS),
  formulaLinks: null,
  totalQuestions: QUESTION_COUNT,
  contentVersion: 1,
  blueprintVersion: 2025,
  minCalcPerMock: 16,
  recallTargetPct: 20,
});

const PRESERVED_FIELDS = ["bankKey", "questionNum", "correctIndex", "difficulty"];
const CONTENT_FIELDS = [
  "module", "question", "options", "explanation", "steps", "tip", "isCalc", "topic",
  "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective",
];
const COMPARISON_FIELDS = [...PRESERVED_FIELDS, ...CONTENT_FIELDS];
const SNAPSHOT_FIELDS = [...COMPARISON_FIELDS, "reviewStatus", "reviewedBy", "reviewedAt"];

function fail(message) { throw new Error(`WPI Class IV Collection release blocked: ${message}`); }
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
function canonicalJson(value, label) {
  if (value === undefined || value === null || value === "") return null;
  try { return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value); }
  catch { fail(`${label} is not valid JSON`); }
}
function normalizedField(field, value, label) {
  if (field === "options" || field === "steps") return canonicalJson(value, label);
  return canonical(value);
}
export function comparableRow(row) {
  return Object.fromEntries(COMPARISON_FIELDS.map(field => [
    field,
    normalizedField(field, row[field], `${row.bankKey ?? "unknown"}#${row.questionNum ?? "unknown"} ${field}`),
  ]));
}
export function snapshotPayload(row) {
  return Object.fromEntries(SNAPSHOT_FIELDS.map(field => [field, canonical(row[field])]));
}
function rowsByNumber(rows, label) {
  if (!Array.isArray(rows) || rows.length !== QUESTION_COUNT) fail(`${label} must contain exactly ${QUESTION_COUNT} rows`);
  const map = new Map();
  for (const row of rows) {
    if (row.bankKey !== BANK_KEY || !Number.isInteger(row.questionNum) || row.questionNum < 1 || row.questionNum > QUESTION_COUNT) {
      fail(`${label} contains an invalid bank or question number`);
    }
    if (map.has(row.questionNum)) fail(`${label} contains duplicate question ${row.questionNum}`);
    map.set(row.questionNum, row);
  }
  for (let number = 1; number <= QUESTION_COUNT; number += 1) {
    if (!map.has(number)) fail(`${label} is missing question ${number}`);
  }
  return map;
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
export function buildReleasePlan(currentRows, repairPackage, currentMetadata = null) {
  const current = rowsByNumber(currentRows, "current staged bank");
  const patches = Array.isArray(repairPackage?.patches) ? repairPackage.patches : [];
  if (patches.length !== QUESTION_COUNT) fail(`repair package must contain ${QUESTION_COUNT} patches`);
  const patchMap = new Map();
  for (const patch of patches) {
    if (!Number.isInteger(patch?.questionNum) || patchMap.has(patch.questionNum) || !patch.before || !patch.after) {
      fail("repair package has invalid or duplicate patches");
    }
    patchMap.set(patch.questionNum, patch);
  }

  const alreadyReleased = [...current.values()].every(row => {
    const patch = patchMap.get(row.questionNum);
    return patch && digest(comparableRow(row)) === digest(comparableRow(patch.after)) &&
      row.reviewStatus === "approved" && row.reviewedBy === `batch-release:${RELEASE_KEY}` && row.reviewedAt;
  }) && digest(metadataComparable(currentMetadata)) === digest(PLANNED_METADATA);
  if (alreadyReleased) {
    return { status: "already_released", bankKey: BANK_KEY, releaseKey: RELEASE_KEY, updates: [], liveBaselineDigest: null };
  }
  if (currentMetadata) fail("unexpected Collection metadata exists; reconcile it before first clean-database release");

  const updates = [];
  for (let number = 1; number <= QUESTION_COUNT; number += 1) {
    const live = current.get(number);
    const patch = patchMap.get(number);
    if (!patch) fail(`repair package is missing question ${number}`);
    if (live.reviewStatus !== "in_review" || live.reviewedBy !== null || live.reviewedAt !== null) {
      fail(`question ${number} is not in the untouched quarantine state`);
    }
    for (const field of PRESERVED_FIELDS) {
      if (normalizedField(field, patch.before[field], `package before ${field}`) !== normalizedField(field, patch.after[field], `package after ${field}`)) {
        fail(`repair package changes preserved field ${field} for question ${number}`);
      }
    }
    if (digest(comparableRow(live)) !== digest(comparableRow(patch.before))) {
      fail(`question ${number} no longer matches the reviewed historical baseline`);
    }
    const after = { ...live };
    for (const field of CONTENT_FIELDS) after[field] = patch.after[field] ?? null;
    after.reviewStatus = "approved";
    after.reviewedBy = `batch-release:${RELEASE_KEY}`;
    after.reviewedAt = null;
    updates.push({ id: live.id, questionNum: number, before: live, after });
  }

  const liveBaselineDigest = digest(updates.map(update => ({ id: update.id, row: comparableRow(update.before) })));
  const confirmationDigest = digest({
    releaseKey: RELEASE_KEY,
    packageDigest: repairPackage.contentSha256,
    liveBaselineDigest,
    metadata: PLANNED_METADATA,
    updateCount: updates.length,
  });
  return { status: "ready", bankKey: BANK_KEY, releaseKey: RELEASE_KEY, updates, liveBaselineDigest, confirmationDigest };
}

async function loadValidatedPackage(packagePath) {
  if (!packagePath) fail("pass --package /private/collection-historical-repair.json");
  const repairPackage = JSON.parse(readFileSync(packagePath, "utf8"));
  const { validateCompletedRepair } = await import("../lib/collectionReview.mjs");
  validateCompletedRepair(repairPackage);
  if (repairPackage.contentSha256 !== PACKAGE_DIGEST) fail("repair package digest is not the approved September 15 revision");
  return repairPackage;
}
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
async function readLockedState(connection) {
  const [questions] = await connection.execute(
    "SELECT * FROM `questions` WHERE `bankKey` = ? ORDER BY `questionNum` FOR UPDATE",
    [BANK_KEY],
  );
  const [metadata] = await connection.execute(
    "SELECT * FROM `question_bank_meta` WHERE `bankKey` = ? FOR UPDATE",
    [BANK_KEY],
  );
  if (metadata.length > 1) fail("duplicate Collection metadata rows exist");
  return { questions, metadata: metadata[0] ?? null };
}
async function verifyRequiredTables(connection) {
  const [rows] = await connection.execute(
    "SELECT `TABLE_NAME` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` IN ('questions','question_bank_meta','question_content_snapshots')",
  );
  const tables = new Set(rows.map(row => row.TABLE_NAME));
  for (const table of ["questions", "question_bank_meta", "question_content_snapshots"]) {
    if (!tables.has(table)) fail(`required table ${table} is missing`);
  }
}
async function applyPlan(connection, plan) {
  const releaseTimestamp = new Date();
  for (const update of plan.updates) {
    const payload = snapshotPayload(update.before);
    await connection.execute(
      "INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)",
      [RELEASE_KEY, BANK_KEY, update.id, update.questionNum, 0, digest(payload), JSON.stringify(payload)],
    );
    const after = update.after;
    const [result] = await connection.execute(
      "UPDATE `questions` SET `module`=?,`question`=?,`options`=?,`explanation`=?,`steps`=?,`tip`=?,`isCalc`=?,`topic`=?,`cognitiveLevel`=?,`sourceTitle`=?,`sourceReference`=?,`sourceUrl`=?,`blueprintObjective`=?,`reviewStatus`='approved',`reviewedBy`=?,`reviewedAt`=? WHERE `id`=? AND `bankKey`=? AND `questionNum`=?",
      [after.module, after.question, after.options, after.explanation, after.steps, after.tip, after.isCalc, after.topic,
        after.cognitiveLevel, after.sourceTitle, after.sourceReference, after.sourceUrl, after.blueprintObjective,
        `batch-release:${RELEASE_KEY}`, releaseTimestamp, update.id, BANK_KEY, update.questionNum],
    );
    if (result.affectedRows !== 1) fail(`question ${update.questionNum} was not updated exactly once`);
  }
  const metadata = PLANNED_METADATA;
  await connection.execute(
    "INSERT INTO `question_bank_meta` (`bankKey`,`modules`,`moduleTargets`,`formulaLinks`,`totalQuestions`,`contentVersion`,`blueprintVersion`,`minCalcPerMock`,`recallTargetPct`) VALUES (?,?,?,?,?,?,?,?,?)",
    [metadata.bankKey, metadata.modules, metadata.moduleTargets, metadata.formulaLinks, metadata.totalQuestions,
      metadata.contentVersion, metadata.blueprintVersion, metadata.minCalcPerMock, metadata.recallTargetPct],
  );
}

async function runCli() {
  const repairPackage = await loadValidatedPackage(argument("--package"));
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is required for both plan and apply modes");
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    await verifyRequiredTables(connection);
    const state = await readLockedState(connection);
    const plan = buildReleasePlan(state.questions, repairPackage, state.metadata);
    if (plan.status === "already_released") {
      await connection.rollback();
      console.log(`${BANK_KEY} already matches ${RELEASE_KEY}; no changes made.`);
      return;
    }
    console.log(`Release plan ${plan.confirmationDigest}: ${QUESTION_COUNT} repaired questions, WPI 2025 Collection blueprint, no customer data.`);
    if (!process.argv.includes("--apply")) {
      await connection.rollback();
      console.log("Plan complete. Transaction rolled back; production was not changed.");
      return;
    }
    if (process.env.CONFIRM_WPI_COLLECTION_RELEASE !== plan.confirmationDigest) {
      fail(`set CONFIRM_WPI_COLLECTION_RELEASE=${plan.confirmationDigest} to confirm this exact live baseline and package`);
    }
    if (!process.env.WPI_COLLECTION_BACKUP_EVIDENCE?.trim()) fail("WPI_COLLECTION_BACKUP_EVIDENCE is required");
    await applyPlan(connection, plan);
    const after = await readLockedState(connection);
    const verified = buildReleasePlan(after.questions, repairPackage, after.metadata);
    if (verified.status !== "already_released") fail("post-release verification failed");
    await connection.commit();
    console.log(`Released ${QUESTION_COUNT} WPI Class IV Wastewater Collection questions under ${RELEASE_KEY}.`);
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
