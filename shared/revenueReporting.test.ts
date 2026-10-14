import { describe, expect, it } from "vitest";

import {
  INTERNAL_BUYER_EMAILS,
  isInternalBuyerEmail,
  isRealRevenueRow,
  isSyntheticCustomerEmail,
  stripePaymentCore,
  sumDeduplicatedCents,
} from "./revenueReporting";

/**
 * These tests encode the two ways reported revenue has been wrong in
 * production: inflated by synthetic rows, and understated by an omitted
 * revenue table plus a double-counted recovery backfill.
 */
describe("stripePaymentCore", () => {
  it("reads the same core from a charge and its payment intent", () => {
    // Verified live: purchase 1710011 and flex order 210001 are one payment.
    const charge = stripePaymentCore("ch_3UFzTKIZU5R5gvMs1h45mp5u");
    const intent = stripePaymentCore("pi_3UFzTKIZU5R5gvMs1ZANIxBA");
    expect(charge).toBe("3UFzTKIZU5R5gvMs");
    expect(intent).toBe(charge);
  });

  it("reads the same core from the second verified duplicate pair", () => {
    expect(stripePaymentCore("ch_3U9T1KIZU5R5gvMs2J3QVFD0")).toBe(
      stripePaymentCore("pi_3U9T1KIZU5R5gvMs2f3rZk7a")
    );
  });

  it("handles live and test session prefixes", () => {
    expect(
      stripePaymentCore("cs_live_a1i2ul2OoVAooWQvOGLYed3UEx9ttd6nagZDxqV9aP")
    ).toBe("a1i2ul2OoVAooWQv");
    expect(
      stripePaymentCore("cs_test_b1yo69f9p6jvV4hEsNLzgYGETvTyD02v7Qcbb3geXq")
    ).toBe("b1yo69f9p6jvV4hE");
  });

  it("returns null for recovery placeholders and empty values", () => {
    // Recovery rows carry no real session id, so they must never collide.
    expect(
      stripePaymentCore("legacy-recovery-purchase-a790ad423719583e6fe2bdae")
    ).toBeNull();
    expect(stripePaymentCore(null)).toBeNull();
    expect(stripePaymentCore("")).toBeNull();
    expect(stripePaymentCore("   ")).toBeNull();
  });

  it("does not treat different payments as the same", () => {
    expect(stripePaymentCore("pi_3UQBRZIZU5R5gvMs04ywMwNg")).not.toBe(
      stripePaymentCore("pi_3UFzTKIZU5R5gvMs1ZANIxBA")
    );
  });
});

describe("sumDeduplicatedCents", () => {
  it("counts one payment once when two tables record it", () => {
    // The live situation: flex order 210001 and purchase 1710011, both $179.
    const result = sumDeduplicatedCents([
      { amountCents: 17900, stripeId: "pi_3UFzTKIZU5R5gvMs1ZANIxBA" },
      { amountCents: 17900, stripeId: "ch_3UFzTKIZU5R5gvMs1h45mp5u" },
    ]);
    expect(result.totalCents).toBe(17900);
    expect(result.countedRows).toBe(1);
    expect(result.duplicateRows).toBe(1);
  });

  it("reproduces the verified live reconciliation", () => {
    // Three paid flex orders; two are mirrored into purchases by the backfill.
    const result = sumDeduplicatedCents([
      { amountCents: 32800, stripeId: "pi_3UQBRZIZU5R5gvMs04ywMwNg" },
      { amountCents: 17900, stripeId: "pi_3UFzTKIZU5R5gvMs1ZANIxBA" },
      { amountCents: 17900, stripeId: "pi_3U9T1KIZU5R5gvMs2f3rZk7a" },
      { amountCents: 17900, stripeId: "ch_3UFzTKIZU5R5gvMs1h45mp5u" },
      { amountCents: 17900, stripeId: "ch_3U9T1KIZU5R5gvMs2J3QVFD0" },
    ]);
    // $328 + $179 + $179 = $686, not $1,044.
    expect(result.totalCents).toBe(68600);
    expect(result.duplicateRows).toBe(2);
  });

  it("counts rows that have no readable payment id", () => {
    // Recovery rows must still contribute when no flex order matches them.
    const result = sumDeduplicatedCents([
      { amountCents: 4900, stripeId: "legacy-recovery-purchase-abc" },
      { amountCents: 4900, stripeId: null },
    ]);
    expect(result.totalCents).toBe(9800);
    expect(result.countedRows).toBe(2);
    expect(result.duplicateRows).toBe(0);
  });

  it("ignores zero and negative amounts", () => {
    const result = sumDeduplicatedCents([
      { amountCents: 0, stripeId: "pi_3UQBRZIZU5R5gvMs04ywMwNg" },
      { amountCents: -500, stripeId: null },
      { amountCents: 14900, stripeId: null },
    ]);
    expect(result.totalCents).toBe(14900);
    expect(result.countedRows).toBe(1);
  });

  it("keeps the first source when the same payment appears twice", () => {
    // Order matters: the authoritative source is listed first by the caller.
    const result = sumDeduplicatedCents([
      { amountCents: 32800, stripeId: "pi_3UQBRZIZU5R5gvMs04ywMwNg" },
      { amountCents: 99900, stripeId: "ch_3UQBRZIZU5R5gvMs0differ" },
    ]);
    expect(result.totalCents).toBe(32800);
  });
});

describe("isInternalBuyerEmail", () => {
  it("flags our own accounts that place real Stripe orders", () => {
    for (const email of INTERNAL_BUYER_EMAILS) {
      expect(isInternalBuyerEmail(email)).toBe(true);
    }
  });

  it("flags synthetic test addresses", () => {
    expect(isInternalBuyerEmail("loadcheck@echelon.test")).toBe(true);
  });

  it("is case and whitespace insensitive", () => {
    expect(isInternalBuyerEmail("  Test@Example.com ")).toBe(true);
  });

  it("does not flag real municipal customers", () => {
    expect(isInternalBuyerEmail("bhull@winnipeg.ca")).toBe(false);
    expect(isInternalBuyerEmail("stattersall@winnipeg.ca")).toBe(false);
    expect(isInternalBuyerEmail("publicworks@invernesscounty.ca")).toBe(false);
    expect(isInternalBuyerEmail(null)).toBe(false);
  });
});

describe("existing revenue rules still hold", () => {
  it("excludes synthetic, zero-amount and refunded rows", () => {
    expect(isSyntheticCustomerEmail("paging@echelon.test")).toBe(true);
    expect(
      isRealRevenueRow({ email: "a@b.ca", amountCAD: 0, refundedAt: null })
    ).toBe(false);
    expect(
      isRealRevenueRow({ email: "a@b.ca", amountCAD: 4900, refundedAt: new Date() })
    ).toBe(false);
    expect(
      isRealRevenueRow({ email: "a@b.ca", amountCAD: 4900, refundedAt: null })
    ).toBe(true);
  });
});
