export const CHECKOUT_RECOVERY_NOTICE_VERSION = "checkout-reminder-2026-10-11";
export const CHECKOUT_RECOVERY_CONSENT_SOURCE = "checkout-checkbox";
export const CHECKOUT_RECOVERY_NOTICE =
  "Email me one reminder if I do not finish this purchase. Optional; I can unsubscribe at any time.";

/** Only the server supplies the acceptance time stored in signed Stripe metadata. */
export function checkoutRecoveryConsentMetadata(
  optIn: boolean,
  now = new Date()
): Record<string, string> {
  return optIn
    ? {
        checkout_reminder_opt_in: "yes",
        checkout_reminder_accepted_at: now.toISOString(),
        checkout_reminder_notice_version: CHECKOUT_RECOVERY_NOTICE_VERSION,
      }
    : {};
}
