import { describe, expect, it } from "vitest";
import {
  analyticsIdentity,
  buildJourneyIdentityResolver,
  cohortConversion,
  comparableQuizGain,
  medianTimeToFirstQuizMinutes,
  percentage,
} from "./productKpis";

describe("product KPI calculations", () => {
  it("calculates rates without inventing a denominator", () => {
    expect(percentage(3, 8)).toBe(37.5);
    expect(percentage(2, 0)).toBeNull();
  });

  it("uses pseudonymous identities without exposing an email address", () => {
    expect(analyticsIdentity({ userId: "42", emailHash: "hash" })).toBe("user:42");
    expect(analyticsIdentity({ userId: null, emailHash: "hash" })).toBe("email:hash");
    expect(analyticsIdentity({ userId: null, emailHash: null, anonymousHash: "browser" })).toBe("anonymous:browser");
    expect(analyticsIdentity({ userId: null, emailHash: null, anonymousHash: null })).toBeNull();
  });

  it("stitches browser, email, and user identifiers into one journey", () => {
    const events = [
      { eventName: "pricing_viewed", occurredAt: new Date("2026-08-01"), userId: null, emailHash: null, anonymousHash: "browser" },
      { eventName: "checkout_completed", occurredAt: new Date("2026-08-02"), userId: null, emailHash: "email", anonymousHash: "browser" },
      { eventName: "quiz_started", occurredAt: new Date("2026-08-03"), userId: "42", emailHash: "email", anonymousHash: null },
    ];
    const resolve = buildJourneyIdentityResolver(events);
    expect(new Set(events.map(resolve))).toEqual(new Set(["user:42"]));
  });

  it("uses only conversions attributable to the source cohort", () => {
    const events = [
      { eventName: "pricing_viewed", occurredAt: new Date("2026-08-01"), userId: null, emailHash: null, anonymousHash: "visitor-a" },
      { eventName: "pricing_viewed", occurredAt: new Date("2026-08-01"), userId: null, emailHash: null, anonymousHash: "visitor-b" },
      { eventName: "checkout_completed", occurredAt: new Date("2026-08-02"), userId: null, emailHash: "buyer-a", anonymousHash: "visitor-a" },
      { eventName: "checkout_completed", occurredAt: new Date("2026-08-02"), userId: null, emailHash: "buyer-c", anonymousHash: "visitor-c" },
      { eventName: "checkout_completed", occurredAt: new Date("2026-07-31"), userId: null, emailHash: "buyer-b", anonymousHash: "visitor-b" },
    ];
    expect(cohortConversion(events, new Set(["pricing_viewed"]), new Set(["checkout_completed"]))).toEqual({
      rate: 50,
      cohortSize: 2,
      converted: 1,
    });
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

  it("measures only comparable standard quiz improvement", () => {
    const result = comparableQuizGain([
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-01"), userId: "1", emailHash: null, examType: "oit", metadata: JSON.stringify({ quizMode: "standard", questionCount: 10, correctCount: 5 }) },
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-10"), userId: "1", emailHash: null, examType: "oit", metadata: JSON.stringify({ quizMode: "standard", questionCount: 10, correctCount: 8 }) },
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-11"), userId: "1", emailHash: null, examType: "oit", metadata: JSON.stringify({ quizMode: "missed", questionCount: 10, correctCount: 10 }) },
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-12"), userId: "1", emailHash: null, examType: "oit", metadata: JSON.stringify({ quizMode: "standard", questionCount: 15, correctCount: 15 }) },
      { eventName: "quiz_completed", occurredAt: new Date("2026-08-10"), userId: "2", emailHash: null, examType: "oit", metadata: "not-json" },
    ]);
    expect(result).toEqual({ percentagePoints: 30, sampleSize: 1 });
  });
});
