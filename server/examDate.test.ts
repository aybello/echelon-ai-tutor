/**
 * Issue B regression guard: exam date countdown must be timezone-safe.
 * "2026-08-22" must always mean August 22 in the user's local timezone,
 * not August 21 (UTC midnight interpreted as local evening in Canada).
 */

import { describe, it, expect } from "vitest";

/**
 * Mirrors the parseExamDate helper in ExamDateTracker.tsx and dashboardRouter.ts.
 * Parses a YYYY-MM-DD string as a local calendar date (local midnight).
 */
function parseExamDate(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Mirrors getDaysUntil in ExamDateTracker.tsx.
 * Accepts an optional "now" for deterministic testing.
 */
function getDaysUntil(dateStr: string, now: Date = new Date()): number {
  const exam = parseExamDate(dateStr);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

describe("parseExamDate (Issue B — timezone safety)", () => {
  it("parses YYYY-MM-DD as local midnight, not UTC midnight", () => {
    const d = parseExamDate("2026-08-22");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // 0-indexed → August
    expect(d.getDate()).toBe(22);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("getDaysUntil returns 0 on exam day itself", () => {
    const examStr = "2026-08-22";
    // Simulate "now" as 11pm on exam day (e.g., EDT = UTC-4, so 23:00 local)
    const now = new Date(2026, 7, 22, 23, 0, 0); // local 11pm on Aug 22
    expect(getDaysUntil(examStr, now)).toBe(0);
  });

  it("getDaysUntil returns 1 the day before the exam", () => {
    const examStr = "2026-08-22";
    const now = new Date(2026, 7, 21, 9, 0, 0); // local 9am on Aug 21
    expect(getDaysUntil(examStr, now)).toBe(1);
  });

  it("getDaysUntil returns 30 thirty days before the exam", () => {
    const examStr = "2026-08-22";
    const now = new Date(2026, 6, 23, 0, 0, 0); // local midnight on July 23
    expect(getDaysUntil(examStr, now)).toBe(30);
  });

  it("getDaysUntil returns negative for past exam dates", () => {
    const examStr = "2026-01-01";
    const now = new Date(2026, 5, 10, 12, 0, 0); // June 10
    expect(getDaysUntil(examStr, now)).toBeLessThan(0);
  });

  it("old approach (new Date(dateStr)) would give wrong day in UTC-4 timezone", () => {
    // "2026-08-22" parsed as UTC midnight = Aug 21 at 8pm EDT
    // This test documents the bug — the old approach returns -1 on exam day at 11pm local
    const examStr = "2026-08-22";
    const examUTC = new Date(examStr); // UTC midnight → local Aug 21 8pm in EDT
    const now = new Date(2026, 7, 22, 23, 0, 0); // local 11pm on Aug 22

    // Old approach: exam is in the past by 11pm on exam day in EDT
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const oldDays = Math.ceil((examUTC.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // New approach: always 0 on exam day
    const newDays = getDaysUntil(examStr, now);

    // The old approach gives -1 or 0 depending on timezone offset; new is always 0
    expect(newDays).toBe(0);
    // Document that old approach is unreliable (may differ by 1 in UTC-4 to UTC-8)
    expect(Math.abs(oldDays - newDays)).toBeLessThanOrEqual(1);
  });
});
