/**
 * Guarantees that every publicly linked study-utility route (mock exams,
 * flashcards, formula sheets, hub pages) has SSR metadata so crawlers never
 * see the empty homepage template again.
 */
import { describe, expect, it } from "vitest";
import { getAllCourses } from "../shared/courseRegistry";
import { STATIC_PAGE_META } from "./pageSsr";
import { getStudyUtilityPageMeta } from "./studyUtilityPageMeta";

describe("study-utility SSR page metadata", () => {
  const utility = getStudyUtilityPageMeta();
  const pathsInStatic = new Set(STATIC_PAGE_META.map(m => m.path));

  it("returns at least one page per active course path (mock, flashcards, formulas)", () => {
    const activeCourses = getAllCourses().filter(
      c => c.isActive && c.courseKey !== "electrician-309a"
    );
    for (const course of activeCourses) {
      expect(pathsInStatic.has(course.mockExamPath)).toBe(true);
      if (course.flashcardPath) {
        expect(pathsInStatic.has(course.flashcardPath)).toBe(true);
      }
      if (course.formulaPath) {
        expect(pathsInStatic.has(course.formulaPath)).toBe(true);
      }
    }
  });

  it("emits unique per-page titles, descriptions, and H1s", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const h1s = new Set<string>();
    for (const page of utility) {
      expect(page.title).toMatch(/Echelon Institute/);
      expect(page.description.length).toBeGreaterThan(50);
      expect(page.description.length).toBeLessThan(200);
      expect(page.h1.length).toBeGreaterThan(0);
      titles.add(page.title);
      descriptions.add(page.description);
      h1s.add(page.h1);
    }
    // Every page must be unique — no shared homepage fallback.
    expect(titles.size).toBe(utility.length);
    expect(descriptions.size).toBe(utility.length);
    expect(h1s.size).toBe(utility.length);
  });

  it("covers every standalone hub page that ranks in Google", () => {
    const requiredHubs = [
      "/formulas",
      "/math-practice",
      "/process",
      "/wastewater",
      "/distribution-guide",
      "/collection-guide",
      "/pumping",
      "/instrumentation",
      "/career",
      "/chem-calc",
      "/lab",
      "/command",
      "/partnerships",
    ];
    for (const hub of requiredHubs) {
      expect(pathsInStatic.has(hub)).toBe(true);
    }
  });

  it("gives every study-utility page a body with an H2 and an internal link", () => {
    for (const page of utility) {
      expect(page.bodyHtml).toMatch(/<h2>/);
      expect(page.bodyHtml).toMatch(/href="https:\/\/echeloninstitute\.ca/);
    }
  });

  it("has no path collisions with existing BASE_STATIC_PAGE_META entries", () => {
    // STATIC_PAGE_META spreads BASE + utility + region + course + teams.
    // Path uniqueness is our load-bearing invariant here.
    const seen = new Map<string, number>();
    for (const m of STATIC_PAGE_META) {
      seen.set(m.path, (seen.get(m.path) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
    expect(duplicates).toEqual([]);
  });
});
