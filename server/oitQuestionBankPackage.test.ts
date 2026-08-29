import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const contentRoot = path.resolve(testDirectory, "..", "content", "oit");
const load = (name: string) => JSON.parse(
  fs.readFileSync(path.join(contentRoot, "questions", name), "utf8"),
);
const manifest = JSON.parse(fs.readFileSync(path.join(contentRoot, "manifest.json"), "utf8"));

function longestRun(values: number[]) {
  let longest = 0;
  let current = 0;
  let previous = -1;
  for (const value of values) {
    current = value === previous ? current + 1 : 1;
    previous = value;
    longest = Math.max(longest, current);
  }
  return longest;
}

describe("OIT question-bank deployment package", () => {
  const banks = [
    { bankKey: "oit", file: "oit-water-500.json" },
    { bankKey: "oit-ww", file: "oit-wastewater-500.json" },
  ];

  it.each(banks)("contains the validated additive questions retained for $bankKey", ({ bankKey, file }) => {
    const questions = load(file);
    const expectedCount = manifest.banks.find((bank: any) => bank.bankKey === bankKey).expectedCount;
    const answerCounts = [0, 0, 0, 0];
    const answerSequence: number[] = [];

    expect(questions).toHaveLength(expectedCount);
    expect(new Set(questions.map((question: any) => question.questionNum)).size).toBe(expectedCount);
    expect(questions.every((question: any) => question.questionNum >= 1001 && question.questionNum <= 1500)).toBe(true);
    expect(new Set(questions.map((question: any) => question.question)).size).toBe(expectedCount);

    for (const question of questions) {
      expect(question.bankKey).toBe(bankKey);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.correctAnswer).toBe(question.options[question.correctIndex]);
      expect(question.correctAnswer.toLowerCase()).not.toContain(question.topic.toLowerCase());
      for (const option of question.options) {
        expect(option).not.toMatch(/^[a-z]/);
      }
      if (question.topic === "turbidity removal" || question.topic === "BOD removal") {
        for (const option of question.options) {
          expect(Number.parseFloat(option)).toBeGreaterThanOrEqual(0);
          expect(Number.parseFloat(option)).toBeLessThanOrEqual(100);
        }
      }
      expect(["recall", "application"]).toContain(question.cognitiveLevel);
      expect(question.reviewStatus).toBe("unreviewed");
      expect(question.sourceReference).toContain(question.topic);
      answerCounts[question.correctIndex] += 1;
      answerSequence.push(question.correctIndex);
    }

    expect(Math.max(...answerCounts) - Math.min(...answerCounts)).toBeLessThanOrEqual(2);
    expect(longestRun(answerSequence)).toBeLessThanOrEqual(3);
    expect(answerSequence.some((answer, index) => answer !== index % 4)).toBe(true);

    const byStream = new Map<string, any[]>();
    for (const question of questions) {
      byStream.set(question.stream, [...(byStream.get(question.stream) ?? []), question]);
    }
    expect(byStream.size).toBe(2);
    for (const [stream, streamQuestions] of byStream) {
      expect(streamQuestions).toHaveLength(manifest.blueprint[stream].questionCount);
      expect(streamQuestions.filter((question: any) => question.isCalc === "yes")).toHaveLength(manifest.blueprint[stream].calculationCount);
      expect(streamQuestions.reduce((counts: Record<string, number>, question: any) => {
        counts[question.difficulty] = (counts[question.difficulty] ?? 0) + 1;
        return counts;
      }, {})).toEqual(manifest.blueprint[stream].difficulty);
    }
  });

  it("contains globally unique retained questions and item IDs", () => {
    const questions = [...load("oit-water-500.json"), ...load("oit-wastewater-500.json")];
    const expectedTotal = manifest.banks.reduce((sum: number, bank: any) => sum + bank.expectedCount, 0);

    expect(questions).toHaveLength(expectedTotal);
    expect(new Set(questions.map((question: any) => question.itemId)).size).toBe(expectedTotal);
    expect(new Set(questions.map((question: any) => question.question)).size).toBe(expectedTotal);
  });

  it("keeps the package behind an individual approval gate", () => {
    const importer = fs.readFileSync(
      path.resolve(contentRoot, "..", "..", "scripts", "lib", "oitImporter.mjs"),
      "utf8",
    );
    expect(manifest.governance).toMatchObject({
      sourceReviewStatus: "unreviewed",
      databaseStagingStatus: "in_review",
      activation: "individual-admin-approval-required",
    });
    expect(importer).toContain("VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_review')");
    expect(importer).toContain("reviewStatus NOT IN ('in_review', 'rejected')");
  });

  it("does not reintroduce the factual and templating defects from the first pass", () => {
    const serialized = JSON.stringify([...load("oit-water-500.json"), ...load("oit-wastewater-500.json")]);
    expect(serialized).not.toMatch(/filterable particulate material/i);
    expect(serialized).not.toMatch(/effective biochemical oxygen demand/i);
    expect(serialized).not.toMatch(/achieving its intended operational result/i);
  });

  it("keeps the independent-review safety, rounding, and terminology repairs", () => {
    const water = load("oit-water-500.json");
    const wastewater = load("oit-wastewater-500.json");
    const get = (questions: any[], questionNum: number) => questions.find(question => question.questionNum === questionNum);

    const rbcTrip = get(wastewater, 1054);
    expect(rbcTrip.correctAnswer).toMatch(/isolate and lock out/i);
    expect(rbcTrip.correctAnswer).toMatch(/investigate the trip cause/i);
    expect(rbcTrip.correctAnswer).not.toMatch(/restore rotation before/i);

    const fmRatio = get(wastewater, 1438);
    expect(fmRatio.question).toContain("Round to 2 decimal places.");
    expect(Number.parseFloat(fmRatio.correctAnswer)).toBe(0.18);

    const airRelease = get(water, 1121);
    expect(airRelease.correctAnswer).toMatch(/pressurized pipeline/i);
    expect(airRelease.correctAnswer).not.toMatch(/vacuum/i);

    const wetWellCleaning = get(wastewater, 1351);
    expect(wetWellCleaning.correctAnswer).toMatch(/surface work/i);
    expect(wetWellCleaning.correctAnswer).toMatch(/confined-space entry controls apply only when bodily entry is required/i);
  });

  it("uses directly applicable Ontario excavation and traffic-control sources for the corrected safety items", () => {
    const water = load("oit-water-500.json");
    const wastewater = load("oit-wastewater-500.json");
    const get = (questions: any[], questionNum: number) => questions.find(question => question.questionNum === questionNum);

    const utilityLocating = get(water, 1393);
    const trafficControl = get(wastewater, 1500);

    for (const question of [utilityLocating]) {
      expect(question.sourceUrl).toBe("https://www.ontario.ca/page/achieve-compliance-construction-sites-excavations-underground-work-and-work-compressed-air");
      expect(question.sourceReference).toMatch(/O\. Reg\. 213\/91 sections 222 to 241/i);
      expect(question.sourceUrl).not.toMatch(/confinedspace/i);
    }

    expect(trafficControl.sourceUrl).toBe("https://www.ccohs.ca/oshanswers/safety_haz/road_work/traffic_control_person.html");
    expect(trafficControl.sourceReference).toMatch(/traffic-protection planning/i);
    expect(trafficControl.sourceUrl).not.toMatch(/confinedspace/i);
  });

  it("uses discriminating conceptual stems and explicit calculation precision", () => {
    const questions = [...load("oit-water-500.json"), ...load("oit-wastewater-500.json")];
    const broadStem = /which statement (?:about .+ )?is correct|which statement is accurate|what should an oit understand about|which explanation .+ is technically sound|which principle should guide an operator working with/i;

    for (const question of questions) {
      if (question.isCalc === "yes") {
        expect(question.question).toMatch(/Round to (?:the nearest whole number|\d+ decimal (?:place|places))\./);
      } else {
        expect(question.question).not.toMatch(broadStem);
      }
    }
  });

  it("excludes every independently flagged question from the staged source package", () => {
    const excluded = {
      oit: [1080, 1084, 1114, 1148, 1150, 1176, 1224, 1280, 1312, 1397, 1400],
      "oit-ww": [1006, 1044, 1051, 1060, 1067, 1083, 1130, 1153, 1161, 1162, 1193, 1251, 1289, 1327, 1378, 1483, 1486],
    };
    for (const { bankKey, file } of banks) {
      const questionNums = new Set(load(file).map((question: any) => question.questionNum));
      for (const questionNum of excluded[bankKey as keyof typeof excluded]) {
        expect(questionNums.has(questionNum)).toBe(false);
      }
    }
  });
});
