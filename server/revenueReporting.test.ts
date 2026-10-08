import { describe, it, expect } from "vitest";
import {
  isSyntheticCustomerEmail,
  isRealRevenueRow,
  SYNTHETIC_EMAIL_DOMAIN,
} from "../shared/revenueReporting";

/**
 * Reported revenue once overstated money actually received by roughly 77
 * percent: $6,620 shown against about $3,731 real. The cause was synthetic
 * rows written by automated checks, zero-amount catalogue rows, and expired
 * or refunded rows all being summed as sales.
 *
 * A founder quotes the dashboard number to investors, partners and grant
 * programs. These tests keep that number honest.
 */
describe("revenue reporting rules", () => {
  describe("synthetic row detection", () => {
    it("identifies addresses written by automated checks", () => {
      expect(
        isSyntheticCustomerEmail(
          "paging-fb15b1f5-7b44-4fb2-81ce-813a059a4208@echelon.test"
        )
      ).toBe(true);
      expect(
        isSyntheticCustomerEmail("reliability-42a4b54e@echelon.test")
      ).toBe(true);
    });

    it("treats real customer addresses as real", () => {
      expect(isSyntheticCustomerEmail("brandonbsn95@gmail.com")).toBe(false);
      expect(isSyntheticCustomerEmail("shane.stephen@peelregion.ca")).toBe(
        false
      );
      expect(isSyntheticCustomerEmail("cbachner@peterborough.ca")).toBe(false);
    });

    it("does not depend on address casing", () => {
      expect(isSyntheticCustomerEmail("Paging-ABC@ECHELON.TEST")).toBe(true);
    });

    it("handles missing addresses without throwing", () => {
      expect(isSyntheticCustomerEmail(null)).toBe(false);
      expect(isSyntheticCustomerEmail(undefined)).toBe(false);
      expect(isSyntheticCustomerEmail("")).toBe(false);
    });

    it("does not misread a real address that merely mentions test", () => {
      // A customer at a company called "testing" is still a paying customer.
      expect(isSyntheticCustomerEmail("john@testingsolutions.ca")).toBe(false);
    });
  });

  describe("what counts as real revenue", () => {
    it("counts a paid order from a real customer", () => {
      expect(
        isRealRevenueRow({
          email: "brandonbsn95@gmail.com",
          amountCAD: 4900,
          refundedAt: null,
        })
      ).toBe(true);
    });

    it("excludes synthetic rows priced like real sales", () => {
      // These nine rows added about $2,691 of revenue nobody paid.
      expect(
        isRealRevenueRow({
          email: `paging-abc${SYNTHETIC_EMAIL_DOMAIN}`,
          amountCAD: 29900,
          refundedAt: null,
        })
      ).toBe(false);
    });

    it("excludes zero-amount catalogue rows", () => {
      expect(
        isRealRevenueRow({
          email: "someone@example.com",
          amountCAD: 0,
          refundedAt: null,
        })
      ).toBe(false);
    });

    it("excludes refunded orders", () => {
      expect(
        isRealRevenueRow({
          email: "someone@example.com",
          amountCAD: 9900,
          refundedAt: new Date("2026-10-01"),
        })
      ).toBe(false);
    });

    it("excludes rows with a missing amount", () => {
      expect(
        isRealRevenueRow({ email: "someone@example.com", amountCAD: null })
      ).toBe(false);
    });
  });

  describe("regression: the overstatement that triggered this", () => {
    it("reports only real money across a mixed set of rows", () => {
      const rows = [
        { email: "brandonbsn95@gmail.com", amountCAD: 4900, refundedAt: null },
        { email: "cbachner@peterborough.ca", amountCAD: 6900, refundedAt: null },
        // Synthetic rows that inflated the dashboard.
        { email: `paging-1${SYNTHETIC_EMAIL_DOMAIN}`, amountCAD: 29900, refundedAt: null },
        { email: `reliability-2${SYNTHETIC_EMAIL_DOMAIN}`, amountCAD: 29900, refundedAt: null },
        { email: `reporting-3${SYNTHETIC_EMAIL_DOMAIN}`, amountCAD: 29900, refundedAt: null },
        // Seeded catalogue row.
        { email: "catalogue@example.com", amountCAD: 0, refundedAt: null },
      ];

      const real = rows.filter(isRealRevenueRow);
      const total = real.reduce((sum, r) => sum + (r.amountCAD ?? 0), 0);

      expect(real).toHaveLength(2);
      expect(total).toBe(11800);
      // The naive sum that produced the inflated figure.
      const naive = rows.reduce((sum, r) => sum + (r.amountCAD ?? 0), 0);
      expect(naive).toBe(101500);
      expect(total).toBeLessThan(naive);
    });
  });
});
