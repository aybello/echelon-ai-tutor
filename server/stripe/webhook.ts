import type { Express, Request, Response } from "express";
import express from "express";
import { stripe } from "./stripe";
import { getDb } from "../db";
import { purchases, subscriptions, users, organizations, organizationMembers, organizationTermUsage } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { sendPurchaseConfirmationEmail, sendSubscriptionConfirmationEmail, sendSubscriptionRenewalEmail } from "../email";
import { TIER_LABELS, PROVINCE_LABELS, type SubscriptionTier as ST, type SubscriptionProvince as SP, TIER_QUIZ_PATHS_ONTARIO, TIER_QUIZ_PATHS_WPI, getSubscriptionProduct, isSubscriptionProvince, isSubscriptionTier, type OrganizationSubscriptionTier } from "./subscriptionProducts";
import { PRODUCT_STUDY_PATHS } from "./products";
import { eq, and } from "drizzle-orm";
import { normalizeEmail } from "../_core/access";
import { getSubscriptionPeriod } from "./subscriptionPeriod";
import { trackEvent } from "../analytics";
import { ENV } from "../_core/env";
import { provisionOrgFromWebhook } from "./provisionOrg";
import { processOrgInvoice, classifyInvoiceSubscription } from "./processOrgInvoice";
import type { SubscriptionProvince } from "./subscriptionProducts";
import { getIndividualExamPassExpiry } from "./individualExamPass";



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

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object as any;

        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          // --- Teams Flex fulfilment branch ---
          if (session.metadata?.type === "team_flex") {
            const { fulfilFlexOrder } = await import("../teams/fulfilFlexOrder");
            const teamFlexOrderId = parseInt(session.metadata.teamFlexOrderId);
            if (!teamFlexOrderId || isNaN(teamFlexOrderId)) {
              console.error("[Stripe Webhook] team_flex session missing teamFlexOrderId");
              return res.json({ received: true });
            }
            const result = await fulfilFlexOrder({
              id: session.id,
              payment_intent: session.payment_intent ?? null,
              amount_total: session.amount_total ?? 0,
              amount_subtotal: session.amount_subtotal ?? 0,
              amount_tax: session.total_details?.amount_tax ?? 0,
              currency: session.currency ?? "cad",
              customer: session.customer ?? null,
              payment_status: session.payment_status ?? "unpaid",
            }, teamFlexOrderId);
            if (!result.success) {
              console.error(`[Stripe Webhook] Flex fulfilment failed for order #${teamFlexOrderId}: ${result.error}`);
              return res.status(503).json({ error: "Course Pass fulfilment is incomplete" });
            }
            return res.json({ received: true });
          }

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
          const accessExpiresAt = getIndividualExamPassExpiry(
            session.metadata,
            new Date(session.created * 1000),
          );

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
              accessExpiresAt,
            });

            console.log(`[Stripe Webhook] Purchase recorded: ${email.replace(/(^.{3}).+@/, '$1***@')} → ${productKey} (CA$${(amountCAD / 100).toFixed(2)})`);
            await trackEvent("checkout_completed", { email, productKey, extra: { amountCAD } });
            await trackEvent("access_activated", { email, productKey, extra: { activationType: "individual_purchase" } });

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
          await trackEvent("stripe_provisioning_failed", { email: sessionEmail, productKey: sessionProduct, extra: { error: err.message } });
          notifyOwner({
            title: "⚠️ Webhook Processing Error",
            content: `Failed to record purchase for ${sessionEmail} (${sessionProduct}).\n\nError: ${err.message}\n\nAction required: manually insert purchase or run Sync Stripe in Admin.`,
          }).catch((err) => { console.error("[webhook] notifyOwner failed:", err); });
          return res.status(500).json({ error: "Internal error" });
        }
      }

      // ── Subscription lifecycle events ──────────────────────────────────────

      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const eventSubscription = event.data.object as any;

        // Retrieve live Stripe data BEFORE classifying the subscription.
        // This ensures corrected metadata is used when replaying an older event.
        let liveSubscription: any;
        try {
          liveSubscription = await stripe.subscriptions.retrieve(eventSubscription.id);
        } catch (error: any) {
          console.error("[Stripe Webhook] Could not retrieve live subscription:", error.message);
          return res.status(503).json({ error: "Could not retrieve live Stripe subscription" });
        }

        // ── Org (team) subscription branch ────────────────────────────────
        if (liveSubscription.metadata?.type === "org") {
          const managerEmail = normalizeEmail(liveSubscription.metadata?.manager_email ?? "");
          const orgName = liveSubscription.metadata?.org_name?.trim() ?? "";
          const province = liveSubscription.metadata?.subscription_province as SubscriptionProvince;
          const tier = liveSubscription.metadata?.subscription_tier as OrganizationSubscriptionTier;
          const seats = liveSubscription.items.data[0]?.quantity ?? 0;
          const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(liveSubscription);

          if (!managerEmail || !orgName || !province || !tier || seats < 1 || !currentPeriodEnd) {
            await notifyOwner({
              title: "Team provisioning metadata is incomplete",
              content: `Subscription ${liveSubscription.id} cannot be provisioned. Correct its live Stripe metadata and replay event ${event.id}.`,
            }).catch(() => {});
            return res.status(503).json({ error: "Organization subscription metadata is incomplete" });
          }

          const db = await getDb();
          if (!db) return res.status(503).json({ error: "Database unavailable" });

          const result = await provisionOrgFromWebhook(db, {
            stripeEventId: event.id,
            eventType: event.type,
            stripeSubscriptionId: liveSubscription.id,
            stripeCustomerId: typeof liveSubscription.customer === "string" ? liveSubscription.customer : (liveSubscription.customer as any).id,
            orgName,
            managerEmail,
            province,
            tier,
            seats,
            currentPeriodStart,
            currentPeriodEnd,
            status: liveSubscription.status === "active" ? "active" : liveSubscription.status === "past_due" ? "past_due" : "cancelled",
          });

          if (result.state === "completed" || result.state === "already_completed") {
            if (result.state === "completed" && event.type === "customer.subscription.created") {
              await trackEvent("subscription_created", {
                email: managerEmail,
                productKey: "teams-all-access",
                extra: { subscriptionType: "organization", tier, seats },
              });
            }
            return res.json({ received: true });
          }
          if (result.state === "busy") {
            return res.status(409).json({ error: "Event is already being processed" });
          }
          // result.state === "retryable_failure"
          return res.status(503).json({ error: result.state === "retryable_failure" ? (result as any).error : "Provisioning failed" });
        }
        // ── End org branch ─────────────────────────────────────────────────

        // Individual subscription branch
        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          // Use liveSubscription (already retrieved above) throughout the individual branch
          const sub = liveSubscription;
          const tierMetadata = sub.metadata?.subscription_tier;
          const provinceMetadata = sub.metadata?.subscription_province;
          const tier = isSubscriptionTier(tierMetadata) ? tierMetadata : undefined;
          const province = isSubscriptionProvince(provinceMetadata) ? provinceMetadata : undefined;
          const stripeSubscriptionId = sub.id;
          const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled";
          const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);

          if (!tier || !province || !currentPeriodStart || !currentPeriodEnd) {
            // ALERTING: Notify owner immediately so they can manually patch the subscription
            // This is the silent failure mode that caused Matt Cooper's access issue
            const missingFields = [!tier && 'tier', !province && 'province', !currentPeriodStart && 'currentPeriodStart', !currentPeriodEnd && 'currentPeriodEnd'].filter(Boolean).join(', ');
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
            await trackEvent("subscription_created", {
              userId: userId?.toString() ?? null,
              email,
              productKey: `${province}-${tier}`,
              extra: { subscriptionType: "individual", tier, province },
            });
            // Send activation confirmation email (non-blocking)
            const subTierLabel = TIER_LABELS[tier] ?? tier;
            const subProvinceLabel = PROVINCE_LABELS[province] ?? province;
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
              .select({ id: organizations.id, managerEmail: organizations.managerEmail })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, sub.id))
              .limit(1);
            if (orgRow.length > 0) {
              const orgId = orgRow[0].id;
              const members = await db
                .select({ email: organizationMembers.email })
                .from(organizationMembers)
                .where(and(
                  eq(organizationMembers.orgId, orgId),
                  eq(organizationMembers.role, "operator"),
                  eq(organizationMembers.status, "assigned"),
                ));
              await db.update(organizations).set({ status: "cancelled" }).where(eq(organizations.id, orgId));
              await db.update(subscriptions).set({ status: "expired" }).where(eq(subscriptions.orgId, orgId));
              await db.update(organizationMembers).set({ status: "revoked", revokedAt: new Date() }).where(eq(organizationMembers.orgId, orgId));
              await trackEvent("subscription_cancelled", {
                email: orgRow[0].managerEmail,
                orgId,
                productKey: "teams-all-access",
                extra: { subscriptionType: "organization", seatsRevoked: members.length },
              });
              for (const member of members) {
                await trackEvent("team_seat_revoked", {
                  email: member.email,
                  orgId,
                  extra: { reason: "organization_subscription_cancelled" },
                });
              }
              console.log(`[Stripe Webhook] Org cancelled: ${orgId}`);
            }
            return res.json({ received: true });
          }

          const cancelledRows = await db
            .select({ email: subscriptions.email, tier: subscriptions.tier, province: subscriptions.province })
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, sub.id))
            .limit(1);
          await db
            .update(subscriptions)
            .set({ status: "cancelled" })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
          const cancelled = cancelledRows[0];
          await trackEvent("subscription_cancelled", {
            email: cancelled?.email ?? null,
            productKey: cancelled ? `${cancelled.province}-${cancelled.tier}` : null,
            extra: { subscriptionType: "individual" },
          });
          console.log(`[Stripe Webhook] Subscription cancelled: ${sub.id}`);
        } catch (err: any) {
          console.error("[Stripe Webhook] Error processing subscription.deleted:", err.message);
          return res.status(503).json({ error: "Subscription cancellation processing failed" });
        }
      }

      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;
        const stripeSubscriptionId = invoice.subscription;
        if (stripeSubscriptionId) {
          try {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");

            // ── Org invoice branch ───────────────────────────────────────────
            // Retrieve live subscription to check metadata (handles event ordering).
            const liveSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            const isOrgSubscription = liveSub.metadata?.type === "org";

            const orgRow = await db
              .select({ id: organizations.id, name: organizations.name, managerEmail: organizations.managerEmail, tier: organizations.tier, seatsTotal: organizations.seatsTotal, status: organizations.status })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);

            const invoiceRoute = classifyInvoiceSubscription({
              isOrganizationSubscription: isOrgSubscription,
              organizationExists: orgRow.length > 0,
            });

            if (invoiceRoute === "organization_pending") {
              // Invoice arrived before the subscription provisioning event.
              // Return 503 so Stripe retries after the org is created.
              return res.status(503).json({ error: "Organization provisioning is not complete" });
            }

            if (invoiceRoute === "organization") {
              const org = orgRow[0];
              const result = await processOrgInvoice(db, {
                stripeEventId: event.id,
                stripeInvoiceId: invoice.id ?? "",
                stripeSubscriptionId,
                amountPaid: invoice.amount_paid ?? 0,
                billingReason: invoice.billing_reason ?? null,
                hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
                invoicePdfUrl: invoice.invoice_pdf ?? null,
                organization: org,
              });
              if (result.state === "completed" || result.state === "already_completed") {
                return res.json({ received: true });
              }
              return res.status(503).json({ error: result.state === "retryable_failure" ? (result as any).error : "Invoice processing failed" });
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
            return res.status(503).json({ error: "Invoice processing failed" });
          }
        }
      }

      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as any;
        const stripeSubscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;

        if (stripeSubscriptionId) {
          try {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");

            // ── Org (team) payment failure branch ─────────────────────────
            const orgRows = await db
              .select({ id: organizations.id, name: organizations.name, managerEmail: organizations.managerEmail })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);

            if (orgRows.length > 0) {
              const organization = orgRows[0];
              await db
                .update(organizations)
                .set({ status: "past_due" })
                .where(eq(organizations.id, organization.id));
              // Keep operator access active during Stripe's retry window.
              // Do not revoke members or expire their managed subscriptions here.
              await notifyOwner({
                title: "Team plan payment failed",
                content: `Payment failed for ${organization.name}, ${organization.managerEmail}, subscription ${stripeSubscriptionId}. Stripe will retry automatically.`,
              }).catch(() => {});
              return res.json({ received: true });
            }
            // ── End org payment failure branch ─────────────────────────────

            // Individual subscription payment failure
            await db
              .update(subscriptions)
              .set({ status: "past_due" })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
            console.log(`[Stripe Webhook] Subscription payment failed: ${stripeSubscriptionId}`);

            const failedSubRows = await db
              .select({ email: subscriptions.email, tier: subscriptions.tier })
              .from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);
            const failedEmail = failedSubRows[0]?.email ?? "(unknown)";
            const failedTier = failedSubRows[0]?.tier ?? "(unknown)";
            await notifyOwner({
              title: "Subscription payment failed",
              content: `Payment failed for ${failedEmail} (${failedTier} plan, sub ${stripeSubscriptionId}). Stripe will retry automatically.`,
            }).catch((notifyErr) => {
              console.error("[Stripe Webhook] notifyOwner failed for payment_failed:", notifyErr.message);
            });
            return res.json({ received: true });
          } catch (err: any) {
            console.error("[Stripe Webhook] Error processing invoice.payment_failed:", err.message);
            return res.status(503).json({ error: "Payment failure processing failed" });
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

      // ── Checkout session expired ─────────────────────────────────────────────
      if (event.type === "checkout.session.expired") {
        const session = event.data.object as any;
        const flexOrderId = session.metadata?.teamFlexOrderId;
        if (flexOrderId) {
          const { handleFlexCheckoutExpired } = await import("../teams/fulfilFlexOrder");
          await handleFlexCheckoutExpired(Number(flexOrderId));
          console.log(`[Stripe Webhook] Flex checkout expired: order #${flexOrderId}`);
        }
      }

      // ── Async payment failed ─────────────────────────────────────────────────
      if (event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object as any;
        const flexOrderId = session.metadata?.teamFlexOrderId;
        if (flexOrderId) {
          const { handleFlexPaymentFailed } = await import("../teams/fulfilFlexOrder");
          await handleFlexPaymentFailed(Number(flexOrderId));
          console.log(`[Stripe Webhook] Flex async payment failed: order #${flexOrderId}`);
        }
      }


      res.json({ received: true });
    }
  );
}
