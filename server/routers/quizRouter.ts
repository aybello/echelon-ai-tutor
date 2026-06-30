/**
 * Quiz Router — Handles question attempt logging and missed questions
 * Powers: Missed Question Quiz, Quick 10 mode, and the Agentic Learning Engine
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { bankKeyToExamType, FREE_TRIAL_LIMIT } from "../_core/access";
import { resolveAccessForRequest } from "../_core/accessService";
import { getDb } from "../db";
import { questionAttempts, studentProfiles, questions, questionBankMeta, moduleOverviews } from "../../drizzle/schema";
import { and, eq, desc, sql, gte } from "drizzle-orm";
import { z } from "zod";

export const quizRouter = router({
  /**
   * getQuestions — fetch all questions for a given bank key.
   * Returns the full question array needed by quiz/mock/flashcard pages.
   */
    getQuestions: publicProcedure
    .input(z.object({
      bankKey: z.string().min(1).max(64),
      email: z.string().email().optional(),
      accessToken: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
            const examType = bankKeyToExamType(input.bankKey);
      const hasAccess = await resolveAccessForRequest(ctx, examType, {
        accessToken: input.accessToken,
        clientEmail: input.email,
      });
      const rows = await db
        .select()
        .from(questions)
        .where(eq(questions.bankKey, input.bankKey))
        .orderBy(questions.questionNum);

      const total = rows.length;
      // For trial users, sample questions across all modules for a representative experience
      // instead of just taking the first N (which would all be from one module).
      let visible;
      if (hasAccess) {
        visible = rows;
      } else {
        // Group by module, then round-robin pick from each module
        const byModule = new Map<string, typeof rows>();
        for (const r of rows) {
          const arr = byModule.get(r.module) ?? [];
          arr.push(r);
          byModule.set(r.module, arr);
        }
        const moduleArrays = Array.from(byModule.values());
        const sampled: typeof rows = [];
        let idx = 0;
        while (sampled.length < FREE_TRIAL_LIMIT && idx < rows.length) {
          for (const arr of moduleArrays) {
            if (sampled.length >= FREE_TRIAL_LIMIT) break;
            if (idx < arr.length) sampled.push(arr[idx]);
          }
          idx++;
        }
        visible = sampled;
      }

      // Per-row safe parse: one malformed row is skipped, not fatal to the bank.
      const parsed = visible.flatMap((r) => {
        try {
          return [{
            id: r.questionNum,
            module: r.module,
            difficulty: r.difficulty,
            question: r.question,
            options: JSON.parse(r.options) as string[],
            correctIndex: r.correctIndex,
            explanation: r.explanation,
            steps: r.steps ? (JSON.parse(r.steps) as { l: string; c: string }[]) : undefined,
            tip: r.tip ?? undefined,
            isCalc: r.isCalc === "yes",
            topic: r.topic ?? undefined,
          }];
        } catch (err) {
          console.error(`[getQuestions] malformed row ${r.bankKey}#${r.questionNum}:`, err);
          return [];
        }
      });

      return { questions: parsed, locked: !hasAccess, total, trialLimit: FREE_TRIAL_LIMIT };
    }),

  /**
   * getRandomQuestions — fetch a small random batch of questions for instant quiz start.
   * Returns N random questions (default 20) so the first question appears immediately
   * while the full bank loads in the background.
   */
    getRandomQuestions: publicProcedure
    .input(z.object({
      bankKey: z.string().min(1).max(64),
      limit: z.number().int().min(1).max(50).default(20),
      excludeIds: z.array(z.number().int()).max(200).default([]),
      email: z.string().email().optional(),
      accessToken: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            const examType = bankKeyToExamType(input.bankKey);
      const hasAccess = await resolveAccessForRequest(ctx, examType, {
        accessToken: input.accessToken,
        clientEmail: input.email,
      });
      const excludeClause = input.excludeIds.length > 0
        ? sql` AND ${questions.questionNum} NOT IN (${sql.join(input.excludeIds.map((id) => sql`${id}`), sql`, `)})`
        : sql``;

      if (hasAccess) {
        // Full access: random from entire bank
        const rows = await db.execute(
          sql`SELECT * FROM questions WHERE bankKey = ${input.bankKey}${excludeClause} ORDER BY RAND() LIMIT ${input.limit}`
        );
        const list = (rows[0] as unknown as any[]).flatMap((r: any) => {
          try {
            return [{
              id: r.questionNum, module: r.module, difficulty: r.difficulty, question: r.question,
              options: JSON.parse(r.options) as string[], correctIndex: r.correctIndex, explanation: r.explanation,
              steps: r.steps ? (JSON.parse(r.steps) as { l: string; c: string }[]) : undefined,
              tip: r.tip ?? undefined, isCalc: r.isCalc === "yes", topic: r.topic ?? undefined,
            }];
          } catch { return []; }
        });
        return { questions: list, locked: false };
      } else {
        // Trial: sample across modules (round-robin first question from each module)
        // to give a representative experience instead of all from one module.
        const allRows = await db.execute(
          sql`SELECT * FROM questions WHERE bankKey = ${input.bankKey}${excludeClause} ORDER BY module, questionNum`
        );
        const allList = allRows[0] as unknown as any[];
        // Group by module
        const byModule = new Map<string, any[]>();
        for (const r of allList) {
          const arr = byModule.get(r.module) ?? [];
          arr.push(r);
          byModule.set(r.module, arr);
        }
        const moduleArrays = Array.from(byModule.values());
        const sampled: any[] = [];
        let mIdx = 0;
        // Round-robin pick from each module until we hit the limit
        while (sampled.length < Math.min(FREE_TRIAL_LIMIT, input.limit)) {
          let added = false;
          for (const arr of moduleArrays) {
            if (sampled.length >= Math.min(FREE_TRIAL_LIMIT, input.limit)) break;
            if (mIdx < arr.length) {
              sampled.push(arr[mIdx]);
              added = true;
            }
          }
          if (!added) break;
          mIdx++;
        }
        // Shuffle the sampled array for randomness
        for (let i = sampled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sampled[i], sampled[j]] = [sampled[j], sampled[i]];
        }
        const list = sampled.flatMap((r: any) => {
          try {
            return [{
              id: r.questionNum, module: r.module, difficulty: r.difficulty, question: r.question,
              options: JSON.parse(r.options) as string[], correctIndex: r.correctIndex, explanation: r.explanation,
              steps: r.steps ? (JSON.parse(r.steps) as { l: string; c: string }[]) : undefined,
              tip: r.tip ?? undefined, isCalc: r.isCalc === "yes", topic: r.topic ?? undefined,
            }];
          } catch { return []; }
        });
        return { questions: list, locked: true };
      }
    }),

  /**
   * getBankMeta — fetch metadata (modules, moduleTargets, formulaLinks) for a bank.
   */
  getBankMeta: publicProcedure
    .input(z.object({ bankKey: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      const rows = await db
        .select()
        .from(questionBankMeta)
        .where(eq(questionBankMeta.bankKey, input.bankKey))
        .limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      // Per-field safe parse: a malformed JSON field returns null rather than crashing the whole response.
      let modules: string[] = [];
      try { modules = JSON.parse(row.modules) as string[]; }
      catch (err) { console.error(`[getBankMeta] malformed modules for ${row.bankKey}:`, err); }

      let moduleTargets: Record<string, number> | null = null;
      if (row.moduleTargets) {
        try { moduleTargets = JSON.parse(row.moduleTargets) as Record<string, number>; }
        catch (err) { console.error(`[getBankMeta] malformed moduleTargets for ${row.bankKey}:`, err); }
      }

      let formulaLinks: Record<string, string> | null = null;
      if (row.formulaLinks) {
        try { formulaLinks = JSON.parse(row.formulaLinks) as Record<string, string>; }
        catch (err) { console.error(`[getBankMeta] malformed formulaLinks for ${row.bankKey}:`, err); }
      }

      return {
        bankKey: row.bankKey,
        modules,
        moduleTargets,
        formulaLinks,
        totalQuestions: row.totalQuestions,
        /** Issue L: monotonic counter incremented on admin question edits.
         *  Clients compare against their cached value and invalidate on mismatch. */
        contentVersion: row.contentVersion ?? 1,
      };
    }),

  /**
   * getModuleOverviews — fetch module overview study content for a bank.
   */
  getModuleOverviews: publicProcedure
    .input(z.object({ bankKey: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      const rows = await db
        .select()
        .from(moduleOverviews)
        .where(eq(moduleOverviews.bankKey, input.bankKey))
        .limit(1);
      if (rows.length === 0) return null;
      try {
        return JSON.parse(rows[0].overviewsJson);
      } catch (err) {
        console.error(`[getModuleOverviews] malformed overviewsJson for ${input.bankKey}:`, err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Module overviews data is corrupted" });
      }
    }),

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
        difficulty: z.string().max(16).optional().nullable(),
        quizMode: z.enum(["standard", "quick10", "missed", "qotd"]).default("standard"),
        guestToken: z.string().max(64).optional(),
        studentEmail: z.string().email().optional(), // purchase/trial email for non-OAuth users
        /** Issue Q: client-generated UUID for the quiz session. Nullable for legacy clients. */
        sessionId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        const userId = ctx.user?.id ?? null;
        // Attribution priority:
        //   1. OAuth user email (most trusted)
        //   2. Server-verified OTP session email (trusted cookie)
        //   3. Client-supplied email ONLY when a guestToken is also present
        //      (genuine guest session, not an arbitrary unauthenticated caller)
        // This prevents unauthenticated callers from writing attempts under any email.
        const clientEmailForGuest = input.guestToken && input.studentEmail
          ? input.studentEmail.trim().toLowerCase()
          : null;
        const studentEmail = userId
          ? (ctx.user?.email ?? null)
          : (ctx.studentEmail ?? clientEmailForGuest ?? null);

        // Log the attempt
        await db.insert(questionAttempts).values({
          userId,
          guestToken: input.guestToken ?? null,
          studentEmail,
          examType: input.examType,
          topic: input.topic,
          questionId: input.questionId,
          correct: input.correct ? "yes" : "no",
          difficulty: input.difficulty ?? null,
          quizMode: input.quizMode,
          sessionId: input.sessionId ?? null,
        });

        // Update student profile if authenticated (OAuth user) or email-verified (OTP session)
        if (userId) {
          await upsertStudentProfile(db, userId, null, input.examType, input.topic, input.correct);
        } else if (ctx.studentEmail) {
          await upsertStudentProfile(db, null, ctx.studentEmail, input.examType, input.topic, input.correct);
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

         // Fetch all attempts for this user/exam, ordered newest first
        // We need to check the MOST RECENT attempt per question:
        // only include a question if the most recent attempt was wrong.
        const allCondition = userId
          ? and(eq(questionAttempts.userId, userId), eq(questionAttempts.examType, input.examType))
          : and(eq(questionAttempts.guestToken, input.guestToken!), eq(questionAttempts.examType, input.examType));
        const allRows = await db
          .select({ questionId: questionAttempts.questionId, correct: questionAttempts.correct })
          .from(questionAttempts)
          .where(allCondition)
          .orderBy(desc(questionAttempts.createdAt))
          .limit(input.limit * 10); // fetch enough to cover all questions
        // For each questionId, keep only the most recent attempt result
        const latestByQuestion = new Map<number, string>(); // questionId → "yes"|"no"
        for (const row of allRows) {
          if (!latestByQuestion.has(row.questionId)) {
            latestByQuestion.set(row.questionId, row.correct);
          }
        }
        // Only include questions where the most recent attempt was wrong
        const uniqueIds: number[] = [];
        for (const [questionId, correct] of Array.from(latestByQuestion.entries())) {
          if (correct === "no") {
            uniqueIds.push(questionId);
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

  /**
   * getAttemptStats — returns seen and missed question IDs for a given exam type.
   * Used by useQuizSession to seed its usedIds and prioritise missed questions.
   * Works for both authenticated users and guest token users.
   */
  getAttemptStats: publicProcedure
    .input(
      z.object({
        examType: z.string().min(1).max(64),
        guestToken: z.string().max(64).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { seenIds: [] as number[], missedIds: [] as number[] };
        const userId = ctx.user?.id ?? null;

        if (!userId && !input.guestToken) {
          return { seenIds: [] as number[], missedIds: [] as number[] };
        }

        // Fetch attempts from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const condition = userId
          ? and(
              eq(questionAttempts.userId, userId),
              eq(questionAttempts.examType, input.examType),
              gte(questionAttempts.createdAt, thirtyDaysAgo)
            )
          : and(
              eq(questionAttempts.guestToken, input.guestToken!),
              eq(questionAttempts.examType, input.examType),
              gte(questionAttempts.createdAt, thirtyDaysAgo)
            );

        const rows = await db
          .select({
            questionId: questionAttempts.questionId,
            correct: questionAttempts.correct,
          })
          .from(questionAttempts)
          .where(condition)
          .orderBy(desc(questionAttempts.createdAt))
          .limit(2000);

        // Build per-question stats: count correct attempts
        const correctCountByQ = new Map<number, number>();
        const seenSet = new Set<number>();
        const missedSet = new Set<number>();

        for (const row of rows) {
          seenSet.add(row.questionId);
          if (row.correct === "yes") {
            correctCountByQ.set(row.questionId, (correctCountByQ.get(row.questionId) ?? 0) + 1);
          } else {
            missedSet.add(row.questionId);
          }
        }

        // A question is "mastered" if answered correctly 2+ times in 30 days
        // Remove mastered from missed set
        for (const [qId, count] of Array.from(correctCountByQ.entries())) {
          if (count >= 2) {
            missedSet.delete(qId);
          }
        }

        return {
          seenIds: Array.from(seenSet),
          missedIds: Array.from(missedSet),
        };
      } catch (err) {
        console.error("[quizRouter.getAttemptStats] Error:", err);
        return { seenIds: [] as number[], missedIds: [] as number[] };
      }
    }),
});

// ─── Helper: get today's date in America/Toronto timezone ──────────────────
// Using UTC (toISOString) causes off-by-one errors for users in Eastern time
// because midnight UTC is 7-8 PM the previous day in Toronto.
function getTodayTorontoDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // returns YYYY-MM-DD in en-CA locale
}

// ─── Helper: upsert student profile ─────────────────────────────────────────
async function upsertStudentProfile(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number | null,
  studentEmail: string | null,
  examType: string,
  topic: string,
  correct: boolean
) {
  // Must have at least one identifier
  if (!userId && !studentEmail) return;
  try {
    const rows = await db
      .select()
      .from(studentProfiles)
      .where(
        userId
          ? eq(studentProfiles.userId, userId)
          : eq(studentProfiles.studentEmail, studentEmail!)
      )
      .limit(1);
    const today = getTodayTorontoDate();
    if (rows.length === 0) {
      // Create new profile
      const topicAccuracy = { [topic]: { correct: correct ? 1 : 0, total: 1 } };
      const weakTopics = correct ? [] : [topic];
      const strongTopics: string[] = [];
      await db.insert(studentProfiles).values({
        userId: userId ?? null,
        studentEmail: studentEmail ?? null,
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
        // Compute yesterday in Toronto timezone by subtracting 24h from now
        const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Toronto",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(Date.now() - 24 * 60 * 60 * 1000));
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
        .where(
          userId
            ? eq(studentProfiles.userId, userId)
            : eq(studentProfiles.studentEmail, studentEmail!)
        );
    }
  } catch (err) {
    console.error("[upsertStudentProfile] Error:", err);
  }
}
