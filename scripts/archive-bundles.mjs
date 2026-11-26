// Script to list active Stripe products and archive any bundle products
// Run: node scripts/archive-bundles.mjs
import https from "https";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env") });

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_KEY) {
  console.log("No STRIPE_SECRET_KEY found in environment. Skipping.");
  process.exit(0);
}

function stripeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.stripe.com/v1${endpoint}`);
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log("Fetching active Stripe products...");
  const result = await stripeRequest("GET", "/products?limit=100&active=true");

  if (result.error) {
    console.error("Stripe API error:", result.error.message);
    process.exit(1);
  }

  const products = result.data ?? [];
  console.log(`Found ${products.length} active products:\n`);

  const bundleProducts = [];
  for (const p of products) {
    const isBundle =
      p.name?.toLowerCase().includes("bundle") ||
      p.metadata?.product_key?.startsWith("bundle-");
    console.log(`  ${p.id}  ${p.name}  ${isBundle ? "[BUNDLE]" : ""}`);
    if (isBundle) bundleProducts.push(p);
  }

  if (bundleProducts.length === 0) {
    console.log("\nNo bundle products found in Stripe Dashboard.");
    console.log(
      "Note: Bundles use price_data (dynamic pricing), so no Stripe Product objects were created."
    );
    console.log(
      "Bundles are already disabled in the app UI — no further action needed."
    );
    return;
  }

  console.log(`\nArchiving ${bundleProducts.length} bundle product(s)...`);
  for (const p of bundleProducts) {
    const res = await stripeRequest("POST", `/products/${p.id}`, "active=false");
    if (res.id) {
      console.log(`  ✓ Archived: ${p.id} — ${p.name}`);
    } else {
      console.error(`  ✗ Failed to archive ${p.id}:`, res.error?.message);
    }
  }
  console.log("\nDone.");
}

main().catch(console.error);
