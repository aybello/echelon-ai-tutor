import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  ceuReadiness,
  moduleMinimumMinutes,
  type CeuCurriculum,
  type CeuLearningRecord,
} from "../../shared/ceuLearning";
import { ceuModuleSlideCount } from "../../shared/ceuSlides";
import { exerciseFor, gradeExercise } from "./exerciseBank";

export const learnerAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("resume"), moduleId: z.string().max(80) }),
  z.object({
    type: z.literal("slideProgress"),
    moduleId: z.string().max(80),
    slideIndex: z.number().int().min(0).max(20),
  }),
  z.object({
    type: z.literal("completeModule"),
    moduleId: z.string().max(80),
    slideIndex: z.number().int().min(0).max(20),
  }),
  z.object({
    type: z.literal("draft"),
    moduleId: z.string().max(80),
    text: z.string().max(20000),
  }),
  z.object({
    type: z.literal("heartbeat"),
    moduleId: z.string().max(80),
    activityAt: z.string().datetime(),
  }),
  z.object({
    type: z.literal("submitExercise"),
    moduleId: z.string().max(80),
    attemptId: z.string().uuid(),
    answers: z
      .array(
        z.union([
          z.number().finite(),
          z.array(z.number().int().min(0).max(20)).max(20),
        ])
      )
      .max(30),
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
    flaggedQuestionIndexes: z.array(z.number().int().min(0).max(100)).max(100),
  }),
  z.object({
    type: z.literal("evaluation"),
    rating: z.number().int().min(1).max(5),
    useful: z.string().trim().min(10).max(2000),
    improve: z.string().trim().min(10).max(2000),
  }),
]);
export type LearnerAction = z.infer<typeof learnerAction>;
export function torontoDate(now: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}
export function newCeuRecord(
  course: CeuCurriculum,
  learnerName: string,
  operatorNumber: string,
  now = new Date().toISOString()
): CeuLearningRecord {
  return {
    revision: 0,
    courseVersion: course.version,
    startedAt: now,
    updatedAt: now,
    currentModule: course.modules[0].id,
    learnerName,
    operatorNumber,
    modules: Object.fromEntries(
      course.modules.map(m => [
        m.id,
        {
          draft: "",
          checks: {},
          exerciseSeed: randomUUID(),
          exerciseAttempts: [],
          activeSeconds: 0,
        },
      ])
    ),
    dailySeconds: {},
    attempts: [],
    audit: [],
  };
}
export function transitionCeu(
  course: CeuCurriculum,
  original: CeuLearningRecord,
  action: LearnerAction,
  actor: string,
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
  const mod = moduleId ? state.modules[moduleId] : undefined;
  if (moduleId && !mod) throw new Error("Course module state is missing.");
  switch (action.type) {
    case "resume":
      state.currentModule = action.moduleId;
      break;
    case "slideProgress": {
      const finalSlideIndex = ceuModuleSlideCount(lesson!) - 1;
      const currentSlideIndex = mod!.slideIndex ?? 0;
      if (action.slideIndex > finalSlideIndex)
        throw new Error("Unknown lesson slide.");
      if (action.slideIndex > currentSlideIndex + 1)
        throw new Error("Complete the lesson slides in order.");
      mod!.slideIndex = Math.max(currentSlideIndex, action.slideIndex);
      state.currentModule = action.moduleId;
      break;
    }
    case "completeModule": {
      const finalSlideIndex = ceuModuleSlideCount(lesson!) - 1;
      const currentSlideIndex = mod!.slideIndex ?? 0;
      if (action.slideIndex !== finalSlideIndex || currentSlideIndex < finalSlideIndex - 1)
        throw new Error("Reach the final lesson slide before completing this module.");
      mod!.slideIndex = finalSlideIndex;
      mod!.completedAt ??= now;
      state.currentModule = action.moduleId;
      break;
    }
    case "draft":
      if (mod!.exerciseAttempts.some(a => a.passed))
        throw new Error("A passed exercise is immutable.");
      mod!.draft = action.text;
      state.currentModule = action.moduleId;
      break;
    case "heartbeat": {
      const received = Date.parse(now),
        activity = Date.parse(action.activityAt);
      if (
        !Number.isFinite(activity) ||
        activity > received + 5000 ||
        activity < received - 300000
      )
        throw new Error("Activity signal is stale or invalid.");
      const last = mod!.lastHeartbeatAt ? Date.parse(mod!.lastHeartbeatAt) : 0;
      const elapsed = last ? Math.floor((received - last) / 1000) : 0;
      // A missing/late heartbeat restarts the interval; elapsed time cannot be claimed retroactively.
      const seconds = elapsed >= 1 && elapsed <= 60 ? elapsed : 0;
      const date = torontoDate(now);
      const previous = state.dailySeconds[date] ?? 0;
      if (previous + seconds > 7 * 3600)
        throw new Error(
          "The seven-hour daily learning-time limit has been reached."
        );
      mod!.activeSeconds += seconds;
      state.dailySeconds[date] = previous + seconds;
      mod!.lastHeartbeatAt = now;
      mod!.lastActivityAt = action.activityAt;
      break;
    }
    case "submitExercise": {
      if (mod!.exerciseAttempts.some(a => a.passed))
        throw new Error("This exercise is already passed.");
      if (mod!.activeSeconds < moduleMinimumMinutes(lesson!) * 60)
        throw new Error(
          "Complete the module's minimum active learning time before submitting."
        );
      const exercise = exerciseFor(
        course.key,
        lesson!.id,
        mod!.exerciseSeed,
        mod!.exerciseAttempts.length
      );
      const result = gradeExercise(exercise, action.answers);
      mod!.exerciseAttempts.push({
        id: action.attemptId,
        answers: action.answers,
        score: result.score,
        total: result.total,
        passed: result.score / result.total >= 0.7,
        at: now,
      });
      break;
    }
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
      const previous = state.attempts.find(a => a.id === action.attemptId);
      if (previous) {
        if (
          action.type === "exam" &&
          JSON.stringify(previous.answers) === JSON.stringify(action.answers)
        )
          return original;
        throw new Error(
          "This attempt identifier has already been submitted. Start a new attempt."
        );
      }
      const ready = ceuReadiness(course, state);
      if (!ready.modulesCompleted)
        throw new Error(
          "Complete every course module before opening the final assessment."
        );
      if (state.attempts.some(a => a.passed))
        throw new Error("A passing assessment is already recorded.");
      if (action.answers.length !== course.finalAssessment.length)
        throw new Error("Answer every assessment question.");
      if (
        action.type === "exam" &&
        action.answers.some(
          (answer, index) =>
            answer < 0 || answer >= course.finalAssessment[index].choices.length
        )
      )
        throw new Error("An assessment answer is outside the available choices.");
      if (action.type === "examDraft") {
        state.assessmentDraft = {
          attemptId: action.attemptId,
          answers: action.answers,
          flaggedQuestionIndexes: [...new Set(action.flaggedQuestionIndexes)],
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
  }
  if (state.audit.length >= 2500)
    throw new Error(
      "This record needs archival review before further updates."
    );
  // Heartbeats are commutative time updates and should not invalidate a learner's open draft.
  if (action.type !== "heartbeat") state.revision++;
  state.updatedAt = now;
  if (!["resume", "draft", "examDraft", "heartbeat"].includes(action.type))
    state.audit.push({
      at: now,
      actor,
      action: action.type,
      ...(moduleId ? { moduleId } : {}),
    });
  if (!state.completion && ceuReadiness(course, state).ready) {
    const final = state.attempts.find(a => a.passed)!;
    state.completion = {
      id: randomUUID(),
      at: now,
      name: state.learnerName,
      operatorNumber: state.operatorNumber,
      courseId: course.key,
      recordedMinutes: Math.floor(
        ceuReadiness(course, state).recordedSeconds / 60
      ),
      finalScore: final.score,
      finalTotal: final.total,
      statement:
        "Echelon Institute pilot learning record. No approved CEUs, operator qualification or regulatory recognition awarded.",
    };
    state.audit.push({ at: now, actor: "system", action: "complete" });
  }
  if (Buffer.byteLength(JSON.stringify(state)) > 4_000_000)
    throw new Error(
      "This record needs archival review before further updates."
    );
  return state;
}
