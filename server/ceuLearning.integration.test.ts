import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { ceuLearningRecords } from "../drizzle/schema";
import { getDb } from "./db";
import { ceuRouter } from "./routers/ceuRouter";
import { ceuCourse } from "./ceu/catalogue";
import type { TrpcContext } from "./_core/context";
const enabled = process.env.CEU_INTEGRATION_TEST_DB === "1";
const prefix = `ceu-${randomUUID()}`;
const emails = [
  `${prefix}-a@example.test`,
  `${prefix}-b@example.test`,
  `${prefix}-instructor@example.test`,
];
const ctx = (email: string, admin = false) =>
  ({
    studentEmail: admin ? null : email,
    user: admin ? { id: 987654, role: "admin", email } : null,
    req: {},
    res: {},
  }) as TrpcContext;
const learner = ceuRouter.createCaller(ctx(emails[0])),
  other = ceuRouter.createCaller(ctx(emails[1])),
  reviewer = ceuRouter.createCaller(ctx(emails[2], true));
const course = ceuCourse("ceu-sampling-data-quality")!,
  courseKey = course.key;
const body =
  "A reasoned submission using the supplied evidence and all required calculation boundaries. ".repeat(
    4
  );
describe.skipIf(!enabled)("CEU database-backed learner lifecycle", () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL || !(await getDb()))
      throw Error("Disposable CEU test database required.");
  });
  afterAll(async () => {
    const db = await getDb();
    if (db)
      await db
        .delete(ceuLearningRecords)
        .where(inArray(ceuLearningRecords.studentEmail, emails));
  });
  it("persists drafts, isolates accounts, serializes concurrent updates and completes through instructor review", async () => {
    const initial = await learner.start({ courseKey });
    expect(initial?.revision).toBe(0);
    expect(await learner.start({ courseKey })).toEqual(initial);
    await other.start({ courseKey });
    let result = await learner.save({
      courseKey,
      revision: 0,
      action: { type: "draft", moduleId: course.modules[0].id, text: body },
    });
    const freshCaller = ceuRouter.createCaller(ctx(emails[0]));
    expect(
      (await freshCaller.myRecord({ courseKey }))?.modules[course.modules[0].id]
        .draft
    ).toBe(body);
    // Undeclared identity fields are stripped; verified context determines ownership.
    expect(
      (await other.myRecord({ courseKey, email: emails[0] } as any))?.modules
    ).toEqual({});
    expect((await other.myRecord({ courseKey }))?.revision).toBe(0);
    const concurrent = await Promise.allSettled(
      ["first", "second"].map(s =>
        learner.save({
          courseKey,
          revision: result.record.revision,
          action: {
            type: "draft",
            moduleId: course.modules[0].id,
            text: s + body,
          },
        })
      )
    );
    expect(concurrent.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(concurrent.find(r => r.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
    let r = (await learner.myRecord({ courseKey }))!;
    await expect(learner.assessment({ courseKey })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    for (const m of course.modules) {
      r = (
        await learner.save({
          courseKey,
          revision: r.revision,
          action: { type: "submitExercise", moduleId: m.id, text: body },
        })
      ).record;
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
    const questions = await learner.assessment({ courseKey });
    expect(questions).toHaveLength(8);
    expect(JSON.stringify(questions)).not.toContain("correctIndex");
    const action = {
      type: "exam" as const,
      attemptId: randomUUID(),
      answers: course.finalAssessment.map(q => q.correctIndex),
    };
    const oldRevision = r.revision;
    r = (await learner.save({ courseKey, revision: r.revision, action }))
      .record;
    const retried = await learner.save({
      courseKey,
      revision: oldRevision,
      action,
    });
    expect(retried.record).toEqual(r);
    expect(r.attempts).toHaveLength(1);
    await expect(
      reviewer.review({
        courseKey,
        email: emails[0],
        revision: r.revision,
        action: { type: "complete", name: "Example Learner" },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    for (const m of course.modules)
      r = await reviewer.review({
        courseKey,
        email: emails[0],
        revision: r.revision,
        action: {
          type: "review",
          moduleId: m.id,
          passed: true,
          feedback:
            "All criteria reviewed against the submitted evidence and calculations.",
        },
      });
    r = await reviewer.review({
      courseKey,
      email: emails[0],
      revision: r.revision,
      action: {
        type: "participation",
        instructor: "Test Instructor",
        instructorQualifications:
          "Synthetic qualified-instructor fixture for automated testing.",
        sessions: [
          {
            date: new Date().toISOString().slice(0, 10),
            minutes: 180,
            evidence:
              "Synthetic attendance and discussion evidence for this automated test.",
          },
        ],
      },
    });
    r = (
      await learner.save({
        courseKey,
        revision: r.revision,
        action: {
          type: "evaluation",
          rating: 4,
          useful: "The practical evidence was useful.",
          improve: "More time for the discussion would help.",
        },
      })
    ).record;
    r = await reviewer.review({
      courseKey,
      email: emails[0],
      revision: r.revision,
      action: { type: "complete", name: "Example Learner" },
    });
    expect(r.completion?.statement).toContain("No approved CEUs");
    expect((await freshCaller.myRecord({ courseKey }))?.completion?.id).toBe(
      r.completion?.id
    );
    await expect(
      learner.save({
        courseKey,
        revision: r.revision,
        action: { type: "draft", moduleId: course.modules[0].id, text: body },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await other.myRecord({ courseKey }))?.completion).toBeUndefined();
  }, 30000);
});
