import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hiringEvents, hiringOrders, hiringTerms, organizations } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/accessService";
import type { TrpcContext } from "../_core/context";
import { resolveManagedOrganization } from "../teams/resolveManagerOrganization";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE, validateHiringCancellationSubscription, validatePilotBounds } from "./policy";
import { assertCurrentAnnualOrganization } from "../recruitment/access";

function ownerEmail(ctx: TrpcContext): string {
  const email = normalizeEmail(ctx.user?.email ?? ctx.studentEmail ?? "");
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in with the verified organization owner email." });
  return email;
}
export async function createHiringCheckout(ctx: TrpcContext, orgId: number): Promise<{ url: string | null; orderId: string }> {
  const email = ownerEmail(ctx);
  const org = await resolveManagedOrganization(ctx, { orgId, ownerOnly: true });
  if (!org || normalizeEmail(org.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Only the verified organization owner can purchase Hiring." });
  assertCurrentAnnualOrganization(org, Date.now());
  const priceId = process.env.HIRING_STRIPE_PRICE_ID;
  if (!priceId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Hiring checkout is not configured yet." });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const { stripe } = await import("../stripe/stripe");
  const configuredPrice = await stripe.prices.retrieve(priceId, { expand: ["product"] }) as any;
  if (!configuredPrice.active || !configuredPrice.product?.active || configuredPrice.currency !== "cad" || configuredPrice.unit_amount !== HIRING_AMOUNT
    || configuredPrice.type !== "recurring" || configuredPrice.recurring?.interval !== "year"
    || configuredPrice.recurring?.interval_count !== 1 || configuredPrice.tax_behavior !== "exclusive"
    || configuredPrice.product?.metadata?.type !== HIRING_TYPE || configuredPrice.product?.metadata?.policy !== HIRING_POLICY) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The configured Hiring Stripe price does not match the approved annual CAD policy." });
  }
  let stripeCustomerId = org.stripeCustomerId ?? null;
  let orderId: string = randomUUID();
  let existingCheckoutSessionId: string | null = null;
  await db.transaction(async tx => {
    const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("update");
    if (!currentOrg || normalizeEmail(currentOrg.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
    assertCurrentAnnualOrganization(currentOrg, Date.now());
    stripeCustomerId = currentOrg.stripeCustomerId ?? null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email, metadata: { orgId: String(org.id), type: HIRING_TYPE, policy: HIRING_POLICY } }, { idempotencyKey: `hiring-customer:${org.id}` });
      stripeCustomerId = customer.id;
      await tx.update(organizations).set({ stripeCustomerId }).where(eq(organizations.id, org.id));
    }
    const existing = await tx.select().from(hiringOrders)
      .where(and(eq(hiringOrders.orgId, org.id), inArray(hiringOrders.status, ["pending", "active"]))).limit(1);
    if (existing[0]?.status === "active") throw new TRPCError({ code: "CONFLICT", message: "A Hiring subscription already exists." });
    if (existing[0]?.stripeSubscriptionId) throw new TRPCError({ code: "CONFLICT", message: "A Hiring billing operation is already connected. Cancel or reconcile it before another purchase." });
    if (existing[0]) stripeCustomerId = existing[0].stripeCustomerId;
    if (existing[0]?.stripeCheckoutSessionId) {
      orderId = existing[0].id;
      existingCheckoutSessionId = existing[0].stripeCheckoutSessionId;
      return;
    }
    if (existing[0] && Date.now() - existing[0].createdAtMs >= 23 * 60 * 60 * 1000) {
      throw new TRPCError({ code: "CONFLICT", message: "The earlier Hiring checkout needs billing reconciliation before retrying." });
    }
    if (existing[0]) orderId = existing[0].id;
    else await tx.insert(hiringOrders).values({ id: orderId, orgId: org.id, amountCents: HIRING_AMOUNT, currency: "cad", ownerEmail: email, status: "pending", createdAtMs: Date.now(), stripeCustomerId });
  });
  if (!stripeCustomerId) throw new TRPCError({ code: "CONFLICT", message: "Hiring customer binding is unavailable. Reconcile billing before retrying." });
  try {
    if (existingCheckoutSessionId) {
      const existingSession = await stripe.checkout.sessions.retrieve(existingCheckoutSessionId);
      if (existingSession.status === "open") return { url: existingSession.url, orderId };
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The previous Hiring checkout is no longer open. Wait for its expiry before starting a new checkout." });
    }
    const base = ENV.appBaseUrl.replace(/\/$/, "");
    const metadata = { type: HIRING_TYPE, policy: HIRING_POLICY, orderId, orgId: String(org.id), ownerEmail: email };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", line_items: [{ price: priceId, quantity: 1 }],
      customer: stripeCustomerId,
      metadata, subscription_data: { metadata }, allow_promotion_codes: false,
      automatic_tax: { enabled: true },
      success_url: `${base}/team?view=hiring&hiring_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/team?view=hiring&hiring_cancelled=1`,
    }, { idempotencyKey: `hiring-checkout:${orderId}` });
    await db.transaction(async tx => {
      const [current] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
      if (!current || (current.stripeCheckoutSessionId && current.stripeCheckoutSessionId !== session.id)) throw new TRPCError({ code: "CONFLICT", message: "Hiring checkout binding changed." });
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (current.stripeSubscriptionId && subscriptionId && current.stripeSubscriptionId !== subscriptionId) throw new TRPCError({ code: "CONFLICT", message: "Hiring subscription binding changed." });
      await tx.update(hiringOrders).set({ stripeCheckoutSessionId: current.stripeCheckoutSessionId ?? session.id,
        stripeSubscriptionId: current.stripeSubscriptionId ?? subscriptionId ?? null }).where(eq(hiringOrders.id, orderId));
    });
    return { url: session.url, orderId };
  } catch (error) {
    // Keep the durable pending operation. An ambiguous Stripe failure must not
    // create a replacement order with a new idempotency key and a second
    // potentially payable recurring subscription.
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Hiring checkout could not be created. No subscription was activated." });
  }
}
export async function hiringOwner(ctx: TrpcContext, orgId: number) {
  const email = ownerEmail(ctx);
  const org = await resolveManagedOrganization(ctx, { orgId, ownerOnly: true, purpose: "billing" });
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
  const email = ownerEmail(ctx);
  let org;
  try { org = await resolveManagedOrganization(ctx, { orgId }); }
  catch (error) {
    if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
    org = (await hiringOwner(ctx, orgId)).org;
  }
  if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a manager of this organization." });
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const now = Date.now();
  let currentAnnual = true;
  try { assertCurrentAnnualOrganization(org, now); } catch { currentAnnual = false; }
  const [activeTerm] = await db.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), inArray(hiringTerms.state, ["active", "cancel_at_period_end"]), eq(hiringTerms.paymentState, "active"), gt(hiringTerms.endsAtMs, now), lte(hiringTerms.startsAtMs, now))).orderBy(hiringTerms.endsAtMs).limit(1);
  const [billingTerm] = await db.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.basis, "stripe"), inArray(hiringTerms.state, ["active", "cancel_at_period_end", "suspended"]))).orderBy(desc(hiringTerms.endsAtMs)).limit(1);
  const [order] = await db.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, org.id),
    isNotNull(hiringOrders.stripeSubscriptionId), inArray(hiringOrders.status, ["pending", "active"]))).orderBy(desc(hiringOrders.createdAtMs)).limit(1);
  const owner = normalizeEmail(org.managerEmail) === email;
  const term = activeTerm ?? billingTerm;
  const active = currentAnnual && !!activeTerm;
  const canCancelRenewal = owner && !!order?.stripeSubscriptionId && !order.renewalCancelled;
  return term ? { active, owner, state: term.state, termId: term.id, basis: term.basis, used: term.used, quota: term.quota, remaining: Math.max(0, term.quota - term.used), startsAtMs: term.startsAtMs, endsAtMs: term.endsAtMs, sourceSubscriptionId: term.sourceSubscriptionId, canCancelRenewal } : { active: false, owner, state: null, termId: null, basis: order ? "stripe" : null, used: 0, quota: 0, remaining: 0, startsAtMs: null, endsAtMs: null, sourceSubscriptionId: order?.stripeSubscriptionId ?? null, canCancelRenewal };
}

