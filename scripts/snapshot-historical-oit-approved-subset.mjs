import fs from "node:fs";
import path from "node:path";
import { createHistoricalSubsetBaseline } from "./lib/historicalOitSubsetRevision.mjs";

const root = path.resolve(import.meta.dirname, "..");
const payloadPath = process.env.HISTORICAL_OIT_SUBSET_PAYLOAD ?? "/home/ubuntu/historical_oit_unresolved_review/approved_subset_release_worklist/staged_release_payload.json";
const outputPath = path.join(root, "content", "oit", "historical-approved-subset-baseline.json");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to capture the historical approved-subset baseline.");
const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const rows = [];
  const attempts = [];
  for (const bankKey of [...new Set(payload.candidates.map((candidate) => candidate.bankKey))]) {
    const candidates = payload.candidates.filter((candidate) => candidate.bankKey === bankKey);
    const numbers = candidates.map((candidate) => Number(candidate.questionNum));
    const placeholders = numbers.map(() => "?").join(", ");
    const [bankRows] = await connection.execute(`SELECT id, bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle, sourceReference, sourceUrl, blueprintObjective, reviewStatus FROM questions WHERE bankKey = ? AND questionNum IN (${placeholders}) ORDER BY questionNum`, [bankKey, ...numbers]);
    const [attemptRows] = await connection.execute(`SELECT q.bankKey, q.questionNum, COUNT(a.id) AS attemptCount FROM questions q LEFT JOIN question_attempts a ON a.bankKey = q.bankKey AND a.questionId = q.questionNum WHERE q.bankKey = ? AND q.questionNum IN (${placeholders}) GROUP BY q.bankKey, q.questionNum`, [bankKey, ...numbers]);
    rows.push(...bankRows);
    attempts.push(...attemptRows);
  }
  const baseline = createHistoricalSubsetBaseline(payload, rows, attempts);
  fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, baselineChecksum: baseline.baselineChecksum, entries: baseline.entries.length, bankCounts: baseline.entries.reduce((acc, entry) => ({ ...acc, [entry.bankKey]: (acc[entry.bankKey] ?? 0) + 1 }), {}) }, null, 2));
} finally {
  await connection.end();
}
