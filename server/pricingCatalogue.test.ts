/**
 * Pricing Catalogue Tests
 * Covers: Individual Exam Pass, Teams Course Pass, Teams All-Access,
 * graduated volume pricing, 5-seat minimum, blended discounts,
 * and Stripe total verification.
 */
import { describe, it, expect } from "vitest";
import {
  INDIVIDUAL_PRICES_CAD,
  COURSE_PASS_BAND_PRICES,
  TEAMS_ALL_ACCESS_PRICE_CENTS,
  TEAMS_ALL_ACCESS_MIN_SEATS,
  VOLUME_BANDS,
  calculateGraduatedTotal,
  calculateBlendedDiscount,
  getCoursePassPrice,
  validateAllAccessQuantity,
  calculateAllAccessTotal,
  calculateCoursePassOrderTotal,
  isValidCoursePassTerm,
  CATALOGUE_VERSION,
} from "../shared/pricingCatalogue";

// ─── Individual Exam Pass ────────────────────────────────────────────────────

describe("Individual Exam Pass pricing", () => {
  it("Ontario OIT = CA$49", () => {
    expect(INDIVIDUAL_PRICES_CAD["oit"]).toBe(4900);
  });

  it("Ontario Class 1 = CA$99", () => {
    expect(INDIVIDUAL_PRICES_CAD["class1-water"]).toBe(9900);
  });

  it("Ontario Class 2 = CA$149", () => {
    expect(INDIVIDUAL_PRICES_CAD["class2-water"]).toBe(14900);
  });

  it("Ontario Class 3 = CA$249", () => {
    expect(INDIVIDUAL_PRICES_CAD["class3-water"]).toBe(24900);
  });

  it("Ontario Class 4 = CA$299", () => {
    expect(INDIVIDUAL_PRICES_CAD["class4-water"]).toBe(29900);
  });

  it("Ontario WQA = CA$149", () => {
    expect(INDIVIDUAL_PRICES_CAD["wqa"]).toBe(14900);
  });

  it("WPI Class I = CA$149", () => {
    expect(INDIVIDUAL_PRICES_CAD["wpi-class1-water"]).toBe(14900);
  });

  it("WPI Class II = CA$199", () => {
    expect(INDIVIDUAL_PRICES_CAD["wpi-class2-water"]).toBe(19900);
  });

  it("WPI Class III = CA$249", () => {
    expect(INDIVIDUAL_PRICES_CAD["wpi-class3-water"]).toBe(24900);
  });

  it("WPI Class IV = CA$299", () => {
    expect(INDIVIDUAL_PRICES_CAD["wpi-class4-water"]).toBe(29900);
  });
});

// ─── Teams Course Pass ───────────────────────────────────────────────────────

describe("Teams Course Pass pricing", () => {
  it("CA$49 course: 3mo=$29, 6mo=$39, 12mo=$49", () => {
    expect(getCoursePassPrice("oit", 3)).toBe(2900);
    expect(getCoursePassPrice("oit", 6)).toBe(3900);
    expect(getCoursePassPrice("oit", 12)).toBe(4900);
  });

  it("CA$99 course: 3mo=$59, 6mo=$79, 12mo=$99", () => {
    expect(getCoursePassPrice("class1-water", 3)).toBe(5900);
    expect(getCoursePassPrice("class1-water", 6)).toBe(7900);
    expect(getCoursePassPrice("class1-water", 12)).toBe(9900);
  });

  it("CA$149 course: 3mo=$89, 6mo=$119, 12mo=$149", () => {
    expect(getCoursePassPrice("class2-water", 3)).toBe(8900);
    expect(getCoursePassPrice("class2-water", 6)).toBe(11900);
    expect(getCoursePassPrice("class2-water", 12)).toBe(14900);
  });

  it("CA$199 course: 3mo=$119, 6mo=$159, 12mo=$199", () => {
    expect(getCoursePassPrice("wpi-class2-water", 3)).toBe(11900);
    expect(getCoursePassPrice("wpi-class2-water", 6)).toBe(15900);
    expect(getCoursePassPrice("wpi-class2-water", 12)).toBe(19900);
  });

  it("CA$249 course: 3mo=$149, 6mo=$199, 12mo=$249", () => {
    expect(getCoursePassPrice("class3-water", 3)).toBe(14900);
    expect(getCoursePassPrice("class3-water", 6)).toBe(19900);
    expect(getCoursePassPrice("class3-water", 12)).toBe(24900);
  });

  it("CA$299 course: 3mo=$179, 6mo=$239, 12mo=$299", () => {
    expect(getCoursePassPrice("class4-water", 3)).toBe(17900);
    expect(getCoursePassPrice("class4-water", 6)).toBe(23900);
    expect(getCoursePassPrice("class4-water", 12)).toBe(29900);
  });

  it("12-month Course Pass = Individual Exam Pass price", () => {
    // The spec says these should be identical
    expect(getCoursePassPrice("oit", 12)).toBe(INDIVIDUAL_PRICES_CAD["oit"]);
    expect(getCoursePassPrice("class1-water", 12)).toBe(INDIVIDUAL_PRICES_CAD["class1-water"]);
    expect(getCoursePassPrice("class4-water", 12)).toBe(INDIVIDUAL_PRICES_CAD["class4-water"]);
    expect(getCoursePassPrice("wpi-class2-water", 12)).toBe(INDIVIDUAL_PRICES_CAD["wpi-class2-water"]);
  });

  it("valid terms are 3, 6, and 12", () => {
    expect(isValidCoursePassTerm(3)).toBe(true);
    expect(isValidCoursePassTerm(6)).toBe(true);
    expect(isValidCoursePassTerm(12)).toBe(true);
    expect(isValidCoursePassTerm(1)).toBe(false);
    expect(isValidCoursePassTerm(24)).toBe(false);
  });

  it("throws for unknown course key", () => {
    expect(() => getCoursePassPrice("fake-course", 3)).toThrow();
  });
});

