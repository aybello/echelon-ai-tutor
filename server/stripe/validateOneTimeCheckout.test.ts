/**
 * Tests for validateOneTimeCheckout — the canonical Stripe purchase validator.
 * Verifies that only legitimate one-time payment sessions are accepted.
 */
import { describe, it, expect } from "vitest";
import { validateOneTimeCheckout } from "./validateOneTimeCheckout";
import { ALL_PRODUCTS } from "../../shared/products";
import type Stripe from "stripe";

// Use the first product from the catalogue for tests
const PRODUCT = ALL_PRODUCTS[0]; // "oit" — priceCAD: 4900, priceUSD: 3500

function makeSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test_abc123",
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    currency: "cad",
    amount_subtotal: PRODUCT.priceCAD,
    amount_total: PRODUCT.priceCAD,
    metadata: {
      product_key: PRODUCT.key,
      product_name: PRODUCT.name,
      customer_email: "operator@example.com",
    },
    customer_details: {
      email: "operator@example.com",
      name: "Test Operator",
      phone: null,
      address: null,
      tax_exempt: "none",
      tax_ids: [],
    },
    customer_email: null,
    payment_intent: "pi_test_xyz",
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

describe("validateOneTimeCheckout", () => {
  it("accepts a paid one-time session with a known canonical product and catalogue subtotal", () => {
    const result = validateOneTimeCheckout(makeSession());
    expect(result.productKey).toBe(PRODUCT.key);
    expect(result.email).toBe("operator@example.com");
    expect(result.currency).toBe("cad");
    expect(result.amountPaidCents).toBe(PRODUCT.priceCAD);
    expect(result.paymentIntentId).toBe("pi_test_xyz");
  });

  it("rejects a subscription Checkout session even when payment_status is paid", () => {
    const session = makeSession({ mode: "subscription" });
    expect(() => validateOneTimeCheckout(session)).toThrow("not a one-time purchase checkout");
  });

  it("rejects a Teams Checkout session with no product_key", () => {
    const session = makeSession({ metadata: {} });
    expect(() => validateOneTimeCheckout(session)).toThrow("missing canonical product metadata");
  });

  it("rejects a caller-selected product because verifySession has no productKey input", () => {
    // The validator derives product from metadata only — no client input accepted
    const session = makeSession({ metadata: { product_key: "unknown-product-key" } });
    expect(() => validateOneTimeCheckout(session)).toThrow("unknown product");
  });

  it("rejects an unknown metadata product_key", () => {
    const session = makeSession({ metadata: { product_key: "not-a-real-product" } });
    expect(() => validateOneTimeCheckout(session)).toThrow("unknown product");
  });

  it("rejects a mismatched amount_subtotal", () => {
    const session = makeSession({ amount_subtotal: PRODUCT.priceCAD - 100 });
    expect(() => validateOneTimeCheckout(session)).toThrow("does not match the product catalogue");
  });

  it("accepts a lower amount_total when amount_subtotal matches and a promotion was applied", () => {
    const session = makeSession({
      amount_subtotal: PRODUCT.priceCAD,
      amount_total: PRODUCT.priceCAD - 500, // discount applied
    });
    const result = validateOneTimeCheckout(session);
    expect(result.amountPaidCents).toBe(PRODUCT.priceCAD - 500);
    expect(result.productKey).toBe(PRODUCT.key);
  });

  it("uses server-derived email from customer_details, not client-supplied metadata", () => {
    const session = makeSession({
      customer_details: {
        email: "real@example.com",
        name: null,
        phone: null,
        address: null,
        tax_exempt: "none",
        tax_ids: [],
      },
      metadata: {
        product_key: PRODUCT.key,
        customer_email: "attacker@evil.com", // should be ignored
      },
    });
    const result = validateOneTimeCheckout(session);
    expect(result.email).toBe("real@example.com");
  });
});
