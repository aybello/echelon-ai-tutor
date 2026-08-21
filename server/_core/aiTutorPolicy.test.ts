import { describe, expect, it } from "vitest";
import { enforceAiTutorDailyQuota } from "./aiTutorPolicy";

describe("enforceAiTutorDailyQuota", () => {
  it("lets an anonymous learner past the identity gate when an anonymousId is supplied", async () => {
    // Anonymous access is granted by supplying identity.anonymousId, which is
    // what the free OIT taste flow passes. A non-authenticated caller must
    // successfully pass the policy rather than reject with UNAUTHORIZED.
    await expect(
      enforceAiTutorDailyQuota({ userId: null, email: null, anonymousId: "anon-fixture" }),
    ).resolves.toBeUndefined();
  });

  it("rejects anonymous use when no anonymousId is supplied", async () => {
    await expect(enforceAiTutorDailyQuota({ userId: null, email: null }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
