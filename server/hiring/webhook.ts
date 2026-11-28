import { randomUUID } from "node:crypto";
import { stripe } from "../stripe/stripe";
import { hiringEvents, hiringOrders, hiringTerms } from "../../drizzle/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "../db";
import { HIRING_POLICY, HIRING_QUOTA, HIRING_TYPE, InvalidHiringPayment, hiringMetadata, hiringPaymentState, invoicePaymentEvidence, invoiceSubscriptionId, stripeId, validateHiringCharge, validateHiringInvoice, validateHiringSubscription } from "./policy";

/** Returns true only for events explicitly owned by Hiring. Legacy handlers must
 * never see these events, even when the payload is malformed or unpaid. */
export function isHiringEvent(event: any): boolean {
  const object = event?.data?.object;
  return hiringMetadata(object).type === HIRING_TYPE;
}
export async function dispatchHiringEvent(event: any): Promise<{ handled: boolean; reviewRequired?: boolean }> {
  const object = event.data.object as any;
  let metadata = hiringMetadata(object);
  const reversalEvent = ["charge.refunded", "charge.dispute.created", "charge.dispute.closed"].includes(event.type);
  if (!reversalEvent && !isHiringEvent(event)) return { handled: false };
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  let reversalTerm: any = null;
  if (reversalEvent) {
    const chargeId = event.type.startsWith("charge.dispute") ? object.charge : object.id;
    const paymentIntentIdFromEvent = typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id;
    const charge = paymentIntentIdFromEvent || typeof chargeId !== "string" ? null : await stripe.charges.retrieve(chargeId) as any;
    const paymentIntentId = paymentIntentIdFromEvent ?? (typeof charge?.payment_intent === "string" ? charge.payment_intent : charge?.payment_intent?.id);
    if (paymentIntentId || typeof chargeId === "string") {
      const [term] = await db.select().from(hiringTerms).where(or(
        paymentIntentId ? eq(hiringTerms.sourcePaymentIntentId, paymentIntentId) : undefined,
        typeof chargeId === "string" ? eq(hiringTerms.sourceChargeId, chargeId) : undefined,
      )).limit(1);
      reversalTerm = term ?? null;
    }
    let reversalInvoice: any = null;
    if (!reversalTerm && paymentIntentId) {
      // Subscription metadata is not copied to a charge/dispute. InvoicePayments
      // provides the authoritative PI->invoice link even before the term exists.
      const payments = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: paymentIntentId }, limit: 100 });
      if (payments.has_more || payments.data.length > 1) return { handled: true, reviewRequired: true };
      const invoiceId = stripeId(payments.data[0]?.invoice);
      if (invoiceId) {
        reversalInvoice = await stripe.invoices.retrieve(invoiceId) as any;
        const invoiceMetadata = hiringMetadata(reversalInvoice);
        if (invoiceMetadata.type === HIRING_TYPE) metadata = invoiceMetadata;
      }
    }
    if (!reversalTerm && metadata.type !== HIRING_TYPE) return { handled: false };
    if (!reversalTerm) {
      const pendingOrderId = metadata.orderId;
      if (typeof pendingOrderId !== "string" || typeof chargeId !== "string") return { handled: true, reviewRequired: true };
      return db.transaction(async tx => {
        const [order] = await tx.select().from(hiringOrders)
          .where(eq(hiringOrders.id, pendingOrderId)).limit(1).for("update");
        if (!order) return { handled: true, reviewRequired: true };
        if (!reversalInvoice || stripeId(reversalInvoice.customer) !== order.stripeCustomerId) return { handled: true, reviewRequired: true };
        const subscriptionId = invoiceSubscriptionId(reversalInvoice);
        if (!subscriptionId || (order.stripeSubscriptionId && order.stripeSubscriptionId !== subscriptionId)) return { handled: true, reviewRequired: true };
        const boundSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
        if (boundSubscription.metadata?.orderId !== order.id || boundSubscription.metadata?.orgId !== String(order.orgId)
          || boundSubscription.metadata?.type !== HIRING_TYPE || stripeId(boundSubscription.customer) !== order.stripeCustomerId) return { handled: true, reviewRequired: true };
        const liveCharge = await stripe.charges.retrieve(chargeId) as any;
        if (stripeId(liveCharge.customer) !== order.stripeCustomerId || stripeId(liveCharge.payment_intent) !== paymentIntentId) return { handled: true, reviewRequired: true };
        const disputes = await stripe.disputes.list({ charge: chargeId, limit: 100 });
        const state = disputes.has_more ? "needs_review" : hiringPaymentState(liveCharge, disputes.data ?? []);
        // A paid invoice may have committed after our unlocked discovery read.
        const [current] = await tx.select().from(hiringTerms)
          .where(and(or(paymentIntentId ? eq(hiringTerms.sourcePaymentIntentId, paymentIntentId) : undefined,
            eq(hiringTerms.sourceChargeId, chargeId)), eq(hiringTerms.orgId, order.orgId))).limit(1).for("update");
        const terminalState = current?.paymentState ?? (order.paymentChargeId === chargeId ? order.paymentState : "active");
        const effectivePaymentState = ["refunded", "dispute_lost", "needs_review"].includes(terminalState) ? terminalState : state;
        if (current) {
          const subscription = current.sourceSubscriptionId
            ? await stripe.subscriptions.retrieve(current.sourceSubscriptionId) as any : null;
          const subscriptionActive = subscription && ["active", "past_due"].includes(subscription.status);
          await tx.update(hiringTerms).set({ paymentState: effectivePaymentState,
            state: effectivePaymentState === "active" && subscriptionActive && current.paymentState !== "needs_review"
              ? (subscription.cancel_at_period_end ? "cancel_at_period_end" : "active")
              : (effectivePaymentState === "active" ? current.state : "suspended"),
          }).where(eq(hiringTerms.id, current.id));
        }
        // Preserve pending status so a genuine won dispute can be fulfilled by
        // the same invoice, never by a second checkout/idempotency key.
        await tx.update(hiringOrders).set({ paymentState: effectivePaymentState, paymentChargeId: chargeId }).where(eq(hiringOrders.id, order.id));
        return { handled: true, reviewRequired: !current };
      });
    }
    if (reversalTerm) {
      const chargeId = event.type.startsWith("charge.dispute") ? object.charge : object.id;
      if (typeof chargeId !== "string") return { handled: true, reviewRequired: true };
      return db.transaction(async tx => {
        const [order] = await tx.select().from(hiringOrders).where(and(eq(hiringOrders.orgId, reversalTerm.orgId), eq(hiringOrders.stripeSubscriptionId, reversalTerm.sourceSubscriptionId!))).limit(1).for("update");
        if (!order) return { handled: true, reviewRequired: true };
        const charge = await stripe.charges.retrieve(chargeId) as any;
        if (stripeId(charge) !== reversalTerm.sourceChargeId || stripeId(charge.customer) !== order.stripeCustomerId
          || (stripeId(charge.payment_intent) && stripeId(charge.payment_intent) !== reversalTerm.sourcePaymentIntentId)) return { handled: true, reviewRequired: true };
        const disputes = await stripe.disputes.list({ charge: chargeId, limit: 100 });
        const state = disputes.has_more ? "needs_review" : hiringPaymentState(charge, disputes.data ?? []);
        const subscription = reversalTerm.sourceSubscriptionId
          ? await stripe.subscriptions.retrieve(reversalTerm.sourceSubscriptionId) as any
          : null;
        const subscriptionActive = subscription && ["active", "past_due"].includes(subscription.status);
        const [current] = await tx.select().from(hiringTerms).where(eq(hiringTerms.id, reversalTerm.id)).limit(1).for("update");
        if (!current) return { handled: true, reviewRequired: true };
        const terminalBlock = ["refunded", "dispute_lost", "needs_review"].includes(current.paymentState);
        const effectivePaymentState = terminalBlock ? current.paymentState : state;
        await tx.update(hiringTerms).set({
          paymentState: effectivePaymentState,
          state: effectivePaymentState === "active" && subscriptionActive && current.paymentState !== "needs_review"
            ? (subscription.cancel_at_period_end ? "cancel_at_period_end" : "active")
            : (effectivePaymentState === "active" ? current.state : "suspended"),
        }).where(eq(hiringTerms.id, current.id));
        await tx.update(hiringOrders).set({ paymentState: effectivePaymentState, paymentChargeId: chargeId }).where(eq(hiringOrders.id, order.id));
        return { handled: true };
      });
    }
  } else if (!isHiringEvent(event)) return { handled: false };
  if (metadata.policy !== HIRING_POLICY) {
    return { handled: true, reviewRequired: true };
  }
  const orderId = metadata.orderId;
  if (typeof orderId !== "string") return { handled: true, reviewRequired: true };
  const rows = await db.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1);
  if (!rows[0]) return { handled: true, reviewRequired: true };
  if (!["pending", "active"].includes(rows[0].status)) return { handled: true, reviewRequired: true };
  // Checkout completion only records the pending Stripe binding. It never
  // grants a term; paid invoice evidence is mandatory for fulfilment.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (object.payment_status !== "paid" && event.type !== "checkout.session.async_payment_succeeded") return { handled: true };
    return db.transaction(async tx => {
      const [order] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
      const subscriptionId = stripeId(object.subscription);
      if (!order || object.mode !== "subscription" || stripeId(object.customer) !== order.stripeCustomerId
        || (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== object.id)
        || (order.stripeSubscriptionId && subscriptionId && order.stripeSubscriptionId !== subscriptionId)) return { handled: true, reviewRequired: true };
      if (order.status === "pending") await tx.update(hiringOrders).set({
        stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? object.id,
        stripeSubscriptionId: order.stripeSubscriptionId ?? subscriptionId,
      }).where(eq(hiringOrders.id, orderId));
      return { handled: true };
    });
  }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    await db.update(hiringOrders).set({ status: event.type === "checkout.session.expired" ? "checkout_expired" : "checkout_failed" })
      .where(and(eq(hiringOrders.id, orderId), eq(hiringOrders.status, "pending"), eq(hiringOrders.stripeCheckoutSessionId, object.id)));
    return { handled: true };
  }
  // Paid invoice fulfilment is intentionally a narrow hook. The implementation
  // must retrieve the subscription/product/invoice/charge live before creating
  // one unique hiring_terms row; no event metadata or active-sub status alone
  // can create quota.
  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    return db.transaction(async tx => {
    const [lockedOrder] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
    if (!lockedOrder || !["pending", "active"].includes(lockedOrder.status)) return { handled: true, reviewRequired: true };
    const invoice = await stripe.invoices.retrieve(object.id, { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] }) as any;
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return { handled: true, reviewRequired: true };
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product", "latest_invoice"] }) as any;
    const order = lockedOrder;
    try {
      const { priceId } = validateHiringSubscription(subscription, {
        id: order.id, orgId: order.orgId, customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId,
      });
      const period = validateHiringInvoice(invoice, subscription, priceId);
      const evidence = invoicePaymentEvidence(invoice);
      const paymentIntentId = evidence.paymentIntentId;
      const chargeId = evidence.chargeId;
      if (lockedOrder.paymentChargeId === chargeId && lockedOrder.paymentState !== "active") return { handled: true, reviewRequired: true };
      const charge = chargeId ? await stripe.charges.retrieve(chargeId, { expand: ["payment_intent"] }) as any : null;
      validateHiringCharge(invoice, charge, evidence);
      const disputes = await stripe.disputes.list({ charge: chargeId!, limit: 100 });
      const paymentState = disputes?.has_more ? "needs_review" : hiringPaymentState(charge, disputes?.data ?? []);
      if (paymentState !== "active") return { handled: true, reviewRequired: true };
      const [samePeriod] = await tx.select().from(hiringTerms).where(and(
        eq(hiringTerms.sourceSubscriptionId, subscription.id), eq(hiringTerms.startsAtMs, period.startsAtMs),
        eq(hiringTerms.endsAtMs, period.endsAtMs),
      )).limit(1).for("update");
      if (samePeriod && samePeriod.sourceInvoiceId !== invoice.id) return { handled: true, reviewRequired: true };
      const [claim] = await tx.select({ id: hiringEvents.id }).from(hiringEvents).where(eq(hiringEvents.id, event.id)).limit(1).for("update");
        const [existingTerm] = await tx.select({ id: hiringTerms.id }).from(hiringTerms).where(eq(hiringTerms.sourceInvoiceId, invoice.id)).limit(1).for("update");
        if (!claim) {
          await tx.insert(hiringEvents).values({ id: event.id, orgId: order.orgId, orderId: order.id, invoiceId: invoice.id, eventType: event.type, createdAtMs: Date.now() });
          if (!existingTerm) {
            await tx.insert(hiringTerms).values({ id: randomUUID(), orgId: order.orgId, basis: "stripe", sourceInvoiceId: invoice.id, sourceSubscriptionId: subscription.id, sourcePaymentIntentId: paymentIntentId, sourceChargeId: chargeId, startsAtMs: period.startsAtMs, endsAtMs: period.endsAtMs, quota: HIRING_QUOTA, used: 0, state: subscription.cancel_at_period_end ? "cancel_at_period_end" : "active", paymentState: "active", createdByEmail: order.ownerEmail });
            await tx.update(hiringOrders).set({ status: "active", stripeSubscriptionId: subscription.id,
              paymentState: "active", paymentChargeId: chargeId, renewalCancelled: !!subscription.cancel_at_period_end }).where(eq(hiringOrders.id, order.id));
          }
        }
      return { handled: true };
    } catch (error) {
      if (error instanceof InvalidHiringPayment) return { handled: true, reviewRequired: true };
      throw error;
    }
    });
  }
  if (event.type === "charge.refunded" || event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
    return { handled: true };
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await db.transaction(async tx => {
      // All Hiring lifecycle writers serialize on the exact order first.
      const [order] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1).for("update");
      if (!order || (order.stripeSubscriptionId && order.stripeSubscriptionId !== object.id)) return;
      const liveSubscription = event.type === "customer.subscription.deleted"
        ? object
        : await stripe.subscriptions.retrieve(object.id) as any;
      if (liveSubscription.metadata?.type !== HIRING_TYPE || liveSubscription.metadata?.orderId !== order.id
        || liveSubscription.metadata?.orgId !== String(order.orgId) || stripeId(liveSubscription.customer) !== order.stripeCustomerId) return;
      const terminated = event.type === "customer.subscription.deleted" || ["canceled", "incomplete_expired"].includes(liveSubscription.status);
      await tx.update(hiringOrders).set({ renewalCancelled: terminated || !!liveSubscription.cancel_at_period_end,
        stripeSubscriptionId: order.stripeSubscriptionId ?? object.id,
        ...(terminated ? { status: "cancelled" } : {}) }).where(eq(hiringOrders.id, order.id));
      const [term] = await tx.select().from(hiringTerms).where(and(
        eq(hiringTerms.sourceSubscriptionId, object.id),
        eq(hiringTerms.orgId, order.orgId),
        eq(hiringTerms.paymentState, "active"),
        inArray(hiringTerms.state, ["active", "cancel_at_period_end"]),
      )).orderBy(desc(hiringTerms.endsAtMs)).limit(1).for("update");
      if (!term) return;
      if (terminated || liveSubscription.status === "unpaid") {
        await tx.update(hiringTerms).set({ state: "suspended", paymentState: "needs_review" }).where(eq(hiringTerms.id, term.id));
      } else {
        await tx.update(hiringTerms).set({ state: liveSubscription.cancel_at_period_end ? "cancel_at_period_end" : "active" }).where(eq(hiringTerms.id, term.id));
      }
    });
  }
  return { handled: true };
}
