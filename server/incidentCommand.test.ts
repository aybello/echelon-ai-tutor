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

const optimalAdaptiveRuns = [
  {
    scenarioId: "millbrook-chemical-dosing",
    finalTitle: "Close-out with redundancy restored",
    decisions: [
      { stepId: "pump-alarm", choiceId: "standby-switch" },
      { stepId: "dose-verification", choiceId: "adjust-dose" },
      { stepId: "filter-loading", choiceId: "planned-backwash" },
      { stepId: "root-cause", choiceId: "schedule-repair" },
      { stepId: "close-event-controlled", choiceId: "verify-close" },
    ],
  },
  {
    scenarioId: "riverside-main-break",
    finalTitle: "Verified service restoration",
    decisions: [
      { stepId: "pressure-drop", choiceId: "isolate-zone" },
      { stepId: "customer-impact", choiceId: "notify-hospital" },
      { stepId: "repair-decision", choiceId: "temporary-bypass" },
      { stepId: "contamination-risk", choiceId: "full-protocol" },
      { stepId: "service-restoration-verified", choiceId: "full-closeout" },
    ],
  },
  {
    scenarioId: "lakeview-boil-water",
    finalTitle: "Verified advisory-lift decision",
    decisions: [
      { stepId: "residual-loss", choiceId: "notify-moh" },
      { stepId: "cause-investigation", choiceId: "systematic-check" },
      { stepId: "public-communication", choiceId: "direct-notify" },
      { stepId: "residual-recovery", choiceId: "systematic-flush" },
      { stepId: "advisory-lift-verified", choiceId: "wait-second-round" },
    ],
  },
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

  it.each(optimalAdaptiveRuns)("validates the authored GPT branch for $scenarioId", ({ scenarioId, decisions, finalTitle }) => {
    const result = evaluateCanonicalDecisions(scenarioId, decisions);

    expect(result.commandScore).toBe(100);
    expect(result.optimalCalls).toBe(5);
    expect(result.decisions[4].stepTitle).toBe(finalTitle);
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
