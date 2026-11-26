import { and, eq, isNull, or, sql } from "drizzle-orm";
import { questionAttempts, studentProfiles } from "../drizzle/schema";
import { attemptCourseFilter, attemptIdentityFilter } from "./courseActivityScope";
import type { getDb } from "./db";
import { resolveProfileOwner } from "./learnerProfileOwner";

export function buildCourseLearnerProfile(rows: Array<{ topic: string; correct: number; total: number }>, totalSessions = 0) {
  const topicAccuracy: Record<string, { correct: number; total: number }> = {};
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const row of rows) {
    const correct = Number(row.correct), total = Number(row.total);
    topicAccuracy[row.topic] = { correct, total };
    if (total >= 5 && correct / total < 0.65) weakTopics.push(row.topic);
    else if (total >= 5 && correct / total >= 0.8) strongTopics.push(row.topic);
  }
  return { topicAccuracy, weakTopics, strongTopics,
    totalAttempts: Object.values(topicAccuracy).reduce((total, row) => total + row.total, 0),
    totalSessions: Number(totalSessions) };
}

/** The legacy profile is unique by identity, not course. Never use that mixed
 * cache as course mastery. Read the existing ledger; do not relabel old rows. */
export async function readCourseLearnerProfile(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  identity: { userId: number | null; email: string | null },
  courseKey: string,
) {
  const scope = and(attemptIdentityFilter(identity.userId, identity.email), attemptCourseFilter(courseKey));
  const rows = await db.select({ topic: questionAttempts.topic, total: sql<number>`COUNT(*)`,
    correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
  }).from(questionAttempts).where(scope).groupBy(questionAttempts.topic);
  // Match recentSessions: explicit groups include exam/mode; legacy-only rows
  // form consecutive same-exam runs with gaps strictly below 30 minutes.
  // Window the scoped legacy ledger in SQL, not an unbounded JS history load.
  const [sessions] = await db.select({ total: sql<number>`
    COALESCE(MAX((SELECT COUNT(*) FROM (SELECT ${questionAttempts.sessionId}
      FROM ${questionAttempts} WHERE ${scope} AND ${questionAttempts.sessionId} IS NOT NULL
      GROUP BY ${questionAttempts.sessionId}, ${questionAttempts.examType}, ${questionAttempts.quizMode}
    ) AS explicit_activity)
    + (SELECT COUNT(*) FROM (
      SELECT ${questionAttempts.examType} AS examType, ${questionAttempts.createdAt} AS createdAt,
        LAG(${questionAttempts.examType}) OVER (ORDER BY ${questionAttempts.createdAt}, ${questionAttempts.id}) AS previousExam,
        LAG(${questionAttempts.createdAt}) OVER (ORDER BY ${questionAttempts.createdAt}, ${questionAttempts.id}) AS previousAt
      FROM ${questionAttempts} WHERE ${scope} AND ${questionAttempts.sessionId} IS NULL
    ) AS legacy_activity WHERE previousAt IS NULL OR examType <> previousExam
      OR TIMESTAMPDIFF(MICROSECOND, previousAt, createdAt) >= 1800000000)), 0)` })
    .from(questionAttempts).where(scope);
  return buildCourseLearnerProfile(rows, sessions?.total ?? 0);
}

/** Overall activity is still maintained by the existing practice updater.
 * Read only its activity fields; never relabel mixed mastery as course memory.
 * Callers must supply server-verified identity; email fallback is restricted to unowned legacy profiles. */
export async function readOverallLearnerActivity(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  identity: { userId: number | null; email: string | null },
) {
  const { userId, email } = await resolveProfileOwner(db, identity);
  const exactUser = userId ? eq(studentProfiles.userId, userId) : undefined;
  const legacyEmail = email ? and(eq(studentProfiles.studentEmail, email), isNull(studentProfiles.userId)) : undefined;
  const [profile] = await db.select({ currentStreak: studentProfiles.currentStreak,
    longestStreak: studentProfiles.longestStreak, totalSessions: studentProfiles.totalSessions,
  }).from(studentProfiles).where(or(exactUser, legacyEmail))
    .orderBy(sql`CASE WHEN ${exactUser ?? sql`FALSE`} THEN 0 ELSE 1 END`, studentProfiles.id).limit(1);
  return { currentStreak: Number(profile?.currentStreak ?? 0),
    longestStreak: Number(profile?.longestStreak ?? 0), totalSessions: Number(profile?.totalSessions ?? 0) };
}
