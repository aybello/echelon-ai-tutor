import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hiringEvents, hiringOrders, hiringTerms, organizations, type HiringOrder } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/accessService";
import type { TrpcContext } from "../_core/context";
import { resolveManagedOrganization } from "../teams/resolveManagerOrganization";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE, stripeId, validatePilotBounds } from "./policy";
import { assertCurrentAnnualOrganization } from "../recruitment/access";

// Cancellation keeps its order lock to serialize against invoice renewal. Bound
// its two HTTP calls (including disabling SDK retries), not just the SQL wait.
const lockedStripeRequest = { timeout: 2_000, maxNetworkRetries: 0 };
const checkoutStripeRequest = { timeout: 10_000, maxNetworkRetries: 0 };
const billingCandidates = (orgId: number) => and(eq(hiringOrders.orgId, orgId),
  or(inArray(hiringOrders.status, ["pending", "active"]), isNotNull(hiringOrders.stripeSubscriptionId)));
// Proof belongs to the immutable customer/subscription binding, never merely an
// order ID or mutable status. Recheck this key after acquiring reservation locks.
const billingBindingKey = (order: HiringOrder) => JSON.stringify([order.id, order.orgId, order.stripeCustomerId, order.stripeSubscriptionId]);
function validateBoundBillingSubscription(sub: any, order: HiringOrder) {
  // This is withdrawal/termination authority only, never entitlement authority.
  // Mutable Stripe metadata must not stop the owner cancelling a known bill.
  if (!sub || sub.deleted || !order.stripeSubscriptionId || sub.id !== order.stripeSubscriptionId) {
    throw new TRPCError({ code: "CONFLICT", message: "Hiring cancellation subscription binding mismatch" });
  }
  if (!order.stripeCustomerId || stripeId(sub.customer) !== order.stripeCustomerId) {
    throw new TRPCError({ code: "CONFLICT", message: "Hiring cancellation customer binding mismatch" });
  }
}
async function verifiedEndedBindings(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, orders: HiringOrder[]) {
  const ended = new Set<string>();
  for (const order of orders) {
    if (!order.stripeSubscriptionId) continue;
    const [deletion] = await db.select({ id: hiringEvents.id }).from(hiringEvents).where(and(
      eq(hiringEvents.orgId, order.orgId), eq(hiringEvents.orderId, order.id),
      eq(hiringEvents.eventType, "customer.subscription.deleted"), eq(hiringEvents.state, "claimed"))).limit(1);
    if (deletion) { ended.add(billingBindingKey(order)); continue; }
    // Checkout failure/expiry and scheduled cancellation are NOT termination.
    // A local cancelled flag is only a reason to seek authoritative live proof.
    if (order.status !== "cancelled" || !order.renewalCancelled) continue;
    try {
      const { stripe } = await import("../stripe/stripe");
      const sub = await stripe.subscriptions.retrieve(order.stripeSubscriptionId, {}, lockedStripeRequest);
      validateBoundBillingSubscription(sub, order);
      if (["canceled", "incomplete_expired"].includes(sub.status)) ended.add(billingBindingKey(order));
    } catch {
      // Unavailable/mismatched evidence, including resource_missing, fails closed.
      // Never detach the historical binding needed by delayed invoices/refunds.
    }
  }
  return ended;
}

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
  const configuredPrice = await stripe.prices.retrieve(priceId, { expand: ["product"] }, checkoutStripeRequest) as any;
  if (!configuredPrice.active || !configuredPrice.product?.active || configuredPrice.currency !== "cad" || configuredPrice.unit_amount !== HIRING_AMOUNT
    || configuredPrice.type !== "recurring" || configuredPrice.recurring?.interval !== "year"
    || configuredPrice.recurring?.interval_count !== 1 || configuredPrice.recurring?.usage_type !== "licensed"
    || configuredPrice.billing_scheme !== "per_unit" || configuredPrice.transform_quantity || configuredPrice.tax_behavior !== "exclusive"
    || configuredPrice.product?.metadata?.type !== HIRING_TYPE || configuredPrice.product?.metadata?.policy !== HIRING_POLICY) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The configured Hiring Stripe price does not match the approved annual CAD policy." });
  }
  let stripeCustomerId: string | null = null;
  let orderId: string = randomUUID();
  let orderOwnerEmail = email;
  let existingCheckoutSessionId: string | null = null;
  const candidates = await db.select().from(hiringOrders).where(billingCandidates(org.id));
  const endedBindings = await verifiedEndedBindings(db, candidates);
  // No Stripe requests while holding the organization lock: candidate operations
  // also need this row. A second short transaction rechecks all mutable authority.
  const reserveOrder = (createdCustomerId: string | null = null) => db.transaction(async tx => {
    const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("update");
    if (!currentOrg || normalizeEmail(currentOrg.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
    assertCurrentAnnualOrganization(currentOrg, Date.now());
    const locked = await tx.select().from(hiringOrders)
      .where(billingCandidates(org.id))
      .orderBy(desc(hiringOrders.createdAtMs)).for("update");
    const existing = locked.filter(order => !endedBindings.has(billingBindingKey(order)));
    if (existing.some(order => order.status === "active")) throw new TRPCError({ code: "CONFLICT", message: "A Hiring subscription already exists." });
    // A terminal Checkout message is not proof that a bound subscription cannot
    // collect. Keep all bound orders visible to billing until reconciled.
    if (existing.some(order => order.stripeSubscriptionId)) throw new TRPCError({ code: "CONFLICT", message: "A Hiring billing operation is already connected. Cancel or reconcile it before another purchase." });
    const pending = existing[0];
    if (pending && !pending.stripeCheckoutSessionId && Date.now() - pending.createdAtMs >= 23 * 60 * 60 * 1000) {
      throw new TRPCError({ code: "CONFLICT", message: "The earlier Hiring checkout needs billing reconciliation before retrying." });
    }
    // Prefer an existing operation's binding, including when the organization
    // customer has not yet been saved. Never create a second customer for it.
    stripeCustomerId = pending ? pending.stripeCustomerId : currentOrg.stripeCustomerId ?? createdCustomerId;
    if (!stripeCustomerId) {
      if (pending) throw new TRPCError({ code: "CONFLICT", message: "Hiring customer binding is unavailable. Reconcile billing before retrying." });
      return false;
    }
    if (!currentOrg.stripeCustomerId) await tx.update(organizations).set({ stripeCustomerId }).where(eq(organizations.id, org.id));
    if (pending) {
      orderId = pending.id;
      orderOwnerEmail = pending.ownerEmail;
      existingCheckoutSessionId = pending.stripeCheckoutSessionId;
    } else {
      await tx.insert(hiringOrders).values({ id: orderId, orgId: org.id, amountCents: HIRING_AMOUNT, currency: "cad", ownerEmail: email, status: "pending", createdAtMs: Date.now(), stripeCustomerId });
    }
    return true;
  });
  try {
    if (!await reserveOrder()) {
      const customer = await stripe.customers.create({ email, metadata: { orgId: String(org.id), type: HIRING_TYPE, policy: HIRING_POLICY } }, { ...checkoutStripeRequest, idempotencyKey: `hiring-customer:${org.id}` });
      if (!customer.id) throw new TRPCError({ code: "CONFLICT", message: "Hiring customer binding is unavailable. Reconcile billing before retrying." });
      await reserveOrder(customer.id);
    }
    if (!stripeCustomerId) throw new TRPCError({ code: "CONFLICT", message: "Hiring customer binding is unavailable. Reconcile billing before retrying." });
    const base = ENV.appBaseUrl.replace(/\/$/, "");
    const metadata = { type: HIRING_TYPE, policy: HIRING_POLICY, orderId, orgId: String(org.id), ownerEmail: orderOwnerEmail };
    const session = existingCheckoutSessionId
      ? await stripe.checkout.sessions.retrieve(existingCheckoutSessionId, {}, checkoutStripeRequest)
      : await stripe.checkout.sessions.create({
        mode: "subscription", line_items: [{ price: priceId, quantity: 1 }],
        customer: stripeCustomerId,
        metadata, subscription_data: { metadata }, allow_promotion_codes: false,
        automatic_tax: { enabled: true },
        success_url: `${base}/team?view=hiring&hiring_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/team?view=hiring&hiring_cancelled=1`,
      }, { ...checkoutStripeRequest, idempotencyKey: `hiring-checkout:${orderId}` });
    if (!session.id || (existingCheckoutSessionId && session.id !== existingCheckoutSessionId)
      || stripeId(session.customer) !== stripeCustomerId || session.mode !== "subscription"
      || Object.entries(metadata).some(([key, value]) => session.metadata?.[key] !== value)
      || !["open", "complete", "expired"].includes(session.status ?? "")
      || (session.subscription != null && !stripeId(session.subscription))) {
      throw new TRPCError({ code: "CONFLICT", message: "Hiring checkout binding could not be verified. Reconcile billing before retrying." });
    }
    const subscriptionId = stripeId(session.subscription);
    const outcome = await db.transaction(async tx => {
      const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("share");
      if (!currentOrg || normalizeEmail(currentOrg.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
      assertCurrentAnnualOrganization(currentOrg, Date.now());
      const [current] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
      if (!current || current.orgId !== org.id || current.stripeCustomerId !== stripeCustomerId
        || (current.stripeCheckoutSessionId && current.stripeCheckoutSessionId !== session.id)) throw new TRPCError({ code: "CONFLICT", message: "Hiring checkout binding changed." });
      if (current.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "The Hiring checkout is no longer pending. Reload billing before retrying." });
      if (current.stripeSubscriptionId && subscriptionId && current.stripeSubscriptionId !== subscriptionId) throw new TRPCError({ code: "CONFLICT", message: "Hiring subscription binding changed." });
      if (current.stripeSubscriptionId) throw new TRPCError({ code: "CONFLICT", message: "A Hiring billing operation is already connected. Cancel or reconcile it before another purchase." });
      const expired = session.status === "expired" && !subscriptionId;
      await tx.update(hiringOrders).set({ stripeCheckoutSessionId: current.stripeCheckoutSessionId ?? session.id,
        stripeSubscriptionId: subscriptionId,
        ...(expired ? { status: "checkout_expired" } : {}) }).where(eq(hiringOrders.id, orderId));
      return expired ? "expired" : subscriptionId || session.status !== "open" || !session.url ? "reconcile" : "open";
    });
    // Throw after the transaction commits so confirmed expiry actually releases
    // the unbound order; neither completion nor uncertainty permits replacement.
    if (outcome === "expired") throw new TRPCError({ code: "CONFLICT", message: "The previous Hiring checkout expired. Retry to start a new checkout." });
    if (outcome !== "open") throw new TRPCError({ code: "CONFLICT", message: "The Hiring checkout is awaiting billing reconciliation. Reload billing before retrying." });
    return { url: session.url, orderId };
  } catch (error) {
    // Keep durable operation/idempotency bindings: Stripe may have accepted the
    // request even when its response was lost. Do not promise no activation.
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Hiring checkout could not be confirmed. Reload billing or retry this checkout; its billing outcome may still be pending." });
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
  const [billingTerm] = await db.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.basis, "stripe"), inArray(hiringTerms.state, ["active", "cancel_at_period_end", "suspended", "subscription_suspended"]))).orderBy(desc(hiringTerms.endsAtMs)).limit(1);
  const candidates = await db.select().from(hiringOrders).where(billingCandidates(org.id)).orderBy(desc(hiringOrders.createdAtMs));
  const endedBindings = await verifiedEndedBindings(db, candidates);
  const currentOrders = candidates.filter(order => !endedBindings.has(billingBindingKey(order)));
  const order = currentOrders.find(order => order.stripeSubscriptionId);
  const owner = normalizeEmail(org.managerEmail) === email;
  const term = activeTerm ?? billingTerm;
  const active = currentAnnual && !!activeTerm;
  const canCancelRenewal = owner && !!order?.stripeSubscriptionId && !order.renewalCancelled;
  const canPurchase = owner && currentAnnual && !Boolean(activeTerm) && !currentOrders.some(order => order.stripeSubscriptionId || order.status === "active");
  // Access can come from a pilot while a separate Stripe operation still bills.
  // Keep the original access fields, with independent billing facts for the UI.
  const billing = { billingOrderId: order?.id ?? null, billingSubscriptionId: order?.stripeSubscriptionId ?? null,
    billingRenewalCancelled: !!order?.renewalCancelled, hasBillingSubscription: !!order?.stripeSubscriptionId, canPurchase };
  return term ? { active, owner, state: term.state, termId: term.id, basis: term.basis, used: term.used, quota: term.quota, remaining: Math.max(0, term.quota - term.used), startsAtMs: term.startsAtMs, endsAtMs: term.endsAtMs, sourceSubscriptionId: term.sourceSubscriptionId, canCancelRenewal, ...billing } : { active: false, owner, state: null, termId: null, basis: order ? "stripe" : null, used: 0, quota: 0, remaining: 0, startsAtMs: null, endsAtMs: null, sourceSubscriptionId: order?.stripeSubscriptionId ?? null, canCancelRenewal, ...billing };
}

