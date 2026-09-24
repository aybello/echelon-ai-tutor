import { describe, expect, it } from "vitest";
import { CEU_COURSES, plannedCourseMinutes } from "./ceuCourses";

describe("CEU course catalogue", () => {
  it("keeps exactly three approval-ready courses", () => {
    expect(CEU_COURSES).toHaveLength(3);
    expect(CEU_COURSES.map((course) => course.key)).toEqual([
      "ceu-drinking-water-compliance",
      "ceu-water-treatment-process-control",
      "ceu-wastewater-treatment-process-control",
    ]);
  });

  it("keeps every course within Ontario's planned one-day contact-hour ceiling", () => {
    for (const course of CEU_COURSES) {
      expect(course.plannedContactHours).toBe(7);
      expect(plannedCourseMinutes(course)).toBe(420);
      expect(course.modules).toHaveLength(6);
    }
  });

  it("does not make an unapproved CEU or accreditation claim", () => {
    for (const course of CEU_COURSES) {
      const publicCopy = `${course.statusDescription} ${course.publicDisclosure}`.toLowerCase();
      expect(publicCopy).toContain("required");
      expect(publicCopy).toContain("not");
      expect(publicCopy).not.toContain("director approved continuing education");
    }
  });

  it("keeps wastewater courses out of the Director-approved route", () => {
    const wastewaterCourse = CEU_COURSES.find((course) => course.stream === "wastewater");
    expect(wastewaterCourse?.approvalStatus).toBe("ceu_value_review_required");
    expect(wastewaterCourse?.publicDisclosure).toContain("not Director approved");
  });
});
