import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const banks = ['wpi-class1-water','wpi-class2-water','wpi-class3-water','wpi-class4-water',
  'wpi-class1-wastewater','wpi-class2-wastewater','wpi-class3-wastewater','wpi-class4-wastewater',
  'wpi-class1-water-dist','wpi-class2-water-dist','wpi-class3-water-dist','wpi-class4-water-dist',
  'wpi-class1-wastewater-coll','wpi-class2-wastewater-coll','wpi-class3-wastewater-coll','wpi-class4-wastewater-coll'];
for (const bank of banks) {
  const [rows] = await conn.execute(
    "SELECT module, COUNT(*) as cnt FROM questions WHERE bankKey=? GROUP BY module ORDER BY cnt DESC",
    [bank]
  );
  const total = rows.reduce((s,r) => s + Number(r.cnt), 0);
  console.log(`\n${bank} (${total} q):`);
  for (const r of rows) console.log(`  ${r.module}: ${r.cnt} (${Math.round(r.cnt/total*100)}%)`);
}
await conn.end();
