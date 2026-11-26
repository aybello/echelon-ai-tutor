import { describe, expect, it } from "vitest";
import { hashAnalyticsAnonymousId, hashAnalyticsEmail, resolveAnalyticsHashes } from "./analytics";

describe("pseudonymous analytics identity", () => {
  it("hashes browser journeys deterministically without colliding with email hashes", () => {
    const visitor = hashAnalyticsAnonymousId("11111111-2222-4333-8444-555555555555");
    expect(visitor).toMatch(/^[a-f0-9]{64}$/);
    expect(visitor).toBe(hashAnalyticsAnonymousId("11111111-2222-4333-8444-555555555555"));
    expect(visitor).not.toBe(hashAnalyticsEmail("11111111-2222-4333-8444-555555555555"));
  });

  it("stores email and browser identities separately when both are known", () => {
    const browserHash = "a".repeat(64);
    expect(resolveAnalyticsHashes({
      email: "Learner@Example.com",
      anonymousId: null,
      identityHash: browserHash,
    })).toEqual({
      emailHash: hashAnalyticsEmail("learner@example.com"),
      anonymousHash: browserHash,
    });
  });

  it("never puts a browser identity into the email field", () => {
    expect(resolveAnalyticsHashes({
      email: null,
      anonymousId: "visitor-123",
      identityHash: null,
    })).toEqual({
      emailHash: null,
      anonymousHash: hashAnalyticsAnonymousId("visitor-123"),
    });
  });

  it("drops malformed provider identity hashes", () => {
    expect(resolveAnalyticsHashes({
      email: null,
      anonymousId: null,
      identityHash: "not-a-sha256-hash",
    })).toEqual({ emailHash: null, anonymousHash: null });
  });
});
