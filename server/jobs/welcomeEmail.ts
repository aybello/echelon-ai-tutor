/**
 * Welcome email scheduled job.
 *
 * Runs every hour and sends the 24-hour onboarding email to any purchase
 * where:
 *   - welcomeEmailSentAt IS NULL (not yet sent)
 *   - createdAt <= NOW() - 24 hours (enough time has elapsed)
 *   - status = 'active' (skip refunded/disputed purchases)
 *
 * After sending, sets welcomeEmailSentAt = NOW() so the row is never
 * processed again. This replaces the fragile setTimeout() that was in
 * server/stripe/webhook.ts and survives server restarts.
 */
import { and, eq, isNull, lte } from "drizzle-orm";
import { getDb } from "../db";
import { purchases } from "../../drizzle/schema";
import { sendWelcomeOnboardingEmail } from "../email";
import { PRODUCT_STUDY_PATHS } from "../stripe/products";
import { notifyOwner } from "../_core/notification";
import { withRetry } from "./retry";

export interface WelcomeEmailResult {
  sent: number;
  skipped: number;
  errors: string[];
}

export async function runWelcomeEmailJob(): Promise<WelcomeEmailResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  // Find all purchases that are ready for the onboarding email
  const pending = await db
    .select()
    .from(purchases)
    .where(
      and(
        isNull(purchases.welcomeEmailSentAt),
        lte(purchases.createdAt, cutoff),
        eq(purchases.status, "active")
      )
    )
    .limit(100); // process at most 100 per run to avoid timeouts

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const purchase of pending) {
    try {
      const studyPaths = PRODUCT_STUDY_PATHS[purchase.productKey] ?? {
        quizPath: "/quiz",
        mockPath: "/quiz",
      };

      await sendWelcomeOnboardingEmail({
        email: purchase.email,
        customerName: purchase.customerName ?? null,
        productName: purchase.productName,
        productKey: purchase.productKey,
        quizPath: studyPaths.quizPath,
        mockPath: studyPaths.mockPath,
      });

      // Mark as sent so this row is never processed again
      await db
        .update(purchases)
        .set({ welcomeEmailSentAt: new Date() })
        .where(eq(purchases.id, purchase.id));

      sent++;
      console.log(
        `[welcomeEmail] Sent onboarding email to ${purchase.email} for ${purchase.productKey} (purchase #${purchase.id})`
      );
    } catch (err: any) {
      errors.push(`purchase #${purchase.id} (${purchase.email}): ${err.message}`);
      console.error(
        `[welcomeEmail] Failed to send to ${purchase.email} (purchase #${purchase.id}):`,
        err.message
      );
    }
  }

  skipped = pending.length - sent - errors.length;
  return { sent, skipped, errors };
}

/**
 * Start the hourly welcome email cron job.
 * Runs every hour at :05 past the hour to avoid contention with other jobs.
 */
export function startWelcomeEmailJob(): void {
  import("node-cron")
    .then(({ default: cron }) => {
      cron.schedule("5 * * * *", async () => {
        console.log("[cron] Running welcome email job...");
        try {
          const result = await withRetry(() => runWelcomeEmailJob(), "welcomeEmail");
          if (result.sent > 0 || result.errors.length > 0) {
            const msg = `Welcome email job: ${result.sent} sent, ${result.errors.length} errors.`;
            console.log(`[cron] ${msg}`);
            await notifyOwner({
              title: `📧 Welcome Emails: ${result.sent} sent`,
              content:
                result.errors.length > 0
                  ? `${msg}\n\nErrors:\n${result.errors.join("\n")}`
                  : msg,
            }).catch((err) => {
              console.error("[welcomeEmail] notifyOwner failed:", err);
            });
          } else {
            console.log("[cron] Welcome email job: nothing to send.");
          }
        } catch (err: any) {
          console.error("[cron] Welcome email job failed:", err.message);
          await notifyOwner({
            title: "❌ Welcome Email Job Failed",
            content: `The hourly welcome email job threw an error: ${err.message}`,
          }).catch((err) => {
            console.error("[welcomeEmail] notifyOwner failed:", err);
          });
        }
      });
      console.log("[cron] Hourly welcome email job scheduled at :05 past the hour");
    })
    .catch((err) => {
      console.error("[cron] Failed to load node-cron for welcome email job:", err.message);
    });
}
