import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

// Metadata tests must never load the database-backed blog reader or start a server.
vi.mock("./publicBlogIndex", () => ({
  boundedPublicBlogLinks: vi.fn(() => { throw new Error("Unexpected blog read in branding test"); }),
  renderPublicBlogLinks: vi.fn(() => { throw new Error("Unexpected blog render in branding test"); }),
}));

import { buildLlmsTxt, injectSeoIntoTemplate, META_MAP } from "./pageSsr";
import { brandedShell, prepareAppFallback } from "./staticHead";
import { courseCatalogSchema, faqSchema, organizationSchema, websiteSchema } from "../client/src/lib/structuredData";
import { customers } from "../client/src/lib/trustedOrganizations";
import { COURSE_SEO_PAGES } from "../shared/seoCatalog";

const template = readFileSync("client/index.html", "utf8");
const landing = readFileSync("client/src/pages/Landing.tsx", "utf8");
const about = readFileSync("client/src/pages/About.tsx", "utf8");
const home = META_MAP.get("/")!;
const aboutMeta = META_MAP.get("/about")!;
const faqMeta = META_MAP.get("/faq")!;
const free309a = "Ontario 309A practice and mock exams are free.";
const positioning = "AI-powered exam prep for the skilled-trades workforce, starting with water and wastewater";

