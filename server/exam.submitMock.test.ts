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
import { examResults } from "../drizzle/schema";

const QUESTIONS = [
  { questionNum: 1, correctIndex: 0, module: "Disinfection", difficulty: "easy" },
  { questionNum: 2, correctIndex: 1, module: "Hydraulics", difficulty: "medium" },
  { questionNum: 3, correctIndex: 2, module: "Disinfection", difficulty: "hard" },
];

function makeDb(questionRows = QUESTIONS) {
  const insertValues = vi.fn().mockResolvedValue([]);
  const insertInto = vi.fn().mockReturnValue({ values: insertValues });
  const db: any = {
    select: vi.fn().mockReturnValue({ from: (table: unknown) => ({
      where: () => table === examResults ? { limit: async () => [] } : Promise.resolve(questionRows),
    }) }),
    insert: insertInto,
    transaction: async (work: (tx: any) => Promise<void>) => work(db),
  };
  return { db, insertValues, insertInto };
}

function makeCtx(): TrpcContext {
  return {
    user: null,
    studentEmail: null,
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

  it("rejects unavailable questions rather than silently changing the exam", async () => {
    const { db } = makeDb([QUESTIONS[0]]);
    vi.mocked(getDb).mockResolvedValue(db);
    await expect(appRouter.createCaller(makeCtx()).exam.submitMock(BASE_INPUT)).rejects.toThrow("no longer available");
  });

  it("counts unanswered questions as incorrect in the saved denominator", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const result = await appRouter.createCaller(makeCtx()).exam.submitMock({ ...BASE_INPUT,
      answers: QUESTIONS.map((q, i) => ({ questionNum: q.questionNum, selectedIndex: i === 0 ? 0 : null })),
    });
    expect(result).toMatchObject({ score: 1, total: 3, pct: 33, passed: false });
    expect(insertValues.mock.calls[0][0]).toMatchObject({ score: 1, total: 3 });
  });

  it("does not round a failing raw score into a pass", async () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({ ...QUESTIONS[0], questionNum: i + 1 }));
    const { db } = makeDb(rows);
    vi.mocked(getDb).mockResolvedValue(db);
    const result = await appRouter.createCaller(makeCtx()).exam.submitMock({ ...BASE_INPUT,
      answers: rows.map((q, i) => ({ questionNum: q.questionNum, selectedIndex: i < 139 ? 0 : null })),
    });
    expect(result.pct).toBe(70);
    expect(result.passed).toBe(false);
  });

  it("rejects repeated question numbers", async () => {
    const { db } = makeDb(); vi.mocked(getDb).mockResolvedValue(db);
    await expect(appRouter.createCaller(makeCtx()).exam.submitMock({ ...BASE_INPUT,
      answers: [BASE_INPUT.answers[0], BASE_INPUT.answers[0]],
    })).rejects.toThrow("exactly once");
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
    const firstAttempt = insertValues.mock.calls[1][0][0];
    expect(firstAttempt.orgId).toBe(3);
    expect(firstAttempt.organizationMemberId).toBe(77);
  });

  it("persists quizMode='mock' on all question attempts", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.exam.submitMock(BASE_INPUT);
    const firstAttempt = insertValues.mock.calls[1][0][0];
    expect(firstAttempt.quizMode).toBe("mock");
  });

  it("persists bankKey on all question attempts", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.exam.submitMock(BASE_INPUT);
    const firstAttempt = insertValues.mock.calls[1][0][0];
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
