import { describe, expect, it } from "vitest";
import { ALL_PRODUCTS } from "./products";
import { buildPricingHref, courseProvinceHref, individualCheckoutCancelPath, readPricingSelection, safeCurrentDestination } from "./funnelNavigation";
import { readUSStudyContext, withUSStudyContext } from "./usStudyContext";
import { US_STATE_NAMES } from "./usStateNames";

describe("US display context keeps shared course identity", () => {
  it.each(US_STATE_NAMES)("accepts $name only with explicit US context", state => {
    expect(readUSStudyContext(`country=US&state=${state.code}`).state?.code).toBe(state.code);
    expect(readUSStudyContext(`state=${state.code}`).isUS).toBe(false);
  });
  it("drops an invalid state rather than inventing a matching course", () => {
    expect(readUSStudyContext("country=US&state=XX")).toEqual({ isUS: true, state: undefined });
    expect(withUSStudyContext("/wpi-class1-water?province=BC", "wpi-class1-water", "country=US&state=XX"))
      .toBe("/wpi-class1-water?country=US");
  });
  it("keeps the same selected product and price when US labels replace BC context", () => {
    const product = ALL_PRODUCTS.find(item => item.key === "wpi-class3-water")!;
    const href = buildPricingHref(product.key, "BC", "country=US&state=CA");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("product")).toBe(product.key);
    expect(params.get("country")).toBe("US");
    expect(params.get("state")).toBe("CA");
    expect(params.has("province")).toBe(false);
    expect(readPricingSelection(params.toString()).requestedProductKey).toBe(product.key);
    expect(ALL_PRODUCTS.find(item => item.key === product.key)?.priceCAD).toBe(product.priceCAD);
  });
  it("does not carry US context into Ontario products", () => {
    expect(buildPricingHref("oit", "ON", "country=US&state=TX")).toBe("/pricing?product=oit&province=ON");
    expect(courseProvinceHref("/quiz", "oit", "ON", "country=US&state=TX")).toBe("/quiz?province=ON");
  });
  it("preserves only state and country across study tools, not user data", () => {
    expect(courseProvinceHref("/wpi-class1-water?panel=tutor", "wpi-class1-water", "BC", "country=US&state=NY&email=private&token=private"))
      .toBe("/wpi-class1-water?panel=tutor&country=US&state=NY");
    expect(withUSStudyContext("https://outside.example/", "wpi-class1-water", "country=US&state=NY")).toBe("https://outside.example/");
  });
  it("retains US display context only from a same-origin cancel referrer", () => {
    const origin = "https://echelon.example.test";
    expect(individualCheckoutCancelPath("wpi-class1-water", `${origin}/pricing?country=US&state=NY`, origin))
      .toBe("/pricing?product=wpi-class1-water&country=US&state=NY");
    expect(individualCheckoutCancelPath("wpi-class1-water", "https://outside.example/?country=US&state=NY", origin))
      .toBe("/pricing?product=wpi-class1-water&province=BC");
  });
  it("retains validated US context in sign-in continuation and drops unknown states", () => {
    expect(safeCurrentDestination("/wpi-class1-water?country=US&state=NY&token=secret"))
      .toBe("/wpi-class1-water?country=US&state=NY");
    expect(safeCurrentDestination("/wpi-class1-water?country=US&state=XX"))
      .toBe("/wpi-class1-water?country=US");
    expect(safeCurrentDestination("/wpi-class1-water?state=NY")).toBe("/wpi-class1-water");
  });
});
