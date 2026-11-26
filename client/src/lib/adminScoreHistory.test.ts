import { describe, expect, it } from "vitest";
import { formatScoreSavedAt, scoreHistoryCsvRow, scoreLearnerIdentity } from "./adminScoreHistory";

describe("admin score history presentation", () => {
  it("shows known names and emails without fabricating a name from an address", () => {
    expect(scoreLearnerIdentity({ learnerName: " Example Learner ", learnerEmail: " learner@example.test " })).toEqual({ name: "Example Learner", email: "learner@example.test" });
    expect(scoreLearnerIdentity({ learnerName: null, learnerEmail: "learner@example.test" }).name).toBe("Email-only learner");
    expect(scoreLearnerIdentity({ learnerName: " ", learnerEmail: null })).toEqual({ name: "Unidentified learner", email: "No email recorded" });
  });
  it("formats the saved timestamp in an explicit timezone, including seconds and timezone label", () => {
    const saved = formatScoreSavedAt("2026-10-06T07:00:09Z", "America/Toronto");
    expect(saved.date).toContain("Oct");
    expect(saved.date).toContain("2026");
    expect(saved.time).toMatch(/0?3:00:09/);
    expect(saved.time).toContain("EDT");
    expect(saved.iso).toBe("2026-10-06T07:00:09.000Z");
  });
  it("handles DST and missing timestamps without displaying an invented time", () => {
    expect(formatScoreSavedAt("2026-12-06T07:00:09Z", "America/Toronto").time).toContain("EST");
    expect(formatScoreSavedAt("not-a-date")).toEqual({ date: "Date unavailable", time: "", iso: undefined });
  });
  it("exports the same recorded identity and unambiguous UTC saved time, retaining zero duration", () => {
    const row = scoreHistoryCsvRow({ learnerName: null, learnerEmail: "learner@example.test", sessionId: "fixture-session", examType: "oit", stream: "water", score: 7, total: 10, passed: "yes", timeTakenSeconds: 0, createdAt: "2026-10-06T07:00:09Z" });
    expect(row).toMatchObject({ learner_name: "", learner_email: "learner@example.test", percent: 70, time_taken_seconds: 0, saved_at_utc: "2026-10-06T07:00:09.000Z" });
    expect(row).not.toHaveProperty("learner_phone");
  });
});
