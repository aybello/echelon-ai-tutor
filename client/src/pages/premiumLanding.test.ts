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
    expect(nav).toContain("Exam prep for skilled trades");
    expect(hero).toContain("Understand the material.");
    expect(hero).toContain("AI-powered exam prep, interactive learning and continuing education");
    expect(hero).toContain("across Canada and the United States, starting with water and wastewater");
    expect(nav).not.toContain('"Operator certification prep"');
  });

  it("sells the learning journey and employer visibility with accurate pilot scope", () => {
    for (const benefit of ["More than a question bank", "AI tutor: get unstuck", "Interactive learning games", "Practice with explanations", "Work through the maths", "Rehearse the exam", "progress tracking", "individual assessment sessions, results and topic gaps"]) {
      expect(landing).toContain(benefit);
    }
    expect(landing).toContain("Water OIT and Ontario Class 1 Water also include five deeper games");
    expect(landing).toContain("Ontario 309A currently offers free practice and mock exams");
    expect(landing).toContain('href="/courses/oit/interactive"');
    expect(landing).toContain('title="Continuing education courses"');
    expect(landing).toContain('href="/continuing-education"');
    expect(landing).toContain("${CEU_COURSES.length} self-paced operator courses");
    expect(landing).toContain("no approved CEUs, accreditation or regulatory recognition are awarded");
    expect(landing).not.toContain("guaranteed pass");
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
    for (const text of ["Used by operators at", "customers.map((organization)", "{organization.name}", 'id="courses"', 'id="tools"', 'id="teams"', 'id="faq"', "<BlogPreviewSection />", "<ContactSection />"]) {
      expect(landing).toContain(text);
    }
    const organizations = read("client/src/lib/trustedOrganizations.json");
    expect(organizations).toContain("Utilities Kingston");
    expect(organizations).toContain("City of Winnipeg");
    expect(css).toContain(".homepage-workspace .practice-solution");
    expect(css).toContain("@media (max-width: 640px)");
  });
});
