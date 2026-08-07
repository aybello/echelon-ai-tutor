import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);

const banks = [
  'wpi-class1-water', 'wpi-class2-water', 'wpi-class3-water', 'wpi-class4-water',
  'wpi-class1-wastewater', 'wpi-class2-wastewater', 'wpi-class3-wastewater', 'wpi-class4-wastewater',
  'wpi-class1-water-dist', 'wpi-class2-water-dist', 'wpi-class3-water-dist', 'wpi-class4-water-dist',
  'wpi-class1-wastewater-coll', 'wpi-class2-wastewater-coll', 'wpi-class3-wastewater-coll', 'wpi-class4-wastewater-coll'
];

for (const bank of banks) {
  const [rows] = await db.query(
    "SELECT module, COUNT(*) as q FROM questions WHERE bankKey = ? GROUP BY module ORDER BY module",
    [bank]
  );
  const total = rows.reduce((s, r) => s + Number(r.q), 0);
  console.log(`\n=== ${bank} (${total} total) ===`);
  rows.forEach(r => console.log(`  ${r.module}: ${r.q}`));
}

await db.end();
