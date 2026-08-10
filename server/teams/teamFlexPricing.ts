/**
 * Teams Flex Pricing Configuration
 * Course-specific licences: 3-month or 6-month terms only.
 * Volume discount calculated from total licences in the complete order.
 */

export type TeamFlexTermMonths = 3 | 6;

export function isValidFlexTerm(months: number): months is TeamFlexTermMonths {
  return months === 3 || months === 6;
}

export interface PricingBandConfig {
  threeMonthCents: number;
  sixMonthCents: number;
}

export const TEAM_PRICES_CAD: Record<string, Record<string, PricingBandConfig>> = {
  ontario: {
    oit:    { threeMonthCents: 3900, sixMonthCents: 4900 },
    class1: { threeMonthCents: 7900, sixMonthCents: 9900 },
    class2: { threeMonthCents: 11900, sixMonthCents: 14900 },
    class3: { threeMonthCents: 19900, sixMonthCents: 24900 },
    class4: { threeMonthCents: 23900, sixMonthCents: 29900 },
    wqa:    { threeMonthCents: 11900, sixMonthCents: 14900 },
  },
  western: {
    class1: { threeMonthCents: 11900, sixMonthCents: 14900 },
    class2: { threeMonthCents: 15900, sixMonthCents: 19900 },
    class3: { threeMonthCents: 19900, sixMonthCents: 24900 },
    class4: { threeMonthCents: 23900, sixMonthCents: 29900 },
  },
};

export const FLEX_VOLUME_TIERS = [
  { min: 1,  max: 9,    rate: 0 },
  { min: 10, max: 24,   rate: 0.10 },
  { min: 25, max: 49,   rate: 0.15 },
  { min: 50, max: null, rate: 0.20 },
] as const;

export function getTeamFlexVolumeDiscount(totalLicences: number): number {
  const tier = FLEX_VOLUME_TIERS.find(
    t => totalLicences >= t.min && (t.max === null || totalLicences <= t.max)
  );
  return tier?.rate ?? 0;
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
    const level = levelMatch ? parseInt(levelMatch[1]) : 1;
    return { examFamily: "ontario", pricingBand: `class${level}`, courseLevel: level };
  }
  if (courseKey.startsWith("wpi-")) {
    const levelMatch = courseKey.match(/class(\d)/);
    const level = levelMatch ? parseInt(levelMatch[1]) : 1;
    return { examFamily: "western", pricingBand: `class${level}`, courseLevel: level };
  }
  return { examFamily: "ontario", pricingBand: "class1", courseLevel: null };
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

export function getRetakeExtensionPrice(examFamily: string, pricingBand: string): number {
  const familyPrices = TEAM_PRICES_CAD[examFamily];
  if (!familyPrices) throw new Error(`Unknown exam family: ${examFamily}`);
  const bandPrices = familyPrices[pricingBand];
  if (!bandPrices) throw new Error(`Unknown pricing band: ${pricingBand} for ${examFamily}`);
  return Math.round(bandPrices.threeMonthCents * 0.25);
}
