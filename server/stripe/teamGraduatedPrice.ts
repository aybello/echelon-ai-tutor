/**
 * Resolves the Stripe Price used for Echelon Teams Annual plans.
 *
 * Annual plans use graduated volume pricing. A price is scoped to its stream
 * tier as well as its list price, so a one-stream checkout can never reuse an
 * All Streams Stripe product merely because the numeric price matches.
 */

import type Stripe from "stripe";
import { stripe } from "./stripe";
import { CATALOGUE_VERSION, getGraduatedStripeTiers } from "../../shared/pricingCatalogue";
import { type TeamStreamTier, TEAM_STREAM_TIER_LABELS } from "../../shared/teamPricing";

export function buildLookupKey(
  tier: TeamStreamTier,
  listPriceCents: number,
  version: string = CATALOGUE_VERSION,
): string {
  return `echelon_teams_annual_${tier}_${listPriceCents}_${version.replace(/-/g, "")}`;
}

export function buildGraduatedTiers(
  listPriceCents: number,
): Array<{ up_to: number | "inf"; unit_amount: number }> {
  return getGraduatedStripeTiers(listPriceCents);
}

const cachedPriceIds = new Map<string, string>();

/** Test seam that clears the per-tier Stripe Price cache. */
export function resetTeamPriceCache(): void {
  cachedPriceIds.clear();
}

/**
 * Find or create the durable annual Price for a selected stream tier.
 * Stripe lookup-key uniqueness makes concurrent creation safe: a loser reads
 * the winner's price after a failed create attempt.
 */
export async function getOrCreateTeamAnnualPrice(
  tier: TeamStreamTier,
  listPriceCents: number,
): Promise<string> {
  const lookupKey = buildLookupKey(tier, listPriceCents);
  const cached = cachedPriceIds.get(lookupKey);
  if (cached) return cached;

  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data.length > 0) {
    cachedPriceIds.set(lookupKey, existing.data[0].id);
    return existing.data[0].id;
  }

  const tiers = buildGraduatedTiers(listPriceCents) as unknown as Stripe.PriceCreateParams.Tier[];
  try {
    const price = await stripe.prices.create({
      currency: "cad",
      recurring: { interval: "year" },
      billing_scheme: "tiered",
      tiers_mode: "graduated",
      tiers,
      lookup_key: lookupKey,
      product_data: {
        name: `Echelon for Teams — ${TEAM_STREAM_TIER_LABELS[tier]} (annual, per operator)`,
      },
      metadata: {
        catalogue_version: CATALOGUE_VERSION,
        stream_tier: tier,
        list_price_cents: String(listPriceCents),
        discount_model: "graduated",
      },
    });
    cachedPriceIds.set(lookupKey, price.id);
    return price.id;
  } catch (error) {
    const retry = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    if (retry.data.length > 0) {
      cachedPriceIds.set(lookupKey, retry.data[0].id);
      return retry.data[0].id;
    }
    throw error;
  }
}
