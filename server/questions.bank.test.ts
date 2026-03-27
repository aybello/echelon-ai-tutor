/**
 * OIT Question Bank integrity tests
 * Verifies the 475-question bank has correct structure and valid data
 */
import { describe, it, expect } from "vitest";
import { QUESTIONS, OIT_MODULES, getNextQuestion, getPatternInsights } from "../client/src/lib/questions";

describe("OIT Question Bank", () => {
  it("loads a substantial number of questions (at least 400)", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(400);
  });

  it("all questions have required fields", () => {
    for (const q of QUESTIONS) {
      expect(q.id, `Q${q.id} missing id`).toBeDefined();
      expect(q.module, `Q${q.id} missing module`).toBeTruthy();
      expect(q.q, `Q${q.id} missing question text`).toBeTruthy();
      expect(q.options, `Q${q.id} missing options`).toBeDefined();
      expect(q.options.length, `Q${q.id} must have 4 options`).toBe(4);
      expect(q.correct, `Q${q.id} missing correct`).toBeGreaterThanOrEqual(0);
      expect(q.correct, `Q${q.id} correct out of range`).toBeLessThanOrEqual(3);
      expect(q.explanation, `Q${q.id} missing explanation`).toBeTruthy();
      expect(q.tip, `Q${q.id} missing tip`).toBeTruthy();
    }
  });

  it("all questions have valid type values", () => {
    const validTypes = new Set(["calculation", "conceptual", "recall"]);
    for (const q of QUESTIONS) {
      expect(validTypes.has(q.type), `Q${q.id} has invalid type: ${q.type}`).toBe(true);
    }
  });

  it("all questions have valid difficulty values", () => {
    const validDiffs = new Set(["easy", "medium", "hard"]);
    for (const q of QUESTIONS) {
      expect(validDiffs.has(q.difficulty), `Q${q.id} has invalid difficulty: ${q.difficulty}`).toBe(true);
    }
  });

  it("all modules in OIT_MODULES have at least 20 questions", () => {
    const moduleCounts: Record<string, number> = {};
    for (const q of QUESTIONS) {
      moduleCounts[q.module] = (moduleCounts[q.module] ?? 0) + 1;
    }
    for (const mod of OIT_MODULES) {
      const count = moduleCounts[mod] ?? 0;
      expect(count, `Module "${mod}" has only ${count} questions`).toBeGreaterThanOrEqual(20);
    }
  });

  it("question IDs are unique", () => {
    const ids = QUESTIONS.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(QUESTIONS.length);
  });

  it("adaptive engine returns a question from the pool", () => {
    const next = getNextQuestion([], QUESTIONS);
    expect(next).not.toBeNull();
    expect(next?.id).toBeDefined();
  });

  it("adaptive engine returns null when all questions answered", () => {
    const fakeHistory = QUESTIONS.map(q => ({
      questionId: q.id,
      module: q.module,
      difficulty: q.difficulty,
      correct: true,
      confidence: 3,
      selectedOption: q.correct,
      wrongExplanation: null,
    }));
    const next = getNextQuestion(fakeHistory, QUESTIONS);
    expect(next).toBeNull();
  });

  it("pattern insights returns null for short history", () => {
    const shortHistory = QUESTIONS.slice(0, 2).map(q => ({
      questionId: q.id,
      module: q.module,
      difficulty: q.difficulty,
      correct: false,
      confidence: 3,
      selectedOption: 0,
      wrongExplanation: null,
    }));
    const patterns = getPatternInsights(shortHistory);
    expect(patterns).toBeNull();
  });
});
