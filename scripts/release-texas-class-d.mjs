import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";

const BANK_KEY = "us-texas-class-d-water";
const REVIEW_ACTOR = "owner-approved:texas-class-d-water-2026-10-11";
const PACKAGE_PATH = resolve("content/us-texas-class-d-water/texas-class-d-reviewed-package.json");
const apply = process.argv.includes("--apply");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pkg = JSON.parse(await readFile(PACKAGE_PATH, "utf8"));
const rows = Array.isArray(pkg.questions) ? pkg.questions : Array.isArray(pkg.rows) ? pkg.rows : [];
assert(rows.length === 120, `Expected 120 reviewed Texas questions, found ${rows.length}.`);
const numbers = rows.map((row) => Number(row.questionNum));
assert(new Set(numbers).size === 120 && numbers.every((number, index) => number === index + 1), "Texas question numbers must be exactly 1 through 120.");
for (const row of rows) {
  assert(row.bankKey === BANK_KEY, `Unexpected bank key for question ${row.questionNum}.`);
  assert(Array.isArray(row.options) && row.options.length === 4, `Question ${row.questionNum} must have four options.`);
  assert(Number.isInteger(row.correctIndex) && row.correctIndex >= 0 && row.correctIndex < 4, `Question ${row.questionNum} has an invalid answer index.`);
  assert(!JSON.stringify(row).includes("—"), `Question ${row.questionNum} contains an em dash.`);
  assert(typeof row.sourceUrl === "string" && row.sourceUrl.startsWith("https://"), `Question ${row.questionNum} is missing an HTTPS source URL.`);
}

const target = activeScriptConnection();
const connection = await mysql.createConnection(target.options);
let transactionOpen = false;
try {
  await connection.beginTransaction();
  transactionOpen = true;
  const [rowsBefore] = await connection.execute(
    "SELECT id, questionNum, reviewStatus, reviewedBy, reviewedAt FROM questions WHERE bankKey = ? ORDER BY questionNum FOR UPDATE",
    [BANK_KEY],
  );
  assert(rowsBefore.length === 120, `Expected 120 staged rows in ${target.description}, found ${rowsBefore.length}.`);
  assert(rowsBefore.every((row) => row.reviewStatus === "in_review" && row.reviewedBy == null && row.reviewedAt == null), "Every Texas row must be untouched in_review before release.");
  const [metaRows] = await connection.execute(
    "SELECT totalQuestions, contentVersion FROM question_bank_meta WHERE bankKey = ? FOR UPDATE",
    [BANK_KEY],
  );
  assert(metaRows.length === 1, "Texas question-bank metadata is missing.");

  if (!apply) {
    await connection.rollback();
    transactionOpen = false;
    console.log(JSON.stringify({ mode: "preflight", target: target.description, bankKey: BANK_KEY, stagedQuestions: rowsBefore.length, metadata: metaRows[0], transaction: "rolled_back" }, null, 2));
    process.exit(0);
  }

  const reviewedAt = new Date();
  const [promoted] = await connection.execute(
    "UPDATE questions SET reviewStatus = 'approved', reviewedBy = ?, reviewedAt = ? WHERE bankKey = ? AND reviewStatus = 'in_review' AND reviewedBy IS NULL AND reviewedAt IS NULL",
    [REVIEW_ACTOR, reviewedAt, BANK_KEY],
  );
  assert(promoted.affectedRows === 120, `Expected 120 promoted questions, changed ${promoted.affectedRows}.`);
  const [metadataUpdate] = await connection.execute(
    "UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?",
    [120, BANK_KEY],
  );
  assert(metadataUpdate.affectedRows === 1, "Texas metadata was not updated exactly once.");
  const [rowsAfter] = await connection.execute(
    "SELECT COUNT(*) AS total, SUM(reviewStatus IN ('approved', 'unreviewed')) AS visible FROM questions WHERE bankKey = ?",
    [BANK_KEY],
  );
  assert(Number(rowsAfter[0].total) === 120 && Number(rowsAfter[0].visible) === 120, "Texas post-release visibility invariant failed.");
  await connection.commit();
  transactionOpen = false;
  console.log(JSON.stringify({ mode: "applied", target: target.description, bankKey: BANK_KEY, promoted: 120, reviewedBy: REVIEW_ACTOR, reviewedAt: reviewedAt.toISOString(), transaction: "committed" }, null, 2));
} catch (error) {
  if (transactionOpen) await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
