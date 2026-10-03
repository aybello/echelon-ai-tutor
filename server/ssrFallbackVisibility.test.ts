import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { injectSeoIntoTemplate, META_MAP } from "./pageSsr";
import { prepareAppFallback } from "./staticHead";
import { PUBLIC_APP_PATHS } from "../shared/appRoutes";
const template = readFileSync("client/index.html", "utf8");
const app = readFileSync("client/src/App.tsx", "utf8");
const root = (html: string) => html.split('<div id="root">')[1]?.split('<script type="module"')[0] ?? "";

describe("initial application loading display", () => {
  it("does not flash a promotional navigation page before any registered app route", () => {
    for (const path of PUBLIC_APP_PATHS) {
      const result = prepareAppFallback(template, path);
      expect(result.status, path).toBe(200);
      expect(root(result.html), path).toContain('class="app-loading" role="status" aria-label="Loading page"');
      expect(root(result.html), path).not.toMatch(/<h1|<nav|ssr-brand|ssr-content/);
      expect(result.html, path).not.toContain("Course links and resources are available below");
      expect(result.html.match(/<div id="root">/g), path).toHaveLength(1);
      expect(result.html, path).toContain('<script type="module" src="/src/main.tsx"');
    }
  });
  it("uses the same quiet indicator before JavaScript and during route-bundle loading", () => {
    expect(root(template)).toContain('class="app-loading"');
    expect(root(template)).not.toMatch(/<h1|<nav|ssr-brand|ssr-content/);
    const loader = app.split("function PageLoader()")[1].split("function Router()")[0];
    expect(loader).toContain('className="app-loading"');
    expect(loader).not.toMatch(/<h1|<nav|<a /);
    expect(template).toContain("prefers-reduced-motion:no-preference");
    expect(template).toContain("JavaScript is needed to open the study tools");
  });
  it("preserves useful public server-rendered content and true missing-page navigation", () => {
    for (const html of [injectSeoIntoTemplate(template, META_MAP.get("/")!), prepareAppFallback(template, "/missing-page").html]) {
      expect(html).toContain('data-ssr-fallback="true"');
      expect(html).toContain("Echelon Institute");
      expect(html).toContain('href="/wpi"');
      expect(html).toContain('href="/oit"');
      expect(html).not.toMatch(/data-ssr-fallback[^}]*display:\s*none/);
      expect(html.match(/<div id="root">/g)).toHaveLength(1);
    }
    const missing = prepareAppFallback(template, "/missing-page");
    expect(missing.status).toBe(404);
    expect(root(missing.html)).toContain("Page Not Found");
    expect(missing.html).toContain('content="noindex, nofollow"');
    expect(missing.html).not.toContain('rel="canonical"');
    const privatePage = prepareAppFallback(template, "/account?email=synthetic%40example.test");
    expect(privatePage.html).toContain('content="noindex, nofollow"');
    expect(privatePage.html).not.toContain('rel="canonical"');
    expect(privatePage.html).not.toContain("synthetic");
  });
  it("keeps Sora identity without making the remote font sheet block first content", () => {
    expect(template).toContain('rel="preload" as="style"');
    expect(template).toContain("family=Sora");
    expect(template).not.toMatch(/\son[a-z]+\s*=/i);
    expect(template).toContain('id="echelon-font-style"');
    expect(template).toMatch(/<noscript>[\s\S]*rel="stylesheet"/);
  });
});
