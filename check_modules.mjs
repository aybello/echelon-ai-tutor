import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const banks = [
  'class1-water', 'class2-water', 'class3-water', 'class4-water',
  'class1-wastewater', 'class2-wastewater', 'class3-wastewater', 'class4-wastewater',
  'class1-water-dist', 'class2-water-dist', 'class3-water-dist', 'class4-water-dist',
  'class1-wastewater-coll', 'class2-wastewater-coll', 'class3-wastewater-coll', 'class4-wastewater-coll',
  'wpi-class1-water', 'wpi-class2-water', 'wpi-class3-water', 'wpi-class4-water',
  'wpi-class1-wastewater', 'wpi-class2-wastewater', 'wpi-class3-wastewater', 'wpi-class4-wastewater',
  'wpi-class1-water-dist', 'wpi-class2-water-dist', 'wpi-class3-water-dist', 'wpi-class4-water-dist',
  'wpi-class1-water-coll', 'wpi-class2-water-coll', 'wpi-class3-water-coll', 'wpi-class4-water-coll',
];

for (const bank of banks) {
  const [rows] = await conn.execute(
    'SELECT module, COUNT(*) as cnt FROM questions WHERE bankKey = ? GROUP BY module ORDER BY cnt DESC',
    [bank]
  );
  if (rows.length > 0) {
    console.log(`\n=== ${bank} ===`);
    rows.forEach(r => console.log(`  ${r.cnt.toString().padStart(3)} ${r.module}`));
  }
}

await conn.end();
