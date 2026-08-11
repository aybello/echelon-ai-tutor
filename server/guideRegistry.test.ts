import { describe, expect, it } from "vitest";
import { GUIDE_REGISTRY, getPracticeHref, getPracticePath } from "../client/src/lib/guideRegistry";

describe("Process Guides registry", () => {
  it("contains the seven approved guide products with unique routes", () => {
    expect(GUIDE_REGISTRY).toHaveLength(7);
    expect(new Set(GUIDE_REGISTRY.map((guide) => guide.id)).size).toBe(7);
    expect(new Set(GUIDE_REGISTRY.map((guide) => guide.route)).size).toBe(7);
    expect(GUIDE_REGISTRY.every((guide) => guide.stepCount > 0)).toBe(true);
  });

  it("routes Ontario levels to the correct stream-specific practice course", () => {
    expect(getPracticePath("water-treatment", "ontario", "oit")).toBe("/quiz");
    expect(getPracticePath("wastewater-treatment", "ontario", "oit")).toBe("/oit-ww");
    expect(getPracticePath("water-treatment", "ontario", "3")).toBe("/class3-water");
    expect(getPracticePath("wastewater-treatment", "ontario", "2")).toBe("/class2-ww");
    expect(getPracticePath("water-distribution", "ontario", "4")).toBe("/class4-water-dist");
    expect(getPracticePath("wastewater-collection", "ontario", "1")).toBe("/class1-wastewater-coll");
  });

  it("routes WPI levels to the correct stream-specific practice course", () => {
    expect(getPracticePath("water-treatment", "wpi", "1")).toBe("/wpi-class1-water");
    expect(getPracticePath("wastewater-treatment", "wpi", "2")).toBe("/wpi-class2-wastewater");
    expect(getPracticePath("water-distribution", "wpi", "3")).toBe("/wpi-class3-water-dist");
    expect(getPracticePath("wastewater-collection", "wpi", "4")).toBe("/wpi-class4-water-coll");
  });

  it("normalizes an old OIT preference to Class I when the learner switches to WPI", () => {
    expect(getPracticePath("water-treatment", "wpi", "oit")).toBe("/wpi-class1-water");
  });

  it("builds a topic-filtered practice handoff for supported process steps", () => {
    expect(getPracticeHref("drinking-water", "coagulation", "ontario", "1"))
      .toBe("/class1-water?topic=Coagulation%20%26%20Flocculation&source=process-guides");
    expect(getPracticeHref("wastewater-collection", "liftstation", "wpi", "2"))
      .toBe("/wpi-class2-water-coll?topic=Equipment%20Operation%20%26%20Maintenance&source=process-guides");
  });

  it("still opens the correct course when a bank has no verified topic mapping", () => {
    expect(getPracticeHref("water-distribution", "storage", "ontario", "2"))
      .toBe("/class2-water-dist?source=process-guides");
  });
});
