export const INDIVIDUAL_EXAM_PASS_TERM_MONTHS = 12;
export const INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE = "individual_exam_pass";

type CheckoutMetadata = Record<string, string> | null | undefined;

export function addUtcCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}

/**
 * Only checkouts created after the Individual Exam Pass policy change carry
 * this marker. Older one-time purchases intentionally return null so their
 * permanent access remains grandfathered.
 */
export function getIndividualExamPassExpiry(
  metadata: CheckoutMetadata,
  fulfilledAt: Date,
): Date | null {
  if (metadata?.entitlement_type !== INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE) {
    return null;
  }

  const termMonths = Number(metadata.access_term_months);
  if (termMonths !== INDIVIDUAL_EXAM_PASS_TERM_MONTHS) {
    throw new Error("Individual Exam Pass checkout has invalid access-term metadata.");
  }

  return addUtcCalendarMonths(fulfilledAt, termMonths);
}
