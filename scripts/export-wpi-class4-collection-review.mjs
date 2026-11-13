import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const COURSE_KEY = "wpi-class4-water-coll";
export const BANK_KEY = "wpi-class4-wastewater-coll";
const KEYS = [BANK_KEY, COURSE_KEY];
// Explicit fields: exclude reviewer identities and all learner/customer tables.
const FIELDS = ["id", "bankKey", "questionNum", "module", "difficulty", "question",
  "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic",
  "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective",
  "reviewStatus", "reviewedAt"];
export function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const sha256 = value => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");

export async function exportSnapshot(db) {
  await db.query("SET SESSION time_zone = '+00:00'");
  await db.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
  await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
  try {
    const [[clock]] = await db.query("SELECT DATE_FORMAT(UTC_TIMESTAMP(6), '%Y-%m-%dT%H:%i:%s.%fZ') AS capturedAtUtc");
    const [counts] = await db.execute("SELECT bankKey, COUNT(*) AS rowCount FROM questions WHERE bankKey IN (?, ?) GROUP BY bankKey ORDER BY bankKey", KEYS);
    const [questions] = await db.execute(`SELECT ${FIELDS.map(f => `\`${f}\``).join(", ")} FROM questions WHERE bankKey IN (?, ?) ORDER BY bankKey, questionNum, id`, KEYS);
    if (!questions.length) throw new Error("EMPTY_BANK");
    if (counts.reduce((n, row) => n + Number(row.rowCount), 0) !== questions.length) throw new Error("INCOMPLETE_EXPORT");
    for (const row of counts) {
      if (questions.filter(q => q.bankKey === row.bankKey).length !== Number(row.rowCount)) throw new Error("BANK_COUNT_MISMATCH");
    }
    const [metadata] = await db.execute("SELECT * FROM question_bank_meta WHERE bankKey IN (?, ?) ORDER BY bankKey", KEYS);
    const [moduleOverviews] = await db.execute("SELECT * FROM module_overviews WHERE bankKey IN (?, ?) ORDER BY bankKey, id", KEYS);
    const summary = {};
    for (const q of questions) {
      summary[q.bankKey] ??= { total: 0, reviewStatuses: {}, modules: {}, calculations: 0, cognitiveLevels: {} };
      const s = summary[q.bankKey]; s.total++;
      for (const [group, value] of [["reviewStatuses", q.reviewStatus], ["modules", q.module], ["cognitiveLevels", q.cognitiveLevel ?? "unclassified"]]) s[group][value] = (s[group][value] ?? 0) + 1;
      if (q.isCalc === "yes") s.calculations++;
    }
    const data = { metadata, moduleOverviews, questions };
    return {
      format: "echelon-wpi-class4-collection-review-v1", capturedAtUtc: clock.capturedAtUtc,
      courseKey: COURSE_KEY, canonicalBankKey: BANK_KEY, inspectedBankKeys: KEYS,
      scope: "Complete question rows in every review state; no question limit; no customer data; database read-only",
      summary, contentSha256: sha256(data),
      rowHashes: questions.map(row => ({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, sha256: sha256(row) })),
      ...data,
    };
  } finally {
    // No commit and no data/schema mutation, including on a failed export.
    await db.query("ROLLBACK");
  }
}

async function main() {
  if (process.argv.length !== 4 || process.argv[2] !== "--out") throw new Error("USAGE: node scripts/export-wpi-class4-collection-review.mjs --out /private/path/export.json");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
  const mysql = await import("mysql2/promise");
  // Existing runtime connection settings remain authoritative, including TLS.
  const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, dateStrings: true, timezone: "Z" });
  try {
    const snapshot = await exportSnapshot(db);
    const output = resolve(process.argv[3]);
    await writeFile(output, JSON.stringify(snapshot, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    console.log(JSON.stringify({ output, rows: snapshot.questions.length, summary: snapshot.summary, contentSha256: snapshot.contentSha256 }, null, 2));
  } finally { await db.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    // Do not print credentials, query parameters or database connection details.
    const safe = ["EMPTY_BANK", "INCOMPLETE_EXPORT", "BANK_COUNT_MISMATCH", "DATABASE_URL_REQUIRED"];
    console.error(safe.includes(error.message) ? error.message : "Export failed; inspect the release environment privately. No bank updates were requested.");
    process.exitCode = 1;
  });
}
