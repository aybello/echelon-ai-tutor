/**
 * Phase 8 — Production Operations Layer: Analytics Event Tracking
 *
 * Lightweight server-side event logger. Events are written to the console
 * in a structured JSON format so they can be collected by any log aggregator
 * (Datadog, Logtail, CloudWatch, etc.). No external dependency required.
 *
 * Usage:
 *   import { trackEvent } from "../analytics";
 *   trackEvent("quiz_started", { examType: "oit", userId: ctx.user?.id });
 */

export type AnalyticsEventName =
  | "signup"
  | "login"
  | "restore_access_requested"
  | "restore_access_completed"
  | "checkout_started"
  | "checkout_completed"
  | "quiz_started"
  | "quiz_completed"
  | "mock_exam_completed"
  | "ai_tutor_opened"
  | "team_seat_assigned"
  | "team_seat_revoked"
  | "operator_inactive_alert"
  | "export_downloaded"
  | "magic_link_requested"
  | "magic_link_consumed"
  | "otp_sent"
  | "otp_verified"
  | "subscription_created"
  | "subscription_cancelled"
  | "stripe_provisioning_failed"
  | "webhook_error"
  | "scheduled_job_failed";

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  ts: string;
  userId?: string | null;
  email?: string | null;
  examType?: string | null;
  productKey?: string | null;
  orgId?: number | null;
  extra?: Record<string, unknown>;
}

/**
 * Track an analytics event. Structured console output for log aggregators.
 * Never throws — analytics must not break the main request path.
 */
export function trackEvent(
  event: AnalyticsEventName,
  props?: Omit<AnalyticsEvent, "event" | "ts">
): void {
  try {
    const payload: AnalyticsEvent = {
      event,
      ts: new Date().toISOString(),
      ...props,
    };
    // Mask email before logging — applies to every caller without requiring
    // each call site to remember to redact. Pattern: abc@example.com → abc***@example.com
    if (payload.email) {
      payload.email = payload.email.replace(/(^.{3}).+@/, '$1***@');
    }
    // Structured log line — parseable by any log aggregator
    console.log(`[analytics] ${JSON.stringify(payload)}`);
  } catch {
    // Silently ignore — analytics must never break the request path
  }
}
