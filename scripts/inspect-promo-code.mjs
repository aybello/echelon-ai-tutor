/**
 * Inspects the KINGSTON20 promo code in full detail
 */

import Stripe from "stripe";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

async function inspect() {
  // Check which mode the key is for
  const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 7);
  console.log("Stripe key mode:", keyPrefix?.startsWith("sk_live") ? "LIVE" : "TEST");

  // Look up promo code
  const results = await stripe.promotionCodes.list({ code: "KINGSTON20", limit: 1 });
  if (!results.data.length) {
    console.error("❌ KINGSTON20 not found");
    process.exit(1);
  }

  const promo = results.data[0];
  const coupon = promo.coupon;

  console.log("\nFull promo code details:");
  console.log(JSON.stringify(promo, null, 2));

  console.log("\nFull coupon details:");
  console.log(JSON.stringify(coupon, null, 2));

  // Check restrictions
  console.log("\n--- Restriction checks ---");
  console.log("Promo applies_to:", promo.restrictions?.applies_to ?? "none (applies to all products)");
  console.log("Coupon applies_to:", coupon.applies_to ?? "none (applies to all products)");
  console.log("Currency restrictions:", coupon.currency_options ?? "none");
  console.log("Minimum amount:", promo.restrictions?.minimum_amount ?? "none");
  console.log("First time transaction only:", promo.restrictions?.first_time_transaction ?? false);
}

inspect().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
