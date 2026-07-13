/**
 * Insert generated questions from a JSON file into the database
 * Usage: node scripts/insert-generated-questions.mjs <jsonFile>
 */
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

const [jsonFile] = process.argv.slice(2);
if (!jsonFile) { console.error("Usage: node insert-generated-questions.mjs <jsonFile>"); process.exit(1); }

const questions = JSON.parse(readFileSync(jsonFile, "utf-8"));
console.log(`Inserting ${questions.length} questions from ${jsonFile}...`);

const db = await createConnection(process.env.DATABASE_URL);

// Validate no duplicate questionNums in this batch
const nums = questions.map(q => q.questionNum);
const uniqueNums = new Set(nums);
if (uniqueNums.size !== nums.length) {
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  throw new Error(`Duplicate questionNums in batch: ${dupes.join(', ')}`);
}

// Validate no duplicate question text in this batch
const texts = questions.map(q => q.question.trim().toLowerCase());
const uniqueTexts = new Set(texts);
if (uniqueTexts.size !== texts.length) {
  console.warn(`WARNING: ${texts.length - uniqueTexts.size} duplicate question texts in batch`);
}

// Check for existing questionNums in DB
const bankKey = questions[0].bankKey;
const [existing] = await db.execute(
  `SELECT questionNum FROM questions WHERE bankKey = ? AND questionNum IN (${nums.map(() => '?').join(',')})`,
  [bankKey, ...nums]
);
if (existing.length > 0) {
  console.warn(`WARNING: ${existing.length} questionNums already exist in DB for ${bankKey}, skipping those`);
  const existingNums = new Set(existing.map(r => r.questionNum));
  questions.splice(0, questions.length, ...questions.filter(q => !existingNums.has(q.questionNum)));
  console.log(`Inserting ${questions.length} questions after dedup`);
}

// Validate all required fields
for (const q of questions) {
  if (!q.question || !q.options || q.correctIndex === undefined || !q.explanation) {
    throw new Error(`Invalid question at questionNum ${q.questionNum}: missing required fields`);
  }
  if (q.correctIndex < 0 || q.correctIndex > 3) {
    throw new Error(`Invalid correctIndex ${q.correctIndex} at questionNum ${q.questionNum}`);
  }
  let opts;
  try {
    opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
  } catch(e) {
    throw new Error(`Invalid options JSON at questionNum ${q.questionNum}: ${e.message}`);
  }
  if (!Array.isArray(opts) || opts.length < 2) {
    throw new Error(`Invalid options at questionNum ${q.questionNum}: must be array of at least 2, got ${JSON.stringify(opts).substring(0,100)}`);
  }
}

// Insert in batches of 50
let inserted = 0;
const batchSize = 50;
for (let i = 0; i < questions.length; i += batchSize) {
  const batch = questions.slice(i, i + batchSize);
  const values = batch.map(q => [
    q.questionNum,
    q.bankKey,
    q.module,
    q.difficulty || 'medium',
    q.question,
    typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
    q.correctIndex,
    q.explanation
  ]);
  
  await db.query(
    `INSERT INTO questions (questionNum, bankKey, module, difficulty, question, options, correctIndex, explanation) VALUES ?`,
    [values]
  );
  inserted += batch.length;
  console.log(`  Inserted ${inserted}/${questions.length}`);
}

await db.end();
console.log(`Done! ${inserted} questions inserted for ${bankKey}`);
