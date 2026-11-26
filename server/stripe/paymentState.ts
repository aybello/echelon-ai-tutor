import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { productAnalyticsEvents, purchaseEmailOutbox, purchases, stripeEventLog } from "../../drizzle/schema";
import { hashAnalyticsEmail } from "../analytics";
import type { Database } from "./eventLedger";

export type PaymentTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type PaymentAccessState = "clear" | "disputed" | "partial_refund" | "full_refund";
export type RevokedPaymentState = Exclude<PaymentAccessState, "clear">;

const PAYMENT_STATE_EVENT_TYPE = "individual.payment_state";
export function paymentStateLedgerId(paymentIntentId: string): string {
  return `payment_state_${createHash("sha256").update(paymentIntentId).digest("hex")}`;
}

function parseState(status: string): PaymentAccessState {
  if (status === "clear" || status === "disputed" || status === "partial_refund" || status === "full_refund") return status;
  throw new Error("Individual payment state is invalid; review required");
}

/**
 * A reserved ledger row is both a durable payment tombstone and a row lock.
 * All individual writers lock this row BEFORE event/purchase/outbox rows.
 * The unique-key upsert serializes even when the purchase does not exist yet.
 * This is not a Stripe delivery and must never be claimed by claimStripeEvent.
 */
export async function withPaymentState<T>(
  db: Database,
  paymentIntentId: string,
  work: (tx: PaymentTransaction, state: PaymentAccessState) => Promise<T>,
): Promise<T> {
  if (!paymentIntentId) throw new Error("Missing PaymentIntent ID");
  return db.transaction(async tx => {
    const id = paymentStateLedgerId(paymentIntentId);
    await tx.insert(stripeEventLog).values({
      stripeEventId: id, stripeObjectId: paymentIntentId,
      eventType: PAYMENT_STATE_EVENT_TYPE, status: "clear",
      dbProcessed: true, emailDelivered: true,
    }).onDuplicateKeyUpdate({ set: { stripeEventId: id } });
    const [row] = await tx.select().from(stripeEventLog)
      .where(eq(stripeEventLog.stripeEventId, id)).limit(1).for("update");
    if (!row || row.eventType !== PAYMENT_STATE_EVENT_TYPE || row.stripeObjectId !== paymentIntentId) {
      throw new Error("Individual payment guard does not match its payment");
    }
    return work(tx, parseState(row.status));
  });
}

/** Read-only reconciliation does not create a guard or mutate access. */
export async function readPaymentState(db: Database, paymentIntentId: string): Promise<PaymentAccessState> {
  const [row] = await db.select().from(stripeEventLog)
    .where(eq(stripeEventLog.stripeEventId, paymentStateLedgerId(paymentIntentId))).limit(1);
  return row ? parseState(row.status) : "clear";
}

/** Refunds are terminal. Delayed partial-refund/dispute deliveries cannot downgrade them. */
export async function revokePaymentState(
  tx: PaymentTransaction, paymentIntentId: string,
  current: PaymentAccessState, reason: RevokedPaymentState,
): Promise<RevokedPaymentState> {
  const rank = { clear: 0, disputed: 1, partial_refund: 2, full_refund: 3 };
  const next = rank[reason] > rank[current] ? reason : current as RevokedPaymentState;
  await tx.update(stripeEventLog).set({ status: next })
    .where(eq(stripeEventLog.stripeEventId, paymentStateLedgerId(paymentIntentId)));
  return next;
}

/** Preserve purchase and learner history; account once per purchase refund transition. */
export async function revokeIndividualPurchases(
  tx: PaymentTransaction, paymentIntentId: string, reason: RevokedPaymentState,
  attribution: { stripeEventId?: string; stripeChargeId?: string | null } = {},
) {
  const rows = await tx.select({
    id: purchases.id, userId: purchases.userId, email: purchases.email,
    productKey: purchases.productKey, stripeSessionId: purchases.stripeSessionId, status: purchases.status,
  }).from(purchases).where(eq(purchases.stripePaymentIntentId, paymentIntentId)).for("update");
  const refund = reason === "full_refund" || reason === "partial_refund";
  let changed: typeof rows[number] | null = null;
  for (const purchase of rows) {
    // A dispute never restores or downgrades refunded access.
    if (purchase.status === "refunded" || (!refund && purchase.status === "disputed")) continue;
    await tx.update(purchases).set(refund
      ? { status: "refunded", refundedAt: new Date() }
      : { status: "disputed" }).where(eq(purchases.id, purchase.id));
    if (refund) {
      await tx.insert(productAnalyticsEvents).values({
        eventName: "purchase_refunded", userId: purchase.userId?.toString() ?? null,
        emailHash: hashAnalyticsEmail(purchase.email), productKey: purchase.productKey,
        metadata: JSON.stringify({ ...attribution, stripePaymentIntentId: paymentIntentId, refundKind: reason }),
      });
    }
    changed ??= purchase;
  }
  if (rows.length) {
    await tx.update(purchaseEmailOutbox).set({ status: "failed", leaseToken: null })
      // Sent confirmations are retained. Pending confirmations must not claim new access.
      .where(and(
        inArray(purchaseEmailOutbox.stripeSessionId, rows.map(row => row.stripeSessionId)),
        inArray(purchaseEmailOutbox.status, ["pending", "sending"]),
      ));
  }
  return changed;
}

/** Signed dispute deliveries also leave a tombstone when no purchase exists. */
export async function processIndividualDispute(db: Database, paymentIntentId: string) {
  return withPaymentState(db, paymentIntentId, async (tx, current) => {
    const next = await revokePaymentState(tx, paymentIntentId, current, "disputed");
    await revokeIndividualPurchases(tx, paymentIntentId, next);
  });
}
