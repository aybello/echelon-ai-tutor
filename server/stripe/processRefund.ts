import { and, eq } from "drizzle-orm";
import { productAnalyticsEvents, purchases, stripeEventLog } from "../../drizzle/schema";
import { hashAnalyticsEmail } from "../analytics";
import {
  claimStripeEvent,
  markStripeEventFailed,
  type ClaimEventResult,
  type Database,
} from "./eventLedger";

export interface RefundPurchase {
  id: number;
  userId: number | null;
  email: string;
  productKey: string;
}

export interface ProcessRefundInput {
  stripeEventId: string;
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
}

export type ProcessRefundResult =
  | { state: "completed"; purchase: RefundPurchase | null }
  | { state: "already_completed"; purchase: null }
  | { state: "busy"; purchase: null }
  | { state: "retryable_failure"; purchase: null; error: string };

interface RefundDependencies {
  claimEvent: (db: Database, input: { stripeEventId: string; eventType: string; stripeObjectId: string | null }) => Promise<ClaimEventResult>;
  completeRefund: (db: Database, input: ProcessRefundInput, token: string) => Promise<RefundPurchase | null>;
  markFailed: (db: Database, stripeEventId: string, token: string, error: unknown) => Promise<void>;
}

const productionRefundDependencies: RefundDependencies = {
  claimEvent: (db, input) => claimStripeEvent(db, input),
  async completeRefund(db, input, token) {
    return db.transaction(async tx => {
      const [purchase] = await tx
        .select({
          id: purchases.id,
          userId: purchases.userId,
          email: purchases.email,
          productKey: purchases.productKey,
        })
        .from(purchases)
        .where(eq(purchases.stripePaymentIntentId, input.stripePaymentIntentId))
        .limit(1);

      if (purchase) {
        await tx
          .update(purchases)
          .set({ status: "refunded", refundedAt: new Date() })
          .where(eq(purchases.id, purchase.id));

        await tx.insert(productAnalyticsEvents).values({
          eventName: "purchase_refunded",
          userId: purchase.userId?.toString() ?? null,
          emailHash: hashAnalyticsEmail(purchase.email),
          productKey: purchase.productKey,
          metadata: JSON.stringify({
            stripeEventId: input.stripeEventId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            stripeChargeId: input.stripeChargeId,
          }),
        });
      }

      // This update shares the same transaction as purchase and analytics writes.
      // The unique Stripe event ledger therefore makes a delivered event exactly
      // once for business state and analytics, even if Stripe retries the webhook.
      await tx
        .update(stripeEventLog)
        .set({
          dbProcessed: true,
          status: "completed",
          emailDelivered: true,
          processingToken: null,
          processingStartedAt: null,
          lastError: null,
          completedAt: new Date(),
        })
        .where(and(
          eq(stripeEventLog.stripeEventId, input.stripeEventId),
          eq(stripeEventLog.processingToken, token),
        ));

      return purchase ?? null;
    });
  },
  markFailed: markStripeEventFailed,
};

/**
 * Applies a Stripe refund and its attributable analytics event in one database
 * transaction with the unique Stripe event ledger. A replay either claims no
 * work because the ledger is complete, or retries a fully rolled-back update.
 */
export async function processRefund(
  db: Database,
  input: ProcessRefundInput,
  dependencies: RefundDependencies = productionRefundDependencies,
): Promise<ProcessRefundResult> {
  const claim = await dependencies.claimEvent(db, {
    stripeEventId: input.stripeEventId,
    eventType: "charge.refunded",
    stripeObjectId: input.stripeChargeId,
  });

  if (claim.state === "completed") return { state: "already_completed", purchase: null };
  if (claim.state === "busy") return { state: "busy", purchase: null };

  const { token } = claim;
  try {
    const purchase = await dependencies.completeRefund(db, input, token);
    return { state: "completed", purchase };
  } catch (error) {
    await dependencies.markFailed(db, input.stripeEventId, token, error);
    return {
      state: "retryable_failure",
      purchase: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
