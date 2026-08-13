/**
 * Learner readiness formula for views with the full practice-data set.
 *
 * Formula (weights sum to 1.0):
 *   accuracy      × 0.40  — overall correct/total
 *   mockAccuracy  × 0.25  — recent mock exam performance
 *   topicCoverage × 0.20  — breadth of topics attempted
 *   studyFrequency× 0.10  — days active in last 30 days
 *   recentBonus   × 0.05  — active in last 14 days
 *
 * Returns 0-100 integer.
 */

export interface ReadinessInput {
  /** Overall accuracy (0.0–1.0) */
  accuracy: number;
  /** Total questions attempted */
  totalAttempts: number;
  /** Recent mock exam accuracy (0.0–1.0); 0 if no mocks taken */
  mockAccuracy: number;
  /** Number of distinct topics attempted */
  topicsAttempted: number;
  /** Total topics available in the bank */
  totalTopics: number;
  /** Number of distinct days active in the last 30 days */
  activeDaysLast30: number;
  /** Whether the operator was active in the last 14 days */
  activeRecently: boolean;
}

export interface ReadinessResult {
  score: number;       // 0–100 integer
  level: "not_started" | "beginner" | "developing" | "proficient" | "exam_ready";
  label: string;
  description: string;
  nextAction: string;
}

/** Increment when formula weights, inputs, or thresholds change. */
export const READINESS_MODEL_VERSION = "estimated-readiness-v1";
/** Manager views use a reduced input set and are calibrated independently. */
export const MANAGER_READINESS_MODEL_VERSION = "estimated-manager-readiness-v1";
/** Remains false until scores are calibrated against sufficient official outcomes. */
export const READINESS_MODEL_CALIBRATED = false;

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const {
    accuracy,
    totalAttempts,
    mockAccuracy,
    topicsAttempted,
    totalTopics,
    activeDaysLast30,
    activeRecently,
  } = input;

  if (totalAttempts === 0) {
    return {
      score: 0,
      level: "not_started",
      label: "Not Started",
      description: "Start practicing to build your readiness score.",
      nextAction: "Begin with the Standard quiz mode.",
    };
  }

  // Component scores (all 0.0–1.0)
  const accuracyScore   = Math.min(accuracy, 1.0);
  const mockScore       = Math.min(mockAccuracy, 1.0);
  const coverageScore   = totalTopics > 0 ? Math.min(topicsAttempted / totalTopics, 1.0) : 0;
  const frequencyScore  = Math.min(activeDaysLast30 / 20, 1.0); // 20+ active days = full score
  const recentScore     = activeRecently ? 1.0 : 0.0;

  const rawScore =
    accuracyScore   * 0.40 +
    mockScore       * 0.25 +
    coverageScore   * 0.20 +
    frequencyScore  * 0.10 +
    recentScore     * 0.05;

  const score = Math.min(100, Math.round(rawScore * 100));

  let level: ReadinessResult["level"];
  let label: string;
  let description: string;
  let nextAction: string;

  if (score >= 80) {
    level = "exam_ready";
    label = "Estimated Ready";
    description = "Your Echelon study indicators are strong across the measured areas.";
    nextAction = "Take a full timed mock exam and review any remaining weak topics.";
  } else if (score >= 60) {
    level = "developing";
    label = "Progressing";
    description = "Your study indicators are improving, with more preparation still recommended.";
    nextAction = "Practice your weakest topics daily.";
  } else {
    level = "beginner";
    label = "Needs Focus";
    description = "The measured areas show important topics that need more practice.";
    nextAction = score >= 30
      ? "Aim for at least 20 targeted questions per day."
      : "Start with 10 questions per day and build from there.";
  }

  return { score, level, label, description, nextAction };
}

/**
 * Manager study estimate — uses only the data available in org analytics
 * queries (no topic-coverage or mock-score breakdown).
 */
export function computeManagerReadiness(opts: {
  accuracy: number;
  totalAttempts: number;
  mockExamsCompleted: number;
  activeRecently: boolean;
}): number {
  const { accuracy, totalAttempts, mockExamsCompleted, activeRecently } = opts;
  if (totalAttempts === 0) return 0;

  // Simplified formula matching computeReadiness weights but without topic coverage
  // Redistributed: accuracy 0.50, mock 0.30, frequency proxy 0.15, recent 0.05
  const accuracyScore = Math.min(accuracy, 1.0);
  const mockScore     = Math.min(mockExamsCompleted / 5, 1.0); // 5+ mocks = full score
  const volumeScore   = Math.min(totalAttempts / 200, 1.0);
  const recentScore   = activeRecently ? 1.0 : 0.0;

  const raw =
    accuracyScore * 0.50 +
    mockScore     * 0.25 +
    volumeScore   * 0.15 +
    recentScore   * 0.10;

  return Math.min(100, Math.round(raw * 100));
}

/** Convert a numeric readiness score to the unified estimated tier label.
 * Thresholds: 80+ Estimated Ready, 60-79 Progressing, below 60 Needs Focus.
 */
export function readinessScoreToLabel(score: number): string {
  if (score >= 80) return "Estimated Ready";
  if (score >= 60) return "Progressing";
  if (score > 0) return "Needs Focus";
  return "Not Started";
}
