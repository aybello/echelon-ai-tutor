import { randomUUID } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hiringEvents, hiringOrders, hiringTerms, organizations } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/accessService";
import type { TrpcContext } from "../_core/context";
import { resolveManagedOrganization } from "../teams/resolveManagerOrganization";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE, validateHiringSubscription, validatePilotBounds } from "./policy";

function ownerEmail(ctx: TrpcContext): string {
  const email = normalizeEmail(ctx.user?.email ?? ctx.studentEmail ?? "");
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in with the verified organization owner email." });
  return email;
}
export async function createHiringCheckout(ctx: TrpcContext, orgId: number): Promise<{ url: string | null; orderId: string }> {
  const email = ownerEmail(ctx);
  const org = await resolveManagedOrganization(ctx, { orgId, ownerOnly: true });
  if (!org || normalizeEmail(org.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Only the verified organization owner can purchase Hiring." });
  const priceId = process.env.HIRING_STRIPE_PRICE_ID;
  if (!priceId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Hiring checkout is not configured yet." });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const orderId = randomUUID();
  const existing = await db.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, org.id), eq(hiringOrders.status, "pending"))).limit(1);
  if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "A Hiring checkout is already in progress." });
  await db.insert(hiringOrders).values({ id: orderId, orgId: org.id, amountCents: HIRING_AMOUNT, currency: "cad", ownerEmail: email, status: "pending", createdAtMs: Date.now(), stripeCustomerId: org.stripeCustomerId ?? null });
  try {
    const { stripe } = await import("../stripe/stripe");
    const base = ENV.appBaseUrl.replace(/\/$/, "");
    const metadata = { type: HIRING_TYPE, policy: HIRING_POLICY, orderId, orgId: String(org.id), ownerEmail: email };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", line_items: [{ price: priceId, quantity: 1 }],
      ...(org.stripeCustomerId ? { customer: org.stripeCustomerId } : { customer_email: email }),
      metadata, subscription_data: { metadata }, allow_promotion_codes: false,
      success_url: `${base}/team?view=hiring&hiring_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/team?view=hiring&hiring_cancelled=1`,
    }, { idempotencyKey: `hiring-checkout:${orderId}` });
    await db.update(hiringOrders).set({ stripeCheckoutSessionId: session.id, stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null }).where(eq(hiringOrders.id, orderId));
    return { url: session.url, orderId };
  } catch (error) {
    await db.update(hiringOrders).set({ status: "checkout_failed" }).where(eq(hiringOrders.id, orderId));
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Hiring checkout could not be created. No subscription was activated." });
  }
}
export async function hiringOwner(ctx: TrpcContext, orgId: number) {
  const email = ownerEmail(ctx);
  const org = await resolveManagedOrganization(ctx, { orgId, ownerOnly: true });
  if (!org || normalizeEmail(org.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Only the verified organization owner can manage Hiring billing." });
  return { org, email };
}

export async function activateHiringPilot(ctx: TrpcContext, input: { orgId: number; startsAtMs: number; endsAtMs: number; quota: number; sourcePilotId: string }) {
  if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator authority is required." });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(input.sourcePilotId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid pilot identifier." });
  const bounds = validatePilotBounds(input.startsAtMs, input.endsAtMs, input.quota);
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, input.orgId)).limit(1);
  if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
  const termId = randomUUID();
  await db.transaction(async tx => {
    await tx.insert(hiringTerms).values({ id: termId, orgId: input.orgId, basis: "pilot", sourcePilotId: input.sourcePilotId, startsAtMs: bounds.startsAtMs, endsAtMs: bounds.endsAtMs, quota: bounds.quota, used: 0, state: "active", paymentState: "active", createdByEmail: normalizeEmail(ctx.user?.email ?? "admin") });
    await tx.insert(hiringEvents).values({ id: `pilot:${input.sourcePilotId}`, orgId: input.orgId, eventType: "pilot_activated", state: "claimed", createdAtMs: Date.now() });
  });
  return { termId, orgId: input.orgId, basis: "pilot" as const, startsAtMs: bounds.startsAtMs, endsAtMs: bounds.endsAtMs, quota: bounds.quota, used: 0 };
}

export async function getHiringStatus(ctx: TrpcContext, orgId: number) {
  const email = ownerEmail(ctx); const org = await resolveManagedOrganization(ctx, { orgId }); if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a manager of this organization." }); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const now = Date.now();
  const [term] = await db.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.state, "active"), eq(hiringTerms.paymentState, "active"), gt(hiringTerms.endsAtMs, now), lte(hiringTerms.startsAtMs, now))).orderBy(hiringTerms.endsAtMs).limit(1);
  return term ? { active: true, termId: term.id, basis: term.basis, used: term.used, quota: term.quota, remaining: Math.max(0, term.quota - term.used), startsAtMs: term.startsAtMs, endsAtMs: term.endsAtMs, sourceSubscriptionId: term.sourceSubscriptionId } : { active: false, termId: null, basis: null, used: 0, quota: 0, remaining: 0, startsAtMs: null, endsAtMs: null, sourceSubscriptionId: null };
}

export async function cancelHiringAtPeriodEnd(ctx: TrpcContext, orgId: number) {
  const { org } = await hiringOwner(ctx, orgId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [term] = await db.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.state, "active"), eq(hiringTerms.basis, "stripe"))).orderBy(hiringTerms.endsAtMs).limit(1);
  if (!term?.sourceSubscriptionId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No separate active Hiring subscription is available to cancel." });
  const [order] = await db.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, org.id), eq(hiringOrders.stripeSubscriptionId, term.sourceSubscriptionId))).limit(1);
  if (!order?.stripeSubscriptionId) throw new TRPCError({ code: "CONFLICT", message: "Hiring subscription binding could not be verified." });
  const { stripe } = await import("../stripe/stripe");
  const sub = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
  validateHiringSubscription(sub, { id: order.id, orgId: org.id, customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId });
  await stripe.subscriptions.update(order.stripeSubscriptionId, { cancel_at_period_end: true }); await db.update(hiringTerms).set({ state: "cancel_at_period_end" }).where(eq(hiringTerms.id, term.id));
  return { success: true as const, endsAtMs: term.endsAtMs };
}
