import { describe, expect, it } from "vitest";
import { getAllCourses } from "./courseRegistry";
import { ALL_PRODUCTS } from "./products";
import { isNovaScotiaCheckoutAllowed, isNovaScotiaCourseSupported, isNovaScotiaCourseSurface, isNovaScotiaPathSupported, NOVA_SCOTIA_PREPARATION_NOTE } from "./novaScotiaPreparation";
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

  it("admits only the published Nova Scotia class-and-stream matrix across the registry", () => {
    for (const course of getAllCourses()) {
      const expected = course.isActive
        && course.examFamily === "western"
        && course.classLevel >= 1
        && (course.track === "water-treatment" || course.track === "wastewater-treatment"
          || ((course.track === "water-distribution" || course.track === "wastewater-collection") && course.classLevel <= 3));
      expect(isNovaScotiaCourseSupported(course.courseKey)).toBe(expected);
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
    expect(NOVA_SCOTIA_PREPARATION_NOTE).toContain("Classes I to IV");
    expect(NOVA_SCOTIA_PREPARATION_NOTE).toContain("Classes I to III");
    expect(NOVA_SCOTIA_PREPARATION_NOTE).toContain("does not certify Class IV distribution or Class IV collection");
    expect(NOVA_SCOTIA_PREPARATION_NOTE).not.toContain("confirm Class IV distribution/collection requirements");
  });

  it("guards named unsupported course surfaces and checkout without blocking shared site pages", () => {
    expect(isNovaScotiaPathSupported("/wpi-class3-water-dist")).toBe(true);
    expect(isNovaScotiaPathSupported("/wpi-class4-water-dist")).toBe(false);
    expect(isNovaScotiaPathSupported("/WPI-CLASS4-WATER-DIST/")).toBe(false);
    expect(isNovaScotiaPathSupported("/formulas-wpi-class4-coll")).toBe(false);
    expect(isNovaScotiaPathSupported("/math-practice")).toBe(true);
    expect(isNovaScotiaCourseSurface("/wpi-class4-water-dist")).toBe(true);
    expect(isNovaScotiaCourseSurface("/account")).toBe(false);
    expect(isNovaScotiaCheckoutAllowed("wpi-class3-water-coll", "NS")).toBe(true);
    expect(isNovaScotiaCheckoutAllowed("wpi-class4-water-coll", "NS")).toBe(false);
    expect(isNovaScotiaCheckoutAllowed("wpi-class4-water-coll", "BC")).toBe(true);
  });

  it("keeps legacy Class IV formula aliases explicit until the registry owns them", () => {
    const formulaPaths = new Set(getAllCourses().map(course => course.formulaPath).filter(Boolean));
    expect(formulaPaths).not.toContain("/formulas-wpi-class4-dist");
    expect(formulaPaths).not.toContain("/formulas-wpi-class4-coll");
  });
});
