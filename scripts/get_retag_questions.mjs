import { createConnection } from "mysql2/promise";
import { writeFileSync } from "fs";

const db = await createConnection(process.env.DATABASE_URL);

// Banks needing re-tagging: WT Class III/IV and WWT Class II/III/IV
// Only re-tag questions currently in "Treatment Process" since that's where
// lab/source water/equipment questions got merged into
const banks = [
  { bankKey: 'wpi-class3-water', stream: 'Water Treatment', classLevel: 'III',
    areas: ['Treatment Process','Laboratory Analysis','Equipment Operation & Maintenance','Source Water Characteristics','Security, Safety & Administrative Procedures'] },
  { bankKey: 'wpi-class4-water', stream: 'Water Treatment', classLevel: 'IV',
    areas: ['Treatment Process','Laboratory Analysis','Equipment Operation & Maintenance','Source Water Characteristics','Security, Safety & Administrative Procedures'] },
  { bankKey: 'wpi-class2-wastewater', stream: 'Wastewater Treatment', classLevel: 'II',
    areas: ['Treatment Process','Equipment Evaluation, Maintenance & Operation','Laboratory Analysis','Security, Safety & Administrative Procedures'] },
  { bankKey: 'wpi-class3-wastewater', stream: 'Wastewater Treatment', classLevel: 'III',
    areas: ['Treatment Process','Equipment Evaluation, Maintenance & Operation','Laboratory Analysis','Security, Safety & Administrative Procedures'] },
  { bankKey: 'wpi-class4-wastewater', stream: 'Wastewater Treatment', classLevel: 'IV',
    areas: ['Treatment Process','Equipment Evaluation, Maintenance & Operation','Laboratory Analysis','Security, Safety & Administrative Procedures'] },
];

const allQuestions = [];

for (const bank of banks) {
  // Get ALL questions in the bank (not just Treatment Process) so we can re-verify all
  const [rows] = await db.query(
    "SELECT id, bankKey, module, question FROM questions WHERE bankKey = ? ORDER BY id",
    [bank.bankKey]
  );
  for (const row of rows) {
    allQuestions.push({
      id: row.id,
      bankKey: row.bankKey,
      currentModule: row.module,
      question: row.question,
      stream: bank.stream,
      classLevel: bank.classLevel,
      areas: bank.areas
    });
  }
  console.log(`${bank.bankKey}: ${rows.length} questions loaded`);
}

writeFileSync('/tmp/retag_questions.json', JSON.stringify(allQuestions, null, 2));
console.log(`\nTotal: ${allQuestions.length} questions saved to /tmp/retag_questions.json`);

await db.end();
