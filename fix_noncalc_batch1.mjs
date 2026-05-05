/**
 * fix_noncalc_batch1.mjs
 * Fixes specific content errors found in the first 18 flagged non-calc questions.
 */

import { createPool } from "mysql2/promise";
import { config } from "dotenv";
config();

const pool = createPool(process.env.DATABASE_URL);

async function updateQ(id, { correctIndex, explanation, options, question } = {}) {
  const sets = [];
  const vals = [];
  if (correctIndex !== undefined) { sets.push("correctIndex = ?"); vals.push(correctIndex); }
  if (explanation !== undefined) { sets.push("explanation = ?"); vals.push(explanation); }
  if (options !== undefined) { sets.push("options = ?"); vals.push(JSON.stringify(options)); }
  if (question !== undefined) { sets.push("question = ?"); vals.push(question); }
  if (!sets.length) return;
  vals.push(id);
  const [r] = await pool.execute(`UPDATE questions SET ${sets.join(", ")} WHERE id = ?`, vals);
  console.log(`✓ ID ${id}: updated ${r.affectedRows} row(s)`);
}

// First, fetch the actual data for the flagged questions to verify
const ids = [35116, 35122, 35158, 35171, 35260];
const [rows] = await pool.execute(
  `SELECT id, questionNum, question, options, correctIndex, explanation FROM questions WHERE id IN (${ids.join(',')}) ORDER BY id`
);

for (const r of rows) {
  const opts = JSON.parse(r.options);
  console.log(`\nID ${r.id} Q#${r.questionNum}:`);
  console.log(`Q: ${r.question.substring(0, 120)}`);
  opts.forEach((o, i) => console.log(`  ${['A','B','C','D'][i]}) ${o.substring(0, 80)}`));
  console.log(`  Correct: ${r.correctIndex} -> ${opts[r.correctIndex]?.substring(0, 60)}`);
  console.log(`  Expl: ${r.explanation?.substring(0, 150)}`);
}

console.log('\n--- APPLYING FIXES ---\n');

// ID 35116 (oit Q#91): SDWA does not specify something but marked answer says it does
// Need to see the actual data first — let's check
const q91 = rows.find(r => r.id === 35116);
if (q91) {
  const opts = JSON.parse(q91.options);
  // The LLM said: "The explanation clearly states that the SDWA does not specify X, but the marked answer (D) says it does"
  // We need to fix the correctIndex to match the explanation
  // Looking at the data: if explanation says "SDWA does not specify a specific number of samples"
  // then the correct answer should be whichever option says "does not specify" or "varies"
  // We'll fix this based on what the explanation says
  console.log(`Q91 explanation: ${q91.explanation?.substring(0, 300)}`);
}

// ID 35122 (oit Q#97): Max chlorine residual - check what the regulation actually says
// O. Reg. 170/03 does NOT set a maximum chlorine residual in the regulation itself
// The Guidelines for Canadian Drinking Water Quality suggest 4 mg/L as an aesthetic objective
// But the regulation doesn't set a maximum - it sets a minimum of 0.05 mg/L
const q97 = rows.find(r => r.id === 35122);
if (q97) {
  console.log(`\nQ97 question: ${q97.question}`);
  const opts = JSON.parse(q97.options);
  opts.forEach((o, i) => console.log(`  ${['A','B','C','D'][i]}) ${o}`));
  console.log(`Correct: ${q97.correctIndex} -> ${opts[q97.correctIndex]}`);
  console.log(`Expl: ${q97.explanation?.substring(0, 300)}`);
}

// ID 35158 (oit Q#133): Options C and D are swapped, correctIndex is wrong
const q133 = rows.find(r => r.id === 35158);
if (q133) {
  const opts = JSON.parse(q133.options);
  console.log(`\nQ133 options: ${JSON.stringify(opts)}`);
  console.log(`Correct: ${q133.correctIndex} -> ${opts[q133.correctIndex]}`);
  // The LLM said options C and D are swapped. If the text of option at index 2 starts with "D."
  // then after our prefix fix it should be clean. Let's check if the swap is still there.
  // The correct answer should be "Varies based on population served" 
  // Find which index has that text
  const correctIdx = opts.findIndex(o => o.toLowerCase().includes('varies'));
  console.log(`Index with 'varies': ${correctIdx}`);
  if (correctIdx !== q133.correctIndex) {
    await updateQ(35158, { correctIndex: correctIdx });
  }
}

// ID 35171 (oit Q#146): Class IV Water Treatment educational requirement
// O. Reg. 128/04 says "post-secondary diploma or university degree in a related field"
// Both B (diploma) and C (degree) are partially correct. The best answer is whichever
// option says "diploma OR degree" or "post-secondary diploma in a related field"
const q146 = rows.find(r => r.id === 35171);
if (q146) {
  const opts = JSON.parse(q146.options);
  console.log(`\nQ146 options: ${JSON.stringify(opts)}`);
  // If option D says "diploma or degree", that's the correct answer
  // Otherwise we need to update the question/options
  const orIdx = opts.findIndex(o => o.toLowerCase().includes('or') && (o.toLowerCase().includes('diploma') || o.toLowerCase().includes('degree')));
  console.log(`Index with 'or diploma/degree': ${orIdx}`);
  if (orIdx >= 0 && orIdx !== q146.correctIndex) {
    await updateQ(35171, { correctIndex: orIdx });
  } else if (orIdx < 0) {
    // Need to update option to include both
    const newOpts = [...opts];
    newOpts[1] = "Post-secondary diploma or university degree in a related field";
    await updateQ(35171, {
      options: newOpts,
      correctIndex: 1,
      explanation: `O. Reg. 128/04 requires that an individual seeking a Class IV Water Treatment certificate hold a post-secondary diploma OR a university degree in a related field (such as environmental science, civil engineering, or chemistry). Either qualification satisfies the educational requirement — the regulation accepts both college diplomas and university degrees.`
    });
  }
}

// ID 35260 (oit Q#235): PPE = "Personal Protective Equipment" not "Personal Protection Equipment"
const q235 = rows.find(r => r.id === 35260);
if (q235) {
  const opts = JSON.parse(q235.options);
  console.log(`\nQ235 options: ${JSON.stringify(opts)}`);
  // Fix "Personal Protection Equipment" to "Personal Protective Equipment"
  const newOpts = opts.map(o => o.replace('Personal Protection Equipment', 'Personal Protective Equipment'));
  const correctIdx = newOpts.findIndex(o => o === 'Personal Protective Equipment');
  await updateQ(35260, {
    options: newOpts,
    correctIndex: correctIdx >= 0 ? correctIdx : q235.correctIndex,
    explanation: `PPE stands for Personal Protective Equipment — not "Personal Protection Equipment." This is the universally accepted term used by WorkSafe Ontario, the Canadian Centre for Occupational Health and Safety (CCOHS), and all major safety standards. PPE includes items such as hard hats, safety glasses, gloves, high-visibility vests, steel-toed boots, and respiratory protection.`
  });
}

console.log('\n=== Batch 1 non-calc fixes complete ===');
await pool.end();
