import { eq } from "drizzle-orm";
import { studentProfiles } from "../drizzle/schema";
import type { getDb } from "./db";
import { materializeLearnerProfile } from "./learnerProfileOwner";

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
  const profile = await materializeLearnerProfile(tx, { userId: identity.userId, email: identity.studentEmail }, courseKey);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(completedAt);
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const currentStreak = profile.lastActiveDate === today ? profile.currentStreak
    : profile.lastActiveDate === yesterday.toISOString().slice(0, 10) ? profile.currentStreak + 1 : 1;
  // Compute from the locked row, independent of Drizzle schema column ordering
  // and MySQL's left-to-right assignment evaluation.
  await tx.update(studentProfiles).set({
    currentStreak, longestStreak: Math.max(profile.longestStreak, currentStreak),
    totalSessions: profile.totalSessions + 1, lastActiveDate: today,
  }).where(eq(studentProfiles.id, profile.id));
}
