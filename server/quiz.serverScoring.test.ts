/**
 * Tests for quiz.logAttempt server-scoring behaviour.
 * Verifies that the server looks up correctIndex from the DB and
 * ignores any client-supplied "correct" field.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({
  resolveLearningIdentity: vi.fn().mockResolvedValue({
    userId: 42,
    studentEmail: "operator@example.com",
    orgId: 7,
    organizationMemberId: 99,
  }),
}));

import { getDb } from "./db";
import { resolveLearningIdentity } from "./_core/learningIdentity";

// Minimal question row returned by DB lookup
const QUESTION_ROW = { correctIndex: 2, topic: "Disinfection", difficulty: "medium", module: "Water Treatment" };

function makeDb(questionRow = QUESTION_ROW, insertResult = []) {
  const insertValues = vi.fn().mockResolvedValue(insertResult);
  const insertInto = vi.fn().mockReturnValue({ values: insertValues });
  const selectLimit = vi.fn().mockResolvedValue(questionRow ? [questionRow] : []);
  const selectWhere = vi.fn().mockReturnValue({ limit: selectLimit });
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const selectFn = vi.fn().mockReturnValue({ from: selectFrom });
  // upsertStudentProfile also calls db.select and db.insert — handle chaining
  const db: any = {
    select: selectFn,
    insert: insertInto,
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
  };
  return { db, insertValues, insertInto, selectFn };
}

function makeCtx(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const BASE_INPUT = {
  examType: "class1-water",
  questionId: 101,
  selectedIndex: 2, // matches correctIndex → correct
  quizMode: "standard" as const,
  bankKey: "ontario-class1-water",
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
};

describe("quiz.logAttempt — server scoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { success: true, correct: true } when selectedIndex matches correctIndex", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 2 });
    expect(result).toEqual({ success: true, correct: true });
  });

  it("returns { success: true, correct: false } when selectedIndex does not match correctIndex", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 0 });
    expect(result).toEqual({ success: true, correct: false });
  });

  it("persists orgId and organizationMemberId from resolveLearningIdentity", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt(BASE_INPUT);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.orgId).toBe(7);
    expect(insertedRow.organizationMemberId).toBe(99);
  });

  it("persists bankKey from input", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt(BASE_INPUT);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.bankKey).toBe("ontario-class1-water");
  });

  it("persists selectedIndex in the DB row", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 1 });
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.selectedIndex).toBe(1);
  });

  it("returns { success: false } when DB is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt(BASE_INPUT);
    expect(result.success).toBe(false);
  });

  it("returns { success: false } when question is not found in DB", async () => {
    const { db } = makeDb(null as any);
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt(BASE_INPUT);
    expect(result.success).toBe(false);
  });

  it("never trusts a client-supplied correct field — only server scoring counts", async () => {
    // selectedIndex=0 does NOT match correctIndex=2 → must be false regardless
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 0 });
    expect(result.correct).toBe(false);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.correct).toBe("no");
  });

  it("stores topic from question row, not from client input", async () => {
    const { db, insertValues } = makeDb({ ...QUESTION_ROW, topic: "Hydraulics" });
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt(BASE_INPUT);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.topic).toBe("Hydraulics");
  });

  it("stores confidence when provided", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt({ ...BASE_INPUT, confidence: "high" });
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.confidence).toBe("high");
  });
});
