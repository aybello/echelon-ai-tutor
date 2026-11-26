import type { CeuLearningRecord } from "./ceuLearning";

export type CeuFinalEntry =
  | { view: "certificate" }
  | { view: "exam" }
  | { view: "results"; attemptId: string };

/**
 * Routes learners to the correct final-assessment state without reusing a
 * submitted attempt identifier. A saved draft is the only reason to reopen
 * the exam directly. Submitted work opens its learner-only results instead.
 */
export function ceuFinalEntry(record: CeuLearningRecord | null | undefined): CeuFinalEntry {
  if (record?.completion) return { view: "certificate" };
  if (record?.assessmentDraft) return { view: "exam" };
  const latestAttempt = record?.attempts.at(-1);
  return latestAttempt
    ? { view: "results", attemptId: latestAttempt.id }
    : { view: "exam" };
}
