import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { examBankGapQuestions } from "./examBankGapQuestions";

type ReviewRecord = {
  bankKey: string;
  questionNum: number;
  module: string;
  difficulty: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isCalc: string;
  steps: unknown;
};

function toReviewRecord(row: typeof examBankGapQuestions[number]): ReviewRecord {
  return {
    bankKey: row.bankKey,
    questionNum: row.questionNum,
    module: row.module,
    difficulty: row.difficulty ?? null,
    question: row.question,
    options: JSON.parse(row.options),
    correctIndex: row.correctIndex,
    explanation: row.explanation,
    isCalc: row.isCalc ?? "no",
    steps: row.steps ? JSON.parse(row.steps) : null,
  };
}

const collection = examBankGapQuestions.filter(row => row.bankKey === "class1-wastewater-coll");
const distribution = examBankGapQuestions.filter(row => row.bankKey === "class1-water-dist");

const batches = {
  "01_collection_science": collection.filter(row => row.module === "Applied Science & Hydraulics"),
  "02_collection_equipment": collection.filter(row => row.module === "Operate Equipment"),
  "03_collection_processes": collection.filter(row => row.module === "Maintain & Restore Collection System"),
  "04_distribution_general_a": distribution.filter(row => row.module === "General").slice(0, 65),
  "05_distribution_general_b": distribution.filter(row => row.module === "General").slice(65),
  "06_distribution_administration": distribution.filter(row => row.module === "Administration"),
};

async function main() {
  const outputDir = resolve(process.cwd(), ".exam-bank-quality-audit");
  await mkdir(outputDir, { recursive: true });

  for (const [name, rows] of Object.entries(batches)) {
    await writeFile(
      resolve(outputDir, `${name}.json`),
      JSON.stringify(rows.map(toReviewRecord), null, 2),
    );
  }

  console.log(JSON.stringify(Object.fromEntries(
    Object.entries(batches).map(([name, rows]) => [name, rows.length]),
  ), null, 2));
}

void main();
