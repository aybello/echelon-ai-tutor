import type { CeuLearningRecord } from "../../shared/ceuLearning";

/** One row per learner/course edition; never claim these are unique people or earned hours. */
export function emptyCeuMetrics() {
  return { enrollments: 0, learningStarted: 0, modulesCompleted: 0,
    finalStarted: 0, finalSubmitted: 0, retries: 0, completed: 0,
    certificatesViewed: 0, evaluations: 0, ratingSum: 0 };
}
export function countCeuRecord(total: ReturnType<typeof emptyCeuMetrics>, r: CeuLearningRecord) {
  total.enrollments++;
  if (Object.values(r.modules).some(m => (m.slideIndex ?? 0) > 0 || !!m.completedAt || m.exerciseAttempts.length > 0)) total.learningStarted++;
  total.modulesCompleted += Object.values(r.modules).filter(m => m.completedAt || m.exerciseAttempts.some(a => a.passed)).length;
  if (r.assessmentDraft || r.attempts.length) total.finalStarted++;
  if (r.attempts.length) total.finalSubmitted++;
  total.retries += Math.max(0, r.attempts.length - 1) + (r.attempts.length && r.assessmentDraft ? 1 : 0);
  if (r.completion) total.completed++;
  if (r.audit.some(a => a.action === "certificateViewed")) total.certificatesViewed++;
  if (r.evaluation) { total.evaluations++; total.ratingSum += r.evaluation.rating; }
}
