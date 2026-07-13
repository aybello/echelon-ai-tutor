/**
 * generate-seed-questions.mjs
 *
 * Pulls 25 questions per bank from TiDB and writes them to
 * client/src/lib/seedQuestions.ts as a static bundle.
 *
 * correctIndex is included in the output so seed questions score correctly
 * from the first millisecond without waiting for the DB to load.
 *
 * Usage: node scripts/generate-seed-questions.mjs
 */

import mysql from "mysql2/promise";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const QUESTIONS_PER_BANK = 25;

async function main() {
  const pool = mysql.createPool({ uri: DATABASE_URL, connectionLimit: 3 });

  // Dynamically discover all bank keys from the DB — never hardcode
  const [bankRows] = await pool.query(
    `SELECT DISTINCT bankKey FROM questions ORDER BY bankKey`
  );
  const BANK_KEYS = bankRows.map((r) => r.bankKey);
  console.log(`Discovered ${BANK_KEYS.length} banks: ${BANK_KEYS.join(", ")}\n`);

  const seedData = {};
  let totalQuestions = 0;
  let banksFound = 0;

  for (const bankKey of BANK_KEYS) {
    try {
      const [rows] = await pool.query(
        `SELECT questionNum, question, options, correctIndex, explanation, difficulty, module, topic, isCalc, steps, tip
         FROM questions
         WHERE bankKey = ?
         ORDER BY RAND()
         LIMIT ?`,
        [bankKey, QUESTIONS_PER_BANK]
      );

      if (!rows || rows.length === 0) {
        console.log(`  [skip] ${bankKey} — no questions found`);
        continue;
      }

      // Parse JSON fields
      const cleaned = rows.map((row) => {
        let options = row.options;

        try {
          options = typeof options === "string" ? JSON.parse(options) : options;
        } catch {
          options = [];
        }

        return {
          questionNum: row.questionNum,
          question: row.question,
          options: Array.isArray(options) ? options : [],
          correctIndex: row.correctIndex ?? 0,
          explanation: row.explanation ?? null,
          difficulty: row.difficulty ?? null,
          module: row.module ?? null,
          topic: row.topic ?? null,
          isCalc: row.isCalc ?? "no",
        };
      });

      seedData[bankKey] = cleaned;
      totalQuestions += cleaned.length;
      banksFound++;
      console.log(`  [ok] ${bankKey} — ${cleaned.length} questions`);
    } catch (err) {
      console.warn(`  [error] ${bankKey}:`, err.message);
    }
  }

  await pool.end();

  // Write to client/src/lib/seedQuestions.ts
  const outputPath = resolve(__dirname, "../client/src/lib/seedQuestions.ts");
  const ts = `/**
 * seedQuestions.ts — AUTO-GENERATED, DO NOT EDIT MANUALLY
 * Run: node scripts/generate-seed-questions.mjs
 *
 * 25 questions per bank, bundled for instant first-load fallback.
 * correctIndex is included so questions score correctly before the DB loads.
 *
 * Generated: ${new Date().toISOString()}
 * Banks: ${banksFound} | Questions: ${totalQuestions}
 */

export interface SeedQuestion {
  questionNum: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  difficulty: string | null;
  module: string | null;
  topic: string | null;
  isCalc: string;
}

export type SeedBank = Record<string, SeedQuestion[]>;

const seedQuestions: SeedBank = ${JSON.stringify(seedData, null, 2)};

export default seedQuestions;
`;

  writeFileSync(outputPath, ts, "utf8");
  console.log(`\nWrote ${totalQuestions} questions across ${banksFound} banks to:`);
  console.log(`  ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