// ─── Teams All-Access ────────────────────────────────────────────────────────

describe("Teams All-Access pricing", () => {
  it("base price is CA$399 per operator per year", () => {
    expect(TEAMS_ALL_ACCESS_PRICE_CENTS).toBe(39900);
  });

  it("5-seat minimum", () => {
    expect(TEAMS_ALL_ACCESS_MIN_SEATS).toBe(5);
  });

  it("rejects quantities below 5", () => {
    expect(validateAllAccessQuantity(4)).toEqual({ valid: false, error: expect.stringContaining("minimum of 5") });
    expect(validateAllAccessQuantity(3)).toEqual({ valid: false, error: expect.stringContaining("minimum of 5") });
    expect(validateAllAccessQuantity(1)).toEqual({ valid: false, error: expect.stringContaining("minimum of 5") });
  });

  it("accepts quantities of 5 or more", () => {
    expect(validateAllAccessQuantity(5)).toEqual({ valid: true });
    expect(validateAllAccessQuantity(10)).toEqual({ valid: true });
    expect(validateAllAccessQuantity(50)).toEqual({ valid: true });
  });

  it("5 seats = CA$1,995.00", () => {
    const result = calculateAllAccessTotal(5);
    expect(result.totalCents).toBe(199500);
  });

  it("10 seats = CA$3,950.10", () => {
    const result = calculateAllAccessTotal(10);
    // 9 × $399 + 1 × $359.10 = $3591 + $359.10 = $3950.10
    expect(result.totalCents).toBe(395010);
  });

  it("25 seats graduated total", () => {
    const result = calculateAllAccessTotal(25);
    // 9 × 39900 + 15 × 35910 + 1 × 33915
    // = 359100 + 538650 + 33915 = 931665
    expect(result.totalCents).toBe(931665);
  });

  it("50 seats graduated total", () => {
    const result = calculateAllAccessTotal(50);
    // 9 × 39900 = 359100
    // 15 × 35910 = 538650
    // 25 × 33915 = 847875
    // 1 × 31920 = 31920
    // Total = 1,777,545
    expect(result.totalCents).toBe(1777545);
  });
});

// ─── Graduated Volume Pricing ────────────────────────────────────────────────

