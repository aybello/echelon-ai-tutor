/** Public contracts only. Answer keys and marking material live in server/ceu. */
export interface CeuQuestion {
  id: string;
  objective: string;
  prompt: string;
  choices: string[];
}
export interface CeuQuestionKey extends CeuQuestion {
  correctIndex: number;
  explanation: string;
}
export interface CeuSource {
  id: string;
  title: string;
  url: string;
  section: string;
  jurisdiction: string;
  accessed: string;
}
export interface CeuActivity {
  instruction: string;
  minutes: number;
  kind: "lesson" | "reading" | "exercise" | "discussion" | "assessment";
}
export interface CeuLesson {
  id: string;
  title: string;
  objectives: string[];
  lesson: string;
  evidence: string;
  assignment: string;
  rubric: string[];
  facilitatorGuide: string;
  activities: CeuActivity[];
  sourceIds: string[];
  checks: CeuQuestionKey[];
}
export interface CeuCurriculum {
  key: string;
  version: string;
  title: string;
  shortTitle: string;
  stream: "drinking_water" | "wastewater";
  audience: string;
  prerequisites: string;
  introduction: string;
  plannedMinutes: number;
  delivery: string;
  sources: CeuSource[];
  modules: CeuLesson[];
  finalAssessment: CeuQuestionKey[];
}
export interface CeuExerciseQuestion {
  id: string;
  prompt: string;
  type: "single" | "multiple" | "number" | "order";
  choices?: string[];
  unit?: string;
}
export type CeuExerciseAnswer = number | number[];
export interface CeuExerciseAttempt {
  id: string;
  answers: CeuExerciseAnswer[];
  score: number;
  total: number;
  passed: boolean;
  at: string;
}
export interface CeuModuleRecord {
  draft: string;
  checks: Record<
    string,
    { selectedIndex: number; correct: boolean; answeredAt: string }
  >;
  exerciseSeed: string;
  exerciseAttempts: CeuExerciseAttempt[];
  activeSeconds: number;
  lastHeartbeatAt?: string;
  lastActivityAt?: string;
  /** Additive presentation state for the simplified pilot lesson player. */
  slideIndex?: number;
  completedAt?: string;
}
export interface CeuAttempt {
  id: string;
  answers: number[];
  score: number;
  total: number;
  passed: boolean;
  at: string;
}
export interface CeuLearningRecord {
  revision: number;
  courseVersion: string;
  startedAt: string;
  updatedAt: string;
  currentModule: string;
  learnerName: string;
  operatorNumber: string;
  modules: Record<string, CeuModuleRecord>;
  dailySeconds: Record<string, number>;
  attempts: CeuAttempt[];
  assessmentDraft?: {
    attemptId: string;
    answers: (number | null)[];
    flaggedQuestionIndexes?: number[];
  };
  evaluation?: { rating: number; useful: string; improve: string; at: string };
  completion?: {
    id: string;
    at: string;
    name: string;
    operatorNumber: string;
    courseId: string;
    recordedMinutes: number;
    finalScore: number;
    finalTotal: number;
    statement: string;
  };
  audit: {
    at: string;
    actor: string;
    action: string;
    moduleId?: string;
    detail?: string;
  }[];
}
export function moduleMinimumMinutes(module: Pick<CeuLesson, "activities">) {
  return module.activities.reduce((sum, a) => sum + a.minutes, 0);
}

/** A passed legacy case exercise counts as completed learning in the simpler pilot flow. */
export function isCeuModuleComplete(
  record: CeuLearningRecord,
  moduleId: string
) {
  const module = record.modules[moduleId];
  return Boolean(
    module?.completedAt || module?.exerciseAttempts.some(attempt => attempt.passed)
  );
}

export function ceuReadiness(
  course: Pick<CeuCurriculum, "modules" | "plannedMinutes">,
  record: CeuLearningRecord
) {
  const checksPassed = course.modules.every(m =>
    m.checks.every(q => record.modules[m.id]?.checks[q.id]?.correct)
  );
  const exercisesPassed = course.modules.every(m =>
    record.modules[m.id]?.exerciseAttempts.some(a => a.passed)
  );
  const modulesCompleted = course.modules.every(module =>
    isCeuModuleComplete(record, module.id)
  );
  const moduleTimeMet = course.modules.every(
    m =>
      (record.modules[m.id]?.activeSeconds ?? 0) >= moduleMinimumMinutes(m) * 60
  );
  const recordedSeconds = course.modules.reduce(
    (sum, m) => sum + (record.modules[m.id]?.activeSeconds ?? 0),
    0
  );
  const timeMet =
    moduleTimeMet && recordedSeconds >= course.plannedMinutes * 60;
  const assessmentPassed = record.attempts.some(a => a.passed);
  return {
    checksPassed,
    exercisesPassed,
    modulesCompleted,
    moduleTimeMet,
    recordedSeconds,
    timeMet,
    assessmentPassed,
    ready: modulesCompleted && assessmentPassed,
  };
}
