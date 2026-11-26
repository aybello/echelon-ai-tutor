import { describe, expect, it } from "vitest";
import { ceuCurricula } from "../server/ceu/catalogue";
import { ceuDiagramFor, ceuDiagramSlideId } from "./ceuDiagrams";
import { ceuModuleSlides } from "./ceuSlides";

describe("CEU learning diagrams", () => {
  it("covers every published CEU module with a stable five-step visual path", () => {
    const seen = new Set<string>();
    for (const course of ceuCurricula) {
      for (const module of course.modules) {
        const diagram = ceuDiagramFor(module);
        expect(diagram.title.length).toBeGreaterThan(0);
        expect(diagram.caption.length).toBeGreaterThan(0);
        expect(diagram.steps).toHaveLength(5);
        expect(diagram.steps.every(step => step.trim().length > 0)).toBe(true);
        const slides = ceuModuleSlides(module);
        const targetId = ceuDiagramSlideId(module, slides);
        expect(slides.filter(slide => slide.id === targetId && slide.kind === "lesson")).toHaveLength(1);
        expect(seen.has(module.id)).toBe(false);
        seen.add(module.id);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(60);
  });

  it("keeps core course families visually distinct", () => {
    const find = (courseKey: string, moduleId: string) =>
      ceuDiagramFor(ceuCurricula.find(course => course.key === courseKey)!.modules.find(module => module.id === moduleId)!);

    expect(find("ceu-water-treatment-concepts", "source-and-train").family).toBe("treatment");
    expect(find("ceu-wastewater-treatment-concepts", "activated-sludge-basics").family).toBe("treatment");
    expect(find("ceu-basic-math", "plant-formulas").family).toBe("calculation");
    expect(find("ceu-basic-safety", "confined-atmosphere").family).toBe("safety");
    expect(find("ceu-supervisor-essentials", "responsibility-accountability").family).toBe("leadership");
    expect(find("ceu-instrumentation-scada", "signal-scaling").family).toBe("evidence");
  });
});
