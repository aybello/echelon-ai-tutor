/**
 * Teams Flex Order Fulfilment — Production-hardened
 * Called by the Stripe webhook when checkout.session.completed fires for a team_flex order.
 * 
 * Security guarantees:
 * - Idempotent: duplicate events return already-completed result without creating extra licences
 * - Atomic claim: uses affected-rows to prevent concurrent fulfilment
 * - Amount reconciliation: Stripe's pre-tax subtotal must match internal expected total
 * - Collected amounts stored separately from expected amounts
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  teamFlexOrders,
  teamFlexOrderItems,
  teamFlexLicences,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

const ACTIVATION_DEADLINE_MONTHS = 12;

export interface FulfilFlexResult {
  success: boolean;
  orderId: number;
  licencesCreated: number;
  error?: string;
  alreadyFulfilled?: boolean;
}

export async function fulfilFlexOrder(
  stripeSession: {
    id: string;
    payment_intent: string | null;
    amount_total: number;
    amount_subtotal?: number;
    total_details?: { amount_tax?: number };
    currency: string;
    customer: string | null;
    payment_status: string;
  },
  teamFlexOrderId: number,
): Promise<FulfilFlexResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // ── 1. Atomic claim: only one webhook event can fulfil this order ──────────
  const claimResult = await db.update(teamFlexOrders)
    .set({ status: "fulfilling" })
    .where(and(
      eq(teamFlexOrders.id, teamFlexOrderId),
      eq(teamFlexOrders.status, "pending"),
    ));

  const affectedRows = (claimResult as any)[0]?.affectedRows ?? (claimResult as any).affectedRows ?? 0;

  if (affectedRows === 0) {
    // Either already fulfilled or doesn't exist
    const [existing] = await db
      .select({ id: teamFlexOrders.id, status: teamFlexOrders.status })
      .from(teamFlexOrders)
      .where(eq(teamFlexOrders.id, teamFlexOrderId))
      .limit(1);

    if (existing?.status === "paid" || existing?.status === "fulfilling") {
      return { success: true, orderId: teamFlexOrderId, licencesCreated: 0, alreadyFulfilled: true };
    }
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: "Order not found or not pending" };
  }

  // ── 2. Verify payment status ───────────────────────────────────────────────
  if (stripeSession.payment_status !== "paid") {
    await db.update(teamFlexOrders)
      .set({ status: "pending" })
      .where(eq(teamFlexOrders.id, teamFlexOrderId));
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: `Payment not complete: ${stripeSession.payment_status}` };
  }

  // ── 3. Load the order for reconciliation ───────────────────────────────────
  const [order] = await db
    .select()
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.id, teamFlexOrderId))
    .limit(1);

  if (!order) {
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: "Order disappeared after claim" };
  }

  // ── 4. Reconcile amount and currency ───────────────────────────────────────
  const sessionCurrency = (stripeSession.currency || "").toLowerCase();
  if (sessionCurrency !== order.currency) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(eq(teamFlexOrders.id, teamFlexOrderId));
    await notifyOwner({
      title: "⚠️ Flex Order Currency Mismatch",
      content: `Order #${teamFlexOrderId}: expected ${order.currency}, got ${sessionCurrency}.`,
    }).catch(() => {});
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: `Currency mismatch` };
  }

  // Reconcile pre-tax subtotal against our expected totalBeforeTaxCents
  const stripeSubtotal = stripeSession.amount_subtotal ?? stripeSession.amount_total;
  const stripeTax = stripeSession.total_details?.amount_tax ?? 0;
  const expectedPreTax = order.totalBeforeTaxCents;

  if (stripeSubtotal !== expectedPreTax) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(eq(teamFlexOrders.id, teamFlexOrderId));
    await notifyOwner({
      title: "⚠️ Flex Order Amount Mismatch",
      content: `Order #${teamFlexOrderId}: expected pre-tax ${expectedPreTax}¢, Stripe subtotal ${stripeSubtotal}¢.`,
    }).catch(() => {});
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: `Amount mismatch` };
  }

  // ── 5. Store collected payment details ─────────────────────────────────────
  const now = new Date();
  await db.update(teamFlexOrders)
    .set({
      taxCents: stripeTax,
      totalPaidCents: stripeSession.amount_total,
      paidAt: now,
      stripePaymentIntentId: stripeSession.payment_intent,
      stripeCustomerId: stripeSession.customer,
    })
    .where(eq(teamFlexOrders.id, teamFlexOrderId));

  // ── 6. Load order items ────────────────────────────────────────────────────
  const items = await db
    .select()
    .from(teamFlexOrderItems)
    .where(eq(teamFlexOrderItems.orderId, teamFlexOrderId));

  // ── 7. Create licences ─────────────────────────────────────────────────────
  const activationDeadline = new Date(now);
  activationDeadline.setMonth(activationDeadline.getMonth() + ACTIVATION_DEADLINE_MONTHS);

  let licencesCreated = 0;
  try {
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        await db.insert(teamFlexLicences).values({
          orderItemId: item.id,
          organizationId: order.organizationId,
          courseKey: item.courseKey,
          termMonths: item.termMonths,
          status: "unused",
          activationDeadline,
        });
        licencesCreated++;
      }
    }
  } catch (err) {
    await db.update(teamFlexOrders)
      .set({ status: "fulfilment_error" })
      .where(eq(teamFlexOrders.id, teamFlexOrderId));
    await notifyOwner({
      title: "🚨 Flex Fulfilment Error",
      content: `Order #${teamFlexOrderId}: licence creation failed after ${licencesCreated}. Error: ${(err as Error).message}`,
    }).catch(() => {});
    return { success: false, orderId: teamFlexOrderId, licencesCreated, error: `Licence creation failed` };
  }

  // ── 8. Mark order as paid ──────────────────────────────────────────────────
  await db.update(teamFlexOrders)
    .set({ status: "paid" })
    .where(eq(teamFlexOrders.id, teamFlexOrderId));

  console.log(`[Flex Fulfilment] Order #${teamFlexOrderId}: ${licencesCreated} licences created`);
  return { success: true, orderId: teamFlexOrderId, licencesCreated };
}

/** Handle checkout session expiration — mark order as expired. */
export async function handleFlexCheckoutExpired(teamFlexOrderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(teamFlexOrders)
    .set({ status: "expired" })
    .where(and(
      eq(teamFlexOrders.id, teamFlexOrderId),
      eq(teamFlexOrders.status, "pending"),
    ));
}

/** Handle async payment failure — mark order as payment_failed. */
export async function handleFlexPaymentFailed(teamFlexOrderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(teamFlexOrders)
    .set({ status: "payment_failed" })
    .where(and(
      eq(teamFlexOrders.id, teamFlexOrderId),
      eq(teamFlexOrders.status, "pending"),
    ));
}
