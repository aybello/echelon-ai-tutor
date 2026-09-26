import { family, calculation, numeric } from "./helpers.mjs";
export { family, calculation, numeric };
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BLUEPRINTS, SOURCES } from "./sources.mjs";
import { waterTreatment } from "./water-treatment.mjs";
import { waterDistribution } from "./water-distribution.mjs";
import { wastewaterTreatment } from "./wastewater-treatment.mjs";
import { wastewaterCollection } from "./wastewater-collection.mjs";

const datasets = {
  "class2-water": waterTreatment,
  "class2-water-dist": waterDistribution,
  "class2-wastewater": wastewaterTreatment,
  "class2-wastewater-coll": wastewaterCollection,
};

const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, "");
export function makeBank(bankKey, families) {
  const blueprint = BLUEPRINTS[bankKey];
  if (!blueprint) throw new Error(`Unknown bank: ${bankKey}`);
  const result = [];
  const perModule = new Map();
  const keys = new Set();
  const keyPositions = Array.from({ length: 250 }, (_, i) => i % 4);
  let seed = [...bankKey].reduce((value, character) => (Math.imul(value, 31) + character.charCodeAt(0)) >>> 0, 20260923);
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 2 ** 32;
  };
  for (let i = keyPositions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [keyPositions[i], keyPositions[j]] = [keyPositions[j], keyPositions[i]];
  }
  for (const [familyIndex, item] of families.entries()) {
    if (!blueprint.areas[item.module]) throw new Error(`${bankKey}: unknown module ${item.module}`);
    const source = SOURCES[item.sourceKey];
    if (!source || !item.sourceReference) throw new Error(`${bankKey}: missing specific source support`);
    const rows = item.isCalc ? item.inputs.map(input => item.build(input)) : item.cases.map(([situation, answer, reason]) => ({
      question: `${situation} ${item.ask}`,
      options: item.options,
      answer,
      explanation: reason,
    }));
    if (rows.length !== 5) throw new Error(`${bankKey}: family ${familyIndex + 1} needs five distinct scenarios`);
    for (const [caseIndex, row] of rows.entries()) {
      if (!row.question || !row.explanation || !Array.isArray(row.options) || row.options.length !== 4 ||
          !Number.isInteger(row.answer) || row.answer < 0 || row.answer > 3) throw new Error(`${bankKey}: incomplete item`);
      const canonicalStem = normalize(row.question);
      if (keys.has(`${bankKey}:${canonicalStem}`)) throw new Error(`${bankKey}: duplicate stem`);
      keys.add(`${bankKey}:${canonicalStem}`);
      const order = [0, 1, 2, 3];
      const desiredPosition = keyPositions[result.length];
      const shift = (row.answer - desiredPosition + 4) % 4;
      const rotated = order.slice(shift).concat(order.slice(0, shift));
      const options = rotated.map(position => row.options[position]);
      if (new Set(options.map(normalize)).size !== 4) throw new Error(`${bankKey}: repeated options`);
      const number = result.length + 1;
      result.push({
        draftId: `${bankKey}-20260923-${String(number).padStart(3, "0")}`,
        bankKey,
        questionNum: null,
        module: item.module,
        difficulty: row.difficulty || "medium",
        question: row.question,
        options,
        correctIndex: rotated.indexOf(row.answer),
        explanation: row.explanation,
        steps: row.steps || null,
        tip: null,
        isCalc: item.isCalc ? "yes" : "no",
        topic: item.topic,
        cognitiveLevel: "application",
        sourceTitle: source.title,
        sourceReference: item.sourceReference,
        sourceUrl: source.url,
        blueprintObjective: `${blueprint.title}: ${item.module} — ${item.topic}`,
        reviewStatus: "in_review",
        reviewedBy: null,
        reviewedAt: null,
        familyId: `${bankKey}-${String(familyIndex + 1).padStart(2, "0")}`,
      });
      perModule.set(item.module, (perModule.get(item.module) || 0) + 1);
    }
  }
  if (result.length !== 250) throw new Error(`${bankKey}: expected 250, got ${result.length}`);
  for (const [module, count] of Object.entries(blueprint.areas)) {
    if (perModule.get(module) !== count) throw new Error(`${bankKey}: ${module}: expected ${count}, got ${perModule.get(module)}`);
  }
  return result;
}

export async function writeAll() {
  const summary = {};
  for (const [bank, families] of Object.entries(datasets)) {
    const rows = makeBank(bank, families);
    const file = fileURLToPath(new URL(`./${bank}-250-drafts.json`, import.meta.url));
    await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`);
    summary[bank] = { count: rows.length, calculations: rows.filter(row => row.isCalc === "yes").length };
  }
  return summary;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  console.log(await writeAll());
}
