import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("premium homepage contracts", () => {
  const landing = read("client/src/pages/Landing.tsx");
  const css = read("client/src/pages/Landing.css");

  it("positions the platform for skilled trades without overstating course coverage", () => {
    const hero = read("client/src/components/CoursePathHero.tsx");
    const nav = read("client/src/components/SiteNav.tsx");
    expect(hero).toContain("AI-powered exam prep for skilled trades");
    expect(nav).toContain("AI-powered exam prep for skilled trades");
    expect(hero).toContain("water and wastewater certification across Canada and the United States");
    expect(nav).not.toContain('"Operator certification prep"');
  });

  it("uses the shared worked solution with an example from the formula library", () => {
    const formulas = read("client/src/pages/FormulasWater1.tsx");
    expect(landing).toContain("<StepSolution");
    expect(landing).toContain("A plant treats 25 L/s. What is the daily flow in m³/d?");
    expect(formulas).toContain("A plant treats 25 L/s. What is the daily flow in m³/d?");
    expect(landing).toContain("2,160 m³/d");
    expect(landing).toContain('className="homepage-preview-badge">Example');
    expect(landing).not.toContain("echelon-blue-hero_b6e705fa.webp");
  });

  it("keeps course, team and OIT preview paths distinct", () => {
    expect(landing).toContain('href="#find-course"');
    expect(landing).toContain('href="/teams" className="homepage-secondary-button"');
    expect(landing).toContain('aria-controls="oit-preview-choice"');
    expect(landing).toContain('href="/quiz" className="homepage-preview-path"');
    expect(landing).toContain('href="/oit-ww" className="homepage-preview-path"');
    expect(landing).toContain("For new learners, the free OIT preview");
    expect(landing).toContain("50 flashcards, 30 mock questions and 3 AI Tutor messages");
  });

  it("preserves named proof and all existing homepage sections", () => {
    for (const text of ["Used by operators at", "Utilities Kingston", "City of Winnipeg", 'id="courses"', 'id="tools"', 'id="teams"', 'id="faq"', "<BlogPreviewSection />", "<ContactSection />"]) {
      expect(landing).toContain(text);
    }
    expect(css).toContain(".homepage-workspace .practice-solution");
    expect(css).toContain("@media (max-width: 640px)");
  });
});
