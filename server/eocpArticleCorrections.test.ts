import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { eocpArticleCorrections } from "./content/eocpArticleCorrections.mjs";
import { injectBlogPostMeta } from "./blogSsr";
import { classifyAppRoute } from "../shared/appRoutes";
const template = readFileSync("client/index.html", "utf8");
describe("proposed BC editorial corrections, never applied on read", () => {
  it("contains only the three approved-scope stable slugs", () => {
    expect(eocpArticleCorrections.map(post => post.slug)).toEqual(["bc-water-operator-certification-guide", "eocp-exam-study-tips-bc", "canadian-water-operator-certification-by-province"]);
  });
  it.each(eocpArticleCorrections)("renders synchronized proposed title/headline/metadata for $slug", post => {
    const html = injectBlogPostMeta(template, { ...post, author: "Echelon Institute", publishedAt: new Date("2026-05-20"), updatedAt: new Date("2026-10-03") });
    expect(html).toContain(`<h1>${post.title}</h1>`); expect(html).toContain(post.metaTitle);
    expect(html).toContain(`https://echeloninstitute.ca/blog/${post.slug}`); expect(html).toContain(`"headline":"${post.title}"`);
    expect([post.title, post.excerpt, post.metaTitle, post.metaDescription, post.content].join(" ")).not.toMatch(/Classes?\s*[DA]\b|D.to.A|Water & Process Industry|—|guaranteed|retirement statistics/i);
    expect(post.content).toContain("Levels I"); expect(post.content).toContain("small-system"); expect(post.content).toContain("https://eocp.ca/certified-operators/drc-requirements/");
    for (const match of post.content.matchAll(/href="(\/[^"#]*)"/g)) expect(classifyAppRoute(match[1]).kind, match[1]).toBe("public");
  });
  it("documents eligibility, version bounds and maintenance without giving pilot CEU credit", () => {
    const guide = eocpArticleCorrections[0].content;
    for (const phrase of ["500 hours", "1,800 hours", "5,400 hours", "7,200 hours", "3,000 hours", "1.2 CEUs", "2.4 CEUs", "annual dues", "two-year reporting period", "July 2025", "10 unidentified pre-test", "older or customized", "not approved EOCP CEUs"]) expect(guide).toContain(phrase);
  });
  it("does not introduce a published read-time override", () => {
    expect(readFileSync("server/publishedArticleRepair.ts", "utf8")).not.toContain("eocpArticleCorrections");
  });
});
