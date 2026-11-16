/**
 * Gathers the inputs for the "What next" suggestion (shared/nextStep.ts) from data that already exists:
 * streaks, answered questions, missed questions, exam dates and mock exam results.
 * It reads only. It writes nothing.
 */
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { examDates, examResults, questionAttempts, questions } from "../drizzle/schema";
import { readOverallLearnerActivity } from "./courseLearnerProfile";
import { attemptCourseFilter, attemptIdentityFilter, courseActivityScope, examCourseFilter } from "./courseActivityScope";
import { normalizeWpiClass4Module, WPI_CLASS4_BANK } from "./mockBlueprint";
import { readPracticeReviewCounts } from "./practiceReviewEligibility";
import type { getDb } from "./db";
import type { NextStepInput } from "../shared/nextStep";

const DAY_MS = 24 * 60 * 60 * 1000;
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type LearnerIdentity = { userId: number | null; email: string | null };

/**
 * The start of the learner's own calendar day, as an instant. `timezoneOffsetMinutes` is the value of
 * the browser's `Date.getTimezoneOffset()`: minutes to add to local time to get UTC (Toronto in winter is 300).
 */
export function startOfLearnerDay(now: Date, timezoneOffsetMinutes: number): Date {
  const local = new Date(now.getTime() - timezoneOffsetMinutes * 60_000);
  const localMidnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(localMidnightAsUtc + timezoneOffsetMinutes * 60_000);
}

/** Whole calendar days from the learner's today to the saved exam date. Negative once the date has passed. */
export function calendarDaysUntil(examDate: Date | string, now: Date, timezoneOffsetMinutes: number): number {
  const raw = examDate instanceof Date ? examDate.toISOString() : String(examDate);
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  const local = new Date(now.getTime() - timezoneOffsetMinutes * 60_000);
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / DAY_MS);
}

/** Whole days between a past instant and now, never negative. */
export function wholeDaysSince(then: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / DAY_MS));
}

export async function gatherNextStepInput(
  db: Db, identity: LearnerIdentity, courseKey: string,
  options: { now?: Date; timezoneOffsetMinutes?: number } = {},
): Promise<NextStepInput> {
  const now = options.now ?? new Date();
  const offset = options.timezoneOffsetMinutes ?? 0;
  const { course } = courseActivityScope(courseKey);
  const identityWhere = attemptIdentityFilter(identity.userId, identity.email);

  // Streak and whether today already counts. Streaks are overall, not per course.
  const activity = await readOverallLearnerActivity(db, identity);
  const [today] = await db.select({ total: sql<number>`COUNT(*)` }).from(questionAttempts)
    .where(and(identityWhere, gte(questionAttempts.createdAt, startOfLearnerDay(now, offset))));
  const practisedToday = Number(today?.total ?? 0) > 0;

  // Missed questions: the same eligibility the Missed Questions quiz uses.
  const { totalMissed } = await readPracticeReviewCounts(db, identity, course.courseKey);

  // Module accuracy for this course. The 309A course keeps its own flow and is not scored here.
  let modules: NextStepInput["modules"] = [];
  if (course.courseKey !== "electrician-309a") {
    const rows = await db.select({
      module: questions.module,
      attempts: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
    }).from(questionAttempts)
      .innerJoin(questions, and(eq(questions.bankKey, course.questionBankKey), eq(questions.questionNum, questionAttempts.questionId)))
      .where(and(identityWhere, attemptCourseFilter(course.courseKey)))
      .groupBy(questions.module);
    const merged = new Map<string, { attempts: number; correct: number }>();
    for (const r of rows) {
      const name = course.questionBankKey === WPI_CLASS4_BANK ? normalizeWpiClass4Module(r.module) : r.module;
      const entry = merged.get(name) ?? { attempts: 0, correct: 0 };
      entry.attempts += Number(r.attempts); entry.correct += Number(r.correct ?? 0);
      merged.set(name, entry);
    }
    modules = [...merged].map(([name, v]) => ({ name, ...v }));
  }

  // The nearest upcoming exam saved for this course.
  let daysUntilExam: number | null = null;
  if (identity.email) {
    const [exam] = await db.select().from(examDates)
      .where(and(eq(examDates.email, identity.email.trim().toLowerCase()),
        or(eq(examDates.courseKey, course.courseKey), eq(examDates.productKey, course.courseKey)),
        gte(examDates.examDate, new Date(startOfLearnerDay(now, offset).getTime() - DAY_MS))))
      .orderBy(examDates.examDate).limit(1);
    if (exam) {
      const days = calendarDaysUntil(exam.examDate, now, offset);
      if (days >= 0) daysUntilExam = days;
    }
  }

  // The most recent finished mock exam in this course.
  let daysSinceLastMock: number | null = null;
  const mockOwner = or(
    identity.userId ? eq(examResults.userId, identity.userId) : undefined,
    identity.email ? eq(examResults.studentEmail, identity.email.trim().toLowerCase()) : undefined,
  );
  if (mockOwner) {
    const [mock] = await db.select({ createdAt: examResults.createdAt }).from(examResults)
      .where(and(mockOwner, examCourseFilter(course.courseKey)))
      .orderBy(desc(examResults.createdAt)).limit(1);
    if (mock) daysSinceLastMock = wholeDaysSince(mock.createdAt, now);
  }

  return {
    currentStreakDays: activity.currentStreak,
    practisedToday,
    missedQuestionCount: totalMissed,
    modules,
    daysUntilExam,
    daysSinceLastMock,
  };
}
