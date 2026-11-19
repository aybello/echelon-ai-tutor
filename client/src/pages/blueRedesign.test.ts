import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
describe("approved blue homepage presentation", () => {
  it("keeps course matching and contextual free preview interactive", () => {
    const landing = read("client/src/pages/Landing.tsx");
    expect(landing).toContain('href="#find-course"');
    expect(landing).toContain('aria-controls="oit-preview-choice"');
    expect(landing).toContain("setShowOitPreviewChoice");
    expect(landing).toContain('<HomepageCourseDiscovery initialProvince={province} onProvinceSelected={handleProvinceSelect} onCourseSelected={recordCourseBrowse} />');
    expect(landing).not.toContain("<ProvinceBanner");
  });
  it("uses a real interactive example and preserves the approved blue and mobile layout", () => {
    const landing = read("client/src/pages/Landing.tsx");
    const hero = read("client/src/components/CoursePathHero.tsx");
    const css = read("client/src/pages/Landing.css");
    const demo = read("client/src/components/HomepageProductDemo.tsx");
    expect(landing).toContain('<HomepageProductDemo />');
    expect(demo).toContain("StepSolution");
    expect(demo).toContain("25 L/s");
    expect(demo).toContain("86.4");
    expect(landing).not.toContain("echelon-blue-hero_b6e705fa.webp");
    expect(hero).toContain("Learn the material.");
    expect(hero).toContain("AI-powered exam prep, interactive learning and continuing education");
    expect(css).toContain("--home-teal: #1757B8");
    expect(css).toContain("--home-canvas: #F4F8FD");
    expect(css).toMatch(/@media \(max-width: 820px\)\s*\{(?:(?!\n\})[\s\S])*?\.homepage-hero\s*\{[^}]*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{(?:(?!\n\})[\s\S])*?\.homepage-hero\s*\{[^}]*padding:/);
  });
});
