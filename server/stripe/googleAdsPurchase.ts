import { createHash } from "node:crypto";
import type Stripe from "stripe";
import type { ValidatedOneTimeCheckout } from "./validateOneTimeCheckout";

/** Configure only after a real direct website Purchase action has been verified.
 * No label or measurement start means no conversion, not a fallback Sign-up event.
 */
export function googleAdsPurchaseConversion(
  checkout: ValidatedOneTimeCheckout,
  session: Pick<Stripe.Checkout.Session, "created" | "livemode" | "amount_total" | "id">,
  recorded: boolean,
  config = {
    label: process.env.GOOGLE_ADS_PURCHASE_LABEL,
    startAt: process.env.GOOGLE_ADS_PURCHASE_START_AT,
  },
) {
  const label = config.label ?? "";
  const start = Date.parse(config.startAt ?? "");
  const amount = checkout.amountPaidCents;
  if (!recorded || !session.livemode || !/^[a-zA-Z0-9_-]{6,100}$/.test(label)
    || session.id !== checkout.sessionId || session.amount_total !== amount
    || !Number.isFinite(start) || !Number.isFinite(session.created) || session.created * 1000 < start
    || !Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000) return null;
  return {
    sendTo: `AW-18491909141/${label}`,
    value: amount / 100,
    currency: checkout.currency.toUpperCase() as "CAD" | "USD",
    transactionId: `echelon_${createHash("sha256").update(`echelon-google-ads-purchase-v1:${checkout.sessionId}`).digest("hex")}`,
  };
}
