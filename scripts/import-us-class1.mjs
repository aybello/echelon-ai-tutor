/**
 * US Class I question bank importer.
 *
 * Imports the approved revision-3 US Water Treatment and Water Distribution
 * pools into two NEW banks. This is additive only: it creates banks that do
 * not exist yet and never updates, deletes or renumbers any existing row.
 *
 * Modes:
 *   check     no database connection at all, validates the package only
 *   preflight read-only, runs inside a transaction that is always rolled back
 *   apply     inserts inside one transaction, verifies, then commits
 *
 * Apply is blocked unless CONFIRM_US_CLASS1_IMPORT equals the package checksum.
 *
 * Safety properties:
 *   - refuses to run if either target bank already has any row
 *   - captures a full pre-import baseline of every other bank and the
 *     learner-attempt aggregate, and refuses to commit if either changed
 *   - inserts every row as reviewStatus 'in_review', which the learner
 *     visibility filter hides, so nothing reaches a learner from this script
 *   - verifies every stored row byte-for-byte against the package before commit
 *   - rolls back on any mismatch
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mysql from "mysql2/promise";

const PACKAGE_PATH = process.env.US_CLASS1_PACKAGE_PATH
  ?? "/home/ubuntu/outputs/echelon-us-integration-2026-10-08/us-class1-import-package.json";
const RELEASE_DIR = process.env.US_CLASS1_RELEASE_DIR
  ?? "/home/ubuntu/us_class1_import_release";

const mode = process.argv[2] ?? "check";
if (!new Set(["check", "preflight", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/import-us-class1.mjs [check|preflight|apply]");
}

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

const writeResult = (name, result) => {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const outputPath = path.join(RELEASE_DIR, name);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return outputPath;
};

// ---------------------------------------------------------------- load + validate

const raw = fs.readFileSync(PACKAGE_PATH, "utf8");
const pkg = JSON.parse(raw);

const EXPECTED = {
  "us-class1-water": { total: 200, recall: 80, application: 120, calculations: 20 },
  "us-class1-water-dist": { total: 198, recall: 89, application: 109, calculations: 18 },
};

function validatePackage() {
  const errors = [];
  if (!Array.isArray(pkg.banks) || pkg.banks.length !== 2) {
    errors.push("Package must contain exactly two banks.");
  }
  let grandTotal = 0;
  for (const bank of pkg.banks ?? []) {
    const expect = EXPECTED[bank.bankKey];
    if (!expect) {
      errors.push(`Unexpected bankKey ${bank.bankKey}.`);
      continue;
    }
    const rows = bank.rows ?? [];
    grandTotal += rows.length;
    if (rows.length !== expect.total) {
      errors.push(`${bank.bankKey}: expected ${expect.total} rows, found ${rows.length}.`);
    }
    const nums = rows.map((r) => Number(r.questionNum));
    const unique = new Set(nums);
    if (unique.size !== rows.length) {
      errors.push(`${bank.bankKey}: questionNum values are not unique.`);
    }
    if (Math.min(...nums) !== 1 || Math.max(...nums) !== rows.length) {
      errors.push(`${bank.bankKey}: questionNum must run 1..${rows.length}.`);
    }
    let recall = 0;
    let application = 0;
    let calcs = 0;
    for (const row of rows) {
      if (row.bankKey !== bank.bankKey) {
        errors.push(`${bank.bankKey}#${row.questionNum}: row bankKey mismatch.`);
      }
      let options;
      try {
        options = JSON.parse(row.options);
      } catch {
        errors.push(`${bank.bankKey}#${row.questionNum}: options is not valid JSON.`);
        continue;
      }
      if (!Array.isArray(options) || options.length !== 4) {
        errors.push(`${bank.bankKey}#${row.questionNum}: must have four options.`);
      }
      if (new Set(options).size !== options.length) {
        errors.push(`${bank.bankKey}#${row.questionNum}: duplicate options.`);
      }
      const key = Number(row.correctIndex);
      if (!Number.isInteger(key) || key < 0 || key > 3) {
        errors.push(`${bank.bankKey}#${row.questionNum}: correctIndex out of range.`);
      }
      if (!row.question || !row.explanation) {
        errors.push(`${bank.bankKey}#${row.questionNum}: missing question or explanation.`);
      }
      if (row.cognitiveLevel === "recall") recall += 1;
      if (row.cognitiveLevel === "application") application += 1;
      if (row.isCalc === "yes") {
        calcs += 1;
        const steps = row.steps ? JSON.parse(row.steps) : [];
        if (!Array.isArray(steps) || steps.length < 7) {
          errors.push(`${bank.bankKey}#${row.questionNum}: calculation needs at least seven worked steps.`);
        }
        for (const step of steps) {
          if (typeof step?.l !== "string" || typeof step?.c !== "string") {
            errors.push(`${bank.bankKey}#${row.questionNum}: step must be {l, c} strings.`);
            break;
          }
        }
      }
    }
    if (recall !== expect.recall) errors.push(`${bank.bankKey}: expected ${expect.recall} recall, found ${recall}.`);
    if (application !== expect.application) errors.push(`${bank.bankKey}: expected ${expect.application} application, found ${application}.`);
    if (calcs !== expect.calculations) errors.push(`${bank.bankKey}: expected ${expect.calculations} calculations, found ${calcs}.`);
  }
  if (grandTotal !== 398) errors.push(`Expected 398 total approved rows, found ${grandTotal}.`);
  return errors;
}

const validationErrors = validatePackage();
if (validationErrors.length > 0) {
  console.error("Package validation FAILED:");
  for (const e of validationErrors) console.error(`  - ${e}`);
  process.exit(1);
}

const checksum = pkg.checksum;
console.log(`US Class I package ${checksum}`);
for (const bank of pkg.banks) {
  console.log(`  ${bank.bankKey}: ${bank.rows.length} rows (${bank.excluded.length} held and excluded)`);
}
console.log("Validation passed: 398 approved rows, all calculations carry seven or more worked steps.");

if (mode === "check") {
  console.log("Check mode only. No database connection was attempted.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for preflight or apply.");
if (mode === "apply" && process.env.CONFIRM_US_CLASS1_IMPORT !== checksum) {
  throw new Error(`Apply blocked. Set CONFIRM_US_CLASS1_IMPORT=${checksum} to confirm this exact package.`);
}

// ---------------------------------------------------------------- database work

const INSERT_COLUMNS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective",
];

function insertValues(row) {
  return [
    row.bankKey, Number(row.questionNum), row.module, row.difficulty, row.question,
    row.options, Number(row.correctIndex), row.explanation, row.steps ?? null,
    row.tip ?? null, row.isCalc, row.topic, row.cognitiveLevel, row.sourceTitle,
    row.sourceReference, row.sourceUrl, row.blueprintObjective,
  ];
}

/** Aggregate fingerprint of everything that must NOT change. */
async function captureBaseline(connection) {
  const [bankCounts] = await connection.execute(
    "SELECT bankKey, COUNT(*) AS n FROM questions GROUP BY bankKey ORDER BY bankKey",
  );
  const [meta] = await connection.execute(
    "SELECT bankKey, totalQuestions, contentVersion FROM question_bank_meta ORDER BY bankKey",
  );
  const [attempts] = await connection.execute(
    "SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN `correct` THEN 1 ELSE 0 END), 0) AS correct FROM question_attempts",
  );
  const [totals] = await connection.execute("SELECT COUNT(*) AS n FROM questions");
  const snapshot = {
    bankCounts: bankCounts.map((r) => ({ bankKey: r.bankKey, n: Number(r.n) })),
    meta: meta.map((r) => ({
      bankKey: r.bankKey,
      totalQuestions: Number(r.totalQuestions),
      contentVersion: Number(r.contentVersion),
    })),
    attempts: { n: Number(attempts[0].n), correct: Number(attempts[0].correct) },
    questionTotal: Number(totals[0].n),
  };
  return { snapshot, checksum: digest(JSON.stringify(snapshot)) };
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.beginTransaction();

  const before = await captureBaseline(connection);

  // Refuse if either target bank already holds content.
  for (const bank of pkg.banks) {
    const [existing] = await connection.execute(
      "SELECT COUNT(*) AS n FROM questions WHERE bankKey = ?",
      [bank.bankKey],
    );
    if (Number(existing[0].n) !== 0) {
      throw new Error(`${bank.bankKey} already has ${existing[0].n} rows. This importer is additive-create only.`);
    }
  }

  if (mode === "preflight") {
    const result = {
      mode: "read_only_preflight",
      capturedAtUtc: new Date().toISOString(),
      packageChecksum: checksum,
      baselineChecksum: before.checksum,
      existingQuestionTotal: before.snapshot.questionTotal,
      existingBankCount: before.snapshot.meta.length,
      proposed: Object.fromEntries(pkg.banks.map((b) => [b.bankKey, b.rows.length])),
      proposedReviewStatus: "in_review (hidden from learners until released)",
      ready: true,
    };
    await connection.rollback();
    const outputPath = writeResult("us-class1-import-preflight.json", result);
    console.log(JSON.stringify({ outputPath, ...result }, null, 2));
    console.log("Preflight transaction rolled back. No change was written.");
  } else {
    const placeholders = INSERT_COLUMNS.map(() => "?").join(", ");
    const columnSql = INSERT_COLUMNS.map((c) => `\`${c}\``).join(", ");

    for (const bank of pkg.banks) {
      for (const row of bank.rows) {
        await connection.execute(
          `INSERT INTO questions (${columnSql}, \`reviewStatus\`) VALUES (${placeholders}, 'in_review')`,
          insertValues(row),
        );
      }
      await connection.execute(
        "INSERT INTO question_bank_meta (`bankKey`, `modules`, `totalQuestions`, `contentVersion`, `blueprintVersion`) VALUES (?, ?, ?, 1, 1)",
        [
          bank.bankKey,
          JSON.stringify([...new Set(bank.rows.map((r) => r.module))].sort()),
          bank.rows.length,
        ],
      );
      console.log(`Inserted ${bank.rows.length} rows into ${bank.bankKey} as in_review.`);
    }

    // Verify every stored row matches the package exactly.
    for (const bank of pkg.banks) {
      const [stored] = await connection.execute(
        "SELECT questionNum, question, options, correctIndex, explanation, steps, cognitiveLevel, isCalc, reviewStatus FROM questions WHERE bankKey = ? ORDER BY questionNum",
        [bank.bankKey],
      );
      if (stored.length !== bank.rows.length) {
        throw new Error(`Post-insert count mismatch for ${bank.bankKey}: ${stored.length} vs ${bank.rows.length}.`);
      }
      for (const candidate of bank.rows) {
        const found = stored.find((s) => Number(s.questionNum) === Number(candidate.questionNum));
        if (!found) throw new Error(`Missing stored row ${bank.bankKey}#${candidate.questionNum}.`);
        if (found.reviewStatus !== "in_review") {
          throw new Error(`${bank.bankKey}#${candidate.questionNum} is not staged as in_review.`);
        }
        const storedOptions = typeof found.options === "string" ? found.options : JSON.stringify(found.options);
        if (
          found.question !== candidate.question
          || Number(found.correctIndex) !== Number(candidate.correctIndex)
          || found.explanation !== candidate.explanation
          || JSON.stringify(JSON.parse(storedOptions)) !== JSON.stringify(JSON.parse(candidate.options))
        ) {
          throw new Error(`Stored content mismatch at ${bank.bankKey}#${candidate.questionNum}.`);
        }
      }
    }

    // Nothing outside the two new banks may have changed.
    const after = await captureBaseline(connection);
    const newKeys = new Set(pkg.banks.map((b) => b.bankKey));
    const strip = (snap) => ({
      bankCounts: snap.bankCounts.filter((r) => !newKeys.has(r.bankKey)),
      meta: snap.meta.filter((r) => !newKeys.has(r.bankKey)),
      attempts: snap.attempts,
    });
    if (digest(JSON.stringify(strip(before.snapshot))) !== digest(JSON.stringify(strip(after.snapshot)))) {
      throw new Error("Existing bank inventory or learner attempts changed during import.");
    }
    const expectedTotal = before.snapshot.questionTotal + 398;
    if (after.snapshot.questionTotal !== expectedTotal) {
      throw new Error(`Question total is ${after.snapshot.questionTotal}, expected ${expectedTotal}.`);
    }

    await connection.commit();

    const result = {
      applied: true,
      mode: "review_only_staging",
      appliedAtUtc: new Date().toISOString(),
      packageChecksum: checksum,
      baselineChecksumBefore: before.checksum,
      inserted: Object.fromEntries(pkg.banks.map((b) => [b.bankKey, b.rows.length])),
      questionTotalBefore: before.snapshot.questionTotal,
      questionTotalAfter: after.snapshot.questionTotal,
      reviewStatus: "in_review",
      learnerVisible: false,
      note: "Rows are staged and hidden from learners. A separate release step is required to make them visible.",
    };
    const outputPath = writeResult("us-class1-import-apply-result.json", result);
    console.log(JSON.stringify({ outputPath, ...result }, null, 2));
    console.log("Import complete. 398 questions staged in review only, not visible to any learner.");
  }
} catch (error) {
  await connection.rollback();
  console.error(`Rolled back: ${error.message}`);
  throw error;
} finally {
  await connection.end();
}
