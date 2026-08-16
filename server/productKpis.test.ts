import { describe, expect, it } from "vitest";
import { analyticsIdentity, masteryGain, medianTimeToFirstQuizMinutes, percentage } from "./productKpis";

describe("product KPI calculations", () => {
  it("calculates rates without inventing a denominator", () => {
    expect(percentage(3, 8)).toBe(37.5);
    expect(percentage(2, 0)).toBeNull();
  });

  it("uses pseudonymous identities without exposing an email address", () => {
    expect(analyticsIdentity({ userId: "42", emailHash: "hash" })).toBe("user:42");
    expect(analyticsIdentity({ userId: null, emailHash: "hash" })).toBe("email:hash");
    expect(analyticsIdentity({ userId: null, emailHash: null })).toBeNull();
  });

  it("calculates median time from activation to first quiz", () => {
    const at = (minutes: number) => new Date(Date.UTC(2026, 7, 16, 12, minutes));
    expect(medianTimeToFirstQuizMinutes([
      { eventName: "signup", occurredAt: at(0), userId: "1", emailHash: null },
      { eventName: "quiz_started", occurredAt: at(10), userId: "1", emailHash: null },
      { eventName: "access_activated", occurredAt: at(0), userId: "2", emailHash: null },
      { eventName: "quiz_started", occurredAt: at(30), userId: "2", emailHash: null },
      { eventName: "quiz_started", occurredAt: at(5), userId: null, emailHash: null },
    ])).toBe(20);
  });

  it("measures first-to-latest quiz mastery gain by learner and course", () => {
    const result = masteryGain([
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-01"), userId: "1", emailHash: null, examType: "oit", metadata: JSON.stringify({ questionCount: 10, correctCount: 5 }) },
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-10"), userId: "1", emailHash: null, examType: "oit", metadata: JSON.stringify({ questionCount: 10, correctCount: 8 }) },
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-10"), userId: "2", emailHash: null, examType: "oit", metadata: "not-json" },
    ]);
    expect(result).toEqual({ percentagePoints: 30, sampleSize: 1 });
  });
});