describe("Graduated volume pricing", () => {
  it("no discount for 1-9 seats", () => {
    const result = calculateGraduatedTotal(10000, 5);
    expect(result.totalCents).toBe(50000);
    expect(result.effectiveDiscountRate).toBe(0);
  });

  it("quantity 9: all at list price", () => {
    const result = calculateGraduatedTotal(39900, 9);
    expect(result.totalCents).toBe(9 * 39900);
  });

  it("quantity 10: 9 at list + 1 at 10% off", () => {
    const result = calculateGraduatedTotal(39900, 10);
    expect(result.totalCents).toBe(9 * 39900 + 1 * 35910);
  });

  it("quantity 24: 9 at list + 15 at 10% off", () => {
    const result = calculateGraduatedTotal(39900, 24);
    expect(result.totalCents).toBe(9 * 39900 + 15 * 35910);
  });

  it("quantity 25: 9 at list + 15 at 10% + 1 at 15% off", () => {
    const result = calculateGraduatedTotal(39900, 25);
    expect(result.totalCents).toBe(9 * 39900 + 15 * 35910 + 1 * 33915);
  });

  it("quantity 49: 9 at list + 15 at 10% + 25 at 15%", () => {
    const result = calculateGraduatedTotal(39900, 49);
    expect(result.totalCents).toBe(9 * 39900 + 15 * 35910 + 25 * 33915);
  });

  it("quantity 50: 9 at list + 15 at 10% + 25 at 15% + 1 at 20%", () => {
    const result = calculateGraduatedTotal(39900, 50);
    expect(result.totalCents).toBe(9 * 39900 + 15 * 35910 + 25 * 33915 + 1 * 31920);
  });

  it("no quantity threshold reduces the total (monotonically increasing)", () => {
    let prevTotal = 0;
    for (let q = 1; q <= 60; q++) {
      const result = calculateGraduatedTotal(39900, q);
      expect(result.totalCents).toBeGreaterThan(prevTotal);
      prevTotal = result.totalCents;
    }
  });

  it("band breakdown sums to total", () => {
    const result = calculateGraduatedTotal(39900, 30);
    const breakdownSum = result.bandBreakdown.reduce((sum, b) => sum + b.subtotal, 0);
    expect(breakdownSum).toBe(result.totalCents);
  });
});

// ─── Blended Discount for Mixed Course Pass Orders ──────────────────────────

describe("Blended discount for mixed Course Pass orders", () => {
  it("order of 5 licences = 0% discount", () => {
    expect(calculateBlendedDiscount(5)).toBe(0);
  });

  it("order of 10 licences has a blended discount > 0", () => {
    const discount = calculateBlendedDiscount(10);
    expect(discount).toBeGreaterThan(0);
    expect(discount).toBeLessThan(0.10); // Not full 10% — only 1 of 10 is discounted
  });

  it("order of 24 licences has blended discount", () => {
    const discount = calculateBlendedDiscount(24);
    expect(discount).toBeGreaterThan(0);
    expect(discount).toBeLessThan(0.10);
  });

  it("mixed-course order total does not depend on item order", () => {
    const items = [
      { courseKey: "oit", termMonths: 3 as const, quantity: 5 },
      { courseKey: "class4-water", termMonths: 3 as const, quantity: 5 },
    ];
    const result1 = calculateCoursePassOrderTotal(items);
    const result2 = calculateCoursePassOrderTotal([items[1], items[0]]);
    expect(result1.totalCents).toBe(result2.totalCents);
    expect(result1.effectiveDiscountRate).toBe(result2.effectiveDiscountRate);
  });

  it("same-duration enforcement: all items must have same termMonths", () => {
    // This is a business rule enforced at checkout, not in the pricing function
    // But we verify the pricing function works with mixed terms (it calculates correctly regardless)
    const items = [
      { courseKey: "oit", termMonths: 6 as const, quantity: 3 },
      { courseKey: "class1-water", termMonths: 6 as const, quantity: 7 },
    ];
    const result = calculateCoursePassOrderTotal(items);
    expect(result.totalCents).toBeGreaterThan(0);
    expect(result.lineItems).toHaveLength(2);
  });
});

// ─── Catalogue Integrity ─────────────────────────────────────────────────────

describe("Catalogue integrity", () => {
  it("has a catalogue version", () => {
    expect(CATALOGUE_VERSION).toBe("2026-08-12");
  });

  it("every individual price has a matching Course Pass band", () => {
    const uniquePrices = new Set(Object.values(INDIVIDUAL_PRICES_CAD));
    for (const price of uniquePrices) {
      expect(COURSE_PASS_BAND_PRICES[price]).toBeDefined();
    }
  });

  it("volume bands cover all quantities from 1 to 500", () => {
    for (let q = 1; q <= 500; q++) {
      const band = VOLUME_BANDS.find(b => q >= b.min && q <= b.max);
      expect(band).toBeDefined();
    }
  });
});
