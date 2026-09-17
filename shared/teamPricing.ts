/**
 * Echelon Teams annual pricing.
 *
 * This module is the annual-plan pricing source used by the public calculator,
 * Stripe Checkout, and organization provisioning. It deliberately separates
 * annual Teams access from the shorter Teams Flex Course Pass product.
 *
 * National pricing:
 * - One stream: CA$449 per named operator, per year
 * - All streams: CA$549 per named operator, per year
 *
 * Volume discounts are graduated, not retroactive. Each licence keeps the
 * price for its own band, so crossing a threshold never lowers the price of
 * licences already counted in the order.
 */

import {
  VOLUME_BANDS,
  calculateGraduatedTotal,
  getMarginalUnitPrice,
} from "./pricingCatalogue";

export type TeamRegion = "ontario" | "western";

export type TeamStreamTier =
  | "stream-water"
  | "stream-wastewater"
  | "stream-water-dist"
  | "stream-wastewater-coll"
  | "all-access";

export const TEAM_STREAM_TIER_LABELS: Record<TeamStreamTier, string> = {
  "stream-water": "Water Treatment",
  "stream-wastewater": "Wastewater Treatment",
  "stream-water-dist": "Water Distribution",
  "stream-wastewater-coll": "Wastewater Collection",
  "all-access": "All Streams",
};

export const TEAM_STREAM_TIER_DESCRIPTIONS: Record<TeamStreamTier, string> = {
  "stream-water": "Water treatment, entry level through Class 4",
  "stream-wastewater": "Wastewater treatment, entry level through Class 4",
  "stream-water-dist": "Water distribution, entry level through Class 4",
  "stream-wastewater-coll": "Wastewater collection, entry level through Class 4",
  "all-access": "All four streams, every released level",
};

const NATIONAL_TEAM_BASE_PRICE: Record<TeamStreamTier, number> = {
  "stream-water": 44900,
  "stream-wastewater": 44900,
  "stream-water-dist": 44900,
  "stream-wastewater-coll": 44900,
  "all-access": 54900,
};

export const TEAM_BASE_PRICE: Record<TeamRegion, Record<TeamStreamTier, number>> = {
  ontario: { ...NATIONAL_TEAM_BASE_PRICE },
  western: { ...NATIONAL_TEAM_BASE_PRICE },
};

export const TEAM_VOLUME_TIERS = VOLUME_BANDS.map((band) => ({
  min: band.min,
  max: band.max === Infinity ? null : band.max,
  discountPct: Math.round(band.rate * 100),
  label: band.max === Infinity ? `${band.min}+ licences` : `${band.min}-${band.max} licences`,
})) as ReadonlyArray<{
  readonly min: number;
  readonly max: number | null;
  readonly discountPct: number;
  readonly label: string;
}>;

export type TeamVolumeTier = (typeof TEAM_VOLUME_TIERS)[number];

export function getTeamVolumeTier(seats: number): TeamVolumeTier {
  if (!Number.isInteger(seats) || seats < 1 || seats > 500) {
    throw new RangeError("Team licence count must be an integer from 1 to 500.");
  }
  const tier = TEAM_VOLUME_TIERS.find(
    (candidate) => seats >= candidate.min && (candidate.max === null || seats <= candidate.max),
  );
  if (!tier) throw new Error(`No Teams volume tier exists for ${seats} licences.`);
  return tier;
}

export function getTeamBasePriceCents(region: TeamRegion, tier: TeamStreamTier): number {
  return TEAM_BASE_PRICE[region][tier];
}

export function getTeamTotalPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  getTeamVolumeTier(seats);
  return calculateGraduatedTotal(getTeamBasePriceCents(region, tier), seats).totalCents;
}

export function getTeamEffectiveSeatPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  if (seats <= 0) return getTeamBasePriceCents(region, tier);
  return Math.round(getTeamTotalPriceCents(region, tier, seats) / seats);
}

export function getTeamMarginalSeatPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  return getMarginalUnitPrice(getTeamBasePriceCents(region, tier), seats);
}

export function getTeamEffectiveDiscountPct(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  const listTotal = getTeamBasePriceCents(region, tier) * seats;
  if (listTotal <= 0) return 0;
  const actual = getTeamTotalPriceCents(region, tier, seats);
  return Math.round(((listTotal - actual) / listTotal) * 1000) / 10;
}

export function getTeamSavingsCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  return getTeamBasePriceCents(region, tier) * seats - getTeamTotalPriceCents(region, tier, seats);
}

/** @deprecated Use getTeamEffectiveSeatPriceCents or getTeamMarginalSeatPriceCents. */
export function getTeamSeatPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  return getTeamMarginalSeatPriceCents(region, tier, seats);
}

export function formatTeamPriceCAD(cents: number): string {
  const includesCents = cents % 100 !== 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: includesCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
