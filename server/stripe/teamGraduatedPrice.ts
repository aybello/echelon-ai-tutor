/**
 * server/stripe/teamGraduatedPrice.ts
 *
 * Resolves the Stripe Price used for Teams All-Access annual subscriptions.
 *
 * Teams volume discounts are GRADUATED — seats 1–9 always pay full price, only
 * seats 10+ attract a discount. That cannot be expressed as a single
 * `unit_amount × quantity` line item, so we use a Stripe Price with
 * `billing_scheme: "tiered"` and `tiers_mode: "graduated"`. Stripe then applies
 * exactly the arithmetic in `calculateGraduatedTotal`, which means the amount
 * charged always equals the amount quoted on /pricing and /teams.
 *
 * Keeping ONE line item (rather than one per band) also preserves `quantity`
 * semantics, so seat upgrades via `updateTeamSeats` and Stripe's proration
 * continue to work unchanged.
 *
 * The Price is created on first use and then reused. The lookup key embeds the
 * catalogue version and list price, so changing either produces a NEW Price
 * rather than silently repricing existing subscribers.
 */

import type Stripe from "stripe";
import { stripe } from "./stripe";
import {
  CATALOGUE_VERSION,
  TEAMS_ALL_ACCESS_PRICE_CENTS,
  getGraduatedStripeTiers,
} from "../../shared/pricingCatalogue";

/** Stable identifier for the current pricing configuration. */
export function buildLookupKey(
  listPriceCents: number = TEAMS_ALL_ACCESS_PRICE_CENTS,
  version: string = CATALOGUE_VERSION,
): string {
  return `echelon_teams_all_access_annual_${listPriceCents}_${version.replace(/-/g, "")}`;
}

/**
 * Stripe tier payload for the given list price.
 * Exported so tests can assert it against `calculateGraduatedTotal`.
 */
export function buildGraduatedTiers(
  listPriceCents: number = TEAMS_ALL_ACCESS_PRICE_CENTS,
): Array<{ up_to: number | "inf"; unit_amount: number }> {
  return getGraduatedStripeTiers(listPriceCents);
}

/** Module-level cache so we do not hit Stripe on every checkout. */
let cachedPriceId: string | null = null;
let cachedLookupKey: string | null = null;

/** Test seam — clears the memoised Price id. */
export function resetTeamPriceCache(): void {
  cachedPriceId = null;
  cachedLookupKey = null;
}

/**
 * Find (or create) the graduated Stripe Price for Teams All-Access.
 * Safe to call concurrently: if two checkouts race, Stripe's lookup_key
 * uniqueness means the second create fails and we re-read the existing Price.
 */
export async function getOrCreateTeamAllAccessPrice(
  listPriceCents: number = TEAMS_ALL_ACCESS_PRICE_CENTS,
): Promise<string> {
  const lookupKey = buildLookupKey(listPriceCents);

  if (cachedPriceId && cachedLookupKey === lookupKey) return cachedPriceId;

  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data.length > 0) {
    cachedPriceId = existing.data[0].id;
    cachedLookupKey = lookupKey;
    return cachedPriceId;
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
        name: "Echelon for Teams — All-Access (annual, per operator)",
      },
      metadata: {
        catalogue_version: CATALOGUE_VERSION,
        list_price_cents: String(listPriceCents),
        discount_model: "graduated",
      },
    });

    cachedPriceId = price.id;
    cachedLookupKey = lookupKey;
    return price.id;
  } catch (err) {
    // Lost a create race — the Price now exists, so read it back.
    const retry = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
    if (retry.data.length > 0) {
      cachedPriceId = retry.data[0].id;
      cachedLookupKey = lookupKey;
      return cachedPriceId;
    }
    throw err;
  }
}
