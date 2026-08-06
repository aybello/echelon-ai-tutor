import type { Express, Request, Response } from "express";
import express from "express";
import { stripe } from "./stripe";
import { getDb } from "../db";
import { purchases, subscriptions, users, organizations, organizationMembers, organizationTermUsage, stripeEventLog } from "../../drizzle/schema";
import { grantSeat } from "../routers/orgRouter";
import { notifyOwner } from "../_core/notification";
import { sendPurchaseConfirmationEmail, sendSubscriptionConfirmationEmail, sendSubscriptionRenewalEmail, sendManagerOnboardingEmail, sendOrgPaymentConfirmationEmail } from "../email";
import { TIER_LABELS, PROVINCE_LABELS, type SubscriptionTier as ST, type SubscriptionProvince as SP, TIER_QUIZ_PATHS_ONTARIO, TIER_QUIZ_PATHS_WPI, getSubscriptionProduct } from "./subscriptionProducts";
import { PRODUCT_STUDY_PATHS } from "./products";
import { eq, and, sql } from "drizzle-orm";
import { normalizeEmail } from "../_core/access";
import { getSubscriptionPeriod } from "./subscriptionPeriod";
import { trackEvent } from "../analytics";
import { ENV } from "../_core/env";


/**
 * Seeds the annual licence ledger for a new contract term on renewal.
 * Inserts a usage record for every currently-active operator so they are
 * counted against the new term's licence cap from day one.
 * Idempotent: uses INSERT IGNORE so duplicate calls on the same event are safe.
 */
async function initializeOrganizationRenewalTerm(
  db: Awaited<ReturnType<typeof getDb>>,
  orgId: number,
  termStart: Date,
  termEnd: Date,
): Promise<void> {
  if (!db) return;

  // Fetch all currently-active operators for this org
  const activeMembers = await db
    .select({ email: organizationMembers.email })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned"),
      ),
    );

  if (activeMembers.length === 0) return;

  // Bulk INSERT IGNORE into the usage ledger for the new term
  for (const member of activeMembers) {
    try {
      await db.insert(organizationTermUsage).values({
        orgId,
        memberEmail: member.email,
        termStart,
        termEnd,
      });
    } catch (err: any) {
      // Duplicate entry = already seeded (idempotent). Safe to ignore.
      const msg = (err.message ?? "") + (err.cause?.message ?? "");
      if (!msg.includes("Duplicate entry") && !msg.includes("term_usage_unique_idx")) {
        throw err;
      }
    }
  }
  console.log(`[Stripe Webhook] Seeded ${activeMembers.length} active operators into new term ledger for org ${orgId}`);
}

