import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { applyOitEditorial } from "../scripts/lib/oitEditorial.mjs";
import { analyseOitAnswerCues } from "../scripts/lib/oitAnswerCues.mjs";
import { summariseAnswerLengthBias } from "./answerLengthBias";

const load = (name: string) => JSON.parse(fs.readFileSync(new URL(`../content/oit/questions/oit-${name}-500.json`, import.meta.url), "utf8"));
const water = load("water");
const wastewater = load("wastewater");
const all = [...water, ...wastewater];

describe("OIT authored answer alternatives", () => {
  it("covers every retained conceptual question without touching calculations or answer slots", () => {
    const revised = applyOitEditorial(all);
    expect(revised).toEqual(all);
    expect(all.filter(q => q.isCalc === "no")).toHaveLength(782);
    expect(all.filter(q => q.isCalc === "yes")).toHaveLength(190);
    for (let i = 0; i < all.length; i++) {
      expect(revised[i].questionNum).toBe(all[i].questionNum);
      expect(revised[i].correctIndex).toBe(all[i].correctIndex);
      if (all[i].isCalc === "yes") expect(revised[i]).toBe(all[i]);
    }
  });

  it("fails when a new conceptual item has no authored alternatives", () => {
    expect(() => applyOitEditorial([...all, { ...water[0], questionNum: 9000 }])).toThrow("Missing editorial choices");
  });

  it("fails when an authored item disappears rather than silently dropping its coverage", () => {
    expect(() => applyOitEditorial(all.slice(1))).toThrow("Unused editorial row");
  });

  it("replaces the old off-topic primary-disinfection choices while keeping its existing key slot", () => {
    const stale = structuredClone(all);
    const question = stale.find(q => q.bankKey === "oit" && q.questionNum === 1039)!;
    const wrongIndex = question.correctIndex === 0 ? 1 : 0;
    question.options[wrongIndex] = "A membrane can produce normal flow while still having an integrity defect";
    const repaired = applyOitEditorial(stale).find(q => q.bankKey === "oit" && q.questionNum === 1039)!;
    expect(repaired.correctIndex).toBe(question.correctIndex);
    expect(repaired.options.join(" ")).not.toMatch(/membrane|floc|nameplate/i);
    expect(repaired.correctAnswer).toMatch(/residual, contact time/);
    expect(repaired.options.some((option: string) => option.includes("Constant residual maintains exposure"))).toBe(true);
  });

  it("keeps numerical misconceptions distinct even when wording is deliberately parallel", () => {
    const question = water.find((q: any) => q.questionNum === 1042);
    expect(question.correctAnswer).toContain("1.4 mg/L");
    expect(new Set(question.options).size).toBe(4);
    expect(question.options.some((option: string) => option.includes("2.6 mg/L"))).toBe(true);
    expect(applyOitEditorial(all).find(q => q.bankKey === "oit" && q.questionNum === 1042)).toEqual(question);
  });

  it.each([["water", water], ["wastewater", wastewater]])("has no long-answer tells under the existing detector: %s", (_name, questions) => {
    const oldDetector = summariseAnswerLengthBias(questions);
    expect(oldDetector.tellCount).toBe(0);
    const cues = analyseOitAnswerCues(questions);
    expect(cues.longTells).toEqual([]);
    expect(cues.shortTells).toEqual([]);
    expect(cues.qualifierTells).toEqual([]);
    expect(cues.longestRate).toBeLessThanOrEqual(0.35);
    expect(cues.shortestRate).toBeLessThanOrEqual(0.35);
  });

  it("detects both overly elaborate keys and conspicuously short keys", () => {
    const example = { ...water[0], correctIndex: 0, correctAnswer: "A lengthy technical answer giving away the correct choice through its excessive detail", options: [] as string[] };
    example.options = [example.correctAnswer, "Short alternative", "Another alternative", "Brief alternative"];
    expect(analyseOitAnswerCues([example]).longTells).toEqual([example.questionNum]);
    example.correctAnswer = "Yes";
    example.options = ["Yes", "A detailed alternative of comparable technical depth", "Another detailed alternative covering a plausible error", "A third detailed alternative covering an operating error"];
    expect(analyseOitAnswerCues([example]).shortTells).toEqual([example.questionNum]);
    example.correctAnswer = "Assess the source and verify the operating conditions";
    example.options = [example.correctAnswer, "Proceed without checking the source", "Judge solely from the displayed value", "Use the indicator alone to diagnose the event"];
    expect(analyseOitAnswerCues([example]).qualifierTells).toEqual([example.questionNum]);
  });
});
