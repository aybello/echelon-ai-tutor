import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const banks = [
  'class1-water', 'class2-water', 'class3-water', 'class4-water',
  'class1-wastewater', 'class2-wastewater', 'class3-wastewater', 'class4-wastewater'
];

function flagQuality(opts, correctIdx) {
  const correctLen = opts[correctIdx].length;
  const otherLens = opts.filter((_, i) => i !== correctIdx).map(o => o.length);
  const avgOtherLen = otherLens.reduce((a, b) => a + b, 0) / otherLens.length;
  const ratio = correctLen / avgOtherLen;
  if (ratio > 2.5) return '🔴 BAD (correct answer >2.5x longer than wrong answers)';
  if (ratio > 1.8) return '🟡 MARGINAL (correct answer noticeably longer)';
  return '🟢 OK';
}

for (const bankId of banks) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`BANK: ${bankId}`);
  console.log('='.repeat(70));

  const [rows] = await conn.query(
    'SELECT question, options, correctIndex FROM questions WHERE bankKey = ? ORDER BY RAND() LIMIT 8',
    [bankId]
  );

  for (const q of rows) {
    const opts = JSON.parse(q.options);
    const flag = flagQuality(opts, q.correctIndex);
    console.log(`\n${flag}`);
    console.log('Q:', q.question);
    opts.forEach((o, i) => {
      const marker = i === q.correctIndex ? ' ✓' : '';
      console.log(`  ${String.fromCharCode(65 + i)}: ${o}${marker}`);
    });
  }
}

await conn.end();
process.exit(0);
