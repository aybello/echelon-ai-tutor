export const INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE = "individual_exam_pass";

/**
 * New Individual Exam Passes are permanent access for one learner and one
 * course. The validated product resolver, not Stripe metadata, determines
 * whether a session is an Individual Exam Pass before this policy is reached.
 * Existing historical purchases retain any expiry already stored in the database.
 */
export function getIndividualExamPassExpiry(): null {
  return null;
}
