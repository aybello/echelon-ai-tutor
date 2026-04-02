import type { Express, Request, Response } from "express";
import express from "express";
import { stripe } from "./stripe";
import { getDb } from "../db";
import { purchases } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

export function registerStripeWebhook(app: Express) {
  // MUST use raw body parser for Stripe signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        if (!webhookSecret || !sig) {
          // No webhook secret configured — accept but log
          event = JSON.parse(req.body.toString());
        } else {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events for webhook verification
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          const productKey = session.metadata?.product_key;
          const productName = session.metadata?.product_name;
          const email = session.customer_email ?? session.metadata?.customer_email;
          const userId = session.metadata?.user_id
            ? parseInt(session.metadata.user_id)
            : null;
          const amountCAD = session.amount_total ?? 0;
          const stripeSessionId = session.id;
          const stripePaymentIntentId = session.payment_intent ?? null;

          if (!productKey || !email) {
            console.error("[Stripe Webhook] Missing product_key or email in session metadata");
            return res.json({ received: true });
          }

          // Upsert — avoid duplicate on webhook retry
          const existing = await db
            .select({ id: purchases.id })
            .from(purchases)
            .where(
              // @ts-ignore
              require("drizzle-orm").eq(purchases.stripeSessionId, stripeSessionId)
            )
            .limit(1);

          if (existing.length === 0) {
            await db.insert(purchases).values({
              userId: userId ?? undefined,
              email,
              productKey,
              productName: productName ?? productKey,
              amountCAD,
              stripeSessionId,
              stripePaymentIntentId,
            });

            console.log(`[Stripe Webhook] Purchase recorded: ${email} → ${productKey} (CA$${(amountCAD / 100).toFixed(2)})`);

            // Notify owner
            await notifyOwner({
              title: `New Purchase: ${productName ?? productKey}`,
              content: `${email} purchased ${productName ?? productKey} for CA$${(amountCAD / 100).toFixed(2)}`,
            });
          } else {
            console.log(`[Stripe Webhook] Duplicate session ${stripeSessionId} — skipping`);
          }
        } catch (err: any) {
          console.error("[Stripe Webhook] Error processing checkout.session.completed:", err);
          return res.status(500).json({ error: "Internal error" });
        }
      }

      res.json({ received: true });
    }
  );
}
