/**
 * fix_noncalc_batch4.mjs
 * Fixes Q141 (wrong regulation answer) and Q407 (SBR phase question rewrite).
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
// ID 36573 (class1-wastewater Q#141): Wrong regulation
// Question asks "which regulation governs operation of wastewater treatment plants"
// Marked answer: O. Reg. 128/04 (Certification of Operators) — WRONG
// O. Reg. 128/04 governs OPERATOR CERTIFICATION, not plant operation
// The regulation governing wastewater system OPERATION is O. Reg. 129/04 (Licensing of Sewage Works Operators)
// But the question options don't include O. Reg. 129/04
// Best fix: rewrite the question to ask about operator certification (which IS O. Reg. 128/04)
// ============================================================
await updateQ(36573, {
  question: "Which Ontario regulation governs the certification of drinking water and wastewater system operators?",
  options: [
    "O. Reg. 170/03 (Drinking Water Systems)",
    "O. Reg. 419/05 (Air Emissions)",
    "O. Reg. 267/03 (Nutrient Management)",
    "O. Reg. 128/04 (Certification of Operators)"
  ],
  correctIndex: 3,
  explanation: `O. Reg. 128/04 (Ontario Regulation 128/04) governs the certification of drinking water and wastewater system operators in Ontario. It establishes:

- The classes of operator certificates (Class I through IV for water treatment, water distribution, wastewater treatment, and wastewater collection)
- The experience and education requirements for each class
- The examination requirements for certification
- The continuing education requirements for certificate renewal
- The roles of Overall Responsible Operator (ORO) and Operator-in-Charge (OIC)

Note: The actual operation and discharge requirements for wastewater treatment plants are governed by Environmental Compliance Approvals (ECAs) issued under the Ontario Water Resources Act (OWRA), and O. Reg. 129/04 (Licensing of Sewage Works Operators).`
});

// ============================================================
// ID 36839 (class1-wastewater Q#407): SBR phase question
// Question asks "which phase removes settled sludge"
// The standard SBR phases are: Fill → React → Settle → Decant → (Idle/Waste)
// "Settled sludge removal" (WAS) is done during the Idle or Waste phase, which isn't listed
// Rewrite question to ask which phase removes TREATED EFFLUENT (answer: Decant)
// ============================================================
await updateQ(36839, {
  question: "In a sequencing batch reactor (SBR), which phase removes the treated effluent from the tank?",
  options: [
    "Settle",
    "React",
    "Fill",
    "Decant"
  ],
  correctIndex: 3,
  explanation: `In a Sequencing Batch Reactor (SBR), the five standard phases are:

1. Fill — raw wastewater enters the tank
2. React — aeration and mixing for biological treatment
3. Settle — aeration stops; activated sludge settles to the bottom
4. Decant — treated effluent is removed from the top of the tank using a floating or fixed decanter
5. Idle/Waste — excess sludge (WAS) is removed to maintain the desired SRT

The Decant phase removes the treated effluent. The decanter draws from the clarified zone above the settled sludge blanket, ensuring that solids are not carried over into the effluent.

Note: Sludge removal (WAS) occurs during the Idle/Waste phase, not the Settle phase. The Settle phase only allows the sludge to settle — it does not remove it.`
});

console.log('=== Batch 4 fixes complete ===');
await pool.end();
