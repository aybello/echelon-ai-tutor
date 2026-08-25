import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { questionAttempts, questions } from "../drizzle/schema";
import { getDb } from "./db";
import { computeReadiness } from "./_core/readiness";
import { learnerVisibleQuestionFilter } from "./questionGovernance";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export interface ReadinessSnapshotInput {
  userId: number | null;
  email: string | null;
  examType: string;
  now?: Date;
}

/**
 * Canonical learner readiness snapshot. Both learner outcome capture and the
 * learner dashboard use this server-owned calculation so a browser cannot
 * submit or alter the score paired with an official result.
 */
export async function calculateReadinessSnapshot(db: Database, input: ReadinessSnapshotInput) {
  if (!input.userId && !input.email) throw new Error("A verified learner identity is required");
  const normalizedEmail = input.email?.trim().toLowerCase() ?? null;
  const identityWhere = input.userId && normalizedEmail
    ? or(
        eq(questionAttempts.userId, input.userId),
        eq(questionAttempts.studentEmail, normalizedEmail),
      )
    : input.userId
      ? eq(questionAttempts.userId, input.userId)
      : eq(questionAttempts.studentEmail, normalizedEmail!);

  const now = input.now ?? new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [recentRows, mockRows, bankTopicRows, recentActivityRows] = await Promise.all([
    db.select({
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      activeDays: sql<number>`COUNT(DISTINCT DATE(${questionAttempts.createdAt}))`,
      distinctTopics: sql<number>`COUNT(DISTINCT ${questionAttempts.topic})`,
    }).from(questionAttempts).where(and(
      identityWhere,
      gte(questionAttempts.createdAt, thirtyDaysAgo),
      eq(questionAttempts.examType, input.examType),
    )),
    db.select({
      sessionId: questionAttempts.sessionId,
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
    }).from(questionAttempts).where(and(
      identityWhere,
      eq(questionAttempts.quizMode, "mock"),
      eq(questionAttempts.examType, input.examType),
    )).groupBy(questionAttempts.sessionId)
      .orderBy(desc(sql`MAX(${questionAttempts.createdAt})`))
      .limit(3),
    db.select({ count: sql<number>`COUNT(DISTINCT ${questions.topic})` })
      .from(questions)
      .where(and(
        eq(questions.bankKey, input.examType),
        learnerVisibleQuestionFilter(),
      )),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(questionAttempts)
      .where(and(
        identityWhere,
        gte(questionAttempts.createdAt, fourteenDaysAgo),
        eq(questionAttempts.examType, input.examType),
      )),
  ]);

  const recent = recentRows[0];
  const totalAttempts = Number(recent?.total ?? 0);
  const correctAttempts = Number(recent?.correct ?? 0);
  const activeDaysLast30 = Number(recent?.activeDays ?? 0);
  const topicsAttempted = Number(recent?.distinctTopics ?? 0);
  const totalTopics = Math.max(Number(bankTopicRows[0]?.count ?? 1), 1);
  const mockTotal = mockRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const mockCorrect = mockRows.reduce((sum, row) => sum + Number(row.correct ?? 0), 0);
  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
  const mockAccuracy = mockTotal > 0 ? mockCorrect / mockTotal : 0;
  const activeRecently = Number(recentActivityRows[0]?.count ?? 0) > 0;
  const result = computeReadiness({
    accuracy,
    totalAttempts,
    mockAccuracy,
    topicsAttempted,
    totalTopics,
    activeDaysLast30,
    activeRecently,
  });

  return {
    ...result,
    hasData: totalAttempts > 0,
    totalAttempts,
    correctAttempts,
    activeDaysLast30,
    breakdown: {
      recentAccuracy: Math.round(accuracy * 100),
      mockAccuracy: Math.round(mockAccuracy * 100),
      topicCoverage: Math.round(Math.min(topicsAttempted / totalTopics, 1) * 100),
      studyFrequency: Math.round(Math.min(activeDaysLast30 / 20, 1) * 100),
      recentBonus: activeRecently,
    },
  };
}
