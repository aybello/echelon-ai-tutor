/**
 * Regression tests for the streak UTC/Toronto timezone fix (M1).
 *
 * The bug: using new Date().toISOString().slice(0, 10) returns a UTC date,
 * which is 4-5 hours behind Eastern time. A student studying at 9 PM EST
 * would get a UTC date of the NEXT day, breaking streak continuity.
 *
 * The fix: use Intl.DateTimeFormat with timeZone: "America/Toronto" to get
 * the correct local calendar date.
 */
import { describe, it, expect } from "vitest";

// ─── Inline the helper to test it in isolation ───────────────────────────────
function getTodayTorontoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function getYesterdayTorontoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

describe("streak timezone helper (M1 regression)", () => {
  it("returns YYYY-MM-DD format", () => {
    const date = getTodayTorontoDate(new Date("2025-01-15T12:00:00Z"));
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns Toronto local date, not UTC date, at 11 PM UTC on Dec 31", () => {
    // 2024-12-31T23:00:00Z = 6 PM EST (UTC-5) = still Dec 31 in Toronto
    const utcDate = new Date("2024-12-31T23:00:00Z");
    const torontoDate = getTodayTorontoDate(utcDate);
    const utcString = utcDate.toISOString().slice(0, 10);

    // Both should be Dec 31 in this case (UTC 23:00 = EST 18:00)
    expect(torontoDate).toBe("2024-12-31");
    expect(utcString).toBe("2024-12-31");
  });

  it("returns correct Toronto date when UTC is already next day (critical bug case)", () => {
    // 2025-01-01T03:00:00Z = 10 PM EST Dec 31 (UTC-5) = still Dec 31 in Toronto
    // The old UTC code would return "2025-01-01", breaking the streak for a student
    // studying at 10 PM on New Year's Eve.
    const utcDate = new Date("2025-01-01T03:00:00Z");
    const torontoDate = getTodayTorontoDate(utcDate);
    const utcString = utcDate.toISOString().slice(0, 10);

    expect(torontoDate).toBe("2024-12-31"); // Toronto: still Dec 31
    expect(utcString).toBe("2025-01-01");   // UTC: already Jan 1
    // These differ — this is the bug the fix addresses
    expect(torontoDate).not.toBe(utcString);
  });

  it("yesterday helper returns the day before today in Toronto timezone", () => {
    // At 2025-06-10T02:30:00Z = 10:30 PM EDT Jun 9 (UTC-4)
    const now = new Date("2025-06-10T02:30:00Z");
    const today = getTodayTorontoDate(now);
    const yesterday = getYesterdayTorontoDate(now);

    expect(today).toBe("2025-06-09");    // Toronto: Jun 9
    expect(yesterday).toBe("2025-06-08"); // Yesterday: Jun 8
  });

  it("streak is preserved when student studies on consecutive Toronto calendar days", () => {
    // Simulate: last active Jun 9, studying now at 11 PM EDT Jun 9 (03:00 UTC Jun 10)
    const lastActiveDate = "2025-06-09";
    const now = new Date("2025-06-10T03:00:00Z"); // 11 PM EDT Jun 9

    const today = getTodayTorontoDate(now);
    const yesterday = getYesterdayTorontoDate(now);

    // today = Jun 9 (still Jun 9 in Toronto at 11 PM EDT)
    expect(today).toBe("2025-06-09");
    // lastActiveDate === today → no streak change (already active today)
    expect(lastActiveDate).toBe(today);
  });

  it("streak increments when student studies on the next Toronto calendar day", () => {
    // Simulate: last active Jun 9, studying now at 9 AM EDT Jun 10
    const lastActiveDate = "2025-06-09";
    const now = new Date("2025-06-10T13:00:00Z"); // 9 AM EDT Jun 10

    const today = getTodayTorontoDate(now);
    const yesterday = getYesterdayTorontoDate(now);

    expect(today).toBe("2025-06-10");
    expect(yesterday).toBe("2025-06-09");
    // lastActiveDate === yesterday → streak increments
    expect(lastActiveDate).toBe(yesterday);
  });
});
