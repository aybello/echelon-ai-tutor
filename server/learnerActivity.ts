import { sql } from "drizzle-orm";
import { studentProfiles } from "../drizzle/schema";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Called only after the unique diagnostic UUID insert, in that same transaction.
 * Practice uses Toronto calendar days too; UTC midnight must not split a streak. */
export async function recordDiagnosticActivity(
  tx: Transaction,
  identity: { userId: number | null; studentEmail: string | null },
  courseKey: string,
  completedAt: Date,
) {
  if (!identity.userId && !identity.studentEmail) throw new Error("A verified learner identity is required");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(completedAt);
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const nextStreak = sql`CASE
    WHEN ${studentProfiles.lastActiveDate} = ${today} THEN ${studentProfiles.currentStreak}
    WHEN ${studentProfiles.lastActiveDate} = ${yesterday.toISOString().slice(0, 10)} THEN ${studentProfiles.currentStreak} + 1
    ELSE 1 END`;
  await tx.insert(studentProfiles).values({
    userId: identity.userId,
    // Match practice's OAuth-first profile key; do not merge historical identities.
    studentEmail: identity.userId ? null : identity.studentEmail!.trim().toLowerCase(),
    examType: courseKey,
    topicAccuracy: "{}", weakTopics: "[]", strongTopics: "[]",
    totalSessions: 1, currentStreak: 1, longestStreak: 1, lastActiveDate: today,
  }).onDuplicateKeyUpdate({ set: {
    // MySQL evaluates assignments left-to-right: longest must use the old streak.
    longestStreak: sql`GREATEST(${studentProfiles.longestStreak}, ${nextStreak})`,
    currentStreak: nextStreak,
    totalSessions: sql`${studentProfiles.totalSessions} + 1`,
    lastActiveDate: today,
  } });
}
