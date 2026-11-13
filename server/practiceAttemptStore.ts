import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { questionAttempts, studentProfiles, type InsertQuestionAttempt } from "../drizzle/schema";
import type { getDb } from "./db";
import { materializeLearnerProfile } from "./learnerProfileOwner";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Credentials are revalidated by the caller, never used as persistence authority.
 * Bind the operation to the issued actor and exact submitted learning payload.
 * Access tokens may rotate; the original signed question receipt may not. */
export function practiceOperationHash(owner: string, input: {
  examType: string; bankKey: string; questionId: number; selectedIndex: number;
  quizMode: string; sessionId?: string | null; confidence?: string | null;
  bookmarked?: boolean; attemptToken?: string;
}) {
  return createHash("sha256").update(JSON.stringify([
    owner, input.examType, input.bankKey, input.questionId, input.selectedIndex,
    input.quizMode, input.sessionId ?? null, input.confidence ?? null,
    input.bookmarked ?? false, input.attemptToken ?? null,
  ])).digest("hex");
}

function duplicateKey(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; errno?: number; cause?: unknown };
  return e.code === "ER_DUP_ENTRY" || e.errno === 1062 || (e.cause !== error && duplicateKey(e.cause));
}

/** Call only AFTER current receipt, access, question governance and attribution checks. */
export async function savePracticeAttempt(db: Database, attempt: InsertQuestionAttempt): Promise<{ success: boolean; correct?: boolean }> {
  const savedOperation = async () => {
    if (!attempt.operationId) return null;
    const [saved] = await db.select({ operationPayloadHash: questionAttempts.operationPayloadHash, correct: questionAttempts.correct })
      .from(questionAttempts).where(eq(questionAttempts.operationId, attempt.operationId)).limit(1);
    if (!saved) return null;
    // Do not disclose even correctness for another actor or a changed payload.
    return saved.operationPayloadHash && saved.operationPayloadHash === attempt.operationPayloadHash
      ? { success: true, correct: saved.correct === "yes" } : { success: false };
  };
  const existing = await savedOperation();
  if (existing) return existing;
  try {
    return await db.transaction(async tx => {
      // A plain unique insert is intentional: concurrent duplicates wait for the
      // winner, then roll back their entire transaction before reading its ack.
      await tx.insert(questionAttempts).values(attempt);
      await updateStudentProfile(tx, attempt.userId ?? null, attempt.studentEmail ?? null,
        attempt.examType, attempt.topic, attempt.correct === "yes");
      return { success: true, correct: attempt.correct === "yes" };
    });
  } catch (error) {
    // Drizzle wraps mysql2's duplicate errors in cause. Never acknowledge a
    // general failure or a partially updated profile; the transaction rolled back.
    if (attempt.operationId && duplicateKey(error)) {
      const saved = await savedOperation();
      if (saved) return saved;
    }
    throw error;
  }
}

async function updateStudentProfile(tx: Transaction, userId: number | null, studentEmail: string | null,
  examType: string, topic: string, correct: boolean) {
  const profile = await materializeLearnerProfile(tx, { userId, email: studentEmail }, examType);
  const topicAccuracy: Record<string, { correct: number; total: number }> = JSON.parse(profile.topicAccuracy || "{}");
  topicAccuracy[topic] ??= { correct: 0, total: 0 };
  topicAccuracy[topic].total++;
  if (correct) topicAccuracy[topic].correct++;
  const weakTopics: string[] = [], strongTopics: string[] = [];
  for (const [name, stats] of Object.entries(topicAccuracy)) {
    if (stats.total >= 5) {
      const pct = stats.correct / stats.total;
      if (pct < 0.65) weakTopics.push(name);
      else if (pct >= 0.80) strongTopics.push(name);
    }
  }
  if (profile.totalAttempts === 0 && !correct) weakTopics.push(topic);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  let currentStreak = profile.currentStreak, longestStreak = profile.longestStreak;
  if (profile.lastActiveDate !== today) {
    const [y, m, d] = today.split("-").map(Number);
    const yesterday = new Date(y, m - 1, d);
    yesterday.setDate(yesterday.getDate() - 1);
    const previousDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    currentStreak = profile.lastActiveDate === previousDate ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
  }
  await tx.update(studentProfiles).set({ topicAccuracy: JSON.stringify(topicAccuracy),
    weakTopics: JSON.stringify(weakTopics), strongTopics: JSON.stringify(strongTopics),
    totalAttempts: profile.totalAttempts + 1, currentStreak, longestStreak, lastActiveDate: today,
  }).where(eq(studentProfiles.id, profile.id));
}
