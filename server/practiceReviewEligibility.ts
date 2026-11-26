import { and, eq, sql, type AnyColumn } from "drizzle-orm";
import { questions, questionAttempts, certificationQuestions, certificationBankVersions } from "../drizzle/schema";
import { ELECTRICIAN_309A_PROGRAM_KEY } from "../shared/certificationPrograms";
import { attemptCourseFilter, attemptIdentityFilter, courseActivityScope } from "./courseActivityScope";
import { learnerVisibleQuestionFilter } from "./questionGovernance";
import type { getDb } from "./db";

type Identity = { userId: number | null; email: string | null };

/** Shared by delivery and plan counts: newest timestamp, then newest row ID. */
export function latestPracticeAttemptValue(
  identity: Identity, courseKey: string, field: "correct" | "confidence",
  questionNumber: AnyColumn = questions.questionNum,
) {
  const scope = and(attemptIdentityFilter(identity.userId, identity.email), attemptCourseFilter(courseKey),
    eq(questionAttempts.questionId, questionNumber));
  return sql`(SELECT ${questionAttempts[field]} FROM ${questionAttempts}
    WHERE ${scope} ORDER BY ${questionAttempts.createdAt} DESC, ${questionAttempts.id} DESC LIMIT 1)`;
}

/** Count eligible questions, not historical misses or hidden/removed content. */
export async function readPracticeReviewCounts(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>, identity: Identity, courseKey: string,
) {
  const { course } = courseActivityScope(courseKey);
  const certification = course.courseKey === "electrician-309a";
  // Certification clients receive bankItemNumber, never the database row ID.
  const questionNumber = certification ? certificationQuestions.bankItemNumber : questions.questionNum;
  const fields = {
    missed: sql<number>`COALESCE(SUM(CASE WHEN ${latestPracticeAttemptValue(identity, course.courseKey, "correct", questionNumber)} = 'no' THEN 1 ELSE 0 END), 0)`,
    lowConfidence: sql<number>`COALESCE(SUM(CASE WHEN ${latestPracticeAttemptValue(identity, course.courseKey, "confidence", questionNumber)} = 'low' THEN 1 ELSE 0 END), 0)`,
  };
  const [counts] = certification
    ? await db.select(fields).from(certificationQuestions)
      .innerJoin(certificationBankVersions, eq(certificationQuestions.bankVersionId, certificationBankVersions.id))
      // Keep the same public beta eligibility as quizRouter.logAttempt.
      .where(and(eq(certificationBankVersions.programKey, ELECTRICIAN_309A_PROGRAM_KEY),
        eq(certificationBankVersions.bankKey, course.questionBankKey),
        eq(certificationBankVersions.releaseChannel, "beta"), eq(certificationBankVersions.active, true),
        eq(certificationBankVersions.commercialEligibility, false), eq(certificationBankVersions.teamEligibility, false),
        eq(certificationQuestions.contentStatus, "beta_approved"), eq(certificationQuestions.publicEligibility, true)))
    : await db.select(fields).from(questions)
      .where(and(eq(questions.bankKey, course.questionBankKey), learnerVisibleQuestionFilter()));
  return { totalMissed: Number(counts?.missed ?? 0), totalLowConf: Number(counts?.lowConfidence ?? 0) };
}
