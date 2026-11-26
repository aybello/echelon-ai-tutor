import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) throw new Error('DB connection failed');
  const [rows] = await (db as any).execute(sql`
    SELECT DISTINCT bankKey,
      module as first_module
    FROM questions
    WHERE module LIKE '%istrib%'
       OR module LIKE '%ollect%'
    ORDER BY bankKey, module
  `);
  for (const row of rows as any[]) {
    console.log(`${row.bankKey}  |  ${row.first_module}`);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
