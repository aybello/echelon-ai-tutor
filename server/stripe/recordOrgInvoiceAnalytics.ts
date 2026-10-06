import { eq, sql } from "drizzle-orm";
import { productAnalyticsEvents, stripeEventLog } from "../../drizzle/schema";
import { resolveAnalyticsHashes } from "../analytics";
import type { Database } from "./eventLedger";

export interface OrganizationInvoiceConversionInput {
  stripeEventId: string;
  org: {
    id: number;
    managerEmail: string;
    tier: string;
    seatsTotal: number;
  };
  identityHash?: string | null;
  attribution: {
    source: string;
    device: string;
    province: string;
    surface: string;
  };
}

const ANALYTICS_SOURCES = new Set([
  "campaign",
  "direct",
  "organic",
  "referral",
  "social",
]);
const ANALYTICS_DEVICES = new Set(["desktop", "mobile", "tablet"]);
const ANALYTICS_PROVINCES = new Set(["ontario", "western", "unknown"]);

function allowedValue(value: string, allowed: Set<string>, fallback: string): string {
  return allowed.has(value) ? value : fallback;
}

function sanitizeAttribution(attribution: OrganizationInvoiceConversionInput["attribution"]) {
  return {
    source: allowedValue(attribution.source, ANALYTICS_SOURCES, "unknown"),
    device: allowedValue(attribution.device, ANALYTICS_DEVICES, "unknown"),
    province: allowedValue(attribution.province, ANALYTICS_PROVINCES, "unknown"),
    surface: attribution.surface === "teams" ? "teams" : "unknown",
  };
}

function affectedRows(result: unknown): number {
  const candidate = result as any;
  return Number(candidate?.[0]?.affectedRows ?? candidate?.affectedRows ?? 0);
}

/**
 * Writes the three team conversion events once for a paid Stripe invoice.
 * The ledger flag and analytic inserts share one database transaction. If the
 * process fails before commit, a replay of the same invoice can safely retry.
 */
export async function recordOrganizationInvoiceConversion(
  db: Database,
  input: OrganizationInvoiceConversionInput,
): Promise<"recorded" | "already_recorded"> {
  return db.transaction(async (tx) => {
    const claimed = await tx.execute(sql`
      UPDATE stripe_event_log
      SET analyticsProcessed = true
      WHERE stripeEventId = ${input.stripeEventId}
        AND status = 'completed'
        AND analyticsProcessed = false
    `);

    if (affectedRows(claimed) !== 1) {
      const [event] = await tx
        .select({
          status: stripeEventLog.status,
          analyticsProcessed: stripeEventLog.analyticsProcessed,
        })
        .from(stripeEventLog)
        .where(eq(stripeEventLog.stripeEventId, input.stripeEventId))
        .limit(1);
      if (event?.analyticsProcessed) return "already_recorded";
      throw new Error(
        `Cannot record organization invoice analytics for ${input.stripeEventId}: ` +
          (event ? `ledger status is ${event.status}` : "ledger entry is missing")
      );
    }

    const identities = resolveAnalyticsHashes({
      email: input.org.managerEmail,
      identityHash: input.identityHash ?? null,
      anonymousId: null,
    });
    const occurredAt = new Date();
    const shared = {
      orgId: input.org.id,
      emailHash: identities.emailHash,
      anonymousHash: identities.anonymousHash,
      productKey: "teams-annual",
      occurredAt,
    };
    const context = {
      subscriptionType: "organization",
      tier: input.org.tier,
      seats: input.org.seatsTotal,
      paymentStatus: "paid",
      ...sanitizeAttribution(input.attribution),
    };

    await tx.insert(productAnalyticsEvents).values([
      {
        ...shared,
        eventName: "subscription_created",
        productKey: "teams-all-access",
        metadata: JSON.stringify(context),
      },
      {
        ...shared,
        eventName: "checkout_completed",
        metadata: JSON.stringify(context),
      },
      {
        ...shared,
        eventName: "access_activated",
        metadata: JSON.stringify({
          ...context,
          activationType: "organization_subscription",
        }),
      },
    ]);

    return "recorded";
  });
}

export async function organizationInvoiceAnalyticsRecorded(
  db: Database,
  stripeEventId: string,
): Promise<boolean> {
  const [event] = await db
    .select({ analyticsProcessed: stripeEventLog.analyticsProcessed })
    .from(stripeEventLog)
    .where(eq(stripeEventLog.stripeEventId, stripeEventId))
    .limit(1);
  return Boolean(event?.analyticsProcessed);
}
