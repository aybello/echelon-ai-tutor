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

async function requireDb(): Promise<Database> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

async function findFlexOrder(db: Database, paymentIntentId: string) {
  const [order] = await db
    .select({
      id: teamFlexOrders.id,
      organizationId: teamFlexOrders.organizationId,
      status: teamFlexOrders.status,
    })
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  return order ?? null;
}

async function findOrderLicences(db: Database, orderId: number, onlySuspended = false) {
  return db
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
    ));
}

/** Return true when the payment intent belongs to a Course Pass order. */
export async function handleFlexPartialRefund(
  paymentIntentId: string,
  licenceIds: number[],
): Promise<boolean> {
  const db = await requireDb();
  const order = await findFlexOrder(db, paymentIntentId);
  if (!order) return false;
  if (order.status === "refunded") return true;

  const requestedIds = [...new Set(licenceIds)].filter(id => Number.isInteger(id) && id > 0);
  const orderLicences = await findOrderLicences(db, order.id);
  const orderLicenceIds = new Set(orderLicences.map(licence => licence.id));

  if (
    requestedIds.length === 0
    || requestedIds.length !== licenceIds.length
    || requestedIds.some(id => !orderLicenceIds.has(id))
  ) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(eq(teamFlexOrders.id, order.id));
    await notifyOwner({
      title: "⚠️ Course Pass refund needs reconciliation",
      content: `Refund metadata for order #${order.id} did not contain a valid, order-scoped licence list. No licences were automatically revoked.`,
    }).catch(() => {});
    return true;
  }

  await db.update(teamFlexLicences)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      revokeReason: "partial_refund",
      previousStatus: null,
      suspendedAt: null,
      suspendedReason: null,
    })
    .where(inArray(teamFlexLicences.id, requestedIds));
  await db.update(teamFlexOrders)
    .set({ status: "partially_refunded" })
    .where(eq(teamFlexOrders.id, order.id));

  console.log(`[Course Pass Refund] Revoked ${requestedIds.length} licence(s) for order #${order.id}`);
  return true;
}

/** Mark an unattributed partial Course Pass refund for manual allocation. */
export async function handleFlexUnallocatedRefund(paymentIntentId: string): Promise<boolean> {
  const db = await requireDb();
  const order = await findFlexOrder(db, paymentIntentId);
  if (!order) return false;
  // Stripe does not guarantee event order. Do not let a later generic event
  // downgrade a refund that was already resolved by a more specific event.
  if (order.status === "refunded" || order.status === "partially_refunded") return true;

  await db.update(teamFlexOrders)
    .set({ status: "reconciliation_needed" })
    .where(eq(teamFlexOrders.id, order.id));
  await notifyOwner({
    title: "⚠️ Course Pass refund needs reconciliation",
    content: `Partial refund on order #${order.id} (${paymentIntentId}) has no valid licence IDs. Manual allocation is required.`,
  }).catch(() => {});
  return true;
}

/** Revoke only the licences created by the fully refunded order. */
export async function handleFlexFullRefund(paymentIntentId: string): Promise<boolean> {
  const db = await requireDb();
  const order = await findFlexOrder(db, paymentIntentId);
  if (!order) return false;
  const licences = await findOrderLicences(db, order.id);
  const ids = licences.filter(licence => licence.status !== "revoked").map(licence => licence.id);

  if (ids.length > 0) {
    await db.update(teamFlexLicences)
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
  await db.update(teamFlexOrders)
    .set({ status: "refunded" })
    .where(eq(teamFlexOrders.id, order.id));

  console.log(`[Course Pass Refund] Full refund revoked ${ids.length} licence(s) for order #${order.id}`);
  return true;
}

/** Suspend only non-terminal licences created by the disputed order. */
export async function handleFlexDisputeCreated(paymentIntentId: string): Promise<boolean> {
  const db = await requireDb();
  const order = await findFlexOrder(db, paymentIntentId);
  if (!order) return false;
  const licences = (await findOrderLicences(db, order.id)).filter(
    licence => !["revoked", "expired", "suspended"].includes(licence.status),
  );

  const now = new Date();
  for (const licence of licences) {
    await db.update(teamFlexLicences)
      .set({
        previousStatus: licence.status,
        status: "suspended",
        suspendedAt: now,
        suspendedReason: "dispute_pending",
      })
      .where(eq(teamFlexLicences.id, licence.id));
  }
  await db.update(teamFlexOrders)
    .set({ status: "disputed" })
    .where(eq(teamFlexOrders.id, order.id));

  console.log(`[Course Pass Dispute] Suspended ${licences.length} licence(s) for order #${order.id}`);
  return true;
}

/** Restore or revoke only licences that this order's dispute suspended. */
export async function handleFlexDisputeClosed(
  paymentIntentId: string,
  outcome: "won" | "lost",
): Promise<boolean> {
  const db = await requireDb();
  const order = await findFlexOrder(db, paymentIntentId);
  if (!order) return false;
  const suspendedLicences = await findOrderLicences(db, order.id, true);

  const now = new Date();
  for (const licence of suspendedLicences) {
    await db.update(teamFlexLicences)
      .set(outcome === "won" ? {
        status: licence.previousStatus ?? "unused",
        previousStatus: null,
        suspendedAt: null,
        suspendedReason: null,
      } : {
        status: "revoked",
        revokedAt: now,
        revokeReason: "dispute_lost",
        previousStatus: null,
        suspendedAt: null,
        suspendedReason: null,
      })
      .where(eq(teamFlexLicences.id, licence.id));
  }
  await db.update(teamFlexOrders)
    .set({ status: outcome === "won" ? "paid" : "refunded" })
    .where(eq(teamFlexOrders.id, order.id));

  console.log(`[Course Pass Dispute] ${outcome}: updated ${suspendedLicences.length} licence(s) for order #${order.id}`);
  return true;
}
