import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("approved blue homepage presentation", () => {
  it("keeps the existing course finder and free preview interactive", () => {
    const landing = read("client/src/pages/Landing.tsx");
    expect(landing).toContain('href="#find-course"');
    expect(landing).toContain('aria-controls="oit-preview-choice"');
    expect(landing).toContain("setShowOitPreviewChoice");
    expect(landing).toContain('<CourseFinder initialProvince={province} onCourseSelected={recordCourseBrowse} />');
    expect(landing).toContain("<ProvinceBanner onSelect={handleProvinceSelect} onDismiss={dismiss} />");
  });

  it("uses a product-led worked example and the approved blue rather than mint branding", () => {
    const landing = read("client/src/pages/Landing.tsx");
    const hero = read("client/src/components/CoursePathHero.tsx");
    const css = read("client/src/pages/Landing.css");
    expect(landing).toContain('<StudyWorkspacePreview />');
    expect(landing).toContain('aria-label="Example worked solution from the study tools"');
    expect(landing).toContain('className="homepage-preview-badge">Example');
    expect(landing).toContain("Worked calculation · Water Class I");
    expect(landing).toContain("A plant treats 25 L/s. What is the daily flow in m³/d?");
    expect(landing).toContain("Answer: 2,160 m³/d");
    expect(landing).toContain("<StepSolution");
    expect(landing).toContain('href="/formulas" className="homepage-example-link"');
    expect(landing).not.toContain("echelon-blue-hero_b6e705fa.webp");
    expect(hero).toContain("Be ready for");
    expect(hero).toContain("Practice questions, worked calculations and timed mock exams");
    expect(css).toContain("--home-teal: #1757B8");
    expect(css).toContain("--home-canvas: #F4F8FD");
    expect(css).toMatch(/@media \(max-width: 820px\)\s*\{(?:(?!\n\})[\s\S])*?\.homepage-hero\s*\{[^}]*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/@media \(max-width: 820px\)\s*\{(?:(?!\n\})[\s\S])*?\.homepage-hero-visual \.homepage-workspace-logo\s*\{[^}]*aspect-ratio:\s*auto/);
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{(?:(?!\n\})[\s\S])*?\.homepage-workspace-body\s*\{[^}]*padding:/);
  });
});
