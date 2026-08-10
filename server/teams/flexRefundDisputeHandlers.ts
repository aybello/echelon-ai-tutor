/**
 * Teams Flex Refund & Dispute Handlers
 * Handles: refund.created, charge.refunded, charge.dispute.created, charge.dispute.closed
 */
import { eq, and, inArray, ne } from "drizzle-orm";
import { getDb } from "../db";
import { teamFlexOrders, teamFlexLicences } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

// ─── Refund Handlers ──────────────────────────────────────────────────────────

/**
 * Handle explicit partial refund with licence IDs in metadata.
 * Revokes only the specified licences.
 */
export async function handleFlexPartialRefund(
  paymentIntentId: string,
  licenceIds: number[],
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  for (const licenceId of licenceIds) {
    await db.update(teamFlexLicences)
      .set({
        status: "revoked",
        revokedAt: now,
        revokeReason: "refund",
      })
      .where(eq(teamFlexLicences.id, licenceId));
  }

  console.log(`[Flex Refund] Revoked ${licenceIds.length} licences for PI ${paymentIntentId}`);
}

/**
 * Handle unallocated refund (no licence IDs in metadata).
 * Marks the order as reconciliation_needed.
 */
export async function handleFlexUnallocatedRefund(
  paymentIntentId: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(teamFlexOrders)
    .set({ status: "reconciliation_needed" })
    .where(eq(teamFlexOrders.stripePaymentIntentId, paymentIntentId));

  await notifyOwner({
    title: "⚠️ Flex Refund: Reconciliation Needed",
    content: `Refund on PI ${paymentIntentId} has no licenceIds metadata. Manual allocation required.`,
  }).catch(() => {});
}

/**
 * Handle full refund (charge.refunded event).
 * Revokes ALL licences for the order.
 */
export async function handleFlexFullRefund(
  paymentIntentId: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find the order
  const [order] = await db
    .select({ id: teamFlexOrders.id })
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!order) return;

  const now = new Date();
  await db.update(teamFlexOrders)
    .set({ status: "refunded" })
    .where(eq(teamFlexOrders.id, order.id));

  // Revoke all non-terminal licences
  await db.update(teamFlexLicences)
    .set({
      status: "revoked",
      revokedAt: now,
      revokeReason: "full_refund",
    })
    .where(and(
      eq(teamFlexLicences.organizationId, order.id),
      ne(teamFlexLicences.status, "revoked"),
    ));

  console.log(`[Flex Refund] Full refund: all licences revoked for order #${order.id}`);
}

// ─── Dispute Handlers ─────────────────────────────────────────────────────────

/**
 * Handle charge.dispute.created — suspend all licences for the order.
 */
export async function handleFlexDisputeCreated(
  paymentIntentId: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [order] = await db
    .select({ id: teamFlexOrders.id, organizationId: teamFlexOrders.organizationId })
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!order) return;

  // Get all non-terminal licences for this order's org
  const licences = await db
    .select({ id: teamFlexLicences.id, status: teamFlexLicences.status })
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.organizationId, order.organizationId),
      ne(teamFlexLicences.status, "revoked"),
      ne(teamFlexLicences.status, "expired"),
    ));

  const now = new Date();
  for (const lic of licences) {
    await db.update(teamFlexLicences)
      .set({
        previousStatus: lic.status,
        status: "suspended",
        suspendedAt: now,
        suspendedReason: "dispute_pending",
      })
      .where(eq(teamFlexLicences.id, lic.id));
  }

  await db.update(teamFlexOrders)
    .set({ status: "disputed" })
    .where(eq(teamFlexOrders.id, order.id));

  console.log(`[Flex Dispute] Suspended ${licences.length} licences for order #${order.id}`);
}

/**
 * Handle charge.dispute.closed — restore or revoke based on outcome.
 */
export async function handleFlexDisputeClosed(
  paymentIntentId: string,
  outcome: "won" | "lost",
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [order] = await db
    .select({ id: teamFlexOrders.id, organizationId: teamFlexOrders.organizationId })
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!order) return;

  const suspendedLicences = await db
    .select({ id: teamFlexLicences.id, previousStatus: teamFlexLicences.previousStatus })
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.organizationId, order.organizationId),
      eq(teamFlexLicences.status, "suspended"),
    ));

  const now = new Date();

  if (outcome === "won") {
    // Restore to previousStatus
    for (const lic of suspendedLicences) {
      await db.update(teamFlexLicences)
        .set({
          status: lic.previousStatus ?? "active",
          previousStatus: null,
          suspendedAt: null,
          suspendedReason: null,
        })
        .where(eq(teamFlexLicences.id, lic.id));
    }
    await db.update(teamFlexOrders)
      .set({ status: "paid" })
      .where(eq(teamFlexOrders.id, order.id));
    console.log(`[Flex Dispute] Won: restored ${suspendedLicences.length} licences for order #${order.id}`);
  } else {
    // Revoke all
    for (const lic of suspendedLicences) {
      await db.update(teamFlexLicences)
        .set({
          status: "revoked",
          revokedAt: now,
          revokeReason: "dispute_lost",
        })
        .where(eq(teamFlexLicences.id, lic.id));
    }
    await db.update(teamFlexOrders)
      .set({ status: "refunded" })
      .where(eq(teamFlexOrders.id, order.id));
    console.log(`[Flex Dispute] Lost: revoked ${suspendedLicences.length} licences for order #${order.id}`);
  }
}
