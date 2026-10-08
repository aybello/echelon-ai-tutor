import { describe, expect, it } from "vitest";
import { getAllCourses } from "./courseRegistry";
import { classifyAppRoute } from "./appRoutes";
import { US_STATE_NAMES } from "./usStateNames";
import { getStateBySlug, isSharedProgram, matchedUSCourses, sharedUSCourses, usCourseHref, type USProgramEvidence, type USStateConfig } from "./usExamRouting";

const program = (overrides: Partial<USProgramEvidence> = {}): USProgramEvidence => ({
  stream: "water-treatment", examSystem: "wpi-standardized", authorityName: "Synthetic authority", authorityUrl: "https://authority.example.test", localLevels: "Local Grade II corresponds to WPI I", verifiedSharedLevels: [1], note: "Synthetic routing fixture", sources: [{url:"https://authority.example.test/exams",title:"Official exam route",evidence:"Standardized exam and local mapping explicitly confirmed"}], ...overrides,
});
const state = (programs: USProgramEvidence[]): USStateConfig => ({ code:"AL",name:"Alabama",slug:"alabama",programs,dedicatedCourseNeeds:[],limits:[] });

describe("source-backed US exam routing", () => {
  it("lists exactly 50 states with valid canonical pages and no unknown slug", () => {
    expect(US_STATE_NAMES).toHaveLength(50);
    expect(new Set(US_STATE_NAMES.map(item => item.code)).size).toBe(50);
    for (const item of US_STATE_NAMES) {
      expect(getStateBySlug(item.slug)?.code).toBe(item.code);
      expect(classifyAppRoute(`/us/states/${item.slug}`).kind).toBe("public");
    }
    expect(getStateBySlug("not-a-state")).toBeUndefined();
    expect(classifyAppRoute("/us/states/not-a-state").kind).toBe("not-found");
  });
  it("uses the existing 16 WPI course identities, never a new US product", () => {
    expect(sharedUSCourses()).toHaveLength(16);
    expect(sharedUSCourses().every(item => getAllCourses().includes(item))).toBe(true);
    for (const course of sharedUSCourses()) {
      expect(usCourseHref(course,"practice")).toBe(`${course.quizPath}?country=US`);
      expect(usCourseHref(course,"mock")).toBe(`${course.mockExamPath}?country=US`);
      expect(usCourseHref(course,"flashcards")).toBe(`${course.flashcardPath}?country=US`);
    }
  });
  it("routes by verified WPI class, not the local grade number", () => {
    // Class 1 water treatment now has a dedicated active US course, so a
    // verified Class 1 finding routes there instead of the shared fallback.
    const matches = matchedUSCourses(state([program()]));
    expect(matches.map(item => item.courseKey)).toEqual(["us-class1-water"]);
  });
  it("keeps shared WPI identities for classes with no dedicated US course", () => {
    // Only Class 1 is dedicated. Class 2 and above must still resolve to the
    // existing shared WPI courses, so no state loses coverage.
    const matches = matchedUSCourses(state([program({ verifiedSharedLevels: [1, 2, 3] })]));
    expect(matches.map(item => item.courseKey)).toEqual([
      "us-class1-water",
      "wpi-class2-water",
      "wpi-class3-water",
    ]);
  });
  it("does not extend a water treatment finding to the other three streams", () => {
    const matches = matchedUSCourses(state([program({verifiedSharedLevels:[1,2]})]));
    expect(matches).toHaveLength(2);
    expect(matches.every(item => item.track === "water-treatment")).toBe(true);
    expect(matchedUSCourses(state([program()]), "wastewater-treatment")).toEqual([]);
  });
  it.each(["wpi-customized","state-specific","unverified","not-offered"] as const)("does not route %s as a shared standardized exam", examSystem => {
    expect(matchedUSCourses(state([program({examSystem})]))).toEqual([]);
  });
  it("routes only the verified standardized subset of a mixed program", () => {
    expect(matchedUSCourses(state([program({examSystem:"mixed",verifiedSharedLevels:[2]})])).map(item=>item.classLevel)).toEqual([2]);
    expect(matchedUSCourses(state([program({examSystem:"mixed",verifiedSharedLevels:[]})]))).toEqual([]);
  });
  it("keeps actual local grade differences and specialist exclusions intact", () => {
    const montana = getStateBySlug("montana")!;
    expect(matchedUSCourses(montana,"water-treatment").map(item=>item.classLevel)).toEqual([1,2,3]);
    expect(matchedUSCourses(montana,"wastewater-treatment").map(item=>item.classLevel)).toEqual([2]);
    expect(matchedUSCourses(getStateBySlug("california")!)).toEqual([]);
    expect(matchedUSCourses(getStateBySlug("alaska")!)).toHaveLength(16);
  });
  it("requires official evidence and a confirmed valid level", () => {
    expect(isSharedProgram(program({sources:[]}))).toBe(false);
    expect(isSharedProgram(program({verifiedSharedLevels:[]}))).toBe(false);
    expect(isSharedProgram(program({verifiedSharedLevels:[0,5,1.5]}))).toBe(false);
    expect(matchedUSCourses(state([program({verifiedSharedLevels:[1,5]})])).map(item=>item.classLevel)).toEqual([1]);
  });
  it("does not route an Ontario course through the US shared catalogue", () => {
    const course = getAllCourses().find(item => item.courseKey === "oit")!;
    expect(usCourseHref(course,"practice")).toBeNull();
  });
});
