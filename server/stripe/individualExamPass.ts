export const INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE = "individual_exam_pass";
export const INDIVIDUAL_EXAM_PASS_TERM_MONTHS = 12;
export const INDIVIDUAL_EXAM_PASS_POLICY_VERSION = "individual-exam-pass-12-month-v1";

/**
 * The checkout creator and signed webhook share this exact contract. Keeping
 * both fields together prevents a new purchase from silently falling into the
 * historical no-expiry branch after a future identifier change.
 */
export function individualExamPassCheckoutMetadata() {
  return {
    entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
    individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
  } as const;
}

/**
 * Only Checkout Sessions created under the explicit 12-month policy receive a
 * new expiry. Sessions without this marker are historical and retain their
 * recorded term when they are replayed or reconciled.
 */
export function usesTwelveMonthIndividualExamPassPolicy(policyVersion: unknown): boolean {
  return policyVersion === INDIVIDUAL_EXAM_PASS_POLICY_VERSION;
}

/**
 * New Individual Exam Passes provide one learner with one course for 12 UTC
 * calendar months from successful Stripe payment. Entitlement timestamps are
 * stored and evaluated in UTC, preventing daylight-saving changes or server
 * locale from changing the contractual expiry instant. Existing historical
 * purchases retain their recorded access terms.
 */
export function getIndividualExamPassExpiry(accessGrantedAt: Date | string | number): Date {
  const grantedAt = accessGrantedAt instanceof Date
    ? new Date(accessGrantedAt.getTime())
    : new Date(accessGrantedAt);
  if (!Number.isFinite(grantedAt.getTime())) {
    throw new Error("Individual Exam Pass access start must be a valid date");
  }

  const totalTargetMonth = grantedAt.getUTCMonth() + INDIVIDUAL_EXAM_PASS_TERM_MONTHS;
  const targetYear = grantedAt.getUTCFullYear() + Math.floor(totalTargetMonth / 12);
  const targetMonth = totalTargetMonth % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    Math.min(grantedAt.getUTCDate(), lastDayOfTargetMonth),
    grantedAt.getUTCHours(),
    grantedAt.getUTCMinutes(),
    grantedAt.getUTCSeconds(),
    grantedAt.getUTCMilliseconds(),
  ));
}
