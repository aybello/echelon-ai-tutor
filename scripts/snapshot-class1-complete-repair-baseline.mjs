import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { CLASS1_BANK_KEYS, METADATA_FIELDS, QUESTION_FIELDS, digest } from "./lib/class1CompleteRepair.mjs";

const outputDirectory = process.env.CLASS1_REPAIR_BASELINE_DIR ?? "/home/ubuntu/class1_complete_repair_release";
const packagePath = process.env.CLASS1_REPAIR_PACKAGE ?? "/home/ubuntu/class1_complete_repair_quarantine/Class1-Complete-Repair-v2-2026-09-11/class1-full-repair/repairs.json";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for a production rollback baseline.");
const pkgBytes = fs.readFileSync(packagePath);
const pkg = JSON.parse(pkgBytes.toString("utf8"));
const marks = CLASS1_BANK_KEYS.map(() => "?").join(", ");
const database = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [questions] = await database.execute(`SELECT ${QUESTION_FIELDS.map((field) => `\`${field}\``).join(", ")} FROM \`questions\` WHERE \`bankKey\` IN (${marks}) ORDER BY \`bankKey\`, \`questionNum\``, CLASS1_BANK_KEYS);
  const [metadata] = await database.execute(`SELECT ${METADATA_FIELDS.map((field) => `\`${field}\``).join(", ")} FROM \`question_bank_meta\` WHERE \`bankKey\` IN (${marks}) ORDER BY \`bankKey\``, CLASS1_BANK_KEYS);
  const ids = pkg.patches.map((patch) => patch.databaseId);
  const [attemptRows] = await database.execute(`SELECT \`questionId\`, COUNT(*) AS \`attemptCount\` FROM \`question_attempts\` WHERE \`questionId\` IN (${ids.map(() => "?").join(", ")}) GROUP BY \`questionId\``, ids);
  const payload = {
    schemaVersion: 1,
    capturedAtUtc: new Date().toISOString(),
    purpose: "Pre-update full-bank rollback snapshot for the guarded Class 1 complete-repair release.",
    repairPackageSha256: createHash("sha256").update(pkgBytes).digest("hex"),
    expectedBankCounts: Object.fromEntries(CLASS1_BANK_KEYS.map((bankKey) => [bankKey, questions.filter((question) => question.bankKey === bankKey).length])),
    questions,
    questionBankMeta: metadata,
    affectedAttemptCounts: Object.fromEntries(attemptRows.map((row) => [Number(row.questionId), Number(row.attemptCount)])),
  };
  const baseline = { ...payload, baselineChecksum: digest(payload) };
  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "class1-complete-repair-baseline.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, baselineChecksum: baseline.baselineChecksum, repairPackageSha256: baseline.repairPackageSha256, expectedBankCounts: baseline.expectedBankCounts, affectedAttemptCountTotal: Object.values(baseline.affectedAttemptCounts).reduce((sum, count) => sum + count, 0) }, null, 2));
} finally {
  await database.end();
}
