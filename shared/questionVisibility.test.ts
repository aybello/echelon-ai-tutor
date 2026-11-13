import { describe, expect, it } from "vitest";
// @ts-ignore - shared runtime rule is consumed by both TypeScript application code and Node release scripts.
import { HIDDEN_LEARNER_REVIEW_STATUSES, isLearnerVisibleReviewStatus } from "./questionVisibility.mjs";

describe("shared learner question visibility", () => {
  it("keeps approved and legacy-unreviewed content visible while staging and rejected content remain hidden", () => {
    expect(HIDDEN_LEARNER_REVIEW_STATUSES).toEqual(["in_review", "rejected"]);
    expect(isLearnerVisibleReviewStatus("approved")).toBe(true);
    expect(isLearnerVisibleReviewStatus("unreviewed")).toBe(true);
    expect(isLearnerVisibleReviewStatus("in_review")).toBe(false);
    expect(isLearnerVisibleReviewStatus("rejected")).toBe(false);
    expect(isLearnerVisibleReviewStatus(null)).toBe(false);
  });
});
