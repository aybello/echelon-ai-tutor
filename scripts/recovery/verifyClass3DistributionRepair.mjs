#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCandidateQuestions, AREAS } from "../../content/class3-water-dist/new-questions-2026-09-22.mjs";
import { BANK, RELEASE, TARGETS, buildPlan } from "./class3WaterDistributionRepair.mjs";

const manifest = JSON.parse(readFileSync(new URL("../../content/class3-water-dist/repair-manifest-2026-09-22.json", import.meta.url), "utf8"));
const candidates = buildCandidateQuestions();
const checkedIn = JSON.parse(readFileSync(new URL("../../content/class3-water-dist/candidate-250-2026-09-22.json", import.meta.url), "utf8"));
assert.deepEqual(checkedIn, candidates, "review file has drifted from import payload");
assert.equal(BANK, "class3-water-dist"); assert.equal(RELEASE, manifest.release);
assert.equal(TARGETS.length, 118);
const expectedNumerical = [
  "29.7 m³", "1.22 m/s", "266 mm", "313.9 kPa", "150 L/s", "636 m³", "16.7 h", "38.7 m", "20 min", "35 L/s",
  "10.0 min", "15.0 kW", "30.9 kW", "18,850 L", "4 pumps", "25 L/s", "226.2 m³",
  "1.7 mg/L", "3.0 kg", "108 L/h", "0.50 mg/L", "58.3 %", "0.8 mg/L", "4.17 h", "22.5 h", "22.5 mg·min/L", "0.25 kg/h",
  "500 m³", "75 %", "165 min",
];
assert.deepEqual(candidates.filter(q => q.isCalc === "yes").map(q => q.options[q.correctIndex]), expectedNumerical);
assert.equal(candidates.length, 250);
assert.deepEqual([0, 1, 2, 3].map(i => candidates.filter(q => q.correctIndex === i).length), [62, 62, 63, 63]);
const amounts = AREAS.map(area => candidates.filter(q => q.module === area.module));
assert.deepEqual(amounts.map(group => group.length), [58, 62, 62, 68]);
assert.deepEqual(amounts.map(group => group.filter(q => q.isCalc === "yes").length), [10, 7, 10, 3]);
const stem = q => q.question.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
assert.equal(new Set(candidates.map(stem)).size, candidates.length);
for (const q of candidates) {
  assert.equal(q.reviewStatus, "in_review");
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(x => x.toLowerCase().trim())).size, 4);
  assert.ok(q.question.length > 25 && q.explanation.length > 25);
  assert.ok(q.sourceReference.includes("answer-level source review pending"));
  const answer = q.options[q.correctIndex];
  assert.ok(!(answer.length > 80 && q.options.every((s, i) => i === q.correctIndex || answer.length > 2.5 * s.length)), `answer-length cue at ${q.questionNum}`);
}
if (process.argv[2]) {
  const snapshot = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const plan = buildPlan(snapshot, manifest);
  const old = new Set(snapshot.map(stem));
  for (const q of candidates) assert.ok(!old.has(stem(q)), `existing duplicate ${q.questionNum}`);
  assert.deepEqual(plan.changes.filter(x => x.after.reviewStatus === "in_review").length, 116);
  assert.deepEqual(plan.changes.filter(x => x.after.reviewStatus === "unreviewed").length, 2);
  const altered = structuredClone(snapshot);
  altered.find(q => q.questionNum === 308).options[1] = "changed since backup";
  assert.throws(() => buildPlan(altered, manifest), /differs from September 19 baseline/);
}
console.log("Verified 250 held candidates, 30 numerical keys, four area counts, and safe repair plan.");
