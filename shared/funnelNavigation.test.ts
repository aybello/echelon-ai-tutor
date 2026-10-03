import { describe, expect, it } from "vitest";
import { getAllCourses } from "./courseRegistry";
import { ALL_PRODUCTS, PRODUCT_STUDY_PATHS } from "./products";
import { availablePricingSelection, buildPricingHref, courseCatalogueHref, individualCheckoutCancelPath, readPricingSelection, safeCurrentDestination, signInHref } from "./funnelNavigation";

const live = new Set(ALL_PRODUCTS.map(product => product.key));

describe("canonical individual funnel context", () => {
  it.each(ALL_PRODUCTS)("keeps $key and its CAD price without a duplicate preview mapping", product => {
    const href = buildPricingHref(product.key, product.key.startsWith("wpi-") ? "AB" : "ON");
    const parsed = availablePricingSelection(href.split("?")[1], live);
    expect(parsed.selectedProductKey).toBe(product.key);
    expect(ALL_PRODUCTS.find(item => item.key === parsed.selectedProductKey)?.priceCAD).toBe(product.priceCAD);
    const course = getAllCourses().find(course => course.courseKey === product.key);
    expect(PRODUCT_STUDY_PATHS[product.key]?.quizPath).toBe(course?.quizPath);
  });

  it("preserves Ontario Class 3 and BC WPI Class III on reload and Back", () => {
    const history = [buildPricingHref("class3-water", "on"), buildPricingHref("wpi-class3-water", "bc")];
    expect(readPricingSelection(history[0].split("?")[1])).toEqual({ province: "ON", requestedProductKey: "class3-water" });
    expect(readPricingSelection(history[1].split("?")[1])).toEqual({ province: "BC", requestedProductKey: "wpi-class3-water" });
    expect(availablePricingSelection(history[1].split("?")[1], live).selectedProductKey).toBe("wpi-class3-water");
    expect(availablePricingSelection(history[0].split("?")[1], live).selectedProductKey).toBe("class3-water");
  });

  it("waits for availability and never substitutes another course", () => {
    const search = "product=wpi-class3-water&province=BC";
    expect(availablePricingSelection(search).selectedProductKey).toBe("");
    expect(availablePricingSelection(search, new Set(["oit"])).selectedProductKey).toBe("");
    expect(availablePricingSelection(search, live).selectedProductKey).toBe("wpi-class3-water");
    expect(readPricingSelection("product=class3-water&province=BC").requestedProductKey).toBe("");
    expect(readPricingSelection("product=bundle-all-access&province=ON").requestedProductKey).toBe("");
    expect(readPricingSelection("product=not-a-course&province=ON").requestedProductKey).toBe("");
    expect(readPricingSelection("tab=western")).toEqual({ province: "BC", requestedProductKey: "" });
    expect(readPricingSelection("product=class3-water&province=unsafe").province).toBe("ON");
  });

  it("cancellation uses only the validated purchased product and safe same-site province", () => {
    const origin = "https://echelon.example.test";
    expect(individualCheckoutCancelPath("wpi-class3-water", `${origin}/pricing?product=oit&province=AB`, origin)).toBe("/pricing?product=wpi-class3-water&province=AB");
    expect(individualCheckoutCancelPath("wpi-class3-water", "https://external.example.test/?province=AB", origin)).toBe("/pricing?product=wpi-class3-water&province=BC");
    expect(individualCheckoutCancelPath("class3-water", `${origin}/pricing?province=BC`, origin)).toBe("/pricing?product=class3-water&province=ON");
  });
});

describe("safe sign-in continuation", () => {
  it("retains the full allowed dashboard course query and pricing selection", () => {
    const destination = "/dashboard?course=wpi-class1-wastewater";
    expect(new URLSearchParams(signInHref(destination).split("?")[1]).get("next")).toBe(destination);
    expect(safeCurrentDestination("/pricing?product=wpi-class3-water&province=BC")).toBe("/pricing?product=wpi-class3-water&province=BC");
    expect(safeCurrentDestination("/dashboard?course=electrician-309a")).toBe("/dashboard?course=electrician-309a");
  });
  it.each(["https://external.example.test", "//external.example.test", "/\\external", "/api/oauth/callback", "/account?next=/quiz", "/login/otp", "/auth/magic", "/team/login", "/preview", "/%2f%2fexternal", "/purchase-success?session_id=synthetic"])("rejects unsafe/auth continuation %s", path => {
    expect(safeCurrentDestination(path)).toBe("/dashboard");
  });
  it("drops tokens, personal identifiers, fragments and nested redirects", () => {
    expect(safeCurrentDestination("/class3-water?token=synthetic&email=sample%40example.test&next=%2Flogin&mode=missed#token"))
      .toBe("/class3-water?mode=missed");
    expect(courseCatalogueHref(false)).toBe("/#courses");
    expect(courseCatalogueHref(true)).toBe("/us/courses");
  });
});
