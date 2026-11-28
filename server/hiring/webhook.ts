import { randomUUID } from "node:crypto";
import { stripe } from "../stripe/stripe";
import { hiringOrders, hiringPayments, hiringTerms, type HiringOrder } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { HIRING_POLICY, HIRING_QUOTA, HIRING_TYPE, InvalidHiringPayment, hiringMetadata, invoicePaymentEvidence,
  invoiceSubscriptionId, stripeId, validateHiringCharge, validateHiringInvoice, validateHiringSubscription } from "./policy";
import { closeHiringInvoiceReviews, hiringTermState, reconcileHiringPayment, recordHiringEvent } from "./paymentLedger";

const READ_OPTIONS = { timeout: 5_000, maxNetworkRetries: 0 };
const INVOICE_EXPAND = { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] };
type Result = { handled: boolean; reviewRequired?: boolean };
export function isHiringEvent(event: any): boolean {
  return hiringMetadata(event?.data?.object).type === HIRING_TYPE;
}
function subscriptionOwned(sub: any, order: HiringOrder): boolean {
  return sub && hiringMetadata(sub).type === HIRING_TYPE && sub.metadata?.policy === HIRING_POLICY
    && sub.metadata?.orderId === order.id && sub.metadata?.orgId === String(order.orgId)
    && stripeId(sub.customer) === order.stripeCustomerId
    && (!order.stripeSubscriptionId || sub.id === order.stripeSubscriptionId);
}
async function review(tx: any, event: any, order: HiringOrder, invoiceId: string | null = null): Promise<Result> {
  await recordHiringEvent(tx, event, order, invoiceId, true);
  return { handled: true, reviewRequired: true };
}
async function boundOrder(db: any, subscriptionId: string | null): Promise<HiringOrder | undefined> {
  if (!subscriptionId) return undefined;
  const [order] = await db.select().from(hiringOrders).where(eq(hiringOrders.stripeSubscriptionId, subscriptionId)).limit(1);
  return order;
}
async function liveDisputes(chargeId: string, charge: any) {
  if (charge.refunded || (charge.amount_refunded > 0 && charge.amount_refunded >= charge.amount)) return { data: [], has_more: false };
  return stripe.disputes.list({ charge: chargeId, limit: 100 }, READ_OPTIONS);
}
async function invoiceOwnership(db: any, invoice: any): Promise<{ invoice: any; orderId?: string; owned: boolean }> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  const bound = await boundOrder(db, subscriptionId);
  if (bound) return { invoice, orderId: bound.id, owned: true };
  let metadata = hiringMetadata(invoice);
  if (metadata.type !== HIRING_TYPE && subscriptionId) {
    const live = await stripe.subscriptions.retrieve(subscriptionId, {}, READ_OPTIONS);
    metadata = hiringMetadata(live);
  }
  return { invoice, orderId: metadata.orderId, owned: metadata.type === HIRING_TYPE };
}

/** Classify every allocation by durable IDs and authoritative subscription metadata.
 * Unknown, mixed or incomplete ownership is retryable, never legacy fallthrough. */
async function discoverReversalInvoice(db: any, paymentIntentId: string) {
  let cursor: string | undefined;
  const found = new Map<string, Awaited<ReturnType<typeof invoiceOwnership>>>();
  for (let page = 0; page < 10; page++) {
    const payments = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: paymentIntentId },
      limit: 100, ...(cursor ? { starting_after: cursor } : {}) }, READ_OPTIONS);
    for (const allocation of payments.data) {
      const id = stripeId(allocation.invoice);
      if (!id) throw new Error("Reversal allocation omits invoice ownership; retry classification");
      if (found.has(id)) continue;
      const invoice = await stripe.invoices.retrieve(id, INVOICE_EXPAND, READ_OPTIONS);
      found.set(id, await invoiceOwnership(db, invoice));
    }
    if (!payments.has_more) {
      const owned = [...found.values()].filter(item => item.owned);
      if (!owned.length) return null;
      if (owned.length !== 1 || found.size !== 1) throw new Error("Ambiguous Hiring/legacy payment allocation ownership requires reconciliation");
      return owned[0];
    }
    const next = payments.data.at(-1)?.id;
    if (!next || next === cursor) throw new Error("Incomplete reversal allocation ownership; retry classification");
    cursor = next;
  }
  throw new Error("Reversal allocation ownership pagination exceeded safe bound");
}

