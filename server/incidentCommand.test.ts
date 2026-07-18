import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  evaluateCanonicalDecisions,
  fallbackDebrief,
} from "./routers/incidentCommandRouter";

const optimalCedarRun = [
  { stepId: "source-shift", choiceId: "verify-optimize" },
  { stepId: "filter-breakthrough", choiceId: "isolate-filter" },
  { stepId: "disinfection-risk", choiceId: "ct-verify" },
  { stepId: "confirmation", choiceId: "escalate-document" },
  { stepId: "stabilize-controlled", choiceId: "recovery-gate" },
];

describe("Echelon Command canonical incident evaluation", () => {
  it("computes a perfect score only from server-owned scenario data", () => {
    const result = evaluateCanonicalDecisions("cedar-ridge-storm", optimalCedarRun);

    expect(result.commandScore).toBe(100);
    expect(result.optimalCalls).toBe(5);
    expect(result.decisions[0]).toMatchObject({
      stepTitle: "The source water changes",
      points: 20,
    });
  });

  it("requires the final development that matches the previous judgment branch", () => {
    const recordGapRun = [
      ...optimalCedarRun.slice(0, 3),
      { stepId: "confirmation", choiceId: "log-later" },
      { stepId: "stabilize-record-gap", choiceId: "reconstruct-escalate" },
    ];
    const result = evaluateCanonicalDecisions("cedar-ridge-storm", recordGapRun);

    expect(result.commandScore).toBe(86);
    expect(result.decisions[4].stepTitle).toBe("Leadership finds a record gap");
  });

  it("rejects a final step copied from a different branch", () => {
    const impossibleRun = [
      ...optimalCedarRun.slice(0, 3),
      { stepId: "confirmation", choiceId: "delete-alarm" },
      { stepId: "stabilize-controlled", choiceId: "recovery-gate" },
    ];

    expect(() => evaluateCanonicalDecisions("cedar-ridge-storm", impossibleRun)).toThrow(TRPCError);
  });

  it("rejects incomplete incident records", () => {
    expect(() => evaluateCanonicalDecisions("cedar-ridge-storm", optimalCedarRun.slice(0, 4))).toThrow("incomplete");
  });

  it("produces a complete deterministic, record-grounded fallback", () => {
    const evaluation = evaluateCanonicalDecisions("cedar-ridge-storm", optimalCedarRun);
    const result = fallbackDebrief(evaluation);

    expect(result.generatedBy).toBe("rules-engine");
    expect(result.verification.label).toBe("Deterministic record-grounded review");
    expect(result.summary).toContain("incident-command ready");
    expect(result.strengths).toHaveLength(2);
    expect(result.improvements).toHaveLength(2);
  });
});
