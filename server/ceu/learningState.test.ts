import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ceuCourse } from "./catalogue";
import {
  learnerAction,
  instructorAction,
  newCeuRecord,
  transitionCeu,
} from "./learningState";
import { ceuReadiness, type CeuLearningRecord } from "../../shared/ceuLearning";
const course = ceuCourse("ceu-sampling-data-quality")!;
const now = "2026-09-25T15:00:00.000Z";
const text = "Evidence-based practical response ".repeat(10);
const act = (r: CeuLearningRecord, a: any, admin = false) =>
  transitionCeu(
    course,
    r,
    a,
    admin ? "admin:2" : "learner@example.test",
    admin,
    now
  );
function submitted() {
  let r = newCeuRecord(course, now);
  for (const m of course.modules) {
    r = act(r, { type: "submitExercise", moduleId: m.id, text });
    for (const q of m.checks)
      r = act(r, {
        type: "check",
        moduleId: m.id,
        questionId: q.id,
        choice: q.correctIndex,
      });
  }
  return r;
}
const exam = (answers = course.finalAssessment.map(q => q.correctIndex)) => ({
  type: "exam" as const,
  attemptId: randomUUID(),
  answers,
});
describe("CEU server learning decisions", () => {
  it("rejects forged completion, score and instructor actions at the learner schema", () => {
    expect(
      learnerAction.safeParse({ type: "complete", name: "Learner" }).success
    ).toBe(false);
    expect(
      learnerAction.safeParse({
        type: "review",
        moduleId: "sample-design",
        passed: true,
        feedback: text,
      }).success
    ).toBe(false);
    expect(
      learnerAction.parse({ ...exam(), score: 100, passed: true })
    ).not.toHaveProperty("score");
    expect(() =>
      act(newCeuRecord(course, now), { type: "complete", name: "Learner" })
    ).toThrow("Instructor");
  });
  it("blocks final assessment and completion before evidence exists", () => {
    const r = newCeuRecord(course, now);
    expect(() => act(r, exam())).toThrow("module checks");
    expect(() => act(r, { type: "complete", name: "Learner" }, true)).toThrow(
      "must all be complete"
    );
    expect(ceuReadiness(course, r).ready).toBe(false);
  });
  it("preserves submitted versions and feedback across returned work", () => {
    let r = submitted();
    const id = course.modules[0].id;
    r = act(
      r,
      {
        type: "review",
        moduleId: id,
        passed: false,
        feedback: "Explain the sampling boundary more precisely.",
      },
      true
    );
    r = act(r, { type: "draft", moduleId: id, text: "Revised " + text });
    expect(r.modules[id].submittedAt).toBeUndefined();
    expect(r.modules[id].review).toBeUndefined();
    expect(r.modules[id].history?.[0]).toMatchObject({
      text,
      review: { passed: false },
    });
    expect(ceuReadiness(course, r).exercisesSubmitted).toBe(false);
  });
  it("keeps accepted practical work locked until returned by an instructor", () => {
    let r = submitted();
    const moduleId = course.modules[0].id;
    r = act(
      r,
      {
        type: "review",
        moduleId,
        passed: true,
        feedback: "All marking criteria verified against the evidence.",
      },
      true
    );
    expect(() => act(r, { type: "draft", moduleId, text })).toThrow(
      "Accepted work"
    );
    r = act(
      r,
      {
        type: "review",
        moduleId,
        passed: false,
        feedback: "Return this work for a documented correction.",
      },
      true
    );
    expect(
      act(r, { type: "draft", moduleId, text }).modules[moduleId].review
    ).toBeUndefined();
  });
  it("grades the 80 percent boundary on the server and retains failed attempts", () => {
    let r = submitted();
    const answers = course.finalAssessment.map(q => q.correctIndex);
    const twoWrong = answers.map((a, i) => (i < 2 ? (a + 1) % 4 : a));
    r = act(r, exam(twoWrong));
    expect(r.attempts[0]).toMatchObject({ score: 6, total: 8, passed: false });
    const oneWrong = answers.map((a, i) => (i === 0 ? (a + 1) % 4 : a));
    r = act(r, exam(oneWrong));
    expect(r.attempts[1]).toMatchObject({ score: 7, total: 8, passed: true });
    expect(() => act(r, exam())).toThrow("passing assessment");
  });
  it("persists an interrupted assessment draft and clears it after submission", () => {
    let r = submitted();
    const attempt = exam();
    const answers = attempt.answers.map((a, i) => (i < 2 ? a : null));
    r = act(r, { type: "examDraft", attemptId: attempt.attemptId, answers });
    expect(JSON.parse(JSON.stringify(r)).assessmentDraft).toEqual({
      attemptId: attempt.attemptId,
      answers,
    });
    r = act(r, attempt);
    expect(r.assessmentDraft).toBeUndefined();
    expect(r.attempts).toHaveLength(1);
    expect(act(r, attempt)).toBe(r);
    expect(() =>
      act(r, { ...attempt, answers: attempt.answers.map(a => (a + 1) % 4) })
    ).toThrow("already been submitted");
    expect(() =>
      act(r, {
        type: "examDraft",
        attemptId: attempt.attemptId,
        answers: attempt.answers,
      })
    ).toThrow("already been submitted");
  });
  it("requires documented instructor reassessment after three failed attempts", () => {
    let r = submitted();
    const wrong = course.finalAssessment.map(q => (q.correctIndex + 1) % 4);
    for (let i = 0; i < 3; i++) r = act(r, exam(wrong));
    expect(() => act(r, exam())).toThrow("Available attempts");
    expect(() =>
      act(r, { type: "authorizeReassessment", reason: text })
    ).toThrow("Instructor");
    r = act(
      r,
      {
        type: "authorizeReassessment",
        reason:
          "Remedial exercises reviewed; supervised reassessment arranged.",
      },
      true
    );
    expect(r.audit.at(-1)?.detail).toContain("Remedial");
    expect(act(r, exam()).attempts).toHaveLength(4);
  });
  it("rejects future, impossible, pre-enrollment and over-seven-hour days", () => {
    const r = newCeuRecord(course, "2026-09-24T00:00:00Z");
    const participation = (date: string, minutes = 180) => ({
      type: "participation",
      instructor: "Qualified Instructor",
      instructorQualifications: text,
      sessions: [{ date, minutes, evidence: text }],
    });
    for (const date of ["2026-09-26", "2026-02-30", "2026-09-23"])
      expect(() => act(r, participation(date), true)).toThrow(
        "valid completed"
      );
    expect(() =>
      act(
        r,
        {
          ...participation("2026-09-24"),
          sessions: [
            { date: "2026-09-24", minutes: 300, evidence: text },
            { date: "2026-09-24", minutes: 200, evidence: text },
          ],
        },
        true
      )
    ).toThrow("seven contact");
    expect(
      instructorAction.safeParse(participation("2026-09-24", 421)).success
    ).toBe(false);
  });
  it("requires practical acceptance, assessment, participation and evaluation, then freezes completion", () => {
    let r = act(submitted(), exam());
    for (const m of course.modules)
      r = act(
        r,
        {
          type: "review",
          moduleId: m.id,
          passed: true,
          feedback:
            "Every criterion verified with correct evidence and reasoning.",
        },
        true
      );
    r = act(
      r,
      {
        type: "participation",
        instructor: "Instructor Example",
        instructorQualifications: text,
        sessions: [{ date: "2026-09-25", minutes: 180, evidence: text }],
      },
      true
    );
    expect(ceuReadiness(course, r).ready).toBe(false);
    r = act(r, {
      type: "evaluation",
      rating: 4,
      useful: "Worked cases clarified the method.",
      improve: "Allow more time for the debrief.",
    });
    expect(ceuReadiness(course, r).ready).toBe(true);
    r = act(r, { type: "complete", name: "Example Learner" }, true);
    expect(r.completion?.statement).toContain("No approved CEUs");
    expect(() =>
      act(r, { type: "resume", moduleId: course.modules[0].id })
    ).toThrow("immutable");
  });
  it("rejects unknown modules, foreign checks and a changed course edition", () => {
    const r = newCeuRecord(course, now);
    expect(() => act(r, { type: "resume", moduleId: "foreign" })).toThrow(
      "Unknown"
    );
    expect(() =>
      act(r, {
        type: "check",
        moduleId: course.modules[0].id,
        questionId: "foreign",
        choice: 0,
      })
    ).toThrow("Unknown");
    expect(() =>
      act(
        { ...r, courseVersion: "old" },
        { type: "resume", moduleId: course.modules[0].id }
      )
    ).toThrow("different course edition");
  });
});
