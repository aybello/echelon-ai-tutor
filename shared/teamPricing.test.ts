/**
 * shared/teamPricing.test.ts
 *
 * Tests for the shared Teams pricing module.
 * All exact amounts from the spec are verified here.
 */

import { describe, it, expect } from "vitest";
import {
  TEAM_BASE_PRICE,
  TEAM_VOLUME_TIERS,
  getTeamVolumeTier,
  getTeamSeatPriceCents,
  getTeamTotalPriceCents,
  formatTeamPriceCAD,
} from "./teamPricing";

// ── National pricing parity ───────────────────────────────────────────────────

describe("National pricing parity — Ontario and Western Canada are identical", () => {
  it("stream-water base price is identical in both regions", () => {
    expect(TEAM_BASE_PRICE.ontario["stream-water"]).toBe(34900);
    expect(TEAM_BASE_PRICE.western["stream-water"]).toBe(34900);
  });

  it("stream-wastewater base price is identical in both regions", () => {
    expect(TEAM_BASE_PRICE.ontario["stream-wastewater"]).toBe(34900);
    expect(TEAM_BASE_PRICE.western["stream-wastewater"]).toBe(34900);
  });

  it("stream-water-dist base price is identical in both regions", () => {
    expect(TEAM_BASE_PRICE.ontario["stream-water-dist"]).toBe(34900);
    expect(TEAM_BASE_PRICE.western["stream-water-dist"]).toBe(34900);
  });

  it("stream-wastewater-coll base price is identical in both regions", () => {
    expect(TEAM_BASE_PRICE.ontario["stream-wastewater-coll"]).toBe(34900);
    expect(TEAM_BASE_PRICE.western["stream-wastewater-coll"]).toBe(34900);
  });

  it("all-access base price is identical in both regions", () => {
    expect(TEAM_BASE_PRICE.ontario["all-access"]).toBe(44900);
    expect(TEAM_BASE_PRICE.western["all-access"]).toBe(44900);
  });

  it("every single-stream tier costs 34900 cents", () => {
    const singleStreamTiers = ["stream-water", "stream-wastewater", "stream-water-dist", "stream-wastewater-coll"] as const;
    for (const tier of singleStreamTiers) {
      expect(TEAM_BASE_PRICE.ontario[tier]).toBe(34900);
      expect(TEAM_BASE_PRICE.western[tier]).toBe(34900);
    }
  });

  it("All Streams costs 44900 cents", () => {
    expect(TEAM_BASE_PRICE.ontario["all-access"]).toBe(44900);
    expect(TEAM_BASE_PRICE.western["all-access"]).toBe(44900);
  });
});

// ── Volume discount boundaries ────────────────────────────────────────────────

describe("Volume discount boundaries", () => {
  it("9 seats → 0% discount", () => {
    expect(getTeamVolumeTier(9).discountPct).toBe(0);
  });

  it("10 seats → 10% discount", () => {
    expect(getTeamVolumeTier(10).discountPct).toBe(10);
  });

  it("24 seats → 10% discount", () => {
    expect(getTeamVolumeTier(24).discountPct).toBe(10);
  });

  it("25 seats → 15% discount", () => {
    expect(getTeamVolumeTier(25).discountPct).toBe(15);
  });

  it("49 seats → 15% discount", () => {
    expect(getTeamVolumeTier(49).discountPct).toBe(15);
  });

  it("50 seats → 20% discount", () => {
    expect(getTeamVolumeTier(50).discountPct).toBe(20);
  });

  it("500 seats → 20% discount", () => {
    expect(getTeamVolumeTier(500).discountPct).toBe(20);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe("Input validation", () => {
  it("rejects licence count below 1", () => {
    expect(() => getTeamVolumeTier(0)).toThrow(RangeError);
  });

  it("rejects licence count above 500", () => {
    expect(() => getTeamVolumeTier(501)).toThrow(RangeError);
  });

  it("rejects non-integer licence count (1.5)", () => {
    expect(() => getTeamVolumeTier(1.5)).toThrow(RangeError);
  });

  it("rejects NaN", () => {
    expect(() => getTeamVolumeTier(NaN)).toThrow(RangeError);
  });
});

// ── Exact pricing results from spec ──────────────────────────────────────────

describe("Single Stream exact pricing results", () => {
  it("1 licence → $349.00 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "stream-water", 1)).toBe(34900);
  });

  it("10 licences → $314.10 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "stream-water", 10)).toBe(31410);
  });

  it("10 licences → $3,141.00 total", () => {
    expect(getTeamTotalPriceCents("ontario", "stream-water", 10)).toBe(314100);
  });

  it("25 licences → $296.65 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "stream-water", 25)).toBe(29665);
  });

  it("25 licences → $7,416.25 total", () => {
    expect(getTeamTotalPriceCents("ontario", "stream-water", 25)).toBe(741625);
  });

  it("50 licences → $279.20 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "stream-water", 50)).toBe(27920);
  });

  it("50 licences → $13,960.00 total", () => {
    expect(getTeamTotalPriceCents("ontario", "stream-water", 50)).toBe(1396000);
  });
});

describe("All Streams exact pricing results", () => {
  it("1 licence → $449.00 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "all-access", 1)).toBe(44900);
  });

  it("10 licences → $404.10 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "all-access", 10)).toBe(40410);
  });

  it("10 licences → $4,041.00 total", () => {
    expect(getTeamTotalPriceCents("ontario", "all-access", 10)).toBe(404100);
  });

  it("25 licences → $381.65 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "all-access", 25)).toBe(38165);
  });

  it("25 licences → $9,541.25 total", () => {
    expect(getTeamTotalPriceCents("ontario", "all-access", 25)).toBe(954125);
  });

  it("50 licences → $359.20 per licence", () => {
    expect(getTeamSeatPriceCents("ontario", "all-access", 50)).toBe(35920);
  });

  it("50 licences → $17,960.00 total", () => {
    expect(getTeamTotalPriceCents("ontario", "all-access", 50)).toBe(1796000);
  });
});

describe("Western Canada pricing matches Ontario exactly", () => {
  it("Western 25 Single Stream → $296.65 per licence", () => {
    expect(getTeamSeatPriceCents("western", "stream-water", 25)).toBe(29665);
  });

  it("Western 25 All Streams → $381.65 per licence", () => {
    expect(getTeamSeatPriceCents("western", "all-access", 25)).toBe(38165);
  });
});

// ── formatTeamPriceCAD ────────────────────────────────────────────────────────

describe("formatTeamPriceCAD", () => {
  it("formats 29665 cents to contain '296.65'", () => {
    expect(formatTeamPriceCAD(29665)).toContain("296.65");
  });

  it("formats 741625 cents to contain '7,416.25'", () => {
    expect(formatTeamPriceCAD(741625)).toContain("7,416.25");
  });

  it("formats whole-dollar amounts without cents", () => {
    expect(formatTeamPriceCAD(34900)).not.toContain(".");
  });

  it("formats 44900 cents as $449", () => {
    expect(formatTeamPriceCAD(44900)).toContain("449");
  });
});
