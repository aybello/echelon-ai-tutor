#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCandidateQuestions, AREAS } from "../../content/class3-water-dist/new-questions-2026-09-22.mjs";
import {
  buildRepairedQuestions,
  NUMERIC_EXPECTED_ANSWERS,
  REPAIRED_NUMERIC_NUMBERS,
  REPAIRED_QUESTION_NUMBERS,
  REPAIRED_REGULATORY_NUMBERS,
} from "../../content/class3-water-dist/repaired-116-2026-09-22.mjs";
import { BANK, RELEASE, TARGETS, buildPlan } from "./class3WaterDistributionRepair.mjs";

const manifest = JSON.parse(readFileSync(new URL("../../content/class3-water-dist/repair-manifest-2026-09-22.json", import.meta.url), "utf8"));
const candidates = buildCandidateQuestions();
const checkedIn = JSON.parse(readFileSync(new URL("../../content/class3-water-dist/candidate-250-2026-09-22.json", import.meta.url), "utf8"));
const repairedCheckedIn = JSON.parse(readFileSync(new URL("../../content/class3-water-dist/repaired-116-2026-09-22.json", import.meta.url), "utf8"));
const reviewFields = ["questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus"];
const projectReview = rows => rows.map(row => Object.fromEntries(reviewFields.map(field => [field, row[field] ?? null])));
assert.deepEqual(checkedIn, candidates, "review file has drifted from import payload");
assert.equal(BANK, "class3-water-dist"); assert.equal(RELEASE, manifest.release);
assert.equal(TARGETS.length, 118);
assert.equal(REPAIRED_QUESTION_NUMBERS.length, 116);
assert.equal(REPAIRED_REGULATORY_NUMBERS.length, 45);
assert.equal(REPAIRED_NUMERIC_NUMBERS.length, 71);
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
const weakDistractor = /\b(paint|billing|billed|account balance|street(?:-| )name|postal code|customer (?:address|payment)|lunch schedule|tank ladder|meter-reader age)\b/i;
assert.equal(new Set(candidates.map(stem)).size, candidates.length);
assert.equal(repairedCheckedIn.length, 116);
assert.deepEqual(repairedCheckedIn.map(q => q.questionNum), REPAIRED_QUESTION_NUMBERS);
assert.equal(new Set(repairedCheckedIn.map(stem)).size, repairedCheckedIn.length);
for (const q of repairedCheckedIn) {
  assert.equal(q.reviewStatus, "in_review");
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(x => x.toLowerCase().trim())).size, 4);
  assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4);
  assert.ok(q.question.length > 35 && q.explanation.length > 35);
  assert.ok(q.sourceTitle && q.sourceReference && q.sourceUrl.startsWith("https://"));
  assert.equal(q.steps, null);
  const answer = q.options[q.correctIndex];
  assert.ok(!(answer.length > 80 && q.options.every((s, i) => i === q.correctIndex || answer.length > 2.5 * s.length)), `repair answer-length cue at ${q.questionNum}`);
  const distractorLengths = q.options.filter((_, i) => i !== q.correctIndex).map(value => value.length).sort((a, b) => a - b);
  const answerLengthRatio = answer.length / distractorLengths[1];
  assert.ok(answerLengthRatio >= 0.45 && answerLengthRatio <= 1.8, `repair option-length imbalance at ${q.questionNum}`);
  if (q.isCalc === "yes") assert.equal(answer, NUMERIC_EXPECTED_ANSWERS[q.questionNum], `numeric key mismatch at ${q.questionNum}`);
}
assert.equal(repairedCheckedIn.filter(q => q.isCalc === "yes").length, 71);
assert.equal(repairedCheckedIn.filter(q => q.isCalc === "no").length, 45);
assert.deepEqual([0, 1, 2, 3].map(i => repairedCheckedIn.filter(q => q.correctIndex === i).length), [29, 29, 29, 29]);
assert.deepEqual(projectReview(buildRepairedQuestions(repairedCheckedIn)), repairedCheckedIn, "checked-in 116-question review payload has drifted from the authored release payload");
for (const q of candidates) {
  assert.equal(q.reviewStatus, "in_review");
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(x => x.toLowerCase().trim())).size, 4);
  assert.ok(q.question.length > 25 && q.explanation.length > 25);
  assert.ok(q.sourceTitle && q.sourceReference && q.sourceUrl.startsWith("https://"));
  assert.notEqual(q.sourceTitle, "WPI 2025 Water Distribution Operator Class III Need-to-Know Criteria");
  assert.ok(!q.sourceReference.includes("Topic-map reference only"));
  assert.ok(!q.options.filter((_, index) => index !== q.correctIndex).some(option => weakDistractor.test(option)), `weak distractor at ${q.questionNum}`);
  const answer = q.options[q.correctIndex];
  assert.ok(!(answer.length > 80 && q.options.every((s, i) => i === q.correctIndex || answer.length > 2.5 * s.length)), `answer-length cue at ${q.questionNum}`);
  const distractorLengths = q.options.filter((_, index) => index !== q.correctIndex).map(value => value.length).sort((a, b) => a - b);
  const answerLengthRatio = answer.length / distractorLengths[1];
  assert.ok(answerLengthRatio >= 0.45 && answerLengthRatio <= 2.8, `candidate option-length imbalance at ${q.questionNum}`);
  if (q.isCalc === "yes") {
    const steps = JSON.parse(q.steps);
    assert.equal(steps.length, 3, `candidate calculation steps missing at ${q.questionNum}`);
    assert.deepEqual(steps.map(step => step.l), ["Formula", "Substitution", "Result"], `candidate calculation step labels invalid at ${q.questionNum}`);
    assert.ok(steps.every(step => typeof step.c === "string" && step.c.length >= 3), `candidate calculation step text invalid at ${q.questionNum}`);
    assert.ok(steps.slice(0, 2).every(step => step.c.length >= 20), `candidate calculation formula detail invalid at ${q.questionNum}`);
  } else {
    assert.equal(q.steps, null, `non-calculation candidate has steps at ${q.questionNum}`);
  }
}
if (process.argv[2]) {
  const snapshot = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const repaired = buildRepairedQuestions(snapshot);
  assert.deepEqual(projectReview(repaired), repairedCheckedIn, "snapshot-derived 116-question release payload has drifted from the review payload");
  const plan = buildPlan(snapshot, manifest);
  const repairNumbers = new Set(REPAIRED_QUESTION_NUMBERS);
  const finalStems = new Set(snapshot.filter(q => !repairNumbers.has(Number(q.questionNum))).map(stem));
  for (const q of repaired) {
    assert.equal(q.reviewStatus, "in_review");
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(x => x.toLowerCase().trim())).size, 4);
    assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4);
    assert.ok(q.question.length > 35 && q.explanation.length > 35);
    assert.ok(q.sourceTitle && q.sourceReference && q.sourceUrl.startsWith("https://"));
    assert.equal(q.steps, null);
    assert.ok(!finalStems.has(stem(q)), `duplicate repaired stem ${q.questionNum}`);
    finalStems.add(stem(q));
    const answer = q.options[q.correctIndex];
    assert.ok(!(answer.length > 80 && q.options.every((s, i) => i === q.correctIndex || answer.length > 2.5 * s.length)), `repair answer-length cue at ${q.questionNum}`);
    if (q.isCalc === "yes") assert.equal(answer, NUMERIC_EXPECTED_ANSWERS[q.questionNum], `numeric key mismatch at ${q.questionNum}`);
  }
  assert.equal(repaired.filter(q => q.isCalc === "yes").length, 71);
  assert.equal(repaired.filter(q => q.isCalc === "no").length, 45);
  const pi = Math.PI;
  const independentNumeric = {
    501: () => [22 + 420 / 9.81 + 5.8], 502: () => [6000 / 2400], 503: () => [150 * 365 * 1000],
    504: () => [101 * 0.85 / 0.75], 505: () => [1200 / 1.5 / 3600], 506: () => [(52 - 45) * 86400 / 1000],
    507: () => [(4800 / 86400) / (pi * 0.2 ** 2 / 4)], 508: () => [293000 * 0.068 * 10 / 1000],
    509: () => [(680 - 310) * 1000 * 3600 / 1e6], 510: () => [114 + 370 / 9.81 - 102],
    511: () => [2300 * 1000 / 6200], 512: () => [100 * 0.2 ** 2.5 / (0.1 ** 2.5 + 0.15 ** 2.5 + 0.2 ** 2.5)],
    513: () => [7100 / 0.052 / 3600], 514: () => [320 / 9.81 - 11.2], 515: () => [41100 * 485 / 575],
    516: () => [9.81 * 0.082 * 25 / 0.74], 517: () => [(5200 / 86400) / (pi * 0.25 ** 2 / 4)],
    518: () => [13800 * 12 * 3.6 / 1000], 519: () => [1240000 * 0.18 / 365 * 1000],
    520: () => [pi * 0.3 ** 2 / 4 * 0.8 * 1000], 521: () => [0.018 * (2500 / 0.6) * (0.9 / (pi * 0.6 ** 2 / 4)) ** 2 / (2 * 9.81)],
    522: () => [(700 - 120) * 1000 * 0.065 / 0.72 / 1000], 523: () => [2000 / 1600],
    524: () => [550 - 18 * 9.81], 526: () => [500 / 720], 527: () => [3000 / (720 * 30 + 3000) * 100],
    528: () => [Math.ceil((2160 / 3.6) / 18) + 1], 529: () => [Math.sqrt(4 * (480 / 3600) / (pi * 1.6)) * 1000],
    530: () => [610 - 450], 531: () => [20 * 9.81], 532: () => [33 / 12], 533: () => [(82 - 48) * 6.895],
    534: () => [16000 / 0.5 / 3600], 535: () => [95000 / 185000 * 1000], 536: () => [3300 / 550],
    537: () => [pi * 0.35 ** 2 / 4 * 1.7 * 1000], 538: () => [180 + 120 - 240],
    539: () => [pi * 0.25 ** 2 / 4 * 2 * 1000], 540: () => [1600 / 1.4 / 60],
    541: () => [(520 - 120) / 9.81], 542: () => [105 - 15], 543: () => [250 + 350 + 500],
    544: () => [pi * 10 ** 2 * 10 * 0.8], 545: () => [12000 / 6000], 546: () => [pi * 0.25 ** 2 / 4 * 1.2 * 1000],
    547: () => [18 * 9.81], 548: () => [2.5 * 48 / 2], 549: () => [4 * 750 / 100 * 0.25 * 86400 / 1000],
    550: () => [350 / 9.81 - (170 - 135)], 551: () => [9.81 * (620 / 3600) * 56 / 0.75],
    552: () => [48 / 24 * 3600], 553: () => [12 / 2000 * 100], 554: () => [43.2 * 150 / 500 * Math.exp(-0.4 * 1.5)],
    555: () => [220 * 48], 556: () => [9.81 * 0.18 * 8.2], 557: () => [(560 - 325) * 1000 * 0.215 / 1000],
    558: () => [(780 / 3600 / 4) / (pi * 0.25 ** 2 / 4)], 559: () => [14400 / 120000],
    560: () => [pi * 12.5 ** 2 * 4.2], 561: () => [10.67 * 450 * 0.060 ** 1.852 / (130 ** 1.852 * 0.350 ** 4.871)],
    562: () => [128 - 105 + 5], 563: () => [2400 / 800], 564: () => [(525 - 473) / 820],
    565: () => [1000 / 0.140 / 3600, 0.140 * 7200 - 1000], 566: () => [6000000 / (8 * 3600)],
    567: () => [20], 568: () => [550000 / (1000 * 9.81)], 569: () => [(16 - 6) * 86400 / 1000],
    570: () => [9.81 * 0.235 * 42 / 0.78 * 24 * 0.11], 571: () => [102 + 350 / 9.81, 102 + 650 / 9.81],
  };
  assert.equal(Object.keys(independentNumeric).length, 70);
  assert.equal(repaired.find(q => q.questionNum === 525).options[repaired.find(q => q.questionNum === 525).correctIndex], "Pipe C");
  for (const q of repaired.filter(item => item.isCalc === "yes" && item.questionNum !== 525)) {
    const displayed = q.options[q.correctIndex].match(/-?\d[\d,]*(?:\.\d+)?/g)?.map(value => Number(value.replaceAll(",", ""))) ?? [];
    const independentlyCalculated = independentNumeric[q.questionNum]();
    assert.ok(displayed.length >= independentlyCalculated.length, `missing displayed number at ${q.questionNum}`);
    independentlyCalculated.forEach((value, i) => {
      const tolerance = Math.max(0.015, Math.abs(value) * 0.006);
      assert.ok(Math.abs(displayed[i] - value) <= tolerance, `independent calculation mismatch at ${q.questionNum}: ${displayed[i]} vs ${value}`);
    });
  }
  for (const q of candidates) {
    assert.ok(!finalStems.has(stem(q)), `existing or repaired duplicate ${q.questionNum}`);
    finalStems.add(stem(q));
  }
  assert.deepEqual(plan.changes.filter(x => x.after.reviewStatus === "in_review").length, 116);
  assert.deepEqual(plan.changes.filter(x => x.after.reviewStatus === "unreviewed").length, 2);
  assert.equal(plan.repaired, 116);
  for (const { before, after } of plan.changes.filter(x => repairNumbers.has(Number(x.after.questionNum)))) {
    assert.equal(before.id, after.id);
    assert.notEqual(before.question + before.explanation, after.question + after.explanation, `repair did not change content at ${after.questionNum}`);
  }
  const altered = structuredClone(snapshot);
  altered.find(q => q.questionNum === 308).options[1] = "changed since backup";
  assert.throws(() => buildPlan(altered, manifest), /differs from September 19 baseline/);
}
console.log("Verified 116 answer-level repairs, 250 held candidates, numerical keys, source evidence, uniqueness, and the fail-closed release plan.");
