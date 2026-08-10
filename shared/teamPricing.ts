/**
 * shared/teamPricing.ts
 *
 * Single source of truth for Echelon Teams pricing.
 * Used by both the browser (Teams.tsx) and the server (subscriptionProducts.ts, stripeRouter.ts).
 *
 * National pricing (Ontario and Western Canada are identical):
 *   Single Stream: CA$449 / operator / year
 *   All Streams:   CA$549 / operator / year
 *
 * Volume discounts:
 *   1–9   licences: 0%
 *   10–24 licences: 10%
 *   25–49 licences: 15%
 *   50+   licences: 20%
 */

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
  "stream-water":           44900,
  "stream-wastewater":      44900,
  "stream-water-dist":      44900,
  "stream-wastewater-coll": 44900,
  "all-access":             54900,
};

export const TEAM_BASE_PRICE: Record<TeamRegion, Record<TeamStreamTier, number>> = {
  ontario: { ...NATIONAL_TEAM_BASE_PRICE },
  western: { ...NATIONAL_TEAM_BASE_PRICE },
};

export const TEAM_VOLUME_TIERS = [
  { min: 1,  max: 9,    discountPct: 0,  label: "1-9 licences"   },
  { min: 10, max: 24,   discountPct: 10, label: "10-24 licences" },
  { min: 25, max: 49,   discountPct: 15, label: "25-49 licences" },
  { min: 50, max: null, discountPct: 20, label: "50+ licences"   },
] as const;

export type TeamVolumeTier = (typeof TEAM_VOLUME_TIERS)[number];

export function getTeamVolumeTier(seats: number): TeamVolumeTier {
  if (!Number.isInteger(seats) || seats < 1 || seats > 500) {
    throw new RangeError("Team licence count must be an integer from 1 to 500.");
  }

  const tier = TEAM_VOLUME_TIERS.find(
    candidate =>
      seats >= candidate.min &&
      (candidate.max === null || seats <= candidate.max),
  );

  if (!tier) {
    throw new Error(`No Teams volume tier exists for ${seats} licences.`);
  }

  return tier;
}

export function getTeamBasePriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
): number {
  return TEAM_BASE_PRICE[region][tier];
}

export function getTeamSeatPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  const basePrice = getTeamBasePriceCents(region, tier);
  const volumeTier = getTeamVolumeTier(seats);
  return Math.round(basePrice * (1 - volumeTier.discountPct / 100));
}

export function getTeamTotalPriceCents(
  region: TeamRegion,
  tier: TeamStreamTier,
  seats: number,
): number {
  return getTeamSeatPriceCents(region, tier, seats) * seats;
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
