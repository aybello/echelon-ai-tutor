import { describe, expect, it } from "vitest";
import { readTutorStudyLocale } from "../shared/usStudyContext";
import { resolveUSStudyContext } from "./usStudyContextServer";
import { buildTutorSystemPrompt } from "./_core/aiTutorPolicy";
import { sharedUSCourses, matchedUSCourses, US_STATE_CONFIGS } from "../shared/usExamRouting";
describe("US shared WPI advisory Tutor locale", () => {
  const course = sharedUSCourses().find(item => item.examFamily === "western" && item.isActive)!;
  it("propagates US country and allowlisted state without changing course identity", () => {
    expect(readTutorStudyLocale(course.courseKey, "?country=US&state=CA")).toEqual({ usCountry: "US", usState: "CA" });
    expect(readTutorStudyLocale(course.courseKey, "?country=US&state=invalid")).toEqual({ usCountry: "US" });
    expect(readTutorStudyLocale(course.courseKey, "?state=CA")).toEqual({});
    expect(readTutorStudyLocale("oit", "?country=US&state=CA")).toEqual({});
  });
  it("fails closed for Canada, unknown and non-matched state routes", () => {
    expect(resolveUSStudyContext(course.courseKey, null, "CA")).toBeNull();
    expect(resolveUSStudyContext("oit", "CA", "US")).toBeNull();
    expect(resolveUSStudyContext("unknown", null, "US")).toBeNull();
    const unmatched = Object.values(US_STATE_CONFIGS).find(state => !matchedUSCourses(state).some(item => item.courseKey === course.courseKey));
    if (unmatched) expect(resolveUSStudyContext(course.courseKey, unmatched.code, "US")).toBeNull();
  });
  it("uses US units and local-rule boundaries for validated shared context", () => {
    const usContext = resolveUSStudyContext(course.courseKey, "untrusted text", "US");
    expect(usContext).toMatchObject({ courseKey: course.courseKey, stateName: null, unitConvention: "us-customary" });
    const common = { courseName: course.courseKey, examFamily: "western" as const, question: null, selectedIndex: null, patternMode: false, recentPerformance: [] };
    const prompt = buildTutorSystemPrompt({ ...common, usContext });
    expect(prompt).toContain("US gallons (never Imperial gallons)");
    expect(prompt).toContain("state certifying authority");
    expect(prompt).not.toContain("untrusted text");
    expect(buildTutorSystemPrompt(common)).not.toContain("US customary units");
  });
});
