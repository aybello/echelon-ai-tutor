import { and, eq, isNull, sql } from "drizzle-orm";
import { studentProfiles, users } from "../drizzle/schema";
import type { getDb } from "./db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Only server-verified identity may reach this boundary. OAuth always wins. */
export async function resolveProfileOwner(db: Pick<Database, "select">, identity: { userId: number | null; email: string | null }) {
  const email = identity.email?.trim().toLowerCase() || null;
  let userId = identity.userId;
  if (!userId && !email) throw new Error("A verified learner identity is required");
  if (!userId && email) {
    const [user] = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, email)).orderBy(users.id).limit(1);
    userId = user?.id ?? null;
  }
  return { userId, email };
}

/** Seed only activity, only on INSERT. Keep original ownership/history and mixed
 * mastery untouched. The unique identity upsert locks the destination; a locking
 * read of the unowned legacy source serializes simultaneous first writers. */
export async function materializeLearnerProfile(tx: Transaction, identity: { userId: number | null; email: string | null }, examType: string) {
  const owner = await resolveProfileOwner(tx, identity);
  // Discover without locking a missing email range: gap locks on an absent
  // source can deadlock concurrent first inserts. Revalidate any source under
  // a current locking read; destination uniqueness serializes the no-source case.
  const [candidate] = owner.userId && owner.email
    ? await tx.select().from(studentProfiles)
      .where(and(eq(studentProfiles.studentEmail, owner.email), isNull(studentProfiles.userId)))
      .limit(1) : [];
  const [legacy] = candidate ? await tx.select().from(studentProfiles)
    .where(and(eq(studentProfiles.id, candidate.id), isNull(studentProfiles.userId),
      eq(studentProfiles.studentEmail, owner.email!))).limit(1).for("update") : [];
  await tx.insert(studentProfiles).values({
    userId: owner.userId, studentEmail: owner.userId ? null : owner.email, examType,
    topicAccuracy: "{}", weakTopics: "[]", strongTopics: "[]",
    ...(legacy ? { currentStreak: legacy.currentStreak, longestStreak: legacy.longestStreak,
      totalSessions: legacy.totalSessions, lastActiveDate: legacy.lastActiveDate } : {}),
  }).onDuplicateKeyUpdate({ set: { id: sql`${studentProfiles.id}` } });
  const scope = owner.userId ? eq(studentProfiles.userId, owner.userId)
    : and(eq(studentProfiles.studentEmail, owner.email!), isNull(studentProfiles.userId));
  const [profile] = await tx.select().from(studentProfiles).where(scope).limit(1).for("update");
  if (!profile) throw new Error("Learner profile unavailable");
  return profile;
}
