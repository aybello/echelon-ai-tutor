import { describe, expect, it } from "vitest";
import { isEligibleForManualRecoveryImport, recoveryImportBlockReason } from "./customerRecoveryEvidence";

const verifiedAt = new Date("2026-09-16T00:00:00.000Z");

describe("historical customer recovery evidence gate", () => {
  it("never treats staged Stripe evidence as an entitlement", () => {
    const input = {
      paymentStatus: "succeeded" as const,
      reviewStatus: "staged" as const,
      claimVerifiedAt: null,
      candidateProductKey: null,
      importedAt: null,
    };

    expect(isEligibleForManualRecoveryImport(input)).toBe(false);
    expect(recoveryImportBlockReason(input)).toBe("A reviewed product mapping is required.");
  });

  it("requires payment validity, product mapping, claimant verification, and explicit approval", () => {
    const base = {
      paymentStatus: "succeeded" as const,
      reviewStatus: "approved" as const,
      claimVerifiedAt: verifiedAt,
      candidateProductKey: "oit",
      importedAt: null,
    };

    expect(isEligibleForManualRecoveryImport(base)).toBe(true);
    expect(isEligibleForManualRecoveryImport({ ...base, paymentStatus: "refunded" })).toBe(false);
    expect(isEligibleForManualRecoveryImport({ ...base, claimVerifiedAt: null })).toBe(false);
    expect(isEligibleForManualRecoveryImport({ ...base, candidateProductKey: null })).toBe(false);
    expect(isEligibleForManualRecoveryImport({ ...base, importedAt: verifiedAt })).toBe(false);
  });
});
