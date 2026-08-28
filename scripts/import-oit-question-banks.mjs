import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(repoRoot, "content", "oit", "manifest.json");
const validatorPath = path.join(repoRoot, "scripts", "validate-oit-question-banks.mjs");
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const payloads = manifest.banks.map(bank => {
  const filePath = path.join(repoRoot, "content", "oit", bank.file);
  const bytes = fs.readFileSync(filePath);
  return { ...bank, bytes, questions: JSON.parse(bytes) };
});

execFileSync(process.execPath, [validatorPath], { cwd: repoRoot, stdio: "inherit" });

const checksum = createHash("sha256")
  .update(manifestBytes)
  .update(payloads.map(payload => payload.bytes).reduce((combined, bytes) => Buffer.concat([combined, bytes]), Buffer.alloc(0)))
  .digest("hex");
const apply = process.argv.includes("--apply");

console.log(`OIT import plan ${checksum.slice(0, 12)}: 500 water + 500 wastewater questions.`);
console.log("Mode: additive question numbers 1001-1500; existing lower-numbered questions and historical attempts are unchanged.");

if (!apply) {
  console.log("Dry run complete. Database was not contacted.");
  console.log(`To apply this exact payload, set CONFIRM_OIT_IMPORT=${checksum} and pass --apply.`);
  process.exit(0);
}

if (process.env.CONFIRM_OIT_IMPORT !== checksum) {
  throw new Error(`Apply blocked. Set CONFIRM_OIT_IMPORT=${checksum} to confirm this exact validated payload.`);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --apply.");

const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

function sameStoredContent(row, question) {
  const storedOptions = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
  return row.module === question.module
    && row.difficulty === question.difficulty
    && row.question === question.question
    && JSON.stringify(storedOptions) === JSON.stringify(question.options)
    && Number(row.correctIndex) === question.correctIndex
    && row.explanation === question.explanation
    && row.isCalc === question.isCalc
    && (row.topic ?? null) === (question.topic ?? null)
    && (row.cognitiveLevel ?? null) === (question.cognitiveLevel ?? null)
    && (row.sourceTitle ?? null) === (question.sourceTitle ?? null)
    && (row.sourceReference ?? null) === (question.sourceReference ?? null)
    && (row.sourceUrl ?? null) === (question.sourceUrl ?? null)
    && (row.blueprintObjective ?? null) === (question.blueprintObjective ?? null);
}

try {
  await connection.beginTransaction();
  let insertedTotal = 0;

  for (const payload of payloads) {
    const [metaRows] = await connection.execute(
      "SELECT bankKey FROM question_bank_meta WHERE bankKey = ? FOR UPDATE",
      [payload.bankKey],
    );
    if (metaRows.length !== 1) throw new Error(`Missing question_bank_meta row for ${payload.bankKey}.`);

    const [existingRows] = await connection.execute(
      `SELECT bankKey, questionNum, module, difficulty, question, options, correctIndex,
              explanation, isCalc, topic, cognitiveLevel, sourceTitle, sourceReference,
              sourceUrl, blueprintObjective, reviewStatus
       FROM questions
       WHERE bankKey = ? AND questionNum BETWEEN 1001 AND 1500
       FOR UPDATE`,
      [payload.bankKey],
    );
    const existingByNumber = new Map(existingRows.map(row => [Number(row.questionNum), row]));
    let insertedForBank = 0;
    let movedToReviewForBank = 0;

    for (const question of payload.questions) {
      const existing = existingByNumber.get(question.questionNum);
      if (existing) {
        if (!sameStoredContent(existing, question)) {
          throw new Error(
            `Immutable OIT content conflict at ${payload.bankKey}#${question.questionNum}. `
            + "Choose a new additive question-number range instead of overwriting deployed content.",
          );
        }
        // A payload from the superseded PR may already exist as legacy
        // `unreviewed` content. Move only that state into the new hard staging
        // gate; preserve any deliberate in-review, approved or rejected decision.
        if (existing.reviewStatus === "unreviewed") {
          await connection.execute(
            `UPDATE questions
             SET reviewStatus = 'in_review', reviewedBy = NULL, reviewedAt = NULL
             WHERE bankKey = ? AND questionNum = ?`,
            [question.bankKey, question.questionNum],
          );
          movedToReviewForBank += 1;
        }
        continue;
      }

      await connection.execute(
        `INSERT INTO questions
          (bankKey, questionNum, module, difficulty, question, options, correctIndex,
           explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
           sourceReference, sourceUrl, blueprintObjective, reviewStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, 'in_review')`,
        [
          question.bankKey,
          question.questionNum,
          question.module,
          question.difficulty,
          question.question,
          JSON.stringify(question.options),
          question.correctIndex,
          question.explanation,
          question.isCalc,
          question.topic,
          question.cognitiveLevel,
          question.sourceTitle,
          question.sourceReference,
          question.sourceUrl,
          question.blueprintObjective,
        ],
      );
      insertedForBank += 1;
    }

    if (movedToReviewForBank > 0) {
      // These rows may have been present in a cached learner bank before this
      // package introduced hard staging. Refresh that cache and visible count.
      await connection.execute(
        `UPDATE question_bank_meta
         SET totalQuestions = (
               SELECT COUNT(*) FROM questions
               WHERE bankKey = ? AND reviewStatus NOT IN ('in_review', 'rejected')
             ),
             contentVersion = contentVersion + 1
         WHERE bankKey = ?`,
        [payload.bankKey, payload.bankKey],
      );
    }

    insertedTotal += insertedForBank;
    console.log(`${payload.bankKey}: ${insertedForBank} inserted in review, ${movedToReviewForBank} legacy rows moved to review, ${payload.questions.length - insertedForBank} already identical.`);
  }

  await connection.commit();
  console.log(`OIT import complete: ${insertedTotal} new questions staged transactionally for individual approval.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
