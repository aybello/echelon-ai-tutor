/**
 * Dashboard Router — Student performance analytics
 * Surfaces studentProfiles + questionAttempts data for the performance dashboard
 */
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { questionAttempts, studentProfiles } from "../../drizzle/schema";
import { and, eq, sql, desc, gte } from "drizzle-orm";

export const dashboardRouter = router({
  /**
   * Overview stats — hero numbers for the dashboard
   * Returns: totalAttempts, overallAccuracy, currentStreak, longestStreak, totalSessions
   */
  overview: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Get profile data (streak, totalAttempts)
    const profiles = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, ctx.user.id))
      .limit(1);

    const profile = profiles[0] ?? null;

    // Get overall accuracy from attempts
    const [accuracyRow] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, ctx.user.id));

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
   * Used for the activity heatmap / bar chart
   */
  dailyActivity: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await db
      .select({
        day: sql<string>`DATE(${questionAttempts.createdAt})`,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(
        and(
          eq(questionAttempts.userId, ctx.user.id),
          gte(questionAttempts.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${questionAttempts.createdAt})`)
      .orderBy(sql`DATE(${questionAttempts.createdAt})`);

    return rows.map((r) => ({
      day: String(r.day),
      total: Number(r.total),
      correct: Number(r.correct),
    }));
  }),

  /**
   * Topic accuracy breakdown — per-topic correct/total from the student profile
   * Includes weak/strong classification
   */
  topicAccuracy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { topics: [], weakTopics: [], strongTopics: [] };

    const profiles = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profiles.length) return { topics: [], weakTopics: [], strongTopics: [] };

    const profile = profiles[0];
    let topicAccuracy: Record<string, { correct: number; total: number }> = {};
    let weakTopics: string[] = [];
    let strongTopics: string[] = [];

    try {
      topicAccuracy = JSON.parse(profile.topicAccuracy || "{}");
    } catch { /* empty */ }
    try {
      weakTopics = JSON.parse(profile.weakTopics || "[]");
    } catch { /* empty */ }
    try {
      strongTopics = JSON.parse(profile.strongTopics || "[]");
    } catch { /* empty */ }

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
      .sort((a, b) => b.total - a.total); // most practiced first

    return { topics, weakTopics, strongTopics };
  }),

  /**
   * Per-course breakdown — accuracy and count by examType
   */
  courseBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        examType: questionAttempts.examType,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, ctx.user.id))
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
   * Difficulty breakdown — how many easy/medium/hard questions attempted + accuracy per difficulty
   */
  difficultyBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        difficulty: questionAttempts.difficulty,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, ctx.user.id))
      .groupBy(questionAttempts.difficulty);

    return rows.map((r) => ({
      difficulty: r.difficulty ?? "unknown",
      total: Number(r.total),
      correct: Number(r.correct),
      accuracy: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
    }));
  }),

  /**
   * Recent sessions — last 10 quiz sessions with timestamp, exam type, and score
   * Approximated by grouping attempts within 30-minute windows
   */
  recentSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Get last 100 attempts and group them into sessions client-side
    const rows = await db
      .select({
        examType: questionAttempts.examType,
        correct: questionAttempts.correct,
        createdAt: questionAttempts.createdAt,
        quizMode: questionAttempts.quizMode,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, ctx.user.id))
      .orderBy(desc(questionAttempts.createdAt))
      .limit(200);

    // Group into sessions: consecutive attempts within 30 min of same examType
    const sessions: Array<{
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

    // Reverse to process chronologically
    const sorted = [...rows].reverse();
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
          sessions.push({
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
      sessions.push({
        examType: currentSession.examType,
        quizMode: currentSession.quizMode,
        startedAt: currentSession.startedAt.toISOString(),
        total: currentSession.total,
        correct: currentSession.correct,
        accuracy: Math.round((currentSession.correct / currentSession.total) * 100),
      });
    }

    // Return most recent 10 sessions
    return sessions.reverse().slice(0, 10);
  }),
});
