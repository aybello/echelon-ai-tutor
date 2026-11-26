import { and, eq, gt, inArray, isNull, lt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "../db";
import { abandonedCheckouts, purchases } from "../../drizzle/schema";
import { isSyntheticCustomerEmail } from "../../shared/revenueReporting";
import { resolveQuizGateOffer } from "../../shared/checkoutOffer";
import {
  formatCheckoutPrice,
  sendAbandonedCheckoutEmail,
} from "../abandonedCheckoutEmail";

/**
 * Recovery for abandoned individual checkouts.
 *
 * Exactly one email per abandoned cart, then silence. Nothing about this job
 * drips: a buyer who ignores one reminder about a cart they opened does not
 * want a second.
 *
 * Timing: the send waits a few hours. Sending the instant Stripe expires a
 * session would often reach someone who simply closed a tab and came back, and
 * waiting too long means the exam deadline that motivated them has moved on.
 *
 * Hard suppressions, checked at send time, in order:
 * - opted out (one-click unsubscribe)
 * - synthetic or internal test addresses
 * - the cart was already recovered
 * - the person has an active purchase (never market an owned course)
 *
 * The sent marker is written only after the send succeeds, so a transient SMTP
 * failure retries on the next run instead of silently dropping the cart.
 */

/** Wait before the single recovery send. Long enough to avoid interrupting a
 * learner who simply reopened the page, short enough to stay relevant. */
export const RECOVERY_DELAY_MS = 6 * 60 * 60 * 1000;
/** Carts older than this are cold; a surprise email that late reads as spam. */
export const MAX_CART_AGE_MS = 14 * 24 * 60 * 60 * 1000;
/** Upper bound per run to keep a single run fast and SMTP-friendly. */
const MAX_SENDS_PER_RUN = 25;

export interface AbandonedCheckoutRecoveryResult {
  considered: number;
  sent: number;
  suppressedPurchased: number;
  suppressedOptOut: number;
  suppressedSynthetic: number;
  failed: number;
}

/** Decide whether a recorded cart is due for its single recovery email.
 * Pure and exported for tests. */
export function isDueForRecovery(cart: {
  optOut: boolean;
  recoveryEmailSentAt: Date | null;
  recoveredAt: Date | null;
  abandonedAt: Date;
  now?: Date;
}): boolean {
  const now = cart.now ?? new Date();
  if (cart.optOut) return false;
  if (cart.recoveryEmailSentAt) return false;
  if (cart.recoveredAt) return false;
  const age = now.getTime() - cart.abandonedAt.getTime();
  if (age < RECOVERY_DELAY_MS) return false;
  if (age > MAX_CART_AGE_MS) return false;
  return true;
}

/**
 * Resolve the link and display details for the cart. The Stripe recovery URL
 * reopens the exact cart, which is the best experience. When Stripe gave none,
 * fall back to the pricing page with the course preselected so the learner is
 * never dropped on a generic page.
 */
export function resolveRecoveryTarget(cart: {
  productKey: string;
  productName: string | null;
  amountCents: number;
  currency: string;
  recoveryUrl: string | null;
}): { productName: string; priceLabel: string; checkoutUrl: string } {
  const site = "https://echeloninstitute.ca";
  const offer = resolveQuizGateOffer(cart.productKey);
  const productName =
    cart.productName ??
    (offer.available ? offer.productName : "Echelon Exam Pass");
  const priceLabel =
    cart.amountCents > 0
      ? formatCheckoutPrice(cart.amountCents, cart.currency)
      : (offer.priceLabel ?? "the listed price");
  const checkoutUrl =
    cart.recoveryUrl ??
    `${site}/pricing?course=${encodeURIComponent(cart.productKey)}`;
  return { productName, priceLabel, checkoutUrl };
}

export async function runAbandonedCheckoutRecovery(
  send: typeof sendAbandonedCheckoutEmail = sendAbandonedCheckoutEmail
): Promise<AbandonedCheckoutRecoveryResult> {
  const result: AbandonedCheckoutRecoveryResult = {
    considered: 0,
    sent: 0,
    suppressedPurchased: 0,
    suppressedOptOut: 0,
    suppressedSynthetic: 0,
    failed: 0,
  };

  const db = await getDb();
  if (!db) return result;

  const now = new Date();
  const dueBefore = new Date(now.getTime() - RECOVERY_DELAY_MS);
  const notOlderThan = new Date(now.getTime() - MAX_CART_AGE_MS);

  const candidates = await db
    .select()
    .from(abandonedCheckouts)
    .where(
      and(
        eq(abandonedCheckouts.optOut, false),
        isNull(abandonedCheckouts.recoveryEmailSentAt),
        isNull(abandonedCheckouts.recoveredAt),
        lt(abandonedCheckouts.abandonedAt, dueBefore),
        gt(abandonedCheckouts.abandonedAt, notOlderThan)
      )
    )
    .limit(200);

  if (candidates.length === 0) return result;

  // One query answers "has any candidate email already bought".
  const candidateEmails = Array.from(
    new Set(candidates.map(c => c.email.trim().toLowerCase()))
  );
  const purchasedRows = await db
    .select({ email: purchases.email })
    .from(purchases)
    .where(
      and(
        inArray(purchases.email, candidateEmails),
        eq(purchases.status, "active")
      )
    );
  const purchasedEmails = new Set(
    purchasedRows.map(r => r.email.trim().toLowerCase())
  );

  for (const cart of candidates) {
    if (result.sent >= MAX_SENDS_PER_RUN) break;
    if (
      !isDueForRecovery({
        optOut: cart.optOut,
        recoveryEmailSentAt: cart.recoveryEmailSentAt,
        recoveredAt: cart.recoveredAt,
        abandonedAt: cart.abandonedAt,
        now,
      })
    ) {
      continue;
    }
    result.considered += 1;

    const email = cart.email.trim().toLowerCase();

    if (isSyntheticCustomerEmail(email)) {
      result.suppressedSynthetic += 1;
      // Park the row so it stops matching the candidate query forever.
      await db
        .update(abandonedCheckouts)
        .set({ recoveryEmailSentAt: now })
        .where(eq(abandonedCheckouts.id, cart.id));
      continue;
    }

    if (purchasedEmails.has(email)) {
      result.suppressedPurchased += 1;
      await db
        .update(abandonedCheckouts)
        .set({ recoveredAt: now })
        .where(eq(abandonedCheckouts.id, cart.id));
      continue;
    }

    let token = cart.unsubscribeToken;
    if (!token) {
      token = randomBytes(24).toString("hex");
      await db
        .update(abandonedCheckouts)
        .set({ unsubscribeToken: token })
        .where(
          and(
            eq(abandonedCheckouts.id, cart.id),
            isNull(abandonedCheckouts.unsubscribeToken)
          )
        );
    }

    const target = resolveRecoveryTarget({
      productKey: cart.productKey,
      productName: cart.productName,
      amountCents: cart.amountCents,
      currency: cart.currency,
      recoveryUrl: cart.recoveryUrl,
    });

    try {
      await send({
        email,
        productName: target.productName,
        priceLabel: target.priceLabel,
        checkoutUrl: target.checkoutUrl,
        unsubscribeUrl: `https://echeloninstitute.ca/api/unsubscribe-cart?token=${token}`,
      });
      // Mark sent ONLY after success, so failures retry on the next run.
      await db
        .update(abandonedCheckouts)
        .set({ recoveryEmailSentAt: now })
        .where(eq(abandonedCheckouts.id, cart.id));
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      console.error(
        `[abandoned-checkout] send failed for cart ${cart.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return result;
}
