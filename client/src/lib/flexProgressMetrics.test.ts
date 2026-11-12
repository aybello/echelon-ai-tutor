import { describe, expect, it } from "vitest";
import { summarizeFlexProgress, flexRowIsStudying, countPurchasedFlexLicences } from "./flexProgressMetrics";
const now = new Date("2026-10-03T12:00:00Z");
const row = { status: "active", operatorKey: "user:42", operatorEmail: "learner@example.test", totalAttempts: 0, correctAttempts: 0, readinessScore: 0, readinessAvailable: false, daysActive30: 0, accessEndsAt: "2027-01-03T12:00:00Z" };
describe("Flex licence and learner cohorts", () => {
  it("counts two activated licences as one assigned learner and zero studying without answers", () => {
    expect(summarizeFlexProgress([row, row], now)).toMatchObject({ activatedLicences: 2, assignedLearners: 1, studyingLearners: 0, totalAttempts: 0, avgAccuracy: null });
    expect(summarizeFlexProgress([], now).avgAccuracy).toBeNull();
  });
  it("preserves a real zero accuracy when answers exist", () => {
    expect(summarizeFlexProgress([{ ...row, totalAttempts: 2 }], now).avgAccuracy).toBe(0);
  });
  it("counts people once across OAuth and email and only recent current-licence activity", () => {
    expect(summarizeFlexProgress([row, { ...row, operatorKey: "email:learner@example.test", totalAttempts: 10, correctAttempts: 8, daysActive30: 1 }, { ...row, operatorEmail: "old@example.test", accessEndsAt: "2026-09-01", daysActive30: 1 }], now)).toMatchObject({ activatedLicences: 2, assignedLearners: 2, studyingLearners: 1, avgAccuracy: 80 });
  });
  it("uses the same evidence for a studying row and the summary count", () => {
    expect(flexRowIsStudying(row, now)).toBe(false);
    const studied = { ...row, totalAttempts: 100, daysActive30: 1 };
    expect(flexRowIsStudying(studied, now)).toBe(true);
    for (const changed of [{...studied, status: 'assigned'}, {...studied, accessEndsAt: '2026-09-01'}, {...studied, accessEndsAt: null}, {...studied, daysActive30: 0}]) expect(flexRowIsStudying(changed, now)).toBe(false);
  });
  it("counts paid but unused licences in the inventory so the badge denominator is honest", () => {
    const licences = [
      { status: "active" }, { status: "active" },
      { status: "unused" }, { status: "unused" }, { status: "unused" }, { status: "unused" }, { status: "unused" }, { status: "unused" },
      { status: "suspended" },
      { status: "cancelled" }, { status: "revoked" },
    ];
    expect(countPurchasedFlexLicences(licences)).toBe(9);
    expect(summarizeFlexProgress([row, row], now).activatedLicences).toBe(2);
  });
});

describe("Flex readiness availability", () => {
  it("returns no average when history exists but no recent snapshot is available", () => {
    expect(summarizeFlexProgress([{ ...row, totalAttempts: 20, readinessScore: 0 }], now).avgReadiness).toBeNull();
    expect(summarizeFlexProgress([row], now).avgReadiness).toBeNull();
  });

  it("preserves a valid zero score", () => {
    expect(summarizeFlexProgress([{ ...row, totalAttempts: 1, readinessAvailable: true, readinessScore: 0 }], now).avgReadiness).toBe(0);
  });

  it("averages only available scores within the existing active licence cohort", () => {
    const available = { ...row, totalAttempts: 10, readinessAvailable: true };
    const rows = [
      { ...available, readinessScore: 0 },
      { ...available, readinessScore: 81 },
      { ...row, totalAttempts: 100, readinessScore: 0 },
      { ...available, readinessScore: 100, status: "expired" },
      { ...available, readinessScore: 100, accessEndsAt: "2026-09-01" },
    ];
    expect(summarizeFlexProgress(rows, now).avgReadiness).toBe(41);
  });
});
