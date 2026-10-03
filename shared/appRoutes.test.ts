import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyAppRoute, PUBLIC_APP_PATHS, PRIVATE_APP_PATTERNS, DYNAMIC_PUBLIC_PATTERNS } from "./appRoutes";
import { COURSE_SEO_PAGES, REGION_SEO_PAGES } from "./seoCatalog";
import { CEU_COURSES } from "./ceuCourses";
import { US_STATE_CONFIGS } from "../client/src/lib/stateConfig";

const app = readFileSync("client/src/App.tsx", "utf8");
const appPaths = Array.from(app.matchAll(/<Route path=\{"([^"]+)"\}/g), match => match[1]);
const registryPaths = [...PUBLIC_APP_PATHS, ...PRIVATE_APP_PATTERNS, ...DYNAMIC_PUBLIC_PATTERNS, "/404"];

describe("App route existence contract", () => {
  it("covers exactly all registered routes, so additions cannot silently 404", () => {
    expect(new Set(registryPaths)).toEqual(new Set(appPaths));
  });
  it.each(PUBLIC_APP_PATHS)("supports public route %s and query/trailing-slash variants", route => {
    expect(classifyAppRoute(route).kind).toBe("public");
    expect(classifyAppRoute(`${route}?product=synthetic`).kind).toBe("public");
    expect(classifyAppRoute(route === "/" ? "/" : `${route}/`).kind).toBe("public");
  });
  it.each(PRIVATE_APP_PATTERNS)("keeps protected route %s client-side without any private read", route => {
    const concrete = route.replace(/:[^/]+/, "synthetic-record");
    expect(classifyAppRoute(`${concrete}?next=%2Fdashboard`).kind).toBe("private");
  });
  it("supports every current course, region, state and non-credit CEU route", () => {
    const routes = [...COURSE_SEO_PAGES, ...REGION_SEO_PAGES].map(page => page.path)
      .concat(CEU_COURSES.map(course => `/continuing-education/${course.key}`))
      .concat(Object.values(US_STATE_CONFIGS).map(state => `/us/states/${state.slug}`));
    for (const route of routes) expect(classifyAppRoute(route), route).toMatchObject({ kind: "public" });
    expect(classifyAppRoute("/blog/current-published-article").kind).toBe("public");
    // Blog existence is handled by its published-only SSR query, not inferred here.
    expect(classifyAppRoute("/blog/no-such-post").kind).toBe("public");
  });
  it.each(["/404", "/ordinary-missing-page", "/class9-water", "/class3-water-quiz", "/pricing/extra", "/courses/no-such-course", "/canada/no-such-region", "/us/states/no-such-state", "/continuing-education/no-such-course", "/blog/x/extra", "/blog/%2fprivate", "/team/extra", "/activate/a/b", "/assets", "/api/no-such-endpoint", "/%2faccount", "/pricing//"])("rejects genuine unknown %s", route => {
    expect(classifyAppRoute(route).kind).toBe("not-found");
  });
});
