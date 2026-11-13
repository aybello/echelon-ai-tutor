import { describe, expect, it } from "vitest";
import {
  CATALOGUE_VERSION,
  COURSE_PASS_BAND_PRICES,
  INDIVIDUAL_PRICES_CAD,
  TEAMS_ALL_ACCESS_MIN_SEATS,
  TEAMS_ALL_ACCESS_PRICE_CENTS,
  VOLUME_BANDS,
  calculateAllAccessTotal,
  calculateBlendedDiscount,
  calculateCoursePassOrderTotal,
  calculateGraduatedTotal,
  getCoursePassPrice,
  isValidCoursePassTerm,
  validateAllAccessQuantity,
} from "../shared/pricingCatalogue";

describe("Echelon pricing catalogue", () => {
  it("keeps 12-month Individual Exam Pass pricing separate from Teams Flex", () => {
    expect(INDIVIDUAL_PRICES_CAD.oit).toBe(4_900);
    expect(getCoursePassPrice("oit", 3)).toBe(3_900);
    expect(getCoursePassPrice("oit", 6)).toBe(4_900);
    expect(getCoursePassPrice("class1-water", 3)).toBe(5_900);
    expect(getCoursePassPrice("class1-water", 6)).toBe(7_900);
  });

  it("removes the twelve-month Flex term from the launch catalogue", () => {
    expect(isValidCoursePassTerm(3)).toBe(true);
    expect(isValidCoursePassTerm(6)).toBe(true);
    expect(isValidCoursePassTerm(12)).toBe(false);
  });

  it("keeps the All Streams legacy helper aligned at CA$549", () => {
    expect(TEAMS_ALL_ACCESS_PRICE_CENTS).toBe(54_900);
    expect(TEAMS_ALL_ACCESS_MIN_SEATS).toBe(5);
    expect(validateAllAccessQuantity(4).valid).toBe(false);
    expect(validateAllAccessQuantity(5).valid).toBe(true);
    expect(calculateAllAccessTotal(10).totalCents).toBe(543_510);
  });

  it("uses graduated volume arithmetic for annual and Flex calculations", () => {
    expect(calculateGraduatedTotal(10_000, 10).totalCents).toBe(99_000);
    expect(calculateBlendedDiscount(10)).toBeCloseTo(0.01);
    const mixed = calculateCoursePassOrderTotal([
      { courseKey: "oit", termMonths: 3, quantity: 5 },
      { courseKey: "class1-water", termMonths: 6, quantity: 5 },
    ]);
    expect(mixed.totalCents).toBeGreaterThan(0);
    expect(mixed.lineItems).toHaveLength(2);
  });

  it("retains a Flex band for every individual 12-month pass price", () => {
    for (const price of new Set(Object.values(INDIVIDUAL_PRICES_CAD))) {
      expect(COURSE_PASS_BAND_PRICES[price]).toBeDefined();
    }
    expect(VOLUME_BANDS).toHaveLength(4);
    expect(CATALOGUE_VERSION).toBe("2026-09-21");
  });
});
