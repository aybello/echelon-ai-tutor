import { describe, expect, it } from "vitest";
import { getManagerLearnerCourses } from "./managerLearnerAccess";

describe("manager learner access", () => {
  it("returns canonical study courses for a manager's assigned operator seat", () => {
    const courses = getManagerLearnerCourses(" AMY@EXAMPLE.TEST ", [
      {
        email: "amy@example.test",
        status: "assigned",
        courseKeys: ["class2-water", "class2-water-dist"],
      },
      {
        email: "amy@example.test",
        status: "assigned",
        courseKeys: ["class2-water"],
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

  it("resolves legacy course aliases to canonical learner routes", () => {
    const courses = getManagerLearnerCourses("manager@example.test", [
      {
        email: "manager@example.test",
        status: "assigned",
        courseKey: "class1",
      },
    ]);

    expect(courses.map((course) => course.courseKey)).toEqual(["class1-water"]);
    expect(courses[0]?.quizPath).toBe("/class1-water");
  });

  it("matches Gmail plus-addresses using the server identity rule", () => {
    const courses = getManagerLearnerCourses("manager+team@gmail.com", [
      {
        email: "manager@gmail.com",
        status: "assigned",
        courseKey: "class1-water",
      },
    ]);

    expect(courses.map((course) => course.courseKey)).toEqual(["class1-water"]);
  });

  it("fails closed when a resolved course is outside the organization allow-list", () => {
    const courses = getManagerLearnerCourses(
      "manager@example.test",
      [{ email: "manager@example.test", status: "assigned", courseKey: "class1-water" }],
      ["class2-water"],
    );

    expect(courses).toEqual([]);
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
      { email: null, status: "assigned", courseKey: "class1-water" },
    ];

    expect(getManagerLearnerCourses("manager@example.test", members)).toEqual([]);
    expect(getManagerLearnerCourses("other@example.test", members)).toEqual([]);
    expect(getManagerLearnerCourses("operator@example.test", members)).toEqual([]);
  });
});
