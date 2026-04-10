/**
 * Quiz Router — Handles question attempt logging, missed questions, and QOTD
 * Powers: Missed Question Quiz, Quick 10 mode, Question of the Day, and the Agentic Learning Engine
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { questionAttempts, qotdCompletions, studentProfiles } from "../../drizzle/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

export const quizRouter = router({
  /**
   * logAttempt — silently logs every quiz answer for topic tracking and missed questions.
   * Called on every confirm() in QuizShell. Fails silently if unauthenticated (guest users).
   */
  logAttempt: publicProcedure
    .input(
      z.object({
        examType: z.string().min(1).max(64),
        topic: z.string().min(1).max(128),
        questionId: z.number().int().positive(),
        correct: z.boolean(),
        difficulty: z.string().max(16).optional(),
        quizMode: z.enum(["standard", "quick10", "missed", "qotd"]).default("standard"),
        guestToken: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        const userId = ctx.user?.id ?? null;

        // Log the attempt
        await db.insert(questionAttempts).values({
          userId,
          guestToken: input.guestToken ?? null,
          examType: input.examType,
          topic: input.topic,
          questionId: input.questionId,
          correct: input.correct ? "yes" : "no",
          difficulty: input.difficulty ?? null,
          quizMode: input.quizMode,
        });

        // Update student profile if authenticated
        if (userId) {
          await upsertStudentProfile(db, userId, input.examType, input.topic, input.correct);
        }

        return { success: true };
      } catch (err) {
        // Silent failure — never block the quiz experience
        console.error("[quizRouter.logAttempt] Error:", err);
        return { success: false };
      }
    }),

  /**
   * getMissedQuestions — returns question IDs the user has gotten wrong.
   * Used to build the Missed Question Quiz session.
   */
  getMissedQuestions: publicProcedure
    .input(
      z.object({
        examType: z.string().min(1).max(64),
        limit: z.number().int().min(1).max(50).default(20),
        guestToken: z.string().max(64).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { questionIds: [], total: 0 };
        const userId = ctx.user?.id ?? null;

        if (!userId && !input.guestToken) {
          return { questionIds: [], total: 0 };
        }

        // Get questions answered incorrectly (most recent wrong answer per questionId)
        const condition = userId
          ? and(eq(questionAttempts.userId, userId), eq(questionAttempts.examType, input.examType), eq(questionAttempts.correct, "no"))
          : and(eq(questionAttempts.guestToken, input.guestToken!), eq(questionAttempts.examType, input.examType), eq(questionAttempts.correct, "no"));

        const rows = await db
          .select({ questionId: questionAttempts.questionId })
          .from(questionAttempts)
          .where(condition)
          .orderBy(desc(questionAttempts.createdAt))
          .limit(input.limit * 3); // fetch more to deduplicate

        // Deduplicate by questionId, keep most recent
        const seen = new Set<number>();
        const uniqueIds: number[] = [];
        for (const row of rows) {
          if (!seen.has(row.questionId)) {
            seen.add(row.questionId);
            uniqueIds.push(row.questionId);
            if (uniqueIds.length >= input.limit) break;
          }
        }

        return { questionIds: uniqueIds, total: uniqueIds.length };
      } catch (err) {
        console.error("[quizRouter.getMissedQuestions] Error:", err);
        return { questionIds: [], total: 0 };
      }
    }),

  /**
   * getWrongCountForQuestion — returns how many times a user got a specific question wrong.
   * Used to show "You've answered this wrong N times" badge in Missed Quiz mode.
   */
  getWrongCountForQuestion: publicProcedure
    .input(
      z.object({
        examType: z.string().min(1).max(64),
        questionId: z.number().int().positive(),
        guestToken: z.string().max(64).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { count: 0 };
        const userId = ctx.user?.id ?? null;
        if (!userId && !input.guestToken) return { count: 0 };

        const condition = userId
          ? and(eq(questionAttempts.userId, userId), eq(questionAttempts.examType, input.examType), eq(questionAttempts.questionId, input.questionId), eq(questionAttempts.correct, "no"))
          : and(eq(questionAttempts.guestToken, input.guestToken!), eq(questionAttempts.examType, input.examType), eq(questionAttempts.questionId, input.questionId), eq(questionAttempts.correct, "no"));

        const rows = await db
          .select({ id: questionAttempts.id })
          .from(questionAttempts)
          .where(condition);

        return { count: rows.length };
      } catch (err) {
        console.error("[quizRouter.getWrongCountForQuestion] Error:", err);
        return { count: 0 };
      }
    }),

  /**
   * getQotd — returns today's Question of the Day for a given exam type.
   * Uses a deterministic date-based seed so all users see the same question each day.
   * Also returns whether the current user has already completed today's QOTD.
   */
  getQotd: publicProcedure
    .input(
      z.object({
        examType: z.string().min(1).max(64),
        totalQuestions: z.number().int().positive(),
        guestToken: z.string().max(64).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('DB unavailable');
        const userId = ctx.user?.id ?? null;
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // Deterministic index: hash of (examType + date) mod totalQuestions
        const hashStr = `${input.examType}-${today}`;
        let hash = 0;
        for (let i = 0; i < hashStr.length; i++) {
          hash = ((hash << 5) - hash + hashStr.charCodeAt(i)) | 0;
        }
        const questionIndex = Math.abs(hash) % input.totalQuestions;

        // Check if user already completed today's QOTD
        let completed = false;
        if (userId || input.guestToken) {
          const condition = userId
            ? and(eq(qotdCompletions.userId, userId), eq(qotdCompletions.examType, input.examType), eq(qotdCompletions.dateKey, today))
            : and(eq(qotdCompletions.guestToken, input.guestToken!), eq(qotdCompletions.examType, input.examType), eq(qotdCompletions.dateKey, today));

          const rows = await db.select({ id: qotdCompletions.id }).from(qotdCompletions).where(condition).limit(1);
          completed = rows.length > 0;
        }

        return { questionIndex, dateKey: today, completed };
      } catch (err) {
        console.error("[quizRouter.getQotd] Error:", err);
        // Fallback: use date-based index without DB check
        const today = new Date().toISOString().slice(0, 10);
        const hashStr = `${input.examType}-${today}`;
        let hash = 0;
        for (let i = 0; i < hashStr.length; i++) {
          hash = ((hash << 5) - hash + hashStr.charCodeAt(i)) | 0;
        }
        return { questionIndex: Math.abs(hash) % input.totalQuestions, dateKey: today, completed: false };
      }
    }),

  /**
   * completeQotd — marks today's QOTD as completed for the user.
   */
  completeQotd: publicProcedure
    .input(
      z.object({
        examType: z.string().min(1).max(64),
        questionId: z.number().int().positive(),
        dateKey: z.string().length(10),
        correct: z.boolean(),
        guestToken: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        const userId = ctx.user?.id ?? null;
        if (!userId && !input.guestToken) return { success: false };

        await db.insert(qotdCompletions).values({
          userId,
          guestToken: input.guestToken ?? null,
          examType: input.examType,
          questionId: input.questionId,
          dateKey: input.dateKey,
          correct: input.correct ? "yes" : "no",
        });

        return { success: true };
      } catch (err) {
        // Ignore duplicate completions (user refreshed page)
        return { success: false };
      }
    }),

  /**
   * getStudentProfile — returns the student's topic accuracy profile.
   * Used by the AI tutor to inject context into the system prompt.
   */
  getStudentProfile: protectedProcedure
    .input(z.object({ examType: z.string().min(1).max(64) }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { topicAccuracy: {} as Record<string, { correct: number; total: number }>, weakTopics: [] as string[], strongTopics: [] as string[], totalAttempts: 0, totalSessions: 0, currentStreak: 0 };
        const rows = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, ctx.user.id))
          .limit(1);

        if (rows.length === 0) {
          return {
            topicAccuracy: {} as Record<string, { correct: number; total: number }>,
            weakTopics: [] as string[],
            strongTopics: [] as string[],
            totalAttempts: 0,
            totalSessions: 0,
            currentStreak: 0,
          };
        }

        const profile = rows[0];
        return {
          topicAccuracy: JSON.parse(profile.topicAccuracy || "{}") as Record<string, { correct: number; total: number }>,
          weakTopics: JSON.parse(profile.weakTopics || "[]") as string[],
          strongTopics: JSON.parse(profile.strongTopics || "[]") as string[],
          totalAttempts: profile.totalAttempts,
          totalSessions: profile.totalSessions,
          currentStreak: profile.currentStreak,
        };
      } catch (err) {
        console.error("[quizRouter.getStudentProfile] Error:", err);
        return {
          topicAccuracy: {} as Record<string, { correct: number; total: number }>,
          weakTopics: [] as string[],
          strongTopics: [] as string[],
          totalAttempts: 0,
          totalSessions: 0,
          currentStreak: 0,
        };
      }
    }),
});

