import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRepairedRows,
  projectContent,
  RELEASE_MODULES,
  RELEASE_TARGETS,
} from "./release-wpi-class4-collection.mjs";
import { AREAS, CALCULATION_IDS } from "./lib/collectionReview.mjs";

const BANK_KEY = "wpi-class4-wastewater-coll";

function fixtureRows() {
  return Array.from({ length: 503 }, (_, index) => {
    const questionNum = index + 1;
    return {
      id: 10_000 + questionNum,
      bankKey: BANK_KEY,
      questionNum,
      module: "Legacy Collection Module",
      difficulty: null,
      question: `Historical collection question ${questionNum}`,
      options: JSON.stringify(["A", "B", "C", "D"]),
      correctIndex: questionNum % 4,
      explanation: `Historical explanation ${questionNum}`,
      steps: null,
      tip: null,
      isCalc: "no",
      topic: "Legacy topic",
      cognitiveLevel: null,
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
      blueprintObjective: null,
      reviewStatus: "in_review",
      reviewedBy: null,
      reviewedAt: null,
    };
  });
}

test("creates an exact reviewed 503-item replacement package without changing stable row identity fields", () => {
  const current = fixtureRows();
  const { repaired, coverage } = buildRepairedRows(current);

  assert.equal(repaired.length, 503);
  assert.deepEqual(repaired.map(row => row.questionNum), Array.from({ length: 503 }, (_, index) => index + 1));
  for (const [before, after] of current.map((row, index) => [row, repaired[index]])) {
    assert.equal(after.bankKey, before.bankKey);
    assert.equal(after.questionNum, before.questionNum);
    assert.equal(after.correctIndex, before.correctIndex);
    assert.equal(after.difficulty, before.difficulty);
    assert.equal(JSON.parse(after.options).length, 4);
    assert.ok(after.module);
    assert.ok(after.explanation);
    assert.match(after.cognitiveLevel, /^(recall|application)$/);
    assert.ok(after.blueprintObjective);
  }
  assert.deepEqual(Object.keys(coverage), RELEASE_MODULES);
  assert.deepEqual(Object.fromEntries(Object.entries(coverage).map(([module, data]) => [module, data.total])), {
    [AREAS.E]: 65,
    [AREAS.C]: 104,
    [AREAS.L]: 60,
    [AREAS.M]: 94,
    [AREAS.S]: 180,
  });
  assert.deepEqual(RELEASE_TARGETS, {
    [AREAS.E]: 23,
    [AREAS.C]: 23,
    [AREAS.L]: 16,
    [AREAS.M]: 20,
    [AREAS.S]: 18,
  });
  assert.equal(repaired.filter(row => row.isCalc === "yes").length, CALCULATION_IDS.size);
});

test("canonicalizes structured question content before guarded equality comparison", () => {
  const projected = projectContent({
    bankKey: BANK_KEY,
    questionNum: 1,
    module: "Module",
    difficulty: null,
    question: "Question",
    options: '["A","B","C","D"]',
    correctIndex: 0,
    explanation: "Explanation",
    steps: '[{"c":"content","l":"label"}]',
    tip: null,
    isCalc: "no",
    topic: "Topic",
    cognitiveLevel: "recall",
    sourceTitle: null,
    sourceReference: null,
    sourceUrl: null,
    blueprintObjective: null,
  });

  assert.equal(projected.options, '["A","B","C","D"]');
  assert.equal(projected.steps, '[{"c":"content","l":"label"}]');
  assert.equal(projected.difficulty, null);
});
