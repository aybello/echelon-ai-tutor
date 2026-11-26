import { describe, expect, it } from "vitest";
import { MAX_REPORT_SESSIONS, OJT_DAILY_CAP_SECONDS, OJT_ROUNDING_SECONDS, calculateSupervisorReviewDuration, canReadImmutableRecord, canonicalSnapshotDigest, requireCompleteSessionSet, sessionsToCsv } from "./trainingRecords";

describe("training record calculations", () => {
  it("caps reviewable time at seven hours per Ontario calendar date and floors it to quarter hours", () => {
    const sessions = [
      { startedAt: new Date("2026-08-28T13:00:00.000Z"), activeSeconds: 4 * 60 * 60 + 50 * 60 },
      { startedAt: new Date("2026-08-28T18:00:00.000Z"), activeSeconds: 3 * 60 * 60 + 50 * 60 },
    ] as any[];
    const result = calculateSupervisorReviewDuration(sessions);
    expect(result.dailyCapSeconds).toBe(OJT_DAILY_CAP_SECONDS);
    expect(result.roundingSeconds).toBe(OJT_ROUNDING_SECONDS);
    expect(result.days).toHaveLength(1);
    expect(result.days[0]).toMatchObject({ cappedSeconds: 7 * 60 * 60, supervisorReviewSeconds: 7 * 60 * 60 });
  });

  it("does not round platform-recorded duration up", () => {
    const result = calculateSupervisorReviewDuration([{ startedAt: new Date("2026-08-28T13:00:00.000Z"), activeSeconds: 44 * 60 }] as any[]);
    expect(result.supervisorReviewSeconds).toBe(30 * 60);
  });

  it("escapes spreadsheet-formula cells in CSV detail", () => {
    const csv = sessionsToCsv([{ sessionKey: "x", startedAt: new Date("2026-08-28T13:00:00.000Z"), activeSeconds: 60, courseKey: "class4-ww", activityType: "quiz", topic: "=HYPERLINK(\"https://unsafe.example\")", unitsCompleted: 1, score: null, total: null, studentEmail: "operator@example.com", status: "completed" }] as any[]);
    expect(csv).toContain("'=HYPERLINK");
  });

  it("produces a stable SHA-256 digest for the frozen record bytes", () => {
    const snapshot = '{"version":1,"record":"frozen"}';
    expect(canonicalSnapshotDigest(snapshot)).toMatch(/^[a-f0-9]{64}$/);
    expect(canonicalSnapshotDigest(snapshot)).toBe(canonicalSnapshotDigest(snapshot));
  });

  it("fails closed rather than signing an incomplete oversized period", () => {
    expect(() => requireCompleteSessionSet(new Array(MAX_REPORT_SESSIONS + 1).fill({}))).toThrow(/10,000 sessions/);
  });

  it("allows only the operator or an organization-matched manager to read an immutable record", () => {
    expect(canReadImmutableRecord("operator@example.com", "operator@example.com", 4, null)).toBe(true);
    expect(canReadImmutableRecord("manager@example.com", "operator@example.com", 4, 4)).toBe(true);
    expect(canReadImmutableRecord("other@example.com", "operator@example.com", 4, 5)).toBe(false);
  });
});
