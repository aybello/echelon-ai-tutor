import { describe, expect, it } from "vitest";
import { getManagerLearnerCourses } from "./managerLearnerAccess";

describe("manager learner access", () => {
  it("returns canonical study courses for a manager's assigned operator seat", () => {
    const courses = getManagerLearnerCourses(" AMY@QUINTEWEST.CA ", [
      {
        email: "amy@quintewest.ca",
        status: "assigned",
        courseKeys: ["class2-water", "class2-water-dist"],
      },
    ]);

    expect(courses.map((course) => course.courseKey)).toEqual([
      "class2-water",
      "class2-water-dist",
    ]);
    expect(courses.map((course) => course.quizPath)).toEqual([
      "/class2-water",
      "/class2-water-dist",
    ]);
  });

  it("fails closed for another user, revoked seats, and unknown or non-team courses", () => {
    const members = [
      {
        email: "manager@example.test",
        status: "revoked",
        courseKey: "class1-water",
      },
      {
        email: "operator@example.test",
        status: "assigned",
        courseKeys: ["unknown-course", "electrician-309a"],
      },
    ];

    expect(getManagerLearnerCourses("manager@example.test", members)).toEqual([]);
    expect(getManagerLearnerCourses("other@example.test", members)).toEqual([]);
    expect(getManagerLearnerCourses("operator@example.test", members)).toEqual([]);
  });
});
