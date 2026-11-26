import { createHash } from "node:crypto";
import { canonicalContent, oitContentHash } from "./oitRevision.mjs";

const visibleStatuses = new Set(["approved", "unreviewed"]);

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableBaselineChecksum(baseline) {
  const { baselineChecksum: _ignored, ...body } = baseline;
  return hash(`${JSON.stringify(body, null, 2)}\n`);
}

function stablePayloadChecksum(payload) {
  const { payloadChecksum: _ignored, ...body } = payload;
  return hash(JSON.stringify(body));
}

function keyOf(value) {
  return `${value.bankKey}:${Number(value.questionNum)}`;
}

function assertCandidateShape(candidate, errors) {
  const label = keyOf(candidate);
  if (!candidate.question || !candidate.explanation || !candidate.sourceTitle || !candidate.sourceReference || !candidate.sourceUrl) errors.push(`${label}: incomplete instructional or source metadata.`);
  if (!Array.isArray(candidate.options) || candidate.options.length !== 4 || new Set(candidate.options.map((option) => option.trim().toLowerCase())).size !== 4) errors.push(`${label}: requires four distinct options.`);
  if (!Number.isInteger(Number(candidate.correctIndex)) || Number(candidate.correctIndex) < 0 || Number(candidate.correctIndex) > 3) errors.push(`${label}: invalid correct index.`);
  if (Array.isArray(candidate.options) && Number.isInteger(Number(candidate.correctIndex)) && candidate.options.length === 4) {
    const correctLength = candidate.options[Number(candidate.correctIndex)]?.trim().length ?? Infinity;
    const maxDistractor = Math.max(...candidate.options.filter((_, index) => index !== Number(candidate.correctIndex)).map((option) => option.trim().length));
    if (correctLength > maxDistractor * 1.2) errors.push(`${label}: answer-length cue exceeds the release threshold.`);
  }
}

export function createHistoricalSubsetBaseline(payload, rows, attemptCounts = []) {
  const errors = [];
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload?.candidates)) errors.push("Unsupported staged historical subset payload.");
  if (!payload?.payloadChecksum || stablePayloadChecksum(payload) !== payload.payloadChecksum) errors.push("Staged payload checksum does not match its contents.");
  const candidateByKey = new Map();
  for (const candidate of payload?.candidates ?? []) {
    const label = keyOf(candidate);
    if (candidateByKey.has(label)) errors.push(`${label}: duplicate staged candidate.`);
    candidateByKey.set(label, candidate);
    assertCandidateShape(candidate, errors);
  }
  const rowByKey = new Map();
  for (const row of rows) {
    const label = keyOf(row);
    if (rowByKey.has(label)) errors.push(`${label}: duplicate production row.`);
    rowByKey.set(label, row);
  }
  const attemptsByKey = new Map(attemptCounts.map((entry) => [`${entry.bankKey}:${Number(entry.questionNum)}`, Number(entry.attemptCount)]));
  const entries = [];
  for (const [label, candidate] of candidateByKey) {
    const row = rowByKey.get(label);
    if (!row) { errors.push(`${label}: missing production historical row.`); continue; }
    if (!visibleStatuses.has(row.reviewStatus)) { errors.push(`${label}: unsafe review status ${row.reviewStatus}.`); continue; }
    entries.push({
      id: Number(row.id), bankKey: row.bankKey, questionNum: Number(row.questionNum), reviewStatus: row.reviewStatus,
      contentHash: oitContentHash(row), content: canonicalContent(row), attemptCount: attemptsByKey.get(label) ?? 0,
    });
  }
  if (entries.length !== candidateByKey.size) errors.push("Baseline does not cover every staged candidate.");
  if (errors.length) throw new Error(`Historical subset baseline blocked: ${errors.join("; ")}`);
  const body = { schemaVersion: 1, createdAtUtc: new Date().toISOString(), purpose: "Pre-update rollback snapshot for the approved historical OIT subset revision.", stagedPayloadChecksum: payload.payloadChecksum, entries };
  return { ...body, baselineChecksum: stableBaselineChecksum(body) };
}

