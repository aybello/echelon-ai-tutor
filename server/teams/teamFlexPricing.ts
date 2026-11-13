/**
 * Teams Flex pricing.
 *
 * Flex is a one-time, course-specific licence for a named operator. Launch
 * terms are deliberately limited to 3 and 6 months. A 12-month Individual
 * Exam Pass is a different product and is never recreated as a Flex licence.
 */
import { calculateBlendedDiscount } from "../../shared/pricingCatalogue";

export type TeamFlexTermMonths = 3 | 6;

export function isValidFlexTerm(months: number): months is TeamFlexTermMonths {
  return months === 3 || months === 6;
}

export interface PricingBandConfig {
  threeMonthCents: number;
  sixMonthCents: number;
}

/** Authoritative launch price matrix, in CAD cents. */
export const TEAM_PRICES_CAD: Record<string, Record<string, PricingBandConfig>> = {
  ontario: {
    oit: { threeMonthCents: 3900, sixMonthCents: 4900 },
    class1: { threeMonthCents: 5900, sixMonthCents: 7900 },
    class2: { threeMonthCents: 8900, sixMonthCents: 11900 },
    class3: { threeMonthCents: 14900, sixMonthCents: 19900 },
    class4: { threeMonthCents: 17900, sixMonthCents: 23900 },
    wqa: { threeMonthCents: 8900, sixMonthCents: 11900 },
  },
  western: {
    class1: { threeMonthCents: 8900, sixMonthCents: 11900 },
    class2: { threeMonthCents: 11900, sixMonthCents: 15900 },
    class3: { threeMonthCents: 14900, sixMonthCents: 19900 },
    class4: { threeMonthCents: 17900, sixMonthCents: 23900 },
  },
};

export const FLEX_VOLUME_TIERS = [
  { min: 1, max: 9, rate: 0 },
  { min: 10, max: 24, rate: 0.10 },
  { min: 25, max: 49, rate: 0.15 },
  { min: 50, max: null, rate: 0.20 },
] as const;

/**
 * The effective blended discount across the complete order. It is derived from
 * the graduated-band calculation so adding a licence cannot lower the price of
 * licences already ordered.
 */
export function getTeamFlexVolumeDiscount(totalLicences: number): number {
  return calculateBlendedDiscount(totalLicences);
}

export function getCourseKeyPricingBand(courseKey: string): {
  examFamily: "ontario" | "western";
  pricingBand: string;
  courseLevel: number | null;
} {
  if (courseKey === "oit" || courseKey === "oit-ww") {
    return { examFamily: "ontario", pricingBand: "oit", courseLevel: null };
  }
  if (courseKey === "wqa") {
    return { examFamily: "ontario", pricingBand: "wqa", courseLevel: null };
  }
  if (courseKey.startsWith("class") && !courseKey.startsWith("wpi-")) {
    const levelMatch = courseKey.match(/class(\d)/);
    if (!levelMatch) throw new Error(`Unknown Ontario course key: ${courseKey}`);
    const level = Number(levelMatch[1]);
    return { examFamily: "ontario", pricingBand: `class${level}`, courseLevel: level };
  }
  if (courseKey.startsWith("wpi-")) {
    const levelMatch = courseKey.match(/class(\d)/);
    if (!levelMatch) throw new Error(`Unknown Western course key: ${courseKey}`);
    const level = Number(levelMatch[1]);
    return { examFamily: "western", pricingBand: `class${level}`, courseLevel: level };
  }
  throw new Error(`Unknown course key: ${courseKey}. Cannot determine pricing band.`);
}

export function getFlexListPrice(
  examFamily: string,
  pricingBand: string,
  termMonths: TeamFlexTermMonths,
): number {
  const familyPrices = TEAM_PRICES_CAD[examFamily];
  if (!familyPrices) throw new Error(`Unknown exam family: ${examFamily}`);
  const bandPrices = familyPrices[pricingBand];
  if (!bandPrices) throw new Error(`Unknown pricing band: ${pricingBand} for ${examFamily}`);
  return termMonths === 3 ? bandPrices.threeMonthCents : bandPrices.sixMonthCents;
}

/** One optional, non-repeatable 90-day retake extension costs 25% of the 3-month Flex price. */
export function getRetakeExtensionPrice(examFamily: string, pricingBand: string): number {
  const familyPrices = TEAM_PRICES_CAD[examFamily];
  if (!familyPrices) throw new Error(`Unknown exam family: ${examFamily}`);
  const bandPrices = familyPrices[pricingBand];
  if (!bandPrices) throw new Error(`Unknown pricing band: ${pricingBand} for ${examFamily}`);
  return Math.round(bandPrices.threeMonthCents * 0.25);
}
