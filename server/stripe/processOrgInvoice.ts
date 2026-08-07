import { and, eq, sql } from "drizzle-orm";
import { organizations, subscriptions } from "../../drizzle/schema";
import { sendOrgPaymentConfirmationEmail } from "../email";
import { getOrganizationTierLabel } from "./subscriptionProducts";
import {
  claimStripeEvent,
  markStripeEventCompleted,
  markStripeEventFailed,
  type Database,
} from "./eventLedger";
import { getSubscriptionPeriod } from "./subscriptionPeriod";
import { stripe } from "./stripe";

export type InvoiceSubscriptionRoute =
  | "organization"
  | "organization_pending"
  | "individual";

export function classifyInvoiceSubscription(input: {
  isOrganizationSubscription: boolean;
  organizationExists: boolean;
}): InvoiceSubscriptionRoute {
  if (input.isOrganizationSubscription && !input.organizationExists) {
    return "organization_pending";
  }
  if (input.isOrganizationSubscription) {
    return "organization";
  }
  return "individual";
}

export interface ProcessOrgInvoiceInput {
  stripeEventId: string;
  stripeInvoiceId: string;
  stripeSubscriptionId: string;
  amountPaid: number;
  billingReason: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  organization: {
    id: number;
    name: string;
    managerEmail: string;
    tier: string;
    seatsTotal: number;
    status: string;
  };
}

export type ProcessOrgInvoiceResult =
  | { state: "completed" | "already_completed" }
  | { state: "retryable_failure"; error: string };

export interface ProcessOrgInvoiceDependencies {
  sendPaymentEmail: typeof sendOrgPaymentConfirmationEmail;
  retrieveSubscription: (id: string) => Promise<{ current_period_start: number; current_period_end: number }>;
}

export const productionProcessOrgInvoiceDependencies: ProcessOrgInvoiceDependencies = {
  sendPaymentEmail: sendOrgPaymentConfirmationEmail,
  retrieveSubscription: async (id: string) => {
    const sub = await stripe.subscriptions.retrieve(id) as any;
    return { current_period_start: sub.current_period_start, current_period_end: sub.current_period_end };
  },
};

export async function processOrgInvoice(
  db: Database,
  input: ProcessOrgInvoiceInput,
  dependencies: ProcessOrgInvoiceDependencies = productionProcessOrgInvoiceDependencies,
): Promise<ProcessOrgInvoiceResult> {
  const claim = await claimStripeEvent(db, {
    stripeEventId: input.stripeEventId,
    eventType: "invoice.payment_succeeded",
    stripeObjectId: input.stripeInvoiceId,
    orgId: input.organization.id,
  });

  if (claim.state === "completed") {
    return { state: "already_completed" };
  }

  if (claim.state === "busy") {
    // Return retryable so the webhook returns 503 and Stripe retries
    return { state: "retryable_failure", error: "Event is already being processed" };
  }

  const { token } = claim;

  try {
    let currentPeriodEnd: Date | null = null;
    let currentPeriodStart: Date | null = null;

      if (!claim.event.dbProcessed) {
        const subData = await dependencies.retrieveSubscription(input.stripeSubscriptionId);
        const fakeSub = { current_period_start: subData.current_period_start, current_period_end: subData.current_period_end };
        const period = getSubscriptionPeriod(fakeSub as any);
        currentPeriodEnd = period.currentPeriodEnd;
        currentPeriodStart = period.currentPeriodStart;

      if (!currentPeriodEnd) {
        throw new Error(`Could not resolve currentPeriodEnd for org invoice ${input.stripeInvoiceId}`);
      }

      await db.update(organizations)
        .set({
          status: "active",
          termEnd: currentPeriodEnd,
          ...(currentPeriodStart ? { termStart: currentPeriodStart } : {}),
        })
        .where(eq(organizations.id, input.organization.id));

      await db.update(subscriptions)
        .set({ status: "active", currentPeriodEnd })
        .where(and(
          eq(subscriptions.orgId, input.organization.id),
          eq(subscriptions.status, "active"),
        ));

      // Mark DB work done but email still pending
      // Use raw SQL to update within the same token guard
      await db.execute(sql`
        UPDATE stripe_event_log
        SET
          dbProcessed = true,
          status = 'db_completed_email_pending',
          lastError = NULL
        WHERE stripeEventId = ${input.stripeEventId}
          AND processingToken = ${token}
      `);
    } else {
      // DB already done on prior attempt — re-fetch period end from org row
      const orgRow = await db.select({ termEnd: organizations.termEnd }).from(organizations).where(eq(organizations.id, input.organization.id)).limit(1);
      currentPeriodEnd = orgRow[0]?.termEnd ?? null;
    }

    if (!currentPeriodEnd) {
      throw new Error("Could not resolve period end for payment email");
    }

    // Determine email language from billing_reason
    const billingReason = input.billingReason ?? "";
    const amountFormatted = `CA$${(input.amountPaid / 100).toFixed(2)}`;

    await dependencies.sendPaymentEmail({
      managerEmail: input.organization.managerEmail,
      orgName: input.organization.name,
      seats: input.organization.seatsTotal,
      tierLabel: getOrganizationTierLabel(input.organization.tier),
      amountFormatted,
      periodEnd: currentPeriodEnd,
      hostedInvoiceUrl: input.hostedInvoiceUrl,
      invoicePdfUrl: input.invoicePdfUrl,
      billingReason,
    });

    await markStripeEventCompleted(db, input.stripeEventId, token);
    return { state: "completed" };

  } catch (error) {
    await markStripeEventFailed(db, input.stripeEventId, token, error);
    return {
      state: "retryable_failure",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
