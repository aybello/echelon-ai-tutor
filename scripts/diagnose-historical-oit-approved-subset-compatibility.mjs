import fs from "node:fs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for read-only compatibility diagnosis.");
const payloadPath = process.env.HISTORICAL_OIT_SUBSET_PAYLOAD ?? "/home/ubuntu/historical_oit_unresolved_review/approved_subset_release_worklist/staged_release_payload.json";
const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const fields = ["module", "difficulty", "question", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"];
const candidateProfile = Object.fromEntries(fields.map((field) => [field, {
  values: [...new Set(payload.candidates.map((candidate) => candidate[field]).filter((value) => value != null))].sort(),
  maxLength: Math.max(0, ...payload.candidates.map((candidate) => String(candidate[field] ?? "").length)),
}]));
const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [columns] = await connection.execute(`SELECT COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, CHARACTER_MAXIMUM_LENGTH AS maxLength FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'questions' AND COLUMN_NAME IN (${fields.map(() => "?").join(", ")}) ORDER BY COLUMN_NAME`, fields);
  console.log(JSON.stringify({ payloadChecksum: payload.payloadChecksum, candidateCount: payload.candidates.length, candidateProfile, databaseColumns: columns }, null, 2));
} finally {
  await connection.end();
}
