import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

const [rows] = await db.execute(
  'SELECT bankKey, COUNT(*) as cnt FROM questions GROUP BY bankKey ORDER BY bankKey'
);

let total = 0;
for (const row of rows) {
  console.log(`${row.bankKey}: ${row.cnt}`);
  total += Number(row.cnt);
}
console.log(`\nTotal banks: ${rows.length}`);
console.log(`Total questions: ${total}`);

await db.end();
