import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
describe("premium homepage contracts", () => {
  const landing = read("client/src/pages/Landing.tsx");
  const css = read("client/src/pages/Landing.css");
  it("shows all three pillars without overstating current trade coverage", () => {
    const hero = read("client/src/components/CoursePathHero.tsx");
    expect(hero).toContain("AI-powered exam prep for skilled trades");
    expect(hero).toContain("AI-powered exam prep, interactive learning and continuing education");
    expect(hero).toContain("water and wastewater courses in Canada and the United States");
    expect(hero).toContain("Learn the material.");
    expect(hero).toContain("Build skills that last.");
    expect(landing).not.toContain("guaranteed pass");
  });
  it("puts course discovery ahead of feature explanations and keeps its attribution", () => {
    expect(landing.indexOf('id="courses"')).toBeLessThan(landing.indexOf('id="tools"'));
    expect(landing).toContain('<HomepageCourseDiscovery initialProvince={province} onCourseSelected={recordCourseBrowse} />');
    expect(landing).toContain('event: "course_browsed"');
    expect(landing).toContain('getMarketingAttribution("/")');
    expect(landing).not.toContain("<ProvinceBanner");
    expect(landing).not.toContain('className="homepage-proof-strip"');
  });
  it("groups preparation into meaningful stages with accurate game scope", () => {
    for (const phrase of ["More than a question bank", "01 / Understand", "02 / Practise by doing", "03 / Rehearse the exam", "AI tutor follow-up questions", "Interactive learning games", "progress tracking", "individual assessment sessions, results and topic gaps"]) expect(landing).toContain(phrase);
    expect(landing).toContain("Water OIT and Ontario Class 1 Water also include five deeper games");
    expect(landing).toContain("Ontario 309A offers free practice and mock exams, not interactive games");
    expect(landing).toContain('href="/courses/oit/interactive"');
    expect(landing).toContain('className="homepage-learning-stages"');
  });
  it("gives continuing education its own catalogue section and non-credit disclosure", () => {
    expect(landing).toContain('id="continuing-education"');
    expect(landing).toContain("{CEU_COURSES.length} self-paced operator courses");
    expect(landing).toContain("Browse {CEU_COURSES.length} courses");
    expect(landing).toContain("Available now as non-credit pilot courses");
    expect(landing).toContain("No approved CEUs, accreditation or regulatory recognition are awarded");
    expect(landing).toContain('href={`/continuing-education/${course.key}`}');
    for (const key of ["ceu-basic-hydraulics", "ceu-chlorination-principles", "ceu-supervisor-essentials"]) expect(landing).toContain(key);
  });
  it("keeps preview allowances contextual and employer contact separate", () => {
    expect(landing).toContain('href="#find-course"');
    expect(landing).toContain('href="/teams" className="homepage-secondary-button"');
    expect(landing).toContain('aria-controls="oit-preview-choice"');
    expect(landing).toContain('href="/quiz" className="homepage-preview-path"');
    expect(landing).toContain('href="/oit-ww" className="homepage-preview-path"');
    expect(landing).toContain("50 flashcards, 30 mock questions and 3 AI Tutor messages");
    expect(landing).toContain("Employer%20training%20enquiry");
    const employer = landing.split('<section id="teams"')[1].split("</section>")[0];
    expect(employer).not.toMatch(/href="\/(?:pricing|quiz|oit-ww)"/);
    expect(employer).toContain("Illustrative preview");
  });
  it("keeps one canonical customer strip and useful existing sections", () => {
    expect(landing.match(/<TrustedOrganizations \/>/g)).toHaveLength(1);
    expect(landing).not.toContain('className="homepage-customer-proof"');
    for (const text of ['id="courses"', 'id="tools"', 'id="teams"', 'id="faq"', "<BlogPreviewSection />", "<ContactSection />", "<HomepageProductDemo />"]) expect(landing).toContain(text);
    expect(css).toContain(".homepage-learning-stages");
    expect(css).toContain("@media (max-width: 640px)");
  });
});
