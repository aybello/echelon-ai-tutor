import { describe, expect, it } from "vitest";
import { googleAdsPurchaseConversion } from "./googleAdsPurchase";
import type { ValidatedOneTimeCheckout } from "./validateOneTimeCheckout";
const checkout = {
  sessionId: "cs_live_synthetic_only", email: "buyer@example.test", phone: "+16135550100", customerName: "Synthetic Buyer",
  amountPaidCents: 3920, currency: "cad", productKey: "oit", productName: "OIT", paymentIntentId: "pi_synthetic",
} as ValidatedOneTimeCheckout;
const session = { id: checkout.sessionId, amount_total: 3920, created: Date.parse("2026-10-06T12:00:00Z") / 1000, livemode: true };
const config = { label: "VerifiedPurchaseLabel_123", startAt: "2026-10-05T20:00:00Z" };

describe("confirmed Google Ads purchase payload", () => {
  it("uses actual discounted amount, payment currency and stable one-way order ID only", () => {
    const result = googleAdsPurchaseConversion(checkout, session, true, config);
    expect(result).toEqual({ sendTo: "AW-18491909141/VerifiedPurchaseLabel_123", value: 39.2, currency: "CAD", transactionId: expect.stringMatching(/^echelon_[a-f0-9]{64}$/) });
    expect(googleAdsPurchaseConversion(checkout, session, true, config)).toEqual(result);
    const another = "cs_live_another_synthetic";
    expect(googleAdsPurchaseConversion({ ...checkout, sessionId: another }, { ...session, id: another }, true, config)?.transactionId).not.toBe(result?.transactionId);
    expect(JSON.stringify(result)).not.toMatch(/buyer|16135550100|cs_live|pi_synthetic|customerName|productName/);
  });
  it("retains valid historical currency without imposing a CAD reporting fiction", () => {
    expect(googleAdsPurchaseConversion({ ...checkout, amountPaidCents: 3500, currency: "usd" }, { ...session, amount_total: 3500 }, true, config)).toMatchObject({ value: 35, currency: "USD" });
  });
  it("accepts zero actual payment for a legitimate paid full promotion, not catalogue value", () => {
    expect(googleAdsPurchaseConversion({ ...checkout, amountPaidCents: 0 }, { ...session, amount_total: 0 }, true, config)?.value).toBe(0);
  });
  it("does not turn pending signed fulfillment or test payments into conversions", () => {
    expect(googleAdsPurchaseConversion(checkout, session, false, config)).toBeNull();
    expect(googleAdsPurchaseConversion(checkout, { ...session, livemode: false }, true, config)).toBeNull();
  });
  it("refuses a missing or inconsistent Stripe total/identity", () => {
    expect(googleAdsPurchaseConversion({ ...checkout, amountPaidCents: 0 }, { ...session, amount_total: null }, true, config)).toBeNull();
    expect(googleAdsPurchaseConversion(checkout, { ...session, id: "cs_live_other" }, true, config)).toBeNull();
    expect(googleAdsPurchaseConversion(checkout, { ...session, amount_total: 4900 }, true, config)).toBeNull();
  });
  it.each([
    { label: undefined, startAt: undefined }, { label: "", startAt: config.startAt },
    { label: "AW-18491909141/wrong", startAt: config.startAt },
    { label: config.label, startAt: "invalid" }, { label: config.label, startAt: undefined },
  ])("fails closed without exact purchase-label and start configuration %j", invalid => {
    expect(googleAdsPurchaseConversion(checkout, session, true, invalid)).toBeNull();
  });
  it("does not replay pre-installation payments through revisited confirmation URLs", () => {
    expect(googleAdsPurchaseConversion(checkout, { ...session, created: Date.parse(config.startAt) / 1000 - 1 }, true, config)).toBeNull();
    expect(googleAdsPurchaseConversion(checkout, { ...session, created: Date.parse(config.startAt) / 1000 }, true, config)).not.toBeNull();
  });
  it.each([-1, NaN, Infinity, 49.5, 100_000_001])("rejects invalid actual cents %s", amountPaidCents => {
    expect(googleAdsPurchaseConversion({ ...checkout, amountPaidCents }, { ...session, amount_total: amountPaidCents }, true, config)).toBeNull();
  });
});
