import { createHash } from "node:crypto";

/**
 * Phase 8 — Production Operations Layer: Analytics Event Tracking
 *
 * Server-side event logger. Events are written to the database for product
 * analysis and also emitted as structured logs for operational observability.
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
  | "diagnostic_completed"
  | "diagnostic_checkout_started"
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

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function persistAnalyticsEvent(payload: AnalyticsEvent): Promise<void> {
  try {
    const [{ getDb }, { productAnalyticsEvents }] = await Promise.all([
      import("./db"),
      import("../drizzle/schema"),
    ]);
    const db = await getDb();
    if (!db) return;
    await db.insert(productAnalyticsEvents).values({
      eventName: payload.event,
      occurredAt: new Date(payload.ts),
      userId: payload.userId ?? null,
      emailHash: payload.email ? hashEmail(payload.email) : null,
      examType: payload.examType ?? null,
      productKey: payload.productKey ?? null,
      orgId: payload.orgId ?? null,
      metadata: payload.extra ? JSON.stringify(payload.extra) : null,
    });
  } catch (error) {
    console.warn("[analytics] persistence failed", error);
  }
}

/**
 * Track an analytics event. Structured console output for log aggregators.
 * Never throws — analytics must not break the main request path.
 */
export async function trackEvent(
  event: AnalyticsEventName,
  props?: Omit<AnalyticsEvent, "event" | "ts">
): Promise<void> {
  try {
    const payload: AnalyticsEvent = {
      event,
      ts: new Date().toISOString(),
      ...props,
    };
    const persistedPayload = {
      ...payload,
      extra: payload.extra ? { ...payload.extra } : undefined,
    };
    // Mask email before logging — applies to every caller without requiring
    // each call site to remember to redact. Pattern: abc@example.com → abc***@example.com
    if (payload.email) {
      payload.email = payload.email.replace(/(^.{3}).+@/, '$1***@');
    }
    // Structured log line — parseable by any log aggregator
    console.log(`[analytics] ${JSON.stringify(payload)}`);
    await persistAnalyticsEvent(persistedPayload);
  } catch {
    // Silently ignore — analytics must never break the request path
  }
}
