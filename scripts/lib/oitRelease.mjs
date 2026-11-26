import { sameStoredContent } from './oitImporter.mjs';

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Compare the full database bank, not a preview or a sample. No mutations. */
export function planOitRelease(payloads, rows) {
  const changes = [];
  const errors = [];
  const banks = [];
  for (const payload of payloads) {
    const bankRows = rows.filter(row => row.bankKey === payload.bankKey);
    let visible = 0;
    let staged = 0;
    for (const question of payload.questions) {
      const label = `${payload.bankKey}#${question.questionNum}`;
      const matches = bankRows.filter(row => Number(row.questionNum) === question.questionNum);
      if (matches.length !== 1) { errors.push(`${label}: ${matches.length ? 'duplicate number' : 'missing'}`); continue; }
      const row = matches[0];
      let equal = false;
      try { equal = sameStoredContent(row, question); } catch { /* Invalid stored JSON is a conflict. */ }
      if (!equal) { errors.push(`${label}: content conflict`); continue; }
      if (bankRows.some(other => Number(other.questionNum) !== question.questionNum
        && other.reviewStatus !== 'rejected' && normalize(other.question) === normalize(question.question))) {
        errors.push(`${label}: duplicate stem elsewhere in bank`);
        continue;
      }
      if (row.reviewStatus === 'in_review') { changes.push({ bankKey: payload.bankKey, questionNum: question.questionNum }); staged++; }
      else if (['approved', 'unreviewed'].includes(row.reviewStatus)) visible++;
      else errors.push(`${label}: ${row.reviewStatus ?? 'unknown status'}`);
    }
    const visibleBefore = bankRows.filter(row => ['approved', 'unreviewed'].includes(row.reviewStatus)).length;
    banks.push({ bankKey: payload.bankKey, packageCount: payload.questions.length,
      matchingVisible: visible, matchingStaged: staged, visibleBefore, expectedVisibleAfter: visibleBefore + staged });
  }
  return { ready: errors.length === 0, errors, banks, changes };
}

/** Lock both bank metadata rows, inspect every row, and commit the exact package together. */
export async function releaseOitPackage(connection, payloads, apply = false) {
  // TiDB rejects MySQL's START TRANSACTION READ ONLY syntax. Both paths use a
  // transaction; reconciliation issues SELECTs only and always rolls back.
  await connection.beginTransaction();
  try {
    const rows = [];
    for (const payload of payloads) {
      const [meta] = await connection.execute(`SELECT bankKey FROM question_bank_meta WHERE bankKey = ?${apply ? ' FOR UPDATE' : ''}`, [payload.bankKey]);
      if (meta.length !== 1) throw new Error(`Missing metadata: ${payload.bankKey}`);
      const [bankRows] = await connection.execute(`SELECT * FROM questions WHERE bankKey = ?${apply ? ' FOR UPDATE' : ''}`, [payload.bankKey]);
      rows.push(...bankRows);
    }
    const plan = planOitRelease(payloads, rows);
    if (!apply) { await connection.rollback(); return plan; }
    if (!plan.ready) throw new Error(`Batch blocked: ${plan.errors.join('; ')}`);
    for (const change of plan.changes) {
      const [result] = await connection.execute(
        "UPDATE questions SET reviewStatus = 'unreviewed', reviewedBy = NULL, reviewedAt = NULL WHERE bankKey = ? AND questionNum = ? AND reviewStatus = 'in_review'",
        [change.bankKey, change.questionNum]);
      if (result.affectedRows !== 1) throw new Error('Concurrent or duplicate question update');
    }
    for (const bank of plan.banks) {
      const [count] = await connection.execute("SELECT COUNT(*) AS total FROM questions WHERE bankKey = ? AND reviewStatus NOT IN ('in_review', 'rejected')", [bank.bankKey]);
      if (Number(count[0].total) !== bank.expectedVisibleAfter) throw new Error(`Visible count mismatch: ${bank.bankKey}`);
      if (bank.matchingStaged) await connection.execute(
        'UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?',
        [bank.expectedVisibleAfter, bank.bankKey]);
    }
    await connection.commit();
    return { ...plan, applied: true };
  } catch (error) { await connection.rollback(); throw error; }
}
