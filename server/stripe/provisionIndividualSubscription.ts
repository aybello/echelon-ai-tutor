import { notifyOwner } from "../_core/notification";
import { trackEvent } from "../analytics";
import { and, eq } from "drizzle-orm";
import { stripeEventLog, subscriptions } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";
import { sendSubscriptionConfirmationEmail } from "../email";
import { stripe } from "./stripe";
import {
  claimStripeEvent,
  markStripeEventCompleted,
  markStripeEventFailed,
  type Database,
} from "./eventLedger";
import { getSubscriptionPeriod } from "./subscriptionPeriod";
import {
  getSubscriptionProduct,
  isSubscriptionProvince,
  isSubscriptionTier,
  TIER_LABELS,
  PROVINCE_LABELS,
  TIER_QUIZ_PATHS_ONTARIO,
  TIER_QUIZ_PATHS_WPI,
} from "./subscriptionProducts";
import { validatedPhone } from "./checkoutIdentity";

type Dependencies = {
  customer: (
    id: string
  ) => Promise<{ email?: string | null; deleted?: boolean | void }>;
  send: typeof sendSubscriptionConfirmationEmail;
  notify?: typeof notifyOwner;
  track?: typeof trackEvent;
};
/** Retryable entitlement + email checkpoints, using the existing Stripe event ledger. */
export async function provisionIndividualSubscription(
  db: Database,
  eventId: string,
  eventType: string,
  sub: any,
  deps: Dependencies = {
    customer: id => stripe.customers.retrieve(id),
    send: sendSubscriptionConfirmationEmail,
    notify: notifyOwner,
    track: trackEvent,
  }
) {
  const claim = await claimStripeEvent(db, {
    stripeEventId: eventId,
    eventType,
    stripeObjectId: sub.id,
  });
  if (claim.state !== "claimed") return { state: claim.state };
  const owned = and(
    eq(stripeEventLog.stripeEventId, eventId),
    eq(stripeEventLog.processingToken, claim.token)
  );
  try {
    const tier = sub.metadata?.subscription_tier,
      province = sub.metadata?.subscription_province;
    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (
      !isSubscriptionTier(tier) ||
      !isSubscriptionProvince(province) ||
      !currentPeriodStart ||
      !currentPeriodEnd ||
      !customerId
    ) {
      throw new Error(
        "Individual subscription metadata or period is incomplete"
      );
    }
    const customer = await deps.customer(customerId);
    const email = normalizeEmail(customer.email);
    if (customer.deleted || !email)
      throw new Error("Individual subscription customer email unavailable");
    const status =
      sub.status === "active"
        ? "active"
        : sub.status === "past_due"
          ? "past_due"
          : "cancelled";
    if (!claim.event.dbProcessed) {
      await db.transaction(async tx => {
        // Fence stale workers before any entitlement write.
        const [owner] = await tx
          .select()
          .from(stripeEventLog)
          .where(owned)
          .for("update");
        if (!owner) throw new Error("Subscription event claim lost");
        const values = {
          email,
          tier,
          province,
          stripeSubscriptionId: sub.id as string,
          stripeCustomerId: customerId as string,
          status: status as "active" | "past_due" | "cancelled",
          currentPeriodStart,
          currentPeriodEnd,
          customerName: sub.metadata?.customer_name || null,
          phone: validatedPhone(sub.metadata?.customer_phone),
          userId:
            Number.isSafeInteger(Number(sub.metadata?.user_id)) &&
            Number(sub.metadata?.user_id) > 0
              ? Number(sub.metadata.user_id)
              : undefined,
          utmSource: sub.metadata?.utm_source || null,
          utmMedium: sub.metadata?.utm_medium || null,
          utmCampaign: sub.metadata?.utm_campaign || null,
          referralSource: sub.metadata?.referral_source || null,
          amountCAD: getSubscriptionProduct(tier, province)?.priceCAD ?? null,
        };
        await tx
          .insert(subscriptions)
          .values(values)
          .onDuplicateKeyUpdate({
            set: {
              email,
              tier,
              province,
              status: values.status,
              currentPeriodStart,
              currentPeriodEnd,
            },
          });
        await tx
          .update(stripeEventLog)
          .set({ dbProcessed: true, lastError: null })
          .where(owned);
      });
      if (eventType === "customer.subscription.created") {
        // Non-essential notifications never turn a committed entitlement into a failed write.
        try {
          await deps.notify?.({
            title: `New subscription: ${tier} (${province})`,
            content: `Subscription ${sub.id} was provisioned.`,
          });
          await deps.track?.("subscription_created", {
            email,
            productKey: `${province}-${tier}`,
            extra: { subscriptionType: "individual", tier, province },
          });
        } catch {
          console.warn(
            "[subscription] Optional owner notification or analytics failed"
          );
        }
      }
    }
    const [owner] = await db
      .select({ id: stripeEventLog.id })
      .from(stripeEventLog)
      .where(owned)
      .limit(1);
    if (!owner)
      throw new Error("Subscription event claim lost before delivery");
    // Delivery failure remains retryable without duplicating or undoing entitlement.
    // SMTP is at-least-once: a crash after acceptance can repeat a confirmation.
    if (
      eventType === "customer.subscription.created" &&
      status === "active" &&
      !claim.event.emailDelivered
    ) {
      await deps.send({
        email,
        tierLabel: TIER_LABELS[tier] ?? tier,
        provinceLabel: PROVINCE_LABELS[province] ?? province,
        currentPeriodEnd,
        quizPath:
          (province === "western"
            ? TIER_QUIZ_PATHS_WPI[tier]
            : TIER_QUIZ_PATHS_ONTARIO[tier]) ?? "/account",
      });
    }
    await markStripeEventCompleted(db, eventId, claim.token);
    return { state: "completed" };
  } catch (error) {
    await markStripeEventFailed(db, eventId, claim.token, error);
    return { state: "retryable_failure" };
  }
}
