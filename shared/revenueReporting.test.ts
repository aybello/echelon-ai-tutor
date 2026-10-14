import { describe, expect, it } from "vitest";
import {
  INTERNAL_BUYER_EMAILS,
  isInternalBuyerEmail,
  isRealRevenueRow,
  isSyntheticCustomerEmail,
  stripePaymentCore,
  sumDeduplicatedCents,
} from "./revenueReporting";

// Wholly fabricated payment identifiers. Never place live Stripe identifiers
// or identifiable customer/buyer email addresses in tracked source fixtures.
const A = "AABBCCDDEEFF1122";
const B = "1122334455667788";
const C = "9988776655443322";
const charge = (core: string) => "ch_test_" + core + "XYZXYZ";
const intent = (core: string) => "pi_test_" + core + "ABCABC";

describe("stripePaymentCore", () => {
  it("matches only charge and payment intent objects sharing a mock core", () => {
    expect(stripePaymentCore(charge(A))).toBe(A);
    expect(stripePaymentCore(intent(A))).toBe(A);
  });
  it("keeps unrelated mock payments distinct", () => {
    expect(stripePaymentCore(charge(B))).not.toBe(stripePaymentCore(intent(C)));
  });
  it("accepts synthetic payment-prefix variants", () => {
    expect(stripePaymentCore("py_live_" + A + "QWERTY")).toBe(A);
    expect(stripePaymentCore("pi_test_" + B + "QWERTY")).toBe(B);
  });
  it("never treats a Stripe session as proof of payment core identity", () => {
    expect(stripePaymentCore("cs_live_test_" + A + "XYZXYZ")).toBeNull();
    expect(stripePaymentCore("cs_test_" + B + "XYZXYZ")).toBeNull();
    expect(stripePaymentCore("in_test_" + C + "XYZXYZ")).toBeNull();
  });
  it("never matches unknown recovery placeholders or blanks", () => {
    expect(stripePaymentCore("legacy-recovery-purchase-placeholder")).toBeNull();
    expect(stripePaymentCore(null)).toBeNull();
    expect(stripePaymentCore(" ")).toBeNull();
  });
});

describe("sumDeduplicatedCents", () => {
  it("counts an explicitly duplicated charge and intent exactly once", () => {
    const result = sumDeduplicatedCents([
      { amountCents: 17900, stripeId: intent(A) },
      { amountCents: 17900, stripeId: charge(A) },
    ]);
    expect(result).toEqual({ totalCents: 17900, countedRows: 1, duplicateRows: 1 });
  });
  it("reproduces a synthetic multi-table recovery reconciliation", () => {
    const result = sumDeduplicatedCents([
      { amountCents: 32800, stripeId: intent(A) },
      { amountCents: 17900, stripeId: intent(B) },
      { amountCents: 17900, stripeId: intent(C) },
      { amountCents: 17900, stripeId: charge(B) },
      { amountCents: 17900, stripeId: charge(C) },
    ]);
    expect(result.totalCents).toBe(68600);
    expect(result.duplicateRows).toBe(2);
  });
  it("counts distinct legacy rows with unreadable payment ids independently", () => {
    const result = sumDeduplicatedCents([
      { amountCents: 4900, stripeId: "legacy-recovery-purchase-placeholder" },
      { amountCents: 4900, stripeId: null },
    ]);
    expect(result.countedRows).toBe(2);
    expect(result.totalCents).toBe(9800);
  });
  it("drops zero and negative amounts", () => {
    expect(sumDeduplicatedCents([{ amountCents: 0 }, { amountCents: -500 }, { amountCents: 14900 }]).totalCents).toBe(14900);
  });
  it("retains the first/authoritative source when two rows match", () => {
    expect(sumDeduplicatedCents([
      { amountCents: 32800, stripeId: intent(A) },
      { amountCents: 99900, stripeId: charge(A) },
    ]).totalCents).toBe(32800);
  });
});

describe("internal buyer and real revenue filtering", () => {
  it("includes only nonidentifying synthetic fixtures as literal internal addresses", () => {
    expect(INTERNAL_BUYER_EMAILS).toEqual(["test@example.com"]);
    for (const email of INTERNAL_BUYER_EMAILS) expect(isInternalBuyerEmail(email)).toBe(true);
  });
  it("rejects synthetic data and respects case/whitespace", () => {
    expect(isInternalBuyerEmail("loadcheck@echelon.test")).toBe(true);
    expect(isInternalBuyerEmail(" TEST@EXAMPLE.COM ")).toBe(true);
  });
  it("does not flag real-sounding but fabricated municipal contacts", () => {
    expect(isInternalBuyerEmail("operator@municipality.example")).toBe(false);
    expect(isInternalBuyerEmail("supervisor@regional.example")).toBe(false);
    expect(isInternalBuyerEmail(null)).toBe(false);
  });
  it("excludes synthetic, refunded and zero-amount rows", () => {
    expect(isSyntheticCustomerEmail("paging@echelon.test")).toBe(true);
    expect(isRealRevenueRow({ email: "buyer@example.com", amountCAD: 0, refundedAt: null })).toBe(false);
    expect(isRealRevenueRow({ email: "buyer@example.com", amountCAD: 4900, refundedAt: new Date() })).toBe(false);
    expect(isRealRevenueRow({ email: "buyer@example.com", amountCAD: 4900, refundedAt: null })).toBe(true);
  });
});