async function dispatchReversal(db: any, event: any): Promise<Result> {
  const object = event.data.object;
  const chargeId = stripeId(event.type.startsWith("charge.dispute") ? object.charge : object);
  if (!chargeId) return isHiringEvent(event) ? { handled: true, reviewRequired: true } : { handled: false };
  const [discoveredTerm] = await db.select().from(hiringTerms).where(eq(hiringTerms.sourceChargeId, chargeId)).limit(1);
  const [discoveredPayment] = await db.select().from(hiringPayments).where(eq(hiringPayments.id, chargeId)).limit(1);
  const charge = await stripe.charges.retrieve(chargeId, {}, READ_OPTIONS) as any;
  const paymentIntentId = discoveredPayment?.paymentIntentId ?? discoveredTerm?.sourcePaymentIntentId ?? stripeId(charge.payment_intent);
  const invoiceId = discoveredPayment?.invoiceId ?? discoveredTerm?.sourceInvoiceId;
  const found = invoiceId ? null : paymentIntentId ? await discoverReversalInvoice(db, paymentIntentId) : null;
  const bound = discoveredTerm ? await boundOrder(db, discoveredTerm.sourceSubscriptionId) : undefined;
  const orderId = discoveredPayment?.orderId ?? bound?.id ?? found?.orderId;
  if (!discoveredTerm && !discoveredPayment && !found?.owned) {
    if (isHiringEvent(event)) throw new Error("Tagged Hiring reversal has no authoritative invoice ownership");
    return { handled: false };
  }
  if (!orderId) return { handled: true, reviewRequired: true };
  const result = await db.transaction(async (tx: any) => {
    const [order]: HiringOrder[] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
    if (!order) throw new Error("Hiring reversal order is unavailable for reconciliation");
    // Reread immutable bindings after the order lock; fulfilment may have committed while we waited.
    const [current] = await tx.select().from(hiringTerms).where(eq(hiringTerms.sourceChargeId, chargeId)).limit(1);
    const [stored] = await tx.select().from(hiringPayments).where(eq(hiringPayments.id, chargeId)).limit(1);
    const known = !!(current || stored);
    let invoice = found?.invoice;
    const resolvedInvoiceId = stored?.invoiceId ?? current?.sourceInvoiceId ?? invoice?.id;
    const subscriptionId = stored?.subscriptionId ?? current?.sourceSubscriptionId ?? invoiceSubscriptionId(invoice ?? {});
    const resolvedPi = stored?.paymentIntentId ?? current?.sourcePaymentIntentId ?? paymentIntentId;
    const liveCharge = await stripe.charges.retrieve(chargeId, {}, READ_OPTIONS) as any;
    const chargeBound = stripeId(liveCharge) === chargeId && stripeId(liveCharge.customer) === order.stripeCustomerId
      && resolvedPi && (stripeId(liveCharge.payment_intent) === resolvedPi || (known && !stripeId(liveCharge.payment_intent)))
      && subscriptionId && (!order.stripeSubscriptionId || order.stripeSubscriptionId === subscriptionId);
    if (!chargeBound || !resolvedInvoiceId) {
      if (current) await tx.update(hiringTerms).set({ state: "suspended" }).where(eq(hiringTerms.id, current.id));
      return { result: await review(tx, event, order, resolvedInvoiceId ?? null) };
    }
    let subscription: any = { status: "unavailable" };
    let positiveEvidence = false;
    try {
      invoice ??= await stripe.invoices.retrieve(resolvedInvoiceId, INVOICE_EXPAND, READ_OPTIONS);
      subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product", "latest_invoice"] }, READ_OPTIONS);
      if (!invoice || invoice.id !== resolvedInvoiceId) throw new InvalidHiringPayment("Invoice binding unavailable");
      const { priceId } = validateHiringSubscription(subscription, { id: order.id, orgId: order.orgId,
        customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId }, { settledInvoice: true });
      validateHiringInvoice(invoice, subscription, priceId);
      const evidence = invoicePaymentEvidence(invoice);
      validateHiringCharge(invoice, liveCharge, evidence);
      positiveEvidence = evidence.chargeId === chargeId && evidence.paymentIntentId === resolvedPi;
    } catch (error) { if (!known && !(error instanceof InvalidHiringPayment)) throw error; }
    // New immutable settlement bindings and restoration require full paid evidence.
    // A known charge's adverse evidence does not depend on mutable invoice/subscription metadata.
    if (!known && !positiveEvidence) return { result: await review(tx, event, order, resolvedInvoiceId) };
    const disputes = await liveDisputes(chargeId, liveCharge);
    try {
      const state = await reconcileHiringPayment(tx, { order, invoiceId: resolvedInvoiceId, subscriptionId,
        paymentIntentId: resolvedPi, chargeId, charge: liveCharge, disputes: disputes.data ?? [], incomplete: !!disputes.has_more,
        allowDisputeRecovery: positiveEvidence && event.type === "charge.dispute.closed", currentTerm: current });
      if (current) {
        await tx.select().from(hiringTerms).where(eq(hiringTerms.id, current.id)).limit(1).for("update");
        await tx.update(hiringTerms).set({ paymentState: state,
          state: state === "active" && !positiveEvidence ? "suspended" : hiringTermState(state, subscription) }).where(eq(hiringTerms.id, current.id));
      }
      await tx.update(hiringOrders).set({ stripeSubscriptionId: order.stripeSubscriptionId ?? subscriptionId,
        ...(!order.paymentChargeId || order.paymentChargeId === chargeId ? { paymentState: state, paymentChargeId: chargeId } : {})
      }).where(eq(hiringOrders.id, order.id));
      const unresolved = state !== "active" || !positiveEvidence;
      await recordHiringEvent(tx, event, order, resolvedInvoiceId, unresolved || !current);
      if (!unresolved && current) await closeHiringInvoiceReviews(tx, order.id, resolvedInvoiceId);
      return { result: current ? { handled: true, ...(unresolved && state === "active" ? { reviewRequired: true } : {}) }
        : { handled: true, reviewRequired: true },
        reconcile: !unresolved && !current ? { invoiceId: resolvedInvoiceId, order } : null };
    } catch (error) {
      if (error instanceof InvalidHiringPayment) {
        if (current) await tx.update(hiringTerms).set({ state: "suspended" }).where(eq(hiringTerms.id, current.id));
        return { result: await review(tx, event, order, resolvedInvoiceId) };
      }
      throw error;
    }
  });
  if (result.reconcile) {
    const { invoiceId: resolvedInvoiceId, order } = result.reconcile;
    return dispatchHiringEvent({ id: `reconcile:${event.id}`, type: "invoice.paid", data: { object: { id: resolvedInvoiceId,
      metadata: { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: order.id, orgId: String(order.orgId) } } } });
  }
  return result.result;
}

