import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
  diagnosticSessions,
  examDates,
  learnerOnboarding,
  questionAttempts,
  questions,
  studentProfiles,
  users,
} from "../../drizzle/schema";
import {
  buildDiagnosticBaseline,
  DIAGNOSTIC_QUESTION_COUNT,
  estimateWeeklyQuestionGoal,
  selectDiagnosticQuestionNumbers,
} from "../../shared/activationPlan";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { assertAccess, getAccessibleCoursesForIdentity, identityEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { resolveLearningIdentity } from "../_core/learningIdentity";
import { publicProcedure, router } from "../_core/trpc";
import { trackEvent } from "../analytics";
import { getDb } from "../db";
import { learnerVisibleQuestionFilter } from "../questionGovernance";

type Identity = Awaited<ReturnType<typeof resolveLearningIdentity>>;

function identityCourseWhere(identity: Identity, courseKey: string) {
  const identityWhere = identity.userId && identity.studentEmail
    ? or(eq(learnerOnboarding.userId, identity.userId), eq(learnerOnboarding.studentEmail, identity.studentEmail))
    : identity.userId
      ? eq(learnerOnboarding.userId, identity.userId)
      : eq(learnerOnboarding.studentEmail, identity.studentEmail!);
  return and(identityWhere, eq(learnerOnboarding.courseKey, courseKey));
}

function diagnosticIdentityWhere(identity: Identity, courseKey: string) {
  const identityWhere = identity.userId && identity.studentEmail
    ? or(eq(diagnosticSessions.userId, identity.userId), eq(diagnosticSessions.studentEmail, identity.studentEmail))
    : identity.userId
      ? eq(diagnosticSessions.userId, identity.userId)
      : eq(diagnosticSessions.studentEmail, identity.studentEmail!);
  return and(identityWhere, eq(diagnosticSessions.courseKey, courseKey));
}

function requireVerified(identity: Identity) {
  if (!identity.userId && !identity.studentEmail) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Verify your email to set up your study plan." });
  }
}

function diagnosticSeed(identity: Identity, courseKey: string) {
  const seedSource = `${identity.studentEmail ?? identity.userId}:${courseKey}`;
  return Number.parseInt(createHash("sha256").update(seedSource).digest("hex").slice(0, 8), 16);
}

async function resolveCourseForRequest(ctx: Parameters<typeof resolveVerifiedIdentity>[0], requested?: string) {
  const verified = resolveVerifiedIdentity(ctx);
  if (verified.type === "anonymous") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Verify your email to continue." });
  }

  const course = requested
    ? resolveCourseKey(requested)
    : (await getAccessibleCoursesForIdentity(verified))[0];
  if (!course?.isActive) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });
  }
  await assertAccess(ctx, course.courseKey);
  return course;
}

function parseDiagnosticRow(row: typeof diagnosticSessions.$inferSelect | undefined) {
  if (!row) return null;
  return {
    sessionId: row.sessionId,
    score: row.score,
    correct: row.correct,
    total: row.total,
    label: row.label,
    weakTopics: JSON.parse(row.weakTopics || "[]") as string[],
    strongTopics: JSON.parse(row.strongTopics || "[]") as string[],
    topicBreakdown: JSON.parse(row.topicBreakdown || "{}") as Record<string, { correct: number; total: number; accuracy: number }>,
    completedAt: row.completedAt,
    calibrationNote: "Starting baseline only — not an official exam score or a prediction of passing.",
  };
}

