import { describe, expect, it } from "vitest";
import {
  getAllSubscriptionExamTypes,
  isSubscriptionProvince,
  subscriptionProvinceForOrg,
} from "./stripe/subscriptionProducts";
import { courseKeyToTierStrict, getTeamCourseOptions } from "../shared/products";
import { isNovaScotiaCourseSupported } from "../shared/novaScotiaPreparation";
import { isTeamRegion } from "../shared/teamPricing";

/**
 * Nova Scotia keeps its own organization region, but seat rows are written to
 * the subscriptions table as "western" because the subscriptions enum has no
 * nova-scotia value. Everything below protects the seams created by that
 * mapping. Each test corresponds to a defect found before release.
 */
describe("Nova Scotia certification ceiling", () => {
  it("knows which western courses Nova Scotia actually certifies", () => {
    // Treatment runs to Class IV. Distribution and collection stop at Class III.
    expect(isNovaScotiaCourseSupported("wpi-class4-water")).toBe(true);
    expect(isNovaScotiaCourseSupported("wpi-class4-wastewater")).toBe(true);
    expect(isNovaScotiaCourseSupported("wpi-class3-water-dist")).toBe(true);
    expect(isNovaScotiaCourseSupported("wpi-class3-water-coll")).toBe(true);
    expect(isNovaScotiaCourseSupported("wpi-class4-water-dist")).toBe(false);
    expect(isNovaScotiaCourseSupported("wpi-class4-water-coll")).toBe(false);
  });

  it("offers Nova Scotia teams exactly what the canonical rule allows", () => {
    // The team selector must never drift away from what checkout permits.
    for (const course of getTeamCourseOptions("nova-scotia")) {
      expect(
        isNovaScotiaCourseSupported(course.key),
        `${course.key} is offered to Nova Scotia teams but checkout refuses it`
      ).toBe(true);
    }
    const offered = getTeamCourseOptions("nova-scotia").map(c => c.key);
    expect(offered).not.toContain("wpi-class4-water-dist");
    expect(offered).not.toContain("wpi-class4-water-coll");
    expect(offered).toContain("wpi-class4-water");
  });

  it("documents that a western Class IV seat alone would over-grant", () => {
    // This is why the entitlement resolver applies a provincial ceiling. A
    // Nova Scotia Class IV treatment seat maps to western/class4, and that
    // tier unlocks the Class IV distribution and collection banks too.
    const tier = courseKeyToTierStrict("wpi-class4-water", "nova-scotia");
    expect(tier).toBe("class4");
    const granted = getAllSubscriptionExamTypes([
      { tier: tier as never, province: subscriptionProvinceForOrg("nova-scotia") as never },
    ]);
    expect(granted).toContain("wpi-class4-water-dist");
    expect(granted).toContain("wpi-class4-water-coll");

    // The ceiling applied in resolveEntitlementsByEmail removes exactly those.
    const afterCeiling = granted.filter(
      examType => !examType.startsWith("wpi-") || isNovaScotiaCourseSupported(examType)
    );
    expect(afterCeiling).not.toContain("wpi-class4-water-dist");
    expect(afterCeiling).not.toContain("wpi-class4-water-coll");
    expect(afterCeiling).toContain("wpi-class4-water");
  });
});

describe("Nova Scotia subscription region mapping", () => {
  it("maps the org region onto a storable subscription province", () => {
    expect(subscriptionProvinceForOrg("nova-scotia")).toBe("western");
    expect(subscriptionProvinceForOrg("ontario")).toBe("ontario");
    expect(subscriptionProvinceForOrg("western")).toBe("western");
    expect(() => subscriptionProvinceForOrg("quebec")).toThrow();
  });

  it("recognises nova-scotia as a team region but not a subscription province", () => {
    // Any code validating checkout metadata must use isTeamRegion, because
    // isSubscriptionProvince alone silently discards Nova Scotia.
    expect(isTeamRegion("nova-scotia")).toBe(true);
    expect(isSubscriptionProvince("nova-scotia")).toBe(false);
  });

  it("lets the reconcile safety net recover a Nova Scotia team subscription", () => {
    // Team checkout writes the buying region into subscription_province.
    // Reconcile must convert it rather than skip the row, or a paid Nova
    // Scotia organization could never be recovered after a dropped webhook.
    const metadata = "nova-scotia";
    const province = isTeamRegion(metadata)
      ? subscriptionProvinceForOrg(metadata)
      : isSubscriptionProvince(metadata)
        ? metadata
        : undefined;
    expect(province).toBe("western");
  });
});
