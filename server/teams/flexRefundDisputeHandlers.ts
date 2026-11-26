/**
 * Teams Course Pass refund and dispute handlers.
 *
 * Every mutation is scoped through order item IDs. An organization can place
 * several orders, so organizationId alone is never a safe refund boundary.
 */
import { and, eq, inArray, notInArray } from "drizzle-orm";
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
      suspendedReason: teamFlexLicences.suspendedReason,
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
/** Licence states that are already settled and must never be counted as live or revoked again. */
const SETTLED_LICENCE_STATES = new Set(["revoked", "cancelled"]);
const isLiveLicence = (licence: { status: string }) => !SETTLED_LICENCE_STATES.has(licence.status);
/** Stripe statuses that end a dispute. "warning_closed" is an inquiry closed in the merchant's favour. */
export type FlexDisputeOutcome = "won" | "lost";
export function flexDisputeOutcome(status: string | null | undefined): FlexDisputeOutcome | null {
  if (status === "won" || status === "warning_closed") return "won";
  if (status === "lost") return "lost";
  return null;
}
/** Order states in which some money has gone back. */
const REFUNDED_ORDER_STATES = new Set(["refunded", "partially_refunded"]);
/**
 * Order states that a dispute event must not overwrite. "disputed" is the
 * dispute's own marker; "reconciliation_needed" records an unallocated refund
 * a human still has to apply, and a dispute outcome does not settle it.
 */
