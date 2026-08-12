/**
 * shared/pricingCatalogue.ts
 *
 * CANONICAL PRICING CATALOGUE — Single source of truth for Echelon Institute.
 * Three products:
 *   1. Individual Exam Pass (12-month, per-course, one learner)
 *   2. Teams Course Pass (3/6/12-month, per-course, named operator)
 *   3. Teams All-Access (CA$399/operator/year, 5-seat minimum)
 *
 * Volume discounts (graduated seat-band, NOT retroactive):
 *   Seats 1–9:   list price
 *   Seats 10–24: 10% off
 *   Seats 25–49: 15% off
 *   Seats 50+:   20% off
 *
 * Catalogue version: 2026-08-12
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ProductType = "individual_exam_pass" | "teams_course_pass" | "teams_all_access";
export type CoursePassTerm = 3 | 6 | 12;

export interface IndividualPricing {
  courseKey: string;
  priceCentsCAD: number;
}

export interface CoursePassPricing {
  /** Annual individual price in cents — the 12-month Course Pass matches this */
  annualPriceCents: number;
  threeMonthCents: number;
  sixMonthCents: number;
  twelveMonthCents: number;
}

export const CATALOGUE_VERSION = "2026-08-12";

// ── Individual Exam Pass Prices (12-month, one learner) ─────────────────────

export const INDIVIDUAL_PRICES_CAD: Record<string, number> = {
  // Ontario
  "oit":       4900,
  "oit-ww":    4900,
  "class1-water": 9900,
  "class1-ww": 9900,
  "class1-water-dist": 9900,
  "class1-wastewater-coll": 9900,
  "class2-water": 14900,
  "class2-ww": 14900,
  "class2-water-dist": 14900,
  "class2-wastewater-coll": 14900,
  "class3-water": 24900,
  "class3-ww": 24900,
  "class3-water-dist": 24900,
  "class3-wastewater-coll": 24900,
  "class4-water": 29900,
  "class4-ww": 29900,
  "class4-water-dist": 29900,
  "class4-wastewater-coll": 29900,
  "wqa": 14900,
  // WPI (Western)
  "wpi-class1-water": 14900,
  "wpi-class1-wastewater": 14900,
  "wpi-class1-water-dist": 14900,
  "wpi-class1-water-coll": 14900,
  "wpi-class2-water": 19900,
  "wpi-class2-wastewater": 19900,
  "wpi-class2-water-dist": 19900,
  "wpi-class2-water-coll": 19900,
  "wpi-class3-water": 24900,
  "wpi-class3-wastewater": 24900,
  "wpi-class3-water-dist": 24900,
  "wpi-class3-water-coll": 24900,
  "wpi-class4-water": 29900,
  "wpi-class4-wastewater": 29900,
  "wpi-class4-water-dist": 29900,
  "wpi-class4-water-coll": 29900,
};

// ── Teams Course Pass Prices (per pricing band) ─────────────────────────────
// Derived from the spec: 12-month = same as individual annual price
// 3-month and 6-month are discounted shorter terms

export interface CoursePassBandPrices {
  threeMonthCents: number;
  sixMonthCents: number;
  twelveMonthCents: number;
}

/**
 * Pricing bands by annual price tier.
 * Key = annual price in cents. Value = term prices.
 * The spec defines these tiers:
 *   CA$49 annual → 3mo: $29, 6mo: $39, 12mo: $49
 *   CA$99 annual → 3mo: $59, 6mo: $79, 12mo: $99
 *   CA$149 annual → 3mo: $89, 6mo: $119, 12mo: $149
 *   CA$199 annual → 3mo: $119, 6mo: $159, 12mo: $199
 *   CA$249 annual → 3mo: $149, 6mo: $199, 12mo: $249
 *   CA$299 annual → 3mo: $179, 6mo: $239, 12mo: $299
 */
export const COURSE_PASS_BAND_PRICES: Record<number, CoursePassBandPrices> = {
  4900:  { threeMonthCents: 2900,  sixMonthCents: 3900,  twelveMonthCents: 4900 },
  9900:  { threeMonthCents: 5900,  sixMonthCents: 7900,  twelveMonthCents: 9900 },
  14900: { threeMonthCents: 8900,  sixMonthCents: 11900, twelveMonthCents: 14900 },
  19900: { threeMonthCents: 11900, sixMonthCents: 15900, twelveMonthCents: 19900 },
  24900: { threeMonthCents: 14900, sixMonthCents: 19900, twelveMonthCents: 24900 },
  29900: { threeMonthCents: 17900, sixMonthCents: 23900, twelveMonthCents: 29900 },
};

// ── Teams All-Access ────────────────────────────────────────────────────────

export const TEAMS_ALL_ACCESS_PRICE_CENTS = 39900; // CA$399 per operator per year
export const TEAMS_ALL_ACCESS_MIN_SEATS = 5;

// ── Volume Discount Bands (graduated, NOT retroactive) ──────────────────────

export const VOLUME_BANDS = [
  { min: 1,  max: 9,    rate: 0 },
  { min: 10, max: 24,   rate: 0.10 },
  { min: 25, max: 49,   rate: 0.15 },
  { min: 50, max: Infinity, rate: 0.20 },
] as const;

/**
 * Calculate the total price for a given quantity using graduated band pricing.
 * Each seat is priced at the rate for its band — NOT retroactive.
 */
