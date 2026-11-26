import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAllCourses, resolveCourseKey } from "@shared/courseRegistry";
import { courseProvinceHref } from "@shared/funnelNavigation";
import { getCourseForPath, getCourseWorkspaceTabs, getFormulaStudyLinks } from "./courseNavigation";

const state = vi.hoisted(() => ({ search: "", menuOpen: false, signedIn: false }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => actual.useState(state.menuOpen && initial === false ? true : initial),
  };
});
vi.mock("@/lib/trpc", () => ({
  trpc: { dashboardAuth: { me: { useQuery: () => ({ data: null }) } } },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: state.signedIn }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("wouter", () => ({
  useSearch: () => state.search,
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
}));

import SiteNav from "../components/SiteNav";
import FormulasWpiClass1 from "../pages/FormulasWpiClass1";
import FormulasWpiClass1Ww from "../pages/FormulasWpiClass1Ww";
import FormulasWpiClass2 from "../pages/FormulasWpiClass2";
import FormulasWpiClass2Ww from "../pages/FormulasWpiClass2Ww";
import FormulasWpiClass3 from "../pages/FormulasWpiClass3";
import FormulasWpiClass3Ww from "../pages/FormulasWpiClass3Ww";
import FormulasWpiClass4 from "../pages/FormulasWpiClass4";
import FormulasWpiClass4Ww from "../pages/FormulasWpiClass4Ww";

beforeEach(() => {
  state.search = "";
  state.menuOpen = false;
  state.signedIn = false;
  vi.stubGlobal("React", React);
});
afterEach(() => vi.unstubAllGlobals());
const renderNav = (currentPath: string) => renderToStaticMarkup(createElement(SiteNav, { currentPath }));

const sharedCourses = getAllCourses().filter(course => course.isActive && course.formulaPath &&
  getAllCourses().some(other => other.isActive && other.courseKey !== course.courseKey && other.formulaPath === course.formulaPath));

describe("validated shared formula context", () => {
  it("round-trips every shared formula course without a first-match fallback", () => {
    expect(sharedCourses).toHaveLength(18);
    for (const course of sharedCourses) {
      const tab = getCourseWorkspaceTabs(course).find(item => item.kind === "formulas")!;
      expect(new URL(tab.href, "https://echelon.invalid").searchParams.get("course")).toBe(course.courseKey);
      expect(getCourseForPath(tab.href)?.courseKey).toBe(course.courseKey);
      expect(getCourseForPath(course.formulaPath!)).toBeUndefined();
      expect(getCourseForPath(course.formulaPath!, "course=unknown")).toBeUndefined();
      expect(getCourseForPath(course.formulaPath!, "course=class1-water")).toBeUndefined();
      expect(getCourseForPath(course.formulaPath!, `course=${course.courseKey}&course=unknown`)).toBeUndefined();
    }
  });

  it("canonicalizes a registered collection alias only on its own formula sheet", () => {
    expect(getCourseForPath("/formulas-wpi-class1-ww/", "course=wpi-class1-wastewater-coll")?.courseKey).toBe("wpi-class1-water-coll");
    expect(getCourseForPath("/formulas-wpi-class1", "course=wpi-class1-water-coll")).toBeUndefined();
    expect(getCourseForPath("/formulas-us-class1", "course=wpi-class1-water-dist")).toBeUndefined();
  });

  it("never changes practice/mock/flashcards or unrelated pages from query context", () => {
    const distribution = resolveCourseKey("wpi-class1-water-dist")!;
    const treatment = resolveCourseKey("wpi-class1-water")!;
    for (const path of [treatment.quizPath, treatment.mockExamPath, treatment.flashcardPath!]) {
      expect(getCourseForPath(path, `course=${distribution.courseKey}`)?.courseKey).toBe(treatment.courseKey);
    }
    expect(getCourseForPath("/about", "course=wpi-class1-water-dist")).toBeUndefined();
    expect(getCourseForPath("/formulas", "course=wpi-class1-water-dist")).toBeUndefined();
    expect(getCourseForPath("/formulas-water1", "course=wpi-class1-water-dist")?.courseKey).toBe("class1-water");
  });

  it("retains canonical course identity through existing province and US link helpers", () => {
    const course = resolveCourseKey("wpi-class1-water-dist")!;
    const formulaHref = getCourseWorkspaceTabs(course).find(tab => tab.kind === "formulas")!.href;
    const canadian = courseProvinceHref(formulaHref, course.courseKey, "AB", "province=AB");
    expect(canadian).toBe("/formulas-wpi-class1?course=wpi-class1-water-dist&province=AB");
    const us = courseProvinceHref(formulaHref, course.courseKey, undefined, "country=US&state=CA");
    expect(us).toBe("/formulas-wpi-class1?course=wpi-class1-water-dist&country=US&state=CA");
    expect(getCourseForPath(us)?.courseKey).toBe(course.courseKey);
    expect(getFormulaStudyLinks("/formulas-wpi-class1", new URL(us, "https://echelon.invalid").search).practiceHref)
      .toBe("/wpi-class1-water-dist?country=US&state=CA");
  });

  it("renders course-specific desktop and mobile tools for distribution and collection", () => {
    for (const key of ["wpi-class1-water-dist", "wpi-class1-water-coll", "us-class1-water-dist"]) {
      const course = resolveCourseKey(key)!;
      state.search = `course=${key}`;
      state.menuOpen = true;
      const html = renderNav(course.formulaPath!);
      expect(html).toContain(`${course.displayName} study tools`);
      expect(html).toContain(`${course.displayName} mobile study tools`);
      expect(html).toContain(`href="${course.quizPath}?`);
      expect(html).toContain(`href="/courses/${key}/interactive`);
      expect(html).toContain(`href="/dashboard?course=${key}`);
      expect(html).not.toContain("Shared formula resource");
    }
  });

  it("renders an honest shared resource without unrelated course tools when context is absent or invalid", () => {
    for (const search of ["", "course=unknown", "course=class1-water", "course=wpi-class1-water-coll"]) {
      state.search = search;
      const html = renderNav("/formulas-wpi-class1");
      expect(html).toContain("Shared formula resource");
      expect(html).not.toContain('aria-label="WPI Class I Water Treatment study tools"');
      expect(html).not.toContain("echelon-course-tab ");
      expect(html).not.toContain('href="/wpi-class1-water?');
    }
  });

  it("does not resolve a query course on a nonmatching rendered page", () => {
    state.search = "course=wpi-class1-water-dist";
    expect(renderNav("/class1-water")).toContain("Class 1 Water Treatment study tools");
    expect(renderNav("/about")).not.toContain("echelon-course-bar");
    state.search = "course=wpi-class1-water-coll";
    expect(renderNav("/dashboard")).toContain("WPI Class I Wastewater Collection study tools");
  });
});

describe("shared formula pages' own course-return buttons", () => {
  it.each([
    [FormulasWpiClass1, "wpi-class1-water-dist"],
    [FormulasWpiClass1Ww, "wpi-class1-water-coll"],
    [FormulasWpiClass2, "wpi-class2-water-dist"],
    [FormulasWpiClass2Ww, "wpi-class2-water-coll"],
    [FormulasWpiClass3, "wpi-class3-water-dist"],
    [FormulasWpiClass3Ww, "wpi-class3-water-coll"],
    [FormulasWpiClass4, "wpi-class4-water-dist"],
    [FormulasWpiClass4Ww, "wpi-class4-water-coll"],
  ] as const)("keeps formula page %# return buttons on its originating course", (Component, key) => {
    const course = resolveCourseKey(key)!;
    state.search = `course=${key}&province=AB`;
    const html = renderToStaticMarkup(createElement(Component));
    // Includes the in-page buttons, not just SiteNav's workspace links.
    const body = html.split("</header>")[1];
    expect(body).toContain(`href="${course.quizPath}?province=AB"`);
    expect(body).toContain(`href="${course.mockExamPath}?province=AB"`);
    const treatmentKey = key.replace("water-dist", "water").replace("water-coll", "wastewater");
    expect(body).not.toContain(`href="/${treatmentKey}"`);
    expect(body).not.toContain(`href="/${treatmentKey}-mock"`);
  });

  it("uses the catalogue rather than silently starting a treatment course without context", () => {
    const body = renderToStaticMarkup(createElement(FormulasWpiClass1)).split("</header>")[1];
    expect(body).not.toContain('href="/wpi-class1-water"');
    expect(body).not.toContain('href="/wpi-class1-water-mock"');
    expect(body).toContain('href="/wpi"');
    expect(body).toContain("Choose a course →");
    expect(getFormulaStudyLinks("/formulas-us-class1", "").practiceHref).toBe("/us/courses");
  });
});

describe("exact state-course badges", () => {
  it.each([
    ["us-texas-class-d-water", "Texas / Class D Water"],
    ["fl-water-distribution-l3", "Florida / Water Distribution Level 3"],
    ["pa-class-e-water-distribution", "Pennsylvania / Class E Water Distribution"],
    ["pa-wastewater-collection-e4", "Pennsylvania / Wastewater Collection (Class E, Subclass 4)"],
  ])("labels %s from its own metadata, not a different query state", (key, label) => {
    state.search = "country=US&state=CA";
    const course = resolveCourseKey(key)!;
    for (const path of [course.quizPath, course.mockExamPath, course.flashcardPath!]) {
      const html = renderNav(path);
      expect(html).toContain(`<small>${label}</small>`);
      if (key !== "us-texas-class-d-water") expect(html).not.toContain("Texas / Class D Water");
    }
  });
});

describe("employer claim funnel without removing personal navigation", () => {
  it("suppresses individual pricing in desktop and opened mobile claim navigation", () => {
    state.menuOpen = true;
    for (const signedIn of [false, true]) {
      state.signedIn = signedIn;
      for (const path of ["/course-pass/claim", "/course-pass/claim?token=synthetic", "/teams", "/team/training-hours"]) {
        const html = renderNav(path);
        expect(html).toContain("echelon-mobile-actions");
        expect(html).not.toContain('href="/pricing');
        expect(html).not.toContain("echelon-pricing-link");
        expect(html).not.toContain("echelon-mobile-pricing-link");
        expect(html).toContain(signedIn ? "My account" : "Sign in");
      }
    }
  });

  it("preserves legitimate personal account and individual plan paths elsewhere", () => {
    state.menuOpen = true;
    state.signedIn = true;
    for (const path of ["/account", "/account?billing=personal", "/activate/class1-water", "/course-pass/claim-unrelated", "/"]) {
      const html = renderNav(path);
      expect(html).toContain('href="/pricing"');
      expect(html).toContain('href="/account"');
      expect(html).toContain("My account");
    }
  });
});
