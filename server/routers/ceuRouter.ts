import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ceuLearningRecords } from "../../drizzle/schema";
import { ceuReadiness, type CeuLearningRecord } from "../../shared/ceuLearning";
import { identityEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { ceuCourse, publicCeuCourse } from "../ceu/catalogue";
import {
  instructorAction,
  learnerAction,
  newCeuRecord,
  transitionCeu,
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
  const course = courseFor(key);
  const db = await dbFor();
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
  revision: number,
  action: z.infer<typeof learnerAction> | z.infer<typeof instructorAction>,
  actor: string,
  instructor = false
) {
  const course = courseFor(key);
  const db = await dbFor();
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
    if (action.type === "exam") {
      const previous = current.attempts.find(a => a.id === action.attemptId);
      if (previous) {
        if (JSON.stringify(previous.answers) !== JSON.stringify(action.answers))
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This attempt was already submitted with different answers. Reload the saved record before starting another attempt.",
          });
        return current;
      }
    }
    if (current.revision !== revision)
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "This course changed in another tab. Reload the saved record before trying again; keep a copy of unsaved text.",
      });
    let next: CeuLearningRecord;
    try {
      next = transitionCeu(course, current, action, actor, instructor);
    } catch (e) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          e instanceof Error ? e.message : "The update was not accepted.",
      });
    }
    await tx
      .update(ceuLearningRecords)
      .set({ stateJson: JSON.stringify(next), revision: next.revision })
      .where(eq(ceuLearningRecords.id, row.id));
    return next;
  });
}
export const ceuRouter = router({
  course: publicProcedure
    .input(courseInput)
    .query(({ input }) => publicCeuCourse(courseFor(input.courseKey))),
  identity: publicProcedure.query(({ ctx }) => ({
    signedIn: !!identityEmail(resolveVerifiedIdentity(ctx)),
    reviewer: ctx.user?.role === "admin",
  })),
  myRecord: publicProcedure
    .input(courseInput)
    .query(({ ctx, input }) => readRecord(emailFor(ctx), input.courseKey)),
  start: publicProcedure.input(courseInput).mutation(async ({ ctx, input }) => {
    const email = emailFor(ctx),
      course = courseFor(input.courseKey),
      db = await dbFor();
    await db
      .insert(ceuLearningRecords)
      .values({
        studentEmail: email,
        courseKey: course.key,
        courseVersion: course.version,
        stateJson: JSON.stringify(newCeuRecord(course)),
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
    .mutation(async ({ ctx, input }) => {
      const email = emailFor(ctx);
      const record = await mutateRecord(
        email,
        input.courseKey,
        input.revision,
        input.action,
        email
      );
      // Formative feedback is returned only for the chosen check; final keys stay server-side.
      const feedback =
        input.action.type === "check"
          ? courseFor(input.courseKey)
              .modules.flatMap(m => m.checks)
              .find(
                q =>
                  q.id === (input.action as { questionId: string }).questionId
              )?.explanation
          : undefined;
      return { record, feedback };
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
      if (!ready.checksPassed || !ready.exercisesSubmitted)
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Complete module checks and submit the practical work to unlock assessment.",
        });
      return course.finalAssessment.map(
        ({ correctIndex, explanation, ...q }) => q
      );
    }),
  reviewQueue: adminProcedure.query(async () => {
    const db = await dbFor();
    const rows = await db
      .select()
      .from(ceuLearningRecords)
      .orderBy(desc(ceuLearningRecords.updatedAt))
      .limit(100);
    return rows.map(r => ({
      email: r.studentEmail,
      courseKey: r.courseKey,
      courseVersion: r.courseVersion,
      record: parseRecord(r.stateJson),
    }));
  }),
  instructorMaterial: adminProcedure
    .input(courseInput)
    .query(({ input }) => courseFor(input.courseKey)),
  review: adminProcedure
    .input(
      courseInput.extend({
        email: z.string().email().max(320),
        revision: z.number().int().min(0),
        action: instructorAction,
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.email.toLowerCase() === emailFor(ctx))
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Another authorized instructor must review and attest your own learning.",
        });
      return mutateRecord(
        input.email.toLowerCase(),
        input.courseKey,
        input.revision,
        input.action,
        `admin:${ctx.user.id}`,
        true
      );
    }),
});
