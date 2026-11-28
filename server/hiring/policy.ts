import { TRPCError } from "@trpc/server";

export const HIRING_TYPE = "team_hiring_addon";
export const HIRING_POLICY = "annual-cad-100000-100-v1";
export const HIRING_AMOUNT = 100_000;
export const HIRING_QUOTA = 100;
export const HIRING_PILOT_MAX_QUOTA = 25;
export const HIRING_PILOT_MAX_DURATION_MS = 31 * 24 * 60 * 60 * 1000;
export function validatePilotBounds(startsAtMs: number, endsAtMs: number, quota: number, nowMs = Date.now()) {
  if (!Number.isSafeInteger(startsAtMs) || !Number.isSafeInteger(endsAtMs) || startsAtMs < nowMs || endsAtMs <= startsAtMs || endsAtMs - startsAtMs > HIRING_PILOT_MAX_DURATION_MS) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Free access dates must be future, ordered, and no longer than 31 days." });
  }
  if (!Number.isSafeInteger(quota) || quota < 1 || quota > HIRING_PILOT_MAX_QUOTA) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Free assessment allowance must be between 1 and ${HIRING_PILOT_MAX_QUOTA}.` });
  }
  return { startsAtMs, endsAtMs, quota };
}
export const stripeId = (value: unknown): string | null => typeof value === "string" ? value :
  value && typeof value === "object" && "id" in value && typeof value.id === "string" ? value.id : null;
export function hiringMetadata(object: any): Record<string, string> {
  const candidates = [
    object?.metadata,
    object?.subscription_details?.metadata,
    object?.parent?.subscription_details?.metadata,
    object?.parent?.invoice_details?.metadata,
  ];
  return candidates.find((metadata) => metadata?.type === HIRING_TYPE || metadata?.hiring_type === HIRING_TYPE) ?? {};
}
export const invoiceSubscriptionId = (invoice: any): string | null =>
  stripeId(invoice.parent?.subscription_details?.subscription) ?? stripeId(invoice.subscription);
export function invoicePaymentEvidence(invoice: any): { paymentIntentId: string | null; chargeId: string | null; paymentRecordId: string | null } {
  const payments = Array.isArray(invoice?.payments?.data) ? invoice.payments.data : [];
  const paid = payments.find((payment: any) => payment?.status === "paid") ?? payments[0];
  const payment = paid?.payment ?? {};
  const paymentIntent = payment.payment_intent ?? invoice.payment_intent;
  const charge = payment.charge ?? invoice.charge ?? paymentIntent?.latest_charge;
  return {
    paymentIntentId: stripeId(paymentIntent),
    chargeId: stripeId(charge),
    paymentRecordId: stripeId(payment.payment_record),
  };
}
export class InvalidHiringPayment extends Error {}
function requirePayment(ok: unknown, message: string): asserts ok {
  if (!ok) throw new InvalidHiringPayment(message);
}
export function validateHiringCharge(invoice: any, charge: any,
  evidence: { paymentIntentId: string | null; chargeId: string | null }): void {
  requirePayment(evidence.paymentIntentId, "A reconcilable invoice payment intent is required");
  const payments = invoice.payments;
  if (payments !== undefined) {
    requirePayment(payments?.has_more !== true && Array.isArray(payments?.data) && payments.data.length === 1,
      "Exactly one complete invoice payment is required");
    const payment = payments.data[0];
    requirePayment(payment.status === "paid" && payment.amount_paid === invoice.total,
      "Invoice payment allocation must cover the full total");
  }
  requirePayment(charge && evidence.chargeId && stripeId(charge) === evidence.chargeId
    && charge.status === "succeeded" && charge.paid === true && charge.captured === true
    && charge.currency === "cad" && stripeId(charge.customer) === stripeId(invoice.customer)
    && charge.amount === invoice.total && charge.amount_captured === invoice.total,
  "Full captured CAD charge and customer binding required");
  requirePayment(stripeId(charge.payment_intent) === evidence.paymentIntentId,
    "Invoice charge/payment intent mismatch");
}
export type HiringBinding = { id: string; orgId: number; customerId: string | null; subscriptionId: string | null };
/** Cancellation proves ownership, not paid entitlement. Overdue subscriptions
 * must remain cancellable without relaxing invoice fulfilment validation. */
export function validateHiringCancellationSubscription(sub: any, order: HiringBinding): void {
  requirePayment(sub && !sub.deleted && order.subscriptionId && sub.id === order.subscriptionId
    && sub.metadata?.type === HIRING_TYPE && sub.metadata?.policy === HIRING_POLICY
    && sub.metadata?.orderId === order.id && sub.metadata?.orgId === String(order.orgId),
  "Hiring cancellation subscription binding mismatch");
  requirePayment(order.customerId && stripeId(sub.customer) === order.customerId,
    "Hiring cancellation customer binding mismatch");
}
export function validateHiringSubscription(sub: any, order: HiringBinding): { priceId: string; productId: string } {
  requirePayment(sub && !sub.deleted && sub.metadata?.type === HIRING_TYPE && sub.metadata?.policy === HIRING_POLICY
    && sub.metadata?.orderId === order.id && sub.metadata?.orgId === String(order.orgId), "Subscription policy/order mismatch");
  requirePayment(sub.status === "active", "Subscription is not active");
  requirePayment(!order.subscriptionId || sub.id === order.subscriptionId, "Subscription binding mismatch");
  requirePayment(order.customerId && stripeId(sub.customer) === order.customerId, "Customer binding mismatch");
  requirePayment(!sub.trial_start && !sub.trial_end && !sub.discounts?.length && !sub.discount
    && !sub.schedule && !sub.pending_update, "Trials, discounts or scheduled changes are not permitted");
  requirePayment(sub.collection_method === "charge_automatically", "Automatic payment required");
  requirePayment(sub.items?.data?.length === 1 && !sub.items.has_more, "Exactly one subscription item required");
  const item = sub.items.data[0], price = item.price, product = price?.product;
  requirePayment(item.quantity === 1 && price?.currency === "cad" && price.unit_amount === HIRING_AMOUNT
    && price.type === "recurring" && price.recurring?.interval === "year" && price.recurring.interval_count === 1
    && price.recurring.usage_type === "licensed" && price.tax_behavior === "exclusive"
    && price.billing_scheme === "per_unit" && !price.transform_quantity && !item.discounts?.length, "Annual CAD price mismatch");
  requirePayment(product && typeof product === "object" && !product.deleted
    && product.metadata?.type === HIRING_TYPE && product.metadata?.policy === HIRING_POLICY, "Product policy mismatch");
  return { priceId: price.id, productId: product.id };
}
export function validateHiringInvoice(invoice: any, sub: any, priceId: string): { startsAtMs: number; endsAtMs: number } {
  requirePayment(invoiceSubscriptionId(invoice) === sub.id && stripeId(invoice.customer) === stripeId(sub.customer)
    && invoice.currency === "cad" && invoice.status === "paid" && invoice.paid !== false
    && !invoice.paid_out_of_band && invoice.collection_method === "charge_automatically"
    && ["subscription_create", "subscription_cycle"].includes(invoice.billing_reason), "Genuine recurring paid invoice required");
  requirePayment(invoice.subtotal === HIRING_AMOUNT && invoice.amount_paid === invoice.total && invoice.total >= HIRING_AMOUNT
    && invoice.amount_remaining === 0 && !invoice.discounts?.length && !invoice.discount
    && !(invoice.total_discount_amounts ?? []).some((d: any) => d.amount !== 0)
    && !invoice.starting_balance && !invoice.pre_payment_credit_notes_amount && !invoice.post_payment_credit_notes_amount,
  "Invoice payment/discount/balance mismatch");
  requirePayment(invoice.lines?.data?.length === 1 && !invoice.lines.has_more, "Exactly one annual invoice line required");
  const line = invoice.lines.data[0];
  const parent = line.parent?.subscription_item_details;
  requirePayment((parent ? parent.proration === false && stripeId(parent.subscription) === sub.id : line.proration === false && line.type === "subscription")
    && line.quantity === 1 && line.amount === HIRING_AMOUNT && line.currency === "cad"
    && (line.pricing?.price_details?.price ?? stripeId(line.price)) === priceId
    && !line.discount_amounts?.some((d: any) => d.amount !== 0), "Invoice annual line mismatch");
  const start = line.period?.start, end = line.period?.end;
  requirePayment(Number.isSafeInteger(start) && Number.isSafeInteger(end) && end > start, "Invoice period missing");
  const anniversary = new Date(start * 1000);
  const month = anniversary.getUTCMonth();
  anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);
  if (anniversary.getUTCMonth() !== month) anniversary.setUTCDate(0);
  requirePayment(end * 1000 === anniversary.getTime(),
    "Invoice period is not an exact calendar year");
  return { startsAtMs: start * 1000, endsAtMs: end * 1000 };
}
export type HiringPaymentState = "active" | "refunded" | "disputed" | "needs_review" | "dispute_lost";
/** A paid replay is not a restoration authority. Live charge plus all live disputes
 * are read under the same lock as fulfilment; refunds always dominate. */
export function hiringPaymentState(charge: any, disputes: any[]): HiringPaymentState {
  if (charge.refunded || (charge.amount_refunded > 0 && charge.amount_refunded >= charge.amount)) return "refunded";
  if (charge.amount_refunded > 0) return "needs_review";
  if (disputes.some(d => d.status === "lost")) return "dispute_lost";
  if (charge.disputed && !disputes.length) return "needs_review";
  if (disputes.some(d => !["won", "warning_closed"].includes(d.status))) return "disputed";
  return "active";
}
export function assertHiringGrant(grant: { state: string; startsAtMs: number; endsAtMs: number; used: number; quota: number } | undefined,
  nowMs: number, needsAllowance = false): asserts grant {
  if (!grant || !["active", "cancel_at_period_end"].includes(grant.state) || grant.startsAtMs > nowMs || grant.endsAtMs <= nowMs) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Active Hiring access is required." });
  }
  if (needsAllowance && grant.used >= grant.quota) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This Hiring term's assessment invitation allowance is fully used. Revocation and expiry do not restore allowance." });
  }
}