export function calculateGraduatedTotal(unitPriceCents: number, quantity: number): {
  totalCents: number;
  effectiveDiscountRate: number;
  bandBreakdown: Array<{ band: string; seats: number; unitPrice: number; subtotal: number }>;
} {
  let totalCents = 0;
  const breakdown: Array<{ band: string; seats: number; unitPrice: number; subtotal: number }> = [];
  let seatsRemaining = quantity;

  for (const band of VOLUME_BANDS) {
    if (seatsRemaining <= 0) break;
    const bandCapacity = band.max === Infinity ? seatsRemaining : Math.min(seatsRemaining, band.max - band.min + 1);
    // For the first band, take min(seatsRemaining, band.max)
    // For subsequent bands, take min(seatsRemaining, band size)
    const seatsInBand = Math.min(seatsRemaining, band.max === Infinity ? seatsRemaining : band.max - band.min + 1);
    const discountedUnit = Math.round(unitPriceCents * (1 - band.rate));
    const bandSubtotal = discountedUnit * seatsInBand;

    breakdown.push({
      band: `${band.min}-${band.max === Infinity ? "∞" : band.max}`,
      seats: seatsInBand,
      unitPrice: discountedUnit,
      subtotal: bandSubtotal,
    });

    totalCents += bandSubtotal;
    seatsRemaining -= seatsInBand;
  }

  const listTotal = unitPriceCents * quantity;
  const effectiveDiscountRate = listTotal > 0 ? (listTotal - totalCents) / listTotal : 0;

  return { totalCents, effectiveDiscountRate, bandBreakdown: breakdown };
}

/**
 * Calculate blended discount rate for a mixed Course Pass order.
 * The total number of licences determines which bands apply.
 * The effective discount is then applied uniformly across all line items.
 */
export function calculateBlendedDiscount(totalLicences: number): number {
  if (totalLicences <= 0) return 0;
  // Use a reference unit price of 10000 cents to compute the effective rate
  const { effectiveDiscountRate } = calculateGraduatedTotal(10000, totalLicences);
  return effectiveDiscountRate;
}

/**
 * Get the Course Pass price for a given course key and term.
 */
export function getCoursePassPrice(courseKey: string, termMonths: CoursePassTerm): number {
  const annualPrice = INDIVIDUAL_PRICES_CAD[courseKey];
  if (!annualPrice) throw new Error(`Unknown course key for pricing: ${courseKey}`);

  const bandPrices = COURSE_PASS_BAND_PRICES[annualPrice];
  if (!bandPrices) throw new Error(`No Course Pass band for annual price ${annualPrice} (course: ${courseKey})`);

  switch (termMonths) {
    case 3: return bandPrices.threeMonthCents;
    case 6: return bandPrices.sixMonthCents;
    case 12: return bandPrices.twelveMonthCents;
    default: throw new Error(`Invalid term: ${termMonths}. Must be 3, 6, or 12.`);
  }
}

/**
 * Validate Teams All-Access quantity (must be >= 5).
 */
export function validateAllAccessQuantity(quantity: number): { valid: boolean; error?: string } {
  if (quantity < TEAMS_ALL_ACCESS_MIN_SEATS) {
    return { valid: false, error: `Teams All-Access requires a minimum of ${TEAMS_ALL_ACCESS_MIN_SEATS} seats. You selected ${quantity}.` };
  }
  return { valid: true };
}

/**
 * Calculate Teams All-Access total with graduated volume pricing.
 */
export function calculateAllAccessTotal(quantity: number): ReturnType<typeof calculateGraduatedTotal> {
  return calculateGraduatedTotal(TEAMS_ALL_ACCESS_PRICE_CENTS, quantity);
}

/**
 * Calculate Teams Course Pass order total with blended discount.
 * All items in the order share the same effective discount rate based on total licence count.
 */
export function calculateCoursePassOrderTotal(
  items: Array<{ courseKey: string; termMonths: CoursePassTerm; quantity: number }>,
): {
  totalCents: number;
  subtotalBeforeDiscount: number;
  discountCents: number;
  effectiveDiscountRate: number;
  lineItems: Array<{
    courseKey: string;
    termMonths: CoursePassTerm;
    quantity: number;
    listUnitPrice: number;
    discountedUnitPrice: number;
    lineTotal: number;
  }>;
} {
  const totalLicences = items.reduce((sum, item) => sum + item.quantity, 0);
  const blendedDiscount = calculateBlendedDiscount(totalLicences);

  let subtotalBeforeDiscount = 0;
  let totalCents = 0;
  const lineItems = items.map(item => {
    const listUnitPrice = getCoursePassPrice(item.courseKey, item.termMonths);
    const discountedUnitPrice = Math.round(listUnitPrice * (1 - blendedDiscount));
    const lineTotal = discountedUnitPrice * item.quantity;
    subtotalBeforeDiscount += listUnitPrice * item.quantity;
    totalCents += lineTotal;
    return {
      courseKey: item.courseKey,
      termMonths: item.termMonths,
      quantity: item.quantity,
      listUnitPrice,
      discountedUnitPrice,
      lineTotal,
    };
  });

  return {
    totalCents,
    subtotalBeforeDiscount,
    discountCents: subtotalBeforeDiscount - totalCents,
    effectiveDiscountRate: blendedDiscount,
    lineItems,
  };
}

/**
 * Check if a term is valid for Course Pass.
 */
export function isValidCoursePassTerm(months: number): months is CoursePassTerm {
  return months === 3 || months === 6 || months === 12;
}
