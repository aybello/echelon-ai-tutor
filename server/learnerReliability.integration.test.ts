import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { examResults, questionAttempts, questions, purchases, purchaseEmailOutbox } from "../drizzle/schema";
import { recordPurchaseWithConfirmation, deliverPurchaseEmails } from "./purchaseEmailOutbox";
import type { TrpcContext } from "./_core/context";

const email = `reliability-${randomUUID()}@echelon.test`;
const bank = "class4-ww";
const databaseBank = "class4-wastewater";
const ids = Array.from({ length: 100 }, (_, i) => 880001 + i);
const sessions: string[] = [];
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
const ctx = { user: null, studentEmail: email, req: { headers: {}, cookies: {} }, res: {} } as TrpcContext;
const caller = appRouter.createCaller(ctx);
const suite = process.env.DATABASE_URL ? describe : describe.skip;

suite("learner reliability with a real database", () => {
  beforeAll(async () => {
    const connection = await getDb(); if (!connection) throw new Error("Test database required"); db = connection;
    await db.insert(purchases).values({ email, productKey: bank, productName: "Mock integrity QA", amountCAD: 29900, stripeSessionId: `cs_access_${randomUUID()}` });
    await db.insert(questions).values(ids.map(questionNum => ({ bankKey: databaseBank, questionNum,
      module: "Safety", topic: "Safety", question: `QA ${questionNum}`, options: '["A","B","C","D"]',
      correctIndex: 0, explanation: "QA only", reviewStatus: "approved" as const,
    })));
  });
  afterAll(async () => {
    if (!db) return;
    await db.delete(questionAttempts).where(eq(questionAttempts.studentEmail, email));
    await db.delete(examResults).where(eq(examResults.studentEmail, email));
    await db.delete(questions).where(and(eq(questions.bankKey, databaseBank), inArray(questions.questionNum, ids)));
    if (sessions.length) await db.delete(purchaseEmailOutbox).where(inArray(purchaseEmailOutbox.stripeSessionId, sessions));
    await db.delete(purchases).where(eq(purchases.email, email));
  });
  it("saves incomplete exams once across concurrent retries", async () => {
    const issued = await caller.exam.startMock({ courseKey: bank });
    expect(issued.questions).toHaveLength(100);
    const input = { sessionId: issued.sessionId, sessionToken: issued.token, examType: issued.examType, bankKey: bank,
      answers: issued.questions.map((q, i) => ({ questionNum: q.id, selectedIndex: i === 0 ? 0 : null })),
    };
    const results = await Promise.all([caller.exam.submitMock(input), caller.exam.submitMock(input)]);
    for (const result of results) expect(result).toMatchObject({ score: 1, total: 100, passed: false, persisted: true });
    const saved = await db.select().from(examResults).where(eq(examResults.sessionId, input.sessionId));
    const attempts = await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, input.sessionId));
    expect(saved).toHaveLength(1); expect(attempts).toHaveLength(100);
    expect(attempts.filter(row => row.selectedIndex === null)).toHaveLength(99);
  });
  it("rolls back the result if attempt persistence fails", async () => {
    const original = db.transaction.bind(db);
    const spy = vi.spyOn(db, "transaction").mockImplementation(async work => original(async tx => {
      const originalInsert = tx.insert.bind(tx);
      tx.insert = ((table: unknown) => {
        if (table === questionAttempts) throw new Error("Injected attempt failure");
        return originalInsert(table as any);
      }) as typeof tx.insert;
      return work(tx);
    }));
    const issued = await caller.exam.startMock({ courseKey: bank });
    const sessionId = issued.sessionId;
    try {
      await expect(caller.exam.submitMock({ sessionId, sessionToken: issued.token, examType: issued.examType, bankKey: bank,
        answers: issued.questions.map(q => ({ questionNum: q.id, selectedIndex: 0 })) })).rejects.toThrow("Injected attempt failure");
    } finally { spy.mockRestore(); }
    expect(await db.select().from(examResults).where(eq(examResults.sessionId, sessionId))).toHaveLength(0);
  });
  it("rejects a one-question, replaced-question or cross-course submission without database writes", async () => {
    const issued = await caller.exam.startMock({ courseKey: bank });
    const full = { sessionId: issued.sessionId, sessionToken: issued.token, examType: issued.examType, bankKey: bank,
      answers: issued.questions.map(q => ({ questionNum: q.id, selectedIndex: 0 })) };
    await expect(caller.exam.submitMock({ ...full, answers: full.answers.slice(0, 1) })).rejects.toThrow("exactly once");
    await expect(caller.exam.submitMock({ ...full, answers: [...full.answers.slice(0, 99), { questionNum: 999999, selectedIndex: 0 }] })).rejects.toThrow("exactly once");
    await expect(caller.exam.submitMock({ ...full, bankKey: "oit" })).rejects.toThrow("does not match");
    expect(await db.select().from(examResults).where(eq(examResults.sessionId, issued.sessionId))).toHaveLength(0);
    expect(await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, issued.sessionId))).toHaveLength(0);
  });
  it("keeps email delivery pending after SMTP failure and retries without duplicating the purchase", async () => {
    const stripeSessionId = `cs_${randomUUID()}`; sessions.push(stripeSessionId);
    await recordPurchaseWithConfirmation(db, { email, productKey: "oit", productName: "OIT QA", amountCAD: 4900, stripeSessionId });
    const originalPurchases = await db.select().from(purchases).where(eq(purchases.stripeSessionId, stripeSessionId));
    expect(originalPurchases).toHaveLength(1);
    const send = vi.fn().mockRejectedValueOnce(new Error("SMTP down")).mockResolvedValue(undefined);
    await deliverPurchaseEmails(db, send, new Date(), stripeSessionId);
    const [pending] = await db.select().from(purchaseEmailOutbox).where(eq(purchaseEmailOutbox.stripeSessionId, stripeSessionId));
    expect(pending).toMatchObject({ status: "pending", attempts: 1 });
    expect(await db.select().from(purchases).where(eq(purchases.stripeSessionId, stripeSessionId))).toEqual(originalPurchases);
    await deliverPurchaseEmails(db, send, new Date(Date.now() + 5 * 60_000), stripeSessionId);
    const [sent] = await db.select().from(purchaseEmailOutbox).where(eq(purchaseEmailOutbox.stripeSessionId, stripeSessionId));
    expect(sent).toMatchObject({ status: "sent", attempts: 2 });
    await deliverPurchaseEmails(db, send, new Date(Date.now() + 6 * 60_000), stripeSessionId);
    expect(send).toHaveBeenCalledTimes(2);
    expect(await db.select().from(purchases).where(eq(purchases.stripeSessionId, stripeSessionId))).toEqual(originalPurchases);
    expect(await db.select().from(purchaseEmailOutbox).where(eq(purchaseEmailOutbox.stripeSessionId, stripeSessionId))).toHaveLength(1);
  });
  it("keeps account study recommendations scoped to the selected course", async () => {
    const userId = 1900991;
    await db.insert(questionAttempts).values(Array.from({ length: 5 }, (_, i) => ({
      userId: null, studentEmail: email, examType: bank, topic: "Selected course weakness",
      questionId: i + 1, correct: "no" as const,
    })));
    await db.insert(questionAttempts).values(Array.from({ length: 5 }, (_, i) => ({
      userId, studentEmail: email, examType: "other-course", topic: "Other course weakness",
      questionId: i + 1, correct: "no" as const,
    })));
    const account = appRouter.createCaller({ ...ctx, user: { id: userId, email } as TrpcContext["user"] });
    const plan = await account.dashboard.studyPlan({ examType: bank });
    expect(plan?.recommendations.some(row => row.title === "Practice: Selected course weakness")).toBe(true);
    expect(plan?.recommendations.some(row => row.title.includes("Other course weakness"))).toBe(false);
  });
  it("does not let another learner overwrite an existing session", async () => {
    const issued = await caller.exam.startMock({ courseKey: bank });
    const input = { sessionId: issued.sessionId, sessionToken: issued.token, examType: issued.examType, bankKey: bank,
      answers: issued.questions.map(q => ({ questionNum: q.id, selectedIndex: 0 })) };
    await caller.exam.submitMock(input);
    const other = appRouter.createCaller({ ...ctx, studentEmail: `other-${email}` });
    await expect(other.exam.submitMock(input)).rejects.toThrow("another learner");
  });
});
