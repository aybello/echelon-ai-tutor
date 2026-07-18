import { describe, expect, it } from "vitest";
import {
  evaluateSubmittedDecisions,
  fallbackDebrief,
  parseSections,
  submittedScenarioSchema,
} from "./routers/incidentCommandRouter";

const decisions = [
  {
    stepId: "source-shift",
    stepTitle: "The source water changes",
    choiceLabel: "Verify the reading and optimize coagulation",
    consequence: "The reading is confirmed and the treatment response is controlled.",
    points: 20,
  },
  {
    stepId: "filter-breakthrough",
    stepTitle: "Filter 2 begins to break through",
    choiceLabel: "Backwash every filter immediately",
    consequence: "The plant loses filtration capacity and clearwell storage falls.",
    points: 6,
  },
];

describe("Echelon Command debrief", () => {
  it("derives the score and consequence from the server-owned scenario", () => {
    const submission = submittedScenarioSchema.parse([
      { stepId: "source-shift", choiceId: "verify-optimize" },
      { stepId: "filter-breakthrough", choiceId: "backwash-all" },
      { stepId: "disinfection-risk", choiceId: "ct-verify" },
      { stepId: "confirmation", choiceId: "log-later" },
      { stepId: "stabilize", choiceId: "recovery-gate" },
    ]);

    const evaluated = evaluateSubmittedDecisions(submission);

    expect(evaluated.map(decision => decision.points)).toEqual([20, 6, 20, 6, 20]);
    expect(evaluated[1].consequence).toContain("clearwell storage");
  });

  it("rejects unknown choices and reordered scenario steps", () => {
    const tampered = submittedScenarioSchema.safeParse([
      { stepId: "filter-breakthrough", choiceId: "made-up-action" },
      { stepId: "source-shift", choiceId: "verify-optimize" },
      { stepId: "disinfection-risk", choiceId: "ct-verify" },
      { stepId: "confirmation", choiceId: "escalate-document" },
      { stepId: "stabilize", choiceId: "recovery-gate" },
    ]);

    expect(tampered.success).toBe(false);
  });

  it("produces a complete deterministic evaluation when GPT-5.6 is unavailable", () => {
    const result = fallbackDebrief(72, decisions);

    expect(result.generatedBy).toBe("rules-engine");
    expect(result.summary).toContain("developing operator");
    expect(result.summary).toContain("Filter 2 begins to break through");
    expect(result.strengths).toHaveLength(2);
    expect(result.improvements).toHaveLength(2);
    expect(result.nextDrill).toContain("filter breakthrough");
  });

  it("parses the bounded GPT-5.6 response into the after-action review", () => {
    const modelResponse = `**SUMMARY:** You protected the first barrier but consumed too much reserve at filtration.
**STRENGTHS:**
- Verified the source-water signal.
- Connected process evidence to the control action.
**IMPROVEMENTS:**
- Isolate the affected filter before backwashing.
- State the verification and escalation chain.
**NEXT DRILL:** Low-pressure contamination response`;

    const result = parseSections(modelResponse, 72, decisions);

    expect(result.generatedBy).toBe("gpt-5.6");
    expect(result.summary).toContain("protected the first barrier");
    expect(result.strengths).toEqual([
      "Verified the source-water signal.",
      "Connected process evidence to the control action.",
    ]);
    expect(result.improvements[0]).toContain("Isolate the affected filter");
    expect(result.nextDrill).toBe("Low-pressure contamination response");
  });

  it("falls back section by section when the model omits part of the contract", () => {
    const result = parseSections("SUMMARY: Concise operator assessment.", 72, decisions);

    expect(result.summary).toBe("Concise operator assessment.");
    expect(result.strengths).toHaveLength(2);
    expect(result.improvements).toHaveLength(2);
    expect(result.nextDrill).toContain("filter breakthrough");
  });
});
