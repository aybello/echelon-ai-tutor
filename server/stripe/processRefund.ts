import { and, eq } from "drizzle-orm";
import { stripeEventLog } from "../../drizzle/schema";
import { revokeIndividualPurchases, revokePaymentState, withPaymentState } from "./paymentState";
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
  /** Individual partial refunds retain the existing revoke-on-refund policy. */
  refundKind?: "full_refund" | "partial_refund";
}

export type ProcessRefundResult =
  | { state: "completed"; purchase: RefundPurchase | null }
  | { state: "already_completed"; purchase: null }
  | { state: "busy"; purchase: null }
  | { state: "retryable_failure"; purchase: null; error: string };

interface RefundDependencies {
  claimEvent: (db: Database, input: { stripeEventId: string; eventType: string; stripeObjectId: string | null }) => Promise<ClaimEventResult>;
  completeRefund: (db: Database, input: ProcessRefundInput, token: string | null) => Promise<RefundPurchase | null>;
  markFailed: (db: Database, stripeEventId: string, token: string, error: unknown) => Promise<void>;
}

const productionRefundDependencies: RefundDependencies = {
  claimEvent: (db, input) => claimStripeEvent(db, input),
  async completeRefund(db, input, token) {
    return withPaymentState(db, input.stripePaymentIntentId, async (tx, current) => {
      const [event] = await tx.select().from(stripeEventLog)
        .where(eq(stripeEventLog.stripeEventId, input.stripeEventId)).limit(1).for("update");
      if (!event || (token ? event.processingToken !== token : event.status !== "completed")) {
        throw new Error("Refund event claim was lost");
      }
      const next = await revokePaymentState(tx, input.stripePaymentIntentId, current, input.refundKind ?? "full_refund");
      const purchase = await revokeIndividualPurchases(tx, input.stripePaymentIntentId, next, {
        stripeEventId: input.stripeEventId, stripeChargeId: input.stripeChargeId,
      });
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
          token ? eq(stripeEventLog.processingToken, token) : eq(stripeEventLog.status, "completed"),
        ));

      return purchase ?? null;
    });
  },
  markFailed: markStripeEventFailed,
};

/**
 * Durably remembers a refund even before its purchase exists. Completed-event
 * replays reassert revocation (including pre-fix unmatched events) without
 * duplicating accounting. All writers serialize on the same payment guard.
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

  if (claim.state === "busy") return { state: "busy", purchase: null };

  const token = claim.state === "claimed" ? claim.token : null;
  try {
    const purchase = await dependencies.completeRefund(db, input, token);
    return claim.state === "completed" ? { state: "already_completed", purchase: null } : { state: "completed", purchase };
  } catch (error) {
    if (token) await dependencies.markFailed(db, input.stripeEventId, token, error);
    return {
      state: "retryable_failure",
      purchase: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
