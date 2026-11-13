import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(repoRoot, "content", "oit", "manifest.json");
const outputPath = path.join(repoRoot, "content", "oit", "production-baseline.json");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to capture a production baseline.");

function canonicalStoredContent(row) {
  return {
    module: row.module,
    difficulty: row.difficulty,
    question: row.question,
    options: typeof row.options === "string" ? JSON.parse(row.options) : row.options,
    correctIndex: Number(row.correctIndex),
    explanation: row.explanation,
    steps: row.steps ?? null,
    tip: row.tip ?? null,
    isCalc: row.isCalc,
    topic: row.topic ?? null,
    cognitiveLevel: row.cognitiveLevel ?? null,
    sourceTitle: row.sourceTitle ?? null,
    sourceReference: row.sourceReference ?? null,
    sourceUrl: row.sourceUrl ?? null,
    blueprintObjective: row.blueprintObjective ?? null,
  };
}

function contentHash(row) {
  return createHash("sha256").update(JSON.stringify(canonicalStoredContent(row))).digest("hex");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const banks = [];
  for (const bank of manifest.banks) {
    const questionNumbers = new Set(JSON.parse(fs.readFileSync(path.join(repoRoot, "content", "oit", bank.file), "utf8"))
      .map(question => Number(question.questionNum)));
    const [rows] = await connection.execute(
      `SELECT bankKey, questionNum, module, difficulty, question, options, correctIndex,
              explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
              sourceReference, sourceUrl, blueprintObjective, reviewStatus
       FROM questions
       WHERE bankKey = ? AND questionNum BETWEEN 1001 AND 1500
       ORDER BY questionNum`,
      [bank.bankKey],
    );
    if (rows.length !== questionNumbers.size) {
      throw new Error(`${bank.bankKey}: expected ${questionNumbers.size} existing package rows, found ${rows.length}.`);
    }
    const entries = rows.map(row => {
      if (!questionNumbers.has(Number(row.questionNum))) {
        throw new Error(`${bank.bankKey}#${row.questionNum}: row is not in the package manifest.`);
      }
      if (["in_review", "rejected"].includes(row.reviewStatus)) {
        throw new Error(`${bank.bankKey}#${row.questionNum}: non-visible review status ${row.reviewStatus} cannot be used as a revision baseline.`);
      }
      return {
        questionNum: Number(row.questionNum),
        contentHash: contentHash(row),
        reviewStatus: row.reviewStatus,
        content: canonicalStoredContent(row),
      };
    });
    banks.push({ bankKey: bank.bankKey, count: entries.length, entries });
  }
  const baseline = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    manifestVersion: manifest.version,
    banks,
  };
  const serialized = `${JSON.stringify(baseline, null, 2)}\n`;
  const baselineChecksum = createHash("sha256").update(serialized).digest("hex");
  fs.writeFileSync(outputPath, `${JSON.stringify({ ...baseline, baselineChecksum }, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, baselineChecksum, banks: banks.map(bank => ({ bankKey: bank.bankKey, count: bank.count })) }, null, 2));
} finally {
  await connection.end();
}
