import { and, eq } from "drizzle-orm";
import { organizations, subscriptions, stripeEventLog } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";
import { sendManagerOnboardingEmail } from "../email";
import { grantSeat } from "../routers/orgRouter";
import {
  claimStripeEvent,
  markStripeEventCompleted,
  markStripeEventFailed,
  type Database,
} from "./eventLedger";
import { initializeOrganizationRenewalTerm } from "./renewalTerm";
import {
  TIER_LABELS,
  type SubscriptionProvince,
  type SubscriptionTier,
} from "./subscriptionProducts";

export interface ProvisionOrgInput {
  stripeEventId: string;
  eventType: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  orgName: string;
  managerEmail: string;
  province: SubscriptionProvince;
  tier: SubscriptionTier;
  seats: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date;
  status: "active" | "past_due" | "cancelled";
}

export type ProvisionOrgResult =
  | { state: "completed" | "already_completed"; orgId: number }
  | { state: "busy" }
  | { state: "retryable_failure"; error: string };

export interface ProvisionOrgDependencies {
  sendOnboardingEmail: typeof sendManagerOnboardingEmail;
  sendOwnerNotification: typeof notifyOwner;
  ensureManager: typeof grantSeat;
}

export const productionProvisionOrgDependencies: ProvisionOrgDependencies = {
  sendOnboardingEmail: sendManagerOnboardingEmail,
  sendOwnerNotification: notifyOwner,
  ensureManager: grantSeat,
};

export async function provisionOrgFromWebhook(
  db: Database,
  input: ProvisionOrgInput,
  dependencies: ProvisionOrgDependencies = productionProvisionOrgDependencies,
): Promise<ProvisionOrgResult> {
  const claim = await claimStripeEvent(db, {
    stripeEventId: input.stripeEventId,
    eventType: input.eventType,
    stripeObjectId: input.stripeSubscriptionId,
  });

  if (claim.state === "completed") {
    if (!claim.event.orgId) {
      throw new Error(`Completed event ${input.stripeEventId} has no organization ID`);
    }
    return { state: "already_completed", orgId: claim.event.orgId };
  }

  if (claim.state === "busy") {
    return { state: "busy" };
  }

  const { token } = claim;
  let orgId = claim.event.orgId ?? null;

  try {
    if (!claim.event.dbProcessed) {
      await db.transaction(async tx => {
        const existing = await tx
          .select()
          .from(organizations)
          .where(eq(organizations.stripeSubscriptionId, input.stripeSubscriptionId))
          .limit(1);

        let organization: typeof organizations.$inferSelect;

        if (existing.length === 0) {
          const [insertResult] = await tx.insert(organizations).values({
            name: input.orgName,
            province: input.province,
            tier: input.tier,
            seatsTotal: input.seats,
            managerEmail: input.managerEmail,
            stripeSubscriptionId: input.stripeSubscriptionId,
            stripeCustomerId: input.stripeCustomerId,
            termStart: input.currentPeriodStart,
            termEnd: input.currentPeriodEnd,
            billingType: "stripe",
            status: input.status,
          });

          orgId = Number((insertResult as any).insertId);

          const inserted = await tx
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

          organization = inserted[0];
        } else {
          orgId = existing[0].id;

          await tx.update(organizations).set({
            name: input.orgName,
            province: input.province,
            tier: input.tier,
            seatsTotal: input.seats,
            managerEmail: input.managerEmail,
            stripeCustomerId: input.stripeCustomerId,
            termStart: input.currentPeriodStart,
            termEnd: input.currentPeriodEnd,
            status: input.status,
          }).where(eq(organizations.id, orgId));

          const updated = await tx
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

          organization = updated[0];
        }

        if (!organization || !orgId) {
          throw new Error("Organization upsert failed");
        }

        // Always ensure the manager exists — repairs partial provisioning where
        // org was created but manager creation failed on a prior attempt.
        await dependencies.ensureManager(
          tx as any,
          {
            id: organization.id,
            name: organization.name,
            province: organization.province,
            tier: organization.tier,
            termStart: organization.termStart,
            termEnd: organization.termEnd,
          },
          input.managerEmail,
          "manager",
        );

        if (input.status === "active" || input.status === "past_due") {
          await tx.update(subscriptions)
            .set({ currentPeriodEnd: input.currentPeriodEnd })
            .where(and(
              eq(subscriptions.orgId, organization.id),
              eq(subscriptions.status, "active"),
            ));
        } else {
          await tx.update(subscriptions)
            .set({ status: "expired", currentPeriodEnd: input.currentPeriodEnd })
            .where(eq(subscriptions.orgId, organization.id));
        }

        // Seed renewal term ledger for existing orgs on renewal events
        if (existing.length > 0 && input.status === "active" && input.currentPeriodStart) {
          await initializeOrganizationRenewalTerm(
            tx as any,
            organization.id,
            input.currentPeriodStart,
            input.currentPeriodEnd,
          );
        }

        await tx.update(stripeEventLog).set({
          orgId: organization.id,
          dbProcessed: true,
          status: "db_completed_email_pending",
          lastError: null,
        }).where(and(
          eq(stripeEventLog.stripeEventId, input.stripeEventId),
          eq(stripeEventLog.processingToken, token),
        ));
      });
    }

    // Resolve orgId from ledger if not yet set (db was already processed on prior attempt)
    if (!orgId) {
      const eventRows = await db
        .select({ orgId: stripeEventLog.orgId })
        .from(stripeEventLog)
        .where(eq(stripeEventLog.stripeEventId, input.stripeEventId))
        .limit(1);
      orgId = eventRows[0]?.orgId ?? null;
    }

    if (!orgId) {
      throw new Error("Database processing completed without an organization ID");
    }

    const orgRows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const organization = orgRows[0];
    if (!organization) {
      throw new Error(`Organization ${orgId} was not found`);
    }

    // Send onboarding email if not yet delivered (DB flag is the guard)
    if (!organization.onboardingEmailSentAt) {
      await dependencies.sendOnboardingEmail({
        managerEmail: organization.managerEmail,
        orgName: organization.name,
        seats: organization.seatsTotal,
        tierLabel: TIER_LABELS[organization.tier as SubscriptionTier] ?? organization.tier,
        dashboardUrl: `${ENV.appBaseUrl}/account?next=/team`,
      });

      await db.update(organizations)
        .set({ onboardingEmailSentAt: new Date() })
        .where(eq(organizations.id, organization.id));
    }

    await markStripeEventCompleted(db, input.stripeEventId, token);

    dependencies.sendOwnerNotification({
      title: `Team plan provisioned: ${organization.name}`,
      content: `${organization.managerEmail} has access to ${organization.seatsTotal} operator licences.`,
    }).catch(() => {});

    return { state: "completed", orgId: organization.id };

  } catch (error) {
    await markStripeEventFailed(db, input.stripeEventId, token, error);
    return {
      state: "retryable_failure",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
