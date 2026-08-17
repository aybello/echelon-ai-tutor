import { describe, expect, it } from "vitest";
import electricianQuestions from "./private/electrician309aDraftQuestions";
import { ELECTRICIAN_309A_MODULES } from "../shared/electrician309aBlueprint";
import {
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM_KEY,
} from "../shared/certificationPrograms";

describe("309A electrician draft question bank", () => {
  it("contains the 25-question first-pass diagnostic seed", () => {
    expect(electricianQuestions).toHaveLength(25);
  });

  it("uses unique stable question ids", () => {
    const ids = electricianQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has exactly four options and a valid answer on every item", () => {
    for (const question of electricianQuestions) {
      expect(question.options).toHaveLength(4);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(4);
      expect(question.explanation.trim().length).toBeGreaterThan(20);
    }
  });

  it("maps every item to an official Major Work Activity and task", () => {
    const validModules = new Set(ELECTRICIAN_309A_MODULES.map((module) => module.code));
    for (const question of electricianQuestions) {
      expect(validModules.has(question.module)).toBe(true);
      expect(question.task.startsWith(`${question.module}-`)).toBe(true);
      expect(question.blueprintObjective.length).toBeGreaterThan(0);
    }
  });

  it("keeps all first-pass content in draft review status", () => {
    for (const question of electricianQuestions) {
      expect(question.reviewStatus).toBe("draft");
      expect(question.programKey).toBe(ELECTRICIAN_309A_PROGRAM_KEY);
      expect(question.blueprintVersion).toBe(
        ELECTRICIAN_309A_BLUEPRINT_VERSION,
      );
      expect(question.sourceVerifiedAt).toBe("2026-08-15");
      expect(question.approvedForPractice).toBe(false);
      expect(question.approvedForMock).toBe(false);
      expect(question.retiredAt).toBeNull();
      expect(question.sourceUrl).toContain("red-seal.ca");
      expect(question.sourceReference.length).toBeGreaterThan(0);
    }
  });

  it("covers all five Major Work Activities", () => {
    const covered = new Set(electricianQuestions.map((question) => question.module));
    expect([...covered].sort()).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("keeps the diagnostic broadly aligned to the official weighting", () => {
    const counts = electricianQuestions.reduce<Record<string, number>>((acc, question) => {
      acc[question.module] = (acc[question.module] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts).toEqual({ A: 3, B: 7, C: 7, D: 5, E: 3 });
  });
});
