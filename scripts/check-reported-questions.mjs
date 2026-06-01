import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT id, bankKey, question, options, correctIndex, explanation, module FROM questions WHERE id IN (10, 6, 11)'
);

for (const r of rows) {
  console.log('\n=== Q ID:', r.id, '| Bank:', r.bankKey, '| Module:', r.module, '===');
  console.log('Q:', r.question);
  const opts = JSON.parse(r.options);
  opts.forEach((o, i) => console.log(`  ${i}) ${o}`));
  console.log('Correct index:', r.correctIndex, '→', opts[r.correctIndex]);
  console.log('Explanation:', r.explanation?.slice(0, 300));
}

await conn.end();
process.exit(0);
