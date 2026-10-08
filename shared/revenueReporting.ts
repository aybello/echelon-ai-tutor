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
