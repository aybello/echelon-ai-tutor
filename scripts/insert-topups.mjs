/**
 * insert-topups.mjs
 * Inserts all 12 top-up question files, renumbering questions starting from 301
 * so they append cleanly to the existing 300-question banks.
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const BANKS = [
  // Water treatment top-ups
  { bankKey: 'class1-water',          file: '/tmp/class1-water-topup.json' },
  { bankKey: 'class2-water',          file: '/tmp/class2-water-topup.json' },
  { bankKey: 'class3-water',          file: '/tmp/class3-water-topup.json' },
  { bankKey: 'class4-water',          file: '/tmp/class4-water-topup.json' },
  // Distribution top-ups
  { bankKey: 'class1-water-dist',     file: '/tmp/class1-water-dist-topup.json' },
  { bankKey: 'class2-water-dist',     file: '/tmp/class2-water-dist-topup.json' },
  { bankKey: 'class3-water-dist',     file: '/tmp/class3-water-dist-topup.json' },
  { bankKey: 'class4-water-dist',     file: '/tmp/class4-water-dist-topup.json' },
  // Collection top-ups
  { bankKey: 'class1-wastewater-coll', file: '/tmp/class1-wastewater-coll-topup.json' },
  { bankKey: 'class2-wastewater-coll', file: '/tmp/class2-wastewater-coll-topup.json' },
  { bankKey: 'class3-wastewater-coll', file: '/tmp/class3-wastewater-coll-topup.json' },
  { bankKey: 'class4-wastewater-coll', file: '/tmp/class4-wastewater-coll-topup.json' },
];

const db = await createConnection(process.env.DATABASE_URL);

for (const { bankKey, file } of BANKS) {
  const questions = JSON.parse(readFileSync(file, 'utf8'));

  // Get current max questionNum for this bank
  const [[maxRow]] = await db.execute(
    'SELECT MAX(questionNum) as maxNum FROM questions WHERE bankKey = ?',
    [bankKey]
  );
  const startNum = (maxRow.maxNum || 0) + 1;

  // Normalize options: handle both array and JSON string formats
  for (const q of questions) {
    if (typeof q.options === 'string') {
      try { q.options = JSON.parse(q.options); } catch { q.options = null; }
    }
  }

  // Validate: skip questions with missing required fields or bad correctIndex
  const valid = questions.filter(q =>
    q.question && q.options && Array.isArray(q.options) && q.options.length === 4 &&
    q.correctIndex !== undefined && q.correctIndex !== null &&
    q.correctIndex >= 0 && q.correctIndex <= 3 &&
    q.explanation
  );

  if (valid.length < questions.length) {
    console.warn(`  WARNING: ${questions.length - valid.length} invalid questions skipped in ${bankKey}`);
  }

  let inserted = 0;
  for (let i = 0; i < valid.length; i++) {
    const q = valid[i];
    const questionNum = startNum + i;
    await db.execute(
      `INSERT INTO questions (bankKey, questionNum, question, options, correctIndex, explanation, difficulty, module)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bankKey,
        questionNum,
        q.question,
        JSON.stringify(q.options),
        q.correctIndex,
        q.explanation,
        q.difficulty || 'medium',
        q.module || null,
      ]
    );
    inserted++;
  }

  // Verify final count
  const [[countRow]] = await db.execute(
    'SELECT COUNT(*) as cnt FROM questions WHERE bankKey = ?',
    [bankKey]
  );
  console.log(`${bankKey}: inserted ${inserted}, total now ${countRow.cnt}`);
}

await db.end();
console.log('\nAll top-ups inserted successfully.');
