import { createHash } from "node:crypto";

export const CLASS1_WATER_BANK = "class1-water";
export const CLASS1_WATER_MODULE_ORDER = Object.freeze([
  "Water Sources & Quality",
  "Coagulation & Flocculation",
  "Sedimentation",
  "Filtration",
  "Disinfection",
  "Chemical Feed & Dosing",
  "Iron & Manganese Removal",
  "Water Quality & Regulations",
  "Water Distribution",
]);

function stable(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stable);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function parseMetadataModules(value) {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string") ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Builds a write-free plan for restoring Class 1 Water learner module filters.
 * Only the `module` value on existing learner-visible question rows, and the
 * matching metadata menu/count/cache version, may change during application.
 */
export function planClass1WaterModuleRestoration({ rows, metadata, classifications }) {
  const errors = [];
  const bankRows = rows.filter((row) => row.bankKey === CLASS1_WATER_BANK);
  if (bankRows.length === 0) errors.push("No Class 1 Water questions were supplied.");
  if (metadata.length !== 1) errors.push(`Expected one Class 1 Water metadata row, found ${metadata.length}.`);

  const duplicateQuestions = new Set();
  const seenQuestionNums = new Set();
  for (const row of bankRows) {
    const number = Number(row.questionNum);
    if (!Number.isInteger(number) || number <= 0) errors.push(`Invalid question number: ${row.questionNum}.`);
    if (seenQuestionNums.has(number)) duplicateQuestions.add(number);
    seenQuestionNums.add(number);
    if (["in_review", "rejected"].includes(row.reviewStatus)) errors.push(`Question ${number} is not learner-visible.`);
  }
  if (duplicateQuestions.size) errors.push(`Duplicate question numbers: ${[...duplicateQuestions].join(", ")}.`);

  const byQuestionNum = new Map();
  const duplicateClassifications = new Set();
  for (const classification of classifications) {
    const number = Number(classification.questionNum);
    if (byQuestionNum.has(number)) duplicateClassifications.add(number);
    byQuestionNum.set(number, classification);
    if (!CLASS1_WATER_MODULE_ORDER.includes(classification.module)) {
      errors.push(`Question ${number} has unsupported module ${JSON.stringify(classification.module)}.`);
    }
    if (!Number.isInteger(classification.confidence) || classification.confidence < 0 || classification.confidence > 100) {
      errors.push(`Question ${number} has invalid confidence.`);
    }
  }
  if (duplicateClassifications.size) errors.push(`Duplicate classifications: ${[...duplicateClassifications].join(", ")}.`);
  if (byQuestionNum.size !== bankRows.length) {
    errors.push(`Classification count ${byQuestionNum.size} does not match question count ${bankRows.length}.`);
  }
  for (const number of seenQuestionNums) if (!byQuestionNum.has(number)) errors.push(`Question ${number} is missing a classification.`);
  for (const number of byQuestionNum.keys()) if (!seenQuestionNums.has(number)) errors.push(`Classification ${number} has no matching question.`);

  const changes = bankRows
    .map((row) => {
      const classification = byQuestionNum.get(Number(row.questionNum));
      return classification ? {
        id: Number(row.id),
        bankKey: row.bankKey,
        questionNum: Number(row.questionNum),
        beforeModule: row.module,
        afterModule: classification.module,
        confidence: classification.confidence,
        rationale: classification.rationale,
        reviewStatus: row.reviewStatus,
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.questionNum - b.questionNum);

  const counts = Object.fromEntries(CLASS1_WATER_MODULE_ORDER.map((module) => [module, 0]));
  for (const change of changes) counts[change.afterModule] += 1;
  const modules = CLASS1_WATER_MODULE_ORDER.filter((module) => counts[module] > 0);
  if (modules.length < 2) errors.push("Restoration would expose fewer than two learner modules.");

  const lowConfidence = changes.filter((change) => change.confidence < 80);
  const metadataRow = metadata[0] ?? null;
  const moduleMenuChanged = metadataRow
    ? JSON.stringify(parseMetadataModules(metadataRow.modules)) !== JSON.stringify(modules)
    : false;
  const questionChanges = changes.filter((change) => change.beforeModule !== change.afterModule);
  const scope = changes.map(({ id, bankKey, questionNum, beforeModule, afterModule, reviewStatus }) => ({
    id, bankKey, questionNum, beforeModule, afterModule, reviewStatus,
  }));

  return {
    ready: errors.length === 0,
    errors,
    questionCount: bankRows.length,
    questionChanges,
    modules,
    counts,
    lowConfidence,
    metadata: metadataRow ? {
      beforeModules: parseMetadataModules(metadataRow.modules),
      beforeTotalQuestions: Number(metadataRow.totalQuestions),
      beforeContentVersion: Number(metadataRow.contentVersion ?? 1),
      afterModules: modules,
      afterTotalQuestions: bankRows.length,
      afterContentVersion: Number(metadataRow.contentVersion ?? 1) + 1,
      moduleMenuChanged,
    } : null,
    scope,
    scopeDigest: digest(scope),
  };
}

/**
 * A completed restoration must never be replayed merely to increment the
 * content version. The executor uses this to fail closed before a duplicate
 * production write.
 */
export function isClass1WaterModuleRestored(plan) {
  return Boolean(
    plan?.ready
    && plan.questionChanges?.length === 0
    && plan.metadata
    && plan.metadata.moduleMenuChanged === false
    && plan.metadata.beforeTotalQuestions === plan.metadata.afterTotalQuestions,
  );
}
