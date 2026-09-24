import { createHash } from "node:crypto";

export const ONTARIO_TREATMENT_MODULE_PROFILES = Object.freeze({
  "class1-wastewater": Object.freeze({
    genericModule: "Wastewater Treatment",
    modules: Object.freeze([
      "Wastewater Characteristics & Preliminary Treatment",
      "Primary Treatment",
      "Secondary Treatment",
      "Biological Nutrient Removal",
      "Tertiary Treatment & Filtration",
      "Disinfection",
      "Solids Handling & Biosolids",
      "Regulations, Safety & Operations",
      "Wastewater Collection",
    ]),
  }),
  "class2-water": Object.freeze({
    genericModule: "Water Treatment",
    modules: Object.freeze([
      "Treatment Process",
      "Source Water Characteristics",
      "Equipment Operation & Maintenance",
      "Laboratory Analysis",
      "Security, Safety & Administrative",
      "Water Distribution",
    ]),
  }),
  "class2-wastewater": Object.freeze({
    genericModule: "Wastewater Treatment",
    modules: Object.freeze([
      "Treatment Process",
      "Collection Systems",
      "Laboratory Analysis",
      "Safety & Administration",
      "Equipment O&M",
    ]),
  }),
  "class3-water": Object.freeze({
    genericModule: "Water Treatment",
    modules: Object.freeze([
      "Treatment Process",
      "Laboratory Analysis",
      "Equipment O&M",
      "Source Water Characteristics",
      "Security, Safety & Admin",
      "Water Distribution",
    ]),
  }),
  "class3-wastewater": Object.freeze({
    genericModule: "Wastewater Treatment",
    modules: Object.freeze([
      "Equipment Evaluation & Maintenance",
      "Equipment Operation",
      "Laboratory Analysis",
      "Security, Safety & Admin",
      "Treatment Process Monitoring",
      "Wastewater Collection",
    ]),
  }),
  "class4-water": Object.freeze({
    genericModule: "Water Treatment",
    modules: Object.freeze([
      "Treatment Process",
      "Equipment O&M",
      "Hydraulics",
      "Regulations & Management",
      "Water Quality",
      "Math & Calculations",
      "Source Water Protection",
      "Plant Management",
      "Emergency Response",
      "Advanced Treatment",
      "Lab Analysis",
      "Safety",
      "Water Distribution",
    ]),
  }),
  "class4-wastewater": Object.freeze({
    genericModule: "Wastewater Treatment",
    modules: Object.freeze([
      "Advanced Treatment Process Monitoring",
      "Equipment Operation & Maintenance",
      "Laboratory Analysis & Interpretation",
      "Biosolids Management & Regulations",
      "Plant Management, Safety & Administration",
      "Wastewater Collection",
    ]),
  }),
});

export const ONTARIO_TREATMENT_BANK_KEYS = Object.freeze(Object.keys(ONTARIO_TREATMENT_MODULE_PROFILES));

function stable(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stable);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function canonicalRow(row) {
  const result = {};
  for (const key of Object.keys(row).sort()) {
    const value = row[key];
    result[key] = value instanceof Date ? value.toISOString() : value;
  }
  if (typeof result.options === "string") {
    try { result.options = JSON.parse(result.options); }
    catch { throw new Error(`Question ${row.questionNum} has malformed options.`); }
  }
  return result;
}

/**
 * Stable fingerprint of the question fields seen by the classifier. `module` is
 * excluded so a matching package stays valid through the controlled module-only
 * update. The release separately compares the complete locked rows before and
 * after the update, so non-classifier fields remain protected at write time.
 */