describe("bounded company positioning alignment", () => {
  it("keeps homepage client, default and server titles and descriptions aligned", () => {
    const title = "AI-Powered Exam Prep for Skilled Trades";
    expect(landing).toContain(`title: "${title}"`);
    expect(home.title).toBe(`${title} | Echelon Institute`);
    expect(template).toContain(`<title>${home.title}</title>`);
    for (const value of [landing, template, home.description, websiteSchema.description]) {
      expect(value).toContain(positioning);
      expect(value).toContain("Canadian courses and supported US preparation");
      expect(value).toContain("free Ontario 309A practice and mock exams");
    }
    for (const meta of [home, aboutMeta, faqMeta]) {
      const html = injectSeoIntoTemplate(template, meta);
      expect(html).toContain(`<title>${meta.title}</title>`);
      expect(html).toContain(`content="${meta.description.replace(/'/g, "&#39;")}"`);
      expect(html.match(/<meta name="description"/g)).toHaveLength(1);
      expect(html.match(/rel="canonical"/g)).toHaveLength(1);
      expect(html).toContain('property="og:locale" content="en_CA"');
      expect(html).toContain('data-ssr-fallback="true"');
    }
  });

  it("aligns company schemas and qualifies US coverage without changing operator catalog offers", () => {
    const serverOrganization = JSON.parse(home.jsonLd!);
    expect(serverOrganization.description).toBe(organizationSchema.description);
    expect(serverOrganization.areaServed).toEqual(organizationSchema.areaServed);
    expect(organizationSchema.areaServed.map(area => area.name)).toEqual(["Canada", "United States"]);
    expect(organizationSchema.areaServed[1].description).toContain("Supported operator");
    expect(organizationSchema.knowsAbout).toContain("Ontario 309A Construction Electrician exam preparation");
    expect(websiteSchema.inLanguage).toBe("en-CA");
    expect(courseCatalogSchema.numberOfItems).toBe(COURSE_SEO_PAGES.length);
    expect(courseCatalogSchema.itemListElement.map(entry => entry.item.offers.price)).toEqual(
      COURSE_SEO_PAGES.map(course => (course.priceCAD / 100).toFixed(0)),
    );
  });

  it("limits paid-access requirements and keeps the free 309A exception in FAQs and fallback copy", () => {
    const clientAnswers = faqSchema.mainEntity.map(question => question.acceptedAnswer.text);
    const serverAnswers = JSON.parse(faqMeta.jsonLd!).mainEntity.map((question: { acceptedAnswer: { text: string } }) => question.acceptedAnswer.text) as string[];
    for (const answers of [clientAnswers, serverAnswers]) {
      const accessAnswers = answers.filter(answer => /Exam Pass|before paying|free practice/.test(answer));
      expect(accessAnswers.length).toBeGreaterThanOrEqual(2);
      for (const answer of accessAnswers) {
        expect(answer).toMatch(/[Pp]aid operator courses/);
        expect(answer).toContain(free309a);
      }
    }
    for (const source of [landing, home.bodyHtml!, faqMeta.bodyHtml!, buildLlmsTxt()]) {
      expect(source).toContain(free309a);
      expect(source).toMatch(/[Pp]aid operator courses/);
      expect(source).not.toContain("400+ concept flashcards");
    }
    expect(landing).toContain("12 months of access to one selected course from successful payment");
    expect(buildLlmsTxt()).toContain("one selected course and 12 months of access from successful payment");
    expect(faqMeta.bodyHtml).toContain("Course inclusions and question totals vary");
    expect(home.bodyHtml).toContain("Inclusions and question totals vary by course");
  });

  it("labels fixed OIT tool links honestly and preserves water-specific study resources", () => {
    expect(landing).toMatch(/title="Practice with explanations"[^\n]*Water OIT preview[^\n]*href="\/quiz"/);
    expect(landing).toMatch(/title="Rehearse the exam"[^\n]*Water OIT timed mock preview[^\n]*href="\/oit-mock"/);
    expect(landing).not.toContain("same course context carried through each study mode");
    expect(landing).toContain("Choose your course for its available tools");
    expect(landing).toContain("Clear, practical study guides for water and wastewater operators.");
    expect(home.bodyHtml).toContain("Echelon Process Guides");
    expect(home.bodyHtml).toContain("water treatment, distribution systems, wastewater treatment");
    expect(landing).toContain('href="/formulas"');
    expect(landing).toContain('href="/guides"');
  });

  it("uses the canonical four-organization list without inventing a paid-customer claim", () => {
    expect(customers).toHaveLength(4);
    expect(customers.map(organization => organization.name)).toContain("City of Peterborough");
    expect(landing).toContain('import { customers } from "@/lib/trustedOrganizations"');
    expect(landing).toContain("customers.map((organization)");
    expect(landing).toContain("{organization.name}");
    expect(landing).toContain("Used by operators at");
    expect(landing).not.toMatch(/paying customers|paid customers|paying municipalities/i);
  });

  it("preserves the About live changelog refresh and historical context", () => {
    expect(about).toContain(aboutMeta.description);
    expect(about).toContain("staleTime: 0");
    expect(about).toContain('refetchOnMount: "always"');
    expect(about).toContain("refetchOnWindowFocus: true");
    expect(about).toContain("latestChangelogTimestamp(changelogQuery.data ?? [])");
    expect(about).toContain("entries={changelogQuery.data}");
    expect(about).toContain("Last updated: {changelogUpdatedAt}");
    expect(about).toContain("Older entries may describe retired products or prices");
    expect(about).toContain("identified a clear gap in Canada's water sector");
  });

  it("keeps the fallback shell, private noindex and quiet app-loader behavior unchanged", () => {
    const shell = brandedShell("<h1>Example</h1>");
    expect(shell).toContain("AI-powered exam prep for skilled trades");
    expect(shell).toContain("water &amp; wastewater first");
    for (const path of ["/oit", "/wpi", "/electrician-309a"]) expect(shell).toContain(`href="${path}"`);
    const privateFallback = prepareAppFallback(template, "/account?email=synthetic%40example.test");
    expect(privateFallback.html).toContain('content="noindex, nofollow"');
    expect(privateFallback.html).not.toContain('rel="canonical"');
    expect(privateFallback.html).not.toContain("synthetic@example.test");
    const root = privateFallback.html.split('<div id="root">')[1].split('<script type="module"')[0];
    expect(root).toContain('class="app-loading"');
    expect(root).not.toMatch(/<h1|<nav|ssr-brand/);
    expect(prepareAppFallback(template, "/missing-branding-fixture").status).toBe(404);
  });

  it("retains the exact bounded startup reveal and app-ready handoff", () => {
    const script = template.match(/<script id="echelon-startup-handoff">([\s\S]*?)<\/script>/)![1];
    const classes = new Set<string>();
    let reveal!: () => void;
    let ready!: () => void;
    let cleared = false;
    runInNewContext(script, {
      document: { documentElement: { classList: { add: (value: string) => classes.add(value), remove: (value: string) => classes.delete(value) } } },
      window: {
        setTimeout: (callback: () => void, ms: number) => { expect(ms).toBe(8000); reveal = callback; return 7; },
        clearTimeout: (id: number) => { expect(id).toBe(7); cleared = true; },
        addEventListener: (name: string, callback: () => void, options: { once: boolean }) => { expect(name).toBe("echelon:app-ready"); expect(options.once).toBe(true); ready = callback; },
      },
    });
    expect(classes.has("echelon-boot-pending")).toBe(true);
    reveal();
    expect(classes.size).toBe(0);
    ready();
    expect(cleared).toBe(true);
    expect(template).toContain('.echelon-boot-pending #root > [data-ssr-fallback="true"] { visibility:hidden; }');
  });
});
