import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getCourseInteractiveHref } from "../client/src/lib/courseNavigation";
import { classifyAppRoute } from "../shared/appRoutes";
import { getAllCourses, resolveCourseKey } from "../shared/courseRegistry";
import { isNovaScotiaCourseSurface, isNovaScotiaPathSupported } from "../shared/novaScotiaPreparation";

const app = readFileSync("client/src/App.tsx", "utf8");
const shell = readFileSync("client/src/components/QuizShell.tsx", "utf8");

describe("course-specific interactive navigation", () => {
  it("lazy-loads the specific route before the existing course landing route", () => {
    expect(app).toContain('lazy(() => import("./pages/CourseInteractiveLearning"))');
    const activity = '<Route path={"/courses/:courseKey/interactive"} component={CourseInteractiveLearning} />';
    const landing = '<Route path={"/courses/:courseKey"} component={SeoLandingPage} />';
    expect(app.indexOf(activity)).toBeGreaterThan(-1);
    expect(app.indexOf(landing)).toBeGreaterThan(app.indexOf(activity));
  });

  it("links supported active registry quizzes to their canonical course-specific routes", () => {
    for (const course of getAllCourses().filter((item) => item.isActive)) {
      const routeMatch = app.match(new RegExp(`<Route path=\\{"${course.quizPath}"\\} component=\\{(\\w+)\\} \\/>`));
      expect(routeMatch, course.quizPath).not.toBeNull();
      const component = routeMatch![1];
      const importMatch = app.match(new RegExp(`const ${component} = lazy\\(\\(\\) => import\\("\\./pages/([^"\\)]+)"\\)\\)`));
      expect(importMatch, component).not.toBeNull();
      const source = readFileSync(`client/src/pages/${importMatch![1]}.tsx`, "utf8");
      const shellProps = source.match(/<QuizShell\b([\s\S]*?)\/>/)?.[1] ?? "";
      const examType = shellProps.match(/examType="([^"]+)"/)?.[1];
      expect(examType, course.quizPath).toBeTruthy();
      expect(resolveCourseKey(examType!)?.courseKey, course.quizPath).toBe(course.courseKey);
      const href = getCourseInteractiveHref(examType, "");
      if (course.courseKey === "electrician-309a") {
        expect(href).toBeUndefined();
        continue;
      }
      expect(href).toBe(`/courses/${course.courseKey}/interactive`);
      expect(classifyAppRoute(href!).kind).toBe("public");
    }
    expect(shell).toContain("getCourseInteractiveHref(canonicalCourse?.courseKey, search)");
    expect(shell).toContain('className="practice-interactive-link">Interactive activities</Link>');
  });

  it("does not advertise interactive activities for the active electrician course", () => {
    expect(resolveCourseKey("electrician-309a")?.isActive).toBe(true);
    expect(getCourseInteractiveHref("electrician-309a", "province=ON")).toBeUndefined();
    expect(resolveCourseKey("class1-ww")?.isActive).toBe(true);
    expect(getCourseInteractiveHref("class1-ww", "province=ON"))
      .toBe("/courses/class1-ww/interactive?province=ON");
  });

  it("normalizes aliases and preserves the existing province or US study context", () => {
    expect(getCourseInteractiveHref("class1-wastewater", "province=ON&panel=notes"))
      .toBe("/courses/class1-ww/interactive?province=ON");
    expect(getCourseInteractiveHref("wpi-class2-water", "province=NS&panel=tutor"))
      .toBe("/courses/wpi-class2-water/interactive?province=NS");
    expect(getCourseInteractiveHref("wpi-class1-wastewater-coll", "province=BC&country=US&state=TX"))
      .toBe("/courses/wpi-class1-water-coll/interactive?country=US&state=TX");
    expect(getCourseInteractiveHref("us-texas-class-d-water", "country=US&state=TX"))
      .toBe("/courses/us-texas-class-d-water/interactive?country=US&state=TX");
    expect(getCourseInteractiveHref("unknown-course", "province=ON")).toBeUndefined();
  });

  it("does not turn unrelated or malformed course routes into public pages", () => {
    expect(classifyAppRoute("/courses/no-such-course/interactive").kind).toBe("not-found");
    expect(classifyAppRoute("/courses/class1-water%2Finteractive").kind).toBe("not-found");
    expect(classifyAppRoute("/courses/class1-water/interactive/extra").kind).toBe("not-found");
    expect(classifyAppRoute("/courses/class1-water/interactive/?province=ON").kind).toBe("public");
    expect(classifyAppRoute("/courses/no-such-course").kind).toBe("not-found");
  });

  it("enforces the existing Nova Scotia course ceiling on activity surfaces", () => {
    expect(isNovaScotiaCourseSurface("/courses/wpi-class3-water-dist/interactive")).toBe(true);
    expect(isNovaScotiaPathSupported("/courses/wpi-class3-water-dist/interactive")).toBe(true);
    expect(isNovaScotiaPathSupported("/courses/wpi-class4-water-dist/interactive")).toBe(false);
    expect(isNovaScotiaPathSupported("/courses/class1-water/interactive")).toBe(false);
  });
});
