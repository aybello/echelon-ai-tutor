import { describe, expect, it } from "vitest";
import { buildPreviewDiagnostic } from "../shared/previewDiagnostic";

describe("QuizGate preview diagnostic", () => {
  it("calculates score, weak topics and a targeted recommendation", () => {
    const result = buildPreviewDiagnostic([
      { module: "Disinfection", correct: false },
      { module: "Disinfection", correct: true },
      { module: "Hydraulics", correct: false },
      { module: "Safety", correct: true },
      { module: "Safety", correct: true },
    ], 5);

    expect(result.score).toBe(60);
    expect(result.correct).toBe(3);
    expect(result.weakTopics).toEqual(["Hydraulics", "Disinfection"]);
    expect(result.recommendation).toContain("Hydraulics");
  });

  it("does not present a readiness or pass prediction", () => {
    const result = buildPreviewDiagnostic(
      Array.from({ length: 15 }, () => ({ module: "Safety", correct: true })),
      15,
    );
    expect(result.label).toBe("Strong start");
    expect(result.recommendation.toLowerCase()).not.toContain("pass");
    expect(result.recommendation.toLowerCase()).not.toContain("ready");
  });
});