export function preservedRowHash(row) {
  const value = {
    id: row.id,
    bankKey: row.bankKey,
    questionNum: row.questionNum,
    difficulty: row.difficulty,
    question: row.question,
    options: row.options,
    correctIndex: row.correctIndex,
    explanation: row.explanation,
    steps: row.steps,
    isCalc: row.isCalc,
    cognitiveLevel: row.cognitiveLevel,
    reviewStatus: row.reviewStatus,
  };
  if (typeof value.options === "string") {
    try { value.options = JSON.parse(value.options); }
    catch { throw new Error(`Question ${row.questionNum} has malformed options.`); }
  }
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

function profileFor(bankKey) {
  const profile = ONTARIO_TREATMENT_MODULE_PROFILES[bankKey];
  if (!profile) throw new Error(`Unsupported Ontario treatment bank: ${bankKey}`);
  return profile;
}

/**
 * Builds a write-free, bank-specific restoration plan. Only existing
 * learner-visible question module labels, matching metadata count and content
 * version may change during application.
 */
export function planOntarioTreatmentModuleRestoration({ bankKey, rows, metadata, classifications }) {
  const profile = profileFor(bankKey);
  const errors = [];
  const bankRows = rows.filter((row) => row.bankKey === bankKey);
  if (bankRows.length === 0) errors.push(`No ${bankKey} learner-visible questions were supplied.`);
  if (metadata.length !== 1) errors.push(`Expected one ${bankKey} metadata row, found ${metadata.length}.`);

  const metadataRow = metadata[0] ?? null;
  if (metadataRow && JSON.stringify(parseMetadataModules(metadataRow.modules)) !== JSON.stringify(profile.modules)) {
    errors.push(`${bankKey} metadata modules do not match the approved detailed module profile.`);
  }

  const duplicateQuestions = new Set();
  const seenQuestionNums = new Set();
  const rowByQuestionNum = new Map();
  for (const row of bankRows) {
    const number = Number(row.questionNum);
    if (!Number.isInteger(number) || number <= 0) errors.push(`Invalid question number: ${row.questionNum}.`);
    if (seenQuestionNums.has(number)) duplicateQuestions.add(number);
    seenQuestionNums.add(number);
    rowByQuestionNum.set(number, row);
    if (["in_review", "rejected"].includes(row.reviewStatus)) errors.push(`Question ${number} is not learner-visible.`);
  }
  if (duplicateQuestions.size) errors.push(`Duplicate question numbers: ${[...duplicateQuestions].join(", ")}.`);

  const byQuestionNum = new Map();
  const duplicateClassifications = new Set();
  for (const classification of classifications) {
    const number = Number(classification.questionNum);
    if (byQuestionNum.has(number)) duplicateClassifications.add(number);
    byQuestionNum.set(number, classification);
    if (!profile.modules.includes(classification.module)) {
      errors.push(`Question ${number} has unsupported module ${JSON.stringify(classification.module)}.`);
    }
    if (!Number.isInteger(classification.confidence) || classification.confidence < 0 || classification.confidence > 100) {
      errors.push(`Question ${number} has invalid confidence.`);
    }
    if (typeof classification.rationale !== "string" || classification.rationale.trim().length < 3) {
      errors.push(`Question ${number} is missing a classification rationale.`);
    }
    if (typeof classification.sourceHash !== "string" || !/^[a-f0-9]{64}$/.test(classification.sourceHash)) {
      errors.push(`Question ${number} is missing a valid protected-content fingerprint.`);
    }
  }
  if (duplicateClassifications.size) errors.push(`Duplicate classifications: ${[...duplicateClassifications].join(", ")}.`);
  if (byQuestionNum.size !== bankRows.length) {
    errors.push(`Classification count ${byQuestionNum.size} does not match question count ${bankRows.length}.`);
  }
  for (const number of seenQuestionNums) {
    const classification = byQuestionNum.get(number);
    if (!classification) {
      errors.push(`Question ${number} is missing a classification.`);
      continue;
    }
    const row = rowByQuestionNum.get(number);
    if (classification.sourceHash !== preservedRowHash(row)) {
      errors.push(`Question ${number} changed after classification.`);
    }
  }
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
        sourceHash: classification.sourceHash,
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.questionNum - b.questionNum);

  const counts = Object.fromEntries(profile.modules.map((module) => [module, 0]));
  for (const change of changes) counts[change.afterModule] += 1;
  const missingModules = profile.modules.filter((module) => counts[module] === 0);
  if (missingModules.length) errors.push(`Restoration would leave detailed modules without learner-visible questions: ${missingModules.join(", ")}.`);

  const lowConfidence = changes.filter((change) => change.confidence < 80);
  const questionChanges = changes.filter((change) => change.beforeModule !== change.afterModule);
  const scope = changes.map(({ id, bankKey: scopedBankKey, questionNum, beforeModule, afterModule, reviewStatus, sourceHash }) => ({
    id, bankKey: scopedBankKey, questionNum, beforeModule, afterModule, reviewStatus, sourceHash,
  }));

  return {
    ready: errors.length === 0,
    errors,
    bankKey,
    questionCount: bankRows.length,
    questionChanges,
    modules: [...profile.modules],
    counts,
    lowConfidence,
    metadata: metadataRow ? {
      beforeModules: parseMetadataModules(metadataRow.modules),
      beforeTotalQuestions: Number(metadataRow.totalQuestions),
      beforeContentVersion: Number(metadataRow.contentVersion ?? 1),
      afterModules: [...profile.modules],
      afterTotalQuestions: bankRows.length,
      afterContentVersion: Number(metadataRow.contentVersion ?? 1) + 1,
      moduleMenuChanged: JSON.stringify(parseMetadataModules(metadataRow.modules)) !== JSON.stringify(profile.modules),
    } : null,
    scope,
    scopeDigest: digest(scope),
  };
}

export function isOntarioTreatmentModuleRestored(plan) {
  return Boolean(
    plan?.ready
    && plan.questionChanges?.length === 0
    && plan.metadata
    && plan.metadata.moduleMenuChanged === false
    && plan.metadata.beforeTotalQuestions === plan.metadata.afterTotalQuestions,
  );
}
