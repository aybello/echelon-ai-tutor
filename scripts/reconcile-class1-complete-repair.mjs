import fs from "node:fs";
import mysql from "mysql2/promise";
import { CLASS1_BANK_KEYS, QUESTION_FIELDS, METADATA_FIELDS, reconcileClass1CompleteRepair } from "./lib/class1CompleteRepair.mjs";

const packagePath = process.env.CLASS1_REPAIR_PACKAGE ?? "/home/ubuntu/class1_complete_repair_quarantine/Class1-Complete-Repair-v2-2026-09-11/class1-full-repair/repairs.json";
const outputPath = process.env.CLASS1_REPAIR_RECONCILIATION_OUTPUT ?? "/home/ubuntu/class1_complete_repair_production_reconciliation.json";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for read-only reconciliation.");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const placeholders = CLASS1_BANK_KEYS.map(() => "?").join(", ");
const database = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [questions] = await database.execute(`SELECT ${QUESTION_FIELDS.map((field) => `\`${field}\``).join(", ")} FROM \`questions\` WHERE \`bankKey\` IN (${placeholders}) ORDER BY \`bankKey\`, \`questionNum\``, CLASS1_BANK_KEYS);
  const [metadata] = await database.execute(`SELECT ${METADATA_FIELDS.map((field) => `\`${field}\``).join(", ")} FROM \`question_bank_meta\` WHERE \`bankKey\` IN (${placeholders}) ORDER BY \`bankKey\``, CLASS1_BANK_KEYS);
  const ids = pkg.patches.map((patch) => patch.databaseId);
  const [attemptRows] = await database.execute(`SELECT \`questionId\`, COUNT(*) AS \`attemptCount\` FROM \`question_attempts\` WHERE \`questionId\` IN (${ids.map(() => "?").join(", ")}) GROUP BY \`questionId\``, ids);
  const attemptCounts = Object.fromEntries(attemptRows.map((row) => [Number(row.questionId), Number(row.attemptCount)]));
  const reconciliation = reconcileClass1CompleteRepair({ pkg, currentQuestions: questions, currentMetadata: metadata, attemptCounts });
  const evidence = { capturedAtUtc: new Date().toISOString(), packagePath, sourceSha256: pkg.sourceSha256, ...reconciliation };
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, state: evidence.state, packageSummary: evidence.packageSummary, actualCounts: evidence.actualCounts, attemptCountTotal: evidence.attemptCountTotal }, null, 2));
  if (evidence.state === "conflict") process.exitCode = 2;
} finally {
  await database.end();
}
