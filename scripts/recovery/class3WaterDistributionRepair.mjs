#!/usr/bin/env node
/** Safe, review-gated repair of the legacy Ontario Class III distribution bank.
 * Plan by default. Apply only after a fresh, exact live-state comparison.
 * This script does not mark new questions approved or overwrite customer data.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildCandidateQuestions } from "../../content/class3-water-dist/new-questions-2026-09-22.mjs";
import { buildRepairedQuestions } from "../../content/class3-water-dist/repaired-116-2026-09-22.mjs";

export const BANK = "class3-water-dist";
export const RELEASE = "class3-water-dist-repair-2026-09-22";
// Explicit law/AWWA claims in the September 19 bank plus the defective
// Q501-Q571 calculation block. All 116 receive answer-level replacements.
export const HELD_REGULATORY = [5, 23, 29, 37, 44, 58, 64, 85, 103, 106, 114, 126, 133, 153, 155, 164, 171, 181, 198, 210, 213, 228, 249, 259, 265, 269, 277, 289, 300, 311, 321, 323, 354, 366, 367, 374, 386, 391, 402, 405, 413, 436, 437, 444, 470];
export const HELD_NUMERIC = Array.from({ length: 71 }, (_, i) => 501 + i);
export const TARGETS = [...new Set([...HELD_REGULATORY, ...HELD_NUMERIC, 308, 447])].sort((a, b) => a - b);

const FIXES = {
  308: { correctIndex: 1, explanation: "Pipe volume = π × (0.300 m / 2)² × 500 m = 35.3429 m³ = 35,343 L. The target residual is irrelevant to the requested pipe volume." },
  447: { correctIndex: 1, explanation: "Average daily demand = 15,000,000 L ÷ 30 days ÷ 1,000 L/m³ = 500 m³/day." },
};

const sha = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const BACKUP_EVIDENCE_MAX_AGE_MS = 60 * 60 * 1000;
function fail(message) { throw new Error(`Class III distribution release blocked: ${message}`); }
export function optionsOf(row) {
  const options = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
  if (!Array.isArray(options)) fail("question options are not an array");
  return [...options];
}
const CONTENT_FIELDS = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt"];
function contentPayload(row) {
  if (!row) return null;
  return Object.fromEntries(CONTENT_FIELDS.map(key => [key, key === "options" ? optionsOf(row) : row[key] ?? null]));
}
export function fingerprint(row) {
  return sha([row.question, optionsOf(row), Number(row.correctIndex), row.explanation, row.steps ?? null]);
}
function normalizedStem(s) { return s.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

/**
 * Requires a fresh, operator-verified backup record tied to this exact plan.
 * The database host owns backup recoverability, so the operator must verify it
 * before supplying its immutable identifier and timestamp to this script.
 */
export function parseCurrentBackupEvidence(raw, planDigest, now = Date.now()) {
  if (!raw?.trim()) fail("current recoverable backup evidence is required");
  let evidence;
  try { evidence = JSON.parse(raw); }
  catch { fail("backup evidence must be JSON"); }
  if (evidence?.release !== RELEASE || evidence?.planDigest !== planDigest) {
    fail("backup evidence is not tied to this exact live plan");
  }
  if (typeof evidence.backupId !== "string" || !evidence.backupId.trim()) {
    fail("backup evidence is missing its verified backup identifier");
  }
  if (
    typeof evidence.backedUpAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(evidence.backedUpAt)
  ) {
    fail("backup evidence timestamp must be an ISO-8601 time with timezone");
  }
  const backedUpAt = Date.parse(evidence.backedUpAt);
  if (!Number.isFinite(backedUpAt) || backedUpAt > now || now - backedUpAt > BACKUP_EVIDENCE_MAX_AGE_MS) {
    fail("backup evidence is missing, future-dated, or older than one hour");
  }
  return { backupId: evidence.backupId.trim(), backedUpAt: new Date(backedUpAt).toISOString() };
}

/** Fetches only the Class 3 baseline. Locks are used only for an explicit apply. */
export async function readLiveBaseline(connection, lockForApply) {
  const lock = lockForApply ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(`SELECT * FROM \`questions\` WHERE \`bankKey\`=? ORDER BY \`questionNum\`${lock}`, [BANK]);
  const [metas] = await connection.execute(`SELECT * FROM \`question_bank_meta\` WHERE \`bankKey\`=?${lock}`, [BANK]);
  return { rows, metas };
}

/** Default plans are read-only and do not acquire row locks. */
export async function beginReadOnlyPlanTransaction(connection) {
  await connection.query("SET TRANSACTION READ ONLY");
  await connection.beginTransaction();
}

