/**
 * shared/entitlementTypes.ts
 *
 * Explicit entitlement types for the Echelon pricing model.
 * Used for access resolution, analytics, and admin reporting.
 */

export type EntitlementType =
  | "individual_exam_pass"   // Individual purchase, permanent, one course
  | "teams_course_pass"      // Teams Flex, 3/6 month, one course per operator
  | "teams_all_access"       // Teams Annual, annual stream or all-stream access
  | "legacy";                // Grandfathered: old subscriptions, bundles, etc.

/**
 * Determine the entitlement type from a purchase or licence context.
 */
export function classifyEntitlement(context: {
  isTeamLicence: boolean;
  isAllAccess: boolean;
  isLegacy?: boolean;
}): EntitlementType {
  if (context.isLegacy) return "legacy";
  if (!context.isTeamLicence) return "individual_exam_pass";
  if (context.isAllAccess) return "teams_all_access";
  return "teams_course_pass";
}

/**
 * Access rules per entitlement type.
 */
export const ENTITLEMENT_RULES: Record<EntitlementType, {
  requiresCourseId: boolean;
  grantsAllCourses: boolean;
  transferable: boolean;
  description: string;
}> = {
  individual_exam_pass: {
    requiresCourseId: true,
    grantsAllCourses: false,
    transferable: false,
    description: "One course, one learner, permanent access.",
  },
  teams_course_pass: {
    requiresCourseId: true,
    grantsAllCourses: false,
    transferable: false,
    description: "One course per named operator. Non-transferable after activation.",
  },
  teams_all_access: {
    requiresCourseId: false,
    grantsAllCourses: true,
    transferable: false,
    description: "Every course, every stream. One named operator per licence.",
  },
  legacy: {
    requiresCourseId: false,
    grantsAllCourses: false, // depends on what they purchased
    transferable: false,
    description: "Grandfathered entitlement. Retains original access and pricing.",
  },
};
