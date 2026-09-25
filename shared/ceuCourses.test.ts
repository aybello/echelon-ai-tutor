import { describe, expect, it } from "vitest";
import { CEU_COURSES, plannedCourseMinutes } from "./ceuCourses";
describe("CEU public catalogue", () => {
  it("has ten courses and interest codes that fit the existing waitlist field", () => {
    expect(CEU_COURSES).toHaveLength(10);
    expect(new Set(CEU_COURSES.map(c => c.interestCode)).size).toBe(10);
    for (const c of CEU_COURSES) {
      expect(c.interestCode.length).toBeLessThanOrEqual(32);
      expect(plannedCourseMinutes(c)).toBe(c.plannedContactHours * 60);
    }
  });
  it("keeps planned duration distinct from approval and earned credit", () => {
    for (const c of CEU_COURSES) {
      expect(c.publicDisclosure).toContain("No approved CEUs");
      expect(c.completionRequirements.join(" ")).toContain("timed pilot");
      if (c.plannedContactHours === 10)
        expect(c.publicDisclosure).toContain(
          "Self-paced study is spread across at least two dates"
        );
      if (c.stream === "wastewater") {
        expect(c.approvalStatus).toBe("ceu_value_review_required");
        expect(c.publicDisclosure).toContain("not Director approved");
      }
    }
  });
});
