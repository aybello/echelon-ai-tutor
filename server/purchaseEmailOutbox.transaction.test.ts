import { describe, expect, it, vi } from "vitest";
import { purchaseEmailOutbox, purchases } from "../drizzle/schema";
import { recordPurchaseWithConfirmation } from "./purchaseEmailOutbox";

describe("recordPurchaseWithConfirmation", () => {
  it("writes the Individual Pass and receipt-delivery intent in one transaction", async () => {
    const purchaseValues = vi.fn().mockResolvedValue(undefined);
    const outboxValues = vi.fn().mockResolvedValue(undefined);
    const transaction = vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
      await callback({
        insert: vi.fn((table) => ({
          values: table === purchases ? purchaseValues : outboxValues,
        })),
      });
    });
    const db = { transaction } as never;

    await recordPurchaseWithConfirmation(db, {
      email: "learner@example.com",
      productKey: "oit",
      productName: "OIT Practice Pass",
      amountCAD: 4900,
      stripeSessionId: "cs_atomic_purchase",
      accessExpiresAt: new Date("2027-09-21T14:30:00.000Z"),
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(purchaseValues).toHaveBeenCalledWith(expect.objectContaining({
      stripeSessionId: "cs_atomic_purchase",
      accessExpiresAt: new Date("2027-09-21T14:30:00.000Z"),
    }));
    expect(outboxValues).toHaveBeenCalledWith(expect.objectContaining({
      stripeSessionId: "cs_atomic_purchase",
    }));
    expect(purchaseEmailOutbox.stripeSessionId.name).toBe("stripeSessionId");
  });
});
