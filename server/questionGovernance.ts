import { ne } from "drizzle-orm";
import { questions } from "../drizzle/schema";

/**
 * Learner-facing question reads may continue to use legacy `unreviewed`
 * content while the existing banks are reviewed, but an explicit admin
 * rejection is final and must remove the item from every study surface.
 */
export function learnerVisibleQuestionFilter() {
  return ne(questions.reviewStatus, "rejected");
}
