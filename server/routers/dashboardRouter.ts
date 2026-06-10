/**
 * Dashboard Router — Student performance analytics
 * Supports two auth paths:
 *   1. Manus OAuth (ctx.user.id) — existing flow for users with Manus accounts
 *   2. Email OTP session (echelon_dashboard_session cookie) — for email-only students
 *
 * All procedures use resolveDashboardIdentity() to get the right WHERE clause.
 */
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { questionAttempts, studentProfiles, aiChatSessions, examDates } from "../../drizzle/schema";
import { and, eq, sql, desc, gte, or } from "drizzle-orm";
import { getResourcesForProfile } from "../resourceIndex";
import { TRPCError } from "@trpc/server";

/**
 * Resolves the dashboard identity from the tRPC context.
 *
 * Issue I fix: this is now a thin wrapper around ctx.user and ctx.studentEmail,
 * which are already verified and normalized by server/_core/context.ts.
 * There is no longer a second, independent cookie-verification path here.
 *
 * Issue J fix: ctx.studentEmail is already lowercased in context.ts, so email
 * case mismatches between sign-up and dashboard queries are eliminated.
 *
 * Returns { userId, email } — at least one will be non-null.
 * Throws UNAUTHORIZED if neither is present.
 */
function resolveDashboardIdentity(ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null }) {
  // 1. OAuth user (admin / owner)
  if (ctx.user) {
    return { userId: ctx.user.id, email: ctx.user.email ?? null };
  }

  // 2. OTP session — already verified + normalized (lowercased) by context.ts
  if (ctx.studentEmail) {
    return { userId: null, email: ctx.studentEmail };
  }

  throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to view your dashboard." });
}

/**
 * Builds a Drizzle WHERE condition that matches attempts by userId OR studentEmail.
 * This ensures data is found regardless of which auth path was used when logging.
 */
function attemptsWhere(userId: number | null, email: string | null) {
  if (userId && email) {
    return or(
      eq(questionAttempts.userId, userId),
      eq(questionAttempts.studentEmail, email),
    );
  }
  if (userId) return eq(questionAttempts.userId, userId);
  if (email) return eq(questionAttempts.studentEmail, email!);
  throw new Error("No identity");
}

