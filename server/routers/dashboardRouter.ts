/**
 * Dashboard Router — Student performance analytics
 * Surfaces studentProfiles + questionAttempts data for the performance dashboard
 */
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { questionAttempts, studentProfiles, aiChatSessions, examDates } from "../../drizzle/schema";
import { and, eq, sql, desc, gte } from "drizzle-orm";
import { getResourcesForProfile } from "../resourceIndex";

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

    const result = await db.execute(sql`
      SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS day, COUNT(*) AS total,
             SUM(CASE WHEN correct = 'yes' THEN 1 ELSE 0 END) AS correct
      FROM question_attempts
      WHERE userId = ${ctx.user.id}
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

  /**
   * AI Tutor Session History — recent AI conversations with summaries
   */
  aiSessionHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

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
      .where(eq(aiChatSessions.userId, ctx.user.id))
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
   * Recommended Resources — personalized study materials from the resource index
   * Based on student profile weak topics and exam type
   */
  recommendedResources: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const profiles = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profiles.length) return [];

    const profile = profiles[0];
    let weakTopics: string[] = [];
    let topicAccuracy: Record<string, { correct: number; total: number }> = {};

    try { weakTopics = JSON.parse(profile.weakTopics || "[]"); } catch { /* empty */ }
    try { topicAccuracy = JSON.parse(profile.topicAccuracy || "{}"); } catch { /* empty */ }

    // Get the most practiced exam type
    const [examRow] = await db
      .select({ examType: questionAttempts.examType, cnt: sql<number>`COUNT(*)` })
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, ctx.user.id))
      .groupBy(questionAttempts.examType)
      .orderBy(desc(sql`COUNT(*)`));

    const examType = examRow?.examType ?? "oit";

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
   * Exam Countdown — days until the next exam with study pace info
   */
  examCountdown: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Get the user's next upcoming exam date
    const now = new Date();
    // examDates uses email, not userId — look up user email first
    const userEmail = ctx.user.email;
    if (!userEmail) return null;

    const exams = await db
      .select()
      .from(examDates)
      .where(
        and(
          eq(examDates.email, userEmail),
          gte(examDates.examDate, now)
        )
      )
      .orderBy(examDates.examDate)
      .limit(1);

    if (!exams.length) return null;

    const exam = exams[0];
    const examDate = new Date(exam.examDate);
    const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Get study pace: questions per day in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [paceRow] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(questionAttempts)
      .where(
        and(
          eq(questionAttempts.userId, ctx.user.id),
          gte(questionAttempts.createdAt, sevenDaysAgo)
        )
      );

    const questionsLast7Days = Number(paceRow?.total ?? 0);
    const avgPerDay = Math.round(questionsLast7Days / 7);

    // Determine pace status
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
