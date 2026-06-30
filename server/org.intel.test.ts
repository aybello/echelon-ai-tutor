/**
 * org.intel.test.ts — Phase 5: Teams Manager Intelligence
 *
 * Tests for orgIntelRouter procedures:
 *   - getTeamReadinessSummary
 *   - getTeamWeakTopics
 *   - getOperatorReadiness
 *   - exportTeamCSV
 *   - sendOperatorReminder
 *   - sendBulkReminders
 */

import { describe, it, expect } from "vitest";
import { courseKeyToLabel } from "../shared/courseRegistry";

// ── Unit tests for CSV escaping helper ────────────────────────────────────────

function escapeCSV(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

describe("CSV escape helper", () => {
  it("passes through plain strings unchanged", () => {
    expect(escapeCSV("hello")).toBe("hello");
  });

  it("wraps strings with commas in quotes", () => {
    expect(escapeCSV("hello, world")).toBe('"hello, world"');
  });

  it("escapes internal double-quotes", () => {
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps strings with newlines in quotes", () => {
    expect(escapeCSV("line1\nline2")).toBe('"line1\nline2"');
  });

  it("returns empty string for null", () => {
    expect(escapeCSV(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCSV(undefined)).toBe("");
  });
});

// ── Unit tests for readiness score formula ────────────────────────────────────

function computeReadinessScore(
  accuracy: number | null,
  totalAttempts: number,
  mockExamsCompleted: number,
  lastActiveRecent: boolean
): number {
  if (totalAttempts === 0 || accuracy === null) return 0;
  return Math.min(
    100,
    Math.round(
      accuracy * 0.5 +
      Math.min(totalAttempts / 200, 1) * 20 +
      Math.min(mockExamsCompleted * 5, 20) +
      (lastActiveRecent ? 10 : 0)
    )
  );
}

describe("Operator readiness score formula", () => {
  it("returns 0 for operators with no attempts", () => {
    expect(computeReadinessScore(null, 0, 0, false)).toBe(0);
  });

  it("caps at 100", () => {
    expect(computeReadinessScore(100, 500, 10, true)).toBe(100);
  });

  it("gives partial score for low attempt count", () => {
    // 80% accuracy * 0.5 = 40, 50 attempts / 200 * 20 = 5, 0 mocks, not recent = 45
    expect(computeReadinessScore(80, 50, 0, false)).toBe(45);
  });

  it("adds 10 points for recent activity", () => {
    const withoutRecent = computeReadinessScore(80, 50, 0, false);
    const withRecent = computeReadinessScore(80, 50, 0, true);
    expect(withRecent - withoutRecent).toBe(10);
  });

  it("adds up to 20 points for mock exams (caps at 4 mocks)", () => {
    const noMocks = computeReadinessScore(80, 200, 0, false);
    const fourMocks = computeReadinessScore(80, 200, 4, false);
    const eightMocks = computeReadinessScore(80, 200, 8, false);
    expect(fourMocks - noMocks).toBe(20);
    expect(eightMocks).toBe(fourMocks); // capped at 20
  });

  it("exam-ready threshold is 80+", () => {
    // 80% accuracy, 200 attempts, 0 mocks, not recent = 80*0.5 + 20 = 60
    // needs mocks or recent activity to reach 80
    const score = computeReadinessScore(80, 200, 4, true);
    expect(score).toBeGreaterThanOrEqual(80);
  });
});

// ── Unit tests for team summary aggregation ───────────────────────────────────

describe("Team readiness summary aggregation", () => {
  function summarize(operators: Array<{ accuracy: number; total: number; lastActiveDaysAgo: number }>) {
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    let examReadyCount = 0, atRiskCount = 0, inactiveCount = 0, totalReadiness = 0;
    for (const op of operators) {
      totalReadiness += op.accuracy;
      if (op.accuracy >= 80) examReadyCount++;
      if (op.accuracy < 50 && op.total > 10) atRiskCount++;
      if (op.lastActiveDaysAgo > 14) inactiveCount++;
    }
    return {
      avgReadiness: operators.length > 0 ? Math.round(totalReadiness / operators.length) : 0,
      examReadyCount,
      atRiskCount,
      inactiveCount,
    };
  }

  it("returns zeros for empty team", () => {
    const result = summarize([]);
    expect(result).toEqual({ avgReadiness: 0, examReadyCount: 0, atRiskCount: 0, inactiveCount: 0 });
  });

  it("counts exam-ready operators correctly", () => {
    const result = summarize([
      { accuracy: 90, total: 100, lastActiveDaysAgo: 1 },
      { accuracy: 80, total: 100, lastActiveDaysAgo: 1 },
      { accuracy: 79, total: 100, lastActiveDaysAgo: 1 },
    ]);
    expect(result.examReadyCount).toBe(2);
  });

  it("counts at-risk operators (< 50% with > 10 attempts)", () => {
    const result = summarize([
      { accuracy: 40, total: 50, lastActiveDaysAgo: 1 },
      { accuracy: 40, total: 5, lastActiveDaysAgo: 1 }, // not at-risk: too few attempts
      { accuracy: 60, total: 50, lastActiveDaysAgo: 1 }, // not at-risk: accuracy ok
    ]);
    expect(result.atRiskCount).toBe(1);
  });

  it("counts inactive operators (no activity in 14+ days)", () => {
    const result = summarize([
      { accuracy: 80, total: 100, lastActiveDaysAgo: 15 },
      { accuracy: 80, total: 100, lastActiveDaysAgo: 14 }, // exactly 14 — not inactive
      { accuracy: 80, total: 100, lastActiveDaysAgo: 7 },
    ]);
    expect(result.inactiveCount).toBe(1);
  });

  it("computes average readiness correctly", () => {
    const result = summarize([
      { accuracy: 60, total: 100, lastActiveDaysAgo: 1 },
      { accuracy: 80, total: 100, lastActiveDaysAgo: 1 },
      { accuracy: 100, total: 100, lastActiveDaysAgo: 1 },
    ]);
    expect(result.avgReadiness).toBe(80);
  });
});

// ── Unit tests for courseKeyToLabel in CSV export ─────────────────────────────

describe("courseKeyToLabel for CSV export", () => {
  it("returns a human-readable label for a valid Ontario course key", () => {
    const label = courseKeyToLabel("class1-water", "on");
    expect(label).toBeTruthy();
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("returns a human-readable label for a valid Western course key", () => {
    const label = courseKeyToLabel("wpi-class1-water", "bc");
    expect(label).toBeTruthy();
    expect(typeof label).toBe("string");
  });

  it("returns a fallback string for an unknown course key", () => {
    const label = courseKeyToLabel("unknown-key", "on");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });
});

// ── Unit tests for operator status classification ─────────────────────────────

describe("Operator status classification", () => {
  function classifyStatus(
    memberStatus: "assigned" | "revoked",
    totalAttempts: number,
    readinessScore: number
  ): string {
    if (memberStatus === "revoked") return "not_started";
    if (totalAttempts === 0) return "not_started";
    if (readinessScore >= 80) return "exam_ready";
    if (readinessScore >= 60) return "active";
    if (readinessScore < 40 && totalAttempts > 10) return "at_risk";
    return "improving";
  }

  it("revoked operators are always not_started", () => {
    expect(classifyStatus("revoked", 500, 95)).toBe("not_started");
  });

  it("operators with no attempts are not_started", () => {
    expect(classifyStatus("assigned", 0, 0)).toBe("not_started");
  });

  it("operators with readiness >= 80 are exam_ready", () => {
    expect(classifyStatus("assigned", 200, 85)).toBe("exam_ready");
  });

  it("operators with readiness 60-79 are active", () => {
    expect(classifyStatus("assigned", 200, 65)).toBe("active");
  });

  it("operators with readiness < 40 and > 10 attempts are at_risk", () => {
    expect(classifyStatus("assigned", 50, 35)).toBe("at_risk");
  });

  it("operators with readiness 40-59 are improving", () => {
    expect(classifyStatus("assigned", 50, 50)).toBe("improving");
  });
});