export function planHistoricalSubsetRevision(payload, baseline, rows, visibleTotals = {}, attemptCounts = []) {
  const errors = [];
  const changes = [];
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload?.candidates)) errors.push("Unsupported staged historical subset payload.");
  if (!payload?.payloadChecksum || stablePayloadChecksum(payload) !== payload.payloadChecksum) errors.push("Staged payload checksum does not match its contents.");
  if (baseline?.schemaVersion !== 1 || !Array.isArray(baseline?.entries)) errors.push("Unsupported subset baseline.");
  if (!baseline?.baselineChecksum || stableBaselineChecksum(baseline) !== baseline.baselineChecksum) errors.push("Subset baseline checksum does not match its contents.");
  if (baseline?.stagedPayloadChecksum !== payload?.payloadChecksum) errors.push("Subset baseline is not bound to this staged payload.");
  const candidateByKey = new Map();
  for (const candidate of payload?.candidates ?? []) {
    const label = keyOf(candidate);
    if (candidateByKey.has(label)) errors.push(`${label}: duplicate staged candidate.`);
    candidateByKey.set(label, candidate);
    assertCandidateShape(candidate, errors);
  }
  const baselineByKey = new Map();
  for (const entry of baseline?.entries ?? []) {
    const label = keyOf(entry);
    if (baselineByKey.has(label)) errors.push(`${label}: duplicate baseline entry.`);
    baselineByKey.set(label, entry);
  }
  const rowByKey = new Map();
  for (const row of rows) {
    const label = keyOf(row);
    if (rowByKey.has(label)) errors.push(`${label}: duplicate stored row.`);
    rowByKey.set(label, row);
  }
  const attemptsByKey = new Map(attemptCounts.map((entry) => [`${entry.bankKey}:${Number(entry.questionNum)}`, Number(entry.attemptCount)]));
  const bankSummary = new Map();
  for (const [label, candidate] of candidateByKey) {
    const entry = baselineByKey.get(label);
    const row = rowByKey.get(label);
    if (!entry) { errors.push(`${label}: missing baseline entry.`); continue; }
    if (!row) { errors.push(`${label}: missing production row.`); continue; }
    if (Number(row.id) !== Number(entry.id)) { errors.push(`${label}: production row identity drift.`); continue; }
    if (row.reviewStatus !== entry.reviewStatus || !visibleStatuses.has(row.reviewStatus)) { errors.push(`${label}: review status drift or unsafe status.`); continue; }
    if (Number(attemptsByKey.get(label) ?? 0) !== Number(entry.attemptCount ?? 0)) { errors.push(`${label}: learner-attempt count drift.`); continue; }
    const storedHash = oitContentHash(row);
    // Historical exports contain learner-taxonomy labels such as "understand" and
    // "remember" while the deployed schema permits only recall/application. This
    // release does not change cognitive taxonomy, so retain the currently stored
    // schema-valid value rather than coercing or discarding it during content repair.
    const candidateForUpdate = { ...candidate, cognitiveLevel: row.cognitiveLevel };
    const candidateHash = oitContentHash(candidateForUpdate);
    const summary = bankSummary.get(candidate.bankKey) ?? { bankKey: candidate.bankKey, total: 0, unchanged: 0, revisions: 0, visibleBefore: Number(visibleTotals[candidate.bankKey] ?? 0), expectedVisibleAfter: Number(visibleTotals[candidate.bankKey] ?? 0) };
    summary.total += 1;
    if (storedHash === candidateHash) summary.unchanged += 1;
    else if (storedHash === entry.contentHash) {
      summary.revisions += 1;
      changes.push({ id: Number(row.id), bankKey: candidate.bankKey, questionNum: Number(candidate.questionNum), reviewStatus: entry.reviewStatus, content: canonicalContent(candidateForUpdate) });
    } else errors.push(`${label}: content drift since baseline.`);
    bankSummary.set(candidate.bankKey, summary);
  }
  for (const label of baselineByKey.keys()) if (!candidateByKey.has(label)) errors.push(`${label}: baseline entry has no staged candidate.`);
  if (candidateByKey.size !== baselineByKey.size || candidateByKey.size !== rowByKey.size) errors.push("Subset candidate, baseline, and production row counts must match exactly.");
  return { ready: errors.length === 0, errors, changes, banks: [...bankSummary.values()].sort((a, b) => a.bankKey.localeCompare(b.bankKey)), payloadChecksum: payload?.payloadChecksum, baselineChecksum: baseline?.baselineChecksum };
}

