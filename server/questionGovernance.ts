import { notInArray } from "drizzle-orm";
import { questions } from "../drizzle/schema";

/**
 * Legacy `unreviewed` questions remain visible while the existing banks are
 * reviewed. New imports enter `in_review`, which is a hard staging state:
 * release tooling can publish an exact validated package without individual approval.
 * Rejected questions remain hidden permanently unless an admin changes them.
 */
export function learnerVisibleQuestionFilter() {
  return notInArray(questions.reviewStatus, ["in_review", "rejected"]);
}
