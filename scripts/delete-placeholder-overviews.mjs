import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

const keys = [
  'class1-water-dist','class2-water-dist','class3-water-dist','class4-water-dist',
  'class1-wastewater-coll','class2-wastewater-coll','class3-wastewater-coll','class4-wastewater-coll'
];

for (const key of keys) {
  const [result] = await db.execute('DELETE FROM module_overviews WHERE bankKey = ?', [key]);
  console.log(`Deleted ${result.affectedRows} rows for ${key}`);
}

await db.end();
process.exit(0);
