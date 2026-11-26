import { describe, expect, it, vi } from "vitest";
import { assertIndividualPaymentSchemaReady, IndividualPaymentSchemaError, verifyIndividualPaymentSchema } from "./paymentSchemaReadiness";

describe("individual payment schema readiness", () => {
  it("fails closed when the event ledger does not expose the analytics field", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("Unknown column analyticsProcessed"));
    await expect(verifyIndividualPaymentSchema(query)).rejects.toBeInstanceOf(IndividualPaymentSchemaError);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("checks the event ledger, access record and confirmation outbox before a checkout", async () => {
    const query = vi.fn().mockResolvedValue([]);
    await verifyIndividualPaymentSchema(query);
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls.map(([statement]) => String(statement))).toEqual(expect.arrayContaining([
      expect.stringContaining("analyticsProcessed"),
      expect.stringContaining("stripePaymentIntentId"),
      expect.stringContaining("purchase_email_outbox"),
    ]));
  });

  it("does not repeatedly query a healthy database during the short checkout window", async () => {
    const db = { execute: vi.fn().mockResolvedValue([]) } as any;
    await assertIndividualPaymentSchemaReady(db, 1_000);
    await assertIndividualPaymentSchemaReady(db, 2_000);
    expect(db.execute).toHaveBeenCalledTimes(3);
  });

  it("never treats a failed probe as a cached success", async () => {
    const db = { execute: vi.fn().mockRejectedValue(new Error("missing")) } as any;
    await expect(assertIndividualPaymentSchemaReady(db, 1_000)).rejects.toBeInstanceOf(IndividualPaymentSchemaError);
    await expect(assertIndividualPaymentSchemaReady(db, 2_000)).rejects.toBeInstanceOf(IndividualPaymentSchemaError);
    expect(db.execute).toHaveBeenCalledTimes(2);
  });
});
