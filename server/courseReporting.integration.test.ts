import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { examResults, questionAttempts, questions, purchases, organizations, teamFlexLicences } from "../drizzle/schema";
import { calculateReadinessSnapshot } from "./readinessSnapshot";
import type { TrpcContext } from "./_core/context";

const suffix = randomUUID();
const email = `reporting-${suffix}@echelon.test`;
const managerEmail = `manager-${suffix}@echelon.test`;
const otherEmail = `other-${suffix}@echelon.test`;
const banks = ["class4-wastewater", "class1-wastewater", "class1-water"];
const ids = Array.from({ length: 100 }, (_, i) => 910001 + i);
const ctx = (email: string): TrpcContext => ({ user: null, studentEmail: email, req: { headers: {}, cookies: {} }, res: {} }) as TrpcContext;
const learner = appRouter.createCaller(ctx(email));
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let orgId: number;
const suite = process.env.DATABASE_URL ? describe : describe.skip;

suite("course reporting from issued mock to learner history and manager readiness", () => {
  beforeAll(async () => {
    const connection = await getDb(); if (!connection) throw new Error("Test database required"); db = connection;
    for (const bankKey of banks) {
      await db.insert(questions).values(ids.map((questionNum, i) => ({ bankKey, questionNum,
        module: "Safety", topic: i % 2 ? "Hydraulics" : "Disinfection", question: `Reporting QA ${questionNum}`,
        options: '["A","B","C","D"]', correctIndex: 0, explanation: "Synthetic reporting QA.", reviewStatus: "approved" as const,
      })));
    }
    for (const productKey of ["class4-ww", "class1-ww", "class1-water"]) {
      await db.insert(purchases).values({ email, productKey, productName: "Reporting QA", amountCAD: 29900, stripeSessionId: `cs_${randomUUID()}` });
    }
    const ends = new Date(Date.now() + 86400_000);
    const [org] = await db.insert(organizations).values({ name: `Reporting QA ${suffix}`, province: "ontario", seatsTotal: 0, managerEmail, termEnd: ends, status: "active" });
    orgId = Number(org.insertId);
    await db.insert(teamFlexLicences).values({ organizationId: orgId, orderItemId: 0, courseKey: "class4-ww", termMonths: 12,
      status: "active", invitedEmail: email, operatorUserId: null, activatedAt: new Date(), accessEndsAt: ends, activationDeadline: ends });
  });
  afterAll(async () => {
    if (!db) return;
    await db.delete(questionAttempts).where(inArray(questionAttempts.studentEmail, [email, otherEmail]));
    await db.delete(examResults).where(inArray(examResults.studentEmail, [email, otherEmail]));
    await db.delete(questions).where(and(inArray(questions.bankKey, banks), inArray(questions.questionNum, ids)));
    await db.delete(purchases).where(eq(purchases.email, email));
    if (orgId) {
      await db.delete(teamFlexLicences).where(eq(teamFlexLicences.organizationId, orgId));
      await db.delete(organizations).where(eq(organizations.id, orgId));
    }
  });

  it("shows an email-only operator's full wastewater mock in history and the manager report", async () => {
    const issued = await learner.exam.startMock({ courseKey: "class4-ww" });
    const submitted = await learner.exam.submitMock({ sessionId: issued.sessionId, sessionToken: issued.token,
      examType: issued.examType, bankKey: "class4-ww",
      answers: issued.questions.map((q, i) => ({ questionNum: q.id, selectedIndex: i < 69 ? 0 : null })) });
    const expectedScore = submitted.review.filter((item, index) => index < 69 && item.correctIndex === 0).length;
    expect(submitted).toMatchObject({ score: expectedScore, total: 100, persisted: true });
    // A different browser session must still see OTP history; an OAuth login
    // with the same verified email must also retain these email-only results.
    const historyInput = { sessionId: randomUUID(), examType: "class4-ww" as const };
    for (const caller of [learner, appRouter.createCaller({ ...ctx(email), user: { id: 1900998, email } as TrpcContext["user"] })]) {
      expect(await caller.exam.getHistory(historyInput)).toEqual([expect.objectContaining({ sessionId: issued.sessionId, score: expectedScore, total: 100, passed: submitted.passed ? "yes" : "no" })]);
    }
    expect(await appRouter.createCaller(ctx(otherEmail)).exam.getHistory(historyInput)).toEqual([]);
    const snapshot = await calculateReadinessSnapshot(db, { userId: null, email, examType: "class4-wastewater" });
    expect(snapshot).toMatchObject({ totalAttempts: 100, correctAttempts: expectedScore, breakdown: { mockAccuracy: expectedScore } });
    expect(snapshot.breakdown.topicCoverage).toBeGreaterThan(0);
    const [row] = await appRouter.createCaller(ctx(managerEmail)).teamFlex.getFlexProgress({ orgId });
    expect(row).toMatchObject({ totalAttempts: 100, accuracy: expectedScore, readinessScore: snapshot.score, daysActive30: 1 });
    expect(row.lastActiveAt).not.toBeNull();
    await expect(appRouter.createCaller(ctx(otherEmail)).teamFlex.getFlexProgress({ orgId })).rejects.toThrow();
    // Topics are persisted from the actual selected questions, not the broad
    // module label. A populated bank can include real rows alongside QA rows.
    const attempts = await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, issued.sessionId));
    expect([...new Set(attempts.map(a => a.topic))]).toEqual(expect.arrayContaining(["Hydraulics", "Disinfection"]));
  });

  it("counts canonical and historical aliases once while excluding other courses and learners", async () => {
    const base = { studentEmail: otherEmail, topic: "Safety", questionId: ids[0], correct: "yes" as const };
    await db.insert(questionAttempts).values([
      { ...base, examType: "class4-ww", courseKey: "class4-ww", bankKey: "class4-ww" },
      { ...base, examType: "class4-wastewater" },
      { ...base, examType: "class4-ww", courseKey: "wpi-class4-wastewater" },
      { ...base, examType: "class4-water" },
      { ...base, examType: "class4-wastewater-coll" },
    ]);
    const snapshot = await calculateReadinessSnapshot(db, { userId: null, email: otherEmail, examType: "class4-ww" });
    expect(snapshot.totalAttempts).toBe(2);
    // One stored topic is recognized despite canonical and historical aliases.
    // The percentage is relative to the live bank's changing topic count.
    expect(snapshot.breakdown.topicCoverage).toBeGreaterThan(0);
    expect(await calculateReadinessSnapshot(db, { userId: null, email: otherEmail, examType: "class4-wastewater" })).toEqual(snapshot);
  });

  it("keeps combined Class 1 history compatible without mixing Water and Wastewater", async () => {
    const legacy = { studentEmail: email, examType: "class1", score: 12, total: 100, passed: "no" as const };
    const waterId = randomUUID(), wwId = randomUUID();
    await db.insert(examResults).values([
      { ...legacy, sessionId: waterId, stream: "water" },
      { ...legacy, sessionId: wwId, stream: "wastewater" },
    ]);
    const issued = await learner.exam.startMock({ courseKey: "class1-ww" });
    await learner.exam.submitMock({ sessionId: issued.sessionId, sessionToken: issued.token, examType: issued.examType, bankKey: "class1-ww",
      answers: issued.questions.map(q => ({ questionNum: q.id, selectedIndex: 0 })) });
    for (const examType of ["class1", "class1-ww"] as const) {
      const history = await learner.exam.getHistory({ sessionId: randomUUID(), examType, stream: "wastewater" });
      expect(history.map(r => r.sessionId).sort()).toEqual([wwId, issued.sessionId].sort());
    }
    for (const examType of ["class1", "class1-water"] as const) {
      const history = await learner.exam.getHistory({ sessionId: randomUUID(), examType, stream: "water" });
      expect(history.map(r => r.sessionId)).toEqual([waterId]);
    }
    const base = { studentEmail: otherEmail, questionId: ids[0], correct: "yes" as const, examType: "class1" };
    await db.insert(questionAttempts).values([
      { ...base, topic: "Water Treatment" }, { ...base, topic: "Wastewater Treatment" },
      { ...base, topic: "Unknown legacy topic" },
    ]);
    expect((await calculateReadinessSnapshot(db, { userId: null, email: otherEmail, examType: "class1-water" })).totalAttempts).toBe(1);
    expect((await calculateReadinessSnapshot(db, { userId: null, email: otherEmail, examType: "class1-ww" })).totalAttempts).toBe(1);
  });
});
