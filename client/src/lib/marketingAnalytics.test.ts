import { describe, expect, it } from "vitest";
import {
  deriveMarketingAttribution,
  getMarketingAttribution,
  marketingDeviceForWidth,
  marketingProvinceForPath,
} from "./marketingAnalytics";

describe("marketing attribution", () => {
  it("uses coarse source categories without retaining the raw referrer or query", () => {
    expect(deriveMarketingAttribution({
      path: "/pricing",
      search: "?utm_source=fall-campaign&utm_campaign=operator-growth",
      referrer: "https://example.test/private?email=operator@example.com",
      viewportWidth: 390,
    })).toEqual({ source: "campaign", device: "mobile", province: "ontario" });
  });

  it("classifies search, social, referral, and direct visits consistently", () => {
    expect(deriveMarketingAttribution({ path: "/courses/oit", referrer: "https://www.google.ca/search?q=operator+exam" }).source).toBe("organic");
    expect(deriveMarketingAttribution({ path: "/teams", referrer: "https://www.linkedin.com/feed/" }).source).toBe("social");
    expect(deriveMarketingAttribution({ path: "/pricing", referrer: "https://utility.example/training" }).source).toBe("referral");
    expect(deriveMarketingAttribution({ path: "/pricing" }).source).toBe("direct");
  });

  it("uses stable device and region categories", () => {
    expect(marketingDeviceForWidth(767)).toBe("mobile");
    expect(marketingDeviceForWidth(768)).toBe("tablet");
    expect(marketingDeviceForWidth(1100)).toBe("desktop");
    expect(marketingProvinceForPath("/wpi-class2-water")).toBe("western");
    expect(marketingProvinceForPath("/canada/ontario")).toBe("ontario");
    expect(marketingProvinceForPath("/account")).toBe("unknown");
  });

  it("has a server-safe fallback for pre-rendered routes", () => {
    expect(getMarketingAttribution("/teams")).toEqual({
      source: "direct",
      device: "desktop",
      province: "ontario",
    });
  });
});