// ─── Helper: upsert student profile ─────────────────────────────────────────
async function upsertStudentProfile(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  examType: string,
  topic: string,
  correct: boolean
) {
  try {
    const rows = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const today = new Date().toISOString().slice(0, 10);

    if (rows.length === 0) {
      // Create new profile
      const topicAccuracy = { [topic]: { correct: correct ? 1 : 0, total: 1 } };
      const weakTopics = correct ? [] : [topic];
      const strongTopics: string[] = [];
      await db.insert(studentProfiles).values({
        userId,
        examType,
        topicAccuracy: JSON.stringify(topicAccuracy),
        weakTopics: JSON.stringify(weakTopics),
        strongTopics: JSON.stringify(strongTopics),
        totalAttempts: 1,
        totalSessions: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      });
    } else {
      const profile = rows[0];
      const topicAccuracy: Record<string, { correct: number; total: number }> =
        JSON.parse(profile.topicAccuracy || "{}");

      // Update topic accuracy
      if (!topicAccuracy[topic]) topicAccuracy[topic] = { correct: 0, total: 0 };
      topicAccuracy[topic].total += 1;
      if (correct) topicAccuracy[topic].correct += 1;

      // Recompute weak/strong topics
      const weakTopics: string[] = [];
      const strongTopics: string[] = [];
      for (const [t, stats] of Object.entries(topicAccuracy)) {
        if (stats.total >= 5) {
          const pct = stats.correct / stats.total;
          if (pct < 0.65) weakTopics.push(t);
          else if (pct >= 0.80) strongTopics.push(t);
        }
      }

      // Update streak
      let currentStreak = profile.currentStreak;
      let longestStreak = profile.longestStreak;
      if (profile.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        if (profile.lastActiveDate === yesterdayStr) {
          currentStreak += 1;
        } else {
          currentStreak = 1; // streak broken
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      }

      await db
        .update(studentProfiles)
        .set({
          topicAccuracy: JSON.stringify(topicAccuracy),
          weakTopics: JSON.stringify(weakTopics),
          strongTopics: JSON.stringify(strongTopics),
          totalAttempts: profile.totalAttempts + 1,
          currentStreak,
          longestStreak,
          lastActiveDate: today,
        })
        .where(eq(studentProfiles.userId, userId));
    }
  } catch (err) {
    console.error("[upsertStudentProfile] Error:", err);
  }
}
