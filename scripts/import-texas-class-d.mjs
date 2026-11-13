/**
 * Texas Class D Water question-bank importer.
 *
 * This additive importer stages 120 frontier-reviewed original questions under
 * `in_review`. The learner visibility filter hides that status, so staging does
 * not make a course accessible, purchasable or visible to a learner. A separate
 * approved release step is required before the course can be activated.
 *
 * Modes:
 *   check     validates the immutable package without a database connection
 *   preflight validates package and target inventory inside a rolled-back read
 *   apply     inserts the exact package in one guarded transaction
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";

const PACKAGE_PATH = process.env.TEXAS_CLASS_D_PACKAGE_PATH
  ?? path.resolve(import.meta.dirname, "../content/us-texas-class-d-water/texas-class-d-reviewed-package.json");
const RELEASE_DIR = process.env.TEXAS_CLASS_D_RELEASE_DIR ?? "/home/ubuntu/texas_class_d_import_release";
const BANK_KEY = "us-texas-class-d-water";
const EXPECTED_TOTAL = 120;
const EXPECTED_MODULES = [
  "Rules, licensing and records",
  "Safety and operator responsibilities",
  "Source water and general water quality",
  "Groundwater systems",
  "Surface water treatment",
  "Storage and distribution",
  "Disinfection",
  "Water utility math",
];
const CALC_STEP_LABELS = ["Target", "Given", "Formula and why", "Unit conversions", "Substitute and calculate", "Answer", "Check"];
const SOURCE_URL = "https://www.tceq.texas.gov/licensing/licenses/waterworksntk";
const mode = process.argv[2] ?? "check";
if (!new Set(["check", "preflight", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/import-texas-class-d.mjs [check|preflight|apply]");
}

const bytes = fs.readFileSync(PACKAGE_PATH);
const packageChecksum = crypto.createHash("sha256").update(bytes).digest("hex");
const pkg = JSON.parse(bytes.toString("utf8"));

function writeResult(name, result) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const outputPath = path.join(RELEASE_DIR, name);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return outputPath;
}

function validatePackage() {
  const errors = [];
  if (pkg?.schemaVersion !== 1) errors.push("Expected package schemaVersion 1.");
  if (pkg?.status !== "frontier-reviewed-content-ready-for-governed-staging") errors.push("Package status is not governed-staging ready.");
  if (pkg?.bank?.bankKey !== BANK_KEY) errors.push(`Unexpected bank key ${pkg?.bank?.bankKey}.`);
  if (pkg?.bank?.totalQuestions !== EXPECTED_TOTAL) errors.push("Package metadata total is incorrect.");
  if (!Array.isArray(pkg?.questions) || pkg.questions.length !== EXPECTED_TOTAL) errors.push(`Expected ${EXPECTED_TOTAL} questions.`);
  if (JSON.stringify(pkg?.bank?.modules) !== JSON.stringify(EXPECTED_MODULES)) errors.push("Package modules differ from the governed Texas Class D outline.");

  const numbers = new Set();
  const stems = new Set();
  const byModule = new Map(EXPECTED_MODULES.map((module) => [module, 0]));
  const answers = [0, 0, 0, 0];
  let calculations = 0;
  let reviewed = 0;
  for (const row of pkg.questions ?? []) {
    const label = `Texas Class D #${row.questionNum}`;
    if (row.bankKey !== BANK_KEY) errors.push(`${label}: bank key mismatch.`);
    if (!Number.isInteger(row.questionNum) || row.questionNum < 1 || row.questionNum > EXPECTED_TOTAL || numbers.has(row.questionNum)) errors.push(`${label}: invalid or duplicate question number.`);
    numbers.add(row.questionNum);
    if (!EXPECTED_MODULES.includes(row.module)) errors.push(`${label}: unsupported module.`);
    else byModule.set(row.module, (byModule.get(row.module) ?? 0) + 1);
    const stem = String(row.question ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!stem || stems.has(stem)) errors.push(`${label}: blank or duplicate stem.`);
    stems.add(stem);
    if (!Array.isArray(row.options) || row.options.length !== 4 || new Set(row.options).size !== 4) errors.push(`${label}: options must contain four distinct values.`);
    if (!Number.isInteger(row.correctIndex) || row.correctIndex < 0 || row.correctIndex > 3) errors.push(`${label}: invalid correctIndex.`);
    else answers[row.correctIndex] += 1;
    for (const field of ["question", "explanation", "tip", "topic", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"]) {
      if (!row[field]) errors.push(`${label}: missing ${field}.`);
      if (typeof row[field] === "string" && row[field].includes("—")) errors.push(`${label}: learner-facing content contains an em dash.`);
    }
    if (row.sourceUrl !== SOURCE_URL) errors.push(`${label}: source URL does not match the verified Texas scope.`);
    if (!["recall", "application"].includes(row.cognitiveLevel)) errors.push(`${label}: invalid cognitive level.`);
    if (!["yes", "no"].includes(row.isCalc)) errors.push(`${label}: invalid calculation flag.`);
    if (row.isCalc === "yes") {
      calculations += 1;
      if (!Array.isArray(row.steps) || row.steps.length !== CALC_STEP_LABELS.length || row.steps.some((step, index) => step?.l !== CALC_STEP_LABELS[index] || typeof step?.c !== "string" || !step.c.trim())) {
        errors.push(`${label}: calculation needs the seven governed worked steps.`);
      }
    } else if (row.steps !== null) {
      errors.push(`${label}: non-calculation row must have null steps.`);
    }
    if (row.finalReviewStatus === "review_pass") reviewed += 1;
  }
  for (const [module, count] of byModule) if (count !== 15) errors.push(`${module}: expected 15 questions, found ${count}.`);
  if (calculations !== 15) errors.push(`Expected 15 calculation questions, found ${calculations}.`);
  if (reviewed !== EXPECTED_TOTAL) errors.push(`Expected ${EXPECTED_TOTAL} final-review-pass rows, found ${reviewed}.`);
  if (!answers.every((count) => count === EXPECTED_TOTAL / 4)) errors.push(`Answer positions must be balanced 30/30/30/30, found ${answers.join("/")}.`);
  return errors;
}

const validationErrors = validatePackage();
if (validationErrors.length) {
  console.error("Texas Class D package validation FAILED:");
  for (const error of validationErrors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`Texas Class D package ${packageChecksum}`);
console.log(`Validation passed: ${EXPECTED_TOTAL} reviewed rows, 8 modules, 15 calculations, balanced answer positions.`);
if (mode === "check") {
  console.log("Check mode only. No database connection was attempted.");
  process.exit(0);
}

const target = activeScriptConnection();
console.log(`Target: ${target.description}`);
if (mode === "apply" && process.env.CONFIRM_TEXAS_CLASS_D_IMPORT !== packageChecksum) {
  throw new Error(`Apply blocked. Set CONFIRM_TEXAS_CLASS_D_IMPORT=${packageChecksum} to confirm this exact package.`);
}

async function captureBaseline(connection) {
  const [bankCounts] = await connection.execute("SELECT bankKey, COUNT(*) AS n FROM questions GROUP BY bankKey ORDER BY bankKey");
  const [meta] = await connection.execute("SELECT bankKey, totalQuestions, contentVersion, blueprintVersion FROM question_bank_meta ORDER BY bankKey");
  const [attempts] = await connection.execute("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN `correct` THEN 1 ELSE 0 END), 0) AS correct FROM question_attempts");
  return { bankCounts, meta, attempts: { n: Number(attempts[0].n), correct: Number(attempts[0].correct) } };
}
function fingerprint(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

const connection = await mysql.createConnection(target.options);
try {
  await connection.beginTransaction();
  const before = await captureBaseline(connection);
  const [existing] = await connection.execute("SELECT COUNT(*) AS n FROM questions WHERE bankKey = ?", [BANK_KEY]);
  const [metaExisting] = await connection.execute("SELECT COUNT(*) AS n FROM question_bank_meta WHERE bankKey = ?", [BANK_KEY]);
  if (Number(existing[0].n) !== 0 || Number(metaExisting[0].n) !== 0) throw new Error("Texas Class D bank or metadata already exists. This importer is create-only.");

  if (mode === "preflight") {
    await connection.rollback();
    const result = { mode: "read_only_preflight", ready: true, packageChecksum, target: target.description, stagedReviewStatus: "in_review", learnerVisible: false };
    console.log(JSON.stringify({ outputPath: writeResult("texas-class-d-preflight.json", result), ...result }, null, 2));
    process.exit(0);
  }

  const columns = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"];
  const columnSql = columns.map((column) => `\`${column}\``).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  for (const row of pkg.questions) {
    await connection.execute(
      `INSERT INTO questions (${columnSql}, \`reviewStatus\`) VALUES (${placeholders}, 'in_review')`,
      [row.bankKey, row.questionNum, row.module, row.difficulty, row.question, JSON.stringify(row.options), row.correctIndex, row.explanation, row.steps ? JSON.stringify(row.steps) : null, row.tip, row.isCalc, row.topic, row.cognitiveLevel, row.sourceTitle, row.sourceReference, row.sourceUrl, row.blueprintObjective],
    );
  }
  await connection.execute(
    "INSERT INTO question_bank_meta (`bankKey`, `modules`, `moduleTargets`, `formulaLinks`, `totalQuestions`, `contentVersion`, `blueprintVersion`, `minCalcPerMock`, `recallTargetPct`) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)",
    [BANK_KEY, JSON.stringify(pkg.bank.modules), JSON.stringify(pkg.bank.moduleTargets), null, EXPECTED_TOTAL, pkg.bank.blueprintVersion, pkg.bank.minCalcPerMock, pkg.bank.recallTargetPct],
  );
  const [stored] = await connection.execute("SELECT questionNum, reviewStatus FROM questions WHERE bankKey = ? ORDER BY questionNum", [BANK_KEY]);
  if (stored.length !== EXPECTED_TOTAL || stored.some((row, index) => Number(row.questionNum) !== index + 1 || row.reviewStatus !== "in_review")) throw new Error("Post-insert Texas Class D review staging verification failed.");
  const [storedMeta] = await connection.execute("SELECT totalQuestions, blueprintVersion FROM question_bank_meta WHERE bankKey = ?", [BANK_KEY]);
  if (storedMeta.length !== 1 || Number(storedMeta[0].totalQuestions) !== EXPECTED_TOTAL || Number(storedMeta[0].blueprintVersion) !== pkg.bank.blueprintVersion) throw new Error("Post-insert Texas Class D metadata verification failed.");
  const after = await captureBaseline(connection);
  const strip = (snapshot) => ({
    bankCounts: snapshot.bankCounts.filter((row) => row.bankKey !== BANK_KEY),
    meta: snapshot.meta.filter((row) => row.bankKey !== BANK_KEY),
    attempts: snapshot.attempts,
  });
  if (fingerprint(strip(before)) !== fingerprint(strip(after))) throw new Error("Existing banks, metadata or learner attempts changed during Texas staging.");
  await connection.commit();
  const result = { applied: true, packageChecksum, target: target.description, inserted: EXPECTED_TOTAL, reviewStatus: "in_review", learnerVisible: false, note: "Staged only. A separate governed release is required before any learner access or checkout." };
  console.log(JSON.stringify({ outputPath: writeResult("texas-class-d-apply-result.json", result), ...result }, null, 2));
} catch (error) {
  await connection.rollback();
  console.error(`Rolled back: ${error.message}`);
  throw error;
} finally {
  await connection.end();
}
