import { describe, expect, it } from "vitest";
// @ts-expect-error The guarded recovery CLI is intentionally ESM for direct Node execution.
import { manifestFor, normalizeStripeRows } from "../scripts/recovery/normalizeStripeRecoveryExport.mjs";

describe("private Stripe recovery normalizer", () => {
  const csv = [
    "Payment Intent ID,Customer Email,Amount,Currency,Status,Created UTC",
    "pi_succeeded,learner@example.com,49.00,CAD,succeeded,2026-01-10T12:00:00.000Z",
    "pi_refunded,refunded@example.com,49.00,CAD,refunded,2026-01-11T12:00:00.000Z",
  ].join("\n");

  it("normalizes evidence without assigning products or access", () => {
    const { records, rejectedRows } = normalizeStripeRows(csv);
    expect(records).toHaveLength(2);
    expect(rejectedRows).toEqual([]);
    expect(records[0]).toMatchObject({
      sourceEvidenceKey: "stripe:payment:pi_succeeded",
      normalizedEmail: "learner@example.com",
      paymentStatus: "succeeded",
      amountMinor: 4900,
    });
    expect(records[0]).not.toHaveProperty("candidateProductKey");
    expect(records[0]).not.toHaveProperty("accessExpiresAt");
  });

  it("writes a non-sensitive manifest that cannot be mistaken for an import result", () => {
    const { records, rejectedRows } = normalizeStripeRows(csv);
    const manifest = manifestFor(records, rejectedRows, "a".repeat(64));
    expect(manifest).toMatchObject({
      totalRowsAccepted: 2,
      paymentStatusCounts: { succeeded: 1, refunded: 1, disputed: 0, unknown: 0 },
      safety: { containsCustomerIdentifiers: false, grantsEntitlements: false },
    });
    expect(JSON.stringify(manifest)).not.toContain("learner@example.com");
    expect(JSON.stringify(manifest)).not.toContain("pi_succeeded");
  });
});
