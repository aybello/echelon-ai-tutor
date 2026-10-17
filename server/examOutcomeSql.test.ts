import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { examOutcomes, questionAttempts } from "../drizzle/schema";
import { createAuditSqlDatabase } from "./teams/auditSqlHarness";
import { outcomeExamDate, preExamCutoff, saveExamOutcome } from "./examOutcomeRecords";
import { calculateReadinessSnapshot } from "./readinessSnapshot";

describe("dated exam outcomes against an isolated SQL database", () => {
  let state: ReturnType<typeof createAuditSqlDatabase>;
  beforeEach(() => { state = createAuditSqlDatabase(); });
  afterEach(() => state.close());
  const email = "outcome-learner@example.org";
  const base = { orgId: 0, memberEmail: email, courseKey: "oit", recordedBy: "learner-self-report", readinessScoreAtOutcome: 65, readinessModelVersion: "estimated-readiness-v2-pre-exam" };

  it("keeps a failed sitting when the learner later passes, and does not duplicate a retried report", async () => {
    const failed = { ...base, result: "failed" as const, examDate: outcomeExamDate("2026-08-01") };
    const passed = { ...base, result: "passed" as const, examDate: outcomeExamDate("2026-09-01"), readinessScoreAtOutcome: 85 };
    await saveExamOutcome(state.db as any, failed);
    await Promise.all([saveExamOutcome(state.db as any, passed), saveExamOutcome(state.db as any, passed)]);
    const rows = await state.db.select().from(examOutcomes);
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.result).sort()).toEqual(["failed", "passed"]);
    await saveExamOutcome(state.db as any, { ...failed, result: "passed", readinessScoreAtOutcome: 99 });
    const corrected = await state.db.select().from(examOutcomes).where(eq(examOutcomes.examDate, failed.examDate));
    expect(corrected[0]).toMatchObject({ result: "passed", readinessScoreAtOutcome: 65 });
  });

  it("adopts only the matching legacy date and leaves other history intact", async () => {
    await state.db.insert(examOutcomes).values({ ...base, result: "failed", examDate: new Date("2026-08-01T00:00:00Z") });
    await saveExamOutcome(state.db as any, { ...base, result: "passed", examDate: outcomeExamDate("2026-08-01") });
    const rows = await state.db.select().from(examOutcomes);
    expect(rows).toHaveLength(1);
    expect(rows[0].examAttemptKey).toHaveLength(64);
  });

  it("excludes exam-day and later practice and mock answers from the reconstructed estimate", async () => {
    const cutoff = preExamCutoff(outcomeExamDate("2026-09-01"));
    await state.db.insert(questionAttempts).values([
      { studentEmail: email, examType: "oit", topic: "Math", questionId: 900001, correct: "yes", createdAt: new Date("2026-08-30T10:00:00Z") },
      { studentEmail: email, examType: "oit", topic: "Math", questionId: 900002, correct: "no", quizMode: "mock", sessionId: "before", createdAt: new Date("2026-08-30T11:00:00Z") },
      { studentEmail: email, examType: "oit", topic: "Math", questionId: 900003, correct: "yes", quizMode: "mock", sessionId: "after", createdAt: cutoff },
      { studentEmail: email, examType: "oit", topic: "Math", questionId: 900004, correct: "yes", createdAt: new Date("2026-09-02T10:00:00Z") },
    ]);
    const estimate = await calculateReadinessSnapshot(state.db as any, { userId: null, email, examType: "oit", now: cutoff });
    expect(estimate.totalAttempts).toBe(2);
    expect(estimate.breakdown.recentAccuracy).toBe(50);
    expect(estimate.breakdown.mockAccuracy).toBe(0);
  });
});
