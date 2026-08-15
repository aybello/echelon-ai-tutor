/**
 * Tests for exam.submitMock — server-scored mock exam submission.
 * Verifies server scoring, result persistence, and org identity propagation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({
  resolveLearningIdentity: vi.fn().mockResolvedValue({
    userId: 5,
    studentEmail: "operator@example.com",
    orgId: 3,
    organizationMemberId: 77,
  }),
}));

import { getDb } from "./db";

const QUESTIONS = [
  { questionNum: 1, correctIndex: 0, module: "Disinfection", difficulty: "easy" },
  { questionNum: 2, correctIndex: 1, module: "Hydraulics", difficulty: "medium" },
  { questionNum: 3, correctIndex: 2, module: "Disinfection", difficulty: "hard" },
];

function makeDb(questionRows = QUESTIONS) {
  const insertValues = vi.fn().mockResolvedValue([]);
  const insertInto = vi.fn().mockReturnValue({ values: insertValues });
  const selectWhere = vi.fn().mockResolvedValue(questionRows);
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const selectFn = vi.fn().mockReturnValue({ from: selectFrom });
  const db: any = { select: selectFn, insert: insertInto };
  return { db, insertValues, insertInto };
}

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const BASE_INPUT = {
  sessionId: "session-abc-123",
  examType: "class1-water",
  bankKey: "ontario-class1-water",
  timeTakenSeconds: 3600,
  answers: [
    { questionNum: 1, selectedIndex: 0 }, // correct
    { questionNum: 2, selectedIndex: 3 }, // wrong
    { questionNum: 3, selectedIndex: 2 }, // correct
  ],
};

describe("exam.submitMock — server scoring", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scores answers server-side and returns correct count and pass/fail", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.exam.submitMock(BASE_INPUT);
    expect(result.score).toBe(2);
    expect(result.total).toBe(3);
    expect(result.passed).toBe(false); // 67% < 70%
  });

  it("marks as passed when score >= 70%", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.exam.submitMock({
      ...BASE_INPUT,
      answers: [
        { questionNum: 1, selectedIndex: 0 }, // correct
        { questionNum: 2, selectedIndex: 1 }, // correct
        { questionNum: 3, selectedIndex: 2 }, // correct
      ],
    });
    expect(result.passed).toBe(true);
    expect(result.pct).toBe(100);
  });

  it("ignores unknown questionIds gracefully", async () => {
    const { db } = makeDb([QUESTIONS[0]]); // only Q1 exists
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.exam.submitMock({
      ...BASE_INPUT,
      answers: [
        { questionNum: 1, selectedIndex: 0 }, // correct
        { questionNum: 999, selectedIndex: 0 }, // unknown — skipped
      ],
    });
    // total is answers.length (2) but Q999 is skipped in scoring
    expect(result.score).toBe(1);
  });

  it("throws INTERNAL_SERVER_ERROR when DB is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.exam.submitMock(BASE_INPUT)).rejects.toThrow("Database unavailable");
  });

  it("persists orgId and organizationMemberId on each question attempt", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.exam.submitMock(BASE_INPUT);
    // First insert call is a question attempt
    const firstAttempt = insertValues.mock.calls[0][0];
    expect(firstAttempt.orgId).toBe(3);
    expect(firstAttempt.organizationMemberId).toBe(77);
  });

  it("persists quizMode='mock' on all question attempts", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.exam.submitMock(BASE_INPUT);
    const firstAttempt = insertValues.mock.calls[0][0];
    expect(firstAttempt.quizMode).toBe("mock");
  });

  it("persists bankKey on all question attempts", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.exam.submitMock(BASE_INPUT);
    const firstAttempt = insertValues.mock.calls[0][0];
    expect(firstAttempt.bankKey).toBe("ontario-class1-water");
  });

  it("builds moduleBreakdown correctly", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.exam.submitMock(BASE_INPUT);
    // Q1 (Disinfection, correct) + Q3 (Disinfection, correct) = 2/2
    // Q2 (Hydraulics, wrong) = 0/1
    expect(result.moduleBreakdown?.Disinfection).toEqual({ correct: 2, total: 2 });
    expect(result.moduleBreakdown?.Hydraulics).toEqual({ correct: 0, total: 1 });
  });
});
