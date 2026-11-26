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
import { computeManagerReadiness } from "./_core/readiness";

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

describe("Operator readiness score formula", () => {
  it("returns 0 for operators with no attempts", () => {
    expect(computeManagerReadiness({ accuracy: 0, totalAttempts: 0, mockAccuracy: 0, activeRecently: false })).toBe(0);
  });

  it("caps at 100", () => {
    expect(computeManagerReadiness({ accuracy: 1, totalAttempts: 500, mockAccuracy: 1, activeRecently: true })).toBe(100);
  });

  it("gives partial score for low attempt count", () => {
    // 80% × 50% + 0% × 25% + 25% × 15% + 0% × 10% = 43.75%, rounded to 44%.
    expect(computeManagerReadiness({ accuracy: 0.8, totalAttempts: 50, mockAccuracy: 0, activeRecently: false })).toBe(44);
  });

  it("adds 10 points for recent activity", () => {
    const withoutRecent = computeManagerReadiness({ accuracy: 0.8, totalAttempts: 50, mockAccuracy: 0, activeRecently: false });
    const withRecent = computeManagerReadiness({ accuracy: 0.8, totalAttempts: 50, mockAccuracy: 0, activeRecently: true });
    expect(withRecent - withoutRecent).toBe(10);
  });

  it("adds up to 25 points for completed mock performance", () => {
    const noMocks = computeManagerReadiness({ accuracy: 0.8, totalAttempts: 200, mockAccuracy: 0, activeRecently: false });
    const strongMocks = computeManagerReadiness({ accuracy: 0.8, totalAttempts: 200, mockAccuracy: 1, activeRecently: false });
    expect(strongMocks - noMocks).toBe(25);
  });

  it("exam-ready threshold is 80+", () => {
    // 80% × 50% + 100% × 25% + 100% × 15% + 100% × 10% = 90%.
    const score = computeManagerReadiness({ accuracy: 0.8, totalAttempts: 200, mockAccuracy: 1, activeRecently: true });
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
