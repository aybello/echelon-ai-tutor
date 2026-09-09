import { createHash } from "node:crypto";

const visibleStatuses = new Set(["approved", "unreviewed"]);
const contentFields = [
  "module", "difficulty", "question", "options", "correctIndex", "explanation",
  "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective",
];

function canonicalContent(value) {
  return {
    module: value.module,
    difficulty: value.difficulty,
    question: value.question,
    options: typeof value.options === "string" ? JSON.parse(value.options) : value.options,
    correctIndex: Number(value.correctIndex),
    explanation: value.explanation,
    steps: value.steps ?? null,
    tip: value.tip ?? null,
    isCalc: value.isCalc,
    topic: value.topic ?? null,
    cognitiveLevel: value.cognitiveLevel ?? null,
    sourceTitle: value.sourceTitle ?? null,
    sourceReference: value.sourceReference ?? null,
    sourceUrl: value.sourceUrl ?? null,
    blueprintObjective: value.blueprintObjective ?? null,
  };
}

export function oitContentHash(value) {
  return createHash("sha256").update(JSON.stringify(canonicalContent(value))).digest("hex");
}

function baselineChecksum(baseline) {
  const { baselineChecksum: ignored, ...body } = baseline;
  return createHash("sha256").update(`${JSON.stringify(body, null, 2)}\n`).digest("hex");
}

function indexByNumber(rows, label, errors) {
  const indexed = new Map();
  for (const row of rows) {
    const number = Number(row.questionNum);
    if (indexed.has(number)) errors.push(`${label}#${number}: duplicate question number`);
    indexed.set(number, row);
  }
  return indexed;
}

/**
 * Compare the exact candidate against the committed pre-change production
 * baseline. This permits only a content revision of existing visible rows;
 * it never inserts, deletes, changes IDs, or changes review status.
 */
export function planOitRevision(payloads, baseline, rows) {
  const errors = [];
  const changes = [];
  const banks = [];
  if (baseline?.schemaVersion !== 1) errors.push("Unsupported or missing OIT baseline schema version.");
  if (!baseline?.baselineChecksum || baselineChecksum(baseline) !== baseline.baselineChecksum) {
    errors.push("Committed OIT production baseline checksum does not match its contents.");
  }
  const baselineBanks = new Map((baseline?.banks ?? []).map(bank => [bank.bankKey, bank]));
  for (const payload of payloads) {
    const bankLabel = payload.bankKey;
    const baselineBank = baselineBanks.get(bankLabel);
    if (!baselineBank) { errors.push(`${bankLabel}: missing committed production baseline.`); continue; }
    const payloadByNumber = indexByNumber(payload.questions, bankLabel, errors);
    const baselineByNumber = indexByNumber(baselineBank.entries ?? [], `${bankLabel} baseline`, errors);
    const storedByNumber = indexByNumber(rows.filter(row => row.bankKey === bankLabel), bankLabel, errors);
    if (payloadByNumber.size !== baselineByNumber.size || payloadByNumber.size !== storedByNumber.size) {
      errors.push(`${bankLabel}: package, baseline, and production row counts must match exactly.`);
    }
    let unchanged = 0;
    let revisions = 0;
    let visibleBefore = 0;
    for (const [questionNum, question] of payloadByNumber) {
      const baselineEntry = baselineByNumber.get(questionNum);
      const stored = storedByNumber.get(questionNum);
      const label = `${bankLabel}#${questionNum}`;
      if (!baselineEntry) { errors.push(`${label}: missing baseline entry.`); continue; }
      if (!stored) { errors.push(`${label}: missing production row.`); continue; }
      if (!visibleStatuses.has(stored.reviewStatus)) { errors.push(`${label}: unsafe review status ${stored.reviewStatus ?? "unknown"}.`); continue; }
      visibleBefore += 1;
      let storedHash;
      try { storedHash = oitContentHash(stored); } catch { errors.push(`${label}: invalid stored options JSON.`); continue; }
      if (oitContentHash(baselineEntry.content) !== baselineEntry.contentHash) {
        errors.push(`${label}: committed baseline content hash is invalid.`);
      }
      if (storedHash !== baselineEntry.contentHash) {
        errors.push(`${label}: production drift since the captured baseline.`);
        continue;
      }
      if (storedHash === oitContentHash(question)) unchanged += 1;
      else {
        changes.push({ bankKey: bankLabel, questionNum, content: canonicalContent(question) });
        revisions += 1;
      }
    }
    for (const questionNum of baselineByNumber.keys()) {
      if (!payloadByNumber.has(questionNum)) errors.push(`${bankLabel}#${questionNum}: baseline item missing from candidate package.`);
    }
    banks.push({ bankKey: bankLabel, packageCount: payloadByNumber.size, unchanged, revisions, visibleBefore, expectedVisibleAfter: visibleBefore });
  }
  for (const bank of baselineBanks.keys()) if (!payloads.some(payload => payload.bankKey === bank)) errors.push(`${bank}: baseline bank missing from candidate payload.`);
  return { ready: errors.length === 0, errors, banks, changes, baselineChecksum: baseline?.baselineChecksum };
}

