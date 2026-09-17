import { describe, expect, it } from "vitest";
import { paymentTimestampFromStripeEvent } from "./paymentTimestamp";

describe("paymentTimestampFromStripeEvent", () => {
  it("uses Stripe's event timestamp rather than local processing time", () => {
    expect(paymentTimestampFromStripeEvent(1_789_684_600).toISOString()).toBe("2026-09-17T22:36:40.000Z");
  });

  it("fails closed when Stripe omits a valid event timestamp", () => {
    expect(() => paymentTimestampFromStripeEvent(undefined)).toThrow("valid creation timestamp");
    expect(() => paymentTimestampFromStripeEvent(0)).toThrow("valid creation timestamp");
  });
});