export async function cancelHiringAtPeriodEnd(ctx: TrpcContext, orgId: number) {
  const { org, email } = await hiringOwner(ctx, orgId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const { stripe } = await import("../stripe/stripe");
  const endsAtMs = await db.transaction(async tx => {
    const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("share");
    if (!currentOrg || normalizeEmail(currentOrg.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
    const [lockedOrder] = await tx.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, org.id),
      isNotNull(hiringOrders.stripeSubscriptionId), inArray(hiringOrders.status, ["pending", "active"]))).orderBy(desc(hiringOrders.createdAtMs)).limit(1).for("update");
    if (!lockedOrder?.stripeSubscriptionId) throw new TRPCError({ code: "CONFLICT", message: "Hiring subscription binding could not be verified." });
    const subscriptionId = lockedOrder.stripeSubscriptionId;
    const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product"] });
    validateHiringCancellationSubscription(sub, { id: lockedOrder.id, orgId: org.id, customerId: lockedOrder.stripeCustomerId, subscriptionId });
    let cancelled = sub;
    if (sub.status !== "canceled" && !sub.cancel_at_period_end) cancelled = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    await tx.update(hiringOrders).set({ renewalCancelled: true }).where(eq(hiringOrders.id, lockedOrder.id));
    const [latest] = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.sourceSubscriptionId, subscriptionId))).orderBy(desc(hiringTerms.endsAtMs)).limit(1).for("update");
    if (latest && latest.paymentState === "active"
      && ["active", "cancel_at_period_end"].includes(latest.state)) {
      await tx.update(hiringTerms).set({ state: "cancel_at_period_end" }).where(eq(hiringTerms.id, latest.id));
    }
    const stripeEnd = cancelled.items.data[0]?.current_period_end;
    return Number.isSafeInteger(stripeEnd) ? stripeEnd! * 1000 : latest?.endsAtMs ?? null;
  });
  return { success: true as const, endsAtMs };
}
