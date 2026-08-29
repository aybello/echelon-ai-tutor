import { notInArray } from "drizzle-orm";
import { questions } from "../drizzle/schema";

/**
 * Legacy `unreviewed` questions remain visible while the existing banks are
 * reviewed. New imports enter `in_review`, which is a hard staging state:
 * only an individual admin approval can make one of those questions visible.
 * Rejected questions remain hidden permanently unless an admin changes them.
 */
export function learnerVisibleQuestionFilter() {
  return notInArray(questions.reviewStatus, ["in_review", "rejected"]);
}
