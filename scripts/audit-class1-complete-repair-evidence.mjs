import fs from "node:fs";

const packagePath = process.env.CLASS1_REPAIR_PACKAGE ?? "/home/ubuntu/class1_complete_repair_quarantine/Class1-Complete-Repair-v2-2026-09-11/class1-full-repair/repairs.json";
const outputPath = process.env.CLASS1_REPAIR_EVIDENCE_AUDIT_OUTPUT ?? "/home/ubuntu/class1_complete_repair_evidence_audit.json";
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const factualFields = new Set(["question", "options", "explanation", "steps", "tip", "module", "topic", "difficulty", "isCalc", "cognitiveLevel"]);
const isPresent = (value) => typeof value === "string" && value.trim().length > 0;
const rows = pkg.patches.map((patch) => {
  const changedFields = Object.keys(patch.changes ?? {}).sort();
  const changesFactualContent = changedFields.some((field) => factualFields.has(field));
  const source = {
    title: isPresent(patch.after?.sourceTitle),
    reference: isPresent(patch.after?.sourceReference),
    url: isPresent(patch.after?.sourceUrl),
  };
  return {
    bankKey: patch.bankKey,
    questionNum: patch.questionNum,
    reasons: patch.reasons ?? [],
    changedFields,
    changesFactualContent,
    source,
    hasTraceableSource: source.title && source.reference && source.url,
  };
});
const byBank = Object.fromEntries([...new Set(rows.map((row) => row.bankKey))].sort().map((bankKey) => {
  const bankRows = rows.filter((row) => row.bankKey === bankKey);
  return [bankKey, {
    total: bankRows.length,
    factualContentChanges: bankRows.filter((row) => row.changesFactualContent).length,
    traceableSource: bankRows.filter((row) => row.hasTraceableSource).length,
    factualChangesWithoutTraceableSource: bankRows.filter((row) => row.changesFactualContent && !row.hasTraceableSource).length,
  }];
}));
const audit = {
  packagePath,
  generatedAtUtc: new Date().toISOString(),
  totalPatches: rows.length,
  factualContentChanges: rows.filter((row) => row.changesFactualContent).length,
  traceableSource: rows.filter((row) => row.hasTraceableSource).length,
  factualChangesWithoutTraceableSource: rows.filter((row) => row.changesFactualContent && !row.hasTraceableSource).length,
  changedFieldCounts: Object.fromEntries([...new Set(rows.flatMap((row) => row.changedFields))].sort().map((field) => [field, rows.filter((row) => row.changedFields.includes(field)).length])),
  byBank,
  untraceableFactualCandidates: rows.filter((row) => row.changesFactualContent && !row.hasTraceableSource).map((row) => ({ bankKey: row.bankKey, questionNum: row.questionNum, reasons: row.reasons, changedFields: row.changedFields })),
};
fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totalPatches: audit.totalPatches, factualContentChanges: audit.factualContentChanges, traceableSource: audit.traceableSource, factualChangesWithoutTraceableSource: audit.factualChangesWithoutTraceableSource, byBank }, null, 2));
