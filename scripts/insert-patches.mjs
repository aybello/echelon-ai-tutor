import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const PATCHES = [
  { bankKey: 'class2-water',      file: '/tmp/class2-water-patch.json' },
  { bankKey: 'class1-water-dist', file: '/tmp/class1-water-dist-patch.json' },
];

const db = await createConnection(process.env.DATABASE_URL);

for (const { bankKey, file } of PATCHES) {
  const questions = JSON.parse(readFileSync(file, 'utf8'));

  // Normalize options
  for (const q of questions) {
    if (typeof q.options === 'string') {
      try { q.options = JSON.parse(q.options); } catch { q.options = null; }
    }
  }

  const valid = questions.filter(q =>
    q.question && q.options && Array.isArray(q.options) && q.options.length === 4 &&
    q.correctIndex !== undefined && q.correctIndex !== null &&
    q.correctIndex >= 0 && q.correctIndex <= 3 &&
    q.explanation
  );

  const [[maxRow]] = await db.execute(
    'SELECT MAX(questionNum) as maxNum FROM questions WHERE bankKey = ?',
    [bankKey]
  );
  const startNum = (maxRow.maxNum || 0) + 1;

  let inserted = 0;
  for (let i = 0; i < valid.length; i++) {
    const q = valid[i];
    await db.execute(
      `INSERT INTO questions (bankKey, questionNum, question, options, correctIndex, explanation, difficulty, module)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bankKey, startNum + i, q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, q.difficulty || 'medium', q.module || null]
    );
    inserted++;
  }

  const [[countRow]] = await db.execute('SELECT COUNT(*) as cnt FROM questions WHERE bankKey = ?', [bankKey]);
  console.log(`${bankKey}: inserted ${inserted}, total now ${countRow.cnt}`);
}

await db.end();
