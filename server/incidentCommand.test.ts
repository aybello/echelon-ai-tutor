import { describe, expect, it } from "vitest";
import {
  fallbackDebrief,
  parseSections,
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
  it("produces a complete deterministic evaluation when GPT-5.6 is unavailable", () => {
    const result = fallbackDebrief(72, decisions, "Cedar Ridge Storm Response");

    expect(result.generatedBy).toBe("rules-engine");
    expect(result.summary).toContain("developing operator");
    expect(result.summary).toContain("Cedar Ridge Storm Response");
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

    const result = parseSections(modelResponse, 72, decisions, "Cedar Ridge Storm Response");

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
    const result = parseSections("SUMMARY: Concise operator assessment.", 72, decisions, "Cedar Ridge Storm Response");

    expect(result.summary).toBe("Concise operator assessment.");
    expect(result.strengths).toHaveLength(2);
    expect(result.improvements).toHaveLength(2);
    expect(result.nextDrill).toContain("filter breakthrough");
  });
});
