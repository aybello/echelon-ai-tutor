/** Content-only export. All database statements run in a read-only snapshot. */
import { createConnection } from 'mysql2/promise';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const bankKey = 'wpi-class4-wastewater';
const output = process.argv[2] || 'export-wpi-class4-wastewater-review.json';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL using the existing secure project configuration.');
const db = await createConnection(process.env.DATABASE_URL);
try {
  await db.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const [counts] = await db.execute('SELECT COUNT(*) AS total FROM questions WHERE bankKey = ?', [bankKey]);
  const [questions] = await db.execute(`SELECT id, bankKey, questionNum, module, difficulty,
    question, options, correctIndex, explanation, steps, tip, isCalc, topic,
    cognitiveLevel, sourceTitle, sourceReference, sourceUrl, blueprintObjective,
    reviewStatus FROM questions WHERE bankKey = ? ORDER BY questionNum, id`, [bankKey]);
  if (!questions.length || questions.length !== Number(counts[0].total)) {
    throw new Error('Empty or incomplete export: no audit file written.');
  }
  await db.rollback();
  const grouped = (key) => questions.reduce((totals, row) => {
    const value = row[key] ?? '(unset)';
    totals[value] = (totals[value] || 0) + 1;
    return totals;
  }, {});
  const payload = {
    formatVersion: 1,
    bankKey,
    exportedAt: new Date().toISOString(),
    total: questions.length,
    statusCounts: grouped('reviewStatus'),
    moduleCounts: grouped('module'),
    questionRowsSha256: createHash('sha256').update(JSON.stringify(questions)).digest('hex'),
    questions,
  };
  // Exclusive creation prevents accidentally overwriting an earlier evidence snapshot.
  await writeFile(output, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Exported ${questions.length} questions from ${bankKey} to ${output}. No database changes.`);
} finally {
  await db.end();
}
