import test from "node:test";
import assert from "node:assert/strict";
import { auditSnapshot } from "./audit-wpi-bank-snapshot.mjs";
import { sha256, WPI_BANK_KEYS } from "./export-wpi-bank-review.mjs";

function snapshot(overrides = {}) {
  const questions = WPI_BANK_KEYS.map((bankKey, index) => ({
    id: index + 1, bankKey, questionNum: 1, module: "Operations", difficulty: "medium",
    question: `What is the best operational response for scenario ${index + 1}?`,
    options: JSON.stringify(["Verify the condition and follow the approved procedure", "Ignore the condition until the next shift", "Change every setting at the same time", "Delete the abnormal reading from the log"]),
    correctIndex: 0, explanation: "Verification and controlled action protect the process while preserving an accurate operating record.",
    steps: null, tip: null, isCalc: "no", topic: "Operations", cognitiveLevel: "application",
    sourceTitle: "WPI Need-to-Know Criteria", sourceReference: "Applicable task statement", sourceUrl: "https://gowpi.org/",
    blueprintObjective: `Objective ${index + 1}`, reviewStatus: "approved", reviewedAt: null,
  }));
  Object.assign(questions[0], overrides);
  const metadata = WPI_BANK_KEYS.map((bankKey) => ({ bankKey, moduleTargets: "{}", recallTargetPct: 25, minCalcPerMock: 10, totalQuestions: 1 }));
  const content = { metadata, moduleOverviews: [], questions };
  return { format: "echelon-wpi-all-banks-review-v1", contentSha256: sha256(content), ...content };
}

test("a structurally complete 16-bank snapshot passes without findings", () => {
  const report = auditSnapshot(snapshot());
  assert.equal(report.summary.banks, 16);
  assert.equal(report.summary.questions, 16);
  assert.equal(report.summary.findings, 0);
});

test("flags exploitable cues, missing governance and duplicate stems as review candidates", () => {
  const data = snapshot({
    question: "Which operational response is best in this situation?",
    options: JSON.stringify(["A complete and carefully documented response that follows every approved operating procedure and verifies the result before further changes", "Only wait", "Never act", "Obviously stop"]),
    explanation: "Too short", cognitiveLevel: null, sourceTitle: null, sourceReference: null, sourceUrl: null, blueprintObjective: null,
  });
  data.questions[1].question = data.questions[0].question;
  data.contentSha256 = sha256({ metadata: data.metadata, moduleOverviews: data.moduleOverviews, questions: data.questions });
  const codes = auditSnapshot(data).findings.map(finding => finding.code);
  assert(codes.includes("LONG_CORRECT_ANSWER_CUE"));
  assert(codes.includes("DISTRACTOR_QUALIFIER_CUE"));
  assert(codes.includes("MISSING_SOURCE"));
  assert(codes.includes("MISSING_BLUEPRINT_OBJECTIVE"));
  assert(codes.includes("EXACT_DUPLICATE_STEM"));
});

test("rejects a modified export whose checksum no longer matches", () => {
  const data = snapshot();
  data.questions[0].question = "Tampered";
  assert.throws(() => auditSnapshot(data), /EXPORT_HASH_MISMATCH/);
});
