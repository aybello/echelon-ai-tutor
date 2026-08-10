/**
 * Teams Flex Order Fulfilment
 * Called by the Stripe webhook when checkout.session.completed fires for a team_flex order.
 * Verifies amount/currency match, then creates individual licences from order items.
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
}

export async function fulfilFlexOrder(
  stripeSession: {
    id: string;
    payment_intent: string | null;
    amount_total: number;
    currency: string;
    customer: string | null;
    payment_status: string;
  },
  teamFlexOrderId: number,
): Promise<FulfilFlexResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // 1. Load the pending order
  const [order] = await db
    .select()
    .from(teamFlexOrders)
    .where(and(
      eq(teamFlexOrders.id, teamFlexOrderId),
      eq(teamFlexOrders.status, "pending"),
    ))
    .limit(1);

  if (!order) {
    // Already fulfilled or doesn't exist — idempotent
    const [existing] = await db
      .select({ id: teamFlexOrders.id, status: teamFlexOrders.status })
      .from(teamFlexOrders)
      .where(eq(teamFlexOrders.id, teamFlexOrderId))
      .limit(1);
    if (existing?.status === "paid") {
      return { success: true, orderId: teamFlexOrderId, licencesCreated: 0 };
    }
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: "Order not found or not pending" };
  }

  // 2. Verify amount and currency
  const sessionAmountCents = stripeSession.amount_total;
  const sessionCurrency = (stripeSession.currency || "").toLowerCase();

  if (sessionCurrency !== order.currency) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(eq(teamFlexOrders.id, teamFlexOrderId));
    await notifyOwner({
      title: "⚠️ Flex Order Currency Mismatch",
      content: `Order #${teamFlexOrderId}: expected ${order.currency}, got ${sessionCurrency}. Marked reconciliation_needed.`,
    }).catch(() => {});
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: `Currency mismatch: expected ${order.currency}, got ${sessionCurrency}` };
  }

  if (sessionAmountCents !== order.totalPaidCents) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(eq(teamFlexOrders.id, teamFlexOrderId));
    await notifyOwner({
      title: "⚠️ Flex Order Amount Mismatch",
      content: `Order #${teamFlexOrderId}: expected ${order.totalPaidCents} cents, got ${sessionAmountCents} cents. Marked reconciliation_needed.`,
    }).catch(() => {});
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: `Amount mismatch: expected ${order.totalPaidCents}, got ${sessionAmountCents}` };
  }

  // 3. Mark order as paid
  const now = new Date();
  await db.update(teamFlexOrders)
    .set({
      status: "paid",
      paidAt: now,
      stripePaymentIntentId: stripeSession.payment_intent,
      stripeCustomerId: stripeSession.customer,
    })
    .where(eq(teamFlexOrders.id, teamFlexOrderId));

  // 4. Load order items
  const items = await db
    .select()
    .from(teamFlexOrderItems)
    .where(eq(teamFlexOrderItems.orderId, teamFlexOrderId));

  // 5. Create licences for each item × quantity
  const activationDeadline = new Date(now);
  activationDeadline.setMonth(activationDeadline.getMonth() + ACTIVATION_DEADLINE_MONTHS);

  let licencesCreated = 0;
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

  console.log(`[Flex Fulfilment] Order #${teamFlexOrderId}: ${licencesCreated} licences created`);
  return { success: true, orderId: teamFlexOrderId, licencesCreated };
}
