/**
 * hreflang emission and Organization sameAs population.
 *
 * These are the two smallest SEO fixes but easy to regress on rewrite, so we pin them.
 */
import { describe, expect, it } from "vitest";
import { STATIC_PAGE_META } from "./pageSsr";

// buildSeoHead and buildOrganizationJsonLd are not exported directly; verify their
// output via the shape of `META_MAP` / `STATIC_PAGE_META` and the raw file contents.
import fs from "fs";
import path from "path";

const pageSsrSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/pageSsr.ts"),
  "utf8"
);

describe("Organization JSON-LD", () => {
  it("populates sameAs with the LinkedIn company page", () => {
    const homepage = STATIC_PAGE_META.find(m => m.path === "/");
    expect(homepage?.jsonLd).toBeDefined();
    expect(homepage!.jsonLd).toContain(
      "https://www.linkedin.com/company/echeloninstitute"
    );
  });
});

describe("hreflang pairs", () => {
  it("declares the /us <-> / language pair", () => {
    expect(pageSsrSource).toMatch(
      /HREFLANG_GROUPS[\s\S]*?enCA:\s*"\/"[\s\S]*?enUS:\s*"\/us"/
    );
  });

  it("declares the /wpi <-> /us/courses pair", () => {
    expect(pageSsrSource).toMatch(
      /enCA:\s*"\/wpi"[\s\S]*?enUS:\s*"\/us\/courses"/
    );
  });

  it("emits en-CA, en-US, and x-default alternates", () => {
    expect(pageSsrSource).toContain('hreflang="en-CA"');
    expect(pageSsrSource).toContain('hreflang="en-US"');
    expect(pageSsrSource).toContain('hreflang="x-default"');
  });

  it("switches og:locale for /us pages", () => {
    expect(pageSsrSource).toMatch(/isUsPage[\s\S]*?en_US/);
  });
});