/** Lock both banks, recheck the exact baseline, and update only confirmed content rows. */
export async function applyOitRevision(connection, payloads, baseline, apply = false) {
  await connection.beginTransaction();
  try {
    const rows = [];
    for (const payload of payloads) {
      const [meta] = await connection.execute(
        `SELECT bankKey FROM question_bank_meta WHERE bankKey = ?${apply ? " FOR UPDATE" : ""}`,
        [payload.bankKey],
      );
      if (meta.length !== 1) throw new Error(`Missing metadata: ${payload.bankKey}`);
      const [bankRows] = await connection.execute(
        `SELECT bankKey, questionNum, module, difficulty, question, options, correctIndex,
                explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
                sourceReference, sourceUrl, blueprintObjective, reviewStatus
         FROM questions WHERE bankKey = ? AND questionNum BETWEEN 1001 AND 1500${apply ? " FOR UPDATE" : ""}`,
        [payload.bankKey],
      );
      rows.push(...bankRows);
    }
    const plan = planOitRevision(payloads, baseline, rows);
    if (!apply) { await connection.rollback(); return plan; }
    if (!plan.ready) throw new Error(`Exact-version OIT update blocked: ${plan.errors.join("; ")}`);
    for (const change of plan.changes) {
      const c = change.content;
      const [result] = await connection.execute(
        `UPDATE questions SET module = ?, difficulty = ?, question = ?, options = ?, correctIndex = ?,
         explanation = ?, steps = ?, tip = ?, isCalc = ?, topic = ?, cognitiveLevel = ?,
         sourceTitle = ?, sourceReference = ?, sourceUrl = ?, blueprintObjective = ?
         WHERE bankKey = ? AND questionNum = ? AND reviewStatus IN ('approved', 'unreviewed')`,
        [c.module, c.difficulty, c.question, JSON.stringify(c.options), c.correctIndex,
          c.explanation, c.steps, c.tip, c.isCalc, c.topic, c.cognitiveLevel,
          c.sourceTitle, c.sourceReference, c.sourceUrl, c.blueprintObjective,
          change.bankKey, change.questionNum],
      );
      if (result.affectedRows !== 1) throw new Error(`Concurrent or unsafe question update: ${change.bankKey}#${change.questionNum}`);
    }
    for (const bank of plan.banks) {
      if (!bank.revisions) continue;
      const [count] = await connection.execute(
        "SELECT COUNT(*) AS total FROM questions WHERE bankKey = ? AND reviewStatus NOT IN ('in_review', 'rejected')",
        [bank.bankKey],
      );
      if (Number(count[0].total) !== bank.expectedVisibleAfter) throw new Error(`Visible count mismatch: ${bank.bankKey}`);
      await connection.execute(
        "UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?",
        [bank.expectedVisibleAfter, bank.bankKey],
      );
    }
    await connection.commit();
    return { ...plan, applied: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export { canonicalContent, contentFields };
