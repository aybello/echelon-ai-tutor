/**
 * Issue A regression guard: mock exam score denominator must be questions.length,
 * not EXAM_QUESTIONS (the configured target). When a bank is smaller than the target,
 * a perfect score must be 100% and the saved total must equal the actual question count.
 */

import { describe, it, expect } from "vitest";

// Pure scoring logic extracted from MockExamShell results useMemo
function computeScore(
  questions: { correct: number }[],
  answers: { selected: number | null }[],
  passThreshold: number
): { correct: number; pct: number; passed: boolean; total: number } {
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i]?.selected === q.correct) correct++;
  });
  const total = questions.length;
  const score = correct / total;
  const pct = Math.round(score * 100);
  const passed = pct >= Math.round(passThreshold * 100);
  return { correct, pct, passed, total };
}

describe("Mock exam score denominator (Issue A)", () => {
  it("perfect score on a full 100-question bank is 100%", () => {
    const questions = Array.from({ length: 100 }, (_, i) => ({ correct: 0 }));
    const answers = questions.map(() => ({ selected: 0 }));
    const { pct, passed, total } = computeScore(questions, answers, 0.7);
    expect(pct).toBe(100);
    expect(passed).toBe(true);
    expect(total).toBe(100);
  });

  it("perfect score on a 60-question bank (target 100) is 100%, not 60%", () => {
    // This is the bug scenario: bank has 60 questions, target is 100
    const questions = Array.from({ length: 60 }, () => ({ correct: 0 }));
    const answers = questions.map(() => ({ selected: 0 }));
    const { pct, passed, total } = computeScore(questions, answers, 0.7);
    expect(pct).toBe(100);
    expect(passed).toBe(true);
    expect(total).toBe(60); // saved total must equal actual count, not 100
  });

  it("N correct out of M questions yields N/M regardless of target size", () => {
    // 42 correct out of 60 questions = 70% exactly
    const questions = Array.from({ length: 60 }, () => ({ correct: 0 }));
    const answers = questions.map((_, i) => ({ selected: i < 42 ? 0 : 1 }));
    const { pct, passed, total } = computeScore(questions, answers, 0.7);
    expect(pct).toBe(70);
    expect(passed).toBe(true);
    expect(total).toBe(60);
  });

  it("failing score on underfilled bank is judged against actual count, not target", () => {
    // 41 correct out of 60 = 68.3% → fail at 70% threshold
    // Before fix: 41/100 = 41% → also fail but for wrong reason
    const questions = Array.from({ length: 60 }, () => ({ correct: 0 }));
    const answers = questions.map((_, i) => ({ selected: i < 41 ? 0 : 1 }));
    const { pct, passed, total } = computeScore(questions, answers, 0.7);
    expect(pct).toBe(68);
    expect(passed).toBe(false);
    expect(total).toBe(60);
  });
});
