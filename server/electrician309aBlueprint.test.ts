import { describe, expect, it } from "vitest";
import {
  ELECTRICIAN_309A,
  ELECTRICIAN_309A_MODULES,
  ELECTRICIAN_309A_MODULE_WEIGHTS,
} from "../shared/electrician309aBlueprint";
import {
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM_KEY,
} from "../shared/certificationPrograms";

describe("Ontario 309A Construction Electrician blueprint", () => {
  it("matches the current Red Seal 100-question exam structure", () => {
    expect(ELECTRICIAN_309A.examQuestions).toBe(100);
    expect(ELECTRICIAN_309A.examDurationMinutes).toBe(240);
    expect(ELECTRICIAN_309A.passMarkPercent).toBe(70);
  });

  it("allocates exactly 100 questions across the five Major Work Activities", () => {
    const total = ELECTRICIAN_309A_MODULES.reduce(
      (sum, module) => sum + module.examQuestions,
      0,
    );
    expect(total).toBe(100);
  });

  it("preserves the official Red Seal Major Work Activity weights", () => {
    expect(ELECTRICIAN_309A_MODULE_WEIGHTS).toEqual({
      A: 11,
      B: 28,
      C: 30,
      D: 21,
      E: 10,
    });
  });

  it("has complete task weighting within every Major Work Activity", () => {
    for (const module of ELECTRICIAN_309A_MODULES) {
      const taskTotal = module.tasks.reduce(
        (sum, task) => sum + task.parentWeightPercent,
        0,
      );
      expect(taskTotal, `${module.code} task weights`).toBe(100);
    }
  });

  it("explicitly records that the current exam still uses the previous RSOS", () => {
    expect(ELECTRICIAN_309A.standardStatus).toBe("current-exam-previous-rsos");
    expect(ELECTRICIAN_309A.programKey).toBe(ELECTRICIAN_309A_PROGRAM_KEY);
    expect(ELECTRICIAN_309A.blueprintVersion).toBe(
      ELECTRICIAN_309A_BLUEPRINT_VERSION,
    );
  });
});
