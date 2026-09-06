import { and, desc, eq, gte, sql } from "drizzle-orm";
import { questionAttempts, questions } from "../drizzle/schema";
import { getDb } from "./db";
import { computeReadiness } from "./_core/readiness";
import { learnerVisibleQuestionFilter } from "./questionGovernance";
import { attemptCourseFilter, attemptIdentityFilter, courseActivityScope } from "./courseActivityScope";

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
  const identityWhere = attemptIdentityFilter(input.userId, input.email);
  const courseWhere = attemptCourseFilter(input.examType);
  const { course } = courseActivityScope(input.examType);

  const now = input.now ?? new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [recentRows, mockRows, bankTopicRows, recentActivityRows, coveredTopicRows] = await Promise.all([
    db.select({
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      activeDays: sql<number>`COUNT(DISTINCT DATE(${questionAttempts.createdAt}))`,
    }).from(questionAttempts).where(and(
      identityWhere,
      gte(questionAttempts.createdAt, thirtyDaysAgo),
      courseWhere,
    )),
    db.select({
      sessionId: questionAttempts.sessionId,
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
    }).from(questionAttempts).where(and(
      identityWhere,
      eq(questionAttempts.quizMode, "mock"),
      courseWhere,
    )).groupBy(questionAttempts.sessionId)
      .orderBy(desc(sql`MAX(${questionAttempts.createdAt})`))
      .limit(3),
    db.select({ count: sql<number>`COUNT(DISTINCT COALESCE(NULLIF(${questions.topic}, ''), ${questions.module}))` })
      .from(questions)
      .where(and(
        eq(questions.bankKey, course.questionBankKey),
        learnerVisibleQuestionFilter(),
      )),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(questionAttempts)
      .where(and(
        identityWhere,
        gte(questionAttempts.createdAt, fourteenDaysAgo),
        courseWhere,
      )),
    // Resolve historical mock modules back to actual bank topics. questionNum
    // is unique within a bank, so aliases do not multiply attempts or coverage.
    db.select({ count: sql<number>`COUNT(DISTINCT COALESCE(NULLIF(${questions.topic}, ''), ${questions.module}))` })
      .from(questionAttempts)
      .innerJoin(questions, and(
        eq(questions.questionNum, questionAttempts.questionId),
        eq(questions.bankKey, course.questionBankKey),
      ))
      .where(and(identityWhere, courseWhere,
        gte(questionAttempts.createdAt, thirtyDaysAgo), learnerVisibleQuestionFilter())),
  ]);

  const recent = recentRows[0];
  const totalAttempts = Number(recent?.total ?? 0);
  const correctAttempts = Number(recent?.correct ?? 0);
  const activeDaysLast30 = Number(recent?.activeDays ?? 0);
  const topicsAttempted = Number(coveredTopicRows[0]?.count ?? 0);
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
