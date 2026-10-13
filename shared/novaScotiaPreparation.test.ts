import { describe, expect, it } from "vitest";
import { getAllCourses } from "./courseRegistry";
import { ALL_PRODUCTS } from "./products";
import { isNovaScotiaCourseSupported, NOVA_SCOTIA_PREPARATION_NOTE } from "./novaScotiaPreparation";
import { availablePricingSelection, buildPricingHref, courseProvinceHref, funnelProvince, individualCheckoutCancelPath, readPricingSelection, safeCurrentDestination } from "./funnelNavigation";

describe("Nova Scotia individual-course context", () => {
  const supported = getAllCourses().filter(course => isNovaScotiaCourseSupported(course.courseKey));
  const live = new Set(ALL_PRODUCTS.map(product => product.key));
  it("has fourteen shared WPI courses without duplicating products or altering prices", () => {
    expect(supported).toHaveLength(14);
    expect(funnelProvince("ns")).toBe("NS");
    for (const course of supported) {
      const href = buildPricingHref(course.courseKey, "ns");
      expect(href).toBe(`/pricing?product=${course.courseKey}&province=NS`);
      expect(readPricingSelection(href.split("?")[1])).toEqual({ province: "NS", requestedProductKey: course.courseKey });
      expect(availablePricingSelection(href.split("?")[1], live).selectedProductKey).toBe(course.courseKey);
      expect(courseProvinceHref(course.quizPath, course.courseKey, "NS")).toBe(`${course.quizPath}?province=NS`);
      expect(safeCurrentDestination(`${course.quizPath}?province=NS`)).toBe(`${course.quizPath}?province=NS`);
      expect(individualCheckoutCancelPath(course.courseKey, "https://echelon.example/pricing?province=NS", "https://echelon.example")).toBe(href);
    }
  });
  it.each(["oit", "oit-ww", "wqa", "class1-water", "electrician-309a", "wpi-class4-water-dist", "wpi-class4-water-coll", "us-class1-water"])("does not silently route unsupported %s to Ontario or BC", key => {
    expect(isNovaScotiaCourseSupported(key)).toBe(false);
    expect(readPricingSelection(`product=${key}&province=NS`)).toEqual({ province: "NS", requestedProductKey: "" });
    expect(buildPricingHref(key, "NS")).toBe("/pricing?province=NS");
    expect(courseProvinceHref("/quiz", key, "NS")).toBe("/pricing?province=NS");
  });
  it("waits for verified availability and explains the exam-version limitation", () => {
    expect(availablePricingSelection("product=wpi-class1-water&province=NS").selectedProductKey).toBe("");
    expect(availablePricingSelection("product=wpi-class1-water&province=NS", new Set()).selectedProductKey).toBe("");
    expect(NOVA_SCOTIA_PREPARATION_NOTE).toContain("2017 ABC exams");
    expect(NOVA_SCOTIA_PREPARATION_NOTE).toContain("CEU credit are not claimed");
  });
});
