import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { issueMockSession, mockOwner, mockSpecification } from "./mockExamSession";
import { ENV } from "./_core/env";
import { examResults } from "../drizzle/schema";
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn().mockResolvedValue({
  userId: 5, studentEmail: "operator@example.com", orgId: 3, organizationMemberId: 77,
}) }));
import { getDb } from "./db";
const identity = { userId: 5, studentEmail: "operator@example.com" };
const QUESTIONS = Array.from({ length: 100 }, (_, i) => ({ questionNum: i + 1, correctIndex: 0, module: "Safety", difficulty: "easy" }));
function makeDb(questionRows = QUESTIONS, existing: unknown[] = []) {
  const insertValues = vi.fn().mockResolvedValue([]);
  const db: any = {
    select: vi.fn().mockReturnValue({ from: (table: unknown) => ({
      where: () => table === examResults ? { limit: async () => existing } : Promise.resolve(questionRows),
    }) }),
    insert: vi.fn().mockReturnValue({ values: insertValues }),
    transaction: async (work: (tx: any) => Promise<void>) => work(db),
  };
  vi.mocked(getDb).mockResolvedValue(db);
  return { db, insertValues };
}
const ctx = { user: null, studentEmail: null, req: { headers: {} }, res: {} } as TrpcContext;
function input(correct = 69, now = Date.now()) {
  const spec = mockSpecification("class4-ww");
  const issued = issueMockSession({ ...spec, owner: mockOwner(identity), preview: false, questionNums: QUESTIONS.map(q => q.questionNum) }, now);
  return { sessionId: issued.manifest.sessionId, sessionToken: issued.token, examType: spec.examType, bankKey: spec.courseKey,
    answers: QUESTIONS.map((q, i) => ({ questionNum: q.questionNum, selectedIndex: i < correct ? 0 : null })) };
}
describe("issued mock submission", () => {
  beforeEach(() => { vi.clearAllMocks(); ENV.cookieSecret = "unit-test-secret-not-production"; });
  it("saves 69/100 as a fail, including all unanswered items and organization attribution", async () => {
    const { insertValues } = makeDb();
    const result = await appRouter.createCaller(ctx).exam.submitMock(input());
    expect(result).toMatchObject({ score: 69, total: 100, passed: false, persisted: true });
    expect(insertValues.mock.calls[0][0]).toMatchObject({ score: 69, total: 100, passed: "no" });
    const attempts = insertValues.mock.calls[1][0];
    expect(attempts).toHaveLength(100);
    expect(attempts.filter((a: any) => a.selectedIndex === null)).toHaveLength(31);
    expect(attempts[0]).toMatchObject({ orgId: 3, organizationMemberId: 77, quizMode: "mock", bankKey: "class4-ww" });
  });
  it("passes a complete 70/100 exam", async () => {
    makeDb(); expect(await appRouter.createCaller(ctx).exam.submitMock(input(70))).toMatchObject({ pct: 70, passed: true });
  });
  it.each(["one-question", "duplicate", "replacement", "course", "session", "calcOnly", "signature", "missing-token"])("rejects %s tampering before writing results", async kind => {
    const { insertValues } = makeDb(); const data: any = input();
    if (kind === "one-question") data.answers = data.answers.slice(0, 1);
    if (kind === "duplicate") data.answers[99] = data.answers[0];
    if (kind === "replacement") data.answers[99].questionNum = 99999;
    if (kind === "course") data.bankKey = "oit";
    if (kind === "session") data.sessionId = "another-session";
    if (kind === "calcOnly") data.calcOnly = true;
    if (kind === "signature") data.sessionToken = "altered." + data.sessionToken.split(".")[1];
    if (kind === "missing-token") delete data.sessionToken;
    await expect(appRouter.createCaller(ctx).exam.submitMock(data)).rejects.toThrow();
    expect(insertValues).not.toHaveBeenCalled();
  });
  it("rejects new results after the deadline and transport grace", async () => {
    const { insertValues } = makeDb();
    await expect(appRouter.createCaller(ctx).exam.submitMock(input(100, Date.now() - 4 * 3600_000))).rejects.toThrow("expired");
    expect(insertValues).not.toHaveBeenCalled();
  });
  it("returns a persisted result even after the deadline or later bank edits", async () => {
    const data = input(100, Date.now() - 4 * 3600_000);
    const { insertValues } = makeDb([], [{ userId: 5, studentEmail: identity.studentEmail, examType: data.examType, bankKey: data.bankKey, score: 69, total: 100, passed: "no", moduleBreakdown: "{}" }]);
    expect(await appRouter.createCaller(ctx).exam.submitMock(data)).toMatchObject({ score: 69, total: 100, persisted: true });
    expect(insertValues).not.toHaveBeenCalled();
  });
  it("rejects unavailable questions without shrinking the saved denominator", async () => {
    makeDb(QUESTIONS.slice(0, 99));
    await expect(appRouter.createCaller(ctx).exam.submitMock(input())).rejects.toThrow("no longer available");
  });
  it("does not persist or mark an OIT preview as a full mock pass", async () => {
    const { insertValues } = makeDb(QUESTIONS.slice(0, 30)); const spec = mockSpecification("oit");
    const issued = issueMockSession({ ...spec, owner: mockOwner(identity), preview: true, questionNums: QUESTIONS.slice(0, 30).map(q => q.questionNum) });
    expect(await appRouter.createCaller(ctx).exam.submitMock({ sessionId: issued.manifest.sessionId, sessionToken: issued.token,
      bankKey: "oit", examType: "oit", answers: QUESTIONS.slice(0, 30).map(q => ({ questionNum: q.questionNum, selectedIndex: 0 })) })).toMatchObject({ persisted: false, passed: false, score: 30 });
    expect(insertValues).not.toHaveBeenCalled();
  });
  it("closes the legacy browser-score bypass", async () => {
    const { insertValues } = makeDb();
    await expect(appRouter.createCaller(ctx).exam.saveResult({ score: 1, total: 1, passed: true })).rejects.toThrow("no longer accepted");
    expect(insertValues).not.toHaveBeenCalled();
  });
});
