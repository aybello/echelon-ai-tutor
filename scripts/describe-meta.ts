import { getDb } from '../server/db';

async function main() {
  const db = await getDb();
  const [rows] = await (db as any).execute('DESCRIBE question_bank_meta');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
