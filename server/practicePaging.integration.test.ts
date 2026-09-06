import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { bookmarks, examResults, questionAttempts, questions, purchases } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const suffix = randomUUID();
const email = `paging-${suffix}@echelon.test`, otherEmail = `other-${suffix}@echelon.test`;
const bankKey = "class3-water-dist";
const module = `Paging ${suffix}`;
const ids = Array.from({ length: 125 }, (_, i) => 930001 + i);
const ctx = (email?: string): TrpcContext => ({ user: null, studentEmail: email ?? null, req: { headers: {}, cookies: {} }, res: {} }) as TrpcContext;
const learner = appRouter.createCaller(ctx(email));
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("practice slices and mock retirement with a real database", () => {
  beforeAll(async () => {
    const connection = await getDb(); if (!connection) throw new Error("Test database required"); db = connection;
    await db.insert(purchases).values({ email, productKey: bankKey, productName: "Paging QA", amountCAD: 29900, stripeSessionId: `cs_${suffix}` });
    await db.insert(questions).values(ids.map((questionNum, i) => ({ bankKey, questionNum,
      module: i < 80 ? module : `${module} rare`, difficulty: i % 2 ? "hard" as const : "easy" as const,
      isCalc: i % 2 ? "yes" as const : "no" as const, question: `Paging QA ${questionNum}`,
      options: '["A","B","C","D"]', correctIndex: 0, explanation: "Synthetic paging QA.", reviewStatus: "approved" as const,
    })));
  });
  afterAll(async () => {
    if (!db) return;
    for (const table of [questionAttempts, bookmarks, examResults]) await db.delete(table).where(inArray(table.studentEmail, [email, otherEmail]));
    await db.delete(questions).where(and(eq(questions.bankKey, bankKey), inArray(questions.questionNum, ids)));
    await db.delete(purchases).where(eq(purchases.email, email));
  });
  it("returns unseen questions from the selected module after the first 50 answers", async () => {
    const first = await learner.quiz.getRandomQuestions({ bankKey, module, limit: 50 });
    expect(first.questions).toHaveLength(50);
    await db.insert(questionAttempts).values(first.questions.map(q => ({ studentEmail: email, examType: bankKey, bankKey, courseKey: bankKey,
      questionId: q.id, correct: "yes" as const, topic: module })));
    const second = await learner.quiz.getRandomQuestions({ bankKey, module, excludeIds: first.questions.map(q => q.id), limit: 50 });
    expect(second.questions).toHaveLength(30);
    expect(new Set([...first.questions, ...second.questions].map(q => q.id)).size).toBe(80);
    expect(second.questions.every(q => q.module === module)).toBe(true);
    expect(second.total).toBe(80);
  });
  it("applies calculation and difficulty filters before sampling, with no unrelated fallback", async () => {
    const result = await learner.quiz.getRandomQuestions({ bankKey, module: `${module} rare`, calcOnly: true, difficulty: "hard" });
    expect(result.questions.length).toBeGreaterThan(10);
    expect(result.questions.every(q => q.module === `${module} rare` && q.isCalc && q.difficulty === "hard")).toBe(true);
    expect((await learner.quiz.getRandomQuestions({ bankKey, module, calcOnly: true, difficulty: "easy" })).questions).toEqual([]);
  });
  it("fetches the actual saved review questions with course, latest-attempt and identity isolation", async () => {
    await db.insert(bookmarks).values([
      { studentEmail: email, bankKey, questionId: ids[120] },
      { studentEmail: otherEmail, bankKey, questionId: ids[121] },
      { studentEmail: email, bankKey: "class4-water-dist", questionId: ids[122] },
    ]);
    const base = { studentEmail: email, examType: bankKey, bankKey, courseKey: bankKey, topic: module };
    await db.insert(questionAttempts).values([
      { ...base, questionId: ids[110], correct: "no", confidence: "low" },
      { ...base, questionId: ids[111], correct: "no", confidence: "low" },
      { ...base, questionId: ids[111], correct: "yes", confidence: "high" },
      { ...base, questionId: ids[112], correct: "yes", confidence: "low" },
      { ...base, studentEmail: otherEmail, questionId: ids[113], correct: "no", confidence: "low" },
      { ...base, courseKey: "class4-water-dist", questionId: ids[114], correct: "no", confidence: "low" },
    ]);
    const get = async (reviewMode: "missed" | "bookmarked" | "low-confidence") =>
      (await learner.quiz.getRandomQuestions({ bankKey, reviewMode })).questions.map(q => q.id).sort();
    expect(await get("bookmarked")).toEqual([ids[120]]);
    expect(await get("missed")).toEqual([ids[110]]);
    expect(await get("low-confidence")).toEqual([ids[110], ids[112]]);
    expect((await learner.quiz.getRandomQuestions({ bankKey, reviewMode: "bookmarked", excludeIds: [ids[120]] })).questions).toEqual([]);
    await expect(appRouter.createCaller(ctx()).quiz.getRandomQuestions({ bankKey, reviewMode: "bookmarked" })).rejects.toThrow("Sign in");
  });
  it("keeps free previews fixed across exclusions, module and calculation changes", async () => {
    const guest = appRouter.createCaller(ctx());
    const preview = await guest.quiz.getRandomQuestions({ bankKey });
    expect(preview.locked).toBe(true);
    expect(preview.questions).toHaveLength(15);
    const remaining = await guest.quiz.getRandomQuestions({ bankKey, excludeIds: preview.questions.map(q => q.id) });
    expect(remaining.questions).toEqual([]);
    const filtered = await guest.quiz.getRandomQuestions({ bankKey, module, calcOnly: true });
    expect(filtered.questions.every(q => preview.questions.some(p => p.id === q.id))).toBe(true);
  });
  it("saves a full mock with retired questions and returns the same score on replay", async () => {
    const issued = await learner.exam.startMock({ courseKey: bankKey });
    expect(issued.questions).toHaveLength(100);
    const retired = issued.questions.slice(0, 2).map(q => q.id);
    try {
      await db.update(questions).set({ reviewStatus: "in_review" }).where(and(eq(questions.bankKey, bankKey), inArray(questions.questionNum, retired)));
      const submission = { sessionId: issued.sessionId, sessionToken: issued.token, examType: issued.examType, bankKey,
        answers: issued.questions.map(q => ({ questionNum: q.id, selectedIndex: 0 })) };
      for (let i = 0; i < 2; i++) expect(await learner.exam.submitMock(submission)).toMatchObject({ score: 98, total: 100, unavailableCount: 2, persisted: true });
      const rows = await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, issued.sessionId));
      expect(rows).toHaveLength(100);
      expect(rows.filter(r => r.correct === "no").map(r => r.questionId).sort()).toEqual(retired.sort());
      expect(await learner.exam.getHistory({ sessionId: randomUUID(), examType: bankKey })).toEqual([
        expect.objectContaining({ score: 98, total: 100, moduleBreakdown: expect.objectContaining({ "Unavailable questions at submission": { correct: 0, total: 2 } }) }),
      ]);
    } finally {
      await db.update(questions).set({ reviewStatus: "approved" }).where(and(eq(questions.bankKey, bankKey), inArray(questions.questionNum, retired)));
    }
  });
});
