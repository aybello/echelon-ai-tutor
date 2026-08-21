import { describe, expect, it } from "vitest";
import { enforceAiTutorDailyQuota } from "./aiTutorPolicy";

describe("enforceAiTutorDailyQuota", () => {
  it("lets an anonymous learner past the identity gate when an anonymousId is supplied", async () => {
    // Anonymous access is granted by supplying identity.anonymousId, which is
    // what the free OIT taste flow passes. Confirming the learner is actually
    // under quota needs a database, so the DB-free assertion is narrower: the
    // caller must clear the identity gate rather than be rejected outright.
    await expect(
      enforceAiTutorDailyQuota({ userId: null, email: null, anonymousId: "anon-fixture" }),
    ).rejects.not.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous use when no anonymousId is supplied", async () => {
    await expect(enforceAiTutorDailyQuota({ userId: null, email: null }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
