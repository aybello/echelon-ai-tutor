import { describe, expect, it } from "vitest";
import {
  publicReleaseHealth,
  RELEASE_CAPABILITIES,
  RELEASE_ID,
} from "./release";

describe("public release health", () => {
  it("exposes a stable non-secret release marker and the critical capabilities", () => {
    const now = new Date("2026-08-27T13:30:00.000Z");

    expect(publicReleaseHealth(now)).toEqual({
      status: "ok",
      release: RELEASE_ID,
      capabilities: RELEASE_CAPABILITIES,
      ts: "2026-08-27T13:30:00.000Z",
    });
    expect(RELEASE_CAPABILITIES).toEqual(
      expect.arrayContaining([
        "course-pass-order-scoped-refunds-v1",
        "job-coverage-health-v2",
        "job-identity-dedup-v1",
        "manager-otp-delivery-reliability-v1",
        "oit-question-bank-staging-v1",
        "answer-length-governance-v1",
        "answer-length-semantic-gate-v1",
        "answer-length-source-repair-governance-v1",
        "answer-length-wastewater-source-repair-governance-v1",
        "answer-length-wastewater-contained-source-review-v1",
        "answer-length-wastewater-foundational-scope-v1",
        "training-hours-consolidated-v1",
        "manager-account-routing-v1",
        "course-pass-invite-confirmation-v1",
        "course-pass-browser-e2e-v1",
        "ai-tutor-safe-math-rendering-v1",
        "training-analytics-exact-aggregation-v1",
        "public-trust-content-v1",
        "bounded-paid-question-delivery-v1",
      ])
    );
    expect(RELEASE_ID).toBe("2026-09-04.public-trust-bounded-delivery.1");
    expect(RELEASE_CAPABILITIES).not.toContain("analytics-identity-v1");
  });
});
