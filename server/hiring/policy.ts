import { TRPCError } from "@trpc/server";

export const HIRING_TYPE = "team_hiring_addon";
export const HIRING_POLICY = "annual-cad-100000-100-v1";
export const HIRING_AMOUNT = 100_000;
export const HIRING_QUOTA = 100;
export const HIRING_PILOT_MAX_QUOTA = 25;
export const HIRING_PILOT_MAX_DURATION_MS = 31 * 24 * 60 * 60 * 1000;
export function validatePilotBounds(startsAtMs: number, endsAtMs: number, quota: number, nowMs = Date.now()) {
  if (!Number.isSafeInteger(startsAtMs) || !Number.isSafeInteger(endsAtMs) || startsAtMs < nowMs || endsAtMs <= startsAtMs || endsAtMs - startsAtMs > HIRING_PILOT_MAX_DURATION_MS) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Pilot dates must be future, ordered, and no longer than 31 days." });
  }
  if (!Number.isSafeInteger(quota) || quota < 1 || quota > HIRING_PILOT_MAX_QUOTA) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Pilot allowance must be between 1 and ${HIRING_PILOT_MAX_QUOTA}.` });
  }
  return { startsAtMs, endsAtMs, quota };
}
export const stripeId = (value: unknown): string | null => typeof value === "string" ? value :
  value && typeof value === "object" && "id" in value && typeof value.id === "string" ? value.id : null;
export const invoiceSubscriptionId = (invoice: any): string | null =>
  stripeId(invoice.parent?.subscription_details?.subscription) ?? stripeId(invoice.subscription);
export class InvalidHiringPayment extends Error {}
function requirePayment(ok: unknown, message: string): asserts ok {
  if (!ok) throw new InvalidHiringPayment(message);
}
export type HiringBinding = { id: string; orgId: number; customerId: string | null; subscriptionId: string | null };
export function validateHiringSubscription(sub: any, order: HiringBinding): { priceId: string; productId: string } {
  requirePayment(sub && !sub.deleted && sub.metadata?.type === HIRING_TYPE && sub.metadata?.policy === HIRING_POLICY
    && sub.metadata?.orderId === order.id && sub.metadata?.orgId === String(order.orgId), "Subscription policy/order mismatch");
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
  const anniversary = new Date(start * 1000); anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);
  requirePayment(end * 1000 === anniversary.getTime() && invoice.period_start === start && invoice.period_end === end,
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
  if (!grant || grant.state !== "active" || grant.startsAtMs > nowMs || grant.endsAtMs <= nowMs) {
    throw new TRPCError({ code: "FORBIDDEN", message: "An active Annual Teams Hiring add-on or admin-approved pilot is required." });
  }
  if (needsAllowance && grant.used >= grant.quota) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This Hiring term's assessment invitation allowance is fully used. Revocation and expiry do not restore allowance." });
  }
}