async function mergeDiagnosticIntoProfile(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  identity: Identity,
  courseKey: string,
  answers: Array<{ module: string; correct: boolean }>,
) {
  let profileUserId = identity.userId;
  let profileEmail = identity.studentEmail;
  if (!profileUserId && profileEmail) {
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, profileEmail)).limit(1);
    if (existingUser[0]) {
      profileUserId = existingUser[0].id;
      profileEmail = null;
    }
  }
  if (!profileUserId && !profileEmail) return;

  const profileWhere = profileUserId
    ? eq(studentProfiles.userId, profileUserId)
    : eq(studentProfiles.studentEmail, profileEmail!);
  const [existing] = await db.select().from(studentProfiles).where(profileWhere).limit(1);
  const topicAccuracy: Record<string, { correct: number; total: number }> = existing
    ? JSON.parse(existing.topicAccuracy || "{}")
    : {};
  for (const answer of answers) {
    const current = topicAccuracy[answer.module] ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.correct) current.correct += 1;
    topicAccuracy[answer.module] = current;
  }
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const [topic, value] of Object.entries(topicAccuracy)) {
    const accuracy = value.total > 0 ? value.correct / value.total : 0;
    if (accuracy < 0.65) weakTopics.push(topic);
    else if (accuracy >= 0.8) strongTopics.push(topic);
  }
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  if (existing) {
    await db.update(studentProfiles).set({
      examType: courseKey,
      topicAccuracy: JSON.stringify(topicAccuracy),
      weakTopics: JSON.stringify(weakTopics),
      strongTopics: JSON.stringify(strongTopics),
      totalAttempts: existing.totalAttempts + answers.length,
      totalSessions: existing.totalSessions + 1,
      lastActiveDate: today,
    }).where(profileWhere);
  } else {
    await db.insert(studentProfiles).values({
      userId: profileUserId,
      studentEmail: profileEmail,
      examType: courseKey,
      topicAccuracy: JSON.stringify(topicAccuracy),
      weakTopics: JSON.stringify(weakTopics),
      strongTopics: JSON.stringify(strongTopics),
      totalAttempts: answers.length,
      totalSessions: 1,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
    });
  }
}

