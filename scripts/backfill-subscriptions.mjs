// One-shot backfill script: recovers subscriptions dropped by the period-end bug.
// Run with: node --import tsx/esm scripts/backfill-subscriptions.mjs
import "dotenv/config";
import { runSubscriptionReconciliation } from "../server/jobs/reconcile.ts";

console.log("[backfill] Starting subscription reconciliation...");
const result = await runSubscriptionReconciliation();
console.log("[backfill] Done.");
console.log(`  Recovered : ${result.recovered}`);
console.log(`  Skipped   : ${result.skipped}`);
console.log(`  Errors    : ${result.errors.length}`);
if (result.recovered > 0) {
  console.log("\nRecovered subscriptions:");
  result.details.forEach(d =>
    console.log(`  • ${d.email} → ${d.tier} (${d.province}) [${d.stripeSubscriptionId}]`)
  );
}
if (result.errors.length > 0) {
  console.log("\nErrors:");
  result.errors.forEach(e => console.log(`  ✗ ${e}`));
}
process.exit(result.errors.length > 0 ? 1 : 0);
