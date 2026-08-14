import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { getAllCourses } from "../shared/courseRegistry";
import { INDIVIDUAL_PRODUCTS } from "../shared/products";
import { COURSE_SEO_PAGES, REGION_SEO_PAGES } from "../shared/seoCatalog";
import { buildDynamicSitemap } from "./blogSsr";
import { buildLlmsTxt, STATIC_PAGE_META } from "./pageSsr";

describe("SEO and geographic landing-page contract", () => {
  it("publishes one accurate landing page for every purchasable active course", () => {
    const productByKey = new Map(
      INDIVIDUAL_PRODUCTS.map(product => [product.key, product])
    );
    const expected = getAllCourses().filter(
      course => course.isActive && productByKey.has(course.productKey)
    );

    expect(COURSE_SEO_PAGES).toHaveLength(expected.length);
    expect(new Set(COURSE_SEO_PAGES.map(course => course.path)).size).toBe(
      COURSE_SEO_PAGES.length
    );

    for (const course of expected) {
      const landing = COURSE_SEO_PAGES.find(
        candidate => candidate.courseKey === course.courseKey
      );
      expect(landing).toBeDefined();
      expect(landing?.quizPath).toBe(course.quizPath);
      expect(landing?.priceCAD).toBe(
        productByKey.get(course.productKey)?.priceCAD
      );
    }
  });

  it("publishes unique province pages and server-renders every generated route", () => {
    expect(REGION_SEO_PAGES.map(page => page.slug)).toEqual([
      "ontario",
      "british-columbia",
      "alberta",
      "saskatchewan",
      "manitoba",
    ]);

    const serverPaths = new Set(STATIC_PAGE_META.map(meta => meta.path));
    for (const page of [...REGION_SEO_PAGES, ...COURSE_SEO_PAGES]) {
      expect(serverPaths.has(page.path)).toBe(true);
    }
    expect(serverPaths.has("/teams")).toBe(true);
  });

  it("keeps public landing pages crawlable and private workspaces blocked", () => {
    const robots = fs.readFileSync(
      path.resolve(process.cwd(), "client/public/robots.txt"),
      "utf8"
    );
    expect(robots).toContain("Allow: /teams");
    expect(robots).toContain("Allow: /courses/");
    expect(robots).toContain("Allow: /canada/");
    expect(robots).toContain("Disallow: /team$");
    expect(robots).not.toContain("Disallow: /teams");
    expect(robots).not.toContain("Disallow: /quiz");
  });

  it("generates a deduplicated sitemap with all geographic and course pages", async () => {
    const sitemap = await buildDynamicSitemap();
    const locations = Array.from(
      sitemap.matchAll(/<loc>([^<]+)<\/loc>/g),
      match => match[1]
    );

    expect(new Set(locations).size).toBe(locations.length);
    for (const page of [...REGION_SEO_PAGES, ...COURSE_SEO_PAGES]) {
      expect(locations).toContain(`https://echeloninstitute.ca${page.path}`);
    }
  });

  it("describes Echelon accurately for answer engines", () => {
    const llms = buildLlmsTxt();
    expect(llms).toContain("Echelon Institute is independent");
    expect(llms).toContain("one selected course and 12 months");
    expect(llms).not.toContain("Alberta AWWOA");
    expect(llms).not.toContain("Saskatchewan SLWA");
    expect(llms).not.toContain("Manitoba WQAM");
  });
});