export const activationRouter = router({
  status: publicProcedure
    .input(z.object({ courseKey: z.string().min(1).max(64).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const course = await resolveCourseForRequest(ctx, input?.courseKey);
      const identity = await resolveLearningIdentity(ctx);
      requireVerified(identity);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [onboarding, latestDiagnostic] = await Promise.all([
        db.select().from(learnerOnboarding).where(identityCourseWhere(identity, course.courseKey)).limit(1).then(rows => rows[0]),
        db.select().from(diagnosticSessions).where(diagnosticIdentityWhere(identity, course.courseKey))
          .orderBy(desc(diagnosticSessions.completedAt)).limit(1).then(rows => rows[0]),
      ]);
      const weeklyQuestionGoal = estimateWeeklyQuestionGoal(onboarding?.studyDaysPerWeek ?? 3, onboarding?.sessionMinutes ?? 25);
      return {
        course: {
          courseKey: course.courseKey,
          displayName: course.displayName,
          quizPath: course.quizPath,
          mockExamPath: course.mockExamPath,
        },
        status: onboarding?.status ?? "not_started",
        profile: onboarding ? {
          examDate: onboarding.examDate,
          studyDaysPerWeek: onboarding.studyDaysPerWeek,
          sessionMinutes: onboarding.sessionMinutes,
          confidence: onboarding.confidence,
          weeklyQuestionGoal,
        } : null,
        diagnostic: parseDiagnosticRow(latestDiagnostic),
      };
    }),

  saveProfile: publicProcedure
    .input(z.object({
      courseKey: z.string().min(1).max(64),
      examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      studyDaysPerWeek: z.number().int().min(1).max(7),
      sessionMinutes: z.union([z.literal(15), z.literal(25), z.literal(40), z.literal(60)]),
      confidence: z.enum(["starting_out", "somewhat", "confident"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const course = await resolveCourseForRequest(ctx, input.courseKey);
      const identity = await resolveLearningIdentity(ctx);
      requireVerified(identity);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const examDate = input.examDate ? new Date(`${input.examDate}T12:00:00.000Z`) : null;
      const existing = await db.select({ id: learnerOnboarding.id })
        .from(learnerOnboarding).where(identityCourseWhere(identity, course.courseKey)).limit(1);
      const values = {
        userId: identity.userId,
        studentEmail: identity.studentEmail,
        orgId: identity.orgId,
        organizationMemberId: identity.organizationMemberId,
        courseKey: course.courseKey,
        examDate,
        studyDaysPerWeek: input.studyDaysPerWeek,
        sessionMinutes: input.sessionMinutes,
        confidence: input.confidence,
        status: "profile_completed",
      };
      if (existing[0]) await db.update(learnerOnboarding).set(values).where(eq(learnerOnboarding.id, existing[0].id));
      else await db.insert(learnerOnboarding).values(values);

      const email = identity.studentEmail ?? identityEmail(resolveVerifiedIdentity(ctx));
      if (email && examDate) {
        const current = await db.select({ id: examDates.id }).from(examDates)
          .where(and(eq(examDates.email, email), eq(examDates.productKey, course.courseKey))).limit(1);
        const examValues = {
          examDate,
          remindersSent: "[]",
          orgId: identity.orgId,
          organizationMemberId: identity.organizationMemberId,
          courseKey: course.courseKey,
        };
        if (current[0]) await db.update(examDates).set(examValues).where(eq(examDates.id, current[0].id));
        else await db.insert(examDates).values({ email, productKey: course.courseKey, ...examValues });
      }
      await trackEvent("onboarding_profile_completed", {
        userId: identity.userId?.toString() ?? null,
        email,
        examType: course.courseKey,
        orgId: identity.orgId,
        extra: { hasExamDate: !!examDate, studyDaysPerWeek: input.studyDaysPerWeek, sessionMinutes: input.sessionMinutes },
      });
      return { success: true, weeklyQuestionGoal: estimateWeeklyQuestionGoal(input.studyDaysPerWeek, input.sessionMinutes) };
    }),

  diagnosticQuestions: publicProcedure
    .input(z.object({ courseKey: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      const course = await resolveCourseForRequest(ctx, input.courseKey);
      const identity = await resolveLearningIdentity(ctx);
      requireVerified(identity);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [onboarding] = await db.select().from(learnerOnboarding)
        .where(identityCourseWhere(identity, course.courseKey)).limit(1);
      if (!onboarding) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your study setup before starting the diagnostic." });
      }
      const rows = await db.select({
        questionNum: questions.questionNum,
        module: questions.module,
        difficulty: questions.difficulty,
        question: questions.question,
        options: questions.options,
      }).from(questions).where(and(
        eq(questions.bankKey, course.questionBankKey),
        learnerVisibleQuestionFilter(),
      ));
      if (rows.length < DIAGNOSTIC_QUESTION_COUNT) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This course does not have enough diagnostic questions yet." });
      }
      const seed = diagnosticSeed(identity, course.courseKey);
      const selectedIds = selectDiagnosticQuestionNumbers(rows, seed);
      const byId = new Map(rows.map(row => [row.questionNum, row]));
      const selected = selectedIds.map(id => byId.get(id)!).map(row => ({
        id: row.questionNum,
        module: row.module,
        difficulty: row.difficulty,
        question: row.question,
        options: JSON.parse(row.options) as string[],
      }));
      if (!onboarding.diagnosticStartedAt) {
        await db.update(learnerOnboarding).set({ status: "diagnostic_started", diagnosticStartedAt: new Date() })
          .where(eq(learnerOnboarding.id, onboarding.id));
        await trackEvent("diagnostic_started", {
          userId: identity.userId?.toString() ?? null,
          email: identity.studentEmail,
          examType: course.courseKey,
          orgId: identity.orgId,
        });
      }
      return { courseKey: course.courseKey, courseName: course.displayName, questions: selected, total: selected.length };
    }),

  submitDiagnostic: publicProcedure
    .input(z.object({
      courseKey: z.string().min(1).max(64),
      sessionId: z.string().uuid(),
      answers: z.array(z.object({ questionId: z.number().int().positive(), selectedIndex: z.number().int().min(0).max(9) }))
        .length(DIAGNOSTIC_QUESTION_COUNT)
        .refine(answers => new Set(answers.map(answer => answer.questionId)).size === answers.length, "Each diagnostic question may be answered once."),
    }))
    .mutation(async ({ ctx, input }) => {
      const course = await resolveCourseForRequest(ctx, input.courseKey);
      const identity = await resolveLearningIdentity(ctx);
      requireVerified(identity);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const replay = await db.select().from(diagnosticSessions).where(eq(diagnosticSessions.sessionId, input.sessionId)).limit(1);
      if (replay[0]) {
        const belongsToIdentity = (identity.userId && replay[0].userId === identity.userId)
          || (identity.studentEmail && replay[0].studentEmail === identity.studentEmail);
        if (!belongsToIdentity) throw new TRPCError({ code: "CONFLICT", message: "Diagnostic session already used." });
        return { ...parseDiagnosticRow(replay[0])!, recommendation: "Continue with your personalized study plan." };
      }
      const completed = await db.select().from(diagnosticSessions)
        .where(diagnosticIdentityWhere(identity, course.courseKey))
        .orderBy(desc(diagnosticSessions.completedAt)).limit(1);
      if (completed[0]) {
        return { ...parseDiagnosticRow(completed[0])!, recommendation: "Continue with your personalized study plan." };
      }
      const onboarding = await db.select({ id: learnerOnboarding.id }).from(learnerOnboarding)
        .where(identityCourseWhere(identity, course.courseKey)).limit(1);
      if (!onboarding[0]) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your study setup before submitting the diagnostic." });
      }

      const rows = await db.select({
        questionNum: questions.questionNum,
        correctIndex: questions.correctIndex,
        module: questions.module,
        topic: questions.topic,
        difficulty: questions.difficulty,
      }).from(questions).where(and(
        eq(questions.bankKey, course.questionBankKey),
        learnerVisibleQuestionFilter(),
      ));
      const expectedQuestionIds = selectDiagnosticQuestionNumbers(rows, diagnosticSeed(identity, course.courseKey));
      const submittedQuestionIds = input.answers.map(answer => answer.questionId);
      if (
        expectedQuestionIds.length !== DIAGNOSTIC_QUESTION_COUNT
        || [...expectedQuestionIds].sort((a, b) => a - b).some((id, index) => id !== [...submittedQuestionIds].sort((a, b) => a - b)[index])
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Diagnostic answers do not match this course." });
      }
      const rowById = new Map(rows.map(row => [row.questionNum, row]));
      const scored = input.answers.map(answer => {
        const row = rowById.get(answer.questionId)!;
        return {
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
          module: row.topic ?? row.module,
          difficulty: row.difficulty,
          correct: answer.selectedIndex === row.correctIndex,
        };
      });
      const baseline = buildDiagnosticBaseline(scored);
      const completedAt = new Date();

      await db.transaction(async tx => {
        await tx.insert(questionAttempts).values(scored.map(answer => ({
          userId: identity.userId,
          studentEmail: identity.studentEmail,
          examType: course.courseKey,
          topic: answer.module,
          questionId: answer.questionId,
          correct: answer.correct ? "yes" as const : "no" as const,
          difficulty: answer.difficulty,
          quizMode: "diagnostic",
          sessionId: input.sessionId,
          selectedIndex: answer.selectedIndex,
          bankKey: course.questionBankKey,
          courseKey: course.courseKey,
          orgId: identity.orgId,
          organizationMemberId: identity.organizationMemberId,
        })));
        await tx.insert(diagnosticSessions).values({
          sessionId: input.sessionId,
          userId: identity.userId,
          studentEmail: identity.studentEmail,
          orgId: identity.orgId,
          organizationMemberId: identity.organizationMemberId,
          courseKey: course.courseKey,
          correct: baseline.correct,
          total: baseline.total,
          score: baseline.score,
          label: baseline.label,
          weakTopics: JSON.stringify(baseline.weakTopics),
          strongTopics: JSON.stringify(baseline.strongTopics),
          topicBreakdown: JSON.stringify(baseline.topicBreakdown),
          completedAt,
        });
        const [onboarding] = await tx.select({ id: learnerOnboarding.id }).from(learnerOnboarding)
          .where(identityCourseWhere(identity, course.courseKey)).limit(1);
        if (onboarding) {
          await tx.update(learnerOnboarding).set({ status: "completed", completedAt }).where(eq(learnerOnboarding.id, onboarding.id));
        }
      });

      await mergeDiagnosticIntoProfile(db, identity, course.courseKey, scored);
      await trackEvent("diagnostic_completed", {
        userId: identity.userId?.toString() ?? null,
        email: identity.studentEmail,
        examType: course.courseKey,
        orgId: identity.orgId,
        extra: { questionCount: baseline.total, weakTopicCount: baseline.weakTopics.length },
      });
      return {
        ...baseline,
        sessionId: input.sessionId,
        completedAt,
        calibrationNote: "Starting baseline only — not an official exam score or a prediction of passing.",
      };
    }),
});
