import { describe, expect, it } from "vitest";
import { leadPricingHref, leadStudyContext, legacyLeadPricingRedirect } from "./leadStudyContext";
import { readPricingSelection } from "./funnelNavigation";

describe("email links return to the course and jurisdiction that earned the lead", () => {
  it.each([
    ["oit", "?province=ON", "ON", "oit"],
    ["wpi-class1-water", "?province=AB", "AB", "wpi-class1-water"],
    ["wpi-class1-water", "?province=NS", "NS", "wpi-class1-water"],
    ["us-texas-class-d-water", "", "BC", "us-texas-class-d-water"],
    ["us-class1-water", "?country=US&state=CA", "BC", "us-class1-water"],
  ])("round-trips %s through the actual pricing parser", (source, search, province, product) => {
    const href = leadPricingHref(source, search);
    const selected = readPricingSelection(new URL(href, "https://echelon.invalid").search);
    expect(selected).toEqual({ province, requestedProductKey: product });
    expect(leadPricingHref(source, leadStudyContext(source, search))).toBe(href);
  });

  it("keeps shared WPI US-state context and discards arbitrary URL data", () => {
    const context = leadStudyContext("wpi-class1-water", "?country=US&state=NY&token=secret&email=private@example.com&next=https://evil.test");
    expect(context).toBe("product=wpi-class1-water&country=US&state=NY");
    expect(context).not.toMatch(/secret|private|evil/);
  });

  it("does not select a product for an unknown source", () => {
    expect(readPricingSelection(new URL(leadPricingHref("unknown"), "https://echelon.invalid").search).requestedProductKey).toBe("");
  });

  it("repairs already-sent Texas and provincial email links", () => {
    expect(legacyLeadPricingRedirect("?course=us-texas-class-d-water")).toBe("/pricing?product=us-texas-class-d-water&country=US&state=TX");
    expect(legacyLeadPricingRedirect("?course=wpi-class1-water&province=AB")).toBe("/pricing?product=wpi-class1-water&province=AB");
  });

  it("does not override explicit products or redirect unknown courses", () => {
    expect(legacyLeadPricingRedirect("?course=oit&product=class1-water")).toBeNull();
    expect(legacyLeadPricingRedirect("?course=https://evil.test")).toBeNull();
    expect(legacyLeadPricingRedirect("?course=unknown")).toBeNull();
    expect(legacyLeadPricingRedirect("?product=oit&province=ON")).toBeNull();
  });
});
