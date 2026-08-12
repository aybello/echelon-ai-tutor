/**
 * server/stripe/teamGraduatedPrice.test.ts
 *
 * The audit found the pricing page quoting graduated totals while checkout
 * charged retroactive ones — a CA$1,815 gap at 50 seats. These tests close that
 * loop by simulating Stripe's graduated tier engine and asserting it produces
 * exactly the number the UI displays.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.STRIPE_SECRET_KEY ??= "sk_test_placeholder";

const pricesList = vi.fn();
const pricesCreate = vi.fn();

vi.mock("./stripe", () => ({
  stripe: {
    prices: {
      list: (...args: unknown[]) => pricesList(...args),
      create: (...args: unknown[]) => pricesCreate(...args),
    },
  },
}));

const { buildGraduatedTiers, buildLookupKey, getOrCreateTeamAllAccessPrice, resetTeamPriceCache } =
  await import("./teamGraduatedPrice");
const { calculateGraduatedTotal, TEAMS_ALL_ACCESS_PRICE_CENTS, CATALOGUE_VERSION } =
  await import("../../shared/pricingCatalogue");
const { getTeamTotalPriceCents } = await import("../../shared/teamPricing");

/**
 * Reimplementation of Stripe's `tiers_mode: "graduated"` billing engine.
 * Each tier prices only the units that fall inside it, where `up_to` is the
 * inclusive upper bound.
 */
function stripeGraduatedCharge(
  tiers: Array<{ up_to: number | "inf"; unit_amount: number }>,
  quantity: number,
): number {
  let total = 0;
  let consumed = 0;
  for (const tier of tiers) {
    if (consumed >= quantity) break;
    const upper = tier.up_to === "inf" ? Infinity : tier.up_to;
    const unitsInTier = Math.min(quantity, upper) - consumed;
    if (unitsInTier <= 0) continue;
    total += unitsInTier * tier.unit_amount;
    consumed += unitsInTier;
  }
  return total;
}

describe("Stripe graduated tiers match the quoted price", () => {
  const tiers = buildGraduatedTiers(TEAMS_ALL_ACCESS_PRICE_CENTS);

  it("declares four ascending tiers ending in 'inf'", () => {
    expect(tiers).toEqual([
      { up_to: 9, unit_amount: 39900 },
      { up_to: 24, unit_amount: 35910 },
      { up_to: 49, unit_amount: 33915 },
      { up_to: "inf", unit_amount: 31920 },
    ]);
  });

  it("charges exactly what calculateGraduatedTotal computes, for every seat count 1–500", () => {
    for (let seats = 1; seats <= 500; seats++) {
      expect(stripeGraduatedCharge(tiers, seats)).toBe(
        calculateGraduatedTotal(TEAMS_ALL_ACCESS_PRICE_CENTS, seats).totalCents,
      );
    }
  });

  it("charges exactly what the Teams page displays, for every seat count 1–500", () => {
    for (let seats = 1; seats <= 500; seats++) {
      expect(stripeGraduatedCharge(tiers, seats)).toBe(
        getTeamTotalPriceCents("ontario", "all-access", seats),
      );
    }
  });

  it("matches the audited reference amounts", () => {
    expect(stripeGraduatedCharge(tiers, 10)).toBe(395010);   // CA$3,950.10
    expect(stripeGraduatedCharge(tiers, 25)).toBe(931665);   // CA$9,316.65
    expect(stripeGraduatedCharge(tiers, 50)).toBe(1777545);  // CA$17,775.45
  });
});

describe("Price resolution", () => {
  beforeEach(() => {
    resetTeamPriceCache();
    pricesList.mockReset();
    pricesCreate.mockReset();
  });

  it("reuses an existing Price when the lookup key already exists", async () => {
    pricesList.mockResolvedValue({ data: [{ id: "price_existing" }] });
    await expect(getOrCreateTeamAllAccessPrice()).resolves.toBe("price_existing");
    expect(pricesCreate).not.toHaveBeenCalled();
  });

  it("creates a tiered graduated Price when none exists", async () => {
    pricesList.mockResolvedValue({ data: [] });
    pricesCreate.mockResolvedValue({ id: "price_new" });

    await expect(getOrCreateTeamAllAccessPrice()).resolves.toBe("price_new");

    const params = pricesCreate.mock.calls[0][0];
    expect(params.billing_scheme).toBe("tiered");
    expect(params.tiers_mode).toBe("graduated");
    expect(params.currency).toBe("cad");
    expect(params.recurring).toEqual({ interval: "year" });
    expect(params.tiers).toEqual(buildGraduatedTiers());
    expect(params.metadata.discount_model).toBe("graduated");
  });

  it("memoises the Price so repeat checkouts do not re-query Stripe", async () => {
    pricesList.mockResolvedValue({ data: [{ id: "price_cached" }] });
    await getOrCreateTeamAllAccessPrice();
    await getOrCreateTeamAllAccessPrice();
    expect(pricesList).toHaveBeenCalledTimes(1);
  });

  it("recovers by re-reading when it loses a concurrent create race", async () => {
    pricesList
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: "price_from_race_winner" }] });
    pricesCreate.mockRejectedValue(new Error("lookup_key already exists"));

    await expect(getOrCreateTeamAllAccessPrice()).resolves.toBe("price_from_race_winner");
  });

  it("rethrows when creation fails for a reason other than a race", async () => {
    pricesList.mockResolvedValue({ data: [] });
    pricesCreate.mockRejectedValue(new Error("card_declined"));
    await expect(getOrCreateTeamAllAccessPrice()).rejects.toThrow("card_declined");
  });

  it("versions the lookup key by list price and catalogue version", () => {
    const key = buildLookupKey();
    expect(key).toContain(String(TEAMS_ALL_ACCESS_PRICE_CENTS));
    expect(key).toContain(CATALOGUE_VERSION.replace(/-/g, ""));
    // A price change must produce a different key so existing subscribers are
    // never silently repriced.
    expect(buildLookupKey(44900)).not.toBe(key);
  });
});
