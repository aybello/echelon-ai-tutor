/**
 * Stripe purchase reconciliation helper.
 * Can be called from the admin tRPC procedure OR the scheduled cron job.
 * It reports missing paid sessions but never grants learner access.
 */
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { subscriptions } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";
import { getSubscriptionPeriod } from "../stripe/subscriptionPeriod";
import { isSubscriptionProvince, isSubscriptionTier, type SubscriptionTier as ST, type SubscriptionProvince as SP } from "../stripe/subscriptionProducts";
import {
  usesTwelveMonthIndividualExamPassPolicy,
} from "../stripe/individualExamPass";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"] });
}

export interface ReconcileResult {
  recovered: number;
  skipped: number;
  details: { email: string; productKey: string; sessionId: string }[];
  errors: string[];
}

export async function runReconciliation(hoursBack: number = 48, assertOwned: () => Promise<void> = async () => {}): Promise<ReconcileResult> {
  const stripe = getStripe();

  const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;
  const recovered: { email: string; productKey: string; sessionId: string }[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.Checkout.SessionListParams = {
      limit: 100,
      created: { gte: since },
      status: "complete",
    };
    if (startingAfter) params.starting_after = startingAfter;

    const page = await stripe.checkout.sessions.list(params);

    for (const session of page.data) {
      await assertOwned();
      try {
        const productKey = session.metadata?.product_key;
        const email =
          (session as any).customer_details?.email ??
          session.customer_email ??
          session.metadata?.customer_email;

        if (!productKey || !email || session.payment_status !== "paid") {
          skipped.push(session.id);
          continue;
        }

        const currentPolicy = usesTwelveMonthIndividualExamPassPolicy(
          session.metadata?.individual_access_policy,
        );
        const message = currentPolicy
          ? `${session.id}: current Individual Exam Pass requires signed webhook replay`
          : `${session.id}: historical Individual Exam Pass requires evidence-bound recovery`;
        skipped.push(session.id);
        errors.push(message);
        console.error("[reconcile] " + message);
      } catch (err: any) {
        errors.push(`${session.id}: ${err.message}`);
        console.error(`[reconcile] Error processing session ${session.id}:`, err.message);
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  return { recovered: recovered.length, skipped: skipped.length, details: recovered, errors };
}

export interface SubscriptionReconcileResult {
  recovered: number;
  skipped: number;
  errors: string[];
  details: { email: string; tier: string; province: string; stripeSubscriptionId: string }[];
}

/**
 * Backfill subscriptions that were dropped due to the period-end bug
 * (Stripe API 2026-03-25.dahlia moved current_period_end onto subscription items).
 *
 * Pages through ALL Stripe subscriptions (status: "all"), skips any that already
 * exist in the DB by stripeSubscriptionId, and inserts the missing rows.
 * Safe to run multiple times — idempotent by stripeSubscriptionId.
 */
export async function runSubscriptionReconciliation(): Promise<SubscriptionReconcileResult> {
  const stripe = getStripe();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const recovered: SubscriptionReconcileResult["details"] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.SubscriptionListParams = { status: "all", limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.subscriptions.list(params);

    for (const sub of page.data) {
      try {
        const tierMetadata = sub.metadata?.subscription_tier;
        const provinceMetadata = sub.metadata?.subscription_province;
        const tier = isSubscriptionTier(tierMetadata) ? tierMetadata : undefined;
        const province = isSubscriptionProvince(provinceMetadata) ? provinceMetadata : undefined;
        if (!tier || !province) {
          skipped.push(`${sub.id}: missing tier/province metadata`);
          continue;
        }

        // Resolve email from Stripe customer
        const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id;
        let email: string | null = null;
        if (stripeCustomerId) {
          try {
            const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
            email = normalizeEmail(customer.email);
          } catch (e) { /* ignore */ }
        }
        if (!email) {
          skipped.push(`${sub.id}: could not resolve email for customer ${stripeCustomerId}`);
          continue;
        }

        const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);
        if (!currentPeriodStart || !currentPeriodEnd) {
          skipped.push(`${sub.id}: could not resolve subscription period`);
          continue;
        }

        // Skip if already in DB (idempotent)
        const existing = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
          .limit(1);
        if (existing.length > 0) {
          skipped.push(`${sub.id}: already in DB`);
          continue;
        }

        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled";

        await db.insert(subscriptions).values({
          email,
          tier,
          province,
          stripeSubscriptionId: sub.id,
          stripeCustomerId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
        });

        recovered.push({ email, tier, province, stripeSubscriptionId: sub.id });
        console.log(`[reconcile-sub] Recovered: ${email.replace(/(^.{3}).+@/, '$1***@')} → ${tier} (${province}) expires ${currentPeriodEnd.toISOString()}`);
      } catch (err: any) {
        errors.push(`${sub.id}: ${err.message}`);
        console.error(`[reconcile-sub] Error processing subscription ${sub.id}:`, err.message);
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  return { recovered: recovered.length, skipped: skipped.length, errors, details: recovered };
}
