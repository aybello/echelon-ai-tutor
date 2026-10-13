import { describe, expect, it } from "vitest";
import { FINDER_PROVINCES, getFinderCourses, getFinderTrackLabel } from "./courseFinder";

describe("Nova Scotia course finder", () => {
  it("offers Nova Scotia and only the published treatment and network class ranges", () => {
    expect(FINDER_PROVINCES).toContainEqual({ id: "ns", label: "Nova Scotia" });
    for (const track of ["water-treatment", "wastewater-treatment"]) {
      const courses = getFinderCourses("ns", track);
      expect(courses.map(course => course.classLevel)).toEqual([1, 2, 3, 4]);
      expect(courses.every(course => course.examFamily === "western")).toBe(true);
    }
    for (const track of ["water-distribution", "wastewater-collection"]) {
      expect(getFinderCourses("ns", track).map(course => course.classLevel)).toEqual([1, 2, 3]);
      expect(getFinderCourses("bc", track).map(course => course.classLevel)).toEqual([1, 2, 3, 4]);
    }
  });
  it("does not repurpose Ontario OIT, WQA or electrician preparation", () => {
    for (const track of ["oit", "water-quality", "construction-electrician", "unknown"]) {
      expect(getFinderCourses("ns", track)).toEqual([]);
    }
    expect(getFinderCourses("on", "water-treatment")[0].courseKey).toBe("oit");
    expect(getFinderTrackLabel("ns", "water-distribution")).toBe("Water distribution");
    expect(getFinderTrackLabel("on", "water-distribution")).toBe("Water distribution and supply");
    expect(getFinderCourses("unknown", "water-treatment")).toEqual([]);
  });
});
