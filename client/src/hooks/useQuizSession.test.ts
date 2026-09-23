import { describe, expect, it, vi } from "vitest";
import type { DBQuestion } from "./useQuestionBank";
import {
  canUsePracticeFilters,
  createHistoryEntry,
  getAdaptiveNext,
  isPracticeAccessCheckSettled,
  shouldClearLockedPreviewFilters,
  summarizeHistory,
  type HistoryEntry,
} from "./useQuizSession";

vi.mock("wouter", () => ({ useSearch: () => "" }));

const question = (
  id: number,
  module: string,
  correctIndex = 2,
): DBQuestion => ({
  id,
  module,
  difficulty: "medium",
  question: `Question ${id}`,
  options: ["A", "B", "C", "D"],
  correctIndex,
  explanation: "Explanation",
  isCalc: false,
});

describe("quiz session answer history", () => {
  it("stores correctness for a confirmed answer", () => {
    expect(createHistoryEntry(question(1, "Disinfection"), 2, 75)).toMatchObject({
      questionId: 1,
      correct: true,
      selectedOption: 2,
      confidence: 75,
    });
    expect(createHistoryEntry(question(2, "Disinfection"), 1, 25).correct).toBe(false);
  });

  it("reports accurate session totals instead of treating every answer as wrong", () => {
    const history = [
      createHistoryEntry(question(1, "Safety"), 2, 80),
      createHistoryEntry(question(2, "Safety"), 0, 60),
      createHistoryEntry(question(3, "Pumps", 1), 1, 70),
    ];
    expect(summarizeHistory(history)).toEqual({ correctCount: 2, wrongCount: 1 });
  });

  it("biases the next question toward a genuinely weak module", () => {
    const history: HistoryEntry[] = [
      createHistoryEntry(question(1, "Pumps"), 0, 50),
      createHistoryEntry(question(2, "Pumps"), 0, 50),
      createHistoryEntry(question(3, "Safety"), 2, 50),
    ];
    const next = getAdaptiveNext(
      history,
      [question(10, "Pumps"), question(11, "Safety")],
      true,
    );
    expect(next?.module).toBe("Pumps");
  });
});

describe("locked preview filters", () => {
  it("keeps a fixed preview sample from being exhausted by paid-only filters", () => {
    expect(canUsePracticeFilters(false, false)).toBe(false);
  });

  it("preserves module and calculation filters for an active pass or a free course", () => {
    expect(canUsePracticeFilters(false, true)).toBe(true);
    expect(canUsePracticeFilters(true, false)).toBe(true);
  });

  it("waits for access to settle before clearing a deep-linked paid filter", () => {
    const pendingPaidAccess = {
      accessSettled: false,
      freeCourse: false,
      trialUnlocked: false,
      selectedModule: "Rare module",
      calcOnly: true,
    };
    expect(shouldClearLockedPreviewFilters(pendingPaidAccess)).toBe(false);
    expect(shouldClearLockedPreviewFilters({ ...pendingPaidAccess, accessSettled: true })).toBe(true);
    expect(shouldClearLockedPreviewFilters({ ...pendingPaidAccess, accessSettled: true, trialUnlocked: true })).toBe(false);
  });

  it("does not settle paid filters during either initial loading or an access refetch", () => {
    expect(isPracticeAccessCheckSettled({
      freeCourse: false,
      isFetched: false,
      isFetching: true,
    })).toBe(false);
    expect(isPracticeAccessCheckSettled({
      freeCourse: false,
      isFetched: true,
      isFetching: true,
    })).toBe(false);
  });

  it("settles a denied or failed paid access check only after network work is idle", () => {
    expect(isPracticeAccessCheckSettled({
      freeCourse: false,
      isFetched: true,
      isFetching: false,
    })).toBe(true);
    expect(isPracticeAccessCheckSettled({
      freeCourse: true,
      isFetched: false,
      isFetching: true,
    })).toBe(true);
  });
});
