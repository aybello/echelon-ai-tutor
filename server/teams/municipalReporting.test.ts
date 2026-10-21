import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const { getDb, calculateReadinessSnapshot } = vi.hoisted(() => ({
  getDb: vi.fn(), calculateReadinessSnapshot: vi.fn().mockResolvedValue({ score: 65, activeDaysLast30: 2 }),
}));
vi.mock("../db", () => ({ getDb }));
vi.mock("../analytics", () => ({ trackEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../email", () => ({ sendTeamEnrollmentEmail: vi.fn(), sendOperatorStudyReminderEmail: vi.fn(), sendCoursePassInvitationEmail: vi.fn() }));
vi.mock("../readinessSnapshot", () => ({ calculateReadinessSnapshot }));
vi.mock("../stripe/stripe", () => ({ stripe: {} }));
import { aggregateUtcDate, orgIntelRouter, orgRouter } from "../routers/orgRouter";
import { teamFlexRouter } from "../routers/teamFlexRouter";
const now = new Date();
const past = new Date(now.getTime() - 86400000);
const future = new Date(now.getTime() + 86400000);
const mysqlTimestamp = (date: Date) => date.toISOString().slice(0, 19).replace("T", " ");
const org = { id: 7, name: "Fixture municipality", managerEmail: "manager@example.test", billingType: "course-pass", status: "active", createdAt: past, termStart: past, termEnd: past, seatsTotal: 0, province: "ontario" };
const lic = { id: 42, organizationId: 7, courseKey: "class1-water", termMonths: 3, status: "expired", accessEndsAt: past, reportingEndsAt: future, startsAt: new Date("2026-01-01"), activatedAt: new Date("2026-01-01"), invitedEmail: "operator@example.test", operatorUserId: null };
const member = { id: 3, email: "operator@example.test", name: "Fixture", courseKey: "class1-water", assignedAt: past, status: "assigned" };
const ctx = { user: null, studentEmail: org.managerEmail, req: { headers: {} }, res: {} } as any;
function database(results: any[][]) {
  const pending = [...results];
  const conditions: string[] = [];
  const dialect = new MySqlDialect();
  const select = vi.fn(() => {
    const rows = pending.shift();
    if (!rows) throw new Error("Unexpected database query");
    const chain: any = { then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject) };
    for (const method of ["from", "groupBy", "orderBy", "having", "limit"]) chain[method] = vi.fn(() => chain);
    chain.where = vi.fn((condition: any) => { conditions.push(dialect.sqlToQuery(condition).sql); return chain; });
    return chain;
  });
  getDb.mockResolvedValue({ select });
  return { select, conditions, pending };
}
beforeEach(() => { vi.clearAllMocks(); });
describe("manager reporting router behavior", () => {
  it("interprets raw MySQL aggregate timestamps as UTC and fails closed for invalid values", () => {
    expect(aggregateUtcDate("2026-10-21 00:30:00")?.toISOString()).toBe("2026-10-21T00:30:00.000Z");
    expect(aggregateUtcDate("not-a-timestamp")).toBeNull();
    expect(aggregateUtcDate("2026-02-30 12:00:00")).toBeNull();
    expect(aggregateUtcDate(new Date("invalid"))).toBeNull();
  });
  it("keeps actual expired-pass attempt evidence during reporting grace", async () => {
    const db = database([[org], [lic], [lic], [{ total: 10, correct: 7, lastActive: past.toISOString() }]]);
    const rows = await teamFlexRouter.createCaller(ctx).getFlexProgress({ orgId: 7 });
    expect(rows).toMatchObject([{ licenceId: 42, status: "expired", totalAttempts: 10, correctAttempts: 7, accuracy: 70, readinessScore: 65 }]);
    expect(calculateReadinessSnapshot).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ flexScope: { orgId: 7, licenceId: 42, startsAt: lic.startsAt, endsAt: past } }));
    expect(db.conditions.at(-1)).toContain("flexLicenceId");
    expect(db.conditions.at(-1)).toContain("orgId");
    expect(db.pending).toEqual([]);
  });
  it("drops expired progress only after the recorded reporting window", async () => {
    const db = database([[{ ...org, termEnd: future }], [], [{ ...lic, reportingEndsAt: past }]]);
    await expect(teamFlexRouter.createCaller(ctx).getFlexProgress({ orgId: 7 })).resolves.toEqual([]);
    expect(calculateReadinessSnapshot).not.toHaveBeenCalled();
    expect(db.select).toHaveBeenCalledTimes(3);
  });
  const diagnostics = [
    { memberId: 3, courseKey: "class1-water", score: 40, completedAt: new Date("2026-01-10") },
    { memberId: 3, courseKey: "class1-water", score: 90, completedAt: new Date("2026-01-20") },
  ];
  const practice = [
    { memberId: 3, courseKey: "class1-water", bankKey: null, examType: "class1-water", quizMode: "standard", correct: "yes", createdAt: new Date("2026-01-11") },
    { memberId: 3, courseKey: "class1-water", bankKey: null, examType: "class1-water", quizMode: "standard", correct: "no", createdAt: new Date("2026-01-09") },
    { memberId: 3, courseKey: "class1-wastewater", bankKey: null, examType: "class1-wastewater", quizMode: "standard", correct: "no", createdAt: new Date("2026-01-11") },
  ];
  it("summary compares only same-course practice after the first baseline", async () => {
    const db = database([[org], [lic], [org], [member], [], [], [], [], [], [], diagnostics, [], practice, []]);
    const result = await orgIntelRouter.createCaller(ctx).getTeamReadinessSummary({ orgId: 7 });
    expect(result).toMatchObject({ avgDiagnosticBaseline: 40, avgPracticeAccuracy: 100, accuracyChange: 60, matchedLearnerCourses: 1, matchedPracticeAttempts: 1 });
    expect(db.pending).toEqual([]);
  });
  it("uses completed mock accuracy, not the number of completed mocks, in the team study estimate", async () => {
    const db = database([
      [org], [lic], [org], [member],
      [{ memberId: 3, total: 200, correct: 160, lastActive: mysqlTimestamp(past) }],
      [{ memberId: 3 }], [],
      [{ memberId: 3, count: 5 }],
      [{ memberId: 3, correct: 20, total: 100 }],
      [], [], [{ memberId: 3 }], [], [],
    ]);

    const result = await orgIntelRouter.createCaller(ctx).getTeamReadinessSummary({ orgId: 7 });

    // 80% practice × 50% + 20% completed-mock accuracy × 25%
    // + full volume × 15% + recent activity × 10% = 70%.
    expect(result).toMatchObject({ avgReadiness: 70, examReadyCount: 0 });
    expect(db.pending).toEqual([]);
  });
  it("treats a raw MySQL aggregate timestamp string as dated activity in the attention list", async () => {
    const stale = new Date(now.getTime() - 15 * 86400000);
    const db = database([
      [org], [lic], [member],
      [{ memberId: 3, total: 10, correct: 8 }],
      [{ memberId: 3, lastActive: mysqlTimestamp(stale) }],
      [],
    ]);

    const result = await orgRouter.createCaller(ctx).getAttention();

    expect(result.stalled).toEqual([
      expect.objectContaining({ email: member.email, reason: "inactive", daysSinceActivity: 15 }),
    ]);
    expect(db.pending).toEqual([]);
  });
  it("normalizes a raw MySQL minimum exam date in the per-operator readiness report", async () => {
    const examDate = new Date(now.getTime() + 7 * 86400000);
    const db = database([
      [org], [lic], [member],
      [{ memberId: 3, total: 10, correct: 8 }],
      [], [],
      [{ memberId: 3, lastActive: mysqlTimestamp(past) }],
      [{ email: member.email, examDate: mysqlTimestamp(examDate) }],
      [],
    ]);

    const result = await orgIntelRouter.createCaller(ctx).getOperatorReadiness({ orgId: 7 });

    expect(result.operators).toEqual([
      expect.objectContaining({ email: member.email, daysUntilExam: 7, examRisk: "critical" }),
    ]);
    expect(db.pending).toEqual([]);
  });
  it("CSV uses identical matched evidence and exposes sample sizes", async () => {
    const db = database([[org], [lic], [org], [member], [], practice, [], [], [], [], [], diagnostics]);
    const result = await orgIntelRouter.createCaller(ctx).exportTeamCSV({ orgId: 7 });
    const [header, row] = result.csv.split("\n").map(line => line.split(","));
    expect(row[header.indexOf("Matched Diagnostic Baseline")]).toBe("40%");
    expect(row[header.indexOf("Same-Course Post-Baseline Practice Accuracy")]).toBe("100%");
    expect(row[header.indexOf("Matched Accuracy Change")]).toBe("+60 pts");
    expect(row[header.indexOf("Matched Learner-Courses")]).toBe("1");
    expect(row[header.indexOf("Matched Practice Attempts")]).toBe("1");
    expect(row.length).toBe(header.length);
    expect(db.pending).toEqual([]);
  });
});
