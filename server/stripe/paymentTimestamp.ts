/**
 * Returns the stable timestamp at which Stripe created a successful-payment
 * webhook event. It must not be replaced with local webhook processing time,
 * which can drift when Stripe retries delivery.
 */
export function paymentTimestampFromStripeEvent(eventCreatedSeconds: unknown): Date {
  if (typeof eventCreatedSeconds !== "number" || !Number.isFinite(eventCreatedSeconds) || eventCreatedSeconds <= 0) {
    throw new Error("Stripe event is missing a valid creation timestamp");
  }
  return new Date(Math.floor(eventCreatedSeconds * 1000));
}

/** Returns the Stripe timestamp from a verified successful charge. */
export function paymentTimestampFromSuccessfulCharge(chargeCreatedSeconds: unknown): Date {
  if (
    typeof chargeCreatedSeconds === "number" &&
    Number.isFinite(chargeCreatedSeconds) &&
    chargeCreatedSeconds > 0
  ) {
    return new Date(Math.floor(chargeCreatedSeconds * 1000));
  }
  throw new Error("Paid PaymentIntent is missing a successful charge timestamp");
}

type PaymentIntentTimestampRecord = {
  status?: unknown;
  latest_charge?: unknown;
};

/**
 * Resolves the authoritative successful-payment timestamp for a Checkout
 * Session. A versioned term must not be written from browser, session, or
 * webhook processing time because those can all drift from the actual charge.
 */
export async function paymentTimestampFromSuccessfulPaymentIntent(
  paymentIntentId: unknown,
  retrievePaymentIntent: (id: string) => Promise<PaymentIntentTimestampRecord>,
): Promise<Date> {
  const normalizedId = typeof paymentIntentId === "string"
    ? paymentIntentId
    : typeof paymentIntentId === "object" && paymentIntentId !== null
      ? (paymentIntentId as { id?: unknown }).id
      : undefined;
  if (typeof normalizedId !== "string" || normalizedId.length === 0) {
    throw new Error("Paid Checkout Session is missing a PaymentIntent ID");
  }

  const paymentIntent = await retrievePaymentIntent(normalizedId);
  if (paymentIntent.status !== "succeeded") {
    throw new Error("PaymentIntent has not succeeded");
  }
  const charge = paymentIntent.latest_charge;
  const chargeCreated = typeof charge === "object" && charge !== null
    ? (charge as { created?: unknown }).created
    : undefined;
  const chargePaid = typeof charge === "object" && charge !== null
    ? (charge as { paid?: unknown }).paid
    : undefined;
  const chargeStatus = typeof charge === "object" && charge !== null
    ? (charge as { status?: unknown }).status
    : undefined;
  if (chargePaid !== true && chargeStatus !== "succeeded") {
    throw new Error("PaymentIntent has no successful charge");
  }
  return paymentTimestampFromSuccessfulCharge(chargeCreated);
}
