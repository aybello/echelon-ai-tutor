import { hashWpiQuestionRows, hashWpiNewQuestionRows, WPI_CLASS4_WASTEWATER_BANK } from "./wpiClass4Release.mjs";
export const WPI_CLASS4_OUTLINE = [
  { module: "Equipment Evaluation, Maintenance & Operation", total: 28, recall: 6, application: 22, calculations: 7 },
  { module: "Treatment Process Evaluation & Adjustment", total: 42, recall: 7, application: 35, calculations: 4 },
  { module: "Laboratory Analysis", total: 15, recall: 7, application: 8, calculations: 0 },
  { module: "Security, Safety & Administrative Procedures", total: 15, recall: 5, application: 10, calculations: 5 },
];
const norm = text => String(text ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
/** Offline evidence only: no database connection, publication action, or correctness certification. */
export function auditWpiClass4Evidence({ manifest, existing, additions }) {
  const errors = [], coverageGaps = [], answerCueFlags = [], missingReferences = [];
  if (manifest.bankKey !== WPI_CLASS4_WASTEWATER_BANK) errors.push("Wrong manifest bank");
  if (existing.length !== 657 || additions.length !== 250) errors.push("Expected the complete 657 + 250 release package");
  if (hashWpiQuestionRows(existing) !== manifest.existingRowsSha256) errors.push("Existing content checksum mismatch");
  if (hashWpiNewQuestionRows(additions) !== manifest.newRowsSha256) errors.push("Addition content checksum mismatch");
  const rows = [...existing, ...additions], stems = new Set(), numbers = new Set();
  const counts = Object.fromEntries(WPI_CLASS4_OUTLINE.map(area => [area.module, { total: 0, recall: 0, application: 0, calculations: 0 }]));
  const answerPositions = [0, 0, 0, 0];
  for (const row of rows) {
    const id = row.questionNum;
    if (row.bankKey !== WPI_CLASS4_WASTEWATER_BANK || !Number.isInteger(id) || numbers.has(id)) errors.push(`Invalid/duplicate identity ${id}`);
    numbers.add(id);
    const stem = norm(row.question);
    if (!stem || stems.has(stem)) errors.push(`Empty/duplicate stem ${id}`);
    stems.add(stem);
    if (!String(row.explanation ?? "").trim()) errors.push(`Missing explanation ${id}`);
    if (!row.sourceTitle || !row.sourceReference || !row.blueprintObjective) missingReferences.push(id);
    if (!["yes", "no"].includes(row.isCalc)) errors.push(`Unknown calculation classification ${id}`);
    const module = row.module === "Safety & Admin" ? "Security, Safety & Administrative Procedures" : row.module;
    const area = Object.hasOwn(counts, module) ? counts[module] : undefined;
    if (!area) coverageGaps.push(`Unmapped content area ${id}: ${row.module}`);
    else {
      area.total++;
      if (["recall", "application"].includes(row.cognitiveLevel)) area[row.cognitiveLevel]++;
      else coverageGaps.push(`Unmapped cognitive classification ${id}: ${row.cognitiveLevel}`);
      if (row.isCalc === "yes") area.calculations++;
    }
    try {
      const options = JSON.parse(row.options);
      if (!Array.isArray(options) || options.length !== 4 || options.some(o => typeof o !== "string" || !o.trim()) ||
          new Set(options.map(norm)).size !== 4 || !Number.isInteger(row.correctIndex) || row.correctIndex < 0 || row.correctIndex > 3) throw new Error();
      answerPositions[row.correctIndex]++;
      const lengths = options.map(o => o.trim().split(/\s+/).length);
      const correctLength = lengths[row.correctIndex];
      const longestDistractor = Math.max(...lengths.filter((_, index) => index !== row.correctIndex));
      // Screening heuristic: flagged items need contextual inspection, not automatic rewriting.
      if (correctLength >= 12 && correctLength >= longestDistractor * 1.8) answerCueFlags.push(id);
    } catch { errors.push(`Invalid answer options/key ${id}`); }
  }
  for (const target of WPI_CLASS4_OUTLINE) {
    for (const field of ["total", "recall", "application", "calculations"]) {
      if (counts[target.module][field] < target[field]) coverageGaps.push(`${target.module}: fewer than ${target[field]} ${field} items`);
    }
  }
  return { bankKey: manifest.bankKey, count: rows.length, errors, coverageGaps, counts, answerPositions, answerCueFlags, missingReferences,
    source: "https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-4_mh-fin.pdf",
    limitations: "Counts check minimum category availability, not joint mock-selection feasibility. Formula correctness, factual sources, classification and plausible distractors require content review. Targets describe one 100-question exam, not whole-bank proportions. Confirm the exam edition with the certifying authority." };
}
