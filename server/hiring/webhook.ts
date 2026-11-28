import { randomUUID } from "node:crypto";
import { stripe } from "../stripe/stripe";
import { hiringEvents, hiringOrders, hiringTerms } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { HIRING_POLICY, HIRING_QUOTA, HIRING_TYPE, InvalidHiringPayment, hiringPaymentState, invoiceSubscriptionId, validateHiringInvoice, validateHiringSubscription } from "./policy";

/** Returns true only for events explicitly owned by Hiring. Legacy handlers must
 * never see these events, even when the payload is malformed or unpaid. */
export function isHiringEvent(event: any): boolean {
  const object = event?.data?.object;
  return object?.metadata?.type === HIRING_TYPE || object?.metadata?.hiring_type === HIRING_TYPE
    || object?.subscription_details?.metadata?.type === HIRING_TYPE;
}
export async function dispatchHiringEvent(event: any): Promise<{ handled: boolean; reviewRequired?: boolean }> {
  if (!isHiringEvent(event)) return { handled: false };
  const object = event.data.object as any;
  if (object.metadata?.policy !== HIRING_POLICY && object.subscription_details?.metadata?.policy !== HIRING_POLICY) {
    return { handled: true, reviewRequired: true };
  }
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const orderId = object.metadata?.orderId ?? object.subscription_details?.metadata?.orderId;
  if (typeof orderId !== "string") return { handled: true, reviewRequired: true };
  const rows = await db.select().from(hiringOrders).where(eq(hiringOrders.id, orderId)).limit(1);
  if (!rows[0]) return { handled: true, reviewRequired: true };
  // Checkout completion only records the pending Stripe binding. It never
  // grants a term; paid invoice evidence is mandatory for fulfilment.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (object.payment_status !== "paid" && event.type !== "checkout.session.async_payment_succeeded") return { handled: true };
    await db.update(hiringOrders).set({ stripeCheckoutSessionId: object.id, stripeSubscriptionId: typeof object.subscription === "string" ? object.subscription : null }).where(and(eq(hiringOrders.id, orderId), eq(hiringOrders.status, "pending")));
    return { handled: true };
  }
  // Paid invoice fulfilment is intentionally a narrow hook. The implementation
  // must retrieve the subscription/product/invoice/charge live before creating
  // one unique hiring_terms row; no event metadata or active-sub status alone
  // can create quota.
  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    const invoice = await stripe.invoices.retrieve(object.id, { expand: ["lines.data.price.product", "payments", "subscription"] }) as any;
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return { handled: true, reviewRequired: true };
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product", "latest_invoice"] }) as any;
    const order = rows[0];
    try {
      const { priceId } = validateHiringSubscription(subscription, {
        id: order.id, orgId: order.orgId, customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId,
      });
      const period = validateHiringInvoice(invoice, subscription, priceId);
      const paymentIntentId = typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id ?? null;
      const chargeId = typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id ?? null;
      const charge = chargeId ? await stripe.charges.retrieve(chargeId, { expand: ["payment_intent"] }) as any : null;
      const disputes = charge?.disputed ? await stripe.disputes.list({ charge: chargeId!, limit: 100 }) : null;
      const paymentState = charge ? hiringPaymentState(charge, disputes?.data ?? []) : "active";
      if (paymentState !== "active") return { handled: true, reviewRequired: true };
      await db.transaction(async tx => {
        const [claim] = await tx.select({ id: hiringEvents.id }).from(hiringEvents).where(eq(hiringEvents.id, event.id)).limit(1).for("update");
        if (!claim) {
          await tx.insert(hiringEvents).values({ id: event.id, orgId: order.orgId, orderId: order.id, invoiceId: invoice.id, eventType: event.type, createdAtMs: Date.now() });
          await tx.insert(hiringTerms).values({ id: randomUUID(), orgId: order.orgId, basis: "stripe", sourceInvoiceId: invoice.id, sourceSubscriptionId: subscription.id, sourcePaymentIntentId: paymentIntentId, startsAtMs: period.startsAtMs, endsAtMs: period.endsAtMs, quota: HIRING_QUOTA, used: 0, state: "active", paymentState: "active", createdByEmail: order.ownerEmail });
        }
        await tx.update(hiringOrders).set({ status: "active", stripeSubscriptionId: subscription.id }).where(eq(hiringOrders.id, order.id));
      });
      return { handled: true };
    } catch (error) {
      if (error instanceof InvalidHiringPayment) return { handled: true, reviewRequired: true };
      throw error;
    }
  }
  if (event.type === "charge.refunded" || event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
    const chargeId = object.id;
    const matching = await db.select().from(hiringTerms).where(eq(hiringTerms.sourcePaymentIntentId, typeof object.payment_intent === "string" ? object.payment_intent : "")).limit(1);
    if (matching[0]) {
      const charge = await stripe.charges.retrieve(chargeId) as any;
      const disputes = await stripe.disputes.list({ charge: chargeId, limit: 100 });
      const state = hiringPaymentState(charge, disputes.data ?? []);
      await db.update(hiringTerms).set({ paymentState: state, state: state === "active" ? "active" : "suspended" }).where(eq(hiringTerms.id, matching[0].id));
    }
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const [term] = await db.select().from(hiringTerms).where(eq(hiringTerms.sourceSubscriptionId, object.id)).limit(1);
    if (term && (object.cancel_at_period_end || event.type === "customer.subscription.deleted")) {
      await db.update(hiringTerms).set({ state: "cancel_at_period_end" }).where(eq(hiringTerms.id, term.id));
    }
  }
  return { handled: true };
}
