/**
 * Reads current_period_start / current_period_end from a Stripe subscription object.
 *
 * In Stripe API version 2026-03-25.dahlia these fields were moved from the top-level
 * subscription object onto each subscription item (sub.items.data[0]).  This helper
 * reads the item-level fields first and falls back to the legacy sub-level fields so
 * that the same code works across API versions.
 *
 * Use this helper everywhere period dates are needed — webhook AND backfill — so the
 * logic lives in exactly one place and cannot drift.
 */
export function getSubscriptionPeriod(sub: any): {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
} {
  const item = sub.items?.data?.[0];
  const startUnix = item?.current_period_start ?? sub.current_period_start ?? null;
  const endUnix   = item?.current_period_end   ?? sub.current_period_end   ?? null;
  return {
    currentPeriodStart: startUnix ? new Date(startUnix * 1000) : null,
    currentPeriodEnd:   endUnix   ? new Date(endUnix   * 1000) : null,
  };
}
