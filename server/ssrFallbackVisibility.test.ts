import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const template = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("SSR fallback visibility", () => {
  it("hides crawl fallback content before React can replace the root", () => {
    expect(template).toMatch(/\[data-ssr-fallback="true"\]\s*\{[\s\S]*?display:\s*none;/);
  });

  it("keeps the fallback available for visitors without JavaScript", () => {
    expect(template).toContain('<style>[data-ssr-fallback="true"] { display: block !important; }</style>');
  });
});
