/**
 * fix_noncalc_batch5.mjs
 * Fixes class2-water questions with:
 * 1. Truncated option D text
 * 2. Corrupted explanations (start with "Answer X. Answer text" pattern)
 * 
 * Also checks how widespread the explanation corruption is across the class2-water bank.
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

// First, check how many class2-water questions have the corrupted explanation pattern
// Pattern: explanation starts with "Answer text X.  Answer text" or "Answer text A.  Answer text"
const [allQ] = await pool.execute(
  "SELECT id, questionNum, question, options, correctIndex, explanation FROM questions WHERE bankKey = 'class2-water' ORDER BY questionNum"
);

// Detect corrupted explanations: pattern is "some text [A-D].  some text" at the start
const CORRUPT_EXPL_RE = /^(.+?)\s+[A-D]\.\s{1,3}\1/;
// Detect truncated options: option text doesn't end with a period, question mark, or complete word
// and is shorter than expected
const corrupted = [];
const truncated = [];

for (const q of allQ) {
  const opts = JSON.parse(q.options);
  
  // Check for corrupted explanation
  if (q.explanation && CORRUPT_EXPL_RE.test(q.explanation)) {
    corrupted.push(q);
  }
  
  // Check for truncated options (doesn't end with punctuation and is < 60 chars)
  const hasTruncated = opts.some(o => typeof o === 'string' && o.length > 10 && o.length < 60 && !/[.?!)]$/.test(o.trim()));
  if (hasTruncated) {
    truncated.push(q);
  }
}

console.log(`class2-water questions with corrupted explanations: ${corrupted.length}`);
console.log(`class2-water questions with potentially truncated options: ${truncated.length}`);

// Fix corrupted explanations by removing the "Answer X.  Answer" prefix
let fixedExpl = 0;
for (const q of corrupted) {
  // The explanation starts with "correct answer text X.  correct answer text more explanation"
  // We want to remove the "correct answer text X.  " prefix
  const match = q.explanation.match(/^(.+?)\s+[A-D]\.\s{1,3}\1\s*(.*)/s);
  if (match) {
    const answerText = match[1];
    const restOfExpl = match[2];
    // Build clean explanation: just the answer text + rest
    const cleanExpl = restOfExpl.trim().length > 20 
      ? restOfExpl.trim()
      : answerText + (restOfExpl.trim() ? '. ' + restOfExpl.trim() : '.');
    await updateQ(q.id, { explanation: cleanExpl });
    fixedExpl++;
  }
}
console.log(`Fixed ${fixedExpl} corrupted explanations.`);

// Now fix the specific truncated options we identified
// These need manual content fixes since we can't auto-complete truncated text
const specificFixes = [
  {
    id: 37104, // Q#22: "Dissolved oxygen content to verify there is no"
    options: [
      "Coliform sampling at the tank outlet",
      "Conductivity into and out of the tank",
      "Turbidity into and out of the tank",
      "Dissolved oxygen content at the tank outlet"
    ],
    correctIndex: 2,
    explanation: `Turbidity readings taken at the inlet and outlet of a sedimentation tank give the operator a quick indication of how well the sedimentation process is performing. A significant reduction in turbidity from inlet to outlet indicates effective settling. If the turbidity difference is small, it may indicate short-circuiting, poor floc formation, or inadequate detention time.`
  },
  {
    id: 37131, // Q#49: "There is no difference since both have"
    options: [
      "The disinfectants may cancel each other out",
      "The chloramines may increase",
      "The ammonia may increase",
      "There is no difference since both are effective disinfectants"
    ],
    correctIndex: 0,
    explanation: `When water disinfected with free chlorine is blended with water disinfected with chloramines, the free chlorine can react with the ammonia in the chloramine compound, breaking down the chloramines and reducing the overall disinfection residual. This "chlorine demand" from the chloramine reaction can effectively cancel out the disinfection protection in the blended water, creating a zone with inadequate residual.`
  },
  {
    id: 37136, // Q#54: "Turbidity increases lower the efficiency of"
    options: [
      "Turbidity has no effect on the chemical reactions",
      "Turbidity increases will lower disinfection efficiency",
      "Turbidity increases lower the efficiency of chlorination",
      "Turbidity increases will increase the overall disinfection effectiveness"
    ],
    correctIndex: 2,
    explanation: `Turbidity reduces the effectiveness of chlorine disinfection because suspended particles can shield microorganisms from direct contact with the disinfectant. Pathogens embedded within or attached to particles are protected from chlorine, requiring higher doses or longer contact times to achieve the same level of inactivation. This is why filtered water (low turbidity) requires significantly less chlorine than unfiltered water.`
  },
  {
    id: 37104, // Already handled above, skip
  }
];

for (const fix of specificFixes) {
  if (!fix || !fix.id) continue;
  await updateQ(fix.id, {
    options: fix.options,
    correctIndex: fix.correctIndex,
    explanation: fix.explanation
  });
}

// Also fix Q#37119 (Tuberculation explanation) - has "D. Tuberculation" prefix
const q37119 = allQ.find(q => q.id === 37119);
if (q37119) {
  await updateQ(37119, {
    explanation: `Tuberculation refers to the formation of small, mound-like deposits of corrosion products (primarily iron oxides and hydroxides) on the interior walls of metallic pipes. These tubercles form over pits caused by localized corrosion and can:

- Reduce the pipe's internal diameter and flow capacity
- Increase head loss and pumping costs
- Harbour bacteria (including Legionella) within the porous structure
- Cause discoloured (red/brown) water when disturbed by flow changes
- Eventually lead to pipe failure if the underlying corrosion is not controlled

Tuberculation is most common in unlined cast iron and ductile iron pipes and can be prevented or controlled through corrosion inhibitor addition, pH adjustment, or pipe lining/replacement.`
  });
}

// Fix Q#37140 (TTHM MCL) - explanation is just "0.080 mg/l A.  0.080 mg/l"
const q37140 = allQ.find(q => q.id === 37140);
if (q37140) {
  await updateQ(37140, {
    explanation: `Under the US EPA Stage II Disinfectants/Disinfection Byproducts (D/DBP) Rule, the Maximum Contaminant Level (MCL) for Total Trihalomethanes (TTHMs) is 0.080 mg/L (80 μg/L), measured as a Locational Running Annual Average (LRAA).

In Canada, Health Canada's Guidelines for Canadian Drinking Water Quality set the maximum acceptable concentration (MAC) for total trihalomethanes at 0.100 mg/L (100 μg/L).

Trihalomethanes (THMs) are disinfection byproducts formed when chlorine reacts with natural organic matter (NOM) in source water. The four regulated THMs are: chloroform, bromodichloromethane, dibromochloromethane, and bromoform.`
  });
}

// Fix Q#37144 (PAC and TTHM) - explanation is corrupted
const q37144 = allQ.find(q => q.id === 37144);
if (q37144) {
  await updateQ(37144, {
    explanation: `Powdered Activated Carbon (PAC) does NOT contribute to higher TTHM levels — in fact, it reduces them. PAC adsorbs natural organic matter (NOM) from the water before chlorination, thereby reducing the precursor material available to form THMs.

The following factors DO contribute to higher TTHM levels:
- Higher pH: increases the rate of THM formation
- Higher chlorine concentrations: more chlorine available to react with NOM
- Higher temperatures: accelerates the reaction rate between chlorine and NOM
- Higher NOM concentrations (not listed, but a key factor)
- Longer contact time with chlorine

PAC is actually a treatment strategy used to REDUCE THM formation by removing NOM precursors before disinfection.`
  });
}

// Fix Q#37139 (Chlorine Dioxide → chlorite) - explanation is just "Chlorine Dioxide B.  Chlorine Dioxide"
const q37139 = allQ.find(q => q.id === 37139);
if (q37139) {
  await updateQ(37139, {
    explanation: `Chlorine dioxide (ClO₂) is the disinfectant responsible for the formation of chlorite (ClO₂⁻) as a disinfection byproduct.

When chlorine dioxide reacts with organic matter or is reduced during disinfection, it forms chlorite and chlorate. The reaction is:
  ClO₂ + e⁻ → ClO₂⁻ (chlorite)

Health Canada's Guidelines for Canadian Drinking Water Quality set a maximum acceptable concentration (MAC) of 1.0 mg/L for chlorite and 1.0 mg/L for chlorate.

Note: Chlorine dioxide itself is not a chlorine compound — it is a separate disinfectant used for taste and odour control, colour removal, and as an alternative to chlorine to minimize THM formation.`
  });
}

console.log('\n=== Batch 5 class2-water fixes complete ===');
await pool.end();
