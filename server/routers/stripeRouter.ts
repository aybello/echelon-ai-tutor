import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { resolveAccess, resolveAccessByEmail, normalizeEmail } from "../_core/access";
import { stripe } from "../stripe/stripe";
import { ALL_PRODUCTS, getAllUnlockedExamTypes, PRODUCT_STUDY_PATHS } from "../stripe/products";
import {
  getSubscriptionProduct,
  getAllSubscriptionExamTypes,
  getSubscriptionExamTypes,
  TIER_LABELS,
  PROVINCE_LABELS,
  type SubscriptionTier,
  type SubscriptionProvince,
} from "../stripe/subscriptionProducts";
import { getDb } from "../db";
import { purchases, subscriptions } from "../../drizzle/schema";
import { eq, and, gt, count } from "drizzle-orm";
import { ENV } from "../_core/env";
import { sendPurchaseConfirmationEmail } from "../email";
import { notifyOwner } from "../_core/notification";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { verifyAccessTokenAndRecheckDb } from "../_core/accessService";
import { issueVerifiedEmailSessionCookie } from "../_core/emailSession";

export const stripeRouter = router({
  /** Return all products with prices for the Pricing page */
  getProducts: publicProcedure.query(() => {
    return ALL_PRODUCTS.map(p => ({
      key: p.key,
      name: p.name,
      description: p.description,
      priceCAD: p.priceCAD,
      examTypes: p.examTypes,
    }));
  }),

  /** Create a Stripe Checkout session for a given product key */
  createCheckoutSession: publicProcedure
    .input(z.object({
      productKey: z.string(),
      email: z.string().email().optional(),
      name: z.string().max(128).optional(),
      phone: z.string().max(32).optional(),
      origin: z.string().url(),
      utmSource: z.string().max(128).optional(),
      utmMedium: z.string().max(128).optional(),
      utmCampaign: z.string().max(128).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const product = ALL_PRODUCTS.find(p => p.key === input.productKey);
      if (!product) throw new Error("Product not found");

      const userEmail = ctx.user?.email ?? input.email;
      // Phone and name collected via pre-checkout modal; stored in metadata
      // so verifySession and webhook can save them to the purchases table
      const preCheckoutPhone = input.phone ?? "";
      const preCheckoutName = input.name ?? "";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "cad",
              unit_amount: product.priceCAD,
              product_data: {
                name: product.name,
                description: product.description,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: userEmail,
        client_reference_id: ctx.user?.id?.toString() ?? undefined,
        metadata: {
          product_key: product.key,
          product_name: product.name,
          user_id: ctx.user?.id?.toString() ?? "",
          customer_email: userEmail ?? "",
          customer_name: preCheckoutName,
          customer_phone: preCheckoutPhone,
          utm_source: input.utmSource ?? "",
          utm_medium: input.utmMedium ?? "",
          utm_campaign: input.utmCampaign ?? "",
        },
        allow_promotion_codes: true,
        phone_number_collection: { enabled: true },
        success_url: `${input.origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}&product=${product.key}`,
        cancel_url: `${input.origin}/pricing`,
      });

      return { url: session.url };
    }),

  /** Verify a Stripe checkout session and return email/product info */
  verifySession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      productKey: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: ["customer_details"],
        });
        // Stripe populates customer_details.email after checkout completes;
        // customer_email is only set when pre-filled before checkout.
        const email = normalizeEmail(
          (session as any).customer_details?.email ??
          session.customer_email ??
          session.metadata?.customer_email
        );
        // Phone: prefer Stripe's customer_details (filled by Stripe Checkout phone field),
        // fall back to the pre-checkout modal value stored in metadata
        const phone: string | null =
          (session as any).customer_details?.phone ??
          (session.metadata?.customer_phone || null);
        const customerName: string | null =
          (session as any).customer_details?.name ??
          (session.metadata?.customer_name || null);
        const productKey = session.metadata?.product_key ?? input.productKey;
        const productName = session.metadata?.product_name ?? productKey;
        const amountCAD = session.amount_total ?? 0;
        const stripePaymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;

        if (session.payment_status === "paid" && email && productKey) {
          // FIX 4: Issue verified Echelon session cookie so dashboard opens without OTP
          try {
            await issueVerifiedEmailSessionCookie(ctx.res, email);
          } catch (e) {
            console.error("[verifySession] Failed to issue session cookie:", e);
          }

          const db = await getDb();
          if (db) {
            // Upsert — avoid duplicate on page refresh
            const existing = await db
              .select({ id: purchases.id })
              .from(purchases)
              .where(eq(purchases.stripeSessionId, input.sessionId))
              .limit(1);
            if (existing.length === 0) {
              await db.insert(purchases).values({
                email,
                phone,
                customerName,
                productKey,
                productName,
                amountCAD,
                stripeSessionId: input.sessionId,
                stripePaymentIntentId,
              });
              // Send confirmation email (non-blocking — webhook is the primary trigger;
              // this is a fallback for cases where the webhook fires after the user
              // has already landed on the success page)
              const studyPaths = PRODUCT_STUDY_PATHS[productKey] ?? { quizPath: "/quiz", mockPath: "/quiz" };
              sendPurchaseConfirmationEmail({
                email,
                productName: productName ?? productKey,
                productKey,
                amountCAD,
                quizPath: studyPaths.quizPath,
                mockPath: studyPaths.mockPath,
              }).catch(err => {
                console.error("[verifySession] Failed to send confirmation email:", err.message);
              });
            }
          }
        }

        // Also return unlockedExamTypes and accessToken for immediate localStorage convenience
        const unlockedExamTypes = session.payment_status === "paid" && productKey
          ? getAllUnlockedExamTypes([productKey])
          : [];
        const accessToken = unlockedExamTypes.length > 0 && email
          ? await issueSubscriptionToken({ email, examTypes: unlockedExamTypes })
          : null;

        return { email, productKey, paid: session.payment_status === "paid", unlockedExamTypes, accessToken };
      } catch (err: any) {
        console.error("[verifySession] Error:", err.message);
        // Notify owner so they can manually restore access if needed
        notifyOwner({
          title: "\u26a0\ufe0f verifySession Error",
          content: `verifySession failed for session ${input.sessionId} (product: ${input.productKey}).\n\nError: ${err.message}\n\nAction required: manually insert purchase or run Sync Stripe in Admin.`,
        }).catch((err) => { console.error("[stripe] notifyOwner failed:", err); });
        return { email: "", productKey: input.productKey, paid: false };
      }
    }),

  /** Get all purchases for the current user (by email) */
  getMyPurchases: protectedProcedure
    .query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) return { purchases: [], unlockedExamTypes: [] };

      const db = await getDb();
      if (!db) return { purchases: [], unlockedExamTypes: [] };

      const rows = await db
        .select()
        .from(purchases)
        .where(eq(purchases.email, email));

      const productKeys = rows.map(r => r.productKey);
      const unlockedExamTypes = getAllUnlockedExamTypes(productKeys);

      return { purchases: rows, unlockedExamTypes };
    }),

  /** Save the referral source answer for a completed purchase */
  saveReferralSource: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      referralSource: z.string().max(128),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(purchases)
        .set({ referralSource: input.referralSource })
        .where(eq(purchases.stripeSessionId, input.sessionId));
      return { success: true };
    }),

  /** Create a Stripe Checkout session for an annual subscription */
  createSubscriptionCheckout: publicProcedure
    .input(z.object({
      tier: z.enum(["class1", "class2", "class3", "class4", "all-access"]),
      province: z.enum(["ontario", "western"]),
      email: z.string().email(),
      name: z.string().max(128).optional(),
      phone: z.string().min(7, "Phone number is required").max(30),
      origin: z.string().url(),
      utmSource: z.string().max(128).optional(),
      utmMedium: z.string().max(128).optional(),
      utmCampaign: z.string().max(128).optional(),
      referralSource: z.string().max(128).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const product = getSubscriptionProduct(input.tier as SubscriptionTier, input.province as SubscriptionProvince);
      if (!product) throw new Error("Subscription tier not found");

      const userEmail = ctx.user?.email ?? input.email;
      const tierLabel = TIER_LABELS[input.tier as SubscriptionTier];
      const provinceLabel = PROVINCE_LABELS[input.province as SubscriptionProvince];

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "cad",
              unit_amount: product.priceCAD,
              recurring: { interval: "year" },
              product_data: {
                name: `${tierLabel} -- ${provinceLabel}`,
                description: product.description,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: userEmail,
        client_reference_id: ctx.user?.id?.toString() ?? undefined,
        metadata: {
          subscription_tier: input.tier,
          subscription_province: input.province,
          user_id: ctx.user?.id?.toString() ?? "",
          customer_email: userEmail ?? "",
          customer_name: input.name ?? "",
          customer_phone: input.phone,
          utm_source: input.utmSource ?? "",
          utm_medium: input.utmMedium ?? "",
          utm_campaign: input.utmCampaign ?? "",
          referral_source: input.referralSource ?? "",
        },
        // CRITICAL: subscription_data.metadata is what Stripe attaches to the
        // subscription object itself. The webhook receives the subscription object
        // (not the session), so tier/province MUST be here or the webhook silently drops it.
        subscription_data: {
          metadata: {
            subscription_tier: input.tier,
            subscription_province: input.province,
            user_id: ctx.user?.id?.toString() ?? "",
            customer_email: userEmail ?? "",
            customer_name: input.name ?? "",
            customer_phone: input.phone,
            utm_source: input.utmSource ?? "",
            utm_medium: input.utmMedium ?? "",
            utm_campaign: input.utmCampaign ?? "",
            referral_source: input.referralSource ?? "",
          },
        },
        allow_promotion_codes: true,
        success_url: `${input.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}&tier=${input.tier}&province=${input.province}`,
        cancel_url: `${input.origin}/pricing`,
      });

      return { url: session.url };
    }),

  /** Get all active subscriptions for the current user (by email) */
  getMySubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) return { subscriptions: [], unlockedExamTypes: [] };

      const db = await getDb();
      if (!db) return { subscriptions: [], unlockedExamTypes: [] };

      const now = new Date();
      const rows = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.email, email),
            eq(subscriptions.status, "active"),
            gt(subscriptions.currentPeriodEnd, now),
          )
        );

      const unlockedExamTypes = getAllSubscriptionExamTypes(
        rows.map(r => ({ tier: r.tier as SubscriptionTier, province: r.province as SubscriptionProvince }))
      );

      return { subscriptions: rows, unlockedExamTypes };
    }),

  /**
   * Create a Stripe Billing Portal session so subscribers can manage their
   * subscription (cancel, update payment method, view invoices) without
   * needing to contact support.
   */
  createBillingPortalSession: protectedProcedure
    .input(z.object({
      origin: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = ctx.user.email;
      if (!email) throw new Error("Email required to access billing portal");

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Find the Stripe customer ID from the most recent active subscription
      const rows = await db
        .select({ stripeCustomerId: subscriptions.stripeCustomerId })
        .from(subscriptions)
        .where(eq(subscriptions.email, email))
        .limit(10);

      const stripeCustomerId = rows.find(r => r.stripeCustomerId)?.stripeCustomerId;
      if (!stripeCustomerId) {
        throw new Error("No Stripe customer found for this email. Please contact support@echeloninstitute.ca");
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${input.origin}/account`,
      });

      return { url: portalSession.url };
    }),

  /**
   * Neutral email lookup — confirms only whether an account exists.
   * Does NOT return tokens, exam types, or course data.
   * Access restoration must go through the verified OTP or magic-link flow.
   * @deprecated Use magicLink.requestMagicLink for actual access restoration.
   */
  getPurchasesByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      // FIX 1 (P0): Never return tokens or unlocked exam types from a public email-only endpoint.
      // The caller cannot prove they own this inbox. Access restoration must go through
      // magicLinkRouter (inbox-verified) or dashboardAuthRouter OTP (inbox-verified).
      // We still check DB existence so the UI can show a neutral "if an account exists" message.
      const db = await getDb();
      if (!db) return { accountExists: false };
      const normalised = normalizeEmail(input.email);
      const rows = await db
        .select({ id: purchases.id })
        .from(purchases)
        .where(eq(purchases.email, normalised))
        .limit(1);
      return { accountExists: rows.length > 0 };
    }),

  /** Check if a specific exam type is unlocked for the current user (guests get hasAccess:false) */
  checkAccess: publicProcedure
    .input(z.object({ examType: z.string(), email: z.string().email().optional(), accessToken: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      let { hasAccess, isOwner } = await resolveAccess(ctx.user, input.examType);
      // Fallback 1: verify signed access token + live DB re-check (PATCH 1: was JWT-only, now also re-checks DB)
      if (!hasAccess && !ctx.user && input.accessToken) {
        const recheckResult = await verifyAccessTokenAndRecheckDb(input.accessToken, input.examType);
        if (recheckResult.hasAccess) {
          hasAccess = true;
        }
      }
      // Fallback 2: check by email if user is not authenticated but provided email
      if (!hasAccess && !ctx.user && input.email) {
        const emailResult = await resolveAccessByEmail(input.email, input.examType);
        hasAccess = emailResult.hasAccess;
      }
      return { hasAccess, isOwner };
    }),

  /**
   * Verify a subscription checkout session and return tier/province/examTypes/email.
   * Called by SubscriptionSuccess.tsx immediately after the Stripe redirect so the
   * customer gets localStorage access without needing to log in.
   * Public procedure — safe because we verify server-side via the Stripe session ID.
   */
  verifySubscriptionSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: ["customer_details"],
        });
        const email = normalizeEmail(
          (session as any).customer_details?.email ??
          session.customer_email ??
          session.metadata?.customer_email
        );
        const tier = (session.metadata?.subscription_tier ?? "") as SubscriptionTier;
        const province = (session.metadata?.subscription_province ?? "") as SubscriptionProvince;
        // Subscription checkout sessions have status "complete" when paid
        const paid = session.payment_status === "paid" || session.status === "complete";
        if (!paid || !tier || !province) {
          return { paid: false, email: "", tier: "", province: "", examTypes: [] as string[] };
        }
        const examTypes = getSubscriptionExamTypes(tier, province);
        const accessToken = await issueSubscriptionToken({ email, examTypes });
        // FIX 4: Issue verified Echelon session cookie so dashboard opens without OTP
        try {
          await issueVerifiedEmailSessionCookie(ctx.res, email);
        } catch (e) {
          console.error("[verifySubscriptionSession] Failed to issue session cookie:", e);
        }
        return { paid: true, email, tier, province, examTypes, accessToken };
      } catch (err: any) {
        console.error("[verifySubscriptionSession] Error:", err.message);
        return { paid: false, email: "", tier: "", province: "", examTypes: [] as string[] };
      }
    }),

  /**
   * Neutral subscription lookup — confirms only whether an active subscription exists.
   * Does NOT return tokens, exam types, or course data.
   * Access restoration must go through the verified OTP or magic-link flow.
   * @deprecated Use magicLink.requestMagicLink for actual access restoration.
   */
  getSubscriptionsByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      // FIX 1 (P0): Never return tokens or unlocked exam types from a public email-only endpoint.
      const db = await getDb();
      if (!db) return { accountExists: false };
      const normalised = normalizeEmail(input.email);
      const now = new Date();
      const rows = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.email, normalised),
            eq(subscriptions.status, "active"),
            gt(subscriptions.currentPeriodEnd, now),
          )
        )
        .limit(1);
      return { accountExists: rows.length > 0 };
    }),

  /**
   * Create a Stripe Checkout session for a team (org) plan.
   * mode: subscription, quantity = seats, volume tiered pricing.
   * subscription_data.metadata carries type:"org" plus all fields the webhook needs.
   */
  createTeamCheckout: publicProcedure
    .input(z.object({
      orgName: z.string().min(2).max(200),
      province: z.enum(["ontario", "western"]),
      tier: z.enum(["class1", "class2", "class3", "class4", "all-access"]).default("all-access"),
      seats: z.number().int().min(1).max(500),
      managerEmail: z.string().email(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      // Per-tier annual base prices (cents CAD) — mirrors subscriptionProducts.ts
      const BASE_PRICE: Record<string, Record<string, number>> = {
        ontario: { class1: 9900, class2: 14900, class3: 19900, class4: 24900, "all-access": 34900 },
        western: { class1: 14900, class2: 19900, class3: 24900, class4: 29900, "all-access": 44900 },
      };
      const baseCents = BASE_PRICE[input.province]?.[input.tier] ?? 34900;

      // Volume discount: 1-4 = 0%, 5-9 = 10%, 10-24 = 15%, 25+ = 20%
      const discountPct = input.seats >= 25 ? 20
        : input.seats >= 10 ? 15
        : input.seats >= 5 ? 10
        : 0;
      const unitAmount = Math.round(baseCents * (1 - discountPct / 100));

      const tierLabel = TIER_LABELS[input.tier as SubscriptionTier] ?? input.tier;
      const provinceLabel = input.province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)";

      const lineItem = {
        price_data: {
          currency: "cad",
          unit_amount: unitAmount,
          recurring: { interval: "year" as const },
          product_data: {
            name: `Echelon for Teams — ${tierLabel} — ${provinceLabel}`,
            description: `${tierLabel} annual team plan for ${input.seats} operator${input.seats === 1 ? "" : "s"} in ${provinceLabel}${discountPct > 0 ? ` (${discountPct}% volume discount)` : ""}`,
          },
        },
        quantity: input.seats,
      };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [lineItem as any],
        customer_email: input.managerEmail,
        metadata: {
          type: "org",
          org_name: input.orgName,
          manager_email: input.managerEmail,
          subscription_tier: input.tier,
          subscription_province: input.province,
          seats: String(input.seats),
        },
        subscription_data: {
          metadata: {
            type: "org",
            org_name: input.orgName,
            manager_email: input.managerEmail,
            subscription_tier: input.tier,
            subscription_province: input.province,
            seats: String(input.seats),
          },
        },
        allow_promotion_codes: true,
        success_url: `${input.origin}/team?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/teams`,
      });

      return { url: session.url };
    }),

  /**
   * Update the Stripe subscription quantity for an org (add/remove seats).
   * Stripe prorates the charge. The webhook customer.subscription.updated
   * then syncs seatsTotal on the organizations row.
   */
  updateTeamSeats: publicProcedure
    .input(z.object({
      seats: z.number().int().min(1).max(500),
      origin: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = ctx.studentEmail ?? ctx.user?.email ?? null;
      if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in." });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { organizations: orgsTable, organizationMembers: membersTable } = await import("../../drizzle/schema");
      const { normalizeEmail: norm } = await import("../_core/access");

      const normEmail = norm(email);
      const managerRow = await db
        .select({ orgId: membersTable.orgId })
        .from(membersTable)
        .where(
          and(
            eq(membersTable.email, normEmail),
            eq(membersTable.role, "manager"),
            eq(membersTable.status, "assigned"),
          ),
        )
        .limit(1)
        .then(r => r[0]);

      if (!managerRow) throw new TRPCError({ code: "UNAUTHORIZED", message: "No manager account found." });

      const org = await db
        .select()
        .from(orgsTable)
        .where(eq(orgsTable.id, managerRow.orgId))
        .limit(1)
        .then(r => r[0]);

      if (!org?.stripeSubscriptionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This organization does not have a Stripe subscription. Please contact support." });
      }

      // Ticket 7: Prevent seat downsizing below active operator count
      const activeOperatorCount = await db
        .select({ cnt: count() })
        .from(membersTable)
        .where(
          and(
            eq(membersTable.orgId, org.id),
            eq(membersTable.role, "operator"),
            eq(membersTable.status, "assigned"),
          ),
        )
        .then(r => Number(r[0]?.cnt ?? 0));

      if (input.seats < activeOperatorCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reduce seats to ${input.seats} — ${activeOperatorCount} operator${activeOperatorCount === 1 ? " is" : "s are"} currently active. Revoke seats first, then reduce.`,
        });
      }

      await stripe.subscriptions.update(org.stripeSubscriptionId, {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(org.stripeSubscriptionId)).items.data[0].id,
            quantity: input.seats,
          },
        ],
        proration_behavior: "create_prorations",
      });

      return { success: true, seats: input.seats };
    }),
});
