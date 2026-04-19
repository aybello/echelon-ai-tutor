/**
 * Stripe purchase reconciliation helper.
 * Can be called from the admin tRPC procedure OR the scheduled cron job.
 */
import Stripe from "stripe";
import { withRetry } from "./retry";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { purchases, users } from "../../drizzle/schema";
import { sendPurchaseConfirmationEmail } from "../email";
import { PRODUCT_STUDY_PATHS } from "../stripe/products";
import { notifyOwner } from "../_core/notification";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export interface ReconcileResult {
  recovered: number;
  skipped: number;
  details: { email: string; productKey: string; sessionId: string }[];
  errors: string[];
}

export async function runReconciliation(hoursBack: number = 48): Promise<ReconcileResult> {
  const stripe = getStripe();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;
  const recovered: { email: string; productKey: string; sessionId: string }[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.Checkout.SessionListParams = {
      limit: 100,
      created: { gte: since },
      status: "complete",
    };
    if (startingAfter) params.starting_after = startingAfter;

    const page = await stripe.checkout.sessions.list(params);

    for (const session of page.data) {
      try {
        const productKey = session.metadata?.product_key;
        const email =
          (session as any).customer_details?.email ??
          session.customer_email ??
          session.metadata?.customer_email;

        if (!productKey || !email || session.payment_status !== "paid") {
          skipped.push(session.id);
          continue;
        }

        // Check if already in DB
        const existing = await db
          .select({ id: purchases.id })
          .from(purchases)
          .where(eq(purchases.stripeSessionId, session.id))
          .limit(1);

        if (existing.length > 0) {
          skipped.push(session.id);
          continue;
        }

        // Insert the missing purchase
        const productName = session.metadata?.product_name ?? productKey;
        const amountCAD = session.amount_total ?? 0;
        const stripePaymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        const userId = session.metadata?.user_id
          ? parseInt(session.metadata.user_id)
          : null;
        const phone = (session as any).customer_details?.phone ?? null;

        await db.insert(purchases).values({
          userId: userId ?? undefined,
          email,
          productKey,
          productName,
          amountCAD,
          stripeSessionId: session.id,
          stripePaymentIntentId,
          phone,
        });

        // Save phone to users table if available
        if (phone) {
          const targetUserId =
            userId ??
            (await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, email))
              .limit(1)
              .then(rows => rows[0]?.id ?? null));
          if (targetUserId) {
            await db.update(users).set({ phone }).where(eq(users.id, targetUserId));
          }
        }

        // Send confirmation email (non-blocking)
        const studyPaths = PRODUCT_STUDY_PATHS[productKey] ?? { quizPath: "/quiz", mockPath: "/quiz" };
        sendPurchaseConfirmationEmail({
          email,
          productName,
          productKey,
          amountCAD,
          quizPath: studyPaths.quizPath,
          mockPath: studyPaths.mockPath,
        }).catch(err => console.error("[reconcile] Email failed:", err.message));

        recovered.push({ email, productKey, sessionId: session.id });
        console.log(`[reconcile] Recovered missing purchase: ${email} → ${productKey} (${session.id})`);
      } catch (err: any) {
        errors.push(`${session.id}: ${err.message}`);
        console.error(`[reconcile] Error processing session ${session.id}:`, err.message);
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  return { recovered: recovered.length, skipped: skipped.length, details: recovered, errors };
}

/**
 * Start the daily reconciliation cron job.
 * Runs every day at 3:00 AM server time.
 */
export function startReconciliationJob(): void {
  // Dynamic import to avoid bundling issues
  import("node-cron").then(({ default: cron }) => {
    cron.schedule("0 3 * * *", async () => {
      console.log("[cron] Starting daily Stripe reconciliation...");
      try {
        const result = await withRetry(() => runReconciliation(26), "reconcile"); // 26h window to overlap with previous run
        const msg = `Daily reconciliation complete: ${result.recovered} recovered, ${result.skipped} already present, ${result.errors.length} errors.`;
        console.log(`[cron] ${msg}`);

        if (result.recovered > 0 || result.errors.length > 0) {
          const details = result.recovered > 0
            ? result.details.map(d => `• ${d.email} → ${d.productKey}`).join("\n")
            : "";
          const errorDetails = result.errors.length > 0
            ? `\n\nErrors:\n${result.errors.join("\n")}`
            : "";
          await notifyOwner({
            title: `🔄 Daily Stripe Sync: ${result.recovered} recovered`,
            content: `${msg}\n\n${details}${errorDetails}`,
          }).catch((err) => { console.error("[reconcile] notifyOwner failed:", err); });
        }
      } catch (err: any) {
        console.error("[cron] Reconciliation failed:", err.message);
        await notifyOwner({
          title: "❌ Daily Stripe Sync Failed",
          content: `The nightly reconciliation job threw an error: ${err.message}`,
        }).catch((err) => { console.error("[reconcile] notifyOwner failed:", err); });
      }
    });
    console.log("[cron] Daily Stripe reconciliation scheduled at 3:00 AM");
  }).catch(err => {
    console.error("[cron] Failed to load node-cron:", err.message);
  });
}
