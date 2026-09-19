import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const WPI_BANK_KEYS = Object.freeze([
  "wpi-class1-water", "wpi-class2-water", "wpi-class3-water", "wpi-class4-water",
  "wpi-class1-wastewater", "wpi-class2-wastewater", "wpi-class3-wastewater", "wpi-class4-wastewater",
  "wpi-class1-water-dist", "wpi-class2-water-dist", "wpi-class3-water-dist", "wpi-class4-water-dist",
  "wpi-class1-wastewater-coll", "wpi-class2-wastewater-coll",
  "wpi-class3-wastewater-coll", "wpi-class4-wastewater-coll",
]);

const QUESTION_FIELDS = [
  "id", "bankKey", "questionNum", "module", "difficulty", "question", "options",
  "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel",
  "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedAt",
];

export function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

export const sha256 = value => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");

export async function exportWpiBanks(db) {
  const placeholders = WPI_BANK_KEYS.map(() => "?").join(", ");
  await db.query("SET SESSION time_zone = '+00:00'");
  await db.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
  await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
  try {
    const [[clock]] = await db.query("SELECT DATE_FORMAT(UTC_TIMESTAMP(6), '%Y-%m-%dT%H:%i:%s.%fZ') AS capturedAtUtc");
    const [counts] = await db.execute(
      `SELECT bankKey, COUNT(*) AS rowCount FROM questions WHERE bankKey IN (${placeholders}) GROUP BY bankKey ORDER BY bankKey`,
      WPI_BANK_KEYS,
    );
    const [questions] = await db.execute(
      `SELECT ${QUESTION_FIELDS.map(field => `\`${field}\``).join(", ")} FROM questions WHERE bankKey IN (${placeholders}) ORDER BY bankKey, questionNum, id`,
      WPI_BANK_KEYS,
    );
    const counted = counts.reduce((total, row) => total + Number(row.rowCount), 0);
    if (counted !== questions.length) throw new Error("INCOMPLETE_EXPORT");

    const present = new Set(counts.map(row => row.bankKey));
    const missingBankKeys = WPI_BANK_KEYS.filter(key => !present.has(key));
    const [metadata] = await db.execute(
      `SELECT * FROM question_bank_meta WHERE bankKey IN (${placeholders}) ORDER BY bankKey`,
      WPI_BANK_KEYS,
    );
    const [moduleOverviews] = await db.execute(
      `SELECT * FROM module_overviews WHERE bankKey IN (${placeholders}) ORDER BY bankKey, id`,
      WPI_BANK_KEYS,
    );

    const summary = Object.fromEntries(WPI_BANK_KEYS.map(key => [key, {
      total: 0, reviewStatuses: {}, modules: {}, calculations: 0, cognitiveLevels: {},
    }]));
    for (const question of questions) {
      const bank = summary[question.bankKey];
      if (!bank) throw new Error("UNEXPECTED_BANK_KEY");
      bank.total += 1;
      bank.reviewStatuses[question.reviewStatus] = (bank.reviewStatuses[question.reviewStatus] ?? 0) + 1;
      bank.modules[question.module] = (bank.modules[question.module] ?? 0) + 1;
      bank.cognitiveLevels[question.cognitiveLevel ?? "unclassified"] =
        (bank.cognitiveLevels[question.cognitiveLevel ?? "unclassified"] ?? 0) + 1;
      if (question.isCalc === "yes") bank.calculations += 1;
    }

    const content = { metadata, moduleOverviews, questions };
    return {
      format: "echelon-wpi-all-banks-review-v1",
      capturedAtUtc: clock.capturedAtUtc,
      scope: "All 16 sold WPI banks, every review state, complete answer-bearing rows; no customer or learner data; database read-only",
      expectedBankKeys: WPI_BANK_KEYS,
      missingBankKeys,
      summary,
      contentSha256: sha256(content),
      rowHashes: questions.map(row => ({
        id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, sha256: sha256(row),
      })),
      ...content,
    };
  } finally {
    await db.query("ROLLBACK");
  }
}

async function main() {
  if (process.argv.length !== 4 || process.argv[2] !== "--out") {
    throw new Error("USAGE: node scripts/export-wpi-bank-review.mjs --out /private/path/wpi-bank-review.json");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
  const mysql = await import("mysql2/promise");
  const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, dateStrings: true, timezone: "Z" });
  try {
    const snapshot = await exportWpiBanks(db);
    const output = resolve(process.argv[3]);
    await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    console.log(JSON.stringify({
      output,
      banksPresent: WPI_BANK_KEYS.length - snapshot.missingBankKeys.length,
      missingBankKeys: snapshot.missingBankKeys,
      questions: snapshot.questions.length,
      contentSha256: snapshot.contentSha256,
    }, null, 2));
  } finally {
    await db.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const safe = new Set(["INCOMPLETE_EXPORT", "UNEXPECTED_BANK_KEY", "DATABASE_URL_REQUIRED"]);
    console.error(safe.has(error.message) ? error.message : "Export failed privately; no database changes were requested.");
    process.exitCode = 1;
  });
}
