/**
 * Quick 10: a ten-question practice session that starts with one tap.
 *
 *   quick10.start   Picks ten questions for the learner's current course on the server and returns them
 *                   WITHOUT the answer key, explanation, steps or tip.
 *   quick10.answer  Saves the answer through the existing quiz.logAttempt (the one attempt store, so streaks,
 *                   mastery and readiness count it like normal practice). Only after the answer is saved does
 *                   it return the correct answer and the explanation.
 *
 * Access follows the existing rules. A learner who owns the course draws from the whole bank. Anyone else draws
 * only from the free preview questions. The 309A course keeps its own flow and is refused here.
 */
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { questionAttempts, questions } from "../../drizzle/schema";
import { resolveAccessForRequest } from "../_core/accessService";
import { resolveEntitlementsByEmail } from "../_core/access";
import { resolveLearningIdentity } from "../_core/learningIdentity";
import { resolvePrimaryStudyFocus } from "../_core/studyFocus";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { attemptCourseFilter, attemptIdentityFilter, courseActivityScope } from "../courseActivityScope";
import { learnerVisibleQuestionFilter } from "../questionGovernance";
import { issuePracticeReceipt, practiceIdentity } from "../practiceQuestionReceipt";
import { resolveAttemptAttribution } from "../teams/attemptAttribution";
import { pickQuick10, type Quick10History } from "../quick10Selection";
import {
  buildPreviewSample, learnerQuestionColumns, OIT_PREVIEW_CALC_MINIMUMS, parseLearnerQuestions,
  previewLimitForRequest, previewRowsForBank, quizRouter,
} from "./quizRouter";

const HISTORY_ROW_LIMIT = 20_000;

function assertNotCertificationCourse(courseKey: string) {
  // 309A is served by its own beta-controlled flow, not the shared question bank.
  if (courseKey === "electrician-309a") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Quick 10 is not available for this course." });
  }
}

export const quick10Router = router({
  /** POST so an access token never appears in a URL. */
  start: publicProcedure
    .input(z.object({
      courseKey: z.string().min(1).max(64).optional(),
      accessToken: z.string().max(8192).optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // The course: the one asked for, or else the one the learner studied most recently.
      let requested = input?.courseKey;
      if (!requested) {
        const email = ctx.user?.email ?? ctx.studentEmail ?? null;
        const entitlements = email ? await resolveEntitlementsByEmail(email) : null;
        requested = (await resolvePrimaryStudyFocus({ email, unlockedExamTypes: entitlements?.unlockedExamTypes ?? [] })).courseKey ?? undefined;
      }
      if (!requested || !resolveCourseKey(requested)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a course to practise." });
      }
      const { course } = courseActivityScope(requested, { requireActive: true });
      assertNotCertificationCourse(course.courseKey);

      const hasAccess = await resolveAccessForRequest(ctx, course.courseKey, { accessToken: input?.accessToken });

      const rows = await db.select(learnerQuestionColumns).from(questions)
        .where(and(eq(questions.bankKey, course.questionBankKey), learnerVisibleQuestionFilter()))
        .orderBy(questions.questionNum);

      // Without the course, only the free preview questions are ever drawn from.
      const eligibleRows = hasAccess ? rows : buildPreviewSample(
        previewRowsForBank(rows, course.questionBankKey),
        previewLimitForRequest({ bankKey: course.courseKey, previewSurface: "practice" }),
        "practice",
        resolveCourseKey(course.courseKey)?.track === "oit" ? OIT_PREVIEW_CALC_MINIMUMS.practice : 0,
      );
      const parsed = parseLearnerQuestions(eligibleRows);

      // What this learner has done with each question so far (newest attempt per question).
      const actor = await practiceIdentity(ctx, input?.accessToken);
      const issued = await resolveLearningIdentity(actor.context);
      const history = new Map<number, Quick10History>();
      if (issued.userId || issued.studentEmail) {
        const attempts = await db.select({ questionId: questionAttempts.questionId, correct: questionAttempts.correct, createdAt: questionAttempts.createdAt })
          .from(questionAttempts)
          .where(and(attemptIdentityFilter(issued.userId, issued.studentEmail), attemptCourseFilter(course.courseKey)))
          .orderBy(desc(questionAttempts.createdAt), desc(questionAttempts.id))
          .limit(HISTORY_ROW_LIMIT);
        for (const a of attempts) {
          if (!history.has(a.questionId)) history.set(a.questionId, { lastCorrect: a.correct === "yes", lastAttemptAt: a.createdAt.getTime() });
        }
      }

      const picks = pickQuick10(parsed.map(q => ({ questionNum: q.id, module: q.module, q })), history);
      const attribution = hasAccess ? await resolveAttemptAttribution(issued, course.courseKey) : undefined;
      const attemptToken = await issuePracticeReceipt(course.questionBankKey, picks.map(p => p.question.q.id), actor.owner, !hasAccess, attribution);

      return {
        courseKey: course.courseKey,
        courseName: course.displayName,
        locked: !hasAccess,
        attemptToken,
        // Deliberately no correctIndex, explanation, steps or tip: those come back from quick10.answer.
        questions: picks.map(({ question }) => {
          const { id, module, topic, difficulty, cognitiveLevel, isCalc, question: text, options } = question.q;
          return { id, module, topic, difficulty, cognitiveLevel, isCalc, question: text, options };
        }),
      };
    }),

  answer: publicProcedure
    .input(z.object({
      courseKey: z.string().min(1).max(64),
      questionId: z.number().int().positive(),
      selectedIndex: z.number().int().min(0).max(3),
      sessionId: z.string().uuid(),
      operationId: z.string().uuid().optional(),
      confidence: z.enum(["low", "medium", "high"]).optional(),
      attemptToken: z.string().max(16384),
      accessToken: z.string().max(8192).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { course } = courseActivityScope(input.courseKey, { requireActive: true });
      assertNotCertificationCourse(course.courseKey);

      // The one attempt store. It checks the receipt, the access and the question before it saves.
      const saved = await quizRouter.createCaller(ctx).logAttempt({
        examType: course.courseKey,
        bankKey: course.questionBankKey,
        questionId: input.questionId,
        selectedIndex: input.selectedIndex,
        quizMode: "quick10",
        sessionId: input.sessionId,
        operationId: input.operationId,
        confidence: input.confidence,
        accessToken: input.accessToken,
        attemptToken: input.attemptToken,
      });
      // Not saved (no receipt for this question, no access, or a problem): reveal nothing.
      if (!saved || saved.success !== true) return { saved: false as const };

      const db = await getDb();
      if (!db) return { saved: false as const };
      const [row] = await db.select({ correctIndex: questions.correctIndex, explanation: questions.explanation, steps: questions.steps, tip: questions.tip })
        .from(questions)
        .where(and(eq(questions.bankKey, course.questionBankKey), eq(questions.questionNum, input.questionId), learnerVisibleQuestionFilter()))
        .limit(1);
      if (!row) return { saved: false as const };
      let steps: { l: string; c: string }[] | undefined;
      try { steps = row.steps ? JSON.parse(row.steps) as { l: string; c: string }[] : undefined; } catch { steps = undefined; }
      return {
        saved: true as const,
        correct: saved.correct === true,
        correctIndex: row.correctIndex,
        explanation: row.explanation,
        steps,
        tip: row.tip ?? undefined,
      };
    }),
});
