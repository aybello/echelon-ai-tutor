import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  ceuReadiness,
  type CeuCurriculum,
  type CeuLearningRecord,
} from "../../shared/ceuLearning";

export const learnerAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("resume"), moduleId: z.string().max(80) }),
  z.object({
    type: z.literal("draft"),
    moduleId: z.string().max(80),
    text: z.string().max(20000),
  }),
  z.object({
    type: z.literal("submitExercise"),
    moduleId: z.string().max(80),
    text: z.string().trim().min(100).max(20000),
  }),
  z.object({
    type: z.literal("check"),
    moduleId: z.string().max(80),
    questionId: z.string().max(80),
    choice: z.number().int().min(0).max(3),
  }),
  z.object({
    type: z.literal("exam"),
    attemptId: z.string().uuid(),
    answers: z.array(z.number().int().min(0).max(3)).max(100),
  }),
  z.object({
    type: z.literal("examDraft"),
    attemptId: z.string().uuid(),
    answers: z.array(z.number().int().min(0).max(3).nullable()).max(100),
  }),
  z.object({
    type: z.literal("evaluation"),
    rating: z.number().int().min(1).max(5),
    useful: z.string().trim().min(10).max(2000),
    improve: z.string().trim().min(10).max(2000),
  }),
]);
export const instructorAction = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("authorizeReassessment"),
    reason: z.string().trim().min(20).max(2000),
  }),
  z.object({
    type: z.literal("review"),
    moduleId: z.string().max(80),
    passed: z.boolean(),
    feedback: z.string().trim().min(20).max(4000),
  }),
  z.object({
    type: z.literal("participation"),
    instructor: z.string().trim().min(3).max(200),
    instructorQualifications: z.string().trim().min(20).max(2000),
    sessions: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          minutes: z.number().int().min(1).max(420),
          evidence: z.string().trim().min(20).max(2000),
        })
      )
      .min(1)
      .max(60),
  }),
  z.object({
    type: z.literal("complete"),
    name: z.string().trim().min(2).max(150),
  }),
]);
export function newCeuRecord(
  course: CeuCurriculum,
  now = new Date().toISOString()
): CeuLearningRecord {
  return {
    revision: 0,
    courseVersion: course.version,
    startedAt: now,
    updatedAt: now,
    currentModule: course.modules[0].id,
    modules: {},
    attempts: [],
    audit: [],
  };
}
export function transitionCeu(
  course: CeuCurriculum,
  original: CeuLearningRecord,
  action: z.infer<typeof learnerAction> | z.infer<typeof instructorAction>,
  actor: string,
  instructor = false,
  now = new Date().toISOString()
) {
  if (original.courseVersion !== course.version)
    throw new Error("This record belongs to a different course edition.");
  if (original.completion)
    throw new Error("The completed learning record is immutable.");
  const state = structuredClone(original);
  const moduleId = "moduleId" in action ? action.moduleId : undefined;
  const lesson = moduleId
    ? course.modules.find(m => m.id === moduleId)
    : undefined;
  if (moduleId && !lesson) throw new Error("Unknown course module.");
  const mod = moduleId
    ? (state.modules[moduleId] ??= { draft: "", checks: {} })
    : undefined;
  if (
    ["review", "participation", "complete", "authorizeReassessment"].includes(
      action.type
    ) &&
    !instructor
  )
    throw new Error("Instructor review is required.");
  switch (action.type) {
    case "resume":
      state.currentModule = action.moduleId;
      break;
    case "draft":
    case "submitExercise":
      if (mod!.review?.passed)
        throw new Error(
          "Accepted work cannot be edited. Ask the instructor to return it first."
        );
      if (mod!.submittedAt)
        (mod!.history ??= []).push({
          text: mod!.draft,
          submittedAt: mod!.submittedAt,
          review: mod!.review,
        });
      mod!.draft = action.text;
      mod!.review = undefined;
      mod!.submittedAt = action.type === "submitExercise" ? now : undefined;
      state.currentModule = action.moduleId;
      break;
    case "check": {
      const question = lesson!.checks.find(q => q.id === action.questionId);
      if (!question || action.choice >= question.choices.length)
        throw new Error("Unknown check or choice.");
      mod!.checks[question.id] = {
        selectedIndex: action.choice,
        correct: action.choice === question.correctIndex,
        answeredAt: now,
      };
      break;
    }
    case "examDraft":
    case "exam": {
      if (
        action.type === "exam" &&
        state.attempts.some(a => a.id === action.attemptId)
      )
        return original;
      const ready = ceuReadiness(course, state);
      if (!ready.checksPassed || !ready.exercisesSubmitted)
        throw new Error(
          "Pass all module checks and submit each practical assignment first."
        );
      if (state.attempts.some(a => a.passed))
        throw new Error("A passing assessment is already recorded.");
      if (state.attempts.length >= 3 + (state.additionalAttempts ?? 0))
        throw new Error(
          "Available attempts used. Contact the instructor for a supervised reassessment."
        );
      if (action.answers.length !== course.finalAssessment.length)
        throw new Error("Answer every assessment question.");
      if (action.type === "examDraft") {
        state.assessmentDraft = {
          attemptId: action.attemptId,
          answers: action.answers,
        };
        break;
      }
      const score = course.finalAssessment.filter(
        (q, i) => q.correctIndex === action.answers[i]
      ).length;
      state.attempts.push({
        id: action.attemptId,
        answers: action.answers,
        score,
        total: course.finalAssessment.length,
        passed: score / course.finalAssessment.length >= 0.8,
        at: now,
      });
      state.assessmentDraft = undefined;
      break;
    }
    case "evaluation":
      state.evaluation = {
        rating: action.rating,
        useful: action.useful,
        improve: action.improve,
        at: now,
      };
      break;
    case "authorizeReassessment":
      if (
        state.attempts.some(a => a.passed) ||
        state.attempts.length < 3 + (state.additionalAttempts ?? 0)
      )
        throw new Error(
          "Reassessment review is available only after unsuccessful attempts are exhausted."
        );
      if ((state.additionalAttempts ?? 0) >= 3)
        throw new Error(
          "The pilot allows at most three instructor-authorized additional attempts."
        );
      state.additionalAttempts = (state.additionalAttempts ?? 0) + 1;
      break;
    case "review":
      if (!mod!.submittedAt)
        throw new Error("The learner has not submitted this exercise.");
      mod!.review = {
        passed: action.passed,
        feedback: action.feedback,
        reviewer: actor,
        at: now,
      };
      break;
    case "participation": {
      const totals = new Map<string, number>();
      for (const session of action.sessions) {
        if (
          !Number.isFinite(Date.parse(`${session.date}T12:00:00Z`)) ||
          new Date(`${session.date}T12:00:00Z`).toISOString().slice(0, 10) !==
            session.date ||
          session.date > now.slice(0, 10) ||
          session.date < state.startedAt.slice(0, 10)
        )
          throw new Error(
            "Use valid completed session dates on or after enrollment."
          );
        totals.set(
          session.date,
          (totals.get(session.date) ?? 0) + session.minutes
        );
      }
      if ([...totals.values()].some(m => m > 420))
        throw new Error(
          "A day may contain at most seven contact hours, excluding breaks."
        );
      state.participation = {
        sessions: action.sessions,
        instructor: action.instructor,
        instructorQualifications: action.instructorQualifications,
        attestedBy: actor,
        at: now,
      };
      break;
    }
    case "complete":
      if (!ceuReadiness(course, state).ready)
        throw new Error(
          "Practical review, assessment, evaluation and verified participation must all be complete."
        );
      state.completion = {
        id: randomUUID(),
        at: now,
        name: action.name,
        reviewer: actor,
        statement:
          "Echelon Institute pilot learning record. No approved CEUs, operator qualification or regulatory recognition awarded.",
      };
      break;
  }
  if (state.audit.length >= 2500)
    throw new Error(
      "This record needs administrator review before further updates."
    );
  state.revision++;
  state.updatedAt = now;
  if (
    action.type !== "resume" &&
    action.type !== "draft" &&
    action.type !== "examDraft"
  )
    state.audit.push({
      at: now,
      actor,
      action: action.type,
      ...(moduleId ? { moduleId } : {}),
      ...("reason" in action ? { detail: action.reason } : {}),
      ...(action.type === "review"
        ? {
            detail: JSON.stringify({
              passed: action.passed,
              feedback: action.feedback,
            }),
          }
        : {}),
      ...(action.type === "participation"
        ? { detail: JSON.stringify(state.participation) }
        : {}),
    });
  if (Buffer.byteLength(JSON.stringify(state)) > 4_000_000)
    throw new Error(
      "This record needs administrator archival review before further updates."
    );
  return state;
}
