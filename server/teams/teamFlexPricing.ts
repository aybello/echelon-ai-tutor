/**
 * Teams Flex Pricing Configuration
 * Course-specific licences: 3-month, 6-month, or 12-month terms.
 * Volume discount calculated from total licences in the complete order.
 */

export type TeamFlexTermMonths = 3 | 6 | 12;

export function isValidFlexTerm(months: number): months is TeamFlexTermMonths {
  return months === 3 || months === 6 || months === 12;
}

export interface PricingBandConfig {
  threeMonthCents: number;
  sixMonthCents: number;
  twelveMonthCents: number;
}

export const TEAM_PRICES_CAD: Record<string, Record<string, PricingBandConfig>> = {
  ontario: {
    oit:    { threeMonthCents: 2900, sixMonthCents: 3900, twelveMonthCents: 4900 },
    class1: { threeMonthCents: 5900, sixMonthCents: 7900, twelveMonthCents: 9900 },
    class2: { threeMonthCents: 8900, sixMonthCents: 11900, twelveMonthCents: 14900 },
    class3: { threeMonthCents: 14900, sixMonthCents: 19900, twelveMonthCents: 24900 },
    class4: { threeMonthCents: 17900, sixMonthCents: 23900, twelveMonthCents: 29900 },
    wqa:    { threeMonthCents: 8900, sixMonthCents: 11900, twelveMonthCents: 14900 },
  },
  western: {
    class1: { threeMonthCents: 8900, sixMonthCents: 11900, twelveMonthCents: 14900 },
    class2: { threeMonthCents: 11900, sixMonthCents: 15900, twelveMonthCents: 19900 },
    class3: { threeMonthCents: 14900, sixMonthCents: 19900, twelveMonthCents: 24900 },
    class4: { threeMonthCents: 17900, sixMonthCents: 23900, twelveMonthCents: 29900 },
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
  if (termMonths === 3) return bandPrices.threeMonthCents;
  if (termMonths === 6) return bandPrices.sixMonthCents;
  return bandPrices.twelveMonthCents;
}

export function getRetakeExtensionPrice(examFamily: string, pricingBand: string): number {
  const familyPrices = TEAM_PRICES_CAD[examFamily];
  if (!familyPrices) throw new Error(`Unknown exam family: ${examFamily}`);
  const bandPrices = familyPrices[pricingBand];
  if (!bandPrices) throw new Error(`Unknown pricing band: ${pricingBand} for ${examFamily}`);
  return Math.round(bandPrices.threeMonthCents * 0.25);
}
