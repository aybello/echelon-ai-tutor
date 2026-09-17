import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.STRIPE_SECRET_KEY ??= "sk_test_placeholder";

const pricesList = vi.fn();
const pricesCreate = vi.fn();
vi.mock("./stripe", () => ({
  stripe: { prices: { list: (...args: unknown[]) => pricesList(...args), create: (...args: unknown[]) => pricesCreate(...args) } },
}));

const { buildGraduatedTiers, buildLookupKey, getOrCreateTeamAnnualPrice, resetTeamPriceCache } = await import("./teamGraduatedPrice");
const { calculateGraduatedTotal, CATALOGUE_VERSION } = await import("../../shared/pricingCatalogue");
const { getTeamBasePriceCents, getTeamTotalPriceCents } = await import("../../shared/teamPricing");

function stripeGraduatedCharge(tiers: Array<{ up_to: number | "inf"; unit_amount: number }>, quantity: number): number {
  let total = 0;
  let consumed = 0;
  for (const tier of tiers) {
    if (consumed >= quantity) break;
    const upper = tier.up_to === "inf" ? Infinity : tier.up_to;
    const units = Math.min(quantity, upper) - consumed;
    if (units > 0) total += units * tier.unit_amount;
    consumed += Math.max(units, 0);
  }
  return total;
}

describe("Stripe annual Team pricing", () => {
  it("builds graduated tiers for All Streams at CA$549", () => {
    expect(buildGraduatedTiers(54_900)).toEqual([
      { up_to: 9, unit_amount: 54_900 },
      { up_to: 24, unit_amount: 49_410 },
      { up_to: 49, unit_amount: 46_665 },
      { up_to: "inf", unit_amount: 43_920 },
    ]);
  });

  it("matches Team quote arithmetic for every All Streams seat count", () => {
    const tiers = buildGraduatedTiers(getTeamBasePriceCents("ontario", "all-access"));
    for (let seats = 1; seats <= 500; seats++) {
      expect(stripeGraduatedCharge(tiers, seats)).toBe(getTeamTotalPriceCents("ontario", "all-access", seats));
      expect(stripeGraduatedCharge(tiers, seats)).toBe(calculateGraduatedTotal(54_900, seats).totalCents);
    }
  });

  it("keeps one-stream pricing at CA$449", () => {
    expect(getTeamBasePriceCents("ontario", "stream-water")).toBe(44_900);
    expect(getTeamBasePriceCents("western", "stream-wastewater-coll")).toBe(44_900);
    expect(getTeamBasePriceCents("ontario", "all-access")).toBe(54_900);
  });
});

describe("Annual Stripe Price resolution", () => {
  beforeEach(() => {
    resetTeamPriceCache();
    pricesList.mockReset();
    pricesCreate.mockReset();
  });

  it("reuses an existing stream-specific Price", async () => {
    pricesList.mockResolvedValue({ data: [{ id: "price_existing" }] });
    await expect(getOrCreateTeamAnnualPrice("stream-water", 44_900)).resolves.toBe("price_existing");
    expect(pricesCreate).not.toHaveBeenCalled();
  });

  it("creates a stream-specific graduated annual Price", async () => {
    pricesList.mockResolvedValue({ data: [] });
    pricesCreate.mockResolvedValue({ id: "price_new" });
    await expect(getOrCreateTeamAnnualPrice("all-access", 54_900)).resolves.toBe("price_new");
    const params = pricesCreate.mock.calls[0][0];
    expect(params.billing_scheme).toBe("tiered");
    expect(params.tiers_mode).toBe("graduated");
    expect(params.currency).toBe("cad");
    expect(params.recurring).toEqual({ interval: "year" });
    expect(params.tiers).toEqual(buildGraduatedTiers(54_900));
    expect(params.metadata).toMatchObject({ stream_tier: "all-access", discount_model: "graduated" });
  });

  it("does not share an annual Price between a stream and All Streams", () => {
    expect(buildLookupKey("stream-water", 44_900)).not.toBe(buildLookupKey("all-access", 54_900));
    expect(buildLookupKey("all-access", 54_900)).toContain(CATALOGUE_VERSION.replace(/-/g, ""));
  });

  it("memoises only the exact stream and price combination", async () => {
    pricesList.mockResolvedValue({ data: [{ id: "price_cached" }] });
    await getOrCreateTeamAnnualPrice("stream-water", 44_900);
    await getOrCreateTeamAnnualPrice("stream-water", 44_900);
    await getOrCreateTeamAnnualPrice("all-access", 54_900);
    expect(pricesList).toHaveBeenCalledTimes(2);
  });
});
