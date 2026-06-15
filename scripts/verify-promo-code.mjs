/**
 * Verifies the KINGSTON20 promo code exists and is active in Stripe
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

async function verify() {
  // Look up the promo code by code string
  const results = await stripe.promotionCodes.list({ code: "KINGSTON20", limit: 1 });

  if (!results.data.length) {
    console.error("❌ KINGSTON20 not found in Stripe");
    process.exit(1);
  }

  const promo = results.data[0];
  const coupon = promo.coupon;

  console.log("✅ Promo code found in Stripe");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Code:              ", promo.code);
  console.log("  Active:            ", promo.active);
  console.log("  Times redeemed:    ", promo.times_redeemed);
  console.log("  Max redemptions:   ", promo.max_redemptions);
  console.log("  Coupon ID:         ", coupon.id);
  console.log("  Coupon % off:      ", coupon.percent_off + "%");
  console.log("  Coupon duration:   ", coupon.duration);
  console.log("  Coupon valid:      ", coupon.valid);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!promo.active) {
    console.error("❌ Promo code is NOT active");
    process.exit(1);
  }
  if (!coupon.valid) {
    console.error("❌ Underlying coupon is NOT valid");
    process.exit(1);
  }
  if (coupon.percent_off !== 5) {
    console.error(`❌ Discount is ${coupon.percent_off}% — expected 5%`);
    process.exit(1);
  }
  if (promo.max_redemptions !== 2) {
    console.error(`❌ Max redemptions is ${promo.max_redemptions} — expected 2`);
    process.exit(1);
  }
  if (coupon.duration !== "once") {
    console.error(`❌ Duration is ${coupon.duration} — expected 'once'`);
    process.exit(1);
  }

  console.log("\n✅ All checks passed — KINGSTON20 is ready to use");
}

verify().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
