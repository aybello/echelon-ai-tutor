import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const db = await createConnection(process.env.DATABASE_URL);
const questions = JSON.parse(readFileSync("/home/ubuntu/wpi_class4_water_new_questions.json", "utf8"));

console.log(`Inserting ${questions.length} questions...`);

// Get current max questionNum per bank
const [maxNums] = await db.query(
  "SELECT bankKey, MAX(questionNum) as maxNum FROM questions WHERE bankKey IN ('wpi-class4-water', 'wpi-class4-wastewater') GROUP BY bankKey"
);
const maxMap = {};
maxNums.forEach(r => { maxMap[r.bankKey] = Number(r.maxNum); });
console.log("Current max questionNums:", maxMap);

let inserted = 0;
const counters = { ...maxMap };

for (const q of questions) {
  counters[q.bankKey] = (counters[q.bankKey] || 0) + 1;
  const qNum = counters[q.bankKey];
  
  const stepsJson = JSON.stringify(q.steps || []);
  const optionsJson = JSON.stringify(q.options);
  
  await db.query(
    `INSERT INTO questions (bankKey, questionNum, module, difficulty, question, correctIndex, explanation, steps, tip, isCalc, topic, options)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    [q.bankKey, qNum, q.module, q.difficulty, q.question, q.correctIndex, q.explanation, stepsJson, q.tip || "", q.isCalc || "no", optionsJson]
  );
  inserted++;
}

console.log(`Inserted: ${inserted} questions`);

// Verify final distribution
for (const bank of ['wpi-class4-water', 'wpi-class4-wastewater']) {
  const [rows] = await db.query(
    "SELECT module, COUNT(*) as q FROM questions WHERE bankKey = ? GROUP BY module ORDER BY q DESC",
    [bank]
  );
  const total = rows.reduce((s, r) => s + Number(r.q), 0);
  console.log(`\n${bank} [${total} total]:`);
  rows.forEach(r => console.log(`  ${r.module}: ${r.q} (${Math.round(Number(r.q)/total*100)}%)`));
}

await db.end();
