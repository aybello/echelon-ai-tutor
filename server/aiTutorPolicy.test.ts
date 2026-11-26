import { describe, expect, it } from "vitest";
import { AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT, buildTutorSystemPrompt } from "./_core/aiTutorPolicy";
import { resolveCourseKey } from "../shared/courseRegistry";
import { resolveUSStudyContext } from "./usStudyContextServer";

describe("AI Tutor server-owned policy", () => {
  it("limits the free OIT taste to three model-backed messages", () => {
    expect(AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT).toBe(3);
  });
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
  it("prioritizes an explicit worked solution over hint-only mode and requires arithmetic and units", () => {
    const prompt = buildTutorSystemPrompt({ courseName: "OIT", examFamily: "ontario", question: null, selectedIndex: null, patternMode: false, recentPerformance: [] });
    expect(prompt).toContain("takes priority");
    expect(prompt).toContain("Give the requested worked explanation immediately");
    expect(prompt).toContain("Define every symbol");
    expect(prompt).toContain("intermediate results and units");
    expect(prompt).toContain("Round only the final result");
    expect(prompt).toContain("Verify the arithmetic independently");
    expect(prompt).toContain("dividing by influent compares removal to the starting amount");
  });

  it.each([
    ["class1-water", "water-treatment", 1, "ontario"],
    ["class1-wastewater", "wastewater-treatment", 1, "ontario"],
    ["wpi-class3-water-coll", "wastewater-collection", 3, "western"],
    ["wpi-class2-water-dist", "water-distribution", 2, "western"],
    ["us-class1-water", "water-treatment", 1, "united-states"],
    ["us-texas-class-d-water", "water-treatment", 0, "united-states"],
    ["oit-ww", "oit", 0, "ontario"],
    ["electrician-309a", "construction-electrician", 0, "ontario"],
  ])("grounds %s in canonical identity rather than slug keywords", (key, stream, level, jurisdiction) => {
    const course = resolveCourseKey(key as string)!;
    const prompt = buildTutorSystemPrompt({
      courseKey: course.courseKey,
      courseName: course.displayName,
      examFamily: course.examFamily,
      subject: course.track === "construction-electrician" ? "construction_electrician" : "water_operator",
      question: null, selectedIndex: null, patternMode: false, recentPerformance: [],
    });
    const scope = JSON.parse(prompt.split("CANONICAL COURSE SCOPE:\n")[1].split("\n\n")[0]);
    expect(scope).toEqual({
      courseKey: course.courseKey, courseName: course.displayName,
      stream, classLevel: level, examFamily: course.examFamily, studyJurisdiction: jurisdiction,
    });
    expect(prompt).toContain("same concept, stream and level");
    expect(prompt).toContain("one short original follow-up practice question");
    expect(prompt).toContain("never more than two per reply");
    expect(prompt).toContain("until the learner attempts it or explicitly asks");
  });

  it("keeps collection distinct from distribution despite the legacy water-coll key", () => {
    const course = resolveCourseKey("wpi-class3-water-coll")!;
    const prompt = buildTutorSystemPrompt({ courseKey: course.courseKey, courseName: course.displayName, examFamily: course.examFamily, question: null, selectedIndex: null, patternMode: false, recentPerformance: [] });
    expect(prompt).toContain('"stream":"wastewater-collection"');
    expect(prompt).not.toContain('"stream":"water-distribution"');
    expect(prompt).toContain("WPI Class III Wastewater Collection");
  });

  it("retains shared WPI stream and level under validated US study context", () => {
    const course = resolveCourseKey("wpi-class2-water")!;
    const usContext = resolveUSStudyContext(course.courseKey, null, "US");
    expect(usContext).not.toBeNull();
    const prompt = buildTutorSystemPrompt({ courseKey: course.courseKey, courseName: course.displayName, examFamily: course.examFamily, usContext, question: null, selectedIndex: null, patternMode: false, recentPerformance: [] });
    expect(prompt).toContain('"examFamily":"western","studyJurisdiction":"united-states"');
    expect(prompt).toContain('"stream":"water-treatment","classLevel":2');
    expect(prompt).toContain("US gallons (never Imperial gallons)");
    expect(prompt).toContain("state certifying authority");
  });

  it.each([undefined, "unknown-water-class4"])("does not invent stream or level for %s", courseKey => {
    const prompt = buildTutorSystemPrompt({ courseKey, courseName: "Unknown Water Class 4", examFamily: "ontario", question: null, selectedIndex: null, patternMode: false, recentPerformance: [] });
    expect(prompt).toContain("Course stream and level are unverified");
    expect(prompt).not.toContain('"classLevel":4');
    expect(prompt).toContain("ask for clarification instead of inventing exam-specific practice");
  });

  it("requires formula component meanings, units, traps, safe original practice and brevity exceptions", () => {
    const prompt = buildTutorSystemPrompt({ courseKey: "class1-water", courseName: "Class 1 Water", examFamily: "ontario", question: null, selectedIndex: null, patternMode: false, recentPerformance: [] });
    for (const instruction of [
      "Define every symbol with its meaning and unit", "dimensionless ratios and conversion constants",
      "WHY this formula applies", "substitutions", "reasonableness check",
      "relevant misconception or common trap", "do not invent the learner's reasoning",
      "clearly hypothetical and not regulatory limits", "not recalled or purported real exam questions",
      "Never claim exact exam-blueprint alignment", "cannot be verified from the supplied context",
      "brief-answer-only request", "meta/navigation/access questions", "focused clarification",
      "hint-only help", "not an unsolicited solution or an extra set",
      "never grade a practice attempt against that old option",
    ]) expect(prompt).toContain(instruction);
  });

});
