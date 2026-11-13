import { createHash } from "node:crypto";

export const PUBLIC_QUESTION_CORRECTION_VERSION = "2026-10-17-transaction-v1";
export const EXPECTED_FIELDS = Object.freeze([
  "id", "bankKey", "questionNum", "question", "options", "correctIndex",
  "explanation", "steps", "isCalc", "reviewStatus",
]);
const ALLOWED_FIELDS = new Set(["options", "correctIndex", "explanation", "steps"]);
const key = row => `${row.bankKey}:${row.questionNum}`;
const clone = value => structuredClone(value);
function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
const serialized = value => JSON.stringify(canonical(value));
const hash = value => createHash("sha256").update(serialized(value)).digest("hex");
const equal = (left, right) => serialized(left) === serialized(right);
const sorted = rows => [...rows].sort((a, b) => key(a).localeCompare(key(b)) || (a.id ?? 0) - (b.id ?? 0));

function validateCorrections(document) {
  if (!document?.version || !Array.isArray(document.corrections) || !document.corrections.length) throw new Error("A versioned correction document is required.");
  const seen = new Set();
  const ids = new Set();
  for (const { expected, replacement } of document.corrections) {
    if (!expected || EXPECTED_FIELDS.some(field => !Object.hasOwn(expected, field)) || Object.keys(expected).some(field => !EXPECTED_FIELDS.includes(field))) throw new Error("An exact raw expected snapshot with all required fields is required.");
    if (!Number.isSafeInteger(expected.id) || !Number.isSafeInteger(expected.questionNum) || typeof expected.bankKey !== "string" || !expected.bankKey) throw new Error("Invalid correction identity.");
    if (seen.has(key(expected)) || ids.has(expected.id)) throw new Error("Duplicate correction identity.");
    seen.add(key(expected)); ids.add(expected.id);
    if (!replacement || !Object.keys(replacement).length || Object.keys(replacement).some(field => !ALLOWED_FIELDS.has(field))) throw new Error("Only declared options, correctIndex, explanation and steps may be replaced.");
    const after = { ...expected, ...replacement };
    if (after.correctIndex !== expected.correctIndex) throw new Error("Answer positions must remain unchanged, including index zero.");
    for (const [field, value] of Object.entries(replacement)) {
      if (field !== "correctIndex" && (typeof value !== "string" || value.includes("\u2014"))) throw new Error("Replacement text must be a raw string without em dashes.");
    }
    const options = JSON.parse(after.options);
    if (!Array.isArray(options) || options.length < 2 || options.some(option => typeof option !== "string" || !option.trim()) || !Number.isInteger(after.correctIndex) || after.correctIndex < 0 || after.correctIndex >= options.length) throw new Error("Invalid replacement options or answer position.");
    const steps = JSON.parse(after.steps);
    if (!Array.isArray(steps) || !steps.length || steps.some(step => typeof step.l !== "string" || !step.l.trim() || typeof step.c !== "string" || !step.c.trim())) throw new Error("Replacement steps must be complete serialized label/content pairs.");
    if (Object.keys(replacement).every(field => expected[field] === replacement[field])) throw new Error("Correction must change content.");
  }
}

/** Exact raw comparisons deliberately do not parse or normalize the expected strings. */
export function planPublicQuestionCorrection(rows, metadata, bankRows, corrections) {
  validateCorrections(corrections);
  const errors = [], warnings = [], changes = [], unchanged = [];
  const banks = [...new Set(corrections.corrections.map(item => item.expected.bankKey))].sort();
  if (rows.length !== corrections.corrections.length) errors.push("Target row count changed.");
  if (metadata.length !== banks.length) errors.push("Metadata row count changed.");
  for (const bankKey of banks) {
    const matches = metadata.filter(row => row.bankKey === bankKey);
    if (matches.length !== 1 || !Number.isSafeInteger(matches[0].contentVersion) || matches[0].contentVersion < 0 || !Number.isSafeInteger(matches[0].totalQuestions)) {
      errors.push(`${bankKey}: missing or invalid metadata`);
    } else if (bankRows.filter(row => row.bankKey === bankKey).length !== matches[0].totalQuestions) {
      warnings.push(`${bankKey}: pre-existing declared count differs from inventory; both are preserved exactly`);
    }
  }
  if (bankRows.some(row => !banks.includes(row.bankKey)) || new Set(bankRows.map(row => row.id)).size !== bankRows.length) errors.push("Invalid bank inventory.");
  for (const correction of corrections.corrections) {
    const { expected, replacement } = correction;
    const matches = rows.filter(row => row.id === expected.id);
    if (matches.length !== 1) { errors.push(`${key(expected)}: missing or duplicate row`); continue; }
    const row = matches[0];
    if (!bankRows.some(item => item.id === row.id && item.bankKey === row.bankKey && item.reviewStatus === row.reviewStatus)) errors.push(`${key(expected)}: inventory mismatch`);
    const after = { ...expected, ...replacement };
    if (EXPECTED_FIELDS.every(field => row[field] === after[field])) {
      unchanged.push({ id: expected.id, bankKey: expected.bankKey, questionNum: expected.questionNum });
    } else {
      const mismatch = EXPECTED_FIELDS.filter(field => row[field] !== expected[field]);
      if (mismatch.length) errors.push(`${key(expected)}: exact-version mismatch: ${mismatch.join(", ")}`);
      else changes.push(clone(correction));
    }
  }
  const planHash = hash({ version: PUBLIC_QUESTION_CORRECTION_VERSION, corrections, rows: sorted(rows), metadata: sorted(metadata), bankRows: sorted(bankRows) });
  return { ready: !errors.length, errors, warnings, changes, unchanged, planHash };
}

