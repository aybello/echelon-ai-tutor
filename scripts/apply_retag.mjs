import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const db = await createConnection(process.env.DATABASE_URL);
const classifications = JSON.parse(readFileSync("/tmp/retag_classifications.json", "utf8"));

console.log(`Applying ${classifications.length} re-tags...`);

let updated = 0, skipped = 0, errors = 0;

for (const c of classifications) {
  try {
    const [result] = await db.query(
      "UPDATE questions SET module = ? WHERE id = ? AND module != ?",
      [c.correct_module, c.id, c.correct_module]
    );
    if (result.affectedRows > 0) updated++;
    else skipped++;
  } catch (e) {
    console.error(`Error on ID ${c.id}: ${e.message}`);
    errors++;
  }
}

console.log(`Updated: ${updated}, Already correct: ${skipped}, Errors: ${errors}`);

// Verify final distribution
const banks = [
  'wpi-class3-water', 'wpi-class4-water',
  'wpi-class2-wastewater', 'wpi-class3-wastewater', 'wpi-class4-wastewater'
];

console.log("\n=== Final distributions ===");
for (const bank of banks) {
  const [rows] = await db.query(
    "SELECT module, COUNT(*) as q FROM questions WHERE bankKey = ? GROUP BY module ORDER BY q DESC",
    [bank]
  );
  const total = rows.reduce((s, r) => s + Number(r.q), 0);
  const summary = rows.map(r => `${r.module}:${r.q}(${Math.round(Number(r.q)/total*100)}%)`).join(' | ');
  console.log(`${bank} [${total}]: ${summary}`);
}

await db.end();
