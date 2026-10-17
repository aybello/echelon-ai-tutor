import { describe, expect, it } from "vitest";
import { examAttemptKey, outcomeExamDate, preExamCutoff } from "./examOutcomeRecords";

describe("official-exam sitting identity and cutoff", () => {
  const now = new Date("2026-10-16T13:00:00Z");
  it("rejects impossible dates and tomorrow's exam result", () => {
    for (const date of ["2026-02-30", "invalid", "2026-10-17"]) {
      expect(() => outcomeExamDate(date, now)).toThrow();
    }
    expect(outcomeExamDate("2026-10-16", now).toISOString()).toBe("2026-10-16T12:00:00.000Z");
  });
  it("excludes the exam day rather than assuming the exam took place at noon", () => {
    expect(preExamCutoff(outcomeExamDate("2026-10-15", now)).toISOString()).toBe("2026-10-15T00:00:00.000Z");
  });
  it("deduplicates a retried report while keeping retakes and organization boundaries separate", () => {
    const sitting = { orgId: 0, memberEmail: "Learner@example.com ", courseKey: "oit", examDate: outcomeExamDate("2026-10-01", now) };
    expect(examAttemptKey(sitting)).toBe(examAttemptKey({ ...sitting, memberEmail: "learner@example.com" }));
    expect(examAttemptKey(sitting)).not.toBe(examAttemptKey({ ...sitting, examDate: outcomeExamDate("2026-10-15", now) }));
    expect(examAttemptKey(sitting)).not.toBe(examAttemptKey({ ...sitting, orgId: 2 }));
  });
});
