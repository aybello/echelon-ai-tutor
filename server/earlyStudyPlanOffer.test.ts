import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { shouldShowSoftGate, SOFT_GATE_AT_QUESTION } from "../client/src/components/PreviewStudyPlanPrompt";
import { buildStudyPlanSteps } from "./previewStudyPlanEmail";
import { PRODUCT_KPI_JOURNEY_EVENT_NAMES } from "./analyticsAggregates";

/**
 * The early study plan offer exists because the paywall is reached by a small
 * minority of people who start a quiz. Everyone else used to leave anonymous
 * and unreachable. These tests protect the two things that make the offer
 * worth having: it must appear while the learner is still present, and it must
 * never interrupt someone who has already paid.
 */

const base = {
  answered: SOFT_GATE_AT_QUESTION,
  showAt: SOFT_GATE_AT_QUESTION,
  isFreePreview: true,
  alreadySeen: false,
  gateActive: false,
};

describe("early study plan offer visibility", () => {
  it("appears partway through the preview, well before the paywall", () => {
    expect(SOFT_GATE_AT_QUESTION).toBeGreaterThan(0);
    expect(SOFT_GATE_AT_QUESTION).toBeLessThan(15);
    expect(shouldShowSoftGate(base)).toBe(true);
  });

  it("never interrupts a learner who already paid", () => {
    expect(shouldShowSoftGate({ ...base, isFreePreview: false })).toBe(false);
  });

  it("never stacks on top of the hard paywall", () => {
    expect(shouldShowSoftGate({ ...base, gateActive: true })).toBe(false);
  });

  it("asks once per course rather than on every session", () => {
    expect(shouldShowSoftGate({ ...base, alreadySeen: true })).toBe(false);
  });

  it("fires on the trigger question only, not on every later question", () => {
    expect(shouldShowSoftGate({ ...base, answered: SOFT_GATE_AT_QUESTION - 1 })).toBe(false);
    expect(shouldShowSoftGate({ ...base, answered: SOFT_GATE_AT_QUESTION + 1 })).toBe(false);
  });

  it("leaves most of the free preview available after the ask", () => {
    // A soft gate that consumed the preview would simply move the wall
    // forward, which would be worse than the current behaviour.
    const remaining = 15 - SOFT_GATE_AT_QUESTION;
    expect(remaining).toBeGreaterThanOrEqual(10);
  });
});

describe("study plan capture contract", () => {
  it("accepts a mid-preview capture with the honest stage", () => {
    const schema = (appRouter._def.procedures as Record<string, { _def: { inputs: unknown[] } }>)[
      "trial.studyPlan"
    ]._def.inputs[0] as { parse: (value: unknown) => { stage: string } };

    const parsed = schema.parse({
      email: "learner@example.com",
      productKey: "class1-water",
      score: 60,
      correct: 3,
      total: 5,
      weakTopics: ["Disinfection"],
      stage: "in_preview",
    });

    expect(parsed.stage).toBe("in_preview");
  });

  it("still defaults to the completed-preview stage for the paywall capture", () => {
    const schema = (appRouter._def.procedures as Record<string, { _def: { inputs: unknown[] } }>)[
      "trial.studyPlan"
    ]._def.inputs[0] as { parse: (value: unknown) => { stage: string } };

    const parsed = schema.parse({
      email: "learner@example.com",
      productKey: "class1-water",
      score: 60,
      correct: 9,
      total: 15,
      weakTopics: [],
    });

    expect(parsed.stage).toBe("preview_complete");
  });

  it("gives a mid-preview learner a plan that is still actionable", () => {
    const steps = buildStudyPlanSteps({
      score: 60,
      weakTopics: ["Disinfection", "Hydraulics"],
      courseLabel: "WPI Class I Water Treatment",
    });

    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0]).toContain("Disinfection");
  });
});

describe("offer measurement", () => {
  it("counts both the offer and the capture so the rate has an honest denominator", () => {
    expect(PRODUCT_KPI_JOURNEY_EVENT_NAMES).toContain("preview_plan_offered");
    expect(PRODUCT_KPI_JOURNEY_EVENT_NAMES).toContain("preview_plan_requested");
  });

  it("accepts the offer impression on the public funnel endpoint", () => {
    const schema = (appRouter._def.procedures as Record<string, { _def: { inputs: unknown[] } }>)[
      "funnelAnalytics.track"
    ]._def.inputs[0] as { parse: (value: unknown) => { event: string } };

    const parsed = schema.parse({
      event: "preview_plan_offered",
      examType: "class1-water",
      questionCount: 5,
      visitorId: "a".repeat(32),
    });

    expect(parsed.event).toBe("preview_plan_offered");
  });
});
