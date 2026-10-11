import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const packagePath = path.resolve(import.meta.dirname, "../content/us-texas-class-d-water/texas-class-d-reviewed-package.json");
const sourceUrl = "https://www.tceq.texas.gov/licensing/licenses/waterworksntk";
const expectedModules = [
  "Rules, licensing and records",
  "Safety and operator responsibilities",
  "Source water and general water quality",
  "Groundwater systems",
  "Surface water treatment",
  "Storage and distribution",
  "Disinfection",
  "Water utility math",
];
const calculationStepLabels = ["Target", "Given", "Formula and why", "Unit conversions", "Substitute and calculate", "Answer", "Check"];

const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as {
  status: string;
  bank: { bankKey: string; totalQuestions: number; modules: string[]; moduleTargets: Record<string, number>; minCalcPerMock: number; blueprintVersion: number };
  qualityGate: { reviewStatus: string; answerPositionBalance: Record<string, number> };
  questions: Array<{ bankKey: string; questionNum: number; module: string; options: string[]; correctIndex: number; isCalc: string; steps: Array<{ l: string; c: string }> | null; sourceUrl: string; finalReviewStatus: string }>;
};

describe("Texas Class D governed package", () => {
  it("contains only the reviewed state-specific bank and its exact approved allocation", () => {
    expect(pkg.status).toBe("frontier-reviewed-content-ready-for-governed-staging");
    expect(pkg.bank).toMatchObject({ bankKey: "us-texas-class-d-water", totalQuestions: 120, blueprintVersion: 1, minCalcPerMock: 8 });
    expect(pkg.bank.modules).toEqual(expectedModules);
    expect(pkg.questions).toHaveLength(120);
    for (const module of expectedModules) expect(pkg.bank.moduleTargets[module]).toBe(15);
    const actualModuleCounts = new Map<string, number>();
    for (const question of pkg.questions) {
      actualModuleCounts.set(question.module, (actualModuleCounts.get(question.module) ?? 0) + 1);
    }
    expect([...actualModuleCounts.keys()].sort()).toEqual([...expectedModules].sort());
    for (const module of expectedModules) expect(actualModuleCounts.get(module)).toBe(15);
  });

  it("keeps every staged item source-bounded, final-review passed and structurally valid", () => {
    const numbers = new Set<number>();
    const answerPositions = [0, 0, 0, 0];
    for (const question of pkg.questions) {
      expect(question.bankKey).toBe("us-texas-class-d-water");
      expect(numbers.has(question.questionNum)).toBe(false);
      numbers.add(question.questionNum);
      expect(question.module).toBeTruthy();
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(4);
      answerPositions[question.correctIndex] += 1;
      expect(question.sourceUrl).toBe(sourceUrl);
      expect(question.finalReviewStatus).toBe("review_pass");
      const serialized = JSON.stringify(question);
      expect(serialized).not.toContain("—");
      if (question.isCalc === "yes") expect(question.steps?.map(step => step.l)).toEqual(calculationStepLabels);
      else expect(question.steps).toBeNull();
    }
    expect(numbers).toEqual(new Set(Array.from({ length: 120 }, (_, index) => index + 1)));
    expect(answerPositions).toEqual([30, 30, 30, 30]);
    expect(pkg.qualityGate.reviewStatus).toContain("all 120 questions passed final review");
    expect(pkg.qualityGate.answerPositionBalance).toEqual({ "0": 30, "1": 30, "2": 30, "3": 30 });
  });

  it("has fifteen worked calculation items in the dedicated math module", () => {
    const calculations = pkg.questions.filter(question => question.isCalc === "yes");
    expect(calculations).toHaveLength(15);
    expect(calculations.every(question => question.module === "Water utility math")).toBe(true);
  });
});