/** No inserts, deletes, status changes, history changes or content normalization. */
export async function applyPublicQuestionCorrection(connection, {
  apply = false, expectedPlanHash, backup, corrections,
} = {}) {
  // The planner and its JSON are integrated separately. Tests inject fixtures.
  const document = clone(corrections ?? (await import("../content/plan-public-question-corrections.mjs")).corrections);
  validateCorrections(document);
  if (apply && (!/^[a-f0-9]{64}$/.test(expectedPlanHash ?? "") || typeof backup !== "function")) throw new Error("Apply requires the reviewed plan hash and a durable new-file backup callback.");
  const banks = [...new Set(document.corrections.map(item => item.expected.bankKey))].sort();
  const bankParams = banks.map(() => "?").join(", ");
  const targets = document.corrections.map(item => item.expected).sort((a, b) => a.id - b.id);
  const where = targets.map(() => "(id = ? OR (bankKey = ? AND questionNum = ?))").join(" OR ");
  const targetParams = targets.flatMap(row => [row.id, row.bankKey, row.questionNum]);
  const lock = apply ? " FOR UPDATE" : "";
  const read = async () => {
    const [metadata] = await connection.execute(`SELECT * FROM question_bank_meta WHERE bankKey IN (${bankParams}) ORDER BY bankKey${lock}`, banks);
    const [bankRows] = await connection.execute(`SELECT id, bankKey, reviewStatus FROM questions WHERE bankKey IN (${bankParams}) ORDER BY bankKey, id${lock}`, banks);
    const [rows] = await connection.execute(`SELECT * FROM questions WHERE ${where} ORDER BY id${lock}`, targetParams);
    return { metadata, bankRows, rows };
  };
  if (apply) await connection.beginTransaction();
  else await connection.query("START TRANSACTION READ ONLY");
  try {
    const before = await read();
    const plan = planPublicQuestionCorrection(before.rows, before.metadata, before.bankRows, document);
    if (!apply) { await connection.rollback(); return { ...plan, applied: false, alreadyApplied: plan.ready && !plan.changes.length }; }
    if (!plan.ready) throw new Error(`Content correction blocked: ${plan.errors.join("; ")}`);
    if (plan.planHash !== expectedPlanHash) throw new Error("The reviewed plan hash does not match the locked database state.");
    if (!plan.changes.length) { await connection.rollback(); return { ...plan, applied: false, alreadyApplied: true }; }
    await backup(clone({ savedAtUtc: new Date().toISOString(), repairVersion: PUBLIC_QUESTION_CORRECTION_VERSION, correctionVersion: document.version, planHash: plan.planHash, corrections: document, rows: before.rows, metadataBefore: before.metadata, bankRowsBefore: before.bankRows }));
    const rechecked = await read();
    if (planPublicQuestionCorrection(rechecked.rows, rechecked.metadata, rechecked.bankRows, document).planHash !== plan.planHash) throw new Error("Locked state changed during backup.");
    for (const { expected, replacement } of plan.changes) {
      const fields = Object.keys(replacement).sort();
      const [result] = await connection.execute(
        `UPDATE questions SET ${fields.map(field => `\`${field}\` = ?`).join(", ")} WHERE id = ? AND bankKey = ? AND questionNum = ? AND reviewStatus = ?`,
        [...fields.map(field => replacement[field]), expected.id, expected.bankKey, expected.questionNum, expected.reviewStatus],
      );
      if (result.affectedRows !== 1) throw new Error(`${key(expected)}: unexpected update count`);
    }
    const changedBanks = new Set(plan.changes.map(item => item.expected.bankKey));
    for (const bankKey of [...changedBanks].sort()) {
      const previous = before.metadata.find(row => row.bankKey === bankKey);
      if (!Number.isSafeInteger(previous.contentVersion + 1)) throw new Error("Content version overflow.");
      const [result] = await connection.execute("UPDATE question_bank_meta SET contentVersion = ? WHERE bankKey = ? AND contentVersion = ?", [previous.contentVersion + 1, bankKey, previous.contentVersion]);
      if (result.affectedRows !== 1) throw new Error(`${bankKey}: unexpected metadata update count`);
    }
    const after = await read();
    const expectedRows = before.rows.map(row => ({ ...row, ...(plan.changes.find(item => item.expected.id === row.id)?.replacement ?? {}) }));
    const expectedMetadata = before.metadata.map(row => ({ ...row, contentVersion: row.contentVersion + (changedBanks.has(row.bankKey) ? 1 : 0) }));
    if (!equal(sorted(after.rows), sorted(expectedRows)) || !equal(sorted(after.metadata), sorted(expectedMetadata)) || !equal(sorted(after.bankRows), sorted(before.bankRows))) throw new Error("Postimage, metadata, row count or review status verification failed.");
    const finalPlan = planPublicQuestionCorrection(after.rows, after.metadata, after.bankRows, document);
    if (!finalPlan.ready || finalPlan.changes.length) throw new Error("Final exact content verification failed.");
    await connection.commit();
    return { ...plan, applied: true, alreadyApplied: false, postApplyPlanHash: finalPlan.planHash };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
