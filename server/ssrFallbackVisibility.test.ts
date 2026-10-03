import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { injectSeoIntoTemplate, META_MAP } from "./pageSsr";
import { prepareAppFallback } from "./staticHead";
const template = readFileSync("client/index.html", "utf8");
describe("SSR first-content shell", () => {
  it("provides immediate useful branded navigation on static and app routes", () => {
    for (const html of [template, injectSeoIntoTemplate(template, META_MAP.get("/")!), prepareAppFallback(template, "/class3-water").html]) {
      expect(html).toContain('data-ssr-fallback="true"'); expect(html).toContain("Echelon Institute");
      expect(html).toContain('href="/wpi"'); expect(html).toContain('href="/oit"');
      expect(html).not.toMatch(/data-ssr-fallback[^}]*display:\s*none/);
      expect(html.match(/<div id="root">/g)).toHaveLength(1);
    }
  });
  it("keeps Sora identity without making the remote font sheet block first content", () => {
    expect(template).toContain('rel="preload" as="style"'); expect(template).toContain("family=Sora");
    expect(template).not.toMatch(/\son[a-z]+\s*=/i); expect(template).toContain('id="echelon-font-style"'); expect(template).toMatch(/<noscript>[\s\S]*rel="stylesheet"/);
  });
});
