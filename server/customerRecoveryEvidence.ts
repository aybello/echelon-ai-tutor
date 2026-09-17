export const RECOVERY_REVIEW_STATUSES = [
  "staged",
  "mapped",
  "claim_verified",
  "approved",
  "rejected",
  "imported",
] as const;

export type RecoveryReviewStatus = (typeof RECOVERY_REVIEW_STATUSES)[number];
export type RecoveryPaymentStatus = "succeeded" | "refunded" | "disputed" | "unknown";
export const RECOVERY_SUBJECT_TYPES = ["individual", "organization_manager"] as const;
export type RecoverySubjectType = (typeof RECOVERY_SUBJECT_TYPES)[number];
export const RECOVERY_ORGANIZATION_GROUPS = ["treatment", "distribution", "unspecified"] as const;
export type RecoveryOrganizationGroup = (typeof RECOVERY_ORGANIZATION_GROUPS)[number];

/**
 * A classification is review context only. Import eligibility remains governed
 * by isEligibleForManualRecoveryImport, which independently requires product
 * mapping, claimant verification, and explicit approval.
 */
export function validateRecoveryClassification(input: {
  paymentStatus: RecoveryPaymentStatus;
  reviewStatus: RecoveryReviewStatus;
  subjectType: RecoverySubjectType;
  organizationName: string | null;
  organizationGroup: RecoveryOrganizationGroup | null;
  seatCount: number | null;
}): string | null {
  if (input.paymentStatus !== "succeeded") {
    return "Only successful payment evidence can be classified.";
  }
  if (input.reviewStatus === "imported" || input.reviewStatus === "rejected") {
    return "Final recovery evidence cannot be reclassified.";
  }
  if (input.seatCount !== null && (!Number.isInteger(input.seatCount) || input.seatCount < 1 || input.seatCount > 500)) {
    return "Seat count must be a whole number from 1 to 500 when provided.";
  }
  if (input.subjectType === "organization_manager") {
    if (!input.organizationName?.trim()) return "Organization manager evidence requires an organization name.";
    if (!input.organizationGroup) return "Organization manager evidence requires a group classification.";
  }
  return null;
}

/**
 * This pure gate makes it explicit that evidence intake is not an entitlement
 * import. A future import command must additionally be user-authorized and
 * execute atomically against this same evidence key.
 */
export function isEligibleForManualRecoveryImport(input: {
  paymentStatus: RecoveryPaymentStatus;
  reviewStatus: RecoveryReviewStatus;
  claimVerifiedAt: Date | null;
  candidateProductKey: string | null;
  importedAt: Date | null;
}): boolean {
  return input.paymentStatus === "succeeded"
    && input.reviewStatus === "approved"
    && input.claimVerifiedAt !== null
    && Boolean(input.candidateProductKey)
    && input.importedAt === null;
}

export function recoveryImportBlockReason(input: Parameters<typeof isEligibleForManualRecoveryImport>[0]): string | null {
  if (input.importedAt) return "This evidence was already imported.";
  if (input.paymentStatus !== "succeeded") return "Only successful, non-refunded payment evidence may be reviewed.";
  if (!input.candidateProductKey) return "A reviewed product mapping is required.";
  if (!input.claimVerifiedAt) return "The claimant must verify control of the purchase email.";
  if (input.reviewStatus !== "approved") return "A second reviewer must explicitly approve this recovery evidence.";
  return null;
}
