import { describe, expect, it } from "vitest";
import {
  fallbackDebrief,
  evaluateCanonicalDecisions,
} from "./routers/incidentCommandRouter";

// Cedar Ridge Storm — optimal path (all 20-point choices, escalate-document branch at step 4)
const optimalDecisions = [
  { stepId: "source-shift", choiceId: "verify-optimize" },
  { stepId: "filter-breakthrough", choiceId: "isolate-filter" },
  { stepId: "disinfection-risk", choiceId: "ct-verify" },
  { stepId: "confirmation", choiceId: "escalate-document" },
  // escalate-document branch leads to stabilize-controlled
  { stepId: "stabilize-controlled", choiceId: "recovery-gate" },
];

describe("Echelon Command — evaluateCanonicalDecisions", () => {
  it("evaluates a complete optimal path and returns 100", () => {
    const evaluation = evaluateCanonicalDecisions("cedar-ridge-storm", optimalDecisions);
    expect(evaluation.commandScore).toBe(100);
    expect(evaluation.optimalCalls).toBe(5);
    expect(evaluation.totalSteps).toBe(5);
    expect(evaluation.decisions).toHaveLength(5);
    expect(evaluation.scenarioTitle).toBe("Cedar Ridge Storm Response");
  });

  it("scores a partial path below 100", () => {
    const suboptimal = [
      { stepId: "source-shift", choiceId: "dose-blind" },
      { stepId: "filter-breakthrough", choiceId: "backwash-all" },
      { stepId: "disinfection-risk", choiceId: "maximum-dose" },
      { stepId: "confirmation", choiceId: "log-later" },
      // log-later branch leads to stabilize-record-gap
      { stepId: "stabilize-record-gap", choiceId: "estimate-times" },
    ];
    const evaluation = evaluateCanonicalDecisions("cedar-ridge-storm", suboptimal);
    expect(evaluation.commandScore).toBeLessThan(100);
    expect(evaluation.commandScore).toBeGreaterThan(0);
  });

  it("throws when the decision count does not match the scenario step count", () => {
    expect(() =>
      evaluateCanonicalDecisions("cedar-ridge-storm", [
        { stepId: "source-shift", choiceId: "verify-optimize" },
      ]),
    ).toThrow();
  });

  it("throws NOT_FOUND for an unknown scenario id", () => {
    expect(() =>
      evaluateCanonicalDecisions("nonexistent-scenario", []),
    ).toThrow();
  });
});

describe("Echelon Command — fallbackDebrief", () => {
  it("produces a complete deterministic debrief from an evaluation", () => {
    const evaluation = evaluateCanonicalDecisions("cedar-ridge-storm", optimalDecisions);
    const result = fallbackDebrief(evaluation);

    expect(result.generatedBy).toBe("rules-engine");
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.strengths.length).toBeGreaterThanOrEqual(2);
    expect(result.improvements.length).toBeGreaterThanOrEqual(2);
    expect(typeof result.nextDrill).toBe("string");
    expect(result.commandScore).toBe(evaluation.commandScore);
    expect(result.optimalCalls).toBe(evaluation.optimalCalls);
    expect(result.totalSteps).toBe(evaluation.totalSteps);
    expect(result.verification.verified).toBe(true);
  });

  it("labels a 100-score operator as incident-command ready", () => {
    const evaluation = evaluateCanonicalDecisions("cedar-ridge-storm", optimalDecisions);
    const result = fallbackDebrief(evaluation);
    expect(result.summary).toContain("incident-command ready");
  });
});
