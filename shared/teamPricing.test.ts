import { describe, expect, it } from "vitest";
import {
  TEAM_BASE_PRICE,
  formatTeamPriceCAD,
  getTeamBasePriceCents,
  getTeamEffectiveDiscountPct,
  getTeamTotalPriceCents,
  getTeamVolumeTier,
} from "./teamPricing";

describe("Teams Annual pricing", () => {
  it("prices each one-stream annual plan at CA$449 and All Streams at CA$549", () => {
    for (const region of ["ontario", "western"] as const) {
      expect(TEAM_BASE_PRICE[region]["stream-water"]).toBe(44_900);
      expect(TEAM_BASE_PRICE[region]["stream-wastewater"]).toBe(44_900);
      expect(TEAM_BASE_PRICE[region]["stream-water-dist"]).toBe(44_900);
      expect(TEAM_BASE_PRICE[region]["stream-wastewater-coll"]).toBe(44_900);
      expect(TEAM_BASE_PRICE[region]["all-access"]).toBe(54_900);
    }
  });

  it("uses graduated, not retroactive, pricing", () => {
    const nine = getTeamTotalPriceCents("ontario", "all-access", 9);
    const ten = getTeamTotalPriceCents("ontario", "all-access", 10);
    expect(nine).toBe(494_100);
    expect(ten).toBe(543_510);
    expect(ten).toBeGreaterThan(nine);
    expect(getTeamEffectiveDiscountPct("ontario", "all-access", 10)).toBeCloseTo(1);
  });

  it("maps each volume boundary correctly", () => {
    expect(getTeamVolumeTier(1).label).toBe("1-9 licences");
    expect(getTeamVolumeTier(10).label).toBe("10-24 licences");
    expect(getTeamVolumeTier(25).label).toBe("25-49 licences");
    expect(getTeamVolumeTier(50).label).toBe("50+ licences");
  });

  it("formats CAD values for customers", () => {
    expect(formatTeamPriceCAD(44_900)).toContain("449");
    expect(formatTeamPriceCAD(54_900)).toContain("549");
  });

  it("keeps the annual catalogue national", () => {
    expect(getTeamBasePriceCents("ontario", "all-access")).toBe(getTeamBasePriceCents("western", "all-access"));
  });
});
