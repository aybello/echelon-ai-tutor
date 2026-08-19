import { describe, expect, it } from "vitest";
import { hashAnalyticsAnonymousId, hashAnalyticsEmail } from "./analytics";

describe("pseudonymous analytics identity", () => {
  it("hashes browser journeys deterministically without colliding with email hashes", () => {
    const visitor = hashAnalyticsAnonymousId("11111111-2222-4333-8444-555555555555");
    expect(visitor).toMatch(/^[a-f0-9]{64}$/);
    expect(visitor).toBe(hashAnalyticsAnonymousId("11111111-2222-4333-8444-555555555555"));
    expect(visitor).not.toBe(hashAnalyticsEmail("11111111-2222-4333-8444-555555555555"));
  });
});
