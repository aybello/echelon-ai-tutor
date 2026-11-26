import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);

for (const bank of ['wpi-class4-water', 'wpi-class4-wastewater']) {
  console.log(`\n=== ${bank} ===`);
  const [rows] = await db.query(
    `SELECT id, module, difficulty, question, correctIndex, explanation, steps, tip, isCalc, topic, options
     FROM questions WHERE bankKey = ? AND module IN ('Treatment Process', 'Equipment Operation & Maintenance', 'Equipment Evaluation, Maintenance & Operation')
     ORDER BY RAND() LIMIT 4`,
    [bank]
  );
  rows.forEach(r => {
    let opts = [];
    try { opts = JSON.parse(r.options); } catch(e) {}
    console.log(`\n[${r.module}] ID:${r.id} difficulty:${r.difficulty} isCalc:${r.isCalc}`);
    console.log(`Topic: ${r.topic}`);
    console.log(`Q: ${r.question}`);
    opts.forEach((o, i) => console.log(`  ${i}: ${o}`));
    console.log(`Correct index: ${r.correctIndex}`);
    console.log(`Explanation: ${r.explanation?.substring(0, 200)}`);
    if (r.steps) console.log(`Steps: ${r.steps?.substring(0, 150)}`);
    if (r.tip) console.log(`Tip: ${r.tip?.substring(0, 100)}`);
  });
}

await db.end();
