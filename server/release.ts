/**
 * Public release marker used to verify that the serving application—not only
 * the database or a scheduled script—has reached the intended deployment.
 *
 * Bump RELEASE_ID whenever a production release changes a capability listed
 * below. The values are deliberately non-secret and safe for /api/health.
 */
export const RELEASE_ID = "2026-09-04.public-trust-bounded-delivery.1";

export const RELEASE_CAPABILITIES = [
  "course-pass-order-scoped-refunds-v1",
  "job-coverage-health-v2",
  "job-identity-dedup-v1",
  "oit-hub-v1",
  "pricing-ssr-v2",
  "manager-otp-delivery-reliability-v1",
  "manager-organization-resolution-v1",
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
] as const;

export function publicReleaseHealth(ts = new Date()): {
  status: "ok";
  release: string;
  capabilities: readonly string[];
  ts: string;
} {
  return {
    status: "ok",
    release: RELEASE_ID,
    capabilities: RELEASE_CAPABILITIES,
    ts: ts.toISOString(),
  };
}
