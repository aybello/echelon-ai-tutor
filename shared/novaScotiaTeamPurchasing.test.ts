import { describe, it, expect } from "vitest";
import {
  TEAM_REGION_VALUES,
  TEAM_REGION_LABELS,
  isTeamRegion,
  teamRegionExamFamily,
  getTeamBasePriceCents,
  getTeamTotalPriceCents,
  getTeamStreamDescription,
} from "./teamPricing";
import { isNovaScotiaCourseSupported } from "./novaScotiaPreparation";
import {
  STREAM_COURSE_KEYS,
  allowedCourseKeysForOrg,
  validateOrgCourseKeys,
} from "../server/stripe/subscriptionProducts";

/**
 * Nova Scotia buys team plans through the shared WPI exam family, but the
 * province certifies Water Distribution and Wastewater Collection only to
 * Class III. These tests keep the purchase path open and the uncertified
 * courses closed.
 * https://novascotia.ca/nse/water.operator.certification/docs/Standardized_exam_info.pdf
 */
describe("Nova Scotia team purchasing", () => {
  it("is a selectable team region with a clear label", () => {
    expect(TEAM_REGION_VALUES).toContain("nova-scotia");
    expect(isTeamRegion("nova-scotia")).toBe(true);
    expect(TEAM_REGION_LABELS["nova-scotia"]).toContain("Nova Scotia");
  });

  it("rejects values that are not real team regions", () => {
    expect(isTeamRegion("atlantic")).toBe(false);
    expect(isTeamRegion("")).toBe(false);
    expect(isTeamRegion(undefined)).toBe(false);
  });

  it("prices identically to the other regions so no seat is overcharged", () => {
    for (const tier of ["stream-water", "stream-wastewater", "stream-water-dist", "stream-wastewater-coll", "all-access"] as const) {
      expect(getTeamBasePriceCents("nova-scotia", tier)).toBe(getTeamBasePriceCents("western", tier));
      expect(getTeamTotalPriceCents("nova-scotia", tier, 25)).toBe(getTeamTotalPriceCents("western", tier, 25));
    }
  });

  it("resolves to the shared WPI exam family for pricing lookups", () => {
    expect(teamRegionExamFamily("nova-scotia")).toBe("western");
    expect(teamRegionExamFamily("western")).toBe("western");
    expect(teamRegionExamFamily("ontario")).toBe("ontario");
  });

  it("states the real certified ceiling on distribution and collection streams", () => {
    expect(getTeamStreamDescription("nova-scotia", "stream-water-dist")).toContain("Class III");
    expect(getTeamStreamDescription("nova-scotia", "stream-wastewater-coll")).toContain("Class III");
    // Western Canada certifies Class IV, so its wording must stay unchanged.
    expect(getTeamStreamDescription("western", "stream-water-dist")).not.toContain("Class I through Class III");
  });

  it("never grants Class IV distribution or collection in any Nova Scotia tier", () => {
    const uncertified = ["wpi-class4-water-dist", "wpi-class4-water-coll"];
    for (const tier of Object.keys(STREAM_COURSE_KEYS["nova-scotia"]) as Array<keyof typeof STREAM_COURSE_KEYS["nova-scotia"]>) {
      for (const key of uncertified) {
        expect(allowedCourseKeysForOrg(tier, "nova-scotia")).not.toContain(key);
      }
    }
  });

  it("still grants the treatment streams through Class IV", () => {
    const allAccess = allowedCourseKeysForOrg("all-access", "nova-scotia");
    expect(allAccess).toContain("wpi-class4-water");
    expect(allAccess).toContain("wpi-class4-wastewater");
    expect(allAccess).toContain("wpi-class3-water-dist");
    expect(allAccess).toContain("wpi-class3-water-coll");
  });

  it("treats legacy class-level tiers as the scoped all-access set", () => {
    expect(allowedCourseKeysForOrg("class4", "nova-scotia")).toEqual(
      allowedCourseKeysForOrg("all-access", "nova-scotia"),
    );
  });

  it("blocks assigning an uncertified course to a Nova Scotia operator", () => {
    expect(() =>
      validateOrgCourseKeys(["wpi-class4-water-dist"], "all-access", "nova-scotia"),
    ).toThrow(/not a valid course for Nova Scotia/);
  });

  it("allows assigning a certified course to a Nova Scotia operator", () => {
    expect(validateOrgCourseKeys(["wpi-class3-water-dist"], "all-access", "nova-scotia")).toEqual([
      "wpi-class3-water-dist",
    ]);
  });

  it("keeps the entitlement map aligned with the shared eligibility helper", () => {
    const everyNovaScotiaKey = Object.values(STREAM_COURSE_KEYS["nova-scotia"]).flat();
    for (const key of everyNovaScotiaKey) {
      expect(isNovaScotiaCourseSupported(key)).toBe(true);
    }
  });

  it("does not change the Ontario or Western entitlement maps", () => {
    expect(allowedCourseKeysForOrg("stream-water-dist", "western")).toContain("wpi-class4-water-dist");
    expect(allowedCourseKeysForOrg("stream-water-dist", "ontario")).toContain("class4-water-dist");
  });
});
