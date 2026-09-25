import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, and, eq } from "drizzle-orm";
import { ceuLearningDailyTime, ceuLearningRecords } from "../drizzle/schema";
import { getDb } from "./db";
import { ceuRouter } from "./routers/ceuRouter";
import { ceuCourse } from "./ceu/catalogue";
import { exerciseFor } from "./ceu/exerciseBank";
import {
  moduleMinimumMinutes,
  type CeuLearningRecord,
} from "../shared/ceuLearning";
import { torontoDate } from "./ceu/learningState";
import type { TrpcContext } from "./_core/context";
const enabled = process.env.CEU_INTEGRATION_TEST_DB === "1";
const prefix = `ceu-${randomUUID()}`;
const emails = [`${prefix}-a@example.test`, `${prefix}-b@example.test`];
const ctx = (email: string) =>
  ({ studentEmail: email, user: null, req: {}, res: {} }) as TrpcContext;
const learner = ceuRouter.createCaller(ctx(emails[0])),
  other = ceuRouter.createCaller(ctx(emails[1]));
const course = ceuCourse("ceu-sampling-data-quality")!,
  courseKey = course.key;
async function seedElapsed(
  email: string,
  key: string,
  r: CeuLearningRecord,
  moduleId: string,
  seconds: number
) {
  const db = (await getDb())!;
  const next = structuredClone(r);
  next.modules[moduleId].activeSeconds = seconds;
  await db
    .update(ceuLearningRecords)
    .set({
      stateJson: JSON.stringify(next),
      activeSeconds: Object.values(next.modules).reduce(
        (n, m) => n + m.activeSeconds,
        0
      ),
    })
    .where(
      and(
        eq(ceuLearningRecords.studentEmail, email),
        eq(ceuLearningRecords.courseKey, key)
      )
    );
}
describe.skipIf(!enabled)("CEU database-backed self-paced lifecycle", () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL || !(await getDb()))
      throw Error("Disposable CEU test database required.");
  });
  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db
        .delete(ceuLearningDailyTime)
        .where(inArray(ceuLearningDailyTime.studentEmail, emails));
      await db
        .delete(ceuLearningRecords)
        .where(inArray(ceuLearningRecords.studentEmail, emails));
    }
  });
  it("serializes concurrent writes, keeps accounts apart and automatically completes with no admin call", async () => {
    const enrollment = {
      courseKey,
      learnerName: "Example Learner",
      operatorNumber: "90000064",
    };
    const initial = await learner.start(enrollment);
    expect(initial?.revision).toBe(0);
    expect(
      await learner.start({ ...enrollment, learnerName: "Changed Name" })
    ).toEqual(initial);
    await other.start({ ...enrollment, operatorNumber: "90000782" });
    const id = course.modules[0].id;
    let result = await learner.save({
      courseKey,
      revision: 0,
      action: { type: "draft", moduleId: id, text: "Case notes" },
    });
    expect((await learner.myRecord({ courseKey }))?.modules[id].draft).toBe(
      "Case notes"
    );
    expect((await other.myRecord({ courseKey }))?.modules[id].draft).toBe("");
    const concurrent = await Promise.allSettled(
      ["first", "second"].map(text =>
        learner.save({
          courseKey,
          revision: result.record.revision,
          action: { type: "draft", moduleId: id, text },
        })
      )
    );
    expect(concurrent.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(concurrent.find(x => x.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
    await expect(learner.assessment({ courseKey })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    for (const m of course.modules) {
      let r = (await learner.myRecord({ courseKey }))!;
      const keyed = exerciseFor(
        courseKey,
        m.id,
        r.modules[m.id].exerciseSeed,
        0
      );
      const pub = await learner.exercise({ courseKey, moduleId: m.id });
      expect(JSON.stringify(pub)).not.toContain('"correct"');
      await expect(
        learner.save({
          courseKey,
          revision: r.revision,
          action: {
            type: "submitExercise",
            moduleId: m.id,
            attemptId: randomUUID(),
            answers: keyed.map(q => q.correct),
          },
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      // Disposable database fixture represents elapsed study; production has no time-setting endpoint.
      await seedElapsed(
        emails[0],
        courseKey,
        r,
        m.id,
        moduleMinimumMinutes(m) * 60
      );
      r = (await learner.myRecord({ courseKey }))!;
      const action = {
        type: "submitExercise" as const,
        moduleId: m.id,
        attemptId: randomUUID(),
        answers: keyed.map(q => q.correct),
      };
      const before = r.revision;
      result = await learner.save({ courseKey, revision: r.revision, action });
      expect(result.record.modules[m.id].exerciseAttempts.at(-1)?.passed).toBe(
        true
      );
      expect(result.feedback).toHaveLength(keyed.length);
      expect(
        (await learner.save({ courseKey, revision: before, action })).record
      ).toEqual(result.record);
      r = result.record;
      for (const q of m.checks)
        r = (
          await learner.save({
            courseKey,
            revision: r.revision,
            action: {
              type: "check",
              moduleId: m.id,
              questionId: q.id,
              choice: q.correctIndex,
            },
          })
        ).record;
    }
    let r = (await learner.myRecord({ courseKey }))!;
    const total = Object.values(r.modules).reduce(
      (sum, m) => sum + m.activeSeconds,
      0
    );
    if (total < course.plannedMinutes * 60) {
      await seedElapsed(
        emails[0],
        courseKey,
        r,
        course.modules.at(-1)!.id,
        r.modules[course.modules.at(-1)!.id].activeSeconds +
          course.plannedMinutes * 60 -
          total
      );
      r = (await learner.myRecord({ courseKey }))!;
    }
    const questions = await learner.assessment({ courseKey });
    expect(JSON.stringify(questions)).not.toContain("correctIndex");
    const action = {
      type: "exam" as const,
      attemptId: randomUUID(),
      answers: course.finalAssessment.map(q => q.correctIndex),
    };
    const before = r.revision;
    r = (await learner.save({ courseKey, revision: r.revision, action }))
      .record;
    expect(r.completion).toMatchObject({
      name: "Example Learner",
      operatorNumber: "90000064",
      courseId: courseKey,
      finalScore: 8,
    });
    expect(
      (await learner.save({ courseKey, revision: before, action })).record
        .completion?.id
    ).toBe(r.completion?.id);
    await expect(
      learner.save({
        courseKey,
        revision: r.revision,
        action: { type: "draft", moduleId: id, text: "altered" },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await other.myRecord({ courseKey }))?.completion).toBeUndefined();
  }, 30000);
  it("enforces one daily time budget across different courses", async () => {
    const second = ceuCourse("ceu-instrumentation-scada")!;
    await other.start({
      courseKey: second.key,
      learnerName: "Other Learner",
      operatorNumber: "90000782",
    });
    const now = new Date(),
      date = torontoDate(now.toISOString());
    const db = (await getDb())!;
    await db
      .insert(ceuLearningDailyTime)
      .values({
        studentEmail: emails[1],
        localDate: date,
        seconds: 7 * 3600 - 5,
      })
      .onDuplicateKeyUpdate({ set: { seconds: 7 * 3600 - 5 } });
    const r = (await other.myRecord({ courseKey: second.key }))!;
    r.modules[second.modules[0].id].lastHeartbeatAt = new Date(
      now.getTime() - 30_000
    ).toISOString();
    await db
      .update(ceuLearningRecords)
      .set({ stateJson: JSON.stringify(r) })
      .where(
        and(
          eq(ceuLearningRecords.studentEmail, emails[1]),
          eq(ceuLearningRecords.courseKey, second.key)
        )
      );
    await expect(
      other.heartbeat({
        courseKey: second.key,
        moduleId: second.modules[0].id,
        activityAt: new Date().toISOString(),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not double-count overlapping tabs in the shared daily ledger", async () => {
    const second = ceuCourse("ceu-instrumentation-scada")!;
    const now = new Date(),
      date = torontoDate(now.toISOString()),
      db = (await getDb())!;
    await db
      .insert(ceuLearningDailyTime)
      .values({ studentEmail: emails[1], localDate: date, seconds: 0 })
      .onDuplicateKeyUpdate({ set: { seconds: 0 } });
    await db
      .update(ceuLearningDailyTime)
      .set({
        seconds: 50,
        lastCreditedAt: new Date(now.getTime() - 5_000),
      })
      .where(
        and(
          eq(ceuLearningDailyTime.studentEmail, emails[1]),
          eq(ceuLearningDailyTime.localDate, date)
        )
      );
    const r = (await other.myRecord({ courseKey: second.key }))!;
    r.modules[second.modules[0].id].lastHeartbeatAt = new Date(
      now.getTime() - 30_000
    ).toISOString();
    await db
      .update(ceuLearningRecords)
      .set({ stateJson: JSON.stringify(r) })
      .where(
        and(
          eq(ceuLearningRecords.studentEmail, emails[1]),
          eq(ceuLearningRecords.courseKey, second.key)
        )
      );
    const result = await other.heartbeat({
      courseKey: second.key,
      moduleId: second.modules[0].id,
      activityAt: new Date().toISOString(),
    });
    expect(
      result.record.modules[second.modules[0].id].activeSeconds
    ).toBeLessThanOrEqual(7);
    const [ledger] = await db
      .select()
      .from(ceuLearningDailyTime)
      .where(
        and(
          eq(ceuLearningDailyTime.studentEmail, emails[1]),
          eq(ceuLearningDailyTime.localDate, date)
        )
      );
    expect(ledger.seconds).toBeLessThanOrEqual(57);
  });
});
