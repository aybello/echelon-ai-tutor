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

  it.each(banks)("contains 500 validated additive questions for $bankKey", ({ bankKey, file }) => {
    const questions = load(file);
    const answerCounts = [0, 0, 0, 0];
    const answerSequence: number[] = [];

    expect(questions).toHaveLength(500);
    expect(questions.map((question: any) => question.questionNum)).toEqual(
      Array.from({ length: 500 }, (_, index) => 1001 + index),
    );
    expect(new Set(questions.map((question: any) => question.question)).size).toBe(500);
    expect(questions.filter((question: any) => question.isCalc === "yes")).toHaveLength(96);

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

    expect(answerCounts).toEqual([125, 125, 125, 125]);
    expect(longestRun(answerSequence)).toBeLessThanOrEqual(3);
    expect(answerSequence.some((answer, index) => answer !== index % 4)).toBe(true);

    const byStream = new Map<string, any[]>();
    for (const question of questions) {
      byStream.set(question.stream, [...(byStream.get(question.stream) ?? []), question]);
    }
    expect(byStream.size).toBe(2);
    for (const [stream, streamQuestions] of byStream) {
      expect(streamQuestions).toHaveLength(250);
      expect(streamQuestions.filter((question: any) => question.isCalc === "yes")).toHaveLength(48);
      expect(streamQuestions.reduce((counts: Record<string, number>, question: any) => {
        counts[question.difficulty] = (counts[question.difficulty] ?? 0) + 1;
        return counts;
      }, {})).toEqual(manifest.blueprint[stream].difficulty);
    }
  });

  it("contains 1,000 globally unique questions and item IDs", () => {
    const questions = [...load("oit-water-500.json"), ...load("oit-wastewater-500.json")];

    expect(questions).toHaveLength(1_000);
    expect(new Set(questions.map((question: any) => question.itemId)).size).toBe(1_000);
    expect(new Set(questions.map((question: any) => question.question)).size).toBe(1_000);
  });

  it("keeps the package behind an individual approval gate", () => {
    const importer = fs.readFileSync(
      path.resolve(contentRoot, "..", "..", "scripts", "import-oit-question-banks.mjs"),
      "utf8",
    );
    expect(manifest.governance).toMatchObject({
      sourceReviewStatus: "unreviewed",
      databaseStagingStatus: "in_review",
      activation: "individual-admin-approval-required",
    });
    expect(importer).toContain("VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, 'in_review')");
    expect(importer).toContain("reviewStatus NOT IN ('in_review', 'rejected')");
  });

  it("does not reintroduce the factual and templating defects from the first pass", () => {
    const serialized = JSON.stringify([...load("oit-water-500.json"), ...load("oit-wastewater-500.json")]);
    expect(serialized).not.toMatch(/filterable particulate material/i);
    expect(serialized).not.toMatch(/effective biochemical oxygen demand/i);
    expect(serialized).not.toMatch(/achieving its intended operational result/i);
  });
});
