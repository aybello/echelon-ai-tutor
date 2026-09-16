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
