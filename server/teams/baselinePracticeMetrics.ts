import { resolveCourseKey } from "../../shared/courseRegistry";

export type DiagnosticBaselineRecord = {
  memberId: number | null;
  courseKey: string;
  score: number;
  completedAt: Date;
};

export type PracticeAttemptRecord = {
  memberId: number | null;
  courseKey: string | null;
  bankKey: string | null;
  examType: string | null;
  quizMode: string | null;
  correct: "yes" | "no";
  createdAt: Date;
};

export type BaselinePracticeCohort = {
  memberId: number;
  courseKey: string;
  diagnosticBaseline: number;
  practiceAccuracy: number;
  accuracyChange: number;
  practiceAttemptCount: number;
};

export type BaselinePracticeMetrics = {
  cohorts: BaselinePracticeCohort[];
  avgDiagnosticBaseline: number | null;
  avgPracticeAccuracy: number | null;
  accuracyChange: number | null;
};

function canonicalCourseKey(...keys: Array<string | null | undefined>): string | null {
  for (const key of keys) {
    if (!key) continue;
    const course = resolveCourseKey(key);
    // An explicit unknown course must not fall through to a different bank.
    return course?.courseKey ?? null;
  }
  return null;
}

/**
 * Compares only a learner's post-diagnostic attempts for the same canonical
 * course. Legacy aliases normalize through the course registry; unknown
 * history is excluded rather than guessed into a regulatory course.
 */
export function calculateBaselinePracticeMetrics(
  diagnostics: readonly DiagnosticBaselineRecord[],
  attempts: readonly PracticeAttemptRecord[],
): BaselinePracticeMetrics {
  const baselineByLearnerCourse = new Map<string, DiagnosticBaselineRecord & { memberId: number; canonicalCourseKey: string }>();

  for (const diagnostic of diagnostics) {
    if (diagnostic.memberId === null || !Number.isFinite(diagnostic.score)) continue;
    const courseKey = canonicalCourseKey(diagnostic.courseKey);
    if (!courseKey) continue;
    const key = `${diagnostic.memberId}:${courseKey}`;
    const existing = baselineByLearnerCourse.get(key);
    // A baseline is the first completed diagnostic for that learner-course.
    if (!existing || diagnostic.completedAt.getTime() < existing.completedAt.getTime()) {
      baselineByLearnerCourse.set(key, { ...diagnostic, memberId: diagnostic.memberId, canonicalCourseKey: courseKey });
    }
  }

  const matchedAttempts = new Map<string, PracticeAttemptRecord[]>();
  for (const attempt of attempts) {
    if (attempt.memberId === null || attempt.quizMode === "diagnostic") continue;
    const courseKey = canonicalCourseKey(attempt.courseKey, attempt.bankKey, attempt.examType);
    if (!courseKey) continue;
    const key = `${attempt.memberId}:${courseKey}`;
    const baseline = baselineByLearnerCourse.get(key);
    if (!baseline || attempt.createdAt.getTime() <= baseline.completedAt.getTime()) continue;
    const bucket = matchedAttempts.get(key) ?? [];
    bucket.push(attempt);
    matchedAttempts.set(key, bucket);
  }

  const cohorts: BaselinePracticeCohort[] = [];
  for (const [key, baseline] of baselineByLearnerCourse) {
    const practice = matchedAttempts.get(key) ?? [];
    if (practice.length === 0) continue;
    const correct = practice.filter(attempt => attempt.correct === "yes").length;
    const practiceAccuracy = Math.round((correct / practice.length) * 100);
    cohorts.push({
      memberId: baseline.memberId,
      courseKey: baseline.canonicalCourseKey,
      diagnosticBaseline: baseline.score,
      practiceAccuracy,
      accuracyChange: practiceAccuracy - baseline.score,
      practiceAttemptCount: practice.length,
    });
  }

  const average = (values: number[]): number | null => values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
  return {
    cohorts,
    avgDiagnosticBaseline: average(cohorts.map(cohort => cohort.diagnosticBaseline)),
    avgPracticeAccuracy: average(cohorts.map(cohort => cohort.practiceAccuracy)),
    accuracyChange: average(cohorts.map(cohort => cohort.accuracyChange)),
  };
}