export async function dispatchHiringEvent(event: any): Promise<Result> {
  const object = event.data.object as any;
  const reversal = ["charge.refunded", "charge.dispute.created", "charge.dispute.closed"].includes(event.type);
  const supported = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired",
    "checkout.session.async_payment_failed", "invoice.paid", "invoice.payment_succeeded", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type);
  if (!reversal && !supported) return { handled: false };
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (reversal) return dispatchReversal(db, event);
  let metadata = hiringMetadata(object);
  const subscriptionId = event.type.startsWith("customer.subscription.") ? stripeId(object)
    : event.type.startsWith("invoice.") ? invoiceSubscriptionId(object) : stripeId(object.subscription);
  let durable = await boundOrder(db, subscriptionId);
  if (!durable && event.type.startsWith("checkout.")) {
    [durable] = await db.select().from(hiringOrders).where(eq(hiringOrders.stripeCheckoutSessionId, object.id)).limit(1);
  }
  if (!durable && metadata.type !== HIRING_TYPE && event.type.startsWith("invoice.")) {
    const owned = await invoiceOwnership(db, await stripe.invoices.retrieve(object.id, INVOICE_EXPAND, READ_OPTIONS));
    if (owned.owned) metadata = { type: HIRING_TYPE, orderId: owned.orderId ?? "" };
  } else if (!durable && metadata.type !== HIRING_TYPE && subscriptionId && event.type !== "customer.subscription.deleted") {
    const live = await stripe.subscriptions.retrieve(subscriptionId, {}, READ_OPTIONS);
    metadata = hiringMetadata(live);
  }
  if (!durable && metadata.type !== HIRING_TYPE) return { handled: false };
  const orderId = durable?.id ?? metadata.orderId;
  if (!orderId) return { handled: true, reviewRequired: true };
  return db.transaction(async tx => {
    const [order] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
    if (!order) throw new Error("Hiring order is unavailable for reconciliation");
    if (!durable && (metadata.policy !== HIRING_POLICY || metadata.orgId !== String(order.orgId))) {
      // Authoritative invoice discovery can identify an untagged event, but never by itself grant access.
      if (!event.type.startsWith("invoice.")) return review(tx, event, order);
    }

    if (event.type.startsWith("checkout.session.")) {
      const terminal = ["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type);
      const session = terminal ? await stripe.checkout.sessions.retrieve(object.id, {}, READ_OPTIONS) as any : object;
      const sessionSubscriptionId = stripeId(session.subscription);
      if (session.id !== object.id || session.mode !== "subscription" || stripeId(session.customer) !== order.stripeCustomerId
        || (terminal && (hiringMetadata(session).orderId !== order.id || hiringMetadata(session).orgId !== String(order.orgId)
          || hiringMetadata(session).policy !== HIRING_POLICY))
        || (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id)
        || (order.stripeSubscriptionId && sessionSubscriptionId && order.stripeSubscriptionId !== sessionSubscriptionId)) return review(tx, event, order);
      if (sessionSubscriptionId) {
        const live = await stripe.subscriptions.retrieve(sessionSubscriptionId, {}, READ_OPTIONS) as any;
        if (!subscriptionOwned(live, order)) return review(tx, event, order);
      }
      const safelyExpired = terminal && session.status === "expired" && !sessionSubscriptionId && !order.stripeSubscriptionId;
      await tx.update(hiringOrders).set({ stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? session.id,
        stripeSubscriptionId: order.stripeSubscriptionId ?? sessionSubscriptionId,
        ...(safelyExpired && order.status === "pending" ? { status: "checkout_expired" } : {}) }).where(eq(hiringOrders.id, order.id));
      if (terminal && !safelyExpired) return review(tx, event, order);
      return { handled: true };
    }

    if (event.type.startsWith("invoice.")) {
      const invoice = await stripe.invoices.retrieve(object.id, INVOICE_EXPAND, READ_OPTIONS) as any;
      const invoiceSubId = invoiceSubscriptionId(invoice);
      if (!invoiceSubId) return review(tx, event, order, invoice.id);
      const subscription = await stripe.subscriptions.retrieve(invoiceSubId, { expand: ["items.data.price.product", "latest_invoice"] }, READ_OPTIONS) as any;
      try {
        if (!["pending", "active", "cancelled"].includes(order.status)) return review(tx, event, order, invoice.id);
        const { priceId } = validateHiringSubscription(subscription, { id: order.id, orgId: order.orgId,
          customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId }, { settledInvoice: true });
        const period = validateHiringInvoice(invoice, subscription, priceId);
        const evidence = invoicePaymentEvidence(invoice);
        const charge = evidence.chargeId ? await stripe.charges.retrieve(evidence.chargeId, { expand: ["payment_intent"] }, READ_OPTIONS) as any : null;
        validateHiringCharge(invoice, charge, evidence);
        const [samePeriod] = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.sourceSubscriptionId, subscription.id),
          eq(hiringTerms.startsAtMs, period.startsAtMs), eq(hiringTerms.endsAtMs, period.endsAtMs))).limit(1);
        if (samePeriod && samePeriod.sourceInvoiceId !== invoice.id) return review(tx, event, order, invoice.id);
        const [existing] = await tx.select().from(hiringTerms).where(eq(hiringTerms.sourceInvoiceId, invoice.id)).limit(1);
        const disputes = await liveDisputes(evidence.chargeId!, charge);
        const paymentState = await reconcileHiringPayment(tx, { order, invoiceId: invoice.id, subscriptionId: invoiceSubId,
          paymentIntentId: evidence.paymentIntentId!, chargeId: evidence.chargeId!, charge, disputes: disputes.data ?? [],
          incomplete: !!disputes.has_more, allowDisputeRecovery: false, currentTerm: existing });
        if (existing) {
          await tx.select().from(hiringTerms).where(eq(hiringTerms.id, existing.id)).limit(1).for("update");
          await tx.update(hiringTerms).set({ paymentState, state: hiringTermState(paymentState, subscription) }).where(eq(hiringTerms.id, existing.id));
        } else if (paymentState === "active") {
          await tx.insert(hiringTerms).values({ id: randomUUID(), orgId: order.orgId, basis: "stripe", sourceInvoiceId: invoice.id,
            sourceSubscriptionId: subscription.id, sourcePaymentIntentId: evidence.paymentIntentId, sourceChargeId: evidence.chargeId,
            startsAtMs: period.startsAtMs, endsAtMs: period.endsAtMs, quota: HIRING_QUOTA, used: 0,
            state: hiringTermState(paymentState, subscription), paymentState, createdByEmail: order.ownerEmail });
        }
        const [pointerTerm] = !existing && order.paymentChargeId && order.paymentChargeId !== evidence.chargeId
          ? await tx.select().from(hiringTerms).where(eq(hiringTerms.sourceChargeId, order.paymentChargeId)).limit(1) : [];
        const advancePointer = !order.paymentChargeId || order.paymentChargeId === evidence.chargeId
          || (!existing && pointerTerm && period.startsAtMs > pointerTerm.startsAtMs);
        await tx.update(hiringOrders).set({ status: ["canceled", "incomplete_expired"].includes(subscription.status) ? "cancelled"
          : paymentState === "active" || existing ? "active" : order.status,
          stripeSubscriptionId: order.stripeSubscriptionId ?? subscription.id,
          ...(advancePointer ? { paymentState, paymentChargeId: evidence.chargeId } : {}),
          renewalCancelled: ["canceled", "incomplete_expired"].includes(subscription.status) || !!subscription.cancel_at_period_end
        }).where(eq(hiringOrders.id, order.id));
        await recordHiringEvent(tx, event, order, invoice.id, paymentState !== "active");
        if (paymentState === "active") await closeHiringInvoiceReviews(tx, order.id, invoice.id);
        return paymentState === "active" ? { handled: true } : { handled: true, reviewRequired: true };
      } catch (error) {
        if (error instanceof InvalidHiringPayment) {
          // A positive-policy failure must not leave a previously fulfilled invoice usable.
          // Reconcile its exact stored charge independently; never restore without full invoice evidence.
          const [known] = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.sourceInvoiceId, invoice.id),
            eq(hiringTerms.orgId, order.orgId), eq(hiringTerms.sourceSubscriptionId, order.stripeSubscriptionId ?? invoiceSubId))).limit(1);
          if (known?.sourceChargeId && known.sourcePaymentIntentId) {
            const charge = await stripe.charges.retrieve(known.sourceChargeId, {}, READ_OPTIONS) as any;
            if (stripeId(charge) === known.sourceChargeId && stripeId(charge.customer) === order.stripeCustomerId
              && stripeId(charge.payment_intent) === known.sourcePaymentIntentId) {
              const disputes = await liveDisputes(known.sourceChargeId, charge);
              const paymentState = await reconcileHiringPayment(tx, { order, invoiceId: invoice.id, subscriptionId: known.sourceSubscriptionId!,
                paymentIntentId: known.sourcePaymentIntentId, chargeId: known.sourceChargeId, charge,
                disputes: disputes.data ?? [], incomplete: !!disputes.has_more, allowDisputeRecovery: false, currentTerm: known });
              await tx.select().from(hiringTerms).where(eq(hiringTerms.id, known.id)).limit(1).for("update");
              await tx.update(hiringTerms).set({ state: "suspended", paymentState }).where(eq(hiringTerms.id, known.id));
            } else await tx.update(hiringTerms).set({ state: "suspended" }).where(eq(hiringTerms.id, known.id));
          }
          return review(tx, event, order, invoice.id);
        }
        throw error;
      }
    }

    if (event.type.startsWith("customer.subscription.")) {
      const live = event.type === "customer.subscription.deleted" ? object : await stripe.subscriptions.retrieve(object.id, {}, READ_OPTIONS) as any;
      const durableBinding = order.stripeSubscriptionId === live.id && stripeId(live.customer) === order.stripeCustomerId;
      const strictlyOwned = subscriptionOwned(live, order);
      if (live.id !== object.id || (!durableBinding && !strictlyOwned)) return review(tx, event, order);
      const terminated = event.type === "customer.subscription.deleted" || ["canceled", "incomplete_expired"].includes(live.status);
      const effective = terminated ? { ...live, status: "canceled" } : live;
      await tx.update(hiringOrders).set({ stripeSubscriptionId: order.stripeSubscriptionId ?? live.id,
        renewalCancelled: terminated || !!live.cancel_at_period_end, ...(terminated ? { status: "cancelled" } : {}) }).where(eq(hiringOrders.id, order.id));
      const terms = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.sourceSubscriptionId, live.id),
        eq(hiringTerms.orgId, order.orgId))).orderBy(hiringTerms.id).for("update");
      for (const term of terms) {
        if (term.paymentState !== "active" || !["active", "cancel_at_period_end", "subscription_suspended"].includes(term.state)) continue;
        await tx.update(hiringTerms).set({ state: strictlyOwned || terminated ? hiringTermState(term.paymentState, effective)
          : "subscription_suspended" }).where(eq(hiringTerms.id, term.id));
      }
      await recordHiringEvent(tx, event, order, null, !strictlyOwned && !terminated);
    }
    return { handled: true };
  });
}
