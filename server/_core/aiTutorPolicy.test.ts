import { describe, expect, it } from "vitest";
import { enforceAiTutorDailyQuota } from "./aiTutorPolicy";

describe("enforceAiTutorDailyQuota", () => {
  it("permits an anonymous learner when the caller explicitly enables a free tutor flow", async () => {
    await expect(enforceAiTutorDailyQuota(
      { userId: null, email: null },
      { allowAnonymous: true },
    )).resolves.toBeUndefined();
  });

  it("continues to reject anonymous use when a caller has not explicitly enabled the free tutor flow", async () => {
    await expect(enforceAiTutorDailyQuota({ userId: null, email: null }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
