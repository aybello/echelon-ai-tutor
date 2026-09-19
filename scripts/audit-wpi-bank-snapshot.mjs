import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sha256, WPI_BANK_KEYS } from "./export-wpi-bank-review.mjs";

const normalize = text => String(text ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const words = text => normalize(text).split(" ").filter(Boolean).length;

export function auditSnapshot(snapshot) {
  if (snapshot?.format !== "echelon-wpi-all-banks-review-v1") throw new Error("WRONG_EXPORT_FORMAT");
  const content = { metadata: snapshot.metadata, moduleOverviews: snapshot.moduleOverviews, questions: snapshot.questions };
  if (sha256(content) !== snapshot.contentSha256) throw new Error("EXPORT_HASH_MISMATCH");

  const metadata = new Map(snapshot.metadata.map(row => [row.bankKey, row]));
  const stemOwners = new Map();
  const findings = [];
  const bankSummaries = {};

  const flag = (question, code, severity, detail) => findings.push({
    bankKey: question.bankKey,
    questionNum: question.questionNum,
    id: question.id,
    code,
    severity,
    detail,
  });

  for (const bankKey of WPI_BANK_KEYS) {
    const rows = snapshot.questions.filter(question => question.bankKey === bankKey);
    const meta = metadata.get(bankKey);
    const summary = bankSummaries[bankKey] = {
      total: rows.length,
      calculations: rows.filter(row => row.isCalc === "yes").length,
      recall: rows.filter(row => row.cognitiveLevel === "recall").length,
      application: rows.filter(row => row.cognitiveLevel === "application").length,
      unclassified: rows.filter(row => !row.cognitiveLevel).length,
      findingCount: 0,
      blueprintConfigured: Boolean(meta?.moduleTargets && meta?.recallTargetPct != null && meta?.minCalcPerMock != null),
    };
    if (!rows.length) findings.push({ bankKey, questionNum: null, id: null, code: "MISSING_BANK", severity: "blocker", detail: "No questions exported for a sold WPI bank." });
    if (!meta) findings.push({ bankKey, questionNum: null, id: null, code: "MISSING_METADATA", severity: "blocker", detail: "Question-bank metadata is absent." });
    else {
      if (!meta.moduleTargets) findings.push({ bankKey, questionNum: null, id: null, code: "MISSING_BLUEPRINT_TARGETS", severity: "high", detail: "No active content-area targets are configured." });
      if (meta.recallTargetPct == null) findings.push({ bankKey, questionNum: null, id: null, code: "MISSING_COGNITIVE_TARGET", severity: "high", detail: "No recall/application target is configured." });
      if (meta.minCalcPerMock == null) findings.push({ bankKey, questionNum: null, id: null, code: "MISSING_CALCULATION_TARGET", severity: "high", detail: "No minimum calculation count is configured." });
      if (Number(meta.totalQuestions) !== rows.length) findings.push({ bankKey, questionNum: null, id: null, code: "METADATA_COUNT_MISMATCH", severity: "high", detail: `Metadata says ${meta.totalQuestions}; export contains ${rows.length}.` });
    }
  }

  for (const question of snapshot.questions) {
    let options;
    try { options = JSON.parse(question.options); } catch { flag(question, "INVALID_OPTIONS_JSON", "blocker", "Options are not valid JSON."); continue; }
    if (!Array.isArray(options) || options.length !== 4 || options.some(option => typeof option !== "string" || !option.trim())) {
      flag(question, "INVALID_OPTION_SET", "blocker", "Exactly four non-empty string options are required.");
      continue;
    }
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) {
      flag(question, "INVALID_ANSWER_KEY", "blocker", "Correct index is outside the four-option set.");
      continue;
    }
    const normalizedOptions = options.map(normalize);
    if (new Set(normalizedOptions).size !== 4) flag(question, "DUPLICATE_OPTIONS", "blocker", "Two or more options normalize to the same wording.");
    if (!question.explanation?.trim() || words(question.explanation) < 8) flag(question, "WEAK_EXPLANATION", "high", "Explanation is absent or too short to teach the learner.");
    if (!question.cognitiveLevel) flag(question, "MISSING_COGNITIVE_LEVEL", "high", "Recall/application classification is absent.");
    if (!question.blueprintObjective) flag(question, "MISSING_BLUEPRINT_OBJECTIVE", "high", "No WPI objective is recorded.");
    if (!question.sourceTitle || (!question.sourceReference && !question.sourceUrl)) flag(question, "MISSING_SOURCE", "high", "No traceable source evidence is recorded.");
    if (question.isCalc === "yes" && !question.steps) flag(question, "CALCULATION_WITHOUT_STEPS", "high", "Calculation item has no worked solution steps.");
    if (/all of the above|none of the above/i.test(options.join(" "))) flag(question, "COMBINED_OPTION", "medium", "All/none-of-the-above weakens item validity and shuffling safety.");

    const correct = options[question.correctIndex];
    const distractors = options.filter((_, index) => index !== question.correctIndex);
    const longestDistractor = Math.max(...distractors.map(option => option.trim().length));
    if (correct.trim().length >= 40 && correct.trim().length > longestDistractor * 1.6) {
      flag(question, "LONG_CORRECT_ANSWER_CUE", "high", "Correct option is conspicuously longer than every distractor.");
    }
    if (distractors.filter(option => /\b(always|never|only|obviously|impossible)\b/i.test(option)).length >= 2) {
      flag(question, "DISTRACTOR_QUALIFIER_CUE", "medium", "Multiple distractors contain conspicuous absolute qualifiers.");
    }
    const stem = normalize(question.question);
    if (!stem || words(stem) < 5) flag(question, "WEAK_STEM", "high", "Question stem is absent or too short to establish a useful task.");
    else {
      const owners = stemOwners.get(stem) ?? [];
      owners.push({ bankKey: question.bankKey, questionNum: question.questionNum, id: question.id });
      stemOwners.set(stem, owners);
    }
  }

  for (const owners of stemOwners.values()) {
    if (owners.length < 2) continue;
    for (const owner of owners) findings.push({ ...owner, code: "EXACT_DUPLICATE_STEM", severity: "high", detail: `Exact normalized stem appears ${owners.length} times.` });
  }

  for (const bankKey of WPI_BANK_KEYS) {
    bankSummaries[bankKey].findingCount = findings.filter(finding => finding.bankKey === bankKey).length;
  }
  const byCode = {};
  const bySeverity = {};
  for (const finding of findings) {
    byCode[finding.code] = (byCode[finding.code] ?? 0) + 1;
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
  }
  return {
    format: "echelon-wpi-all-banks-audit-v1",
    sourceContentSha256: snapshot.contentSha256,
    limitations: [
      "Automated flags identify review candidates; they do not establish factual correctness.",
      "Technical accuracy, regulatory scope, ambiguity, distractor plausibility and WPI objective mapping require expert item-by-item review.",
      "Near-duplicate semantic review and independent recalculation belong in the governed repair batches.",
    ],
    summary: { banks: WPI_BANK_KEYS.length, questions: snapshot.questions.length, findings: findings.length, bySeverity, byCode },
    banks: bankSummaries,
    findings,
  };
}

async function main() {
  if (process.argv.length !== 6 || process.argv[2] !== "--in" || process.argv[4] !== "--out") {
    throw new Error("USAGE: node scripts/audit-wpi-bank-snapshot.mjs --in /private/export.json --out /private/audit.json");
  }
  const input = JSON.parse(await readFile(resolve(process.argv[3]), "utf8"));
  const report = auditSnapshot(input);
  await writeFile(resolve(process.argv[5]), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify(report.summary, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const safe = new Set(["WRONG_EXPORT_FORMAT", "EXPORT_HASH_MISMATCH"]);
    console.error(safe.has(error.message) ? error.message : "Audit failed; the input and output paths remain private.");
    process.exitCode = 1;
  });
}
