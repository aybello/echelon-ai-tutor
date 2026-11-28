import { randomUUID } from "node:crypto";
import { stripe } from "../stripe/stripe";
import { hiringEvents, hiringOrders, hiringTerms } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { HIRING_POLICY, HIRING_QUOTA, HIRING_TYPE, InvalidHiringPayment, hiringMetadata, hiringPaymentState, invoiceSubscriptionId, validateHiringInvoice, validateHiringSubscription } from "./policy";

/** Returns true only for events explicitly owned by Hiring. Legacy handlers must
 * never see these events, even when the payload is malformed or unpaid. */
export function isHiringEvent(event: any): boolean {
  const object = event?.data?.object;
  return hiringMetadata(object).type === HIRING_TYPE;
}
export async function dispatchHiringEvent(event: any): Promise<{ handled: boolean; reviewRequired?: boolean }> {
  const object = event.data.object as any;
  const metadata = hiringMetadata(object);
  const reversalEvent = ["charge.refunded", "charge.dispute.created", "charge.dispute.closed"].includes(event.type);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  let reversalTerm: any = null;
  if (reversalEvent) {
    const chargeId = event.type.startsWith("charge.dispute") ? object.charge : object.id;
    const paymentIntentIdFromEvent = typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id;
    const charge = paymentIntentIdFromEvent || typeof chargeId !== "string" ? null : await stripe.charges.retrieve(chargeId) as any;
    const paymentIntentId = paymentIntentIdFromEvent ?? (typeof charge?.payment_intent === "string" ? charge.payment_intent : charge?.payment_intent?.id);
    if (paymentIntentId) {
      const [term] = await db.select().from(hiringTerms).where(eq(hiringTerms.sourcePaymentIntentId, paymentIntentId)).limit(1);
      reversalTerm = term ?? null;
    }
    if (!reversalTerm && !isHiringEvent(event)) return { handled: false };
    if (reversalTerm) {
      const chargeId = event.type.startsWith("charge.dispute") ? object.charge : object.id;
      if (typeof chargeId !== "string") return { handled: true, reviewRequired: true };
      const charge = await stripe.charges.retrieve(chargeId) as any;
      const disputes = await stripe.disputes.list({ charge: chargeId, limit: 100 });
      const state = hiringPaymentState(charge, disputes.data ?? []);
      await db.update(hiringTerms).set({
        paymentState: state,
        state: state === "active" ? (reversalTerm.state === "cancel_at_period_end" ? "cancel_at_period_end" : "active") : "suspended",
      }).where(eq(hiringTerms.id, reversalTerm.id));
      return { handled: true };
    }
  } else if (!isHiringEvent(event)) return { handled: false };
  if (metadata.policy !== HIRING_POLICY) {
    return { handled: true, reviewRequired: true };
  }
  const orderId = metadata.orderId;
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
    const invoice = await stripe.invoices.retrieve(object.id, { expand: ["lines.data.price.product", "subscription", "payment_intent.latest_charge"] }) as any;
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
      const chargeId = typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id
        ?? (typeof invoice.payment_intent?.latest_charge === "string" ? invoice.payment_intent.latest_charge : invoice.payment_intent?.latest_charge?.id);
      const charge = chargeId ? await stripe.charges.retrieve(chargeId, { expand: ["payment_intent"] }) as any : null;
      if (!charge || charge.status !== "succeeded" || charge.paid !== true) throw new InvalidHiringPayment("Successful charge evidence is required");
      const disputes = charge?.disputed ? await stripe.disputes.list({ charge: chargeId!, limit: 100 }) : null;
      const paymentState = hiringPaymentState(charge, disputes?.data ?? []);
      if (paymentState !== "active") return { handled: true, reviewRequired: true };
      await db.transaction(async tx => {
        const [claim] = await tx.select({ id: hiringEvents.id }).from(hiringEvents).where(eq(hiringEvents.id, event.id)).limit(1).for("update");
        const [existingTerm] = await tx.select({ id: hiringTerms.id }).from(hiringTerms).where(eq(hiringTerms.sourceInvoiceId, invoice.id)).limit(1).for("update");
        if (!claim) {
          await tx.insert(hiringEvents).values({ id: event.id, orgId: order.orgId, orderId: order.id, invoiceId: invoice.id, eventType: event.type, createdAtMs: Date.now() });
          if (!existingTerm) await tx.insert(hiringTerms).values({ id: randomUUID(), orgId: order.orgId, basis: "stripe", sourceInvoiceId: invoice.id, sourceSubscriptionId: subscription.id, sourcePaymentIntentId: paymentIntentId, startsAtMs: period.startsAtMs, endsAtMs: period.endsAtMs, quota: HIRING_QUOTA, used: 0, state: "active", paymentState: "active", createdByEmail: order.ownerEmail });
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
    return { handled: true };
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const [term] = await db.select().from(hiringTerms).where(eq(hiringTerms.sourceSubscriptionId, object.id)).limit(1);
    if (term && (object.cancel_at_period_end || event.type === "customer.subscription.deleted")) {
      if (event.type === "customer.subscription.deleted") await db.update(hiringTerms).set({ state: "suspended" }).where(eq(hiringTerms.id, term.id));
      else await db.update(hiringTerms).set({ state: "cancel_at_period_end" }).where(eq(hiringTerms.id, term.id));
    }
  }
  return { handled: true };
}
