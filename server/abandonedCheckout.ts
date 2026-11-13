import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { abandonedCheckouts } from "../drizzle/schema";
import { isSyntheticCustomerEmail } from "../shared/revenueReporting";

/**
 * Recording of abandoned individual checkouts.
 *
 * A learner who reaches the Stripe payment page has already chosen a course and
 * a price. Until now, when that session expired the person disappeared, because
 * the email is typed on Stripe's page rather than ours. Stripe hands back both
 * the consented email and a link that reopens the same cart, so the warmest
 * buyer we ever see becomes one polite follow-up instead of nothing.
 *
 * This module only records. Sending is the job's decision, made later, so a
 * webhook never blocks on SMTP and a replayed webhook never sends twice.
 */

export interface AbandonedCheckoutRecord {
  stripeSessionId: string;
  email: string;
  productKey: string;
  productName: string | null;
  amountCents: number;
  currency: string;
  recoveryUrl: string | null;
}

/**
 * Pull the recoverable facts out of an expired Stripe checkout session.
 *
 * Returns null when the session is not a recoverable individual purchase:
 * team sessions have their own recovery path, a session with no email cannot be
 * contacted, and a synthetic test address must never receive customer email.
 * Pure and exported so the decision is testable without Stripe or a database.
 */
export function extractAbandonedCheckout(
  session: unknown
): AbandonedCheckoutRecord | null {
  if (!session || typeof session !== "object") return null;
  const s = session as Record<string, any>;

  const id = typeof s.id === "string" ? s.id : "";
  if (!id) return null;

  const metadata = (s.metadata ?? {}) as Record<string, unknown>;

  // Team purchases are recovered by their own job and must not be duplicated.
  if (metadata.type === "team_flex_extension") return null;
  if (metadata.teamFlexOrderId) return null;
  if (metadata.type === "team_flex") return null;
  if (s.mode && s.mode !== "payment") return null;

  const productKey =
    typeof metadata.product_key === "string" ? metadata.product_key.trim() : "";
  if (!productKey) return null;

  const rawEmail =
    (typeof s.customer_details?.email === "string" && s.customer_details.email) ||
    (typeof s.customer_email === "string" && s.customer_email) ||
    (typeof metadata.customer_email === "string" && metadata.customer_email) ||
    "";
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  if (isSyntheticCustomerEmail(email)) return null;

  const productName =
    typeof metadata.product_name === "string" && metadata.product_name.trim()
      ? metadata.product_name.trim().slice(0, 128)
      : null;

  const amountCents =
    typeof s.amount_total === "number" && Number.isFinite(s.amount_total)
      ? Math.max(0, Math.round(s.amount_total))
      : 0;

  const currency =
    typeof s.currency === "string" && s.currency.trim()
      ? s.currency.trim().toLowerCase().slice(0, 8)
      : "cad";

  const recoveryRaw = s.after_expiration?.recovery?.url;
  const recoveryUrl =
    typeof recoveryRaw === "string" && recoveryRaw.startsWith("https://")
      ? recoveryRaw.slice(0, 512)
      : null;

  return {
    stripeSessionId: id.slice(0, 128),
    email: email.slice(0, 320),
    productKey: productKey.slice(0, 64),
    productName,
    amountCents,
    currency,
    recoveryUrl,
  };
}

/**
 * Persist an abandoned checkout. Idempotent on the Stripe session id, so a
 * replayed webhook refreshes the recovery link without resetting the send
 * state or creating a second row.
 */
export async function recordAbandonedCheckout(
  db: any,
  record: AbandonedCheckoutRecord
): Promise<void> {
  await db
    .insert(abandonedCheckouts)
    .values({
      stripeSessionId: record.stripeSessionId,
      email: record.email,
      productKey: record.productKey,
      productName: record.productName,
      amountCents: record.amountCents,
      currency: record.currency,
      recoveryUrl: record.recoveryUrl,
      unsubscribeToken: randomBytes(24).toString("hex"),
    })
    .onDuplicateKeyUpdate({
      set: {
        recoveryUrl: sql`COALESCE(VALUES(recoveryUrl), recoveryUrl)`,
      },
    });
}

/** Mark every abandoned row for this email as recovered once they buy. */
export async function markAbandonedCheckoutRecovered(
  db: any,
  email: string,
  when: Date = new Date()
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  await db
    .update(abandonedCheckouts)
    .set({ recoveredAt: when })
    .where(eq(abandonedCheckouts.email, normalized));
}
