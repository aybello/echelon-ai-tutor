/**
 * fix_noncalc_batch2.mjs
 * Fixes Q91 (wrong correctIndex) and Q97 (misleading question about max chlorine).
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

// ID 35116 (oit Q#91): SDWA does not specify max operating pressure
// Correct answer should be option A (index 0) = "does not specify"
// Current correctIndex = 3 (800 kPa) — wrong
await updateQ(35116, {
  correctIndex: 0,
  explanation: `The Safe Drinking Water Act, 2002 (SDWA) focuses on water quality, safety standards, and operator certification — it does not specify a maximum permissible operating pressure for municipal water distribution systems.

Operating pressure requirements are governed by engineering standards and design guidelines (such as those from the American Water Works Association and Ontario's Design Guidelines for Drinking Water Systems), not by the SDWA itself. Typical distribution system pressures range from 275–700 kPa (40–100 psi), but these are engineering guidelines, not regulatory maximums under the SDWA.`
});

// ID 35122 (oit Q#97): Rewrite question to ask about minimum chlorine residual (which IS in the regulation)
// O. Reg. 170/03 s. 7(1) specifies a minimum free chlorine residual of 0.05 mg/L
await updateQ(35122, {
  question: "Under Ontario's Drinking Water Systems Regulation (O. Reg. 170/03), what is the minimum free chlorine residual that must be maintained at all points in the distribution system?",
  options: [
    "0.5 mg/L",
    "0.2 mg/L",
    "0.05 mg/L",
    "1.0 mg/L"
  ],
  correctIndex: 2,
  explanation: `O. Reg. 170/03, Schedule 1, Table 2 specifies that a minimum free chlorine residual of 0.05 mg/L must be maintained at all points in the distribution system at all times.

This minimum residual ensures that a disinfectant barrier is maintained throughout the distribution system to prevent microbial regrowth and protect public health. If the residual drops below 0.05 mg/L at any point, the operator must investigate and take corrective action.

Note: While there is no regulatory maximum for chlorine residual, operational best practices and the aesthetic objective from Health Canada's Guidelines for Canadian Drinking Water Quality suggest keeping residuals below 4 mg/L to minimize taste and odour complaints.`
});

// Also check and fix the remaining flagged questions from the first 18:
// ID 35101 (oit Q#76): "critical pump station components under Ontario regulations"
// The LLM flagged this as low-confidence. Let's check it.
const [q76] = await pool.execute("SELECT id, question, options, correctIndex, explanation FROM questions WHERE id = 35101");
if (q76[0]) {
  const opts = JSON.parse(q76[0].options);
  console.log(`\nID 35101 Q#76:`);
  console.log(`Q: ${q76[0].question.substring(0, 150)}`);
  opts.forEach((o, i) => console.log(`  ${['A','B','C','D'][i]}) ${o.substring(0, 80)}`));
  console.log(`Correct: ${q76[0].correctIndex} -> ${opts[q76[0].correctIndex]?.substring(0, 60)}`);
  console.log(`Expl: ${q76[0].explanation?.substring(0, 200)}`);
}

console.log('\n=== Batch 2 non-calc fixes complete ===');
await pool.end();
