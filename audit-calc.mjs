import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ── 1. Fix OIT Q86: change pipe length from 10m to 100m so hf ≈ 1.088m ≈ 1.0m ──
const fixedQuestion = `A pump is installed 5 meters above a clearwell. The suction pipe is 100 meters long with a diameter of 0.15 m. If the flow rate is 0.02 m³/s and the friction factor is 0.025, calculate the friction head loss in the suction pipe. (g = 9.81 m/s²)`;
const fixedExplanation = `Use the Darcy-Weisbach equation: hf = f × (L/D) × (V²/2g)

Step 1 — Calculate pipe cross-sectional area:
A = π/4 × D² = π/4 × (0.15)² = 0.01767 m²

Step 2 — Calculate flow velocity:
V = Q/A = 0.02 / 0.01767 = 1.132 m/s

Step 3 — Apply Darcy-Weisbach:
hf = 0.025 × (100/0.15) × (1.132²/(2 × 9.81))
hf = 0.025 × 666.67 × (1.281/19.62)
hf = 0.025 × 666.67 × 0.06529
hf ≈ 1.088 m ≈ 1.0 m

The friction head loss is approximately 1.0 m.`;

await conn.execute(
  `UPDATE questions SET question = ?, explanation = ? WHERE bankKey = 'oit' AND questionNum = 86`,
  [fixedQuestion, fixedExplanation]
);
console.log('✅ Fixed OIT Q86');

// ── 2. Export all calc questions for audit ──
const [rows] = await conn.execute(
  `SELECT id, bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation
   FROM questions
   WHERE isCalc = 'yes'
   ORDER BY bankKey, questionNum`
);

console.log(`\n📊 Total calc questions: ${rows.length}`);

// Write to JSON for LLM audit
fs.writeFileSync('/home/ubuntu/calc-questions.json', JSON.stringify(rows, null, 2));
console.log('✅ Exported to /home/ubuntu/calc-questions.json');

// Summary by bank
const byBank = {};
for (const r of rows) {
  byBank[r.bankKey] = (byBank[r.bankKey] || 0) + 1;
}
console.log('\nCalc questions by bank:');
for (const [bank, count] of Object.entries(byBank).sort()) {
  console.log(`  ${bank}: ${count}`);
}

await conn.end();
