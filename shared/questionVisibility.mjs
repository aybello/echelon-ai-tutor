/**
 * Shared review-status rule for learner-visible legacy question banks.
 * New imports remain staged as `in_review`; rejected content remains hidden.
 */
export const HIDDEN_LEARNER_REVIEW_STATUSES = Object.freeze(["in_review", "rejected"]);

export function isLearnerVisibleReviewStatus(reviewStatus) {
  return typeof reviewStatus === "string" && !HIDDEN_LEARNER_REVIEW_STATUSES.includes(reviewStatus);
}
