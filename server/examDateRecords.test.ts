import { describe, expect, it } from "vitest";
import { normalizeExamDateKey, parseExamCalendarDate, parseReminderHistory } from "./examDateRecords";
import { planExamDateReconciliation, type ExamDateSnapshotRow } from "../scripts/db/examDateReconciliation";

const row = (id: number, overrides: Partial<ExamDateSnapshotRow> = {}): ExamDateSnapshotRow => ({
  id, email: "learner@example.test", productKey: "class1-water", examDate: "2030-06-01 12:00:00",
  remindersSent: "[]", createdAt: "2026-01-01 00:00:00", updatedAt: "2026-01-02 00:00:00",
  orgId: null, organizationMemberId: null, courseKey: "class1-water", ...overrides,
});
describe("exam-date identity and release plan", () => {
  it("normalizes casing, whitespace and explicit registry aliases without merging unrelated streams", () => {
    expect(normalizeExamDateKey(" Learner@Example.test ", " CLASS1 "))
      .toEqual({ email: "learner@example.test", productKey: "class1-water" });
    expect(normalizeExamDateKey("learner@example.test", "class1-wastewater").productKey).toBe("class1-ww");
    expect(() => normalizeExamDateKey("bad", "class1")).toThrow();
    expect(() => normalizeExamDateKey("a@example.test", "made-up-course")).toThrow();
  });
  it("stores calendar days at UTC noon and rejects invalid dates instead of rolling them over", () => {
    expect(parseExamCalendarDate("2028-02-29").toISOString()).toBe("2028-02-29T12:00:00.000Z");
    for (const date of ["2027-02-29", "2030-04-31", "2030-13-01", "2030-06-01T00:00:00Z", "2040-01-01"])
      expect(() => parseExamCalendarDate(date)).toThrow();
  });
  it("validates and deduplicates reminder history", () => {
    expect(parseReminderHistory("[7,30,7]")).toEqual([30,7]);
    for (const value of ['{"7":true}', '["7"]', '[0]', 'null', 'oops'])
      expect(() => parseReminderHistory(value)).toThrow();
  });
  it("keeps the newest row and unions only reminders belonging to its chosen date", () => {
    const plan = planExamDateReconciliation([
      row(1, { email: "LEARNER@example.test", productKey: "class1", remindersSent: "[30]" }),
      row(2, { remindersSent: "[14]" }),
      row(3, { examDate: "2030-05-01 00:00:00", remindersSent: "[7,1]", updatedAt: "2026-01-01 00:00:00" }),
    ]);
    expect(plan.blockers).toEqual([]);
    expect(plan.changes[0].keeper.id).toBe(2);
    expect(plan.changes[0].keeper.remindersSent).toBe("[30,14]");
    expect(plan.changes[0].removeIds.sort()).toEqual([1,3]);
    expect(plan.changes[0].previousDates).toHaveLength(2);
    expect(planExamDateReconciliation([plan.changes[0].keeper]).changes).toEqual([]);
  });
  it("never guesses across conflicting organizations or malformed history", () => {
    expect(planExamDateReconciliation([row(1, { orgId: 1 }), row(2, { orgId: 2 })]).blockers).toHaveLength(1);
    expect(planExamDateReconciliation([row(1, { remindersSent: "not JSON" })]).blockers).toHaveLength(1);
    expect(planExamDateReconciliation([row(1, { courseKey: "class1-ww" })]).blockers).toHaveLength(1);
  });
  it("binds release approval to every snapshot field and ignores row ordering", () => {
    const first = planExamDateReconciliation([row(1),row(2)]).sha256;
    expect(planExamDateReconciliation([row(2),row(1)]).sha256).toBe(first);
    expect(planExamDateReconciliation([row(1),row(2, { remindersSent: "[7]" })]).sha256).not.toBe(first);
  });
});
