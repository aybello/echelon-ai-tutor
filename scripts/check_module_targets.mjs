import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT bankKey, moduleTargets FROM question_bank_meta WHERE bankKey LIKE 'wpi-class4%' ORDER BY bankKey"
);
for (const r of rows) {
  console.log(`\n=== ${r.bankKey} ===`);
  console.log(r.moduleTargets || 'NULL');
}
await conn.end();
