import { describe, expect, it } from "vitest";
import {
  paymentTimestampFromStripeEvent,
  paymentTimestampFromSuccessfulCharge,
  paymentTimestampFromSuccessfulPaymentIntent,
} from "./paymentTimestamp";

describe("paymentTimestampFromStripeEvent", () => {
  it("uses Stripe's event timestamp rather than local processing time", () => {
    expect(paymentTimestampFromStripeEvent(1_789_684_600).toISOString()).toBe("2026-09-17T22:36:40.000Z");
  });

  it("fails closed when Stripe omits a valid event timestamp", () => {
    expect(() => paymentTimestampFromStripeEvent(undefined)).toThrow("valid creation timestamp");
    expect(() => paymentTimestampFromStripeEvent(0)).toThrow("valid creation timestamp");
  });

  it("prefers the successful charge timestamp over delayed webhook delivery", () => {
    expect(paymentTimestampFromSuccessfulCharge(1_789_684_600).toISOString())
      .toBe("2026-09-17T22:36:40.000Z");
  });

  it("fails closed when a charge timestamp is unavailable", () => {
    expect(() => paymentTimestampFromSuccessfulCharge(null))
      .toThrow("missing a successful charge timestamp");
  });

  it("uses the latest successful charge for every purchase-recording path", async () => {
    const retrieve = async (id: string) => ({
      status: "succeeded",
      latest_charge: { id: `ch_${id}`, created: 1_789_684_600, paid: true },
    });
    await expect(paymentTimestampFromSuccessfulPaymentIntent("pi_test", retrieve))
      .resolves.toHaveProperty("toISOString", expect.any(Function));
    expect((await paymentTimestampFromSuccessfulPaymentIntent("pi_test", retrieve)).toISOString())
      .toBe("2026-09-17T22:36:40.000Z");
  });

  it("fails closed when a paid PaymentIntent lacks a successful charge timestamp", async () => {
    await expect(paymentTimestampFromSuccessfulPaymentIntent("pi_test", async () => ({ status: "succeeded", latest_charge: null })))
      .rejects.toThrow("no successful charge");
  });

  it("rejects a PaymentIntent that has not succeeded", async () => {
    await expect(paymentTimestampFromSuccessfulPaymentIntent("pi_test", async () => ({
      status: "processing",
      latest_charge: { created: 1_789_684_600, paid: false },
    }))).rejects.toThrow("has not succeeded");
  });

  it("accepts an expanded PaymentIntent reference", async () => {
    await expect(paymentTimestampFromSuccessfulPaymentIntent(
      { id: "pi_test" },
      async () => ({ status: "succeeded", latest_charge: { created: 1_789_684_600, status: "succeeded" } }),
    )).resolves.toHaveProperty("toISOString", expect.any(Function));
    await expect(paymentTimestampFromSuccessfulPaymentIntent(null, async () => ({})))
      .rejects.toThrow("missing a PaymentIntent ID");
  });
});
