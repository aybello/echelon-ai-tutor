import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const activationSource = readFileSync(resolve(__dirname, "routers/activationRouter.ts"), "utf8");
const funnelSource = readFileSync(resolve(__dirname, "routers/funnelAnalyticsRouter.ts"), "utf8");
const activationPageSource = readFileSync(resolve(__dirname, "../client/src/pages/LearnerActivation.tsx"), "utf8");

describe("activation journey security invariants", () => {
  it("checks entitlement before every activation operation", () => {
    expect(activationSource.match(/resolveCourseForRequest\(ctx/g)?.length).toBeGreaterThanOrEqual(4);
    expect(activationSource).toContain("await assertAccess(ctx, course.courseKey)");
  });

  it("does not send diagnostic answer keys in the question payload", () => {
    const questionPayload = activationSource.slice(
      activationSource.indexOf("diagnosticQuestions:"),
      activationSource.indexOf("submitDiagnostic:"),
    );
    expect(questionPayload).not.toContain("correctIndex: questions.correctIndex");
    expect(questionPayload).toContain("options: JSON.parse(row.options)");
  });

  it("scores submissions on the server and rejects cross-identity session reuse", () => {
    expect(activationSource).toContain("answer.selectedIndex === row.correctIndex");
    expect(activationSource).toContain('message: "Diagnostic session already used."');
  });

  it("allowlists anonymous funnel events without accepting email or metadata", () => {
    const publicInputSchema = funnelSource.slice(
      funnelSource.indexOf(".input("),
      funnelSource.indexOf(".mutation("),
    );
    expect(publicInputSchema).toContain('z.discriminatedUnion("event"');
    expect(publicInputSchema).not.toContain("email:");
    expect(publicInputSchema).not.toContain("metadata:");
  });

  it("renders an entitlement recovery state before retaining the activation loading screen", () => {
    const errorState = activationPageSource.indexOf("if (status.error)");
    const loadingFallback = activationPageSource.indexOf('if (step === "loading")');
    expect(errorState).toBeGreaterThan(-1);
    expect(loadingFallback).toBeGreaterThan(errorState);
    expect(activationPageSource).toContain("We could not open this study plan");
  });
});
