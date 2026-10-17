import { and, eq, sql } from "drizzle-orm";
import { questions, questionAttempts } from "../drizzle/schema";
import { attemptCourseFilter, attemptIdentityFilter, courseActivityScope } from "./courseActivityScope";
import { learnerVisibleQuestionFilter } from "./questionGovernance";
import type { getDb } from "./db";

type Identity = { userId: number | null; email: string | null };

/** Shared by delivery and plan counts: newest timestamp, then newest row ID. */
export function latestPracticeAttemptValue(identity: Identity, courseKey: string, field: "correct" | "confidence") {
  const scope = and(attemptIdentityFilter(identity.userId, identity.email), attemptCourseFilter(courseKey),
    eq(questionAttempts.questionId, questions.questionNum));
  return sql`(SELECT ${questionAttempts[field]} FROM ${questionAttempts}
    WHERE ${scope} ORDER BY ${questionAttempts.createdAt} DESC, ${questionAttempts.id} DESC LIMIT 1)`;
}

/** Count eligible questions, not historical misses or hidden/removed content. */
export async function readPracticeReviewCounts(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>, identity: Identity, courseKey: string,
) {
  const { course } = courseActivityScope(courseKey);
  const [counts] = await db.select({
    missed: sql<number>`COALESCE(SUM(CASE WHEN ${latestPracticeAttemptValue(identity, course.courseKey, "correct")} = 'no' THEN 1 ELSE 0 END), 0)`,
    lowConfidence: sql<number>`COALESCE(SUM(CASE WHEN ${latestPracticeAttemptValue(identity, course.courseKey, "confidence")} = 'low' THEN 1 ELSE 0 END), 0)`,
  }).from(questions).where(and(eq(questions.bankKey, course.questionBankKey), learnerVisibleQuestionFilter()));
  return { totalMissed: Number(counts?.missed ?? 0), totalLowConf: Number(counts?.lowConfidence ?? 0) };
}
