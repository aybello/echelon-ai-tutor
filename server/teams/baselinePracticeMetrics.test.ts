import { describe, expect, it } from "vitest";
import { calculateBaselinePracticeMetrics, type DiagnosticBaselineRecord, type PracticeAttemptRecord } from "./baselinePracticeMetrics";
const baselineTime = new Date("2026-10-10T12:00:00Z");
const diagnostic = (overrides: Partial<DiagnosticBaselineRecord> = {}): DiagnosticBaselineRecord => ({
  memberId: 1, courseKey: "class1-water", score: 40, completedAt: baselineTime, ...overrides,
});
const attempt = (overrides: Partial<PracticeAttemptRecord> = {}): PracticeAttemptRecord => ({
  memberId: 1, courseKey: "class1-water", bankKey: null, examType: "class1-water", quizMode: "standard", correct: "yes",
  createdAt: new Date("2026-10-11T12:00:00Z"), ...overrides,
});
describe("course-matched chronological baseline practice", () => {
  it("uses the earliest completed baseline rather than the maximum diagnostic", () => {
    const result = calculateBaselinePracticeMetrics([diagnostic({ score: 90, completedAt: new Date("2026-10-12") }), diagnostic()], [attempt()]);
    expect(result.cohorts).toMatchObject([{ diagnosticBaseline: 40, practiceAccuracy: 100, accuracyChange: 60, practiceAttemptCount: 1 }]);
  });
  it("excludes other courses, other learners, unattributed attempts and diagnostics", () => {
    const result = calculateBaselinePracticeMetrics([diagnostic()], [attempt(), attempt({ courseKey: "class1-wastewater" }), attempt({ memberId: 2 }), attempt({ memberId: null }), attempt({ quizMode: "diagnostic" })]);
    expect(result.cohorts[0].practiceAttemptCount).toBe(1);
  });
  it("excludes attempts before and exactly at baseline completion", () => {
    const result = calculateBaselinePracticeMetrics([diagnostic()], [attempt({ createdAt: new Date("2026-10-09") }), attempt({ createdAt: baselineTime })]);
    expect(result).toEqual({ cohorts: [], avgDiagnosticBaseline: null, avgPracticeAccuracy: null, accuracyChange: null });
  });
  it("returns no comparison without both baseline and later same-course practice", () => {
    expect(calculateBaselinePracticeMetrics([], [attempt()]).accuracyChange).toBeNull();
    expect(calculateBaselinePracticeMetrics([diagnostic()], []).accuracyChange).toBeNull();
  });
  it("keeps multiple courses and learners separate with equal cohort weighting", () => {
    const result = calculateBaselinePracticeMetrics([diagnostic(), diagnostic({ memberId: 2, score: 80 })], [attempt(), attempt({ memberId: 2, correct: "no" }), attempt({ memberId: 2 })]);
    expect(result.cohorts).toHaveLength(2);
    expect(result.avgDiagnosticBaseline).toBe(60);
    expect(result.avgPracticeAccuracy).toBe(75);
    expect(result.accuracyChange).toBe(15);
  });
  it("uses the bank for legacy history with no course attribution", () => {
    expect(calculateBaselinePracticeMetrics([diagnostic()], [attempt({ courseKey: null, bankKey: "class1-water" })]).cohorts).toHaveLength(1);
  });
  it("does not guess unknown explicit course history into a known bank", () => {
    expect(calculateBaselinePracticeMetrics([diagnostic()], [attempt({ courseKey: "unknown", bankKey: "class1-water" })]).cohorts).toEqual([]);
  });
  it("ignores unrecognized diagnostics and unattributed baselines", () => {
    expect(calculateBaselinePracticeMetrics([diagnostic({ courseKey: "unknown" }), diagnostic({ memberId: null })], [attempt()]).cohorts).toEqual([]);
  });
});
