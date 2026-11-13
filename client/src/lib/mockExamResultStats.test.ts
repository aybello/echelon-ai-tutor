import { describe, expect, it } from "vitest";
import { calculateMockResultStats } from "./mockExamResultStats";

describe("calculateMockResultStats", () => {
  it("excludes ten unscored Class IV practice items from the learner score summary", () => {
    const questions = Array.from({ length: 110 }, (_, index) => ({ id: index + 1 }));
    const answers = Array.from({ length: 110 }, (_, index) => ({
      selected: index < 100 ? 0 : null,
    }));

    expect(calculateMockResultStats({
      questions,
      answers,
      correct: 70,
      authoritativeTotal: 100,
      unscoredQuestionNums: questions.slice(100).map(question => question.id),
    })).toEqual({ total: 100, skipped: 0, incorrect: 30 });
  });

  it("keeps legacy and non-Class-IV mocks based on their delivered scored items", () => {
    expect(calculateMockResultStats({
      questions: [{ id: 1 }, { id: 2 }, { id: 3, scored: false }, { id: 4 }],
      answers: [{ selected: 0 }, { selected: null }, { selected: null }, { selected: 1 }],
      correct: 2,
    })).toEqual({ total: 3, skipped: 1, incorrect: 0 });
  });
});
