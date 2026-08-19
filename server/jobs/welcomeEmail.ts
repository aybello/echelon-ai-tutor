/**
 * Welcome email delivery worker.
 *
 * Invoked hourly by the platform-managed Heartbeat callback. It sends the
 * 24-hour onboarding email only for active purchases that have not yet been
 * recorded as delivered. The process has no in-memory timer, so it survives
 * autoscaling, restarts, and idle-instance termination.
 */
import { and, eq, isNull, lte } from "drizzle-orm";
import { getDb } from "../db";
import { purchases, type Purchase } from "../../drizzle/schema";
import { sendWelcomeOnboardingEmail } from "../email";
import { PRODUCT_STUDY_PATHS } from "../stripe/products";

export interface WelcomeEmailResult {
  sent: number;
  skipped: number;
  errors: string[];
  /**
   * A known, non-retryable deployment prerequisite is missing. The scheduled
   * endpoint returns 200 for this state so Heartbeat does not email the owner
   * every hour while the database is being reconciled.
   */
  deferred?: "missing_welcome_email_column";
}

/**
 * Project-owned Heartbeat identity created for the hourly welcome-email job.
 * This is not a secret; callback access still requires a valid cron session.
 */
export const WELCOME_EMAIL_HEARTBEAT_TASK_UID = "cZST8deaHfDg7fKZDTWz5u";

export const isWelcomeEmailHeartbeatTask = (taskUid: string | undefined): boolean =>
  taskUid === WELCOME_EMAIL_HEARTBEAT_TASK_UID;

/** Stable transport identity retained if the callback itself is retried. */
export const getWelcomeEmailMessageId = (purchaseId: number): string =>
  `<welcome-purchase-${purchaseId}@echeloninstitute.ca>`;

/**
 * Drizzle wraps mysql2 failures, so inspect both the public error and its cause.
 * Keep this deliberately narrow: only MySQL's unknown-column failure for the
 * welcome-email marker is non-retryable. Database outages and SMTP failures
 * must still surface as 5xx responses and alert normally.
 */
export function isMissingWelcomeEmailColumnError(error: unknown): boolean {
  const candidates: unknown[] = [error];
  if (typeof error === "object" && error !== null && "cause" in error) {
    candidates.push((error as { cause?: unknown }).cause);
  }

  return candidates.some(candidate => {
    if (typeof candidate !== "object" || candidate === null) return false;
    const mysqlError = candidate as {
      code?: unknown;
      errno?: unknown;
      message?: unknown;
      sqlMessage?: unknown;
    };
    const message = [mysqlError.message, mysqlError.sqlMessage]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
    const isUnknownColumn =
      mysqlError.code === "ER_BAD_FIELD_ERROR" ||
      mysqlError.errno === 1054 ||
      /unknown column/i.test(message);
    return isUnknownColumn && /welcomeEmailSentAt/i.test(message);
  });
}

export type WelcomeEmailDependencies = {
  sendWelcomeOnboardingEmail: typeof sendWelcomeOnboardingEmail;
  markSent: (purchaseId: number, sentAt: Date) => Promise<void>;
};

export async function deliverWelcomeEmailForPurchase(
  purchase: Pick<Purchase, "id" | "email" | "customerName" | "productName" | "productKey">,
  dependencies: WelcomeEmailDependencies,
  sentAt = new Date(),
): Promise<void> {
  const studyPaths = PRODUCT_STUDY_PATHS[purchase.productKey] ?? {
    quizPath: "/quiz",
    mockPath: "/quiz",
  };

  await dependencies.sendWelcomeOnboardingEmail({
    email: purchase.email,
    customerName: purchase.customerName ?? null,
    productName: purchase.productName,
    productKey: purchase.productKey,
    quizPath: studyPaths.quizPath,
    mockPath: studyPaths.mockPath,
    messageId: getWelcomeEmailMessageId(purchase.id),
  });

  // Persist only after SMTP accepts the delivery. A failed send stays eligible
  // for the platform retry rather than silently disappearing from the queue.
  await dependencies.markSent(purchase.id, sentAt);
}

export const toWelcomeEmailScheduledResponse = (result: WelcomeEmailResult) => ({
  status: result.errors.length > 0 ? 500 : 200,
  body: {
    ok: result.errors.length === 0,
    sent: result.sent,
    skipped: result.skipped,
    errors: result.errors,
    deferred: result.deferred ?? null,
  },
});

export async function runWelcomeEmailJob(): Promise<WelcomeEmailResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let pending: Purchase[];
  try {
    pending = await db
      .select()
      .from(purchases)
      .where(
        and(
          isNull(purchases.welcomeEmailSentAt),
          lte(purchases.createdAt, cutoff),
          eq(purchases.status, "active"),
        ),
      )
      .limit(100);
  } catch (error) {
    if (!isMissingWelcomeEmailColumnError(error)) throw error;

    // This is a deployment prerequisite, not a transient job failure. Returning
    // a successful deferred result stops the hourly alert loop without sending
    // duplicate customer emails. The backup-gated repair command adds the
    // marker column and safely preserves only recent purchases as eligible.
    console.warn(
      "[welcomeEmail] Deferred: purchases.welcomeEmailSentAt is missing; run pnpm db:repair-welcome-email-column.",
    );
    return {
      sent: 0,
      skipped: 0,
      errors: [],
      deferred: "missing_welcome_email_column",
    };
  }

  let sent = 0;
  const errors: string[] = [];
  const dependencies: WelcomeEmailDependencies = {
    sendWelcomeOnboardingEmail,
    markSent: async (purchaseId, sentAt) => {
      await db
        .update(purchases)
        .set({ welcomeEmailSentAt: sentAt })
        .where(eq(purchases.id, purchaseId));
    },
  };

  for (const purchase of pending) {
    try {
      await deliverWelcomeEmailForPurchase(purchase, dependencies);
      sent++;
      console.log(
        `[welcomeEmail] Sent onboarding email for ${purchase.productKey} (purchase #${purchase.id})`,
      );
    } catch (err: any) {
      errors.push(`purchase #${purchase.id}: ${err.message}`);
      console.error(`[welcomeEmail] Failed for purchase #${purchase.id}:`, err.message);
    }
  }

  return { sent, skipped: pending.length - sent - errors.length, errors };
}
