import { randomUUID } from "node:crypto";
import { stripe } from "../stripe/stripe";
import { hiringEvents, hiringOrders, hiringTerms } from "../../drizzle/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { HIRING_POLICY, HIRING_QUOTA, HIRING_TYPE, InvalidHiringPayment, hiringMetadata, hiringPaymentState, invoicePaymentEvidence, invoiceSubscriptionId, validateHiringInvoice, validateHiringSubscription } from "./policy";

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
      await db.transaction(async tx => {
        await tx.select({ id: hiringOrders.id }).from(hiringOrders).where(eq(hiringOrders.orgId, reversalTerm.orgId)).limit(1).for("update");
        const [current] = await tx.select().from(hiringTerms).where(eq(hiringTerms.id, reversalTerm.id)).limit(1).for("update");
        if (!current) return;
        await tx.update(hiringTerms).set({
          paymentState: state,
          state: state === "active" ? (current.state === "cancel_at_period_end" ? "cancel_at_period_end" : "active") : "suspended",
        }).where(eq(hiringTerms.id, current.id));
      });
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
    const invoice = await stripe.invoices.retrieve(object.id, { expand: ["payments.data.payment.payment_intent.latest_charge", "payments.data.payment.charge"] }) as any;
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return { handled: true, reviewRequired: true };
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product", "latest_invoice"] }) as any;
    const order = rows[0];
    try {
      const { priceId } = validateHiringSubscription(subscription, {
        id: order.id, orgId: order.orgId, customerId: order.stripeCustomerId, subscriptionId: order.stripeSubscriptionId,
      });
      const period = validateHiringInvoice(invoice, subscription, priceId);
      const evidence = invoicePaymentEvidence(invoice);
      const paymentIntentId = evidence.paymentIntentId;
      const chargeId = evidence.chargeId;
      const charge = chargeId ? await stripe.charges.retrieve(chargeId, { expand: ["payment_intent"] }) as any : null;
      if (!charge || charge.status !== "succeeded" || charge.paid !== true) throw new InvalidHiringPayment("Successful charge evidence is required");
      const disputes = charge?.disputed ? await stripe.disputes.list({ charge: chargeId!, limit: 100 }) : null;
      const paymentState = hiringPaymentState(charge, disputes?.data ?? []);
      if (paymentState !== "active") return { handled: true, reviewRequired: true };
      await db.transaction(async tx => {
        await tx.select({ id: hiringOrders.id }).from(hiringOrders).where(eq(hiringOrders.id, order.id)).limit(1).for("update");
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
    await db.transaction(async tx => {
      const [term] = await tx.select().from(hiringTerms).where(and(
        eq(hiringTerms.sourceSubscriptionId, object.id),
        eq(hiringTerms.paymentState, "active"),
        inArray(hiringTerms.state, ["active", "cancel_at_period_end"]),
      )).orderBy(desc(hiringTerms.endsAtMs)).limit(1).for("update");
      if (!term) return;
      await tx.select({ id: hiringOrders.id }).from(hiringOrders).where(eq(hiringOrders.orgId, term.orgId)).limit(1).for("update");
      const terminated = event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(object.status);
      if (terminated) {
        await tx.update(hiringTerms).set({ state: "suspended" }).where(eq(hiringTerms.id, term.id));
      } else {
        await tx.update(hiringTerms).set({ state: object.cancel_at_period_end ? "cancel_at_period_end" : "active" }).where(eq(hiringTerms.id, term.id));
      }
    });
  }
  return { handled: true };
}
