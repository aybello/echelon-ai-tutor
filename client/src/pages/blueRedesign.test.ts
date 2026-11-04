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

  it("uses a descriptive photo and the approved blue rather than mint branding", () => {
    const landing = read("client/src/pages/Landing.tsx");
    const hero = read("client/src/components/CoursePathHero.tsx");
    const css = read("client/src/pages/Landing.css");
    expect(landing).toContain('alt="Skilled workers reviewing plans together in an industrial workplace"');
    expect(landing).toContain("echelon-blue-hero_b6e705fa.webp");
    expect(hero).toContain("Be ready for");
    expect(hero).toContain("Practice questions, worked calculations and timed mock exams");
    expect(css).toContain("--home-teal: #1757B8");
    expect(css).toContain("--home-canvas: #F4F8FD");
    expect(css).toMatch(/@media \(max-width: 820px\)[\s\S]*?\.homepage-hero-visual img/);
  });
});
