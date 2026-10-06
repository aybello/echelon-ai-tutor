import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { makeBank } from "./build.mjs";
import { BLUEPRINTS, SOURCES } from "./sources.mjs";
import { waterTreatment } from "./water-treatment.mjs";
import { waterDistribution } from "./water-distribution.mjs";
import { wastewaterTreatment } from "./wastewater-treatment.mjs";
import { wastewaterCollection } from "./wastewater-collection.mjs";

const banks = {
  "class2-water": waterTreatment,
  "class2-water-dist": waterDistribution,
  "class2-wastewater": wastewaterTreatment,
  "class2-wastewater-coll": wastewaterCollection,
};

// Recompute answers independently from the family generators. Every formula family is explicit here.
const expected = {
  "Chemical dose mass": ([q, d]) => q * d,
  "Effective contact time": ([v, q, b]) => v / q * 60 * b,
  "Removal percentage": ([a, b]) => (a - b) / a * 100,
  "Filtration rate": ([q, a]) => q / a,
  "Pump delivery": ([v, m]) => v / m * 60,
  "Pressure head": h => h * 9.81,
  "Cylindrical tank volume": ([d, h]) => Math.PI * (d / 2) ** 2 * h,
  "Main flow velocity": ([d, q]) => (q / 1000) / (Math.PI * (d / 1000) ** 2 / 4),
  "Main flush volume": ([d, l]) => Math.PI * (d / 1000) ** 2 / 4 * l,
  "Storage drawdown time": ([v, outflow, inflow]) => v / (outflow - inflow),
  "Pump run rate": ([v, m]) => v / m * 60,
  "Aeration tank hydraulic time": ([v, q]) => v / q * 24,
  "Aeration power": ([p, h]) => p * h,
  "Sludge volume index": ([settled, mlss]) => settled / (mlss / 1000),
  "BOD removal": ([a, b]) => (a - b) / a * 100,
  "Sewer pipe storage": ([d, l]) => Math.PI * (d / 1000) ** 2 / 4 * l,
  "Sewer mean velocity": ([q, d]) => (q / 1000) / (Math.PI * (d / 1000) ** 2 / 4),
  "Wet-well pump rate": ([a, d, t, q]) => a * d / t * 60 + q,
  "Pump run fraction": ([run, total]) => run / total * 100,
  "Infiltration flow per kilometre": ([wet, dry, len]) => (wet - dry) / len,
};

const norm = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const allStems = new Set();
const report = {};
for (const [bank, families] of Object.entries(banks)) {
  const rows = makeBank(bank, families);
  const disk = JSON.parse(await readFile(fileURLToPath(new URL(`./${bank}-250-drafts.json`, import.meta.url)), "utf8"));
  assert.deepEqual(disk, rows, `${bank}: generated file differs from source`);
  assert.equal(rows.length, 250);
  assert.equal(families.length, 50);
  const modules = Object.fromEntries(Object.keys(BLUEPRINTS[bank].areas).map(area => [area, 0]));
  const answers = [0, 0, 0, 0];
  let calcs = 0;
  for (const [i, row] of rows.entries()) {
    assert.equal(row.reviewStatus, "in_review");
    assert.equal(row.questionNum, null);
    assert.equal(row.bankKey, bank);
    assert.equal(row.draftId, `${bank}-20260923-${String(i + 1).padStart(3, "0")}`);
    assert.equal(row.options.length, 4);
    assert.equal(new Set(row.options.map(norm)).size, 4);
    assert.equal(typeof row.explanation, "string");
    assert.ok(row.explanation.length >= 12);
    assert.ok(row.sourceReference.length >= 20);
    assert.ok(row.sourceUrl.startsWith("https://www.ontario.ca/") || row.sourceUrl.startsWith("https://www.epa.gov/"));
    assert.ok(!row.sourceTitle.includes("WPI"), `topic guide used as answer evidence: ${row.draftId}`);
    assert.ok(!/\b(?:paint|billing|account balance|street name)\b/i.test(row.options.join(" ")), `weak distractor: ${row.draftId}`);
    const stem = norm(row.question);
    assert.ok(!allStems.has(stem), `duplicate across banks: ${row.draftId}`);
    allStems.add(stem);
    modules[row.module]++;
    answers[row.correctIndex]++;
    if (row.isCalc === "yes") {
      calcs++;
      assert.deepEqual(row.steps.map(step => step.l), ["Formula", "Substitution", "Result"]);
      assert.equal(row.steps[2].c, row.options[row.correctIndex]);
      const family = families[Math.floor(i / 5)];
      assert.ok(expected[family.topic], `unverified formula: ${family.topic}`);
      const input = family.inputs[i % 5];
      const independentlyComputed = expected[family.topic](input);
      const keyed = Number.parseFloat(row.options[row.correctIndex]);
      const decimalPlaces = (row.options[row.correctIndex].split(" ")[0].split(".")[1] || "").length;
      const tolerance = 0.5 * 10 ** -decimalPlaces + 1e-9;
      assert.ok(Math.abs(keyed - independentlyComputed) <= tolerance, `wrong calculation: ${row.draftId}`);
    } else assert.equal(row.steps, null);
  }
  assert.equal(calcs, 25);
  assert.deepEqual(modules, BLUEPRINTS[bank].areas);
  assert.ok(Math.max(...answers) - Math.min(...answers) <= 1);
  for (const family of families) {
    assert.ok(SOURCES[family.sourceKey]);
    if (family.isCalc) assert.equal(family.inputs.length, 5);
    else {
      assert.equal(family.cases.length, 5);
      assert.ok(new Set(family.cases.map(([s]) => norm(s))).size === 5, `repeated cases: ${bank}/${family.topic}`);
    }
  }
  report[bank] = { count: rows.length, moduleCounts: modules, calculations: calcs, answerPositions: answers };
}
console.log(JSON.stringify({ total: allStems.size, banks: report }, null, 2));
