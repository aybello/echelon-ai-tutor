import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, lt, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hiringEvents, hiringOrders, hiringTerms, organizations, type HiringOrder } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/accessService";
import type { TrpcContext } from "../_core/context";
import { resolveManagedOrganization } from "../teams/resolveManagerOrganization";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE, stripeId, validatePilotBounds } from "./policy";
import { assertCurrentAnnualOrganization } from "../recruitment/access";
import { hiringTermState } from "./paymentLedger";
import { ORGANIZATION_COMMERCE_ENABLED, ORGANIZATION_COMMERCE_HOLD_MESSAGE } from "../commercialAvailability";

// Cancellation keeps its order lock to serialize against invoice renewal. Bound
// its two HTTP calls (including disabling SDK retries), not just the SQL wait.
const lockedStripeRequest = { timeout: 2_000, maxNetworkRetries: 0 };
const checkoutStripeRequest = { timeout: 10_000, maxNetworkRetries: 0 };
const billingCandidates = (orgId: number) => and(eq(hiringOrders.orgId, orgId),
  or(inArray(hiringOrders.status, ["pending", "active"]), isNotNull(hiringOrders.stripeSubscriptionId)));
const activeAllowance = (orgId: number, now: number) => and(eq(hiringTerms.orgId, orgId),
  inArray(hiringTerms.state, ["active", "cancel_at_period_end"]), eq(hiringTerms.paymentState, "active"),
  gt(hiringTerms.endsAtMs, now), lte(hiringTerms.startsAtMs, now));
function purchaseAllowance(orgId: number, now: number) {
  // Checkout starts an annual term now. A scheduled complimentary window must
  // not become a second allowance inside that same paid year.
  const anniversary = new Date(now), month = anniversary.getUTCMonth();
  anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);
  if (anniversary.getUTCMonth() !== month) anniversary.setUTCDate(0);
  return or(activeAllowance(orgId, now), and(eq(hiringTerms.orgId, orgId), eq(hiringTerms.basis, "pilot"),
    inArray(hiringTerms.state, ["active", "cancel_at_period_end"]), eq(hiringTerms.paymentState, "active"),
    gt(hiringTerms.endsAtMs, now), lt(hiringTerms.startsAtMs, anniversary.getTime())));
}
function purchaseBlockReason(hasAllowance: boolean, orders: HiringOrder[]): string | null {
  if (hasAllowance) return "An active Hiring allowance or overlapping complimentary window already exists. Refresh Hiring status before purchasing.";
  if (orders.some(order => order.status === "active")) return "A Hiring subscription already exists.";
  // A terminal Checkout message is not proof that a bound subscription cannot
  // collect. Keep all bound orders visible to billing until reconciled.
  if (orders.some(order => order.stripeSubscriptionId)) return "A Hiring billing operation is already connected. Cancel or reconcile it before another purchase.";
  return null;
}
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
  if (!ORGANIZATION_COMMERCE_ENABLED) throw new TRPCError({ code: "PRECONDITION_FAILED", message: ORGANIZATION_COMMERCE_HOLD_MESSAGE });
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
    // The org UPDATE lock also fences complimentary activation. Recheck on
    // both reservation attempts, including after out-of-transaction Stripe I/O.
    // Preserve order-before-term locking used by lifecycle/payment writers.
    const [allowance] = await tx.select().from(hiringTerms).where(purchaseAllowance(org.id, Date.now())).limit(1).for("share");
    const blocked = purchaseBlockReason(!!allowance, existing);
    if (blocked) throw new TRPCError({ code: "CONFLICT", message: blocked });
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
  const termId = randomUUID();
  const candidates = await db.select().from(hiringOrders).where(billingCandidates(input.orgId));
  // Keep any live termination verification outside the organization lock, then
  // recheck the exact bindings under org -> order locks, just like checkout.
  const endedBindings = await verifiedEndedBindings(db, candidates);
  await db.transaction(async tx => {
    const [org] = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, input.orgId)).limit(1).for("update");
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
    const locked = await tx.select().from(hiringOrders).where(billingCandidates(input.orgId))
      .orderBy(desc(hiringOrders.createdAtMs)).for("update");
    // A reservation remains payable while Stripe is in flight, even before a
    // session/subscription ID returns. Never layer a new free grant over it.
    if (locked.some(order => !endedBindings.has(billingBindingKey(order)))) {
      throw new TRPCError({ code: "CONFLICT", message: "Hiring billing is pending or still connected. Cancel or reconcile it before activating a complimentary allowance." });
    }
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
  const [activeTerm] = await db.select().from(hiringTerms).where(activeAllowance(org.id, now)).orderBy(hiringTerms.endsAtMs).limit(1);
  const [allowance] = await db.select().from(hiringTerms).where(purchaseAllowance(org.id, now)).limit(1);
  const [billingTerm] = await db.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.basis, "stripe"), inArray(hiringTerms.state, ["active", "cancel_at_period_end", "suspended", "subscription_suspended", "policy_suspended", "manual_suspended"]))).orderBy(desc(hiringTerms.endsAtMs)).limit(1);
  const candidates = await db.select().from(hiringOrders).where(billingCandidates(org.id)).orderBy(desc(hiringOrders.createdAtMs));
  const endedBindings = await verifiedEndedBindings(db, candidates);
  const currentOrders = candidates.filter(order => !endedBindings.has(billingBindingKey(order)));
  const order = currentOrders.find(order => order.stripeSubscriptionId);
  const owner = normalizeEmail(org.managerEmail) === email;
  const term = activeTerm ?? billingTerm;
  const active = currentAnnual && !!activeTerm;
  const canCancelRenewal = owner && !!order?.stripeSubscriptionId && !order.renewalCancelled;
  const canPurchase = ORGANIZATION_COMMERCE_ENABLED && owner && currentAnnual && purchaseBlockReason(!!allowance, currentOrders) === null;
  // Access can come from a pilot while a separate Stripe operation still bills.
  // Keep the original access fields, with independent billing facts for the UI.
  const billing = { billingOrderId: order?.id ?? null, billingSubscriptionId: order?.stripeSubscriptionId ?? null,
    billingRenewalCancelled: !!order?.renewalCancelled, hasBillingSubscription: !!order?.stripeSubscriptionId, canPurchase };
  return term ? { active, owner, state: term.state, termId: term.id, basis: term.basis, used: term.used, quota: term.quota, remaining: Math.max(0, term.quota - term.used), startsAtMs: term.startsAtMs, endsAtMs: term.endsAtMs, sourceSubscriptionId: term.sourceSubscriptionId, canCancelRenewal, ...billing } : { active: false, owner, state: null, termId: null, basis: order ? "stripe" : null, used: 0, quota: 0, remaining: 0, startsAtMs: null, endsAtMs: null, sourceSubscriptionId: order?.stripeSubscriptionId ?? null, canCancelRenewal, ...billing };
}

