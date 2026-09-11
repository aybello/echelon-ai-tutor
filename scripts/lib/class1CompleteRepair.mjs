import { createHash } from "node:crypto";

export const CLASS1_BANK_KEYS = ["class1-water", "class1-wastewater", "class1-water-dist", "class1-wastewater-coll"];
export const CLASS1_EXPECTED_COUNTS = Object.freeze({
  "class1-water": 555,
  "class1-wastewater": 565,
  "class1-water-dist": 716,
  "class1-wastewater-coll": 724,
});
export const QUESTION_FIELDS = ["id", "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus"];
export const METADATA_FIELDS = ["bankKey", "modules", "moduleTargets", "formulaLinks", "totalQuestions", "contentVersion", "blueprintVersion", "minCalcPerMock", "recallTargetPct"];
const PROTECTED_QUESTION_FIELDS = new Set(["id", "bankKey", "questionNum", "correctIndex", "reviewStatus"]);
const EDITABLE_QUESTION_FIELDS = new Set(QUESTION_FIELDS.filter((field) => !PROTECTED_QUESTION_FIELDS.has(field)));

export function stable(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stable);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function questionIdentity(question) {
  return `${question.bankKey}:${question.questionNum}`;
}

function nullableProjection(row, fields) {
  return Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
}

function assertPackageIntegrity(pkg, expectedCounts) {
  if (!Array.isArray(pkg?.patches) || pkg.patches.length !== 1601) throw new Error("Repair package must contain exactly 1,601 question patches.");
  if (!Array.isArray(pkg?.metadataPatches) || pkg.metadataPatches.length !== 4) throw new Error("Repair package must contain exactly four metadata patches.");
  const seen = new Set();
  for (const patch of pkg.patches) {
    const identity = questionIdentity(patch);
    if (!CLASS1_BANK_KEYS.includes(patch.bankKey) || seen.has(identity)) throw new Error(`Invalid or duplicate patch identity: ${identity}`);
    seen.add(identity);
    if (patch.databaseId !== patch.before.id || patch.before.bankKey !== patch.bankKey || patch.before.questionNum !== patch.questionNum) throw new Error(`Patch identity mismatch: ${identity}`);
    if (digest(patch.before) !== patch.beforeHash || digest(patch.after) !== patch.afterHash) throw new Error(`Patch hash mismatch: ${identity}`);
    const changed = QUESTION_FIELDS.filter((field) => patch.before[field] !== patch.after[field]);
    if (JSON.stringify(changed.sort()) !== JSON.stringify(Object.keys(patch.changes ?? {}).sort())) throw new Error(`Patch delta mismatch: ${identity}`);
    for (const field of changed) {
      if (!EDITABLE_QUESTION_FIELDS.has(field)) throw new Error(`Protected question field changed: ${identity}:${field}`);
      if (patch.changes[field]?.before !== patch.before[field] || patch.changes[field]?.after !== patch.after[field]) throw new Error(`Patch field delta mismatch: ${identity}:${field}`);
    }
  }
  const metaKeys = new Set();
  for (const patch of pkg.metadataPatches) {
    if (!CLASS1_BANK_KEYS.includes(patch.bankKey) || metaKeys.has(patch.bankKey)) throw new Error(`Invalid or duplicate metadata patch: ${patch.bankKey}`);
    metaKeys.add(patch.bankKey);
    if (digest(patch.before) !== patch.beforeHash || digest(patch.after) !== patch.afterHash) throw new Error(`Metadata hash mismatch: ${patch.bankKey}`);
    for (const field of METADATA_FIELDS) {
      if (field === "contentVersion") {
        if (patch.after[field] !== patch.before[field] + 1) throw new Error(`Content version must advance exactly once: ${patch.bankKey}`);
      } else if (patch.after[field] !== patch.before[field]) {
        throw new Error(`Unexpected metadata mutation: ${patch.bankKey}:${field}`);
      }
    }
  }
  if (Object.values(expectedCounts).reduce((total, count) => total + count, 0) !== 2560) throw new Error("Expected Class 1 inventory must total 2,560.");
}

export function reconcileClass1CompleteRepair({ pkg, currentQuestions, currentMetadata, attemptCounts = {}, expectedCounts = CLASS1_EXPECTED_COUNTS }) {
  assertPackageIntegrity(pkg, expectedCounts);
  const actualCounts = Object.fromEntries(CLASS1_BANK_KEYS.map((bankKey) => [bankKey, currentQuestions.filter((question) => question.bankKey === bankKey).length]));
  for (const bankKey of CLASS1_BANK_KEYS) {
    if (actualCounts[bankKey] !== expectedCounts[bankKey]) throw new Error(`Production inventory drift for ${bankKey}: expected ${expectedCounts[bankKey]}, found ${actualCounts[bankKey]}.`);
  }
  const rows = new Map(currentQuestions.map((row) => [questionIdentity(row), nullableProjection(row, QUESTION_FIELDS)]));
  if (rows.size !== currentQuestions.length || rows.size !== Object.values(expectedCounts).reduce((total, count) => total + count, 0)) throw new Error("Production question identity inventory is invalid.");
  const metadata = new Map(currentMetadata.map((row) => [row.bankKey, nullableProjection(row, METADATA_FIELDS)]));
  if (metadata.size !== 4 || currentMetadata.length !== 4) throw new Error("Production metadata inventory is invalid.");

  const questionStates = pkg.patches.map((patch) => {
    const actual = rows.get(questionIdentity(patch));
    const actualHash = actual ? digest(actual) : null;
    const state = actualHash === patch.beforeHash ? "ready" : actualHash === patch.afterHash ? "already-applied" : "conflict";
    return { bankKey: patch.bankKey, questionNum: patch.questionNum, databaseId: patch.databaseId, state, attemptCount: Number(attemptCounts[patch.databaseId] ?? 0) };
  });
  const metadataStates = pkg.metadataPatches.map((patch) => {
    const actual = metadata.get(patch.bankKey);
    const actualHash = actual ? digest(actual) : null;
    return { bankKey: patch.bankKey, state: actualHash === patch.beforeHash ? "ready" : actualHash === patch.afterHash ? "already-applied" : "conflict" };
  });
  const states = new Set([...questionStates, ...metadataStates].map((item) => item.state));
  const state = states.size === 1 ? [...states][0] : "conflict";
  return {
    state,
    packageSummary: { questionPatches: pkg.patches.length, metadataPatches: pkg.metadataPatches.length },
    actualCounts,
    questionStates,
    metadataStates,
    attemptCountTotal: questionStates.reduce((sum, item) => sum + item.attemptCount, 0),
  };
}
