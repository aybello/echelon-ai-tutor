/**
 * US Class I release: move staged questions from `in_review` to `approved`.
 *
 * The importer stages every row as `in_review`, which the learner visibility
 * filter hides. This script performs the explicit release the parent approved.
 *
 * Scope is strictly limited: it only touches rows whose bankKey is one of the
 * two US Class I banks AND whose current status is exactly `in_review`.
 * It cannot alter Canadian content, cannot un-reject a rejected row, and
 * cannot change any question text, option or answer key.
 *
 * Modes:
 *   check    report current status counts, no write
 *   apply    release inside one transaction with before/after verification
 *
 * Apply is blocked unless CONFIRM_US_CLASS1_RELEASE equals the exact row count.
 */
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";

const TARGET_BANKS = ["us-class1-water", "us-class1-water-dist"];
const EXPECTED_RELEASE_COUNT = 398;
const RELEASE_DIR = process.env.US_CLASS1_RELEASE_DIR ?? "/home/ubuntu/us_class1_import_release";

const mode = process.argv[2] ?? "check";
if (!new Set(["check", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/release-us-class1.mjs [check|apply]");
}
const target = activeScriptConnection();
console.log(`Target: ${target.description}`);

const placeholders = TARGET_BANKS.map(() => "?").join(", ");
const connection = await mysql.createConnection(target.options);

async function statusCounts(conn) {
  const [rows] = await conn.execute(
    `SELECT bankKey, reviewStatus, COUNT(*) AS n FROM questions
     WHERE bankKey IN (${placeholders}) GROUP BY bankKey, reviewStatus ORDER BY bankKey, reviewStatus`,
    TARGET_BANKS,
  );
  return rows.map((r) => ({ bankKey: r.bankKey, reviewStatus: r.reviewStatus, n: Number(r.n) }));
}

try {
  const before = await statusCounts(connection);
  console.log("Current US Class I status:");
  for (const row of before) console.log(`  ${row.bankKey}  ${row.reviewStatus}  ${row.n}`);

  const stagedTotal = before
    .filter((r) => r.reviewStatus === "in_review")
    .reduce((sum, r) => sum + r.n, 0);

  if (mode === "check") {
    console.log(`\n${stagedTotal} rows are staged and hidden from learners.`);
    console.log(`To release, set CONFIRM_US_CLASS1_RELEASE=${stagedTotal} and run apply.`);
    process.exit(0);
  }

  if (process.env.CONFIRM_US_CLASS1_RELEASE !== String(stagedTotal)) {
    throw new Error(`Release blocked. Set CONFIRM_US_CLASS1_RELEASE=${stagedTotal} to confirm.`);
  }
  if (stagedTotal !== EXPECTED_RELEASE_COUNT) {
    throw new Error(`Expected ${EXPECTED_RELEASE_COUNT} staged rows, found ${stagedTotal}.`);
  }

  const [outsideBefore] = await connection.execute(
    `SELECT COUNT(*) AS n FROM questions WHERE bankKey NOT IN (${placeholders})`,
    TARGET_BANKS,
  );
  const [outsideStatusBefore] = await connection.execute(
    `SELECT reviewStatus, COUNT(*) AS n FROM questions WHERE bankKey NOT IN (${placeholders}) GROUP BY reviewStatus ORDER BY reviewStatus`,
    TARGET_BANKS,
  );

  await connection.beginTransaction();

  const [result] = await connection.execute(
    `UPDATE questions SET reviewStatus = 'approved', reviewedBy = ?, reviewedAt = NOW()
     WHERE bankKey IN (${placeholders}) AND reviewStatus = 'in_review'`,
    ["owner-approved-us-class1-r3", ...TARGET_BANKS],
  );

  if (result.affectedRows !== stagedTotal) {
    throw new Error(`Expected to release ${stagedTotal} rows, updated ${result.affectedRows}.`);
  }

  const after = await statusCounts(connection);
  const stillStaged = after.filter((r) => r.reviewStatus === "in_review").reduce((s, r) => s + r.n, 0);
  if (stillStaged !== 0) throw new Error(`${stillStaged} rows remain staged after release.`);

  const approved = after.filter((r) => r.reviewStatus === "approved").reduce((s, r) => s + r.n, 0);
  if (approved !== EXPECTED_RELEASE_COUNT) {
    throw new Error(`Expected ${EXPECTED_RELEASE_COUNT} approved rows, found ${approved}.`);
  }

  // Nothing outside the two US banks may have been touched.
  const [outsideAfter] = await connection.execute(
    `SELECT COUNT(*) AS n FROM questions WHERE bankKey NOT IN (${placeholders})`,
    TARGET_BANKS,
  );
  const [outsideStatusAfter] = await connection.execute(
    `SELECT reviewStatus, COUNT(*) AS n FROM questions WHERE bankKey NOT IN (${placeholders}) GROUP BY reviewStatus ORDER BY reviewStatus`,
    TARGET_BANKS,
  );
  if (Number(outsideBefore[0].n) !== Number(outsideAfter[0].n)) {
    throw new Error("Question count outside the US banks changed.");
  }
  if (JSON.stringify(outsideStatusBefore) !== JSON.stringify(outsideStatusAfter)) {
    throw new Error("Review status distribution outside the US banks changed.");
  }

  await connection.commit();

  const payload = {
    released: true,
    releasedAtUtc: new Date().toISOString(),
    rowsReleased: result.affectedRows,
    banks: after,
    canadianRowsUnchanged: Number(outsideAfter[0].n),
    note: "US Class I questions are now learner visible. Course activation is a separate registry change.",
  };
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const outputPath = path.join(RELEASE_DIR, "us-class1-release-result.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`\n${JSON.stringify({ outputPath, ...payload }, null, 2)}`);
  console.log(`\nReleased ${result.affectedRows} US Class I questions. ${outsideAfter[0].n} other questions untouched.`);
} catch (error) {
  await connection.rollback();
  console.error(`Rolled back: ${error.message}`);
  throw error;
} finally {
  await connection.end();
}
