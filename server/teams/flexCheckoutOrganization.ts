const PROVISIONAL_TERM_MONTHS = 12;

export interface ProvisionalCoursePassOrganizationInput {
  organizationName: string;
  managerEmail: string;
  province: "ontario" | "western";
  now?: Date;
}

/**
 * Build the organization row used to anchor a guest Course Pass checkout.
 * It deliberately grants no seats, membership, or access before payment.
 */
export function buildProvisionalCoursePassOrganization(
  input: ProvisionalCoursePassOrganizationInput,
) {
  const termStart = input.now ? new Date(input.now) : new Date();
  const termEnd = new Date(termStart);
  termEnd.setUTCMonth(termEnd.getUTCMonth() + PROVISIONAL_TERM_MONTHS);

  return {
    name: input.organizationName.trim(),
    province: input.province,
    tier: "course-pass",
    seatsTotal: 0,
    managerEmail: input.managerEmail.toLowerCase().trim(),
    termStart,
    termEnd,
    billingType: "course-pass",
    status: "pending",
  } as const;
}

export function isProvisionalCoursePassOrganization(organization: {
  billingType: string;
  status: string;
}): boolean {
  return organization.billingType === "course-pass" && organization.status === "pending";
}
