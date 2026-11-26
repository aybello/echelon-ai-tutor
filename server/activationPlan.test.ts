import { describe, expect, it } from "vitest";
import {
  buildDiagnosticBaseline,
  estimateWeeklyQuestionGoal,
  selectDiagnosticQuestionNumbers,
} from "../shared/activationPlan";

describe("activation diagnostic planning", () => {
  it("samples across modules instead of taking one ordered block", () => {
    const candidates = ["Disinfection", "Hydraulics", "Safety"].flatMap((module, moduleIndex) =>
      Array.from({ length: 10 }, (_, index) => ({
        questionNum: moduleIndex * 10 + index + 1,
        module,
        difficulty: index % 3 === 0 ? "hard" : index % 2 === 0 ? "medium" : "easy",
      })),
    );
    const selected = selectDiagnosticQuestionNumbers(candidates, 42, 15);
    expect(selected).toHaveLength(15);
    expect(new Set(selected).size).toBe(15);
    expect(selected.some(id => id <= 10)).toBe(true);
    expect(selected.some(id => id > 10 && id <= 20)).toBe(true);
    expect(selected.some(id => id > 20)).toBe(true);
  });

  it("builds a transparent baseline without readiness or pass language", () => {
    const result = buildDiagnosticBaseline([
      { module: "Disinfection", correct: false },
      { module: "Disinfection", correct: true },
      { module: "Hydraulics", correct: false },
      { module: "Safety", correct: true },
      { module: "Safety", correct: true },
    ]);
    expect(result.score).toBe(60);
    expect(result.weakTopics).toEqual(["Hydraulics", "Disinfection"]);
    expect(result.strongTopics).toEqual(["Safety"]);
    expect(JSON.stringify(result).toLowerCase()).not.toContain("pass prediction");
    expect(result.label.toLowerCase()).not.toContain("ready");
  });

  it("turns the chosen study rhythm into a realistic weekly target", () => {
    expect(estimateWeeklyQuestionGoal(4, 25)).toBe(52);
    expect(estimateWeeklyQuestionGoal(0, 2)).toBe(5);
    expect(estimateWeeklyQuestionGoal(10, 200)).toBe(315);
  });
});
