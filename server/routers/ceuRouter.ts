import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ceuLearningDailyTime, ceuLearningRecords } from "../../drizzle/schema";
import { ceuReadiness, type CeuLearningRecord } from "../../shared/ceuLearning";
import { identityEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { publicProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { ceuCourse, publicCeuCourse } from "../ceu/catalogue";
import {
  exerciseFor,
  gradeExercise,
  publicExercise,
} from "../ceu/exerciseBank";
import {
  learnerAction,
  newCeuRecord,
  torontoDate,
  transitionCeu,
  type LearnerAction,
} from "../ceu/learningState";

const courseInput = z.object({ courseKey: z.string().min(1).max(80) });
function courseFor(key: string) {
  const course = ceuCourse(key);
  if (!course)
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });
  return course;
}
function emailFor(ctx: TrpcContext) {
  const email = identityEmail(resolveVerifiedIdentity(ctx));
  if (!email)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in to save your learning.",
    });
  return email.toLowerCase();
}
async function dbFor() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Learning records are temporarily unavailable. Your work has not been saved.",
    });
  return db;
}
const whereRecord = (email: string, key: string, version: string) =>
  and(
    eq(ceuLearningRecords.studentEmail, email),
    eq(ceuLearningRecords.courseKey, key),
    eq(ceuLearningRecords.courseVersion, version)
  );