export function buildPlan(live, manifest, metadata = null) {
  if (!Array.isArray(live) || live.length !== 571) fail(`expected 571 live rows, got ${live?.length}`);
  if (metadata && (metadata.bankKey !== BANK || Number(metadata.totalQuestions) !== 571)) fail("bank metadata differs from the 571-row baseline");
  if (manifest?.bankKey !== BANK || manifest?.release !== RELEASE || manifest?.targets?.length !== TARGETS.length) fail("invalid manifest");
  const current = new Map();
  const rowIds = new Set();
  for (const row of live) {
    const questionNum = Number(row.questionNum);
    const rowId = Number(row.id);
    if (row.bankKey !== BANK || !Number.isInteger(questionNum) || questionNum < 1 || questionNum > 571 || current.has(questionNum)) fail("duplicate, out-of-range, or foreign live row");
    if (!Number.isInteger(rowId) || rowId <= 0 || rowIds.has(rowId)) fail("duplicate or invalid live row id");
    current.set(questionNum, row);
    rowIds.add(rowId);
  }
  for (let questionNum = 1; questionNum <= 571; questionNum++) {
    if (!current.has(questionNum)) fail(`missing baseline question ${questionNum}`);
  }
  const additions = buildCandidateQuestions();
  const repaired = buildRepairedQuestions(live);
  const repairedByNumber = new Map(repaired.map(item => [Number(item.questionNum), item]));
  if (repaired.length !== TARGETS.length - 2 || repairedByNumber.size !== repaired.length) fail("repair payload does not cover exactly 116 rows");
  const finalStems = new Set([...current.values()]
    .filter(row => !repairedByNumber.has(Number(row.questionNum)))
    .map(row => normalizedStem(row.question)));
  for (const item of repaired) {
    const stem = normalizedStem(item.question);
    if (!stem || finalStems.has(stem)) fail(`duplicate repaired stem at ${item.questionNum}`);
    finalStems.add(stem);
    const options = optionsOf(item);
    if (item.reviewStatus !== "in_review" || options.length !== 4 || new Set(options.map(x => x.trim().toLowerCase())).size !== 4 || options[item.correctIndex] === undefined) fail(`invalid repair ${item.questionNum}`);
    if (!item.explanation?.trim() || !item.sourceTitle?.trim() || !item.sourceReference?.trim() || !item.sourceUrl?.startsWith("https://")) fail(`missing repair evidence ${item.questionNum}`);
  }
  for (const item of additions) {
    if (current.has(item.questionNum)) fail(`reserved addition number ${item.questionNum} is occupied`);
    const stem = normalizedStem(item.question);
    if (!stem || finalStems.has(stem)) fail(`duplicate stem at ${item.questionNum}`);
    finalStems.add(stem);
    if (item.reviewStatus !== "in_review" || item.options.length !== 4 || new Set(item.options).size !== 4 || item.options[item.correctIndex] === undefined) fail(`invalid addition ${item.questionNum}`);
  }
  const changes = [];
  for (const num of TARGETS) {
    const row = current.get(num);
    const pinned = manifest.targets.find(item => item.questionNum === num);
    if (!row || !pinned || Number(row.id) !== pinned.id || fingerprint(row) !== pinned.fingerprint) fail(`live row ${num} differs from September 19 baseline; reconcile before applying`);
    if (row.reviewStatus === "rejected") fail(`target row ${num} is rejected in live state; reconcile before applying`);
    let next = { ...row };
    const fix = FIXES[num];
    if (fix) {
      if (fix.question) next.question = fix.question;
      if (fix.correctIndex !== undefined) next.correctIndex = fix.correctIndex;
      if (fix.answer) {
        const options = optionsOf(row);
        options[Number(row.correctIndex)] = fix.answer;
        next.options = options;
      }
      next.explanation = fix.explanation;
      next.steps = null; // Legacy steps contain contradicting and invented arithmetic.
      next.cognitiveLevel = "application";
      next.sourceTitle = "Independent arithmetic check; WPI 2025 Class III topic map";
      next.sourceReference = "Numerical derivation shown in the revised explanation; jurisdictional review pending.";
      next.sourceUrl = "https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-3_mh-fin.pdf";
      next.blueprintObjective = "Distribution system calculation and operational analysis";
    } else {
      const replacement = repairedByNumber.get(num);
      if (!replacement) fail(`missing reviewed replacement ${num}`);
      next = { ...replacement, id: row.id, bankKey: row.bankKey, questionNum: row.questionNum };
    }
    // The two simple corrected-key items stay visible as explicitly unreviewed.
    // The 116 fully rewritten rows stay held for independent SME approval.
    next.reviewStatus = num === 308 || num === 447 ? "unreviewed" : "in_review";
    next.reviewedBy = null; next.reviewedAt = null;
    changes.push({ before: row, after: next });
  }
  const planDigest = sha({ release: RELEASE, metaVersion: metadata?.contentVersion ?? null, baseline: changes.map(x => [x.before.id, fingerprint(x.before), x.before.reviewStatus]), repairs: repaired.map(x => [x.questionNum, x.question, x.options, x.correctIndex, x.explanation, x.sourceReference]), additions: additions.map(x => [x.questionNum, x.question, x.options, x.correctIndex]) });
  return { changes, additions, planDigest, repaired: repaired.length, held: repaired.length, correctedVisible: Object.keys(FIXES).length };
}

