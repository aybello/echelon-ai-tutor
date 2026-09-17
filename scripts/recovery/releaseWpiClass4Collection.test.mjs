import assert from "node:assert/strict";
import test from "node:test";
import {
  BANK_KEY, MODULES, PACKAGE_DIGEST, PLANNED_METADATA, QUESTION_COUNT, buildReleasePlan,
} from "./releaseWpiClass4Collection.mjs";

function fixture() {
  const current = [];
  const patches = [];
  for (let number = 1; number <= QUESTION_COUNT; number += 1) {
    const before = {
      id: number + 9000, bankKey: BANK_KEY, questionNum: number, module: "Legacy",
      difficulty: null, question: `Legacy question ${number}?`, options: '["A","B","C","D"]',
      correctIndex: number % 4, explanation: "Legacy explanation", steps: null, tip: null,
      isCalc: "no", topic: "Legacy", cognitiveLevel: null, sourceTitle: null,
      sourceReference: null, sourceUrl: null, blueprintObjective: null,
      reviewStatus: "in_review", reviewedBy: null, reviewedAt: null,
    };
    const after = {
      ...before, id: number, module: MODULES[number % MODULES.length], question: `Repaired question ${number}?`,
      explanation: "Repaired explanation", topic: "Repaired", cognitiveLevel: number % 5 ? "application" : "recall",
      sourceTitle: "Official source", sourceReference: "Section 1", sourceUrl: "https://example.test/source",
      blueprintObjective: "Task 1",
    };
    current.push(before);
    patches.push({ questionNum: number, before: { ...before, id: number }, after });
  }
  return { current, repairPackage: { contentSha256: PACKAGE_DIGEST, patches } };
}

test("re-bases all reviewed repairs onto clean-database identities", () => {
  const { current, repairPackage } = fixture();
  const plan = buildReleasePlan(current, repairPackage);
  assert.equal(plan.status, "ready");
  assert.equal(plan.updates.length, QUESTION_COUNT);
  assert.equal(plan.updates[0].after.id, current[0].id);
  assert.equal(plan.updates[0].after.correctIndex, current[0].correctIndex);
  assert.equal(plan.updates[0].after.question, repairPackage.patches[0].after.question);
  assert.match(plan.confirmationDigest, /^[a-f0-9]{64}$/);
});

test("refuses a staged row that differs from the reviewed historical baseline", () => {
  const { current, repairPackage } = fixture();
  current[41].question = "Unreviewed intervening edit";
  assert.throws(() => buildReleasePlan(current, repairPackage), /question 42 no longer matches/);
});

test("refuses partially released or individually modified governance state", () => {
  const { current, repairPackage } = fixture();
  current[0].reviewStatus = "approved";
  assert.throws(() => buildReleasePlan(current, repairPackage), /question 1 is not in the untouched quarantine state/);
});

test("recognizes an exact completed release as idempotent", () => {
  const { current, repairPackage } = fixture();
  const first = buildReleasePlan(current, repairPackage);
  const released = first.updates.map(update => ({
    ...update.after, reviewStatus: "approved", reviewedBy: `batch-release:${first.releaseKey}`, reviewedAt: new Date(),
  }));
  const second = buildReleasePlan(released, repairPackage, PLANNED_METADATA);
  assert.equal(second.status, "already_released");
  assert.deepEqual(second.updates, []);
});

test("refuses unexpected pre-existing metadata", () => {
  const { current, repairPackage } = fixture();
  assert.throws(() => buildReleasePlan(current, repairPackage, { ...PLANNED_METADATA, blueprintVersion: 1 }), /unexpected Collection metadata/);
});
