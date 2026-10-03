import { describe, expect, it } from "vitest";
import { summarizeFlexProgress } from "./flexProgressMetrics";
const now = new Date("2026-10-03T12:00:00Z");
const row = { status: "active", operatorKey: "user:42", operatorEmail: "learner@example.test", totalAttempts: 0, correctAttempts: 0, readinessScore: 0, daysActive30: 0, accessEndsAt: "2027-01-03T12:00:00Z" };
describe("Flex licence and learner cohorts", () => {
  it("counts two activated licences as one assigned learner and zero studying without answers", () => {
    expect(summarizeFlexProgress([row, row], now)).toMatchObject({ activatedLicences: 2, assignedLearners: 1, studyingLearners: 0, totalAttempts: 0 });
  });
  it("counts people once across OAuth and email and only recent current-licence activity", () => {
    expect(summarizeFlexProgress([row, { ...row, operatorKey: "email:learner@example.test", totalAttempts: 10, correctAttempts: 8, daysActive30: 1 }, { ...row, operatorEmail: "old@example.test", accessEndsAt: "2026-09-01", daysActive30: 1 }], now)).toMatchObject({ activatedLicences: 2, assignedLearners: 2, studyingLearners: 1, avgAccuracy: 80 });
  });
});
