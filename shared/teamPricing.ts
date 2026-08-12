/**
 * shared/teamPricing.ts
 *
 * Teams pricing presentation layer. All volume arithmetic is delegated to
 * `shared/pricingCatalogue.ts`, which is the single source of truth for the
 * discount model.
 *
 * National pricing (Ontario and Western Canada are identical):
 *   All-Access: CA$399 / operator / year
 *
 * Volume discounts are GRADUATED, not retroactive: each seat is priced in its
 * own band, so seats 1–9 always cost full price even on a 50-seat order.
 *
 *   Seats 1–9:   list price
 *   Seats 10–24: 10% off
 *   Seats 25–49: 15% off
 *   Seats 50+:   20% off
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
  "stream-water":           "Water Treatment",
  "stream-wastewater":      "Wastewater Treatment",
  "stream-water-dist":      "Water Distribution",
  "stream-wastewater-coll": "Wastewater Collection",
  "all-access":             "All Streams",
};

export const TEAM_STREAM_TIER_DESCRIPTIONS: Record<TeamStreamTier, string> = {
  "stream-water":           "Water treatment, entry level through Class 4",
  "stream-wastewater":      "Wastewater treatment, entry level through Class 4",
  "stream-water-dist":      "Water distribution, entry level through Class 4",
  "stream-wastewater-coll": "Wastewater collection, entry level through Class 4",
  "all-access":             "All four streams, every level",
};

const NATIONAL_TEAM_BASE_PRICE: Record<TeamStreamTier, number> = {
  "stream-water":           39900,
  "stream-wastewater":      39900,
  "stream-water-dist":      39900,
  "stream-wastewater-coll": 39900,
  "all-access":             39900,
};

export const TEAM_BASE_PRICE: Record<TeamRegion, Record<TeamStreamTier, number>> = {
  ontario: { ...NATIONAL_TEAM_BASE_PRICE },
  western: { ...NATIONAL_TEAM_BASE_PRICE },
};

/**
 * Display bands, derived from the catalogue so the two can never drift.
 * `discountPct` is the MARGINAL rate applied to seats inside the band.
 */
export const TEAM_VOLUME_TIERS = VOLUME_BANDS.map(band => ({
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

/**
 * The band the *last* seat of an order falls into (marginal band).
 */
export function getTeamVolumeTier(seats: number): TeamVolumeTier {
  if (!Number.isInteger(seats) || seats < 1 || seats > 500) {
    throw new RangeError("Team licence count must be an integer from 1 to 500.");
  }
  const tier = TEAM_VOLUME_TIERS.find(
    candidate =>
      seats >= candidate.min &&
      (candidate.max === null || seats <= candidate.max),
  );
  if (!tier) throw new Error(`No Teams volume tier exists for ${seats} licences.`);
  return tier;
}

export function getTeamBasePriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
): number {
  return TEAM_BASE_PRICE[region][tier];
}

/**
 * Total annual cost for `seats` operators, using graduated band pricing.
 * This is the authoritative figure — Stripe charges exactly this.
 */
export function getTeamTotalPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  getTeamVolumeTier(seats); // validates
  const basePrice = getTeamBasePriceCents(region, tier);
  return calculateGraduatedTotal(basePrice, seats).totalCents;
}

/**
 * Average cost per seat across the whole order (total ÷ seats). DISPLAY ONLY.
 */
export function getTeamEffectiveSeatPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  if (seats <= 0) return getTeamBasePriceCents(region, tier);
  return Math.round(getTeamTotalPriceCents(region, tier, seats) / seats);
}

/**
 * Cost of the next seat added to an order of this size — the marginal band rate.
 */
export function getTeamMarginalSeatPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  return getMarginalUnitPrice(getTeamBasePriceCents(region, tier), seats);
}

/**
 * Order-wide discount as a percentage off list, to one decimal place.
 */
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

/** Savings vs. paying list price for every seat. */
export function getTeamSavingsCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  return getTeamBasePriceCents(region, tier) * seats - getTeamTotalPriceCents(region, tier, seats);
}

/** @deprecated Use getTeamEffectiveSeatPriceCents or getTeamMarginalSeatPriceCents */
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

/** Allowed course keys for an org's tier */
