import { createHash } from "node:crypto";

export const WPI_CLASS4_WASTEWATER_BANK = "wpi-class4-wastewater";
export const WPI_CLASS4_NEW_RANGE = Object.freeze({ start: 2001, end: 2250 });
export const WPI_CLASS4_QUESTION_FIELDS = Object.freeze([
  "id", "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus",
]);
export const WPI_CLASS4_MUTABLE_FIELDS = Object.freeze(WPI_CLASS4_QUESTION_FIELDS.filter((field) => !["id", "bankKey", "questionNum"].includes(field)));

export function projectWpiQuestion(row) {
  return Object.fromEntries(WPI_CLASS4_QUESTION_FIELDS.map((field) => [field, row[field] ?? null]));
}

export function hashWpiQuestionRows(rows) {
  return createHash("sha256").update(JSON.stringify(rows.map(projectWpiQuestion))).digest("hex");
}

/** New rows receive database IDs at insertion; their candidate checksum deliberately excludes that generated identity. */
export function hashWpiNewQuestionRows(rows) {
  return hashWpiQuestionRows(rows.map((row) => ({ ...row, id: null })));
}

function normaliseStem(value) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

export function planWpiClass4Release({ currentRows, currentMetadata, candidateExisting, candidateNew, expectedBaselineRowsSha256 }) {
  const errors = [];
  const current = currentRows.map(projectWpiQuestion);
  const existing = candidateExisting.map(projectWpiQuestion);
  const additions = candidateNew.map(projectWpiQuestion);
  const currentHash = hashWpiQuestionRows(currentRows);

  if (currentHash !== expectedBaselineRowsSha256) errors.push("Production question baseline hash differs from the approved package.");
  if (!current.length) errors.push("The target production bank is empty.");
  if (current.some((row) => row.bankKey !== WPI_CLASS4_WASTEWATER_BANK)) errors.push("Production query returned a row outside the target bank.");
  if (existing.length !== current.length) errors.push(`Existing-candidate inventory mismatch: ${existing.length} candidate rows vs ${current.length} production rows.`);
  if (additions.length !== WPI_CLASS4_NEW_RANGE.end - WPI_CLASS4_NEW_RANGE.start + 1) errors.push("New-candidate inventory is not exactly the governed 250-question range.");
  if (currentMetadata?.bankKey !== WPI_CLASS4_WASTEWATER_BANK) errors.push("Expected one target-bank metadata row.");

  const currentById = new Map(current.map((row) => [row.id, row]));
  const seenExisting = new Set();
  for (const row of existing) {
    if (row.bankKey !== WPI_CLASS4_WASTEWATER_BANK || !Number.isInteger(row.id) || !Number.isInteger(row.questionNum)) {
      errors.push("Existing candidate has invalid identity or bank scope.");
      continue;
    }
    if (seenExisting.has(row.id)) errors.push(`Duplicate existing candidate ID ${row.id}.`);
    seenExisting.add(row.id);
    const currentRow = currentById.get(row.id);
    if (!currentRow || currentRow.questionNum !== row.questionNum || currentRow.bankKey !== row.bankKey) errors.push(`Existing candidate identity mismatch for ID ${row.id}.`);
  }

  const currentNumbers = new Set(current.map((row) => row.questionNum));
  const newNumbers = new Set();
  for (const row of additions) {
    if (row.id !== null || row.bankKey !== WPI_CLASS4_WASTEWATER_BANK) errors.push(`New candidate ${row.questionNum} has prohibited existing identity or incorrect bank.`);
    if (!Number.isInteger(row.questionNum) || row.questionNum < WPI_CLASS4_NEW_RANGE.start || row.questionNum > WPI_CLASS4_NEW_RANGE.end) errors.push(`New candidate question number outside governed range: ${row.questionNum}.`);
    if (newNumbers.has(row.questionNum) || currentNumbers.has(row.questionNum)) errors.push(`Duplicate or occupied new question number: ${row.questionNum}.`);
    newNumbers.add(row.questionNum);
    if (row.reviewStatus !== "in_review") errors.push(`New candidate ${row.questionNum} must arrive as in_review.`);
    try {
      const options = JSON.parse(row.options);
      if (!Array.isArray(options) || options.length !== 4 || !Number.isInteger(row.correctIndex) || row.correctIndex < 0 || row.correctIndex > 3) errors.push(`Malformed options or answer key for new candidate ${row.questionNum}.`);
    } catch {
      errors.push(`Malformed option JSON for new candidate ${row.questionNum}.`);
    }
  }
  if (newNumbers.size !== additions.length) errors.push("New-candidate question numbers are not unique.");

  // Existing replacements need the same structural guarantees as additions.
  for (const row of [...existing, ...additions]) {
    try {
      const options = JSON.parse(row.options);
      if (!Array.isArray(options) || options.length !== 4 ||
          options.some(option => typeof option !== "string" || !option.trim()) ||
          new Set(options.map(option => option.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " "))).size !== 4 ||
          !Number.isInteger(row.correctIndex) || row.correctIndex < 0 || row.correctIndex > 3) {
        errors.push(`Invalid or indistinguishable answer options for candidate ${row.questionNum}.`);
      }
    } catch { errors.push(`Malformed option JSON for candidate ${row.questionNum}.`); }
    if (typeof row.explanation !== "string" || !row.explanation.trim()) errors.push(`Missing explanation for candidate ${row.questionNum}.`);
  }

  const allStems = new Map();
  for (const row of [...existing, ...additions]) {
    const stem = normaliseStem(row.question);
    if (!stem) errors.push(`Blank question stem in candidate ${row.questionNum}.`);
    const prior = allStems.get(stem);
    if (prior !== undefined && prior !== row.questionNum) errors.push(`Normalized duplicate question stem: ${prior} and ${row.questionNum}.`);
    allStems.set(stem, row.questionNum);
  }

  const changedExisting = existing.filter((row) => {
    const currentRow = currentById.get(row.id);
    return currentRow && WPI_CLASS4_MUTABLE_FIELDS.some((field) => currentRow[field] !== row[field]);
  });
  const intendedVisibleCount = existing.filter((row) => ["unreviewed", "approved"].includes(row.reviewStatus)).length + additions.length;
  return {
    ready: errors.length === 0,
    errors,
    currentBaselineRowsSha256: currentHash,
    currentQuestionCount: current.length,
    candidateExistingCount: existing.length,
    candidateNewCount: additions.length,
    changedExistingCount: changedExisting.length,
    intendedVisibleCount,
    metadataBefore: currentMetadata ? { totalQuestions: Number(currentMetadata.totalQuestions), contentVersion: Number(currentMetadata.contentVersion) } : null,
  };
}
