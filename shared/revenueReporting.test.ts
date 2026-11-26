import { afterAll, describe, expect, it } from "vitest";

import {
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
 *
 * Identifiers below are fixtures. They reproduce the SHAPE of the live data
 * that caused each defect, which is all the logic depends on, without putting
 * real payment or customer identifiers into a public tree.
 */

// One payment recorded twice: once as a payment intent in team flex orders,
// once as a charge mirrored into purchases by the legacy recovery backfill.
const DUPLICATED_PAYMENT_INTENT = "pi_test_AAAAAAAAAAAAAAAA1ZANIxBA";
const DUPLICATED_PAYMENT_CHARGE = "ch_test_AAAAAAAAAAAAAAAA1h45mp5u";
const DUPLICATED_PAYMENT_CORE = "AAAAAAAAAAAAAAAA";

// A second, independently verified duplicate pair.
const SECOND_DUPLICATE_INTENT = "pi_test_BBBBBBBBBBBBBBBB2f3rZk7a";
const SECOND_DUPLICATE_CHARGE = "ch_test_BBBBBBBBBBBBBBBB2J3QVFD0";

// A genuinely distinct payment that must never collapse into the others.
const DISTINCT_PAYMENT_INTENT = "pi_test_CCCCCCCCCCCCCCCC04ywMwNg";

describe("stripePaymentCore", () => {
  it("reads the same core from a charge and its payment intent", () => {
    const charge = stripePaymentCore(DUPLICATED_PAYMENT_CHARGE);
    const intent = stripePaymentCore(DUPLICATED_PAYMENT_INTENT);
    expect(charge).toBe(DUPLICATED_PAYMENT_CORE);
    expect(intent).toBe(charge);
  });

  it("reads the same core from the second duplicate pair", () => {
    expect(stripePaymentCore(SECOND_DUPLICATE_CHARGE)).toBe(
      stripePaymentCore(SECOND_DUPLICATE_INTENT)
    );
  });

  it("reads both live and test payment prefixes", () => {
    expect(stripePaymentCore("pi_test_a1i2ul2OoVAooWQvOGLYed")).toBe(
      "a1i2ul2OoVAooWQv"
    );
    expect(stripePaymentCore("py_live_b1yo69f9p6jvV4hEsNLzgY")).toBe(
      "b1yo69f9p6jvV4hE"
    );
  });

  it("never matches a checkout session id", () => {
    // A session id does not share a core with the payment it created. Treating
    // one as a payment core would let an unrelated session collide with a real
    // team order and silently erase that money from reported revenue.
    expect(
      stripePaymentCore("cs_live_test_AAAAAAAAAAAAAAAAOGLYed3UEx9ttd6nagZDxqV9")
    ).toBeNull();
    expect(
      stripePaymentCore("cs_test_BBBBBBBBBBBBBBBBsNLzgYGETvTyD02v7Qcbb3geXq")
    ).toBeNull();
    // An invoice is not a payment object either.
    expect(stripePaymentCore("in_test_AAAAAAAAAAAAAAAA1h45mp5u")).toBeNull();
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
    expect(stripePaymentCore(DISTINCT_PAYMENT_INTENT)).not.toBe(
      stripePaymentCore(DUPLICATED_PAYMENT_INTENT)
    );
  });
});

describe("sumDeduplicatedCents", () => {
  it("counts one payment once when two tables record it", () => {
    const result = sumDeduplicatedCents([
      { amountCents: 17900, stripeId: DUPLICATED_PAYMENT_INTENT },
      { amountCents: 17900, stripeId: DUPLICATED_PAYMENT_CHARGE },
    ]);
    expect(result.totalCents).toBe(17900);
    expect(result.countedRows).toBe(1);
    expect(result.duplicateRows).toBe(1);
  });

  it("reproduces the verified live reconciliation", () => {
    // Three paid flex orders; two are mirrored into purchases by the backfill.
    const result = sumDeduplicatedCents([
      { amountCents: 32800, stripeId: DISTINCT_PAYMENT_INTENT },
      { amountCents: 17900, stripeId: DUPLICATED_PAYMENT_INTENT },
      { amountCents: 17900, stripeId: SECOND_DUPLICATE_INTENT },
      { amountCents: 17900, stripeId: DUPLICATED_PAYMENT_CHARGE },
      { amountCents: 17900, stripeId: SECOND_DUPLICATE_CHARGE },
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
      { amountCents: 0, stripeId: DISTINCT_PAYMENT_INTENT },
      { amountCents: -500, stripeId: null },
      { amountCents: 14900, stripeId: null },
    ]);
    expect(result.totalCents).toBe(14900);
    expect(result.countedRows).toBe(1);
  });

  it("keeps the first source when the same payment appears twice", () => {
    // Order matters: the authoritative source is listed first by the caller.
    const result = sumDeduplicatedCents([
      { amountCents: 32800, stripeId: DISTINCT_PAYMENT_INTENT },
      { amountCents: 99900, stripeId: "ch_test_CCCCCCCCCCCCCCCC0different" },
    ]);
    expect(result.totalCents).toBe(32800);
  });
});

describe("isInternalBuyerEmail", () => {
  const previous = process.env.INTERNAL_BUYER_EMAILS;
  afterAll(() => {
    if (previous === undefined) delete process.env.INTERNAL_BUYER_EMAILS;
    else process.env.INTERNAL_BUYER_EMAILS = previous;
  });

  it("flags configured internal accounts that place real Stripe orders", () => {
    process.env.INTERNAL_BUYER_EMAILS = "ops@echelon.test, founder@echelon.test";
    expect(isInternalBuyerEmail("ops@echelon.test")).toBe(true);
    expect(isInternalBuyerEmail("founder@echelon.test")).toBe(true);
  });

  it("flags synthetic test addresses even with no configuration", () => {
    process.env.INTERNAL_BUYER_EMAILS = "";
    expect(isInternalBuyerEmail("loadcheck@echelon.test")).toBe(true);
  });

  it("is case and whitespace insensitive", () => {
    process.env.INTERNAL_BUYER_EMAILS = "ops@echelon.test";
    expect(isInternalBuyerEmail("  Ops@Echelon.test ")).toBe(true);
  });

  it("does not flag a paying customer", () => {
    // A municipal buyer must always count as real demand.
    process.env.INTERNAL_BUYER_EMAILS = "ops@echelon.test";
    expect(isInternalBuyerEmail("publicworks@buyer.echelon.test")).toBe(false);
    expect(isInternalBuyerEmail(null)).toBe(false);
  });
});

describe("existing revenue rules still hold", () => {
  it("excludes synthetic, zero-amount and refunded rows", () => {
    expect(isSyntheticCustomerEmail("paging@echelon.test")).toBe(true);
    expect(
      isRealRevenueRow({ email: "buyer@echelon-customer.test", amountCAD: 0, refundedAt: null })
    ).toBe(false);
    expect(
      isRealRevenueRow({ email: "buyer@echelon-customer.test", amountCAD: 4900, refundedAt: new Date() })
    ).toBe(false);
    expect(
      isRealRevenueRow({ email: "buyer@echelon-customer.test", amountCAD: 4900, refundedAt: null })
    ).toBe(true);
  });
});