export async function cancelHiringAtPeriodEnd(ctx: TrpcContext, orgId: number) {
  const { org, email } = await hiringOwner(ctx, orgId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const { stripe } = await import("../stripe/stripe");
  const candidates = await db.select().from(hiringOrders).where(billingCandidates(org.id));
  const endedBindings = await verifiedEndedBindings(db, candidates);
  const endsAtMs = await db.transaction(async tx => {
    const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("share");
    if (!currentOrg || normalizeEmail(currentOrg.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
    const lockedOrders = await tx.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, org.id),
      isNotNull(hiringOrders.stripeSubscriptionId))).orderBy(desc(hiringOrders.createdAtMs)).for("update");
    const lockedOrder = lockedOrders.find(order => !endedBindings.has(billingBindingKey(order)));
    if (!lockedOrder?.stripeSubscriptionId) throw new TRPCError({ code: "CONFLICT", message: "Hiring subscription binding could not be verified." });
    const subscriptionId = lockedOrder.stripeSubscriptionId;
    const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product"] }, lockedStripeRequest);
    validateBoundBillingSubscription(sub, lockedOrder);
    let cancelled = sub;
    const terminated = ["canceled", "incomplete_expired"].includes(sub.status);
    if (!terminated && !sub.cancel_at_period_end) cancelled = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true }, lockedStripeRequest);
    await tx.update(hiringOrders).set({ renewalCancelled: true, ...(terminated ? { status: "cancelled" } : {}) }).where(eq(hiringOrders.id, lockedOrder.id));
    const [latest] = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.sourceSubscriptionId, subscriptionId))).orderBy(desc(hiringTerms.endsAtMs)).limit(1).for("update");
    if (latest && latest.paymentState === "active"
      && ["active", "cancel_at_period_end"].includes(latest.state)) {
      await tx.update(hiringTerms).set({ state: terminated ? "subscription_suspended" : "cancel_at_period_end" }).where(eq(hiringTerms.id, latest.id));
    }
    const stripeEnd = cancelled.items.data[0]?.current_period_end;
    return Number.isSafeInteger(stripeEnd) ? stripeEnd! * 1000 : latest?.endsAtMs ?? null;
  });
  return { success: true as const, endsAtMs };
}