export function registerStripeWebhook(app: Express) {
  // MUST use raw body parser for Stripe signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured -- rejecting.");
        return res.status(500).send("Webhook not configured");
      }
      if (!sig) {
        console.warn("[Stripe Webhook] Missing stripe-signature header -- rejecting.");
        return res.status(400).send("Missing signature");
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Guard against malformed events
      if (!event || !event.id) {
        console.warn("[Stripe Webhook] Received event with no id -- ignoring");
        return res.json({ received: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          const productKey = session.metadata?.product_key;
          const productName = session.metadata?.product_name;
          const email = normalizeEmail(
            session.customer_details?.email ??
            session.customer_email ??
            session.metadata?.customer_email
          );
          const userId = session.metadata?.user_id
            ? parseInt(session.metadata.user_id)
            : null;
          // Name: prefer Stripe's customer_details, fall back to pre-checkout modal metadata
          const webhookCustomerName: string | null =
            session.customer_details?.name ??
            (session.metadata?.customer_name || null);
          // Phone: prefer Stripe's customer_details, fall back to pre-checkout modal metadata
          const webhookPrePhone: string | null =
            session.customer_details?.phone ??
            (session.metadata?.customer_phone || null);
          const amountCAD = session.amount_total ?? 0;
          const stripeSessionId = session.id;
          const stripePaymentIntentId = session.payment_intent ?? null;

          if (!productKey || !email) {
            // email is already normalized above
            console.error("[Stripe Webhook] Missing product_key or email in session metadata");
            return res.json({ received: true });
          }

          // Upsert — avoid duplicate on webhook retry
          const existing = await db
            .select({ id: purchases.id })
            .from(purchases)
            .where(
              eq(purchases.stripeSessionId, stripeSessionId)
            )
            .limit(1);

          if (existing.length === 0) {
            await db.insert(purchases).values({
              userId: userId ?? undefined,
              email,
              phone: webhookPrePhone,
              customerName: webhookCustomerName,
              productKey,
              productName: productName ?? productKey,
              amountCAD,
              stripeSessionId,
              stripePaymentIntentId,
            });

            console.log(`[Stripe Webhook] Purchase recorded: ${email.replace(/(^.{3}).+@/, '$1***@')} → ${productKey} (CA$${(amountCAD / 100).toFixed(2)})`);
            trackEvent("checkout_completed", { email, productKey, extra: { amountCAD } });

            // Send purchase confirmation email (non-blocking — don't fail webhook on email error)
            const studyPaths = PRODUCT_STUDY_PATHS[productKey] ?? { quizPath: "/quiz", mockPath: "/quiz" };
            sendPurchaseConfirmationEmail({
              email,
              productName: productName ?? productKey,
              productKey,
              amountCAD,
              quizPath: studyPaths.quizPath,
              mockPath: studyPaths.mockPath,
            }).catch(err => {
              console.error("[Stripe Webhook] Failed to send confirmation email:", err.message);
            });

            // Welcome onboarding email is sent 24 hours after purchase by the hourly
            // welcomeEmail scheduled job (server/jobs/welcomeEmail.ts), which queries
            // purchases where welcomeEmailSentAt IS NULL and createdAt <= NOW() - 24h.
            // No setTimeout needed here — the job survives server restarts.

            // Notify owner
            const purchasePhone = session.customer_details?.phone ?? null;
            await notifyOwner({
              title: `New Purchase: ${productName ?? productKey}`,
              content: `${email} purchased ${productName ?? productKey} for CA$${(amountCAD / 100).toFixed(2)}${purchasePhone ? ` | Phone: ${purchasePhone}` : ""}`,
            });
          } else {
            console.log(`[Stripe Webhook] Duplicate session ${stripeSessionId} — skipping insert`);
          }

          // Always attempt to save phone and name — runs for both new and duplicate sessions
          // This handles the case where verifySession inserted the row before the webhook fired
          const phone = session.customer_details?.phone ?? (session.metadata?.customer_phone || null);
          const customerName = session.customer_details?.name ?? (session.metadata?.customer_name || null);
          if (phone || customerName) {
            try {
              await db
                .update(purchases)
                .set({ ...(phone ? { phone } : {}), ...(customerName ? { customerName } : {}) })
                .where(eq(purchases.stripeSessionId, stripeSessionId));
              console.log(`[Stripe Webhook] Phone saved/updated for session ${stripeSessionId}: ${phone}`);

              const targetUserId = userId ?? (await db
                .select({ id: users.id })
                .from(users)
                .where(eq(users.email, normalizeEmail(email)))
                .limit(1)
                .then(rows => rows[0]?.id ?? null));

              if (targetUserId) {
                await db
                  .update(users)
                  .set({ phone })
                  .where(eq(users.id, targetUserId));
                console.log(`[Stripe Webhook] Phone saved to users table for user ${targetUserId}: ${phone}`);
              }
            } catch (phoneErr) {
              console.error("[Stripe Webhook] Failed to save phone (dedup path):", phoneErr);
            }
          }
        } catch (err: any) {
          console.error("[Stripe Webhook] Error processing checkout.session.completed:", err);
          // Notify owner immediately so they can manually restore access
          const sessionEmail = session?.customer_details?.email ?? session?.customer_email ?? session?.metadata?.customer_email ?? "unknown";
          const sessionProduct = session?.metadata?.product_name ?? session?.metadata?.product_key ?? "unknown";
          trackEvent("stripe_provisioning_failed", { email: sessionEmail, productKey: sessionProduct, extra: { error: err.message } });
          notifyOwner({
            title: "⚠️ Webhook Processing Error",
            content: `Failed to record purchase for ${sessionEmail} (${sessionProduct}).\n\nError: ${err.message}\n\nAction required: manually insert purchase or run Sync Stripe in Admin.`,
          }).catch((err) => { console.error("[webhook] notifyOwner failed:", err); });
          return res.status(500).json({ error: "Internal error" });
        }
      }

      // ── Subscription lifecycle events ──────────────────────────────────────

      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const sub = event.data.object as any;

        // ── Org (team) subscription branch ────────────────────────────────
        if (sub.metadata?.type === "org") {
          const orgName = sub.metadata?.org_name ?? "Unknown Organization";
          const managerEmail = normalizeEmail(sub.metadata?.manager_email ?? "");
          const province = (sub.metadata?.subscription_province ?? "ontario") as SP;
          const tier = (sub.metadata?.subscription_tier ?? "all-access") as ST;
          const liveQuantity = sub.items?.data?.[0]?.quantity ?? null;
          const metadataSeats = parseInt(sub.metadata?.seats ?? "1", 10);
          const seats = liveQuantity ?? metadataSeats;
          const stripeSubscriptionId = sub.id;
          const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);
          const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled";

          if (!managerEmail || !currentPeriodEnd) {
            const missingOrgFields = [!managerEmail && 'manager_email', !currentPeriodEnd && 'currentPeriodEnd'].filter(Boolean).join(', ');
            console.warn(`[Stripe Webhook] Org subscription ${stripeSubscriptionId} missing required fields: ${missingOrgFields}`);
            notifyOwner({
              title: '⚠️ Team Provision Failed: Missing Metadata',
              content: `Org subscription ${stripeSubscriptionId} (customer: ${stripeCustomerId}) could NOT be provisioned: ${missingOrgFields} missing.\n\nRecovery: correct the metadata and replay the webhook from the Stripe Dashboard.`,
            }).catch((e: any) => { console.error('[webhook] notifyOwner failed:', e); });
            // 400 = structurally invalid, Stripe will not retry
            return res.status(400).json({ error: `Missing required org metadata: ${missingOrgFields}` });
          }

          const db = await getDb();
          if (!db) return res.status(503).json({ error: "Database unavailable" });

          // ── Event ledger: register or resume this event ──────────────────
          try {
            await db.insert(stripeEventLog).values({
              stripeEventId: event.id,
              eventType: event.type,
              stripeObjectId: stripeSubscriptionId,
              status: "pending",
              dbProcessed: false,
              emailDelivered: false,
              attemptCount: 1,
            });
          } catch (_dupErr: any) {
            // Unique constraint violation = already registered; check if already completed
            const existing = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, event.id)).limit(1);
            if (existing.length > 0 && existing[0].status === "completed") {
              console.log(`[Stripe Webhook] Event ${event.id} already completed — skipping`);
              return res.json({ received: true });
            }
            // Incomplete — increment attempt count and continue
            await db.update(stripeEventLog).set({ attemptCount: sql`${stripeEventLog.attemptCount} + 1` }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
          }

          // ── Upsert organizations row ─────────────────────────────────────
          let orgId: number;
          try {
            const existingOrg = await db
              .select({ id: organizations.id, onboardingEmailSentAt: organizations.onboardingEmailSentAt })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);

            if (existingOrg.length === 0) {
              const [insertResult] = await db.insert(organizations).values({
                name: orgName, province, tier, seatsTotal: seats, managerEmail,
                stripeSubscriptionId, stripeCustomerId,
                termStart: currentPeriodStart, termEnd: currentPeriodEnd,
                billingType: "stripe", status,
              });
              orgId = (insertResult as any).insertId;
              await grantSeat(db, { id: orgId, name: orgName, province, termStart: currentPeriodStart, termEnd: currentPeriodEnd, tier }, managerEmail, "manager");
              console.log(`[Stripe Webhook] Org created: ${orgName} (${orgId}) manager=${managerEmail.replace(/(^.{3}).+@/, '$1***@')} seats=${seats}`);
              notifyOwner({ title: `New Team Plan: ${orgName}`, content: `${managerEmail} purchased a ${seats}-seat ${tier} plan for ${province}. Org ID: ${orgId}. Expires: ${currentPeriodEnd.toISOString()}` }).catch((e: any) => { console.error('[webhook] notifyOwner failed:', e); });
            } else {
              orgId = existingOrg[0].id;
              await db.update(organizations).set({ seatsTotal: seats, termStart: currentPeriodStart, termEnd: currentPeriodEnd, status }).where(eq(organizations.id, orgId));
              if (status === "active" || status === "past_due") {
                await db.update(subscriptions).set({ currentPeriodEnd }).where(and(eq(subscriptions.orgId, orgId), eq(subscriptions.status, "active")));
              } else {
                await db.update(subscriptions).set({ currentPeriodEnd, status: "expired" }).where(eq(subscriptions.orgId, orgId));
              }
              if (status === "active" && currentPeriodStart) {
                await initializeOrganizationRenewalTerm(db, orgId, currentPeriodStart, currentPeriodEnd);
              }
              console.log(`[Stripe Webhook] Org updated: ${orgId} seats=${seats} status=${status}`);
            }

            await db.update(stripeEventLog).set({ dbProcessed: true, orgId }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});

          } catch (provisionErr: any) {
            console.error("[Stripe Webhook] Org provisioning failed:", provisionErr.message);
            await db.update(stripeEventLog).set({ status: "failed", lastError: provisionErr.message }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
            // 500 = transient failure, Stripe will retry
            return res.status(500).json({ error: "Org provisioning failed" });
          }

          // ── Onboarding email: send if not yet delivered ──────────────────
          // Check the DB flag, not existingOrg — so SMTP retries work on replay
          try {
            const orgForEmail = await db.select({ onboardingEmailSentAt: organizations.onboardingEmailSentAt }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
            if (!orgForEmail[0]?.onboardingEmailSentAt) {
              await sendManagerOnboardingEmail({
                managerEmail, orgName, seats,
                tierLabel: TIER_LABELS[tier as ST] ?? tier,
                dashboardUrl: `${ENV.appBaseUrl}/account?next=/team`,
              });
              await db.update(organizations).set({ onboardingEmailSentAt: new Date() }).where(eq(organizations.id, orgId));
              await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
            } else {
              await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
            }
          } catch (emailErr: any) {
            // SMTP failure: log and continue. DB provisioning succeeded.
            // Replay the webhook once SMTP is restored to retry the email.
            console.error("[Stripe Webhook] Onboarding email failed — replay to retry:", emailErr.message);
            await db.update(stripeEventLog).set({ lastError: emailErr.message }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
          }

          await db.update(stripeEventLog).set({ status: "completed", completedAt: new Date() }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
          return res.json({ received: true });
        }
        // ── End org branch ─────────────────────────────────────────────────

        // Individual subscription branch
        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          const tier = sub.metadata?.subscription_tier as ST | undefined;
          const province = sub.metadata?.subscription_province as SP | undefined;
          const stripeSubscriptionId = sub.id;
          const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled";
          const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);

          if (!tier || !province || !currentPeriodEnd) {
            // ALERTING: Notify owner immediately so they can manually patch the subscription
            // This is the silent failure mode that caused Matt Cooper's access issue
            const missingFields = [!tier && 'tier', !province && 'province', !currentPeriodEnd && 'currentPeriodEnd'].filter(Boolean).join(', ');
            console.warn(`[Stripe Webhook] Subscription ${stripeSubscriptionId} missing required metadata: ${missingFields}`);
            notifyOwner({
              title: '\u26a0\ufe0f Subscription Webhook: Missing Metadata',
              content: `Subscription ${stripeSubscriptionId} (customer: ${stripeCustomerId}) was received but could NOT be saved to the database because required metadata is missing: ${missingFields}.\n\nThis means the subscriber will NOT get access automatically.\n\nAction required:\n1. Look up the subscription in Stripe Dashboard\n2. Identify the customer email\n3. Run \'Sync Stripe\' in Admin or manually insert a row in the subscriptions table\n4. Confirm the customer has access`,
            }).catch((notifyErr) => { console.error('[webhook] notifyOwner failed:', notifyErr); });
            return res.json({ received: true });
          }

          // Resolve email from customer (normalized)
          let email: string | null = null;
          if (stripeCustomerId) {
            try {
              const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
              email = normalizeEmail(customer.email);
            } catch (e) { /* ignore */ }
          }
          if (!email) {
            console.warn(`[Stripe Webhook] Could not resolve email for subscription ${stripeSubscriptionId}`);
            notifyOwner({
              title: '\u26a0\ufe0f Subscription Webhook: Could Not Resolve Email',
              content: `Subscription ${stripeSubscriptionId} (customer: ${stripeCustomerId}) was received but the customer email could not be resolved from Stripe.\n\nThis means the subscriber will NOT get access automatically.\n\nAction required:\n1. Look up customer ${stripeCustomerId} in Stripe Dashboard\n2. Find their email address\n3. Run \'Sync Stripe\' in Admin or manually insert a row in the subscriptions table\n4. Confirm the customer has access`,
            }).catch((notifyErr) => { console.error('[webhook] notifyOwner failed:', notifyErr); });
            return res.json({ received: true });
          }

          // Upsert subscription row
          const existing = await db
            .select({ id: subscriptions.id })
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
            .limit(1);

          // Extract optional CRM fields from subscription metadata
          const customerName = (sub.metadata?.customer_name as string | undefined) || null;
          const customerPhone = (sub.metadata?.customer_phone as string | undefined) || null;
          const utmSource = (sub.metadata?.utm_source as string | undefined) || null;
          const utmMedium = (sub.metadata?.utm_medium as string | undefined) || null;
          const utmCampaign = (sub.metadata?.utm_campaign as string | undefined) || null;
          const referralSource = (sub.metadata?.referral_source as string | undefined) || null;
          const userId = sub.metadata?.user_id ? parseInt(sub.metadata.user_id, 10) || null : null;

          // Look up price from product catalog
          const subProduct = getSubscriptionProduct(tier, province);
          const subAmountCAD = subProduct?.priceCAD ?? null;

          if (existing.length === 0) {
            await db.insert(subscriptions).values({
              email,
              tier,
              province,
              stripeSubscriptionId,
              stripeCustomerId,
              status,
              currentPeriodStart,
              currentPeriodEnd,
              customerName,
              phone: customerPhone,
              amountCAD: subAmountCAD,
              utmSource,
              utmMedium,
              utmCampaign,
              referralSource,
              userId: userId ?? undefined,
            });
            console.log(`[Stripe Webhook] Subscription created: ${email.replace(/(^.{3}).+@/, '$1***@')} -> ${tier} (${province}) expires ${currentPeriodEnd.toISOString()}`);
            await notifyOwner({
              title: `New Subscription: ${tier} (${province})`,
              content: `${email} subscribed to ${tier} for ${province}. Expires: ${currentPeriodEnd.toISOString()}`,
            });
            // Send activation confirmation email (non-blocking)
            const subTierLabel = TIER_LABELS[tier as ST] ?? tier;
            const subProvinceLabel = PROVINCE_LABELS[province as SP] ?? province;
            const subQuizPath = province === "western"
              ? (TIER_QUIZ_PATHS_WPI[tier] ?? "/wpi-class1-water")
              : (TIER_QUIZ_PATHS_ONTARIO[tier] ?? "/quiz");
            sendSubscriptionConfirmationEmail({
              email,
              tierLabel: subTierLabel,
              provinceLabel: subProvinceLabel,
              currentPeriodEnd,
              quizPath: subQuizPath,
            }).catch(err => {
              console.error("[Stripe Webhook] Failed to send subscription confirmation email:", err.message);
            });
          } else {
            await db
              .update(subscriptions)
              .set({ status, currentPeriodStart, currentPeriodEnd })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
            console.log(`[Stripe Webhook] Subscription updated: ${stripeSubscriptionId} status=${status}`);
          }
        } catch (err: any) {
          console.error("[Stripe Webhook] Error processing subscription event:", err.message);
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as any;
        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          // Org cancellation: expire all org-managed seats
          if (sub.metadata?.type === "org") {
            const orgRow = await db
              .select({ id: organizations.id })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, sub.id))
              .limit(1);
            if (orgRow.length > 0) {
              const orgId = orgRow[0].id;
              await db.update(organizations).set({ status: "cancelled" }).where(eq(organizations.id, orgId));
              await db.update(subscriptions).set({ status: "expired" }).where(eq(subscriptions.orgId, orgId));
              await db.update(organizationMembers).set({ status: "revoked", revokedAt: new Date() }).where(eq(organizationMembers.orgId, orgId));
              console.log(`[Stripe Webhook] Org cancelled: ${orgId}`);
            }
            return res.json({ received: true });
          }

          await db
            .update(subscriptions)
            .set({ status: "cancelled" })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
          console.log(`[Stripe Webhook] Subscription cancelled: ${sub.id}`);
        } catch (err: any) {
          console.error("[Stripe Webhook] Error processing subscription.deleted:", err.message);
        }
      }

      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;
        const stripeSubscriptionId = invoice.subscription;
        if (stripeSubscriptionId) {
          try {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");

            // ── Org (team) invoice branch ─────────────────────────────────────
            // Check if this subscription belongs to an org before treating it as
            // an individual learner subscription.
            const orgRow = await db
              .select({ id: organizations.id, name: organizations.name, managerEmail: organizations.managerEmail, tier: organizations.tier, seatsTotal: organizations.seatsTotal, status: organizations.status })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);

            if (orgRow.length > 0) {
              const org = orgRow[0];
              const stripeInvoiceId: string = invoice.id ?? "";
              const billingReason: string = invoice.billing_reason ?? "";

              // ── Event ledger: register or check this invoice event ─────────
              try {
                await db.insert(stripeEventLog).values({
                  stripeEventId: event.id,
                  eventType: event.type,
                  stripeObjectId: stripeInvoiceId,
                  orgId: org.id,
                  status: "pending",
                  dbProcessed: false,
                  emailDelivered: false,
                  attemptCount: 1,
                });
              } catch (_dupErr: any) {
                const existing = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, event.id)).limit(1);
                if (existing.length > 0 && existing[0].status === "completed") {
                  console.log(`[Stripe Webhook] Invoice event ${event.id} already completed — skipping`);
                  return res.json({ received: true });
                }
                await db.update(stripeEventLog).set({ attemptCount: sql`${stripeEventLog.attemptCount} + 1` }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
              }

              // ── DB updates ────────────────────────────────────────────────
              try {
                const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(
                  await stripe.subscriptions.retrieve(stripeSubscriptionId) as any
                );
                if (!currentPeriodEnd) throw new Error(`Could not resolve currentPeriodEnd for org invoice ${stripeInvoiceId}`);

                await db.update(organizations)
                  .set({ status: "active", termEnd: currentPeriodEnd, ...(currentPeriodStart ? { termStart: currentPeriodStart } : {}) })
                  .where(eq(organizations.id, org.id));
                await db.update(subscriptions)
                  .set({ status: "active", currentPeriodEnd })
                  .where(and(eq(subscriptions.orgId, org.id), eq(subscriptions.status, "active")));
                console.log(`[Stripe Webhook] Org invoice paid: ${org.name} (${org.id}) new end=${currentPeriodEnd.toISOString()} reason=${billingReason}`);

                await db.update(stripeEventLog).set({ dbProcessed: true }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});

                // ── Payment confirmation email ─────────────────────────────
                const amountPaid: number = invoice.amount_paid ?? 0;
                const amountFormatted = `CA$${(amountPaid / 100).toFixed(2)}`;
                try {
                  await sendOrgPaymentConfirmationEmail({
                    managerEmail: org.managerEmail,
                    orgName: org.name,
                    seats: org.seatsTotal,
                    tierLabel: TIER_LABELS[org.tier as ST] ?? org.tier,
                    amountFormatted,
                    periodEnd: currentPeriodEnd,
                    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
                    invoicePdfUrl: invoice.invoice_pdf ?? null,
                    billingReason,
                  });
                  await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
                } catch (emailErr: any) {
                  console.error("[Stripe Webhook] Org payment email failed:", emailErr.message);
                  await db.update(stripeEventLog).set({ lastError: emailErr.message }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
                }

                await db.update(stripeEventLog).set({ status: "completed", completedAt: new Date() }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
                return res.json({ received: true });

              } catch (invoiceDbErr: any) {
                console.error("[Stripe Webhook] Org invoice DB update failed:", invoiceDbErr.message);
                await db.update(stripeEventLog).set({ status: "failed", lastError: invoiceDbErr.message }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
                return res.status(500).json({ error: "Org invoice processing failed" });
              }
            }
            // ── End org invoice branch ────────────────────────────────────────

            // Fetch the latest subscription period from Stripe to update our record
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
            const { currentPeriodEnd } = getSubscriptionPeriod(stripeSub);
            if (!currentPeriodEnd) throw new Error(`Could not resolve currentPeriodEnd for subscription ${stripeSubscriptionId}`);
            await db
              .update(subscriptions)
              .set({ status: "active", currentPeriodEnd })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
            console.log(`[Stripe Webhook] Subscription renewed: ${stripeSubscriptionId} new end=${currentPeriodEnd.toISOString()}`);
            // Send renewal email (non-blocking)
            try {
              const subRow = await db
                .select({ email: subscriptions.email, tier: subscriptions.tier, province: subscriptions.province })
                .from(subscriptions)
                .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
                .limit(1);
              if (subRow.length > 0) {
                const { email: subEmail, tier: subTier, province: subProvince } = subRow[0];
                const renewTierLabel = TIER_LABELS[subTier as ST] ?? subTier;
                const renewProvinceLabel = PROVINCE_LABELS[subProvince as SP] ?? subProvince;
                const renewQuizPath = subProvince === "western"
                  ? (TIER_QUIZ_PATHS_WPI[subTier] ?? "/wpi-class1-water")
                  : (TIER_QUIZ_PATHS_ONTARIO[subTier] ?? "/quiz");
                sendSubscriptionRenewalEmail({
                  email: subEmail,
                  tierLabel: renewTierLabel,
                  provinceLabel: renewProvinceLabel,
                  currentPeriodEnd,
                  quizPath: renewQuizPath,
                }).catch(err => {
                  console.error("[Stripe Webhook] Failed to send renewal email:", err.message);
                });
              }
            } catch (renewEmailErr: any) {
              console.error("[Stripe Webhook] Error fetching sub row for renewal email:", renewEmailErr.message);
            }
          } catch (err: any) {
            console.error("[Stripe Webhook] Error processing invoice.payment_succeeded:", err.message);
          }
        }
      }

      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as any;
        const stripeSubscriptionId = invoice.subscription;
        if (stripeSubscriptionId) {
          try {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");
            await db
              .update(subscriptions)
              .set({ status: "past_due" })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
            console.log(`[Stripe Webhook] Subscription payment failed: ${stripeSubscriptionId}`);

            // Notify owner — mirrors the refund/dispute pattern
            // Fetch the customer email from our DB so the notification is actionable
            const failedSubRows = await db
              .select({ email: subscriptions.email, tier: subscriptions.tier })
              .from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);
            const failedEmail = failedSubRows[0]?.email ?? "(unknown)";
            const failedTier = failedSubRows[0]?.tier ?? "(unknown)";
            await notifyOwner({
              title: "⚠️ Subscription payment failed",
              content: `Payment failed for ${failedEmail} (${failedTier} plan, sub ${stripeSubscriptionId}). Stripe will retry automatically. Customer has been moved to past_due and retains access during the retry window.`,
            }).catch((notifyErr) => {
              console.error("[Stripe Webhook] notifyOwner failed for payment_failed:", notifyErr.message);
            });
          } catch (err: any) {
            console.error("[Stripe Webhook] Error processing invoice.payment_failed:", err.message);
          }
        }
      }

      if (event.type === "charge.refunded") {
        const charge = event.data.object as any;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi) {
          try {
            const db = await getDb();
            if (db) {
              await db.update(purchases)
                .set({ status: "refunded", refundedAt: new Date() })
                .where(eq(purchases.stripePaymentIntentId, pi));
              await notifyOwner({ title: "Purchase refunded", content: `Refund for PI ${pi}. Access revoked.` });
            }
          } catch (err: any) { console.error("[Stripe Webhook] charge.refunded:", err.message); }
        }
      }

      if (event.type === "charge.dispute.created") {
        const dispute = event.data.object as any;
        const pi = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
        if (pi) {
          try {
            const db = await getDb();
            if (db) {
              await db.update(purchases).set({ status: "disputed" }).where(eq(purchases.stripePaymentIntentId, pi));
              await notifyOwner({ title: "\u26a0\ufe0f Dispute opened", content: `Chargeback for PI ${pi}. Review in Stripe.` });
            }
          } catch (err: any) { console.error("[Stripe Webhook] dispute.created:", err.message); }
        }
      }

      res.json({ received: true });
    }
  );
}
