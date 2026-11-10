/**
 * Teams Course Pass refund and dispute handlers.
 *
 * Every mutation is scoped through order item IDs. An organization can place
 * several orders, so organizationId alone is never a safe refund boundary.
 */
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  teamFlexLicences,
  teamFlexOrderItems,
  teamFlexOrders,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
async function requireDb(): Promise<Database> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}
/**
 * Every handler runs inside one transaction that first locks the order row.
 * Stripe delivers refund and dispute events with no ordering guarantee and
 * may deliver them concurrently. Without the lock, a dispute "won" handler
 * could read a licence as suspended, a full refund could revoke it, and the
 * dispute handler would then write the pre-dispute status back over the
 * revocation, re-granting access for a payment that was returned.
 */
async function lockFlexOrder(tx: Tx, paymentIntentId: string) {
  const [order] = await tx
    .select({
      id: teamFlexOrders.id,
      organizationId: teamFlexOrders.organizationId,
      status: teamFlexOrders.status,
    })
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.stripePaymentIntentId, paymentIntentId))
    .limit(1)
    .for("update");
  return order ?? null;
}
async function findOrderLicences(tx: Tx, orderId: number, onlySuspended = false) {
  return tx
    .select({
      id: teamFlexLicences.id,
      status: teamFlexLicences.status,
      previousStatus: teamFlexLicences.previousStatus,
    })
    .from(teamFlexLicences)
    .innerJoin(teamFlexOrderItems, eq(teamFlexOrderItems.id, teamFlexLicences.orderItemId))
    .where(and(
      eq(teamFlexOrderItems.orderId, orderId),
      onlySuspended ? eq(teamFlexLicences.status, "suspended") : undefined,
      onlySuspended ? eq(teamFlexLicences.suspendedReason, "dispute_pending") : undefined,
    ))
    .for("update");
}
/** Order states that mean money has gone back; a dispute win must not undo them. */
const REFUNDED_ORDER_STATES = new Set(["refunded", "partially_refunded"]);
/** Return true when the payment intent belongs to a Course Pass order. */
export async function handleFlexPartialRefund(
  paymentIntentId: string,
  licenceIds: number[],
): Promise<boolean> {
  const db = await requireDb();
  let needsReconciliation: number | null = null;
  const handled = await db.transaction(async (tx) => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return false;
    if (order.status === "refunded") return true;
    const requestedIds = [...new Set(licenceIds)].filter(id => Number.isInteger(id) && id > 0);
    const orderLicences = await findOrderLicences(tx, order.id);
    const orderLicenceIds = new Set(orderLicences.map(licence => licence.id));
    if (
      requestedIds.length === 0
      || requestedIds.length !== licenceIds.length
      || requestedIds.some(id => !orderLicenceIds.has(id))
    ) {
      await tx.update(teamFlexOrders)
        .set({ status: "reconciliation_needed" })
        .where(eq(teamFlexOrders.id, order.id));
      needsReconciliation = order.id;
      return true;
    }
    await tx.update(teamFlexLicences)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        revokeReason: "partial_refund",
        previousStatus: null,
        suspendedAt: null,
        suspendedReason: null,
      })
      .where(inArray(teamFlexLicences.id, requestedIds));
    await tx.update(teamFlexOrders)
      .set({ status: "partially_refunded" })
      .where(eq(teamFlexOrders.id, order.id));
    console.log(`[Course Pass Refund] Revoked ${requestedIds.length} licence(s) for order #${order.id}`);
    return true;
  });
  if (needsReconciliation !== null) {
    await notifyOwner({
      title: "⚠️ Course Pass refund needs reconciliation",
      content: `Refund metadata for order #${needsReconciliation} did not contain a valid, order-scoped licence list. No licences were automatically revoked.`,
    }).catch(() => {});
  }
  return handled;
}
/** Mark an unattributed partial Course Pass refund for manual allocation. */
export async function handleFlexUnallocatedRefund(paymentIntentId: string): Promise<boolean> {
  const db = await requireDb();
  let flagged: number | null = null;
  const handled = await db.transaction(async (tx) => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return false;
    // Stripe does not guarantee event order. Do not let a later generic event
    // downgrade a refund that was already resolved by a more specific event.
    if (REFUNDED_ORDER_STATES.has(order.status)) return true;
    await tx.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(eq(teamFlexOrders.id, order.id));
    flagged = order.id;
    return true;
  });
  if (flagged !== null) {
    await notifyOwner({
      title: "⚠️ Course Pass refund needs reconciliation",
      content: `Partial refund on order #${flagged} (${paymentIntentId}) has no valid licence IDs. Manual allocation is required.`,
    }).catch(() => {});
  }
  return handled;
}
/** Revoke only the licences created by the fully refunded order. */
export async function handleFlexFullRefund(paymentIntentId: string): Promise<boolean> {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return false;
    const licences = await findOrderLicences(tx, order.id);
    const ids = licences.filter(licence => licence.status !== "revoked").map(licence => licence.id);
    if (ids.length > 0) {
      await tx.update(teamFlexLicences)
        .set({
          status: "revoked",
          revokedAt: new Date(),
          revokeReason: "full_refund",
          previousStatus: null,
          suspendedAt: null,
          suspendedReason: null,
        })
        .where(inArray(teamFlexLicences.id, ids));
    }
    await tx.update(teamFlexOrders)
      .set({ status: "refunded" })
      .where(eq(teamFlexOrders.id, order.id));
    console.log(`[Course Pass Refund] Full refund revoked ${ids.length} licence(s) for order #${order.id}`);
    return true;
  });
}
/** Suspend only non-terminal licences created by the disputed order. */
export async function handleFlexDisputeCreated(paymentIntentId: string): Promise<boolean> {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return false;
    const licences = (await findOrderLicences(tx, order.id)).filter(
      licence => !["revoked", "expired", "suspended"].includes(licence.status),
    );
    const now = new Date();
    for (const licence of licences) {
      await tx.update(teamFlexLicences)
        .set({
          previousStatus: licence.status,
          status: "suspended",
          suspendedAt: now,
          suspendedReason: "dispute_pending",
        })
        // Guard on the status just read so a concurrent revocation is never overwritten.
        .where(and(eq(teamFlexLicences.id, licence.id), eq(teamFlexLicences.status, licence.status)));
    }
    // A refund that already landed is the stronger fact about the money.
    if (!REFUNDED_ORDER_STATES.has(order.status)) {
      await tx.update(teamFlexOrders)
        .set({ status: "disputed" })
        .where(eq(teamFlexOrders.id, order.id));
    }
    console.log(`[Course Pass Dispute] Suspended ${licences.length} licence(s) for order #${order.id}`);
    return true;
  });
}
/** Restore or revoke only licences that this order's dispute suspended. */
export async function handleFlexDisputeClosed(
  paymentIntentId: string,
  outcome: "won" | "lost",
): Promise<boolean> {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return false;
    const suspendedLicences = await findOrderLicences(tx, order.id, true);
    const now = new Date();
    // A win restores access only if the money is still with us. If a refund
    // already landed on this order, the refund decides and the licences stay
    // revoked; restoring them would give away a product that was paid back.
    const restore = outcome === "won" && !REFUNDED_ORDER_STATES.has(order.status);
    for (const licence of suspendedLicences) {
      await tx.update(teamFlexLicences)
        .set(restore ? {
          status: licence.previousStatus ?? "unused",
          previousStatus: null,
          suspendedAt: null,
          suspendedReason: null,
        } : {
          status: "revoked",
          revokedAt: now,
          revokeReason: outcome === "won" ? "refunded_before_dispute_closed" : "dispute_lost",
          previousStatus: null,
          suspendedAt: null,
          suspendedReason: null,
        })
        // Only a licence that is still suspended for this dispute may change.
        .where(and(
          eq(teamFlexLicences.id, licence.id),
          eq(teamFlexLicences.status, "suspended"),
          eq(teamFlexLicences.suspendedReason, "dispute_pending"),
        ));
    }
    if (!REFUNDED_ORDER_STATES.has(order.status)) {
      await tx.update(teamFlexOrders)
        .set({ status: outcome === "won" ? "paid" : "refunded" })
        .where(eq(teamFlexOrders.id, order.id));
    }
    console.log(`[Course Pass Dispute] ${outcome}: updated ${suspendedLicences.length} licence(s) for order #${order.id}`);
    return true;
  });
}
