import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);
const [rows] = await db.query("SELECT bankKey, MAX(questionNum) as maxNum, COUNT(*) as total FROM questions WHERE bankKey IN ('wpi-class4-water','wpi-class4-wastewater') GROUP BY bankKey");
rows.forEach(r => console.log(r.bankKey, 'max:', r.maxNum, 'total:', r.total));
await db.end();
