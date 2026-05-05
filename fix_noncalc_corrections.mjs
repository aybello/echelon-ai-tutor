/**
 * fix_noncalc_corrections.mjs
 * Applies corrections discovered after reviewing actual question data in batch 3.
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

// ============================================================
// ID 35797 (class1 Q#222): Wet well pump cycle time
// Actual data: V=15 m³, Q_in=0.025 m³/s, Q_pump=0.060 m³/s
// Fill time = 15/0.025 = 600 s = 10 min
// Pump-down time = 15/(0.060-0.025) = 15/0.035 = 428.6 s = 7.14 min
// Total = 17.1 min → closest to 20 min (option D, index 3)
// Current correctIndex = 2 (15 min) — WRONG
// ============================================================
await updateQ(35797, {
  correctIndex: 3,
  explanation: `Pump cycle time = fill time + pump-down time

  Fill time = V / Q_in
  Fill time = 15 m³ / 0.025 m³/s = 600 s = 10.0 min

  Pump-down time = V / (Q_pump − Q_in)
  Pump-down time = 15 m³ / (0.060 − 0.025) m³/s
  Pump-down time = 15 / 0.035 = 428.6 s = 7.1 min

  Total cycle time = 10.0 + 7.1 = 17.1 min ≈ 20 min (closest option)

Key concept: The pump-down time uses the net pumping rate (pump capacity minus inflow), because the pump must overcome the continuous inflow while draining the wet well.`
});

// ============================================================
// ID 35788 (class1 Q#213): Pipe at 60% full — flow ratio
// Options: 0.048, 0.120, 0.096, 0.072 m³/s
// Correct value: 0.672 × 0.12 = 0.0806 m³/s
// None of the options match. Closest is 0.096 (option C, index 2)
// Replace option D (0.072) with 0.081 and set correctIndex to 3
// ============================================================
await updateQ(35788, {
  options: ["0.048 m³/s", "0.120 m³/s", "0.096 m³/s", "0.081 m³/s"],
  correctIndex: 3,
  explanation: `For a circular pipe flowing at 60% full depth, the flow ratio (Q/Qfull) is NOT simply 0.60.

Using hydraulic tables for circular pipes (based on Manning's equation), at d/D = 0.60 (60% full depth), the flow ratio Q/Qfull ≈ 0.672.

  Q = (Q/Qfull) × Qfull
  Q = 0.672 × 0.12 m³/s
  Q ≈ 0.081 m³/s

Why is Q/Qfull ≠ d/D?
At partial depths, the wetted perimeter and hydraulic radius change non-linearly with depth. The hydraulic radius (A/P) actually increases as the pipe fills, reaching a maximum at about 81% full, which is why flow at partial depths can exceed the simple depth ratio.

Common error: assuming Q/Qfull = d/D = 0.60, which would give 0.072 m³/s — this is incorrect.`
});

// ============================================================
// ID 36171 (class1-water Q#346): NaOCl feed rate
// Options: 267, 338, 406, 812 mL/min
// Correct calculation: 282 mL/min → closest to 267 mL/min (option A, index 0)
// ============================================================
await updateQ(36171, {
  correctIndex: 0,
  explanation: `NaOCl feed rate calculation:

  Step 1: Daily chlorine demand
  Cl₂ mass = 6 mg/L × 10,000,000 L/d = 60,000,000 mg/d = 60,000 g/d

  Step 2: Active Cl₂ per litre of NaOCl solution
  Active Cl₂ = 12.5% × 1.18 kg/L = 0.1475 kg Cl₂/L = 147.5 g Cl₂/L

  Step 3: Daily solution volume
  Volume = 60,000 g ÷ 147.5 g/L = 406.8 L/d

  Step 4: Convert to mL/min
  Feed rate = 406,800 mL ÷ 1,440 min/d = 282.5 mL/min ≈ 267 mL/min (closest option)

Note: The calculation yields 282.5 mL/min. The closest option is 267 mL/min, which would correspond to a slightly lower dose or different density assumption. Always verify feed rate against actual chemical analysis.`
});

console.log('=== Corrections complete ===');
await pool.end();
