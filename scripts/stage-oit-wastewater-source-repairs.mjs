import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { analyseQuestion } from "../server/answerLengthBias.ts";
import { closeDatabaseConnection } from "../server/connectionCleanup.ts";

const bankKey = "oit-ww";
const candidatePath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-candidates-2026-08-30.json";
const reviewPath = process.env.REVIEW_PATH || "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-gpt-independent-review-2026-08-30.json";
const execute = process.argv.includes("--execute");
const approvedOnly = process.argv.includes("--approved-only");
const validateOnly = process.argv.includes("--validate-only");
const questionNumbersArgument = process.argv.find(argument => argument.startsWith("--question-nums="));
const requestedQuestionNumbers = new Set(
  (questionNumbersArgument?.slice("--question-nums=".length) || "")
    .split(",")
    .map(value => Number.parseInt(value, 10))
    .filter(Number.isInteger),
);

const allCandidates = JSON.parse(await readFile(candidatePath, "utf8"));
if (!Array.isArray(allCandidates) || allCandidates.length === 0 || allCandidates.length > 25) {
  throw new Error("Expected a non-empty controlled candidate set of at most 25 questions.");
}
if (questionNumbersArgument && requestedQuestionNumbers.size === 0) {
  throw new Error("--question-nums must contain at least one positive integer.");
}
if (execute && !approvedOnly) {
  throw new Error("--execute requires --approved-only so unreviewed candidates cannot be staged.");
}
const scopedCandidates = requestedQuestionNumbers.size > 0
  ? allCandidates.filter(candidate => requestedQuestionNumbers.has(candidate.questionNum))
  : allCandidates;
if (requestedQuestionNumbers.size > 0 && scopedCandidates.length !== requestedQuestionNumbers.size) {
  throw new Error("One or more requested question numbers are not in the controlled candidate dossier.");
}

const approvedQuestionNumbers = approvedOnly
  ? new Set(
      JSON.parse(await readFile(reviewPath, "utf8")).reviews
        .filter(
            review =>
            review.approved === true
            && Array.isArray(review.requiredChanges)
            && review.requiredChanges.every(change => /^none required(?:[.!;]|$)/i.test(String(change).trim())),
        )
        .map(review => review.questionNum),
    )
  : null;
const candidates = approvedQuestionNumbers
  ? scopedCandidates.filter(candidate => approvedQuestionNumbers.has(candidate.questionNum))
  : scopedCandidates;

if (approvedOnly && candidates.length === 0) throw new Error("Independent review did not approve any controlled candidates.");

function validateCandidate(candidate) {
  const problems = [];
  if (!Number.isInteger(candidate.questionNum) || candidate.questionNum <= 0) problems.push("invalid question number");
  if (typeof candidate.question !== "string" || candidate.question.trim().length < 20) problems.push("invalid question stem");
  if (!Array.isArray(candidate.options) || candidate.options.length !== 4) problems.push("requires exactly four options");
  if (!Number.isInteger(candidate.correctIndex) || candidate.correctIndex < 0 || candidate.correctIndex > 3) {
    problems.push("invalid correct index");
  }
  if (Array.isArray(candidate.options)) {
    if (candidate.options.some(option => typeof option !== "string" || option.trim().length < 20)) {
      problems.push("an option is empty or too short");
    }
    if (new Set(candidate.options.map(option => option.trim().toLowerCase())).size !== candidate.options.length) {
      problems.push("options are not distinct");
    }
    if (Number.isInteger(candidate.correctIndex) && candidate.correctIndex >= 0 && candidate.correctIndex < candidate.options.length) {
      const bias = analyseQuestion({
        questionNum: candidate.questionNum,
        options: candidate.options,
        correctIndex: candidate.correctIndex,
      });
      if (bias.hasLengthTell) {
        problems.push(
          `answer-length tell remains: correct ${bias.correctLength}, longest distractor ${bias.longestDistractorLength}`,
        );
      }
    }
  }
  for (const field of ["explanation", "sourceTitle", "sourceReference", "sourceUrl"]) {
    if (typeof candidate[field] !== "string" || candidate[field].trim().length === 0) problems.push(`missing ${field}`);
  }
  return problems;
}

const duplicateNumbers = candidates.map(candidate => candidate.questionNum).filter(
  (value, index, values) => values.indexOf(value) !== index,
);
if (duplicateNumbers.length > 0) throw new Error(`Duplicate question numbers: ${duplicateNumbers.join(", ")}`);

const invalid = candidates
  .map(candidate => ({ questionNum: candidate.questionNum, problems: validateCandidate(candidate) }))
  .filter(result => result.problems.length > 0);
if (invalid.length > 0) {
  console.error(JSON.stringify({ status: "validation_failed", invalid }, null, 2));
  process.exit(1);
}
if (validateOnly) {
  console.log(JSON.stringify({ status: "validation_passed", candidateCount: candidates.length, independentlyApprovedOnly: approvedOnly }, null, 2));
  process.exit(0);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const questionNumbers = candidates.map(candidate => candidate.questionNum);
  const [rows] = await connection.query(
    `SELECT questionNum, reviewStatus FROM questions WHERE bankKey = ? AND questionNum IN (${questionNumbers.map(() => "?").join(",")}) ORDER BY questionNum`,
    [bankKey, ...questionNumbers],
  );
  if (rows.length !== candidates.length) throw new Error(`Expected ${candidates.length} existing rows but found ${rows.length}.`);
  const unexpectedStatuses = rows.filter(row => !["unreviewed", "in_review"].includes(row.reviewStatus));
  if (unexpectedStatuses.length > 0) throw new Error(`Unexpected review status: ${JSON.stringify(unexpectedStatuses)}`);

  console.log(JSON.stringify({
    status: execute ? "ready_to_stage" : "dry_run_passed",
    candidateCount: candidates.length,
    independentlyApprovedOnly: approvedOnly,
    questionNumbers: questionNumbers.sort((a, b) => a - b),
    priorStatuses: rows,
  }, null, 2));
  if (!execute) process.exit(0);

  await connection.beginTransaction();
  for (const candidate of candidates) {
    await connection.execute(
      "UPDATE questions SET question = ?, options = ?, correctIndex = ?, explanation = ?, sourceTitle = ?, sourceReference = ?, sourceUrl = ?, reviewStatus = 'in_review', reviewedBy = NULL, reviewedAt = NULL WHERE bankKey = ? AND questionNum = ?",
      [
        candidate.question.trim(),
        JSON.stringify(candidate.options.map(option => option.trim())),
        candidate.correctIndex,
        candidate.explanation.trim(),
        candidate.sourceTitle.trim(),
        candidate.sourceReference.trim(),
        candidate.sourceUrl.trim(),
        bankKey,
        candidate.questionNum,
      ],
    );
  }
  await connection.execute("UPDATE question_bank_meta SET contentVersion = contentVersion + 1 WHERE bankKey = ?", [bankKey]);
  await connection.commit();
  console.log(JSON.stringify({ status: "staged_in_review", candidateCount: candidates.length, independentlyApprovedOnly: approvedOnly }, null, 2));
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await closeDatabaseConnection(connection);
}
