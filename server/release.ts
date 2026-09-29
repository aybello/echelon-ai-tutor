/**
 * Public release marker used to verify that the serving application—not only
 * the database or a scheduled script—has reached the intended deployment.
 *
 * The build stamps the actual source commit. A dirty checkout is labelled;
 * source archives without a supplied commit explicitly report "unknown".
 * The values are deliberately non-secret and safe for /api/health.
 */
declare const __BUILD_RELEASE_ID__: string;
export const RELEASE_ID =
  typeof __BUILD_RELEASE_ID__ === "string" ? __BUILD_RELEASE_ID__ : "unknown";

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
  "learner-reliability-recovery-v1",
  "purchase-email-outbox-reliability-v1",
  "issued-mock-session-integrity-v1",
  "mock-answer-key-protection-v1",
  "course-scoped-learner-reporting-v1",
  "oit-exact-version-content-revision-v1",
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
