import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
// First check the error report
const [reports] = await conn.execute(
  'SELECT * FROM question_error_reports WHERE questionId = 86 ORDER BY createdAt DESC LIMIT 5'
);
console.log('ERROR REPORTS:', JSON.stringify(reports, null, 2));

// Also check by questionNum in case id=86 doesn't match
const [rows] = await conn.execute(
  'SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, module, difficulty FROM questions WHERE id = 86 OR questionNum = 86 LIMIT 5'
);
console.log('QUESTIONS:', JSON.stringify(rows, null, 2));
await conn.end();
