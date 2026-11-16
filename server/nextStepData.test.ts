import { describe, expect, it } from "vitest";
import { calendarDaysUntil, startOfLearnerDay, wholeDaysSince } from "./nextStepData";

// Browser offsets: Date.getTimezoneOffset() is minutes to add to local time to get UTC.
const TORONTO_WINTER = 300; // UTC-5
const VANCOUVER_WINTER = 480; // UTC-8
const UTC = 0;

describe("startOfLearnerDay", () => {
  it("is local midnight for a learner in Toronto", () => {
    // 2026-12-10 03:30 UTC is 2026-12-09 22:30 in Toronto, so the learner's day began 2026-12-09 05:00 UTC.
    const start = startOfLearnerDay(new Date("2026-12-10T03:30:00Z"), TORONTO_WINTER);
    expect(start.toISOString()).toBe("2026-12-09T05:00:00.000Z");
  });

  it("moves to the next local day once local midnight passes", () => {
    // 2026-12-10 05:30 UTC is 2026-12-10 00:30 in Toronto.
    expect(startOfLearnerDay(new Date("2026-12-10T05:30:00Z"), TORONTO_WINTER).toISOString()).toBe("2026-12-10T05:00:00.000Z");
  });

  it("handles Vancouver and UTC", () => {
    expect(startOfLearnerDay(new Date("2026-12-10T07:59:00Z"), VANCOUVER_WINTER).toISOString()).toBe("2026-12-09T08:00:00.000Z");
    expect(startOfLearnerDay(new Date("2026-12-10T07:59:00Z"), UTC).toISOString()).toBe("2026-12-10T00:00:00.000Z");
  });

  it("an answer given late the previous evening does not count for today", () => {
    const now = new Date("2026-12-10T14:00:00Z"); // 09:00 in Toronto
    const lateLastNight = new Date("2026-12-10T03:00:00Z"); // 22:00 the evening before in Toronto
    expect(lateLastNight.getTime()).toBeLessThan(startOfLearnerDay(now, TORONTO_WINTER).getTime());
  });
});

describe("calendarDaysUntil", () => {
  const now = new Date("2026-12-10T18:00:00Z"); // 13:00 on 10 December in Toronto

  it("is zero on the day of the exam and counts whole calendar days", () => {
    expect(calendarDaysUntil("2026-12-10T00:00:00.000Z", now, TORONTO_WINTER)).toBe(0);
    expect(calendarDaysUntil("2026-12-11", now, TORONTO_WINTER)).toBe(1);
    expect(calendarDaysUntil("2026-12-24", now, TORONTO_WINTER)).toBe(14);
    expect(calendarDaysUntil("2026-12-25", now, TORONTO_WINTER)).toBe(15);
  });

  it("crosses a month and a year boundary", () => {
    expect(calendarDaysUntil("2027-01-02", now, TORONTO_WINTER)).toBe(23);
  });

  it("is negative after the exam date has passed", () => {
    expect(calendarDaysUntil("2026-12-09", now, TORONTO_WINTER)).toBe(-1);
  });

  it("uses the learner's own day, not UTC, near midnight", () => {
    // 2026-12-11 03:00 UTC is still the evening of 10 December in Toronto.
    const lateEvening = new Date("2026-12-11T03:00:00Z");
    expect(calendarDaysUntil("2026-12-11", lateEvening, TORONTO_WINTER)).toBe(1);
    expect(calendarDaysUntil("2026-12-11", lateEvening, UTC)).toBe(0);
  });

  it("accepts a Date value as stored by the database", () => {
    expect(calendarDaysUntil(new Date("2026-12-17T00:00:00Z"), now, TORONTO_WINTER)).toBe(7);
  });
});

describe("wholeDaysSince", () => {
  const now = new Date("2026-12-10T12:00:00Z");
  it("counts whole days and rounds down", () => {
    expect(wholeDaysSince(new Date("2026-12-03T12:00:00Z"), now)).toBe(7);
    expect(wholeDaysSince(new Date("2026-12-03T12:00:01Z"), now)).toBe(6);
    expect(wholeDaysSince(new Date("2026-12-10T11:00:00Z"), now)).toBe(0);
  });
  it("never goes negative", () => {
    expect(wholeDaysSince(new Date("2026-12-11T12:00:00Z"), now)).toBe(0);
  });
});
