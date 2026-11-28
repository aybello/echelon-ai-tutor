import { and, eq } from "drizzle-orm";
import { hiringEvents, hiringPayments, type HiringOrder, type HiringPayment, type HiringTerm } from "../../drizzle/schema";
import { hiringPaymentState, InvalidHiringPayment, type HiringPaymentState } from "./policy";

export async function recordHiringEvent(tx: any, event: any, order: HiringOrder, invoiceId: string | null, reviewRequired: boolean) {
  const [existing] = await tx.select().from(hiringEvents).where(eq(hiringEvents.id, event.id)).limit(1).for("update");
  const state = reviewRequired ? "review_required" : "claimed";
  if (existing) {
    if (existing.orderId !== order.id || existing.orgId !== order.orgId) throw new InvalidHiringPayment("Event ownership changed");
    await tx.update(hiringEvents).set({ state }).where(eq(hiringEvents.id, event.id));
  } else await tx.insert(hiringEvents).values({ id: event.id, orgId: order.orgId, orderId: order.id,
    invoiceId, eventType: event.type, state, createdAtMs: Date.now() });
}

/** Call only under the exact order UPDATE lock, before locking/updating terms. */
export async function reconcileHiringPayment(tx: any, input: {
  order: HiringOrder; invoiceId: string; subscriptionId: string; paymentIntentId: string; chargeId: string;
  charge: any; disputes: any[]; incomplete: boolean; allowDisputeRecovery: boolean;
  currentTerm?: HiringTerm;
}): Promise<HiringPaymentState> {
  const { order, invoiceId, subscriptionId, paymentIntentId, chargeId } = input;
  const [stored]: HiringPayment[] = await tx.select().from(hiringPayments).where(eq(hiringPayments.id, chargeId)).limit(1).for("update");
  if (stored && (stored.orgId !== order.orgId || stored.orderId !== order.id || stored.invoiceId !== invoiceId
    || stored.subscriptionId !== subscriptionId || stored.paymentIntentId !== paymentIntentId)) {
    throw new InvalidHiringPayment("Immutable Hiring charge binding mismatch");
  }
  const current = input.currentTerm;
  if (current && (current.orgId !== order.orgId || current.sourceInvoiceId !== invoiceId
    || current.sourceSubscriptionId !== subscriptionId || current.sourceChargeId !== chargeId
    || current.sourcePaymentIntentId !== paymentIntentId)) throw new InvalidHiringPayment("Immutable Hiring term binding mismatch");
  const previous = stored?.paymentState ?? current?.paymentState
    ?? (order.paymentChargeId === chargeId ? order.paymentState : "active");
  const evidence = hiringPaymentState(input.charge, input.disputes);
  // Positive terminal facts do not require an exhaustive dispute list. A partial
  // refund requires manual review; a truncated/missing dispute list is instead
  // a retryable dispute hold, never a sticky manual-review decision.
  const observed: HiringPaymentState = evidence === "refunded" || evidence === "dispute_lost"
    || input.charge.amount_refunded > 0 ? evidence
    : input.incomplete || evidence === "needs_review" ? "disputed" : evidence;
  const knownDisputeIds = stored?.disputeIds ?? [];
  const disputeIds = [...new Set([...knownDisputeIds, ...input.disputes.map(d => d.id).filter((id): id is string => typeof id === "string")])].sort();
  // Stronger adverse evidence can advance a hold. No replay may weaken one.
  let state: HiringPaymentState = observed;
  if (previous === "refunded" || observed === "refunded") state = "refunded";
  else if (previous === "dispute_lost" || observed === "dispute_lost") state = "dispute_lost";
  else if (previous === "needs_review") state = "needs_review";
  else if (previous === "disputed" && observed === "active") {
    const resolved = input.allowDisputeRecovery && !input.incomplete && knownDisputeIds.length > 0
      && knownDisputeIds.every(id => input.disputes.some(d => d.id === id && ["won", "warning_closed"].includes(d.status)));
    if (!resolved) state = "disputed";
  }
  const values = { paymentState: state, disputeIds, updatedAtMs: Date.now() };
  if (stored) await tx.update(hiringPayments).set(values).where(eq(hiringPayments.id, chargeId));
  else await tx.insert(hiringPayments).values({ id: chargeId, orgId: order.orgId, orderId: order.id,
    invoiceId, subscriptionId, paymentIntentId, ...values });
  return state;
}

export async function closeHiringInvoiceReviews(tx: any, orderId: string, invoiceId: string) {
  await tx.update(hiringEvents).set({ state: "claimed" }).where(and(eq(hiringEvents.orderId, orderId),
    eq(hiringEvents.invoiceId, invoiceId), eq(hiringEvents.state, "review_required")));
}

export function hiringTermState(paymentState: string, subscription: any): string {
  if (paymentState !== "active") return "suspended";
  if (subscription.status !== "active") return "subscription_suspended";
  return subscription.cancel_at_period_end ? "cancel_at_period_end" : "active";
}
