import { describe, expect, it, vi } from "vitest";
import { createHistoryEntry, summarizeHistory } from "./useQuizSession";
import { retainQuick10Answer, type PendingQuick10Answer } from "../pages/Quick10";
vi.mock("wouter", () => ({ useSearch: () => "", useLocation: () => ["", vi.fn()], Link: () => null }));
const question = { id: 7, module: "Safety", question: "Prompt", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Explanation", difficulty: "easy", isCalc: false };
const original: PendingQuick10Answer = { courseKey: "class1-water", questionId: 7, selectedIndex: 2, sessionId: "round-original", operationId: "operation-original", attemptToken: "receipt-original", accessToken: "synthetic-original" };
describe("practice activity answer truth", () => {
  it("keeps unanswered timeout as null while preserving the local incorrect denominator", () => {
    const entry = createHistoryEntry(question, null, 50);
    expect(entry.selectedOption).toBeNull();
    expect(entry.correct).toBe(false);
    expect(summarizeHistory([entry, createHistoryEntry(question, 0, null)])).toEqual({ correctCount: 1, wrongCount: 1 });
  });
  it("preserves a real timed choice, rather than replacing it with a wrong answer", () => {
    expect(createHistoryEntry(question, 0, null)).toMatchObject({ selectedOption: 0, correct: true });
  });
  it("locks every original Quick 10 field across an ambiguous network retry", () => {
    const pending = retainQuick10Answer(null, original);
    const retry = retainQuick10Answer(pending, { ...original, selectedIndex: 1, operationId: "changed", attemptToken: "changed-receipt", accessToken: "changed-token", sessionId: "changed-round" });
    expect(retry).toBe(pending);
    expect(retry).toEqual(original);
    expect(Object.isFrozen(retry)).toBe(true);
  });
  it("copies the original input before sending so caller mutation cannot replace a pending choice", () => {
    const input = { ...original };
    const pending = retainQuick10Answer(null, input);
    input.selectedIndex = 3;
    expect(pending.selectedIndex).toBe(2);
  });
});
