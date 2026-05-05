/**
 * check_prefix.mjs
 * Checks how many questions across all banks have the letter-prefix-in-option problem.
 * e.g., option text = "B. The operator's certificate may be suspended"
 * Also fixes them all in one pass.
 */

import { createPool } from "mysql2/promise";
import { config } from "dotenv";
config();

const pool = createPool(process.env.DATABASE_URL);

// Fetch all questions
const [allQ] = await pool.execute(
  "SELECT id, bankKey, questionNum, options, correctIndex FROM questions ORDER BY bankKey, questionNum"
);

// Pattern: option text starts with a letter followed by . or ) and a space
// e.g. "A. something", "B) something", "C. something"
const PREFIX_RE = /^[A-D][\.\)]\s+/;

let totalAffected = 0;
let bankCounts = {};
const toFix = [];

for (const q of allQ) {
  let opts;
  try { opts = JSON.parse(q.options); } catch { continue; }
  
  const hasPrefix = opts.some(o => typeof o === 'string' && PREFIX_RE.test(o));
  if (hasPrefix) {
    totalAffected++;
    bankCounts[q.bankKey] = (bankCounts[q.bankKey] || 0) + 1;
    toFix.push({ id: q.id, opts, correctIndex: q.correctIndex });
  }
}

console.log(`\nTotal questions with letter-prefix in options: ${totalAffected}`);
console.log('\nBy bank:');
Object.entries(bankCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

// Fix them all
console.log('\nFixing...');
let fixed = 0;
for (const { id, opts, correctIndex } of toFix) {
  const cleanOpts = opts.map(o => {
    if (typeof o === 'string') {
      return o.replace(PREFIX_RE, '').trim();
    }
    return o;
  });
  
  // Verify the fix looks right
  const [r] = await pool.execute(
    "UPDATE questions SET options = ? WHERE id = ?",
    [JSON.stringify(cleanOpts), id]
  );
  if (r.affectedRows) fixed++;
}

console.log(`Fixed ${fixed} questions.`);
await pool.end();