async function run() {
  const args = process.argv.slice(2);
  const manifestPath = args[args.indexOf("--manifest") + 1];
  if (!manifestPath || manifestPath.startsWith("--")) fail("pass --manifest path");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const snapshotIndex = args.indexOf("--snapshot");
  if (snapshotIndex !== -1) {
    const rows = JSON.parse(readFileSync(args[snapshotIndex + 1], "utf8"));
    const plan = buildPlan(rows, manifest);
    console.log(JSON.stringify({ mode: "offline-plan", changes: plan.changes.length, repairedInReview: plan.repaired, correctedVisible: plan.correctedVisible, additionsInReview: plan.additions.length, planDigest: plan.planDigest }, null, 2));
    return;
  }
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is required for live plan/apply");
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const apply = args.includes("--apply");
  try {
    if (apply) await connection.beginTransaction();
    else await beginReadOnlyPlanTransaction(connection);
    const { rows, metas } = await readLiveBaseline(connection, apply);
    if (metas.length !== 1) fail("expected one bank metadata row");
    const plan = buildPlan(rows, manifest, metas[0]);
    console.log(JSON.stringify({ mode: apply ? "apply-requested" : "live-plan", changes: plan.changes.length, repairedInReview: plan.repaired, correctedVisible: plan.correctedVisible, additionsInReview: plan.additions.length, planDigest: plan.planDigest }, null, 2));
    if (!apply) { await connection.rollback(); return; }
    if (process.env.CONFIRM_CLASS3_DISTRIBUTION_REPAIR !== plan.planDigest) fail("confirmation digest does not match this exact live plan");
    parseCurrentBackupEvidence(process.env.CLASS3_REPAIR_BACKUP_EVIDENCE, plan.planDigest);
    for (const { before, after } of plan.changes) {
      const beforeImage = contentPayload(before);
      const [captured] = await connection.execute("INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)", [RELEASE, BANK, before.id, before.questionNum, Number(metas[0].contentVersion), sha(beforeImage), JSON.stringify(beforeImage)]);
      if (captured.affectedRows !== 1) fail(`before-image capture failed at ${before.questionNum}`);
      const [res] = await connection.execute("UPDATE `questions` SET `module`=?,`difficulty`=?,`question`=?,`options`=?,`correctIndex`=?,`explanation`=?,`steps`=?,`tip`=?,`isCalc`=?,`topic`=?,`cognitiveLevel`=?,`sourceTitle`=?,`sourceReference`=?,`sourceUrl`=?,`blueprintObjective`=?,`reviewStatus`=?,`reviewedBy`=NULL,`reviewedAt`=NULL WHERE `id`=? AND `bankKey`=? AND `questionNum`=?", [after.module, after.difficulty, after.question, JSON.stringify(optionsOf(after)), after.correctIndex, after.explanation, after.steps, after.tip, after.isCalc, after.topic, after.cognitiveLevel, after.sourceTitle, after.sourceReference, after.sourceUrl, after.blueprintObjective, after.reviewStatus, before.id, BANK, before.questionNum]);
      if (res.affectedRows !== 1) fail(`update failed at ${before.questionNum}`);
    }
    const fields = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt"];
    const sql = `INSERT INTO \`questions\` (${fields.map(x => `\`${x}\``).join(",")}) VALUES (${fields.map(() => "?").join(",")})`;
    for (const item of plan.additions) {
      const values = fields.map(field => field === "options" ? JSON.stringify(item.options) : item[field] ?? null);
      await connection.execute(sql, values);
    }
    const [metaUpdate] = await connection.execute("UPDATE `question_bank_meta` SET `totalQuestions`=821,`contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `totalQuestions`=571 AND `contentVersion`=?", [BANK, metas[0].contentVersion]);
    if (metaUpdate.affectedRows !== 1) fail("bank metadata update failed");
    const [postRows] = await connection.execute("SELECT * FROM `questions` WHERE `bankKey`=? ORDER BY `questionNum`", [BANK]);
    if (postRows.length !== 821) fail("post-write question count mismatch");
    const postByNumber = new Map(postRows.map(row => [Number(row.questionNum), row]));
    for (const { after } of plan.changes) {
      if (JSON.stringify(contentPayload(postByNumber.get(Number(after.questionNum)))) !== JSON.stringify(contentPayload(after))) fail(`post-write repair mismatch at ${after.questionNum}`);
    }
    for (const expected of plan.additions) {
      if (JSON.stringify(contentPayload(postByNumber.get(Number(expected.questionNum)))) !== JSON.stringify(contentPayload(expected))) fail(`post-write addition mismatch at ${expected.questionNum}`);
    }
    const held = postRows.filter(row => row.reviewStatus === "in_review").length;
    if (held < 366) fail("post-write review hold mismatch");
    await connection.commit();
    console.log("Committed 116 repaired in-review rows, 250 in-review additions, and two corrected visible rows.");
  } catch (error) { await connection.rollback(); throw error; }
  finally { await connection.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
