/**
 * Creates a Stripe promo code for Utilities Kingston:
 * - 5% off (stacks on top of 15% volume discount → ~20% net)
 * - Max 2 redemptions (one per manager)
 * - Duration: once (first payment only)
 * - Code: KINGSTON20
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

async function createPromoCode() {
  // Step 1: Create the coupon (5% off, once, max 2 redemptions)
  const coupon = await stripe.coupons.create({
    percent_off: 5,
    duration: "once",
    max_redemptions: 2,
    name: "Utilities Kingston 5% Stackable Discount",
    metadata: {
      purpose: "Utilities Kingston split-purchase top-up to 25-seat tier equivalent",
      created_by: "Manus",
    },
  });

  console.log("✅ Coupon created:", coupon.id);

  // Step 2: Create the promo code tied to the coupon
  const promoCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: "KINGSTON20",
    max_redemptions: 2,
    metadata: {
      customer: "Utilities Kingston",
      note: "5% stackable on top of 15% volume discount for split 25-seat purchase",
    },
  });

  console.log("\n✅ Promo code created successfully");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Code:            ", promoCode.code);
  console.log("  Discount:         5% off (once)");
  console.log("  Max redemptions:  2");
  console.log("  Duration:         once (first payment only)");
  console.log("  Coupon ID:       ", coupon.id);
  console.log("  Promo Code ID:   ", promoCode.id);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📋 Math check (base price $297/seat):");
  const base = 297;
  const afterVolume = base * 0.85;
  const afterPromo = afterVolume * 0.95;
  const tier25 = base * 0.80;
  console.log(`  Base price:              $${base.toFixed(2)}/seat`);
  console.log(`  After 15% volume:        $${afterVolume.toFixed(2)}/seat`);
  console.log(`  After 5% promo code:     $${afterPromo.toFixed(2)}/seat`);
  console.log(`  25+ seat tier (20% off): $${tier25.toFixed(2)}/seat`);
  console.log(`  Combined effective disc: ${(((base - afterPromo) / base) * 100).toFixed(2)}%`);
}

createPromoCode().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