export const dashboardRouter = router({
  /**
   * Overview stats — hero numbers for the dashboard
   */
  overview: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return null;

    // Get profile data (streak, totalAttempts) — only available for OAuth users
    let profile = null;
    if (userId) {
      const profiles = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);
      profile = profiles[0] ?? null;
    }

    // Get overall accuracy from attempts (works for both paths)
    const [accuracyRow] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(attemptsWhere(userId, email));

    const total = Number(accuracyRow?.total ?? 0);
    const correct = Number(accuracyRow?.correct ?? 0);

    return {
      totalAttempts: total,
      overallAccuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
      totalSessions: profile?.totalSessions ?? 0,
    };
  }),

  /**
   * Daily activity — question count per day for the last 30 days
   */
  dailyActivity: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use Drizzle ORM for parameterized query (no sql.raw)
    const identityWhere = attemptsWhere(userId, email);

    const result = await db.execute(sql`
      SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS day, COUNT(*) AS total,
             SUM(CASE WHEN correct = 'yes' THEN 1 ELSE 0 END) AS correct
      FROM question_attempts
      WHERE ${identityWhere}
        AND createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
      ORDER BY day
    `);
    const rows = (result as any)[0] as Array<{ day: string; total: number; correct: number }>;

    return rows.map((r) => ({
      day: String(r.day),
      total: Number(r.total),
      correct: Number(r.correct),
    }));
  }),

  /**
   * Topic accuracy breakdown — per-topic correct/total
   */
  topicAccuracy: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return { topics: [], weakTopics: [], strongTopics: [] };

    // For OAuth users, use the pre-computed profile
    if (userId) {
      const profiles = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);

      if (!profiles.length) return { topics: [], weakTopics: [], strongTopics: [] };

      const profile = profiles[0];
      let topicAccuracy: Record<string, { correct: number; total: number }> = {};
      let weakTopics: string[] = [];
      let strongTopics: string[] = [];

      try { topicAccuracy = JSON.parse(profile.topicAccuracy || "{}"); } catch { /* empty */ }
      try { weakTopics = JSON.parse(profile.weakTopics || "[]"); } catch { /* empty */ }
      try { strongTopics = JSON.parse(profile.strongTopics || "[]"); } catch { /* empty */ }

      const topics = Object.entries(topicAccuracy)
        .map(([name, data]) => ({
          name,
          correct: data.correct,
          total: data.total,
          accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
          status: weakTopics.includes(name)
            ? ("weak" as const)
            : strongTopics.includes(name)
              ? ("strong" as const)
              : ("neutral" as const),
        }))
        .sort((a, b) => b.total - a.total);

      return { topics, weakTopics, strongTopics };
    }

    // For email-only users, compute from raw attempts
    const rows = await db
      .select({
        topic: questionAttempts.topic,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.studentEmail, email!))
      .groupBy(questionAttempts.topic)
      .orderBy(desc(sql`COUNT(*)`));

    const topics = rows.map((r) => {
      const t = Number(r.total);
      const c = Number(r.correct);
      const acc = t > 0 ? Math.round((c / t) * 100) : 0;
      return {
        name: r.topic,
        correct: c,
        total: t,
        accuracy: acc,
        status: acc < 65 ? ("weak" as const) : acc >= 80 ? ("strong" as const) : ("neutral" as const),
      };
    });

    const weakTopics = topics.filter((t) => t.status === "weak").map((t) => t.name);
    const strongTopics = topics.filter((t) => t.status === "strong").map((t) => t.name);

    return { topics, weakTopics, strongTopics };
  }),

  /**
   * Per-course breakdown — accuracy and count by examType
   */
  courseBreakdown: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        examType: questionAttempts.examType,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(attemptsWhere(userId, email))
      .groupBy(questionAttempts.examType)
      .orderBy(desc(sql`COUNT(*)`));

    return rows.map((r) => ({
      examType: r.examType,
      total: Number(r.total),
      correct: Number(r.correct),
      accuracy: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
    }));
  }),

  /**
   * Difficulty breakdown — easy/medium/hard accuracy
   */
  difficultyBreakdown: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        difficulty: questionAttempts.difficulty,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(attemptsWhere(userId, email))
      .groupBy(questionAttempts.difficulty);

    return rows.map((r) => ({
      difficulty: r.difficulty ?? "unknown",
      total: Number(r.total),
      correct: Number(r.correct),
      accuracy: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
    }));
  }),

  /**
   * Recent sessions — last 10 quiz sessions
   *
   * Issue Q: rewritten to use GROUP BY sessionId for rows that have a sessionId
   * (all new rows). Legacy rows (sessionId IS NULL) fall back to the original
   * 30-minute gap clustering so old data still renders correctly.
   */
  recentSessions: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return [];

    // ── Path 1: new rows with sessionId ───────────────────────────────────────────────────────────────────────
    const groupedRows = await db
      .select({
        sessionId: questionAttempts.sessionId,
        examType: questionAttempts.examType,
        quizMode: questionAttempts.quizMode,
        startedAt: sql<Date>`MIN(${questionAttempts.createdAt})`,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(and(attemptsWhere(userId, email), sql`${questionAttempts.sessionId} IS NOT NULL`))
      .groupBy(questionAttempts.sessionId, questionAttempts.examType, questionAttempts.quizMode)
      .orderBy(desc(sql`MIN(${questionAttempts.createdAt})`))
      .limit(10);

    const sessionedResults = groupedRows.map((r) => ({
      examType: r.examType,
      quizMode: r.quizMode ?? null,
      startedAt: new Date(r.startedAt).toISOString(),
      total: Number(r.total),
      correct: Number(r.correct),
      accuracy: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
    }));

    // If we already have 10 sessioned results, return them immediately
    if (sessionedResults.length >= 10) return sessionedResults;

    // ── Path 2: legacy rows (sessionId IS NULL) — 30-minute gap clustering fallback ───────────────────
    const legacyRows = await db
      .select({
        examType: questionAttempts.examType,
        correct: questionAttempts.correct,
        createdAt: questionAttempts.createdAt,
        quizMode: questionAttempts.quizMode,
      })
      .from(questionAttempts)
      .where(and(attemptsWhere(userId, email), sql`${questionAttempts.sessionId} IS NULL`))
      .orderBy(desc(questionAttempts.createdAt))
      .limit(200);

    const legacySessions: Array<{
      examType: string;
      quizMode: string | null;
      startedAt: string;
      total: number;
      correct: number;
      accuracy: number;
    }> = [];

    let currentSession: {
      examType: string;
      quizMode: string | null;
      startedAt: Date;
      lastAt: Date;
      total: number;
      correct: number;
    } | null = null;

    const sorted = [...legacyRows].reverse();
    for (const row of sorted) {
      const ts = new Date(row.createdAt);
      const isCorrect = row.correct === "yes";

      if (
        currentSession &&
        currentSession.examType === row.examType &&
        ts.getTime() - currentSession.lastAt.getTime() < 30 * 60 * 1000
      ) {
        currentSession.total++;
        if (isCorrect) currentSession.correct++;
        currentSession.lastAt = ts;
      } else {
        if (currentSession) {
          legacySessions.push({
            examType: currentSession.examType,
            quizMode: currentSession.quizMode,
            startedAt: currentSession.startedAt.toISOString(),
            total: currentSession.total,
            correct: currentSession.correct,
            accuracy: Math.round((currentSession.correct / currentSession.total) * 100),
          });
        }
        currentSession = {
          examType: row.examType,
          quizMode: row.quizMode,
          startedAt: ts,
          lastAt: ts,
          total: 1,
          correct: isCorrect ? 1 : 0,
        };
      }
    }
    if (currentSession) {
      legacySessions.push({
        examType: currentSession.examType,
        quizMode: currentSession.quizMode,
        startedAt: currentSession.startedAt.toISOString(),
        total: currentSession.total,
        correct: currentSession.correct,
        accuracy: Math.round((currentSession.correct / currentSession.total) * 100),
      });
    }

    // Merge: sessioned first (most recent), then legacy, capped at 10
    const remaining = 10 - sessionedResults.length;
    const legacySlice = legacySessions.reverse().slice(0, remaining);
    return [...sessionedResults, ...legacySlice];
  }),

  /**
   * AI Tutor Session History — only available for OAuth users
   */
  aiSessionHistory: publicProcedure.query(async ({ ctx }) => {
    const { userId } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db || !userId) return [];

    const rows = await db
      .select({
        id: aiChatSessions.id,
        examType: aiChatSessions.examType,
        sessionStart: aiChatSessions.sessionStart,
        messageCount: aiChatSessions.messageCount,
        topicsCovered: aiChatSessions.topicsCovered,
        summary: aiChatSessions.summary,
      })
      .from(aiChatSessions)
      .where(eq(aiChatSessions.userId, userId))
      .orderBy(desc(aiChatSessions.sessionStart))
      .limit(10);

    return rows.map((r) => ({
      id: r.id,
      examType: r.examType ?? "general",
      sessionStart: r.sessionStart ? new Date(r.sessionStart).toISOString() : new Date().toISOString(),
      messageCount: r.messageCount ?? 0,
      topicsCovered: r.topicsCovered ?? "",
      summary: r.summary ?? "No summary available",
    }));
  }),

  /**
   * Recommended Resources — personalized study materials
   */
  recommendedResources: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return [];

    let weakTopics: string[] = [];
    let examType = "oit";

    if (userId) {
      const profiles = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);

      if (profiles.length) {
        try { weakTopics = JSON.parse(profiles[0].weakTopics || "[]"); } catch { /* empty */ }
      }
    } else if (email) {
      // Compute weak topics from raw attempts for email-only users
      const rows = await db
        .select({
          topic: questionAttempts.topic,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.studentEmail, email))
        .groupBy(questionAttempts.topic);

      weakTopics = rows
        .filter((r) => {
          const t = Number(r.total);
          const c = Number(r.correct);
          return t >= 5 && (c / t) < 0.65;
        })
        .map((r) => r.topic);
    }

    // Get most practiced exam type
    const [examRow] = await db
      .select({ examType: questionAttempts.examType, cnt: sql<number>`COUNT(*)` })
      .from(questionAttempts)
      .where(attemptsWhere(userId, email))
      .groupBy(questionAttempts.examType)
      .orderBy(desc(sql`COUNT(*)`));

    examType = examRow?.examType ?? "oit";

    const resources = getResourcesForProfile(
      { examType, weakTopics, strongTopics: [] },
      6
    );

    return resources.slice(0, 6).map((r) => ({
      title: r.title,
      url: r.url,
      type: r.type,
      topics: r.topics,
      description: r.description,
      reason: r.reason,
    }));
  }),

  /**
   * Exam Countdown — days until the next exam
   */
  examCountdown: publicProcedure.query(async ({ ctx }) => {
    const { userId, email } = await resolveDashboardIdentity(ctx);
    const db = await getDb();
    if (!db) return null;

    // Resolve the email to look up exam dates
    let lookupEmail = email;
    if (!lookupEmail && userId) {
      // For OAuth users, get email from user record
      const { users } = await import("../../drizzle/schema");
      const userRows = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
      lookupEmail = userRows[0]?.email ?? null;
    }
    if (!lookupEmail) return null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const exams = await db
      .select()
      .from(examDates)
      .where(
        and(
          eq(examDates.email, lookupEmail),
          gte(examDates.examDate, todayStart)
        )
      )
      .orderBy(examDates.examDate)
      .limit(1);

    if (!exams.length) return null;

    const exam = exams[0];
    // Parse as calendar date (local midnight) to match client-side parseExamDate helper.
    // Avoids UTC-midnight-to-local-evening drift for Canadian users.
    const rawDate = exam.examDate instanceof Date ? exam.examDate.toISOString() : String(exam.examDate);
    const [ey, em, ed] = rawDate.slice(0, 10).split("-").map(Number);
    const examDate = new Date(ey, em - 1, ed); // local midnight on the intended calendar day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [paceRow] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(questionAttempts)
      .where(
        and(
          attemptsWhere(userId, email),
          gte(questionAttempts.createdAt, sevenDaysAgo)
        )
      );

    const questionsLast7Days = Number(paceRow?.total ?? 0);
    const avgPerDay = Math.round(questionsLast7Days / 7);

    let paceStatus: "on_track" | "needs_more" | "falling_behind" = "on_track";
    if (daysUntil <= 7 && avgPerDay < 10) paceStatus = "falling_behind";
    else if (daysUntil <= 14 && avgPerDay < 5) paceStatus = "needs_more";
    else if (avgPerDay < 3) paceStatus = "needs_more";

    return {
      examName: exam.productKey ?? "Upcoming Exam",
      examDate: examDate.toISOString(),
      daysUntil,
      avgQuestionsPerDay: avgPerDay,
      questionsLast7Days,
      paceStatus,
    };
  }),
});
