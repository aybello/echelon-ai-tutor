import { describe, expect, it, vi } from "vitest";
import { processRefund, type RefundPurchase } from "./processRefund";

const purchase: RefundPurchase = {
  id: 77,
  userId: 11,
  email: "operator@example.ca",
  productKey: "class1-water",
};

function claimedEvent(overrides: { dbProcessed?: boolean; emailDelivered?: boolean } = {}) {
  return {
    state: "claimed" as const,
    token: "claim-token",
    event: {
      dbProcessed: false,
      emailDelivered: false,
      ...overrides,
    },
  };
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    claimEvent: vi.fn().mockResolvedValue(claimedEvent()),
    completeRefund: vi.fn().mockResolvedValue(purchase),
    markFailed: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

const input = {
  stripeEventId: "evt_refund_1",
  stripePaymentIntentId: "pi_refund_1",
  stripeChargeId: "ch_refund_1",
};

describe("processRefund", () => {
  it("atomically attributes the refund to the affected purchase and unique Stripe event", async () => {
    const deps = dependencies();

    const result = await processRefund({} as any, input, deps);

    expect(result).toEqual({ state: "completed", purchase });
    expect(deps.completeRefund).toHaveBeenCalledWith(expect.anything(), input, "claim-token");
  });

  it("does not record another analytics event when Stripe replays a completed refund", async () => {
    const deps = dependencies({
      claimEvent: vi.fn().mockResolvedValue({ state: "completed", event: {} }),
    });

    const result = await processRefund({} as any, input, deps);

    expect(result).toEqual({ state: "already_completed", purchase: null });
    expect(deps.completeRefund).not.toHaveBeenCalled();
  });

  it("marks a failed atomic refund for replay without emitting a partial result", async () => {
    const deps = dependencies({
      completeRefund: vi.fn().mockRejectedValue(new Error("transaction rolled back")),
    });
    const result = await processRefund({} as any, input, deps);

    expect(result).toEqual({
      state: "retryable_failure",
      purchase: null,
      error: "transaction rolled back",
    });
    expect(deps.markFailed).toHaveBeenCalledWith(expect.anything(), input.stripeEventId, "claim-token", expect.any(Error));
  });
});
