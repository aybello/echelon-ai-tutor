import { describe, expect, it } from "vitest";
import { enforceAiTutorDailyQuota } from "./aiTutorPolicy";

describe("enforceAiTutorDailyQuota", () => {
  it("lets an anonymous learner past the identity gate when an anonymousId is supplied", async () => {
    // Anonymous access is granted by supplying identity.anonymousId, which is
    // what the free OIT taste flow passes. The quota check can still reject
    // when its storage is unavailable, but it must never reject at the
    // identity gate with UNAUTHORIZED.
    const result = await enforceAiTutorDailyQuota({
      userId: null,
      email: null,
      anonymousId: "anon-fixture",
    }).then(
      () => ({ kind: "resolved" as const }),
      (error: unknown) => ({ kind: "rejected" as const, error }),
    );

    if (result.kind === "rejected") {
      expect(result.error).not.toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("rejects anonymous use when no anonymousId is supplied", async () => {
    await expect(enforceAiTutorDailyQuota({ userId: null, email: null }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
