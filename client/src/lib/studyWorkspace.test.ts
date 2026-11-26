import { describe, expect, it } from "vitest";
import { getFinderCourses } from "./courseFinder";
import { getPracticeGuidePath } from "./practiceResources";
import { filterRosterMembers, getOperatorStudyStage } from "./managerRoster";

describe("course finder preserves the requested examination system", () => {
  it("lists only Ontario treatment courses for Ontario, including the correct OIT stream", () => {
    const water = getFinderCourses("on", "water-treatment");
    expect(water.map(course => course.courseKey)).toContain("oit");
    expect(water.every(course => course.examFamily === "ontario")).toBe(true);
    expect(water.map(course => course.courseKey)).not.toContain("oit-ww");
    expect(getFinderCourses("on", "wastewater-treatment").map(course => course.courseKey)).toContain("oit-ww");
  });
  it("takes a Manitoba collection candidate to the WPI collection course", () => {
    const courses = getFinderCourses("mb", "wastewater-collection");
    const course = courses.find(item => item.classLevel === 4);
    expect(course?.courseKey).toBe("wpi-class4-water-coll");
    expect(courses.every(item => item.examFamily === "western" && item.track === "wastewater-collection")).toBe(true);
  });
  it("does not silently substitute a province, system or WQA family", () => {
    expect(getFinderCourses("unsupported", "water-treatment")).toEqual([]);
    expect(getFinderCourses("on", "unsupported")).toEqual([]);
    expect(getFinderCourses("mb", "water-quality")).toEqual([]);
  });
});

describe("practice resource links", () => {
  it("uses the course's actual system and accepts study query strings", () => {
    expect(getPracticeGuidePath("/class1-water?mode=quick10")).toBe("/process");
    expect(getPracticeGuidePath("/class1-ww")).toBe("/wastewater");
    expect(getPracticeGuidePath("/wpi-class4-water-coll")).toBe("/collection-guide");
  });
  it("never recommends a water process guide to an electrician or unknown course", () => {
    expect(getPracticeGuidePath("/electrician-309a")).toBeNull();
    expect(getPracticeGuidePath("/unknown")).toBeNull();
  });
});

describe("manager roster", () => {
  const members = [
    { id: 1, name: "Jordan Mercer", email: "jordan@example.test", totalAttempts: 100, lastActive: "2026-10-01" },
    { id: 2, name: null, email: "lee@example.test", totalAttempts: 0, lastActive: null },
  ];
  it("does not infer invitation acceptance or study from an activity timestamp", () => {
    expect(getOperatorStudyStage({ ...members[1], lastActive: "2026-10-01" })).toBe("assigned");
    expect(getOperatorStudyStage(members[0])).toBe("studying");
  });
  it("searches name and email with the chosen stage without losing identity", () => {
    expect(filterRosterMembers(members, "  JORDAN ", "studying").map(member => member.id)).toEqual([1]);
    expect(filterRosterMembers(members, "example.test", "assigned").map(member => member.id)).toEqual([2]);
    expect(filterRosterMembers(members, "Jordan", "assigned")).toEqual([]);
    expect(members).toHaveLength(2);
  });
});
