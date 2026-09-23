import { notInArray } from "drizzle-orm";
import { questions } from "../drizzle/schema";
import { HIDDEN_LEARNER_REVIEW_STATUSES } from "../shared/questionVisibility.mjs";

/**
 * Legacy `unreviewed` questions remain visible while the existing banks are
 * reviewed. New imports enter `in_review`, which is a hard staging state:
 * release tooling can publish an exact validated package without individual approval.
 * Rejected questions remain hidden permanently unless an admin changes them.
 */
export function learnerVisibleQuestionFilter() {
  return notInArray(questions.reviewStatus, [...HIDDEN_LEARNER_REVIEW_STATUSES]);
}
