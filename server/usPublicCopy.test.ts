import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COURSE_SEO_PAGES, formatCad } from "../shared/seoCatalog";
import { US_STATE_NAMES } from "../shared/usStateNames";
import { injectSeoIntoTemplate, STATIC_PAGE_META } from "./pageSsr";

const SITE_URL = "https://echeloninstitute.ca";
const US_INDEX_PATHS = ["/us", "/us/courses", "/us/states"] as const;
const landing = readFileSync(resolve(process.cwd(), "client/src/pages/USLanding.tsx"), "utf8");
const template = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

function pageFor(path: (typeof US_INDEX_PATHS)[number]) {
  const page = STATIC_PAGE_META.find(candidate => candidate.path === path);
  if (!page?.bodyHtml) throw new Error(`No US SSR body for ${path}`);
  return page;
}

const unsupportedClaims = [
  /45\s+(?:US\s+)?states/i,
  /85\s*%/,
  /(?:pass[^.\n]*first try|on the first try)/i,
  /full,?\s+partial,?\s+or\s+limited/i,
  /(?:every question maps|all content is aligned)/i,
  /2025/,
  /400\s*\+/,
  /(?:first\s+15\s+questions|every course[^.\n]*15\s+free)/i,
  /100[-\s]question|100 multiple-choice|70\s*%|10[–-]16\s*%/i,
  /(?:matching|matches)\s+the\s+exact/i,
  /all[- ]access/i,
];

describe("US public index copy", () => {
  it.each(US_INDEX_PATHS)("keeps %s metadata and crawler body free of unsupported claims", path => {
    const page = pageFor(path);
    const copy = [page.title, page.description, page.h1, page.bodyHtml, page.jsonLd].join("\n");
    for (const claim of unsupportedClaims) expect(copy, `${path}: ${claim}`).not.toMatch(claim);
    expect(copy).not.toContain("—");
  });

  it.each(US_INDEX_PATHS)("states shared scope, state authority rules, independence, and preview details on %s", path => {
    const body = pageFor(path).bodyHtml!;
    expect(body).toMatch(/shared WPI/i);
    // Dedicated US Class I courses are live, so the honest limit is now scope, not absence:
    // standardized exam content never stands in for a state's own regulations.
    expect(body).toMatch(/standardized exam content|state-specific (?:regulations|study material)/i);
    expect(body).toContain("Class I to IV");
    expect(body).toContain("free preview");
    expect(body).toMatch(/authority controls eligibility, exam content, permitted references/i);
    expect(body).toContain("current documents control");
    expect(body).toMatch(/independent/i);
    expect(body).toContain("not affiliated with or endorsed by ABC, WPI, or any state certifying authority");
    expect(body).toContain("CAD");
  });

  it("links every state from the shared identity list exactly once without coverage labels", () => {
    const body = pageFor("/us/states").bodyHtml!;
    expect(US_STATE_NAMES).toHaveLength(50);
    const linkedSlugs = [...body.matchAll(/href="https:\/\/echeloninstitute\.ca\/us\/states\/([a-z-]+)"/g)]
      .map(match => match[1]);
    expect(linkedSlugs).toEqual(US_STATE_NAMES.map(state => state.slug));
    for (const state of US_STATE_NAMES) {
      expect(body).toContain(`href="${SITE_URL}/us/states/${state.slug}">${state.name}</a>`);
    }
    expect(body).not.toMatch(/States Not Covered|Midwest States|Northeast States|Southern States|Western States/);
    expect(body).toContain("A listing does not mean every stream or level uses WPI exams");
  });

  it("renders all shared WPI course links and prices directly from the public catalogue", () => {
    const body = pageFor("/us/courses").bodyHtml!;
    const sharedCourses = COURSE_SEO_PAGES.filter(course => course.regionPath === "/wpi");
    expect(sharedCourses).toHaveLength(16);
    const linkedCourses = [...body.matchAll(/href="https:\/\/echeloninstitute\.ca(\/wpi-[^"?]+)\?country=US"/g)]
      .map(match => match[1]);
    expect(linkedCourses).toEqual(sharedCourses.map(course => course.quizPath));
    for (const course of sharedCourses) {
      expect(body).toContain(`href="${SITE_URL}${course.quizPath}?country=US"`);
      expect(body).toContain(formatCad(course.priceCAD));
    }
    expect(body).toContain("one named learner and one selected course");
    expect(body).toContain("12 months of access from successful payment");
    expect(body).toContain("Prices are in Canadian dollars (CAD)");
  });

  it("renders the dedicated US Class I courses with their own links and prices", () => {
    const body = pageFor("/us/courses").bodyHtml!;
    const usCourses = COURSE_SEO_PAGES.filter(course => course.regionPath === "/us");
    expect(usCourses).toHaveLength(2);
    for (const course of usCourses) {
      expect(body).toContain(`href="${SITE_URL}${course.quizPath}">${course.displayName}</a>`);
      expect(body).toContain(formatCad(course.priceCAD));
    }
    expect(body).toContain("WPI Class 1 Need-to-Know Criteria in US customary units");
  });

  it("directs overview readers to state matching before the shared catalogue", () => {
    const body = pageFor("/us").bodyHtml!;
    const stateLink = body.indexOf(`href="${SITE_URL}/us/states"`);
    const courseLink = body.indexOf(`href="${SITE_URL}/us/courses"`);
    expect(stateLink).toBeGreaterThanOrEqual(0);
    expect(courseLink).toBeGreaterThan(stateLink);
    expect(body).toContain("one named learner, one selected course");
    expect(body).toContain("12 months of access from successful payment");
  });

  it.each(US_INDEX_PATHS)("injects a single canonical, honest heading, and body for %s", path => {
    const page = pageFor(path);
    const html = injectSeoIntoTemplate(template, page);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain(`href="${SITE_URL}${path}"`);
    expect(html).toContain(`<h1>${page.h1}</h1>`);
    expect(html).toContain(page.bodyHtml!);
    expect(html).not.toMatch(/45\s+(?:US\s+)?states|85\s*%|on the first try/i);
  });
});

