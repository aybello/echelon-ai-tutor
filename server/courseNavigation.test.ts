import { describe, expect, it } from "vitest";
import { getCourseForPath, getCourseWorkspaceTabs, getMobileWorkspaceTabs } from "../client/src/lib/courseNavigation";
import { getAllCourses } from "../shared/courseRegistry";
import { readFileSync } from "node:fs";

// App.tsx registers both literal routes and whole-segment :courseKey routes.
// Match the entire path: a dynamic segment cannot consume a slash or be empty.
function matchesRegisteredPath(pattern: string, path: string): boolean {
  const patternSegments = pattern.split("/");
  const segments = path.split("/");
  return patternSegments.length === segments.length && patternSegments.every((segment, index) =>
    /^:[A-Za-z][A-Za-z0-9_]*$/.test(segment) ? segments[index].length > 0 : segment === segments[index],
  );
}

describe("course workspace navigation", () => {
  it("keeps Ontario course tools in one canonical workspace", () => {
    const course = getCourseForPath("/class2-water-mock");
    expect(course?.courseKey).toBe("class2-water");
    expect(getCourseForPath("/class2-water-flashcards")?.courseKey).toBe("class2-water");
    expect(getCourseForPath("/formulas-water2")?.courseKey).toBe("class2-water");

    const tabs = getCourseWorkspaceTabs(course!);
    expect(tabs.map((tab) => tab.kind)).toEqual([
      "practice", "mock", "flashcards", "notes", "formulas", "tutor", "progress",
    ]);
    expect(tabs.find((tab) => tab.kind === "progress")?.href).toBe("/dashboard?course=class2-water");

    const mobileTabs = getMobileWorkspaceTabs(tabs);
    expect(mobileTabs.primaryTabs.map((tab) => tab.kind)).toEqual(["practice", "mock", "flashcards"]);
    expect(mobileTabs.secondaryTabs.map((tab) => tab.kind)).toEqual(["notes", "formulas", "tutor", "progress"]);
  });

  it("resolves WPI distribution routes without colliding with water treatment", () => {
    expect(getCourseForPath("/wpi-class3-water-dist")?.courseKey).toBe("wpi-class3-water-dist");
    expect(getCourseForPath("/wpi-class3-water-dist-mock")?.courseKey).toBe("wpi-class3-water-dist");
    expect(getCourseForPath("/wpi-class3-water")?.courseKey).toBe("wpi-class3-water");
  });

  it("does not show a course workspace on marketing and dashboard routes", () => {
    expect(getCourseForPath("/pricing")).toBeUndefined();
    expect(getCourseForPath("/dashboard")).toBeUndefined();
    expect(getCourseForPath("/guides")).toBeUndefined();
  });

  it("only publishes workspace links that exist in the application router", () => {
    const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    const routedPaths = new Set(
      [...appSource.matchAll(/<Route path=\{["']([^"']+)["']\}/g)].map((match) => match[1]),
    );
    routedPaths.add("/dashboard");

    for (const course of getAllCourses().filter((entry) => entry.isActive)) {
      for (const tab of getCourseWorkspaceTabs(course)) {
        const path = tab.href.split("?")[0];
        expect([...routedPaths].some(pattern => matchesRegisteredPath(pattern, path)), `${course.courseKey} → ${tab.label} (${path})`).toBe(true);
      }
    }
  });

  it("matches only complete registered paths, including parameterized US study routes", () => {
    for (const tool of ["practice", "mock", "flashcards"]) {
      const pattern = `/us/${tool}/:courseKey`;
      expect(matchesRegisteredPath(pattern, `/us/${tool}/pa-class-e-water-distribution`)).toBe(true);
      expect(matchesRegisteredPath(pattern, `/us/${tool}/`)).toBe(false);
      expect(matchesRegisteredPath(pattern, `/us/${tool}/course/extra`)).toBe(false);
      expect(matchesRegisteredPath(pattern, `/us/not-${tool}/course`)).toBe(false);
    }
    expect(matchesRegisteredPath("/class2-water", "/class2-water-missing")).toBe(false);
    expect(matchesRegisteredPath("/dashboard", "/dashboard")).toBe(true);
  });

  it("uses the compact mobile course-tools menu in the shared navigation", () => {
    const navSource = readFileSync(new URL("../client/src/components/SiteNav.tsx", import.meta.url), "utf8");
    expect(navSource).toContain("getMobileWorkspaceTabs");
    expect(navSource).toContain("More study tools");
  });
});
