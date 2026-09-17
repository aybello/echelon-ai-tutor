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
