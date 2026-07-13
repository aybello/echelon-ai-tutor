/**
 * Primary Study Focus resolver
 *
 * Determines the single most relevant course for a student's current session.
 * This keeps the dashboard course-specific without requiring the user to pick
 * from a multi-course selector every time.
 *
 * Priority order (MVP):
 *   1. Course with the nearest upcoming exam date (most urgent)
 *   2. Course with the most recent study activity
 *   3. First unlocked course (fallback)
 *   4. None (no entitlements)
 */

import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "../db";
import { examDates, questionAttempts } from "../../drizzle/schema";

export type PrimaryStudyFocus = {
  courseKey: string | null;
  examType: string | null;
  source: "exam_date" | "recent_activity" | "first_unlocked" | "none";
};

export async function resolvePrimaryStudyFocus(input: {
  email: string | null;
  unlockedExamTypes: string[];
}): Promise<PrimaryStudyFocus> {
  const unlocked = input.unlockedExamTypes.filter(Boolean);

  // No entitlements at all
  if (unlocked.length === 0) {
    return { courseKey: null, examType: null, source: "none" };
  }

  // Only one course — no need to query, just return it
  if (unlocked.length === 1) {
    return { courseKey: unlocked[0], examType: unlocked[0], source: "first_unlocked" };
  }

  // No email — can't do DB queries, fall back to first unlocked
  if (!input.email) {
    return { courseKey: unlocked[0], examType: unlocked[0], source: "first_unlocked" };
  }

  const db = await getDb();
  if (!db) {
    return { courseKey: unlocked[0], examType: unlocked[0], source: "first_unlocked" };
  }

  // 1. Upcoming exam date — pick the nearest future exam among unlocked courses
  const now = new Date();
  const upcoming = await db
    .select({
      productKey: examDates.productKey,
      examDate: examDates.examDate,
    })
    .from(examDates)
    .where(
      and(
        eq(examDates.email, input.email),
        inArray(examDates.productKey, unlocked),
        gt(examDates.examDate, now),
      )
    )
    .orderBy(examDates.examDate)
    .limit(1);

  if (upcoming[0]?.productKey) {
    return {
      courseKey: upcoming[0].productKey,
      examType: upcoming[0].productKey,
      source: "exam_date",
    };
  }

  // 2. Most recent study activity — pick the course with the latest attempt
  const recent = await db
    .select({
      examType: questionAttempts.examType,
      lastActive: sql<string>`MAX(${questionAttempts.createdAt})`,
    })
    .from(questionAttempts)
    .where(
      and(
        eq(questionAttempts.studentEmail, input.email),
        inArray(questionAttempts.examType, unlocked),
      )
    )
    .groupBy(questionAttempts.examType)
    .orderBy(desc(sql`MAX(${questionAttempts.createdAt})`))
    .limit(1);

  if (recent[0]?.examType) {
    return {
      courseKey: recent[0].examType,
      examType: recent[0].examType,
      source: "recent_activity",
    };
  }

  // 3. Fallback — first unlocked course
  return {
    courseKey: unlocked[0],
    examType: unlocked[0],
    source: "first_unlocked",
  };
}
