/**
 * Revenue reporting rules.
 *
 * Reported revenue was overstating actual money received. Three separate
 * causes, all of which inflate the number in the same direction:
 *
 *   1. Synthetic rows. Load, paging and reliability checks wrote purchases
 *      against @echelon.test addresses at real-looking prices. Nine such
 *      rows added about $2,691 that no customer ever paid.
 *   2. Seeded zero-amount rows. Catalogue rows with amountCAD = 0 inflate
 *      order counts while adding no money.
 *   3. Expired and refunded rows. Counting these reports money that is no
 *      longer active revenue.
 *
 * A fourth cause moves the number the other way, understating it:
 *
 *   4. Omitted revenue tables. Team flex orders are paid through Stripe and
 *      recorded only in team_flex_orders. Nothing in the flex checkout path
 *      writes a purchases row, so every surface that summed purchases plus
 *      subscriptions reported B2B revenue as zero and understated the real
 *      total. Any new table that receives money must be added here.
 *
 * Flex money cannot simply be added, because a historical recovery backfill
 * mirrored two flex payments into purchases with synthetic session ids of the
 * form "legacy-recovery-purchase-...". Those rows carry the Stripe charge id
 * for the same payment as the flex order's payment intent. Adding both would
 * double count. Dedupe by Stripe payment core before summing.
 *
 * Any surface that reports money must use these helpers so the dashboard,
 * exports and investor-facing figures cannot drift apart. A founder quoting
 * a number from the dashboard needs it to be the number in the bank.
 */

/** Domain used by automated checks that write purchase-shaped rows. */
export const SYNTHETIC_EMAIL_DOMAIN = "@echelon.test";

/**
 * True when an address belongs to automated testing rather than a customer.
 * Checked case-insensitively because checkout does not normalise case.
 */
export function isSyntheticCustomerEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().includes(SYNTHETIC_EMAIL_DOMAIN);
}

/**
 * True when a row represents money actually received from a real customer.
 * Zero-amount rows are excluded: they are catalogue or comp entries, not sales.
 */
export function isRealRevenueRow(row: {
  email?: string | null;
  amountCAD?: number | null;
  refundedAt?: Date | string | null;
}): boolean {
  if (isSyntheticCustomerEmail(row.email)) return false;
  if (!row.amountCAD || row.amountCAD <= 0) return false;
  if (row.refundedAt) return false;
  return true;
}

/**
 * SQL fragment excluding synthetic rows, for aggregate queries that cannot
 * filter in application code. Returns a condition for a WHERE clause.
 */
export const EXCLUDE_SYNTHETIC_SQL = `email NOT LIKE '%${SYNTHETIC_EMAIL_DOMAIN}'`;

/** Session id prefix written by the historical purchase recovery backfill. */
export const LEGACY_RECOVERY_SESSION_PREFIX = "legacy-recovery-purchase-";

/**
 * Internal addresses that place real Stripe orders during testing and setup.
 * Their orders are genuine in Stripe but are not customer demand, so they are
 * excluded from pipeline counts. They are not excluded from revenue, because
 * if money truly moved it belongs in the bank figure.
 */
export const INTERNAL_BUYER_EMAILS = [
  "test@example.com",
  "abello@unwiredwebsolutions.com",
  "belllo.ayoola@gmail.com",
] as const;

/** True when an order was placed by our own team rather than a customer. */
export function isInternalBuyerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  if (isSyntheticCustomerEmail(normalised)) return true;
  return INTERNAL_BUYER_EMAILS.some(internal => internal === normalised);
}

/**
 * Stripe derives charge, payment intent and related object ids for one payment
 * from a shared core. `ch_3UFzTKIZU5R5gvMs1h45mp5u` and
 * `pi_3UFzTKIZU5R5gvMs1ZANIxBA` are the same payment: both carry the core
 * `3UFzTKIZU5R5gvMs`. Returning that core lets two tables recognise one payment.
 *
 * Returns null when no core can be read, so unknown ids never collide.
 */
export function stripePaymentCore(
  stripeId: string | null | undefined
): string | null {
  if (!stripeId) return null;
  const trimmed = stripeId.trim();
  if (!trimmed) return null;
  // Only payment objects share a core. A charge is a child of a payment intent,
  // so ch_3UFzTKIZU5R5gvMs and pi_3UFzTKIZU5R5gvMs are provably the same money.
  // A checkout session id does not share its core with the payment it created,
  // so matching cs_ ids would let an unrelated session collide with a real
  // payment and silently erase a genuine team order from reported revenue.
  const match = /^(?:pi|ch|py)_(?:test_|live_)?([A-Za-z0-9]{16})/.exec(trimmed);
  if (!match) return null;
  return match[1];
}

/**
 * Sums money across tables while counting each Stripe payment once.
 *
 * Rows are supplied newest-source-first: whichever source is considered
 * authoritative should appear first, because the first row carrying a given
 * payment core wins and later duplicates are dropped. Rows with no readable
 * payment core are always counted, since they cannot be matched.
 */
export function sumDeduplicatedCents(
  rows: Array<{ amountCents: number; stripeId?: string | null }>
): { totalCents: number; countedRows: number; duplicateRows: number } {
  const seen = new Set<string>();
  let totalCents = 0;
  let countedRows = 0;
  let duplicateRows = 0;
  for (const row of rows) {
    if (!row.amountCents || row.amountCents <= 0) continue;
    const core = stripePaymentCore(row.stripeId);
    if (core) {
      if (seen.has(core)) {
        duplicateRows += 1;
        continue;
      }
      seen.add(core);
    }
    totalCents += row.amountCents;
    countedRows += 1;
  }
  return { totalCents, countedRows, duplicateRows };
}
