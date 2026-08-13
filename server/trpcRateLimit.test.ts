import { describe, expect, it } from "vitest";
import { getTrpcRateLimitPolicy } from "./trpcRateLimit";

describe("tRPC rate-limit routing", () => {
  it.each([
    ["/api/trpc/tutor.chat", "ai"],
    ["/api/trpc/tutor.explain?batch=1", "ai"],
    ["/api/trpc/incidentCommand.run", "ai"],
    ["/api/trpc/incidentCommand.debrief", "command_debrief"],
    ["/api/trpc/incidentCommand.evaluateJudgment?batch=1", "command_debrief"],
    ["/api/trpc/contact.submit", "contact"],
    ["/api/trpc/auth.login", "auth"],
    ["/api/trpc/dashboardAuth.verifyOtp", "auth"],
    ["/api/trpc/magicLink.requestMagicLink", "auth"],
    ["/api/trpc/emailOtp.request", "auth"],
    ["/api/trpc/dashboard.summary", "general"],
  ] as const)("maps %s to %s", (url, expected) => {
    expect(getTrpcRateLimitPolicy(url)).toBe(expected);
  });

  it("uses the strictest policy in a batched request", () => {
    expect(
      getTrpcRateLimitPolicy("/api/trpc/dashboard.summary,tutor.chat?batch=1"),
    ).toBe("ai");
  });

  it("handles URL-encoded batched procedure names", () => {
    expect(
      getTrpcRateLimitPolicy("/api/trpc/dashboard.summary%2CmagicLink.consume"),
    ).toBe("auth");
  });
});
