import { describe, expect, it } from "vitest";
import { summarizeFlexProgress, flexRowIsStudying, countPurchasedFlexLicences } from "./flexProgressMetrics";
const now = new Date("2026-10-03T12:00:00Z");
const row = { status: "active", operatorKey: "user:42", operatorEmail: "learner@example.test", totalAttempts: 0, correctAttempts: 0, readinessScore: 0, daysActive30: 0, accessEndsAt: "2027-01-03T12:00:00Z" };
describe("Flex licence and learner cohorts", () => {
  it("counts two activated licences as one assigned learner and zero studying without answers", () => {
    expect(summarizeFlexProgress([row, row], now)).toMatchObject({ activatedLicences: 2, assignedLearners: 1, studyingLearners: 0, totalAttempts: 0 });
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
