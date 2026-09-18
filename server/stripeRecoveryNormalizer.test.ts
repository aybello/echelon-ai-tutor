import { describe, expect, it } from "vitest";
// @ts-expect-error The guarded recovery CLI is intentionally ESM for direct Node execution.
import { manifestFor, normalizeStripeRows, summarizeRecoveryCandidates } from "../scripts/recovery/normalizeStripeRecoveryExport.mjs";

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

  it("parses Stripe's Created date (UTC) export header for recovery term evidence", () => {
    const { records } = normalizeStripeRows([
      "id,Created date (UTC),Customer Email,Amount,Currency,Status",
      "pi_historical,2026-06-19T15:45:00.000Z,manager@example.org,279.00,CAD,succeeded",
    ].join("\n"));

    expect(records[0]?.paymentCreatedAt?.toISOString()).toBe("2026-06-19T15:45:00.000Z");
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

  it("groups only conservative product candidates without retaining customer-level details", () => {
    const summary = summarizeRecoveryCandidates([
      "ID,Customer Email,Description,Status,type (metadata),teamFlexOrderId (metadata),orderReference (metadata)",
      "pi_water,learner@example.com,OIT Practice Pass,succeeded,individual,,order_water",
      "pi_ww,wastewater@example.com,OIT Wastewater Practice Pass,succeeded,individual,,order_ww",
      "pi_team,manager@example.com,Team access,succeeded,team,flex_123,order_team",
      "pi_unknown,review@example.com,Legacy course,succeeded,legacy,,order_legacy",
    ].join("\n"));

    expect(summary).toMatchObject({
      sourceRows: 4,
      successfulRows: 4,
      categoryCounts: {
        oit_water_candidate: 1,
        oit_wastewater_candidate: 1,
        teams_flex_manual_review: 1,
        manual_product_review: 1,
      },
      safety: { containsCustomerIdentifiers: false, assignsEntitlements: false },
    });
    expect(JSON.stringify(summary)).not.toContain("learner@example.com");
    expect(JSON.stringify(summary)).not.toContain("OIT Practice Pass");
  });
});
