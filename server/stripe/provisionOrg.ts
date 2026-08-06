/**
 * provisionOrg.ts
 *
 * Core org provisioning logic extracted from webhook.ts for testability.
 * Called by the webhook handler AND directly by integration tests.
 *
 * This function is the single source of truth for:
 *   - Org upsert (create or update)
 *   - Manager seat grant
 *   - Event ledger registration and idempotency
 *   - Onboarding email with DB-persisted delivery flag
 *
 * Return value:
 *   { status: "completed" | "already_completed" | "failed"; orgId?: number; emailSent?: boolean }
 */

import { eq, and, sql } from "drizzle-orm";
import { organizations, subscriptions, stripeEventLog } from "../../drizzle/schema";
import { grantSeat } from "../routers/orgRouter";
import { notifyOwner } from "../_core/notification";
import { sendManagerOnboardingEmail } from "../email";
import { TIER_LABELS, type SubscriptionTier as ST, type SubscriptionProvince as SP } from "./subscriptionProducts";
import { ENV } from "../_core/env";

export interface ProvisionOrgInput {
  stripeEventId: string;
  eventType: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  orgName: string;
  managerEmail: string;
  province: SP;
  tier: ST;
  seats: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date;
  status: "active" | "past_due" | "cancelled";
}

export interface ProvisionOrgResult {
  status: "completed" | "already_completed" | "failed";
  orgId?: number;
  emailSent?: boolean;
  error?: string;
}

export async function provisionOrgFromWebhook(
  db: NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>,
  input: ProvisionOrgInput,
): Promise<ProvisionOrgResult> {
  const {
    stripeEventId, eventType, stripeSubscriptionId, stripeCustomerId,
    orgName, managerEmail, province, tier, seats,
    currentPeriodStart, currentPeriodEnd, status,
  } = input;

  // ── Event ledger: register or check ────────────────────────────────────────
  try {
    await db.insert(stripeEventLog).values({
      stripeEventId,
      eventType,
      stripeObjectId: stripeSubscriptionId,
      status: "pending",
      dbProcessed: false,
      emailDelivered: false,
      attemptCount: 1,
    });
  } catch (_dupErr: any) {
    const existing = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, stripeEventId)).limit(1);
    if (existing.length > 0 && existing[0].status === "completed") {
      return { status: "already_completed", orgId: existing[0].orgId ?? undefined };
    }
    await db.update(stripeEventLog).set({ attemptCount: sql`${stripeEventLog.attemptCount} + 1` }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});
  }

  // ── Upsert org ─────────────────────────────────────────────────────────────
  let orgId: number;
  try {
    const existingOrg = await db
      .select({ id: organizations.id, onboardingEmailSentAt: organizations.onboardingEmailSentAt })
      .from(organizations)
      .where(eq(organizations.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (existingOrg.length === 0) {
      const [insertResult] = await db.insert(organizations).values({
        name: orgName, province, tier, seatsTotal: seats, managerEmail,
        stripeSubscriptionId, stripeCustomerId,
        termStart: currentPeriodStart, termEnd: currentPeriodEnd,
        billingType: "stripe", status,
      });
      orgId = (insertResult as any).insertId;
      await grantSeat(db, { id: orgId, name: orgName, province, termStart: currentPeriodStart, termEnd: currentPeriodEnd, tier }, managerEmail, "manager");
      notifyOwner({ title: `New Team Plan: ${orgName}`, content: `${managerEmail} purchased a ${seats}-seat ${tier} plan for ${province}. Org ID: ${orgId}.` }).catch(() => {});
    } else {
      orgId = existingOrg[0].id;
      await db.update(organizations).set({ seatsTotal: seats, termStart: currentPeriodStart, termEnd: currentPeriodEnd, status }).where(eq(organizations.id, orgId));
      if (status === "active" || status === "past_due") {
        await db.update(subscriptions).set({ currentPeriodEnd }).where(and(eq(subscriptions.orgId, orgId), eq(subscriptions.status, "active")));
      } else {
        await db.update(subscriptions).set({ currentPeriodEnd, status: "expired" }).where(eq(subscriptions.orgId, orgId));
      }
    }

    await db.update(stripeEventLog).set({ dbProcessed: true, orgId }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});

  } catch (provisionErr: any) {
    await db.update(stripeEventLog).set({ status: "failed", lastError: provisionErr.message }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});
    return { status: "failed", error: provisionErr.message };
  }

  // ── Onboarding email: send if not yet delivered ────────────────────────────
  let emailSent = false;
  try {
    const orgForEmail = await db.select({ onboardingEmailSentAt: organizations.onboardingEmailSentAt }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!orgForEmail[0]?.onboardingEmailSentAt) {
      await sendManagerOnboardingEmail({
        managerEmail, orgName, seats,
        tierLabel: TIER_LABELS[tier as ST] ?? tier,
        dashboardUrl: `${ENV.appBaseUrl}/account?next=/team`,
      });
      await db.update(organizations).set({ onboardingEmailSentAt: new Date() }).where(eq(organizations.id, orgId));
      await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});
      emailSent = true;
    } else {
      await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});
      emailSent = false; // already sent previously
    }
  } catch (emailErr: any) {
    await db.update(stripeEventLog).set({ lastError: emailErr.message }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});
    // Email failure does not fail provisioning — return completed with emailSent=false
  }

  await db.update(stripeEventLog).set({ status: "completed", completedAt: new Date() }).where(eq(stripeEventLog.stripeEventId, stripeEventId)).catch(() => {});
  return { status: "completed", orgId, emailSent };
}
