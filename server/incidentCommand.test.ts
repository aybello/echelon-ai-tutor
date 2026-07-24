import { describe, expect, it } from "vitest";
import {
  fallbackDebrief,
  evaluateCanonicalDecisions,
} from "./routers/incidentCommandRouter";
import { ALL_SCENARIOS, getScenarioStepAtIndex } from "../shared/commandScenarios";

// ─── Parameterized tests across ALL scenarios ─────────────────────────────────

describe("Echelon Command — evaluateCanonicalDecisions (all scenarios)", () => {
  for (const scenario of ALL_SCENARIOS) {
    describe(`Scenario: ${scenario.title} (${scenario.id})`, () => {
      it("evaluates the optimal path and returns 100", () => {
        // Build optimal decision array by walking the scenario's branching tree
        const decisions: { stepId: string; choiceId: string }[] = [];
        const previousChoiceIds: string[] = [];

        for (let i = 0; i < scenario.steps.length; i++) {
          const step = getScenarioStepAtIndex(scenario, i, previousChoiceIds);
          if (!step) break;

          // Find the highest-scoring choice (optimal)
          const optimalChoice = step.choices.reduce((best, c) =>
            c.points > best.points ? c : best, step.choices[0]);

          decisions.push({ stepId: step.id, choiceId: optimalChoice.id });
          previousChoiceIds.push(optimalChoice.id);
        }

        const evaluation = evaluateCanonicalDecisions(scenario.id, decisions);
        expect(evaluation.commandScore).toBe(100);
        expect(evaluation.optimalCalls).toBe(decisions.length);
        expect(evaluation.totalSteps).toBe(decisions.length);
        expect(evaluation.scenarioTitle).toBe(scenario.title);
      });

      it("scores a suboptimal path below 100", () => {
        // Build suboptimal decision array by picking the lowest-scoring choice
        const decisions: { stepId: string; choiceId: string }[] = [];
        const previousChoiceIds: string[] = [];

        for (let i = 0; i < scenario.steps.length; i++) {
          const step = getScenarioStepAtIndex(scenario, i, previousChoiceIds);
          if (!step) break;

          // Find the lowest-scoring choice
          const worstChoice = step.choices.reduce((worst, c) =>
            c.points < worst.points ? c : worst, step.choices[0]);

          decisions.push({ stepId: step.id, choiceId: worstChoice.id });
          previousChoiceIds.push(worstChoice.id);
        }

        const evaluation = evaluateCanonicalDecisions(scenario.id, decisions);
        expect(evaluation.commandScore).toBeLessThan(100);
        expect(evaluation.commandScore).toBeGreaterThanOrEqual(0);
      });

      it("throws when the decision count does not match the scenario step count", () => {
        expect(() =>
          evaluateCanonicalDecisions(scenario.id, [
            { stepId: scenario.steps[0].id, choiceId: scenario.steps[0].choices[0].id },
          ]),
        ).toThrow();
      });
    });
  }

  it("throws NOT_FOUND for an unknown scenario id", () => {
    expect(() =>
      evaluateCanonicalDecisions("nonexistent-scenario", []),
    ).toThrow();
  });
});

// ─── Judgment branch mapping validation ───────────────────────────────────────

describe("Echelon Command — judgment ruleBranches config integrity", () => {
  for (const scenario of ALL_SCENARIOS) {
    const judgmentStep = scenario.steps.find(s => s.judgment);
    if (!judgmentStep) continue;

    describe(`${scenario.title} — judgment step "${judgmentStep.id}"`, () => {
      it("ruleBranches.strong matches an existing choice ID", () => {
        const { strong } = judgmentStep.judgment!.ruleBranches;
        const match = judgmentStep.choices.find(c => c.id === strong);
        expect(match).toBeDefined();
      });

      it("ruleBranches.partial matches an existing choice ID", () => {
        const { partial } = judgmentStep.judgment!.ruleBranches;
        const match = judgmentStep.choices.find(c => c.id === partial);
        expect(match).toBeDefined();
      });

      it("ruleBranches.unsafe matches an existing choice ID", () => {
        const { unsafe } = judgmentStep.judgment!.ruleBranches;
        const match = judgmentStep.choices.find(c => c.id === unsafe);
        expect(match).toBeDefined();
      });

      it("all three ruleBranches are distinct", () => {
        const { strong, partial, unsafe } = judgmentStep.judgment!.ruleBranches;
        expect(new Set([strong, partial, unsafe]).size).toBe(3);
      });

      it("strong branch has the highest points", () => {
        const { strong, partial, unsafe } = judgmentStep.judgment!.ruleBranches;
        const strongChoice = judgmentStep.choices.find(c => c.id === strong)!;
        const partialChoice = judgmentStep.choices.find(c => c.id === partial)!;
        const unsafeChoice = judgmentStep.choices.find(c => c.id === unsafe)!;
        expect(strongChoice.points).toBeGreaterThanOrEqual(partialChoice.points);
        expect(partialChoice.points).toBeGreaterThanOrEqual(unsafeChoice.points);
      });
    });
  }
});

// ─── Fallback debrief ─────────────────────────────────────────────────────────

describe("Echelon Command — fallbackDebrief (all scenarios)", () => {
  for (const scenario of ALL_SCENARIOS) {
    it(`produces a complete deterministic debrief for ${scenario.title}`, () => {
      // Build optimal path
      const decisions: { stepId: string; choiceId: string }[] = [];
      const previousChoiceIds: string[] = [];

      for (let i = 0; i < scenario.steps.length; i++) {
        const step = getScenarioStepAtIndex(scenario, i, previousChoiceIds);
        if (!step) break;
        const optimalChoice = step.choices.reduce((best, c) =>
          c.points > best.points ? c : best, step.choices[0]);
        decisions.push({ stepId: step.id, choiceId: optimalChoice.id });
        previousChoiceIds.push(optimalChoice.id);
      }

      const evaluation = evaluateCanonicalDecisions(scenario.id, decisions);
      const result = fallbackDebrief(evaluation);

      expect(result.generatedBy).toBe("rules-engine");
      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.strengths.length).toBeGreaterThanOrEqual(2);
      expect(result.improvements.length).toBeGreaterThanOrEqual(2);
      expect(typeof result.nextDrill).toBe("string");
      expect(result.commandScore).toBe(100);
      expect(result.verification.verified).toBe(true);
    });
  }
});
