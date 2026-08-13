/**
 * Teams Flex Order Fulfilment — production-hardened.
 * Called by Stripe after a team_flex Checkout Session is paid.
 *
 * Security guarantees:
 * - Idempotent: duplicate events do not create extra licences.
 * - Atomic: licence creation and the paid-state update share one transaction.
 * - Reconciled: Stripe's currency and pre-tax subtotal must match the order.
 * - Auditable: collected tax and total are stored separately from expected amounts.
 */
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  organizations,
  teamFlexLicences,
  teamFlexOrderItems,
  teamFlexOrders,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { addUtcCalendarMonths } from "./flexLicenceService";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { grantSeat } from "../routers/orgRouter";
import { sendManagerOnboardingEmail } from "../email";
import { ENV } from "../_core/env";
import { isProvisionalCoursePassOrganization } from "./flexCheckoutOrganization";

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
    amount_subtotal: number;
    amount_tax: number;
    currency: string;
    customer: string | null;
    payment_status: string;
  },
  teamFlexOrderId: number,
): Promise<FulfilFlexResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  if (stripeSession.payment_status !== "paid" && stripeSession.payment_status !== "no_payment_required") {
    return {
      success: false,
      orderId: teamFlexOrderId,
      licencesCreated: 0,
      error: "Checkout Session is not paid",
    };
  }

  const [order] = await db
    .select()
    .from(teamFlexOrders)
    .where(eq(teamFlexOrders.id, teamFlexOrderId))
    .limit(1);

  if (!order) {
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: "Order not found" };
  }
  if (order.status !== "pending" && order.status !== "paid") {
    return {
      success: false,
      orderId: teamFlexOrderId,
      licencesCreated: 0,
      error: `Order is ${order.status}`,
    };
  }

  const sessionCurrency = (stripeSession.currency || "").toLowerCase();
  if (sessionCurrency !== order.currency) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(and(eq(teamFlexOrders.id, teamFlexOrderId), eq(teamFlexOrders.status, "pending")));
    await notifyOwner({
      title: "⚠️ Flex Order Currency Mismatch",
      content: `Order #${teamFlexOrderId}: expected ${order.currency}, got ${sessionCurrency}.`,
    }).catch(() => {});
    return { success: false, orderId: teamFlexOrderId, licencesCreated: 0, error: "Currency mismatch" };
  }

  if (stripeSession.amount_subtotal !== order.totalBeforeTaxCents) {
    await db.update(teamFlexOrders)
      .set({ status: "reconciliation_needed" })
      .where(and(eq(teamFlexOrders.id, teamFlexOrderId), eq(teamFlexOrders.status, "pending")));
    await notifyOwner({
      title: "⚠️ Flex Order Amount Mismatch",
      content: `Order #${teamFlexOrderId}: expected pre-tax subtotal ${order.totalBeforeTaxCents} cents, got ${stripeSession.amount_subtotal} cents. Marked reconciliation_needed.`,
    }).catch(() => {});
    return {
      success: false,
      orderId: teamFlexOrderId,
      licencesCreated: 0,
      error: `Subtotal mismatch: expected ${order.totalBeforeTaxCents}, got ${stripeSession.amount_subtotal}`,
    };
  }

  const now = new Date();
  const fulfilment = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM team_flex_orders WHERE id = ${teamFlexOrderId} FOR UPDATE`);

    const [lockedOrder] = await tx
      .select()
      .from(teamFlexOrders)
      .where(eq(teamFlexOrders.id, teamFlexOrderId))
      .limit(1);

    if (!lockedOrder) throw new Error(`Flex order #${teamFlexOrderId} not found`);
    if (lockedOrder.status === "paid") {
      return {
        licencesCreated: 0,
        organizationId: lockedOrder.organizationId,
        managerEmail: lockedOrder.managerEmail,
      };
    }
    if (lockedOrder.status !== "pending") {
      throw new Error(`Flex order #${teamFlexOrderId} is ${lockedOrder.status}`);
    }

    const items = await tx
      .select()
      .from(teamFlexOrderItems)
      .where(eq(teamFlexOrderItems.orderId, teamFlexOrderId));
    const expectedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (items.length === 0 || expectedQuantity !== lockedOrder.totalLicences) {
      throw new Error(`Flex order #${teamFlexOrderId} item quantity does not reconcile`);
    }

    const [organization] = await tx
      .select()
      .from(organizations)
      .where(eq(organizations.id, lockedOrder.organizationId))
      .limit(1);
    if (!organization) {
      throw new Error(`Flex order #${teamFlexOrderId} has no valid organization`);
    }

    // A guest checkout creates a provisional Course Pass organization with no
    // membership or access. Payment is the authority that activates it.
    if (isProvisionalCoursePassOrganization(organization)) {
      await tx.update(organizations)
        .set({
          status: "active",
          stripeCustomerId: stripeSession.customer,
        })
        .where(eq(organizations.id, organization.id));
    }

    await grantSeat(
      tx as any,
      {
        id: organization.id,
        name: organization.name,
        province: organization.province,
        tier: organization.tier,
        termStart: organization.termStart,
        termEnd: organization.termEnd,
      },
      lockedOrder.managerEmail.toLowerCase().trim(),
      "manager",
    );

    const activationDeadline = addUtcCalendarMonths(now, ACTIVATION_DEADLINE_MONTHS);
    let created = 0;
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const canonicalCourseKey = resolveCourseKey(item.courseKey)?.courseKey;
        if (!canonicalCourseKey) throw new Error(`Unknown course key on Flex order item #${item.id}: ${item.courseKey}`);
        await tx.insert(teamFlexLicences).values({
          orderItemId: item.id,
          organizationId: lockedOrder.organizationId,
          courseKey: canonicalCourseKey,
          termMonths: item.termMonths,
          status: "unused",
          activationDeadline,
        });
        created++;
      }
    }

    await tx.update(teamFlexOrders)
      .set({
        status: "paid",
        paidAt: now,
        stripePaymentIntentId: stripeSession.payment_intent,
        stripeCustomerId: stripeSession.customer,
        taxCents: stripeSession.amount_tax,
        totalPaidCents: stripeSession.amount_total,
      })
      .where(and(eq(teamFlexOrders.id, teamFlexOrderId), eq(teamFlexOrders.status, "pending")));

    return {
      licencesCreated: created,
      organizationId: organization.id,
      managerEmail: lockedOrder.managerEmail,
    };
  });

  // Course Pass managers must be able to reach the dashboard after payment.
  // If email delivery fails, throw after the paid transaction commits so Stripe
  // retries the webhook; the next run is idempotent and retries only onboarding.
  const [fulfilledOrganization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, fulfilment.organizationId))
    .limit(1);
  if (
    fulfilledOrganization?.billingType === "course-pass" &&
    !fulfilledOrganization.onboardingEmailSentAt
  ) {
    await sendManagerOnboardingEmail({
      managerEmail: fulfilment.managerEmail,
      orgName: fulfilledOrganization.name,
      seats: order.totalLicences,
      tierLabel: "Course Passes",
      dashboardUrl: `${ENV.appBaseUrl}/account?next=/team`,
    });
    await db.update(organizations)
      .set({ onboardingEmailSentAt: new Date() })
      .where(eq(organizations.id, fulfilledOrganization.id));
  }

  console.log(`[Flex Fulfilment] Order #${teamFlexOrderId}: ${fulfilment.licencesCreated} licences created`);
  return {
    success: true,
    orderId: teamFlexOrderId,
    licencesCreated: fulfilment.licencesCreated,
    alreadyFulfilled: fulfilment.licencesCreated === 0,
  };
}

/** Handle Checkout Session expiration without overwriting a completed order. */
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

/** Handle an asynchronous payment failure without overwriting a completed order. */
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
