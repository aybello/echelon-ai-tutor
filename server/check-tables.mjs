import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SHOW TABLES');
console.log('Tables:', rows.map(r => Object.values(r)[0]));
const [qCount] = await conn.execute('SELECT COUNT(*) as cnt FROM questions');
console.log('Questions count:', qCount[0].cnt);
const [bmCount] = await conn.execute('SELECT COUNT(*) as cnt FROM question_bank_meta');
console.log('Bank meta count:', bmCount[0].cnt);
const [moCount] = await conn.execute('SELECT COUNT(*) as cnt FROM module_overviews');
console.log('Module overviews count:', moCount[0].cnt);
await conn.end();
