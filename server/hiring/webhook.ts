import { randomUUID } from "node:crypto";
import { stripe } from "../stripe/stripe";
import { hiringOrders, hiringPayments, hiringTerms, type HiringOrder } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { HIRING_POLICY, HIRING_QUOTA, HIRING_TYPE, InvalidHiringPayment, hiringMetadata, invoicePaymentEvidence,
  invoiceSubscriptionId, stripeId, validateHiringCharge, validateHiringInvoice, validateHiringSubscription } from "./policy";
import { closeHiringInvoiceReviews, hiringTermState, reconcileHiringPayment, recordHiringEvent } from "./paymentLedger";

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

/** Classify all allocations before claiming a metadata-free reversal. Unknown or
 * incomplete ownership is retryable, never a successful Hiring acknowledgement. */
async function discoverReversalInvoice(paymentIntentId: string): Promise<any | null> {
  let cursor: string | undefined;
  const found = new Map<string, any>();
  for (let page = 0; page < 10; page++) {
    const payments = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: paymentIntentId },
      limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
    for (const allocation of payments.data) {
      const id = stripeId(allocation.invoice);
      if (!id) throw new Error("Reversal allocation omits invoice ownership; retry classification");
      if (found.has(id)) continue;
      found.set(id, await stripe.invoices.retrieve(id, { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] }));
    }
    if (!payments.has_more) {
      const owned = [...found.values()].filter(invoice => hiringMetadata(invoice).type === HIRING_TYPE);
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
  const charge = await stripe.charges.retrieve(chargeId) as any;
  const paymentIntentId = stripeId(charge.payment_intent) ?? discoveredTerm?.sourcePaymentIntentId ?? discoveredPayment?.paymentIntentId;
  const invoiceId = discoveredTerm?.sourceInvoiceId ?? discoveredPayment?.invoiceId;
  const invoice = invoiceId ? await stripe.invoices.retrieve(invoiceId, { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] }) as any
    : paymentIntentId ? await discoverReversalInvoice(paymentIntentId) : null;
  const metadata = hiringMetadata(invoice);
  const orderId = discoveredPayment?.orderId ?? metadata.orderId;
  if (!discoveredTerm && !discoveredPayment && metadata.type !== HIRING_TYPE) {
    if (isHiringEvent(event)) throw new Error("Tagged Hiring reversal has no authoritative invoice ownership");
    return { handled: false };
  }
  // A fulfilled term may belong to an older invoice whose metadata is absent.
  // Its unique subscription binding is still authoritative for order discovery.
  const result = await db.transaction(async (tx: any) => {
    const [order]: HiringOrder[] = await tx.select().from(hiringOrders).where(orderId
      ? eq(hiringOrders.id, orderId)
      : and(eq(hiringOrders.orgId, discoveredTerm.orgId), eq(hiringOrders.stripeSubscriptionId, discoveredTerm.sourceSubscriptionId))).limit(1).for("update");
    if (!order) throw new Error("Hiring reversal order is unavailable for reconciliation");
    if (!invoice || !paymentIntentId || stripeId(invoice.customer) !== order.stripeCustomerId) return { result: await review(tx, event, order, invoiceId) };
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId || (order.stripeSubscriptionId && order.stripeSubscriptionId !== subscriptionId)) return { result: await review(tx, event, order, invoice.id) };
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    if (!subscriptionOwned(subscription, order)) return { result: await review(tx, event, order, invoice.id) };
    // Reread after waiting on the order. Every lifecycle writer uses order first.
    const [current] = await tx.select().from(hiringTerms).where(eq(hiringTerms.sourceChargeId, chargeId)).limit(1);
    const liveCharge = await stripe.charges.retrieve(chargeId) as any;
    const evidence = invoicePaymentEvidence(invoice);
    if (stripeId(liveCharge) !== chargeId || stripeId(liveCharge.customer) !== order.stripeCustomerId
      || (stripeId(liveCharge.payment_intent) && stripeId(liveCharge.payment_intent) !== paymentIntentId)
      || (!current && stripeId(liveCharge.payment_intent) !== paymentIntentId)
      || evidence.chargeId !== chargeId || evidence.paymentIntentId !== paymentIntentId) return { result: await review(tx, event, order, invoice.id) };
    const disputes = await stripe.disputes.list({ charge: chargeId, limit: 100 });
    try {
      const state = await reconcileHiringPayment(tx, { order, invoiceId: invoice.id, subscriptionId, paymentIntentId, chargeId,
        charge: liveCharge, disputes: disputes.data ?? [], incomplete: !!disputes.has_more,
        allowDisputeRecovery: event.type === "charge.dispute.closed", currentTerm: current });
      if (current) {
        await tx.select().from(hiringTerms).where(eq(hiringTerms.id, current.id)).limit(1).for("update");
        await tx.update(hiringTerms).set({ paymentState: state, state: hiringTermState(state, subscription) }).where(eq(hiringTerms.id, current.id));
      }
      await tx.update(hiringOrders).set({ stripeSubscriptionId: order.stripeSubscriptionId ?? subscriptionId,
        ...(!order.paymentChargeId || order.paymentChargeId === chargeId ? { paymentState: state, paymentChargeId: chargeId } : {})
      }).where(eq(hiringOrders.id, order.id));
      await recordHiringEvent(tx, event, order, invoice.id, state !== "active" || !current);
      if (state === "active" && current) await closeHiringInvoiceReviews(tx, order.id, invoice.id);
      return { result: current ? { handled: true } : { handled: true, reviewRequired: true },
        reconcile: state === "active" && !current ? { invoiceId: invoice.id, order } : null };
    } catch (error) {
      if (error instanceof InvalidHiringPayment) return { result: await review(tx, event, order, invoice.id) };
      throw error;
    }
  });
  if (result.reconcile) {
    // Commit the verified resolution first, then use the same strict invoice
    // reconciler. A remote failure throws for Stripe retry; no extra paid event
    // or manual replay is needed and invoice/period uniqueness remains binding.
    const { invoiceId: resolvedInvoiceId, order } = result.reconcile;
    return dispatchHiringEvent({ id: `reconcile:${event.id}`, type: "invoice.paid", data: { object: { id: resolvedInvoiceId,
      metadata: { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: order.id, orgId: String(order.orgId) } } } });
  }
  return result.result;
}

