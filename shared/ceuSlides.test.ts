import { describe, expect, it } from "vitest";
import { ceuCourse } from "../server/ceu/catalogue";
import { ceuModuleSlideCount, ceuModuleSlides } from "./ceuSlides";

describe("CEU module slide decks", () => {
  it("creates stable, concise learning paths for every course module", () => {
    for (const course of [
      "ceu-activated-sludge-troubleshooting",
      "ceu-coagulation-filtration",
      "ceu-collection-wet-weather",
      "ceu-disinfection-ct",
      "ceu-distribution-water-quality",
      "ceu-drinking-water-compliance",
      "ceu-instrumentation-scada",
      "ceu-sampling-data-quality",
      "ceu-wastewater-treatment-process-control",
      "ceu-water-treatment-process-control",
    ]) {
      for (const module of ceuCourse(course)!.modules) {
        const slides = ceuModuleSlides(module);
        expect(slides).toHaveLength(7);
        expect(slides.map(slide => slide.id)).toEqual([
          `${module.id}:overview`,
          `${module.id}:concept-1`,
          `${module.id}:concept-2`,
          `${module.id}:concept-3`,
          `${module.id}:evidence`,
          `${module.id}:quick-check`,
          `${module.id}:takeaways`,
        ]);
        expect(ceuModuleSlideCount(module)).toBe(slides.length);
        expect(slides.at(-1)?.kind).toBe("takeaways");
        expect(slides.some(slide => slide.kind === "quick_check")).toBe(true);
        expect(slides.map(slide => slide.body).join("\n")).toContain(module.objectives[0]);
      }
    }
  });
});
