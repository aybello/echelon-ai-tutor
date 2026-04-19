import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { stripe } from "../stripe/stripe";
import { ALL_PRODUCTS, getAllUnlockedExamTypes, PRODUCT_STUDY_PATHS } from "../stripe/products";
import { getDb } from "../db";
import { purchases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { sendPurchaseConfirmationEmail } from "../email";
import { notifyOwner } from "../_core/notification";

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
    .mutation(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: ["customer_details"],
        });
        // Stripe populates customer_details.email after checkout completes;
        // customer_email is only set when pre-filled before checkout.
        const email =
          (session as any).customer_details?.email ??
          session.customer_email ??
          session.metadata?.customer_email ??
          "";
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

        return { email, productKey, paid: session.payment_status === "paid" };
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
  getMyPurchases: publicProcedure
    .input(z.object({ email: z.string().email().optional() }))
    .query(async ({ input, ctx }) => {
      const email = ctx.user?.email ?? input.email;
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

  /** Check if a specific exam type is unlocked for an email */
  checkAccess: publicProcedure
    .input(z.object({
      examType: z.string(),
      email: z.string().email().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Owner bypass — grants full access to all courses for testing
      if (ctx.user?.openId && ctx.user.openId === ENV.ownerOpenId) {
        return { hasAccess: true, isOwner: true };
      }

      const email = ctx.user?.email ?? input.email;
      if (!email) return { hasAccess: false };

      const db = await getDb();
      if (!db) return { hasAccess: false };

      const rows = await db
        .select({ productKey: purchases.productKey })
        .from(purchases)
        .where(eq(purchases.email, email));

      const productKeys = rows.map(r => r.productKey);
      const unlockedExamTypes = getAllUnlockedExamTypes(productKeys);
      const hasAccess = unlockedExamTypes.includes(input.examType);

      return { hasAccess };
    }),
});
