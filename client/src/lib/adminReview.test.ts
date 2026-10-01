import { describe, expect, it } from "vitest";
import { describePurchaseCheck, parseReviewOptions } from "./adminReview";

describe("admin review safeguards", () => {
  it("shows a review action for unmatched paid sessions even when recovered is zero", () => {
    const message = describePurchaseCheck({ recovered: 0, skipped: 1, errors: ["cs_123: requires signed webhook replay"] });
    expect(message).toContain("need review");
    expect(message).toContain("cs_123");
    expect(message).not.toContain("already in sync");
  });

  it("rejects malformed answer options before allowing an approval preview", () => {
    expect(parseReviewOptions('["A", "B", "C", "D"]')).toEqual(["A", "B", "C", "D"]);
    expect(parseReviewOptions('["A", "B"]')).toBeNull();
    expect(parseReviewOptions("invalid")).toBeNull();
  });
});
