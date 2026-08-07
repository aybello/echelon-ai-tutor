import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT bankKey, COUNT(*) as total, MAX(questionNum) as maxNum FROM questions WHERE bankKey IN ('wpi-class4-water','wpi-class4-wastewater') GROUP BY bankKey"
);
console.log(JSON.stringify(rows, null, 2));
await conn.end();
