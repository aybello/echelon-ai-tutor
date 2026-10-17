import { test } from "node:test";
import assert from "node:assert/strict";
import { corrections, planPublicQuestionCorrections } from "./plan-public-question-corrections.mjs";
const snapshot = () => corrections.corrections.map(item => ({ ...item.expected }));
test("offline plan preserves identity, fixes the blend and repairs only 650 serialization", () => {
  const rows = snapshot(); const before = JSON.stringify(rows);
  const plan = planPublicQuestionCorrections(rows);
  assert.equal(plan.applySupported, false); assert.equal(plan.historicalAttemptsChanged, false);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(JSON.parse(plan.changes[0].replacement.options)[0], "76.7 mg/L");
  assert.equal(plan.changes[0].replacement.correctIndex, 0);
  assert.deepEqual(Object.keys(plan.changes[1].replacement), ["steps"]);
  assert.equal(JSON.parse(plan.changes[1].replacement.steps).length, 3);
  assert.equal(plan.planSha256.length, 64);
});
test("aborts on any expected-version drift, missing row or duplicate identity", () => {
  for (const key of Object.keys(snapshot()[0])) {
    const rows = snapshot(); rows[0][key] = "drift";
    assert.throws(() => planPublicQuestionCorrections(rows), /mismatch|exactly one/);
  }
  assert.throws(() => planPublicQuestionCorrections([]), /exactly one/);
  const rows = snapshot(); assert.throws(() => planPublicQuestionCorrections([...rows, rows[0]]), /exactly one/);
});
