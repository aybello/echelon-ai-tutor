/** Public contracts only. Assessed answer keys live in server/ceu. */
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
export interface CeuModuleRecord {
  draft: string;
  submittedAt?: string;
  checks: Record<
    string,
    { selectedIndex: number; correct: boolean; answeredAt: string }
  >;
  review?: { passed: boolean; feedback: string; reviewer: string; at: string };
  history?: {
    text: string;
    submittedAt: string;
    review?: {
      passed: boolean;
      feedback: string;
      reviewer: string;
      at: string;
    };
  }[];
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
  modules: Record<string, CeuModuleRecord>;
  attempts: CeuAttempt[];
  additionalAttempts?: number;
  assessmentDraft?: { attemptId: string; answers: (number | null)[] };
  evaluation?: { rating: number; useful: string; improve: string; at: string };
  participation?: {
    sessions: { date: string; minutes: number; evidence: string }[];
    instructor: string;
    instructorQualifications: string;
    attestedBy: string;
    at: string;
  };
  completion?: {
    id: string;
    at: string;
    name: string;
    reviewer: string;
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
export function ceuReadiness(
  course: Pick<CeuCurriculum, "modules" | "plannedMinutes">,
  record: CeuLearningRecord
) {
  const checksPassed = course.modules.every(m =>
    m.checks.every(q => record.modules[m.id]?.checks[q.id]?.correct)
  );
  const exercisesSubmitted = course.modules.every(
    m => !!record.modules[m.id]?.submittedAt
  );
  const exercisesReviewed = course.modules.every(
    m => record.modules[m.id]?.review?.passed === true
  );
  const assessmentPassed = record.attempts.some(a => a.passed);
  const participationVerified =
    (record.participation?.sessions.reduce((sum, s) => sum + s.minutes, 0) ??
      0) >= course.plannedMinutes;
  return {
    checksPassed,
    exercisesSubmitted,
    exercisesReviewed,
    assessmentPassed,
    participationVerified,
    evaluationReceived: !!record.evaluation,
    ready:
      checksPassed &&
      exercisesReviewed &&
      assessmentPassed &&
      participationVerified &&
      !!record.evaluation,
  };
}
