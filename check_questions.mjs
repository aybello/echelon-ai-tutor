import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);
const [rows] = await conn.execute(
  'SELECT id, bankKey, questionNum, module, question, options, correctIndex, explanation FROM questions WHERE id IN (86, 155, 189, 197, 469, 501) ORDER BY id'
);
for (const r of rows) {
  console.log('\n=== Q' + r.id + ' [' + r.bankKey + '] #' + r.questionNum + ' ===');
  console.log('Q: ' + r.question);
  const opts = JSON.parse(r.options);
  opts.forEach((o, i) => console.log('  ' + String.fromCharCode(65+i) + ') ' + o));
  console.log('CORRECT INDEX: ' + r.correctIndex + ' (' + String.fromCharCode(65+r.correctIndex) + ') = ' + opts[r.correctIndex]);
  console.log('EXPLANATION: ' + r.explanation.substring(0, 400));
}
await conn.end();
