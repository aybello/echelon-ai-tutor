import express from "express";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerPageSsrRoutes, injectSeoIntoTemplate, META_MAP } from "./pageSsr";
import { registerViteFallback, serveStatic } from "./_core/vite";
import { prepareAppFallback } from "./staticHead";
import { WPI_PAGE_COPY } from "../shared/wpiContent";

const template = readFileSync("client/index.html", "utf8");
const servers: Server[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve())))); vi.restoreAllMocks(); });
async function origin(app: express.Express) {
  const server = createServer(app); servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw Error("No port");
  return `http://127.0.0.1:${address.port}`;
}
function devVite() { return { middlewares: (_req: unknown, _res: unknown, next: () => void) => next(), transformIndexHtml: vi.fn(async (_url: string, html: string) => html), ssrFixStacktrace: vi.fn() } as any; }

describe("discovery HTTP contract", () => {
  it("returns true 404/noindex without a homepage canonical in development", async () => {
    const app = express(); registerViteFallback(app, devVite()); const base = await origin(app);
    for (const path of ["/missing-page", "/courses/missing", "/canada/missing", "/pricing/extra"]) {
      const response = await fetch(`${base}${path}`); const html = await response.text();
      expect(response.status).toBe(404); expect(response.headers.get("cache-control")).toBe("no-store");
      expect(html).toContain('content="noindex, nofollow"'); expect(html).toContain("Page Not Found");
      expect(html).not.toContain('rel="canonical"'); expect(html).not.toContain('property="og:url"');
    }
  });
  it("keeps valid public, private and dynamic SPA routes usable and private pages uncached", async () => {
    const app = express(); registerViteFallback(app, devVite()); const base = await origin(app);
    for (const path of ["/class3-water", "/account", "/login/otp?email=synthetic%40example.test", "/dashboard?course=wpi-class1-wastewater", "/activate/oit", "/training-hours/records/synthetic", "/blog/current-post", "/us/states/iowa"]) {
      const response = await fetch(`${base}${path}`); const html = await response.text();
      expect(response.status, path).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
      expect(html).toContain('src="/src/main.tsx?v='); expect(html).not.toContain("synthetic@example.test");
      if (["/account", "/login", "/dashboard", "/activate", "/training-hours"].some(prefix => path.startsWith(prefix))) {
        expect(html).toContain('content="noindex, nofollow"'); expect(html).not.toContain('rel="canonical"');
      }
    }
  });
  it("returns the same true404 contract in production and missing assets never return HTML", async () => {
    // Only a synthetic index template is supplied. No application server or database is started.
    const fs = await import("fs"); vi.spyOn(fs.default, "readFileSync").mockReturnValue(template);
    const app = express(); serveStatic(app); const base = await origin(app);
    const missing = await fetch(`${base}/missing-page`); expect(missing.status).toBe(404);
    expect(await missing.text()).not.toContain('rel="canonical"');
    const account = await fetch(`${base}/account`); expect(account.status).toBe(200); expect(account.headers.get("cache-control")).toBe("no-store");
    const asset = await fetch(`${base}/assets/old-chunk.js`); expect(asset.status).toBe(404); expect(await asset.text()).toBe("");
  });
  it("serves current published blog links, escapes injected text and handles a successful empty list", async () => {
    const links = ["retiring-operator-knowledge-transfer-utility-checklist", "failed-operator-exam-what-to-change-before-retake", "first-operator-job-after-oit-certification-ontario"].map(slug => ({ slug, title: "$& <script>synthetic</script>", excerpt: 'Safe <img onerror="bad">' }));
    const app = express(); registerPageSsrRoutes(app, true, undefined, async () => links); const base = await origin(app);
    const response = await fetch(`${base}/blog`); const html = await response.text(); expect(response.status).toBe(200);
    for (const post of links) expect(html).toContain(`href="/blog/${post.slug}"`);
    expect(html).toContain("$&amp; &lt;script&gt;"); expect(html).not.toContain("<script>synthetic</script>");
    expect(html.match(/<title>/g)).toHaveLength(1); expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    const emptyApp = express(); registerPageSsrRoutes(emptyApp, true, undefined, async () => []);
    expect(await (await fetch(`${await origin(emptyApp)}/blog`)).text()).toContain("No published articles are available yet.");
  });
  it("does not relabel a temporary blog list failure as empty content or a 404", async () => {
    const app = express(); registerPageSsrRoutes(app, true, undefined, async () => { throw Error("synthetic read failure"); }); const base = await origin(app);
    const response = await fetch(`${base}/blog`); const html = await response.text();
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(html).toContain("Articles are temporarily unavailable"); expect(html).not.toContain("No published articles are available yet");
    expect(html).not.toContain("synthetic read failure");
  });
  it("serves WPI identity, exam-version and Ontario applicability in the initial shell", async () => {
    const app = express(); registerPageSsrRoutes(app, true); const response = await fetch(`${await origin(app)}/wpi`); const html = await response.text();
    expect(response.status).toBe(200); expect(html).toContain(WPI_PAGE_COPY.heading.replace(/&/g, "&amp;"));
    for (const value of [WPI_PAGE_COPY.identity, WPI_PAGE_COPY.ontario, WPI_PAGE_COPY.version, WPI_PAGE_COPY.independence]) expect(html).toContain(value.replace(/&/g, "&amp;").replace(/'/g, "&#39;"));
    expect(html).toContain('href="/wpi-class1-water"'); expect(html).not.toContain("Echelon Institute's interactive reference guide");
    expect(html).not.toContain("Water & Process Industry");
  });
  it("preserves dollar replacements and cannot escape a structured-data script", () => {
    const html = injectSeoIntoTemplate(template, { path: "/synthetic", title: "$& <name>", description: '"quoted"', h1: "$& heading", bodyHtml: "<p>$& body</p>", jsonLd: JSON.stringify({ name: "</script><script>bad</script>" }) });
    expect(html).toContain("<h1>$&amp; heading</h1>"); expect(html).toContain("<p>$& body</p>");
    expect(html).not.toContain("</script><script>bad"); expect(html).toContain("\\u003c/script>");
    expect(prepareAppFallback(template, "/account").html).not.toContain('rel="canonical"');
    expect(META_MAP.get("/wpi")?.title).toBe(WPI_PAGE_COPY.title);
  });
});