const HOLD_ORDER_STATES = new Set(["disputed", "reconciliation_needed"]);
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
    const liveOrderLicenceIds = new Set(orderLicences.filter(isLiveLicence).map(licence => licence.id));
    // A refund that names a licence already revoked or cancelled is either a
    // duplicate or mis-keyed; a human allocates it rather than the handler
    // rewriting settled history and silently leaving other seats live.
    if (
      requestedIds.length === 0
      || requestedIds.length !== licenceIds.length
      || requestedIds.some(id => !liveOrderLicenceIds.has(id))
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
    const stillLive = orderLicences.filter(licence => isLiveLicence(licence) && !requestedIds.includes(licence.id)).length;
    // Every licence refunded one by one is a full refund. Otherwise an open
    // dispute or an outstanding reconciliation keeps its marker; the revoked
    // licences carry the refund evidence themselves.
    if (stillLive === 0) {
      await tx.update(teamFlexOrders).set({ status: "refunded" }).where(eq(teamFlexOrders.id, order.id));
    } else if (!HOLD_ORDER_STATES.has(order.status)) {
      await tx.update(teamFlexOrders)
        .set({ status: "partially_refunded" })
        .where(eq(teamFlexOrders.id, order.id));
    }
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
    // Stripe does not guarantee event order. A full refund already revoked
    // everything, so there is nothing left to allocate. A second partial
    // refund after an allocated one still needs a human to pick licences.
    if (order.status === "refunded") return true;
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
    const ids = licences.filter(isLiveLicence).map(licence => licence.id);
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
/**
 * Suspend only non-terminal licences created by the disputed order.
 *
 * Stripe does not guarantee delivery order, so `charge.dispute.created` can
 * arrive after `charge.dispute.closed`. The webhook passes the dispute's
 * current status as read from Stripe at handling time; when it is already
 * won or lost, the outcome is applied instead of suspending licences that no
 * later event would ever restore.
 */
export type FlexDisputeCreatedResult = { handled: false } | { handled: true; action: "suspended" | "already_closed" };
export async function handleFlexDisputeCreated(
  paymentIntentId: string,
  /**
   * Reads the dispute's status from Stripe. It is called after the order row
   * is locked so a closure that commits while this handler waits for the lock
   * is seen before any licence is suspended. A read failure propagates so the
   * webhook returns 503 and Stripe retries; a stale event status is never
   * used as a fallback. The caller bounds the read with a short timeout so
   * the order row lock is not held through a slow Stripe response.
   */
  readLiveStatus: () => Promise<string | null | undefined>,
): Promise<FlexDisputeCreatedResult> {
  const db = await requireDb();
  return db.transaction(async (tx): Promise<FlexDisputeCreatedResult> => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return { handled: false };
    const outcome = flexDisputeOutcome(await readLiveStatus());
    if (outcome) {
      await applyFlexDisputeOutcome(tx, order, outcome);
      return { handled: true, action: "already_closed" };
    }
    const licences = (await findOrderLicences(tx, order.id)).filter(
      licence => !["revoked", "expired", "suspended", "cancelled"].includes(licence.status),
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
    // A refund that already landed, or a refund still waiting to be allocated,
    // is the stronger fact about the money and keeps its marker.
    if (!REFUNDED_ORDER_STATES.has(order.status) && !HOLD_ORDER_STATES.has(order.status)) {
      await tx.update(teamFlexOrders)
        .set({ status: "disputed" })
        .where(eq(teamFlexOrders.id, order.id));
    }
    console.log(`[Course Pass Dispute] Suspended ${licences.length} licence(s) for order #${order.id}`);
    return { handled: true, action: "suspended" };
  });
}
/** Restore or revoke only licences that this order's dispute suspended. */
export async function handleFlexDisputeClosed(
  paymentIntentId: string,
  outcome: FlexDisputeOutcome,
): Promise<boolean> {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const order = await lockFlexOrder(tx, paymentIntentId);
    if (!order) return false;
    await applyFlexDisputeOutcome(tx, order, outcome);
    return true;
  });
}
/** Apply a terminal dispute outcome to an order whose row the caller has locked. */
async function applyFlexDisputeOutcome(
  tx: Tx,
  order: { id: number; status: string },
  outcome: FlexDisputeOutcome,
): Promise<void> {
    const now = new Date();
    // One locked read of every licence on the order; the paths below filter in memory.
    const all = await findOrderLicences(tx, order.id);
    if (outcome === "lost") {
      // The card network took the whole charge back. Every live licence goes,
      // whether or not the creation event was processed first, so a reversed
      // delivery order cannot leave access open. Cancelled licences keep
      // their own history.
      const live = all.filter(isLiveLicence);
      if (live.length > 0) {
        await tx.update(teamFlexLicences)
          .set({ status: "revoked", revokedAt: now, revokeReason: "dispute_lost", previousStatus: null, suspendedAt: null, suspendedReason: null })
          .where(and(inArray(teamFlexLicences.id, live.map(licence => licence.id)), notInArray(teamFlexLicences.status, [...SETTLED_LICENCE_STATES])));
      }
      await tx.update(teamFlexOrders).set({ status: "refunded" }).where(eq(teamFlexOrders.id, order.id));
      console.log(`[Course Pass Dispute] lost: revoked ${live.length} licence(s) for order #${order.id}`);
      return;
    }
    const suspendedLicences = all.filter(licence => licence.status === "suspended" && licence.suspendedReason === "dispute_pending");
    // A win restores the licences this dispute suspended, unless the whole
    // order was refunded in the meantime; then the refund is the last word
    // on the money. A partial refund has already revoked exactly the licences
    // it paid back, and those are excluded here by the suspended filter, so
    // the remaining paid licences are restored.
    const restore = outcome === "won" && order.status !== "refunded";
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
          revokeReason: "refunded_before_dispute_closed",
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
    // An unallocated refund still waiting for a human keeps its marker; a win
    // says nothing about where that money should be applied.
    if (order.status !== "refunded" && order.status !== "reconciliation_needed") {
      // Restored licences are live again; cancelled ones never count either way.
      const countable = all.filter(licence => licence.status !== "cancelled");
      // When restoring, the suspended licences are live again. When not, they were just revoked.
      const remaining = countable.filter(licence => licence.status !== "revoked" && (restore || !suspendedLicences.includes(licence))).length;
      const settled = remaining === 0 ? "refunded" : remaining < countable.length ? "partially_refunded" : "paid";
      await tx.update(teamFlexOrders)
        .set({ status: settled })
        .where(eq(teamFlexOrders.id, order.id));
    }
    console.log(`[Course Pass Dispute] ${outcome}: updated ${suspendedLicences.length} licence(s) for order #${order.id}`);
}
