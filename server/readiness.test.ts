/**
 * Tests for the learner and manager study-estimate models.
 * Verifies both formulas return correct scores and levels for key inputs.
 */
import { describe, it, expect } from "vitest";
import { computeReadiness, computeManagerReadiness } from "./_core/readiness";

describe("computeReadiness", () => {
  it("returns score=0 and level='not_started' when totalAttempts=0", () => {
    const result = computeReadiness({
      accuracy: 0,
      totalAttempts: 0,
      mockAccuracy: 0,
      topicsAttempted: 0,
      totalTopics: 20,
      activeDaysLast30: 0,
      activeRecently: false,
    });
    expect(result.score).toBe(0);
    expect(result.level).toBe("not_started");
  });

  it("returns level='exam_ready' for a high-performing operator", () => {
    const result = computeReadiness({
      accuracy: 0.92,
      totalAttempts: 500,
      mockAccuracy: 0.88,
      topicsAttempted: 18,
      totalTopics: 20,
      activeDaysLast30: 22,
      activeRecently: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.level).toBe("exam_ready");
    expect(result.label).toBe("Estimated Ready");
  });

  it("uses transparent estimated tiers and never predicts an official result", () => {
    const base = {
      totalAttempts: 100,
      mockAccuracy: 0,
      topicsAttempted: 10,
      totalTopics: 20,
      activeDaysLast30: 5,
      activeRecently: true,
    };
    const labels = [
      computeReadiness({ ...base, accuracy: 1 }).label,
      computeReadiness({ ...base, accuracy: 0.7 }).label,
      computeReadiness({ ...base, accuracy: 0.2 }).label,
    ];
    expect(labels).not.toContain("Exam Ready");
    expect(labels.join(" ").toLowerCase()).not.toContain("pass");
  });

  it("returns level='beginner' for low accuracy with some attempts", () => {
    const result = computeReadiness({
      accuracy: 0.35,
      totalAttempts: 50,
      mockAccuracy: 0,
      topicsAttempted: 3,
      totalTopics: 20,
      activeDaysLast30: 2,
      activeRecently: false,
    });
    expect(result.score).toBeLessThan(60);
    expect(result.level).toBe("beginner");
  });

  it("caps score at 100 even for perfect inputs", () => {
    const result = computeReadiness({
      accuracy: 1.0,
      totalAttempts: 1000,
      mockAccuracy: 1.0,
      topicsAttempted: 20,
      totalTopics: 20,
      activeDaysLast30: 30,
      activeRecently: true,
    });
    expect(result.score).toBe(100);
  });

  it("does not penalise zero totalTopics (avoids division by zero)", () => {
    expect(() =>
      computeReadiness({
        accuracy: 0.8,
        totalAttempts: 100,
        mockAccuracy: 0.7,
        topicsAttempted: 0,
        totalTopics: 0,
        activeDaysLast30: 10,
        activeRecently: true,
      })
    ).not.toThrow();
  });

  it("recentBonus adds 5 points when activeRecently=true vs false (all else equal)", () => {
    const base = {
      accuracy: 0.7,
      totalAttempts: 200,
      mockAccuracy: 0.65,
      topicsAttempted: 10,
      totalTopics: 20,
      activeDaysLast30: 10,
    };
    const withRecent = computeReadiness({ ...base, activeRecently: true });
    const withoutRecent = computeReadiness({ ...base, activeRecently: false });
    expect(withRecent.score).toBe(withoutRecent.score + 5);
  });
});

describe("computeManagerReadiness", () => {
  it("returns 0 when totalAttempts=0", () => {
    expect(computeManagerReadiness({ accuracy: 0, totalAttempts: 0, mockExamsCompleted: 0, activeRecently: false })).toBe(0);
  });

  it("returns a positive score for an active operator with good accuracy", () => {
    const score = computeManagerReadiness({
      accuracy: 0.80,
      totalAttempts: 150,
      mockExamsCompleted: 3,
      activeRecently: true,
    });
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("caps at 100 for perfect inputs", () => {
    const score = computeManagerReadiness({
      accuracy: 1.0,
      totalAttempts: 500,
      mockExamsCompleted: 10,
      activeRecently: true,
    });
    expect(score).toBe(100);
  });
});