describe("US landing copy and original presentation", () => {
  it("removes blanket alignment and outcome claims without removing actual study tools", () => {
    for (const claim of unsupportedClaims) expect(landing, `${claim}`).not.toMatch(claim);
    for (const feature of ["Topic-Based Practice", "AI Tutor Study Support", "Timed Mock Exams", "Flashcard Review Mode", "Formula Reference Sheets", "Progress Dashboard"]) {
      expect(landing).toContain(feature);
    }
    expect(landing).toContain("Practice scores are not a guarantee of an exam result");
    // Scope limit stays: standardized content never replaces a state's own regulations.
    expect(landing).toContain("not any single state's own regulations");
    expect(landing).toMatch(/not affiliated with or endorsed by ABC, WPI, or any state certifying authority/i);
  });

  it("uses shared state identities rather than legacy coverage or exam-adoption flags", () => {
    expect(landing).toContain('import { US_STATE_NAMES } from "../../../shared/usStateNames"');
    expect(landing).toContain("US_STATE_NAMES.filter");
    expect(landing).toContain('href={`/us/states/${state.slug}`}');
    expect(landing).not.toMatch(/stateConfig|US_STATE_CONFIGS|usesWPI|coverageLevel|FULL_COVERAGE|PARTIAL_COVERAGE/);
  });

  it("replaces workforce totals with study scope and keeps state-first primary links", () => {
    for (const value of ["4 Streams", "Class I-IV", "398 Questions", "State Rules"]) {
      expect(landing).toContain(`value="${value}"`);
    }
    expect(landing).not.toMatch(/132400|10700|58,260|US Operators Employed|Annual Job Openings|Median Annual Salary/);
    const primaryLinks = [...landing.matchAll(/<Link href="([^"]+)" className="btn-pulse"/g)].map(match => match[1]);
    expect(primaryLinks).toEqual(["/us/states", "/us/states"]);
    expect(landing).toContain('href="/us/courses"');
    expect(landing).toContain("one selected course from successful payment");
    expect(landing).toContain("Canadian dollars (CAD)");
    expect(landing).toContain('href="/pricing?country=US"');
    expect(landing).not.toContain('href="/pricing"');
  });

  it("preserves the current logo, Sora type, dark rounded blue-teal design, and unnested link controls", () => {
    expect(landing).toContain("echelon-icon-v2_5c9ed3a7.webp");
    expect(landing).toContain("Sora, sans-serif");
    expect(landing).toContain('background: "#0F172A"');
    expect(landing).toContain("linear-gradient(135deg, #2563EB, #0E7490)");
    expect(landing).toContain("borderRadius: 12");
    expect(landing).toContain("borderRadius: 16");
    expect(landing).not.toMatch(/<(?:Link|a)\b[^>]*>\s*<button\b/s);
  });
});
