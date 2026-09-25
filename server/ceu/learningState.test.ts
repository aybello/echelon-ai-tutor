import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ceuCourse } from "./catalogue";
import { exerciseFor, gradeExercise, publicExercise } from "./exerciseBank";
import {
  learnerAction,
  newCeuRecord,
  torontoDate,
  transitionCeu,
} from "./learningState";
import {
  ceuReadiness,
  moduleMinimumMinutes,
  type CeuCurriculum,
  type CeuLearningRecord,
} from "../../shared/ceuLearning";

const short = ceuCourse("ceu-sampling-data-quality")!;
const flagship = ceuCourse("ceu-water-treatment-process-control")!;
const t0 = "2026-09-25T15:00:00.000Z";
function act(
  course: CeuCurriculum,
  r: CeuLearningRecord,
  action: any,
  now = t0
) {
  return transitionCeu(
    course,
    r,
    learnerAction.parse(action),
    "learner@example.test",
    now
  );
}
function answers(course: CeuCurriculum, r: CeuLearningRecord, id: string) {
  const mod = r.modules[id];
  return exerciseFor(
    course.key,
    id,
    mod.exerciseSeed,
    mod.exerciseAttempts.length
  ).map(q => q.correct);
}
function completeModules(course: CeuCurriculum) {
  let r = newCeuRecord(course, "Example Learner", "90000064", t0);
  for (const m of course.modules) {
    r.modules[m.id].activeSeconds = moduleMinimumMinutes(m) * 60;
    const a = answers(course, r, m.id);
    r = act(course, r, {
      type: "submitExercise",
      moduleId: m.id,
      attemptId: randomUUID(),
      answers: a,
    });
    for (const q of m.checks)
      r = act(course, r, {
        type: "check",
        moduleId: m.id,
        questionId: q.id,
        choice: q.correctIndex,
      });
  }
  return r;
}
describe("fully self-paced CEU decisions", () => {
  it("has one keyed item for every case rubric criterion in all ten courses", () => {
    for (const key of [
      "ceu-activated-sludge-troubleshooting",
      "ceu-coagulation-filtration",
      "ceu-collection-wet-weather",
      "ceu-disinfection-ct",
      "ceu-distribution-water-quality",
      "ceu-drinking-water-compliance",
      "ceu-instrumentation-scada",
      "ceu-sampling-data-quality",
      "ceu-wastewater-treatment-process-control",
      "ceu-water-treatment-process-control",
    ]) {
      const course = ceuCourse(key)!;
      for (const m of course.modules) {
        const items = exerciseFor(key, m.id, "fixture");
        expect(
          m.rubric.every((_, i) => items.some(x => x.criterion === i))
        ).toBe(true);
        expect(publicExercise(items)).not.toHaveProperty("correct");
        expect(JSON.stringify(publicExercise(items))).not.toContain(
          '"correct"'
        );
      }
    }
  });
  it("grades numeric tolerance, multiple select and ordering, with keys absent from public items", () => {
    const ct = exerciseFor("ceu-disinfection-ct", "hydraulics", "fixture");
    expect(ct.some(q => q.type === "number")).toBe(true);
    expect(ct.some(q => q.type === "order")).toBe(true);
    expect(
      gradeExercise(
        ct,
        ct.map(q => q.correct)
      ).score
    ).toBe(ct.length);
    const numeric = ct.find(q => q.type === "number")!;
    const retry = exerciseFor(
      "ceu-disinfection-ct",
      "hydraulics",
      "fixture",
      1
    );
    expect(retry.find(q => q.id === numeric.id)?.correct).not.toBe(
      numeric.correct
    );
    const perturbed = ct.map(q => q.correct);
    perturbed[ct.indexOf(numeric)] =
      (numeric.correct as number) + (numeric.tolerance ?? 0) / 2;
    expect(gradeExercise(ct, perturbed).score).toBe(ct.length);
    const multi = exerciseFor(short.key, "sample-design", "fixture").find(
      q => q.type === "multiple"
    )!;
    expect(gradeExercise([multi], [multi.correct]).score).toBe(1);
  });
  it("requires module active time, reshuffles options on retry and allows unlimited attempts", () => {
    let r = newCeuRecord(short, "Example Learner", "90000064", t0);
    const id = short.modules[0].id;
    const first = exerciseFor(short.key, id, r.modules[id].exerciseSeed, 0);
    expect(() =>
      act(short, r, {
        type: "submitExercise",
        moduleId: id,
        attemptId: randomUUID(),
        answers: first.map(q => q.correct),
      })
    ).toThrow("minimum active");
    r.modules[id].activeSeconds = moduleMinimumMinutes(short.modules[0]) * 60;
    const wrong = first.map(q =>
      q.type === "number"
        ? 99999
        : q.type === "single"
          ? ((q.correct as number) + 1) % 3
          : []
    );
    r = act(short, r, {
      type: "submitExercise",
      moduleId: id,
      attemptId: randomUUID(),
      answers: wrong,
    });
    expect(r.modules[id].exerciseAttempts[0].passed).toBe(false);
    const next = exerciseFor(short.key, id, r.modules[id].exerciseSeed, 1);
    expect(next[0].choices).not.toEqual(first[0].choices);
    r = act(short, r, {
      type: "submitExercise",
      moduleId: id,
      attemptId: randomUUID(),
      answers: next.map(q => q.correct),
    });
    expect(r.modules[id].exerciseAttempts[1].passed).toBe(true);
  });
  it("counts only live heartbeat intervals and enforces the Toronto seven-hour day", () => {
    let r = newCeuRecord(short, "Example Learner", "90000064", t0);
    const id = short.modules[0].id;
    r = act(short, r, { type: "heartbeat", moduleId: id, activityAt: t0 }, t0);
    expect(r.modules[id].activeSeconds).toBe(0);
    const next = "2026-09-25T15:00:30.000Z";
    r = act(
      short,
      r,
      { type: "heartbeat", moduleId: id, activityAt: next },
      next
    );
    expect(r.modules[id].activeSeconds).toBe(30);
    expect(r.revision).toBe(0);
    const late = "2026-09-25T15:10:30.000Z";
    expect(() =>
      act(short, r, { type: "heartbeat", moduleId: id, activityAt: t0 }, late)
    ).toThrow("stale");
    r = act(
      short,
      r,
      { type: "heartbeat", moduleId: id, activityAt: late },
      late
    );
    expect(r.modules[id].activeSeconds).toBe(30);
    const date = torontoDate(late);
    r.dailySeconds[date] = 7 * 3600 - 10;
    expect(() =>
      act(
        short,
        r,
        {
          type: "heartbeat",
          moduleId: id,
          activityAt: "2026-09-25T15:11:00.000Z",
        },
        "2026-09-25T15:11:00.000Z"
      )
    ).toThrow("seven-hour");
  });
  for (const course of [short, flagship]) {
    it(`completes ${course.key} with no instructor action and freezes the record`, () => {
      let r = completeModules(course);
      expect(ceuReadiness(course, r).exercisesPassed).toBe(true);
      // Planned hours may exceed the sum of module activity estimates.
      const sum = ceuReadiness(course, r).recordedSeconds;
      expect(() =>
        act(
          course,
          {
            ...r,
            modules: Object.fromEntries(
              Object.entries(r.modules).map(([id, mod]) => [
                id,
                { ...mod, activeSeconds: 0 },
              ])
            ),
          },
          {
            type: "exam",
            attemptId: randomUUID(),
            answers: course.finalAssessment.map(q => q.correctIndex),
          }
        )
      ).toThrow("course-time");
      if (sum < course.plannedMinutes * 60)
        r.modules[course.modules.at(-1)!.id].activeSeconds +=
          course.plannedMinutes * 60 - sum;
      expect(ceuReadiness(course, r).timeMet).toBe(true);
      r = act(course, r, {
        type: "exam",
        attemptId: randomUUID(),
        answers: course.finalAssessment.map(q => q.correctIndex),
      });
      expect(r.completion).toMatchObject({
        name: "Example Learner",
        operatorNumber: "90000064",
        courseId: course.key,
        finalScore: course.finalAssessment.length,
      });
      expect(r.completion?.statement).toContain("No approved CEUs");
      expect(() =>
        act(course, r, { type: "resume", moduleId: course.modules[0].id })
      ).toThrow("immutable");
    });
  }
  it("does not expose a completion or reviewer action on the learner input schema", () => {
    expect(
      learnerAction.safeParse({ type: "complete", name: "forged" }).success
    ).toBe(false);
    expect(
      learnerAction.safeParse({
        type: "review",
        moduleId: "sample-design",
        passed: true,
      }).success
    ).toBe(false);
  });
});
