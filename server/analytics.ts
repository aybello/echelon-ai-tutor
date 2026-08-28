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
  | "pricing_viewed"
  | "buyer_path_selected"
  | "product_selected"
  | "checkout_started"
  | "checkout_completed"
  | "diagnostic_completed"
  | "diagnostic_started"
  | "onboarding_profile_completed"
  | "access_activated"
  | "diagnostic_checkout_started"
  | "quiz_started"
  | "quiz_completed"
  | "mock_exam_completed"
  | "ai_tutor_opened"
  | "ai_tutor_message"
  | "ai_tutor_session_saved"
  | "command_started"
  | "command_step_completed"
  | "command_completed"
  | "command_feedback_submitted"
  | "command_email_captured"
  | "team_seat_assigned"
  | "team_seat_revoked"
  | "operator_inactive_alert"
  | "export_downloaded"
  | "magic_link_requested"
  | "magic_link_consumed"
  | "otp_sent"
  | "otp_verified"
  | "subscription_created"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "purchase_refunded"
  | "stripe_provisioning_failed"
  | "webhook_error"
  | "scheduled_job_failed";

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  ts: string;
  userId?: string | null;
  email?: string | null;
  /** Raw short-lived/browser identifier; SHA-256 hashed before persistence. */
  anonymousId?: string | null;
  /** Already-hashed browser identity, returned by a payment provider in metadata. */
  identityHash?: string | null;
  examType?: string | null;
  productKey?: string | null;
  orgId?: number | null;
  extra?: Record<string, unknown>;
}

export function hashAnalyticsEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function hashAnalyticsAnonymousId(anonymousId: string): string {
  return createHash("sha256").update(`anonymous:${anonymousId.trim()}`).digest("hex");
}

export function resolveAnalyticsHashes(payload: Pick<AnalyticsEvent, "email" | "anonymousId" | "identityHash">) {
  const validIdentityHash = payload.identityHash && /^[a-f0-9]{64}$/.test(payload.identityHash)
    ? payload.identityHash
    : null;
  return {
    emailHash: payload.email ? hashAnalyticsEmail(payload.email) : null,
    anonymousHash: validIdentityHash
      ?? (payload.anonymousId ? hashAnalyticsAnonymousId(payload.anonymousId) : null),
  };
}

export async function persistAnalyticsEvent(payload: AnalyticsEvent): Promise<void> {
  try {
    const [{ getDb }, { productAnalyticsEvents }] = await Promise.all([
      import("./db"),
      import("../drizzle/schema"),
    ]);
    const db = await getDb();
    if (!db) return;
    const identity = resolveAnalyticsHashes(payload);
    await db.insert(productAnalyticsEvents).values({
      eventName: payload.event,
      occurredAt: new Date(payload.ts),
      userId: payload.userId ?? null,
      emailHash: identity.emailHash,
      anonymousHash: identity.anonymousHash,
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
    // Browser IDs are never emitted to application logs.
    delete payload.anonymousId;
    delete payload.identityHash;
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
