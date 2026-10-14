import { describe, expect, it } from "vitest";
import { allowedCourseKeysForOrg, subscriptionProvinceForOrg } from "../server/stripe/subscriptionProducts";

describe("Nova Scotia subscription seat storage", () => {
  it("stores Nova Scotia organization seat rows in the western subscription family", () => {
    expect(subscriptionProvinceForOrg("nova-scotia")).toBe("western");
    expect(subscriptionProvinceForOrg("ontario")).toBe("ontario");
    expect(subscriptionProvinceForOrg("western")).toBe("western");
  });
  it("refuses unknown regions", () => {
    expect(() => subscriptionProvinceForOrg("unknown")).toThrow("not supported");
  });
  it("keeps Nova Scotia Class IV distribution and collection excluded", () => {
    const courses=allowedCourseKeysForOrg("all-access","nova-scotia");
    expect(courses).toContain("wpi-class4-water");
    expect(courses).toContain("wpi-class4-wastewater");
    expect(courses).not.toContain("wpi-class4-water-dist");
    expect(courses).not.toContain("wpi-class4-water-coll");
  });
});
