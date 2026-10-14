import { describe, expect, it } from "vitest";
import { allowedCourseKeysForOrg, subscriptionProvinceForOrg } from "../server/stripe/subscriptionProducts";
import { courseKeyToTierStrict, isValidCourseKey, getTeamCourseOptions } from "../shared/products";

describe("Nova Scotia subscription seat storage", () => {
  it("stores Nova Scotia organization seat rows in the western subscription family", () => {
    expect(subscriptionProvinceForOrg("nova-scotia")).toBe("western");
    expect(subscriptionProvinceForOrg("ontario")).toBe("ontario");
    expect(subscriptionProvinceForOrg("western")).toBe("western");
  });
  it("refuses unknown regions", () => {
    expect(() => subscriptionProvinceForOrg("unknown")).toThrow("not supported");
  });
  it("resolves Nova Scotia WPI courses to the right subscription tier", () => {
    expect(courseKeyToTierStrict("wpi-class2-water","nova-scotia")).toBe("class2");
    expect(courseKeyToTierStrict("wpi-class4-wastewater","nova-scotia")).toBe("class4");
    expect(courseKeyToTierStrict("class2-water","nova-scotia")).toBeNull();
  });
  it("rejects WPI Class IV distribution/collection for Nova Scotia at the legacy option lookup", () => {
    expect(isValidCourseKey("wpi-class4-water-dist","nova-scotia")).toBe(false);
    expect(isValidCourseKey("wpi-class4-water-coll","nova-scotia")).toBe(false);
    expect(getTeamCourseOptions("nova-scotia")).toHaveLength(14);
  });
  it("keeps Nova Scotia Class IV distribution and collection excluded", () => {
    const courses=allowedCourseKeysForOrg("all-access","nova-scotia");
    expect(courses).toContain("wpi-class4-water");
    expect(courses).toContain("wpi-class4-wastewater");
    expect(courses).not.toContain("wpi-class4-water-dist");
    expect(courses).not.toContain("wpi-class4-water-coll");
  });
});
