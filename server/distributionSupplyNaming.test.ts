import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCourseByKey, getExamTypesForCourseKey, getTeamCourseOptions } from "../shared/courseRegistry";
import { getProductByKey, PRODUCT_STUDY_PATHS } from "../shared/products";
import { getCourseSeoPage } from "../shared/seoCatalog";
import { getFinderCourses, getFinderTrackLabel } from "../client/src/lib/courseFinder";
import { EXAM_LABELS } from "../client/src/lib/examMeta";
import { getTeamStreamDescription, getTeamStreamLabel, getTeamBasePriceCents } from "../shared/teamPricing";
import { getOrganizationTierLabel, allowedCourseKeysForOrg } from "./stripe/subscriptionProducts";
import { buildLlmsTxt, STATIC_PAGE_META } from "./pageSsr";

const source = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

// This is a category-name correction, not a claim of a new curriculum audit.
describe("Ontario Water Distribution and Supply display naming", () => {
  for (const [index, priceCAD] of [9900, 14900, 24900, 29900].entries()) {
    const level = index + 1;
    const key = `class${level}-water-dist`;
    const label = `Class ${level} Water Distribution and Supply`;
    it(`uses the full Ontario Class ${level} name without changing its purchase or study identity`, () => {
      expect(getCourseByKey(key)).toMatchObject({
        displayName: label,
        shortName: `Class ${level} Distribution & Supply`,
        courseKey: key,
        questionBankKey: key,
        productKey: key,
        track: "water-distribution",
        examFamily: "ontario",
        quizPath: `/${key}`,
        mockExamPath: `/${key}-mock`,
        flashcardPath: `/${key}-flashcards`,
      });
      expect(getExamTypesForCourseKey(key)).toEqual([key]);
      expect(getProductByKey(key)).toMatchObject({name: `${label} Practice Pass`, priceCAD, examTypes: [key]});
      expect(PRODUCT_STUDY_PATHS[key]).toEqual({quizPath: `/${key}`, mockPath: `/${key}-mock`});
      expect(EXAM_LABELS[key]).toBe(label);
      expect(getTeamCourseOptions("ontario").find(course => course.key === key)?.label).toBe(label);
      expect(getCourseSeoPage(key)).toMatchObject({
        path: `/courses/${key}`, displayName: label, trackLabel: "Water Distribution and Supply",
        heading: `${label} Exam Prep`, priceCAD,
      });
      const publicPage = STATIC_PAGE_META.find(page => page.path === `/courses/${key}`);
      expect(publicPage?.title).toContain(label);
      expect(publicPage?.bodyHtml).toContain(label);
    });
    it(`keeps Ontario Class ${level} practice, mocks and flashcards consistent`, () => {
      for (const surface of ["Quiz", "MockExam", "Flashcards"]) {
        const text = source(`client/src/pages/Class${level}WaterDist${surface}.tsx`);
        expect(text).toContain(label);
        expect(text).not.toMatch(/Water Distribution(?! and Supply|[A-Z_])/);
        expect(text).toContain(`"${key}"`);
      }
    });
  }

  it("uses the full category in the Ontario finder but retains Western/WPI wording", () => {
    expect(getFinderTrackLabel("on", "water-distribution")).toBe("Water distribution and supply");
    for (const province of ["bc", "ab", "sk", "mb"]) {
      expect(getFinderTrackLabel(province, "water-distribution")).toBe("Water distribution");
      expect(getFinderCourses(province, "water-distribution").every(course => course.courseKey.startsWith("wpi-"))).toBe(true);
    }
    expect(getFinderCourses("on", "water-distribution").map(course => course.courseKey)).toEqual([
      "class1-water-dist", "class2-water-dist", "class3-water-dist", "class4-water-dist",
    ]);
  });

  it("keeps all four WPI registry, catalogue and SEO names unchanged", () => {
    for (const [index, roman] of ["I", "II", "III", "IV"].entries()) {
      const key = `wpi-class${index + 1}-water-dist`;
      const label = `WPI Class ${roman} Water Distribution`;
      expect(getCourseByKey(key)?.displayName).toBe(label);
      expect(getProductByKey(key)?.name).toBe(`${label} Practice Pass`);
      expect(getCourseSeoPage(key)?.trackLabel).toBe("Water Distribution");
      expect(EXAM_LABELS[key]).toBe(label);
    }
  });

  it("makes annual team and receipt labels province-aware without changing access or price", () => {
    expect(getTeamStreamLabel("ontario", "stream-water-dist")).toBe("Water Distribution and Supply");
    expect(getTeamStreamDescription("ontario", "stream-water-dist")).toContain("distribution and supply");
    expect(getOrganizationTierLabel("stream-water-dist", "ontario")).toBe("Water Distribution and Supply");
    expect(getOrganizationTierLabel("stream-water-dist", "western")).toBe("Water Distribution");
    expect(getOrganizationTierLabel("stream-water-dist")).toBe("Water Distribution");
    expect(getTeamStreamLabel("western", "stream-water-dist")).toBe("Water Distribution");
    expect(getTeamStreamLabel("ontario", "stream-water")).toBe("Water Treatment");
    expect(getOrganizationTierLabel("class1", "ontario")).toBe("Class 1 All-Access");
    expect(getTeamBasePriceCents("ontario", "stream-water-dist")).toBe(44900);
    expect(getTeamBasePriceCents("western", "stream-water-dist")).toBe(44900);
    expect(allowedCourseKeysForOrg("stream-water-dist", "ontario")).toEqual([
      "oit", "class1-water-dist", "class2-water-dist", "class3-water-dist", "class4-water-dist",
    ]);
    expect(allowedCourseKeysForOrg("stream-water-dist", "western")).toEqual([
      "wpi-class1-water-dist", "wpi-class2-water-dist", "wpi-class3-water-dist", "wpi-class4-water-dist",
    ]);
  });

  it("retains technical guide and module names rather than rewriting instructional content", () => {
    expect(source("client/src/pages/WaterDistribution.tsx")).toContain('title: "Water Distribution"');
    expect(source("server/courseActivityScope.ts")).toContain('["Water Treatment", "Water Distribution"]');
    expect(buildLlmsTxt()).toContain("water distribution and supply");
    expect(buildLlmsTxt()).toContain("WPI-aligned Class I–IV preparation for water treatment, wastewater treatment, water distribution, and wastewater collection");
  });
});
