import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT bankKey, module, COUNT(*) as cnt FROM questions WHERE bankKey IN ('wpi-class4-water','wpi-class4-wastewater') GROUP BY bankKey, module ORDER BY bankKey, cnt DESC"
);
for (const r of rows) console.log(`${r.bankKey} | ${r.module} | ${r.cnt}`);
await conn.end();
