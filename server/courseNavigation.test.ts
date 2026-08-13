import { describe, expect, it } from "vitest";
import { getCourseForPath, getCourseWorkspaceTabs } from "../client/src/lib/courseNavigation";
import { getAllCourses } from "../shared/courseRegistry";
import { readFileSync } from "node:fs";

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
        expect(routedPaths.has(path), `${course.courseKey} → ${tab.label} (${path})`).toBe(true);
      }
    }
  });
});
