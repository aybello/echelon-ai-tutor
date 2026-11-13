import { eq } from "drizzle-orm";
import { purchases } from "../../drizzle/schema";
import { recordPurchaseWithConfirmation } from "../purchaseEmailOutbox";
import type { Database } from "./eventLedger";
import { getIndividualExamPassExpiry } from "./individualExamPass";
import { normalizePaymentIntentId, PaymentAccessBlockedError, paymentTimestampFromSuccessfulPaymentIntent } from "./paymentTimestamp";
import { revokeIndividualPurchases, revokePaymentState, withPaymentState, type RevokedPaymentState } from "./paymentState";

type PurchaseInput = Omit<Parameters<typeof recordPurchaseWithConfirmation>[1], "accessExpiresAt" | "status" | "refundedAt">;
type RetrievePaymentIntent = Parameters<typeof paymentTimestampFromSuccessfulPaymentIntent>[1];
export type IndividualFulfilmentResult =
  | { state: "created" | "existing" }
  | { state: "blocked"; reason: RevokedPaymentState };

/**
 * Read Stripe's authoritative charge while holding the durable payment guard.
 * Refund/dispute writers cannot commit between this check and entitlement.
 * Remote changes after this read are reasserted by the signed refund delivery.
 */
export async function fulfilIndividualPurchase(
  db: Database, purchase: PurchaseInput, retrievePaymentIntent: RetrievePaymentIntent,
): Promise<IndividualFulfilmentResult> {
  const paymentIntentId = normalizePaymentIntentId(purchase.stripePaymentIntentId);
  return withPaymentState(db, paymentIntentId, async (tx, current) => {
    if (current !== "clear") {
      await revokeIndividualPurchases(tx, paymentIntentId, current);
      return { state: "blocked", reason: current };
    }
    let accessGrantedAt: Date;
    try {
      accessGrantedAt = await paymentTimestampFromSuccessfulPaymentIntent(paymentIntentId, retrievePaymentIntent);
    } catch (error) {
      if (!(error instanceof PaymentAccessBlockedError)) throw error;
      const next = await revokePaymentState(tx, paymentIntentId, current, error.reason);
      await revokeIndividualPurchases(tx, paymentIntentId, next);
      return { state: "blocked", reason: next };
    }
    const [existing] = await tx.select({ id: purchases.id }).from(purchases)
      .where(eq(purchases.stripeSessionId, purchase.stripeSessionId)).limit(1).for("update");
    // Never restore a historical refunded/expired/disputed purchase on replay.
    if (existing) return { state: "existing" };
    // MySQL Drizzle transactions support nested transactions as SAVEPOINTs.
    // Reuse the purchase + outbox helper inside this outer payment transaction,
    // so no access or confirmation can commit separately from the guard check.
    await recordPurchaseWithConfirmation(tx as unknown as Database, {
      ...purchase, stripePaymentIntentId: paymentIntentId,
      accessExpiresAt: getIndividualExamPassExpiry(accessGrantedAt),
    });
    return { state: "created" };
  });
}