function parseRecord(json: string): CeuLearningRecord {
  return JSON.parse(json);
}
async function readRecord(email: string, key: string) {
  const course = courseFor(key),
    db = await dbFor();
  const [row] = await db
    .select()
    .from(ceuLearningRecords)
    .where(whereRecord(email, key, course.version))
    .limit(1);
  return row ? parseRecord(row.stateJson) : null;
}
async function mutateRecord(
  email: string,
  key: string,
  revision: number | null,
  action: LearnerAction,
  actor: string
) {
  const course = courseFor(key),
    db = await dbFor();
  return db.transaction(async tx => {
    const [row] = await tx
      .select()
      .from(ceuLearningRecords)
      .where(whereRecord(email, key, course.version))
      .for("update");
    if (!row)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Start the course before saving work.",
      });
    const current = parseRecord(row.stateJson);
    if (action.type === "exam" || action.type === "submitExercise") {
      const previous =
        action.type === "exam"
          ? current.attempts.find(a => a.id === action.attemptId)
          : current.modules[action.moduleId]?.exerciseAttempts.find(
              a => a.id === action.attemptId
            );
      if (previous) {
        if (JSON.stringify(previous.answers) !== JSON.stringify(action.answers))
          throw new TRPCError({
            code: "CONFLICT",
            message: "This attempt was submitted with different answers.",
          });
        return { record: current, feedback: undefined };
      }
    }
    if (revision !== null && current.revision !== revision)
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "This course changed in another tab. Reload your saved record before trying again.",
      });
    let next: CeuLearningRecord;
    let feedback:
      ReturnType<typeof gradeExercise>["feedback"] | string | undefined;
    try {
      if (action.type === "submitExercise") {
        const mod = current.modules[action.moduleId];
        if (!mod) throw Error("Unknown course module.");
        feedback = gradeExercise(
          exerciseFor(
            key,
            action.moduleId,
            mod.exerciseSeed,
            mod.exerciseAttempts.length
          ),
          action.answers
        ).feedback;
      }
      next = transitionCeu(course, current, action, actor);
      if (action.type === "check")
        feedback = course.modules
          .flatMap(m => m.checks)
          .find(q => q.id === action.questionId)?.explanation;
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          error instanceof Error
            ? error.message
            : "The update was not accepted.",
      });
    }
    if (action.type === "heartbeat") {
      const date = torontoDate(next.updatedAt);
      let credited =
        (next.dailySeconds[date] ?? 0) - (current.dailySeconds[date] ?? 0);
      if (credited > 0) {
        await tx
          .insert(ceuLearningDailyTime)
          .values({ studentEmail: email, localDate: date, seconds: 0 })
          .onDuplicateKeyUpdate({
            set: { seconds: sql`${ceuLearningDailyTime.seconds}` },
          });
        const [total] = await tx
          .select()
          .from(ceuLearningDailyTime)
          .where(
            and(
              eq(ceuLearningDailyTime.studentEmail, email),
              eq(ceuLearningDailyTime.localDate, date)
            )
          )
          .for("update");
        // Concurrent tabs/courses share one clock: overlapping seconds are credited once.
        if (total.lastCreditedAt) {
          const available = Math.max(
            0,
            Math.floor(
              (Date.parse(next.updatedAt) - total.lastCreditedAt.getTime()) /
                1000
            )
          );
          if (available < credited) {
            const overlap = credited - available;
            next.modules[action.moduleId].activeSeconds -= overlap;
            next.dailySeconds[date] -= overlap;
            credited = available;
          }
        }
        if (total.seconds + credited > 7 * 3600)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "The seven-hour daily learning-time limit has been reached across courses.",
          });
        await tx
          .update(ceuLearningDailyTime)
          .set({
            seconds: total.seconds + credited,
            lastCreditedAt: new Date(next.updatedAt),
          })
          .where(
            and(
              eq(ceuLearningDailyTime.studentEmail, email),
              eq(ceuLearningDailyTime.localDate, date)
            )
          );
      }
    }
    await tx
      .update(ceuLearningRecords)
      .set({
        stateJson: JSON.stringify(next),
        revision: next.revision,
        operatorNumber: next.operatorNumber,
        activeSeconds: ceuReadiness(course, next).recordedSeconds,
        exerciseAttempts: Object.values(next.modules).reduce(
          (s, m) => s + m.exerciseAttempts.length,
          0
        ),
      })
      .where(eq(ceuLearningRecords.id, row.id));
    return { record: next, feedback };
  });
}
export const ceuRouter = router({
  course: publicProcedure
    .input(courseInput)
    .query(({ input }) => publicCeuCourse(courseFor(input.courseKey))),
  /** Public inspection only. Answer keys, explanations and submission remain server-held. */
  finalPreview: publicProcedure
    .input(courseInput)
    .query(({ input }) =>
      courseFor(input.courseKey).finalAssessment.map(
        ({ correctIndex, explanation, ...question }) => question
      )
    ),
  identity: publicProcedure.query(({ ctx }) => ({
    signedIn: !!identityEmail(resolveVerifiedIdentity(ctx)),
  })),
  myRecord: publicProcedure
    .input(courseInput)
    .query(({ ctx, input }) => readRecord(emailFor(ctx), input.courseKey)),
  start: publicProcedure
    .input(
      courseInput.extend({
        learnerName: z.string().trim().min(2).max(150),
        operatorNumber: z
          .string()
          .trim()
          .regex(
            /^[A-Za-z0-9][A-Za-z0-9-]{2,31}$/,
            "Enter a valid operator ID."
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = emailFor(ctx),
        course = courseFor(input.courseKey),
        db = await dbFor();
      const record = newCeuRecord(
        course,
        input.learnerName,
        input.operatorNumber
      );
      await db
        .insert(ceuLearningRecords)
        .values({
          studentEmail: email,
          courseKey: course.key,
          courseVersion: course.version,
          operatorNumber: record.operatorNumber,
          activeSeconds: 0,
          exerciseAttempts: 0,
          stateJson: JSON.stringify(record),
          revision: 0,
        })
        .onDuplicateKeyUpdate({
          set: { revision: sql`${ceuLearningRecords.revision}` },
        });
      return readRecord(email, course.key);
    }),
  save: publicProcedure
    .input(
      courseInput.extend({
        revision: z.number().int().min(0),
        action: learnerAction,
      })
    )
    .mutation(({ ctx, input }) =>
      mutateRecord(
        emailFor(ctx),
        input.courseKey,
        input.revision,
        input.action,
        emailFor(ctx)
      )
    ),
  heartbeat: publicProcedure
    .input(
      courseInput.extend({
        moduleId: z.string().max(80),
        activityAt: z.string().datetime(),
      })
    )
    .mutation(({ ctx, input }) =>
      mutateRecord(
        emailFor(ctx),
        input.courseKey,
        null,
        {
          type: "heartbeat",
          moduleId: input.moduleId,
          activityAt: input.activityAt,
        },
        emailFor(ctx)
      )
    ),
  exercise: publicProcedure
    .input(courseInput.extend({ moduleId: z.string().max(80) }))
    .query(async ({ ctx, input }) => {
      const course = courseFor(input.courseKey),
        record = await readRecord(emailFor(ctx), course.key);
      if (!record)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Start this course first.",
        });
      const mod = record.modules[input.moduleId];
      if (!mod)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module not found.",
        });
      return publicExercise(
        exerciseFor(
          course.key,
          input.moduleId,
          mod.exerciseSeed,
          mod.exerciseAttempts.length
        )
      );
    }),
  assessment: publicProcedure
    .input(courseInput)
    .query(async ({ ctx, input }) => {
      const course = courseFor(input.courseKey),
        record = await readRecord(emailFor(ctx), course.key);
      if (!record)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Start this course first.",
        });
      const ready = ceuReadiness(course, record);
      if (!ready.modulesCompleted)
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Complete every course module to unlock the final assessment.",
        });
      return course.finalAssessment.map(
        ({ correctIndex, explanation, ...q }) => q
      );
    }),
  results: publicProcedure
    .input(
      courseInput.extend({ attemptId: z.string().uuid().optional() })
    )
    .query(async ({ ctx, input }) => {
      const course = courseFor(input.courseKey);
      const record = await readRecord(emailFor(ctx), course.key);
      if (!record)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Start this course first.",
        });
      const attempt = input.attemptId
        ? record.attempts.find(item => item.id === input.attemptId)
        : record.attempts.at(-1);
      if (!attempt)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No submitted assessment is available.",
        });
      return {
        id: attempt.id,
        score: attempt.score,
        total: attempt.total,
        passed: attempt.passed,
        at: attempt.at,
        review: course.finalAssessment
          .map((question, index) => ({
            id: question.id,
            objective: question.objective,
            prompt: question.prompt,
            choices: question.choices,
            selectedIndex: attempt.answers[index],
            correctIndex: question.correctIndex,
            explanation: question.explanation,
          }))
          .filter(question => question.selectedIndex !== question.correctIndex),
      };
    }),
});
