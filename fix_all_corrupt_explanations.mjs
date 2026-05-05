/**
 * fix_all_corrupt_explanations.mjs
 * Checks ALL banks for the corrupted explanation pattern:
 * "Answer text X.  Answer text more explanation"
 * and fixes them by removing the prefix.
 */

import { createPool } from "mysql2/promise";
import { config } from "dotenv";
config();

const pool = createPool(process.env.DATABASE_URL);

// Fetch all questions with explanations
const [allQ] = await pool.execute(
  "SELECT id, bankKey, questionNum, explanation FROM questions WHERE explanation IS NOT NULL AND explanation != '' ORDER BY bankKey, questionNum"
);

// Pattern: explanation starts with "some text [A-D].  some text"
// where the text before and after the letter are the same (or very similar)
// This catches: "Flocculation C.  Flocculation" and "Turbidity into and out of the tank A.  Turbidity into and out of the tank"
const CORRUPT_EXPL_RE = /^(.{5,80}?)\s+[A-D]\.\s{1,3}\1/;

const corrupted = [];
for (const q of allQ) {
  if (CORRUPT_EXPL_RE.test(q.explanation)) {
    corrupted.push(q);
  }
}

// Group by bank
const byBank = {};
for (const q of corrupted) {
  byBank[q.bankKey] = (byBank[q.bankKey] || 0) + 1;
}

console.log(`Total corrupted explanations found: ${corrupted.length}`);
console.log('\nBy bank:');
Object.entries(byBank).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

// Fix them all
console.log('\nFixing...');
let fixed = 0;
for (const q of corrupted) {
  const match = q.explanation.match(/^(.+?)\s+[A-D]\.\s{1,3}\1\s*(.*)/s);
  if (match) {
    const answerText = match[1].trim();
    const restOfExpl = match[2].trim();
    
    // Build clean explanation
    let cleanExpl;
    if (restOfExpl.length > 20) {
      cleanExpl = restOfExpl;
    } else if (restOfExpl.length > 0) {
      cleanExpl = answerText + '. ' + restOfExpl;
    } else {
      cleanExpl = answerText + '.';
    }
    
    const [r] = await pool.execute(
      "UPDATE questions SET explanation = ? WHERE id = ?",
      [cleanExpl, q.id]
    );
    if (r.affectedRows) fixed++;
  }
}

console.log(`Fixed ${fixed} corrupted explanations across all banks.`);
await pool.end();