export async function dispatchHiringEvent(event: any): Promise<Result> {
  const object = event.data.object as any;
  const reversal = ["charge.refunded", "charge.dispute.created", "charge.dispute.closed"].includes(event.type);
  if (!reversal && !isHiringEvent(event)) return { handled: false };
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (reversal) return dispatchReversal(db, event);
  const metadata = hiringMetadata(object);
  if (metadata.policy !== HIRING_POLICY || typeof metadata.orderId !== "string") return { handled: true, reviewRequired: true };
  const orderId = metadata.orderId;
  return db.transaction(async tx => {
    const [order] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
    if (!order) throw new Error("Hiring order is unavailable for reconciliation");
    if (metadata.orgId !== String(order.orgId)) return review(tx, event, order);

    if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
      const terminal = ["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type);
      const session = terminal ? await stripe.checkout.sessions.retrieve(object.id) as any : object;
      const subscriptionId = stripeId(session.subscription);
      if (session.id !== object.id || session.mode !== "subscription" || stripeId(session.customer) !== order.stripeCustomerId
        || (terminal && (hiringMetadata(session).orderId !== order.id || hiringMetadata(session).orgId !== String(order.orgId)
          || hiringMetadata(session).policy !== HIRING_POLICY))
        || (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id)
        || (order.stripeSubscriptionId && subscriptionId && order.stripeSubscriptionId !== subscriptionId)) return review(tx, event, order);
      if (subscriptionId) {
        const live = await stripe.subscriptions.retrieve(subscriptionId) as any;
        if (!subscriptionOwned(live, order)) return review(tx, event, order);
      }
      const safelyExpired = terminal && session.status === "expired" && !subscriptionId && !order.stripeSubscriptionId;
      await tx.update(hiringOrders).set({ stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? session.id,
        stripeSubscriptionId: order.stripeSubscriptionId ?? subscriptionId,
        ...(safelyExpired && order.status === "pending" ? { status: "checkout_expired" } : {}) }).where(eq(hiringOrders.id, order.id));
      // A failed async payment does not prove that a bound subscription can no
      // longer collect. Keep the order reserved and owner cancellation available.
      if (terminal && !safelyExpired) return review(tx, event, order);
      return { handled: true };
    }

    if (["invoice.paid", "invoice.payment_succeeded"].includes(event.type)) {
      const invoice = await stripe.invoices.retrieve(object.id, { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] }) as any;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (!subscriptionId) return review(tx, event, order, invoice.id);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product", "latest_invoice"] }) as any;
      try {
        if (!["pending", "active", "cancelled"].includes(order.status)) return review(tx, event, order, invoice.id);
        const { priceId } = validateHiringSubscription(subscription, { id: order.id, orgId: order.orgId,
          customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId }, { settledInvoice: true });
        const period = validateHiringInvoice(invoice, subscription, priceId);
        const evidence = invoicePaymentEvidence(invoice);
        const charge = evidence.chargeId ? await stripe.charges.retrieve(evidence.chargeId, { expand: ["payment_intent"] }) as any : null;
        validateHiringCharge(invoice, charge, evidence);
        const [samePeriod] = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.sourceSubscriptionId, subscription.id),
          eq(hiringTerms.startsAtMs, period.startsAtMs), eq(hiringTerms.endsAtMs, period.endsAtMs))).limit(1);
        if (samePeriod && samePeriod.sourceInvoiceId !== invoice.id) return review(tx, event, order, invoice.id);
        const [existing] = await tx.select().from(hiringTerms).where(eq(hiringTerms.sourceInvoiceId, invoice.id)).limit(1);
        const disputes = await stripe.disputes.list({ charge: evidence.chargeId!, limit: 100 });
        const paymentState = await reconcileHiringPayment(tx, { order, invoiceId: invoice.id, subscriptionId,
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
        await tx.update(hiringOrders).set({ status: ["canceled", "incomplete_expired"].includes(subscription.status) ? "cancelled" : "active",
          stripeSubscriptionId: order.stripeSubscriptionId ?? subscription.id,
          ...(!existing || !order.paymentChargeId || order.paymentChargeId === evidence.chargeId
            ? { paymentState, paymentChargeId: evidence.chargeId } : {}),
          renewalCancelled: ["canceled", "incomplete_expired"].includes(subscription.status) || !!subscription.cancel_at_period_end
        }).where(eq(hiringOrders.id, order.id));
        await recordHiringEvent(tx, event, order, invoice.id, paymentState !== "active");
        if (paymentState === "active") await closeHiringInvoiceReviews(tx, order.id, invoice.id);
        return paymentState === "active" ? { handled: true } : { handled: true, reviewRequired: true };
      } catch (error) {
        if (error instanceof InvalidHiringPayment) return review(tx, event, order, invoice.id);
        throw error;
      }
    }

    if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const live = event.type === "customer.subscription.deleted" ? object : await stripe.subscriptions.retrieve(object.id) as any;
      if (!subscriptionOwned(live, order) || live.id !== object.id) return review(tx, event, order);
      const terminated = event.type === "customer.subscription.deleted" || ["canceled", "incomplete_expired"].includes(live.status);
      const effective = terminated ? { ...live, status: "canceled" } : live;
      await tx.update(hiringOrders).set({ stripeSubscriptionId: order.stripeSubscriptionId ?? live.id,
        renewalCancelled: terminated || !!live.cancel_at_period_end, ...(terminated ? { status: "cancelled" } : {}) }).where(eq(hiringOrders.id, order.id));
      // Subscription holds affect every present/future term, not just the last
      // one. They never manufacture a terminal payment/refund/manual-review hold.
      const terms = await tx.select().from(hiringTerms).where(and(eq(hiringTerms.sourceSubscriptionId, live.id),
        eq(hiringTerms.orgId, order.orgId))).orderBy(hiringTerms.id).for("update");
      for (const term of terms) {
        if (term.paymentState !== "active" || !["active", "cancel_at_period_end", "subscription_suspended"].includes(term.state)) continue;
        await tx.update(hiringTerms).set({ state: hiringTermState(term.paymentState, effective) }).where(eq(hiringTerms.id, term.id));
      }
      await recordHiringEvent(tx, event, order, null, false);
    }
    return { handled: true };
  });
}
