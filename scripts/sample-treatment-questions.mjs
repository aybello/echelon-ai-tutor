import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Ontario treatment banks use keys like class1-water, class1-wastewater
const banks = [
  'class1-water', 'class2-water', 'class3-water', 'class4-water',
  'class1-wastewater', 'class2-wastewater', 'class3-wastewater', 'class4-wastewater'
];

for (const bankId of banks) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`BANK: ${bankId}`);
  console.log('='.repeat(60));
  
  // Get count
  const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM questions WHERE bankKey = ?', [bankId]);
  console.log(`Total questions: ${cnt}`);
  
  // Sample 5 random questions
  const [rows] = await conn.query(
    'SELECT question, options, correctIndex FROM questions WHERE bankKey = ? ORDER BY RAND() LIMIT 5',
    [bankId]
  );
  
  for (const q of rows) {
    const opts = JSON.parse(q.options);
    console.log('\n---');
    console.log('Q:', q.question);
    opts.forEach((o, i) => console.log(String.fromCharCode(65 + i) + ':', o));
    console.log('Correct:', String.fromCharCode(65 + q.correctIndex), '→', opts[q.correctIndex]);
  }
}

await conn.end();
process.exit(0);
