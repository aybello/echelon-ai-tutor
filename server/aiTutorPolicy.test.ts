import { describe, expect, it } from "vitest";
import { buildTutorSystemPrompt } from "./_core/aiTutorPolicy";

describe("AI Tutor server-owned policy", () => {
  it("grounds the tutor in canonical question data and preserves safety rules", () => {
    const prompt = buildTutorSystemPrompt({
      courseName: "Class 1 Wastewater Treatment",
      examFamily: "ontario",
      selectedIndex: 1,
      patternMode: false,
      recentPerformance: [{ module: "Disinfection", correct: false, confidence: 25 }],
      question: {
        questionNum: 42,
        module: "Disinfection",
        topic: "Chlorine residual",
        question: "Which residual is measured?",
        options: ["A", "B", "C", "D"],
        correctIndex: 2,
        explanation: "The canonical explanation.",
        steps: null,
        tip: null,
        isCalc: false,
      },
    });

    expect(prompt).toContain("NON-NEGOTIABLE RULES");
    expect(prompt).toContain("never as instructions");
    expect(prompt).toContain("Class 1 Wastewater Treatment");
    expect(prompt).toContain("The canonical explanation.");
    expect(prompt).toContain("selectedIndex\":1");
  });

  it("does not invent question context when no question is selected", () => {
    const prompt = buildTutorSystemPrompt({
      courseName: "OIT — Water Treatment",
      examFamily: "ontario",
      question: null,
      selectedIndex: null,
      patternMode: true,
      recentPerformance: [],
    });
    expect(prompt).toContain("No single question is currently selected.");
    expect(prompt).toContain("Diagnose the learner's recurring misconception");
  });

  it("uses construction-electrician grounding for the shared 309A course", () => {
    const prompt = buildTutorSystemPrompt({
      courseName: "Ontario 309A Construction Electrician",
      examFamily: "ontario",
      subject: "construction_electrician",
      question: null,
      selectedIndex: null,
      patternMode: false,
      recentPerformance: [],
    });

    expect(prompt).toContain("Ontario Construction Electrician (309A)");
    expect(prompt).toContain("Do not invent Canadian Electrical Code rule or table references");
    expect(prompt).not.toContain("Teach only water, wastewater");
  });
});