export async function applyHistoricalSubsetRevision(connection, payload, baseline, apply = false) {
  await connection.beginTransaction();
  try {
    const candidatesByBank = new Map();
    for (const candidate of payload.candidates) {
      const rows = candidatesByBank.get(candidate.bankKey) ?? [];
      rows.push(candidate);
      candidatesByBank.set(candidate.bankKey, rows);
    }
    const rows = [];
    const attempts = [];
    const visibleTotals = {};
    for (const [bankKey, candidates] of candidatesByBank) {
      const numbers = candidates.map((candidate) => Number(candidate.questionNum));
      const placeholders = numbers.map(() => "?").join(", ");
      const [meta] = await connection.execute(`SELECT bankKey FROM question_bank_meta WHERE bankKey = ?${apply ? " FOR UPDATE" : ""}`, [bankKey]);
      if (meta.length !== 1) throw new Error(`Missing metadata row: ${bankKey}`);
      const [bankRows] = await connection.execute(`SELECT id, bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle, sourceReference, sourceUrl, blueprintObjective, reviewStatus FROM questions WHERE bankKey = ? AND questionNum IN (${placeholders})${apply ? " FOR UPDATE" : ""}`, [bankKey, ...numbers]);
      rows.push(...bankRows);
      const [attemptRows] = await connection.execute(`SELECT q.bankKey, q.questionNum, COUNT(a.id) AS attemptCount FROM questions q LEFT JOIN question_attempts a ON a.bankKey = q.bankKey AND a.questionId = q.questionNum WHERE q.bankKey = ? AND q.questionNum IN (${placeholders}) GROUP BY q.bankKey, q.questionNum`, [bankKey, ...numbers]);
      attempts.push(...attemptRows);
      const [visible] = await connection.execute("SELECT COUNT(*) AS total FROM questions WHERE bankKey = ? AND reviewStatus NOT IN ('in_review', 'rejected')", [bankKey]);
      visibleTotals[bankKey] = Number(visible[0]?.total);
    }
    const plan = planHistoricalSubsetRevision(payload, baseline, rows, visibleTotals, attempts);
    if (!apply) { await connection.rollback(); return plan; }
    if (!plan.ready) throw new Error(`Historical approved-subset update blocked: ${plan.errors.join("; ")}`);
    for (const change of plan.changes) {
      const content = change.content;
      const [result] = await connection.execute(`UPDATE questions SET module = ?, difficulty = ?, question = ?, options = ?, correctIndex = ?, explanation = ?, steps = ?, tip = ?, isCalc = ?, topic = ?, cognitiveLevel = ?, sourceTitle = ?, sourceReference = ?, sourceUrl = ?, blueprintObjective = ? WHERE id = ? AND bankKey = ? AND questionNum = ? AND reviewStatus = ?`, [content.module, content.difficulty, content.question, JSON.stringify(content.options), content.correctIndex, content.explanation, content.steps, content.tip, content.isCalc, content.topic, content.cognitiveLevel, content.sourceTitle, content.sourceReference, content.sourceUrl, content.blueprintObjective, change.id, change.bankKey, change.questionNum, change.reviewStatus]);
      if (result.affectedRows !== 1) throw new Error(`Concurrent or unsafe update: ${change.bankKey}:${change.questionNum}`);
    }
    for (const bank of plan.banks) {
      if (!bank.revisions) continue;
      const [visible] = await connection.execute("SELECT COUNT(*) AS total FROM questions WHERE bankKey = ? AND reviewStatus NOT IN ('in_review', 'rejected')", [bank.bankKey]);
      if (Number(visible[0]?.total) !== bank.expectedVisibleAfter) throw new Error(`Visible count mismatch after update: ${bank.bankKey}`);
      await connection.execute("UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?", [bank.expectedVisibleAfter, bank.bankKey]);
    }
    await connection.commit();
    return { ...plan, applied: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export { stableBaselineChecksum, stablePayloadChecksum };