export async function cancelHiringAtPeriodEnd(ctx: TrpcContext, input: {
  orgId: number; expectedBillingOrderId: string; expectedBillingSubscriptionId: string;
}) {
  const { org, email } = await hiringOwner(ctx, input.orgId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const { stripe } = await import("../stripe/stripe");
  const candidates = await db.select().from(hiringOrders).where(billingCandidates(org.id));
  const endedBindings = await verifiedEndedBindings(db, candidates);
  const endsAtMs = await db.transaction(async tx => {
    const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("share");
    if (!currentOrg || normalizeEmail(currentOrg.managerEmail) !== email) throw new TRPCError({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
    const lockedOrders = await tx.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, org.id),
      isNotNull(hiringOrders.stripeSubscriptionId))).orderBy(desc(hiringOrders.createdAtMs)).for("update");
    const lockedOrder = lockedOrders.find(order => !endedBindings.has(billingBindingKey(order)));
    if (!lockedOrder?.stripeSubscriptionId || lockedOrder.id !== input.expectedBillingOrderId
      || lockedOrder.stripeSubscriptionId !== input.expectedBillingSubscriptionId) {
      throw new TRPCError({ code: "CONFLICT", message: "Hiring billing changed. Refresh Hiring status and confirm cancellation again." });
    }
    const subscriptionId = lockedOrder.stripeSubscriptionId;
    const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product"] }, lockedStripeRequest);
    validateBoundBillingSubscription(sub, lockedOrder);
    let cancelled = sub;
    if (!["canceled", "incomplete_expired"].includes(sub.status) && !sub.cancel_at_period_end) cancelled = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true }, lockedStripeRequest);
    validateBoundBillingSubscription(cancelled, lockedOrder);
    const terminated = ["canceled", "incomplete_expired"].includes(cancelled.status);
    if (!terminated && !cancelled.cancel_at_period_end) throw new TRPCError({ code: "CONFLICT", message: "Hiring renewal cancellation could not be confirmed. Refresh Hiring status before retrying." });
    // Cancellation is withdrawal-only: observing ineligibility cannot become a
    // positive grant through its update response. Recovery belongs to validated
    // payment/subscription reconciliation, not the owner's cancellation request.
    const effective = sub.status === "active" ? cancelled : { ...cancelled, status: sub.status };
    await tx.update(hiringOrders).set({ renewalCancelled: true, ...(terminated ? { status: "cancelled" } : {}) }).where(eq(hiringOrders.id, lockedOrder.id));
    const terms = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.orgId, org.id), eq(hiringTerms.sourceSubscriptionId, subscriptionId))).orderBy(hiringTerms.id).for("update");
    for (const term of terms) {
      if (term.paymentState !== "active" || !["active", "cancel_at_period_end", "subscription_suspended"].includes(term.state)) continue;
      // Withdrawal authority alone must never clear an existing access hold.
      // Reconcile every period (including future renewals), not just the latest.
      const state = hiringTermState(term.paymentState, effective);
      await tx.update(hiringTerms).set({ state: term.state === "subscription_suspended" ? "subscription_suspended" : state }).where(eq(hiringTerms.id, term.id));
    }
    const stripeEnd = cancelled.items?.data?.[0]?.current_period_end;
    return Number.isSafeInteger(stripeEnd) ? stripeEnd! * 1000 : terms.reduce<number | null>((end, term) => end === null ? term.endsAtMs : Math.max(end, term.endsAtMs), null);
  });
  return { success: true as const, endsAtMs };
}
