import { describe, expect, it } from "vitest";
import { ceuCourse, ceuCurricula } from "../server/ceu/catalogue";
import { ceuModuleSlideCount, ceuModuleSlides } from "./ceuSlides";

describe("CEU module slide decks", () => {
  it("creates stable, readable learning paths for every course module", () => {
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
        const concepts = slides.filter(slide => slide.kind === "lesson");

        // A deep lesson must become several focused teaching slides.
        expect(concepts.length).toBeGreaterThanOrEqual(4);
        expect(slides).toHaveLength(concepts.length + 4);
        expect(ceuModuleSlideCount(module)).toBe(slides.length);

        expect(slides[0].id).toBe(`${module.id}:overview`);
        expect(concepts.map(slide => slide.id)).toEqual(
          concepts.map((_, index) => `${module.id}:concept-${index + 1}`)
        );
        expect(slides.map(slide => slide.id)).toEqual([
          `${module.id}:overview`,
          ...concepts.map((_, index) => `${module.id}:concept-${index + 1}`),
          `${module.id}:evidence`,
          `${module.id}:quick-check`,
          `${module.id}:takeaways`,
        ]);

        expect(slides.at(-1)?.kind).toBe("takeaways");
        expect(slides.some(slide => slide.kind === "quick_check")).toBe(true);
        expect(slides.map(slide => slide.body).join("\n")).toContain(
          module.objectives[0]
        );

        for (const slide of slides) {
          expect(slide.title.trim().length).toBeGreaterThan(0);
          expect(slide.body.trim().length).toBeGreaterThan(0);
        }
        // No single teaching slide should become an unreadable wall of text.
        for (const slide of concepts)
          expect(slide.body.split(/\s+/).length).toBeLessThanOrEqual(520);
        expect(concepts.every(slide => slide.eyebrow.startsWith("Lesson step"))).toBe(true);
      }
    }
  });

  it("keeps deck ids unique and never leaks marking material", () => {
    for (const course of ceuCurricula) {
      for (const module of course.modules) {
        const slides = ceuModuleSlides(module);
        const ids = slides.map(slide => slide.id);
        expect(new Set(ids).size).toBe(ids.length);
        const text = JSON.stringify(slides);
        expect(text).not.toContain(module.facilitatorGuide.slice(0, 40));
        for (const check of module.checks)
          expect(text).not.toContain(check.explanation);
      }
    }
  });

  it("formats the compliance role lesson as skimmable operator guidance", () => {
    const module = ceuCourse("ceu-drinking-water-compliance")!.modules[0]!;
    const slide = ceuModuleSlides(module).find(
      item => item.title === "Match the task to a documented role"
    );

    expect(slide).toBeDefined();
    expect(slide?.body).toContain("## The rule");
    expect(slide?.body).toContain("## Follow this sequence");
    expect(slide?.body).toContain("## Do not use these as proof");
    expect(slide?.body).toContain("## What to record at handover");
    expect(slide?.body).toContain("1. **Name the task.**");
    expect(slide?.body).toContain("- **Supervisor title:**");
  });
});
