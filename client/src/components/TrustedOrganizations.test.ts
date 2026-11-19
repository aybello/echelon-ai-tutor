import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrustedOrganizations from "./TrustedOrganizations";
import { customers } from "@/lib/trustedOrganizations";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

const render = () => renderToStaticMarkup(React.createElement(TrustedOrganizations));
const css = readFileSync(new URL("./TrustedOrganizations.css", import.meta.url), "utf8");
const source = readFileSync(new URL("./TrustedOrganizations.tsx", import.meta.url), "utf8");
const customerLists = (html: string) => [...html.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/g)];

describe("homepage trusted organizations", () => {
  it("lists exactly the three requested customer organizations in the original list", () => {
    expect(customers.map(item => item.name)).toEqual([
      "Utilities Kingston", "City of Winnipeg", "City of Quinte West",
    ]);
    const html = render();
    const customerGroup = html.split('class="trusted-organizations-customers"')[1].split('class="trusted-organizations-supporter"')[0];
    expect(customerGroup).toContain('aria-labelledby="trusted-organizations-title"');
    expect(customerGroup).toContain(">Trusted by</h2>");
    expect(customerGroup).toContain("Used by operators and teams at");
    const [original] = customerLists(customerGroup);
    expect(original[0]).not.toContain("aria-hidden");
    expect(original[1].match(/<li>/g)).toHaveLength(3);
    for (const customer of customers) expect(original[1]).toContain(`<figcaption>${customer.name}</figcaption>`);
    expect(customerGroup).not.toContain("Black Entrepreneurship Alliance");
  });

  it("duplicates only customers in an identical non-interactive, aria-hidden presentation list", () => {
    const lists = customerLists(render());
    expect(lists).toHaveLength(2);
    const [original, clone] = lists;
    expect(clone[0]).toContain('aria-hidden="true" role="presentation"');
    expect(clone[1]).toBe(original[1]);
    expect(clone[1].match(/<li>/g)).toHaveLength(3);
    expect(clone[1]).not.toMatch(/<(?:a|button|input|select|textarea)\b|tabindex|\bid=/i);
  });

  it("removes BEA and the supporter section entirely", () => {
    expect(render()).not.toMatch(/Black Entrepreneurship Alliance|bea_560997bf|Supported by|trusted-organizations-supporter/);
    expect(render()).toContain('aria-label="Customer organizations"');
    const data = readFileSync(new URL("../lib/trustedOrganizations.json", import.meta.url), "utf8");
    expect(data).not.toMatch(/black-entrepreneurship-alliance|bea_560997bf/);
    expect(render()).not.toMatch(/endorsed|official partner|funded by|applied to|Startup Canada|Black Founders Network/i);
  });

  it("uses managed official assets with meaningful alt text, dimensions and persistent labels", () => {
    const html = render();
    expect(html.match(/<img /g)).toHaveLength(6);
    for (const organization of customers) {
      expect(organization.runtimeUrl).toMatch(/^\/manus-storage\/[\w.-]+$/);
      expect(organization.sourcePage).toMatch(/^https:\/\//);
      expect(organization.sourceAsset).toMatch(/^https:\/\//);
      expect(organization.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(organization.width).toBeGreaterThan(0);
      expect(organization.height).toBeGreaterThan(0);
      expect(organization.logoDisplayAllowed).toBe(true);
      expect(Object.keys(organization).sort()).toEqual([
        "height", "logoDisplayAllowed", "name", "runtimeUrl", "sha256", "slug", "sourceAsset", "sourcePage", "width",
      ]);
      expect(html).toContain(`src="${organization.runtimeUrl}"`);
      expect(html).toContain(`alt="${organization.name} logo"`);
      expect(html).toContain(`width="${organization.width}" height="${organization.height}"`);
      expect(html).toContain(`<figcaption>${organization.name}</figcaption>`);
    }
    expect(html.match(/loading="eager" decoding="async"/g)).toHaveLength(6);
    expect(html).not.toContain("<a ");
    expect(source).not.toMatch(/onError|useEffect|IntersectionObserver|ResizeObserver|setTimeout|setInterval|requestAnimationFrame|carousel|scrollIntoView/);
  });

  it.each([false, undefined, "true"])("withholds original and cloned marks unless the display flag is strict true (%s)", flag => {
    const winnipeg = customers.find(item => item.slug === "city-of-winnipeg")!;
    const allowed = winnipeg.logoDisplayAllowed;
    try {
      Object.assign(winnipeg, { logoDisplayAllowed: flag });
      const html = render();
      expect(html.match(/<img /g)).toHaveLength(4);
      expect(html).not.toContain(`src="${winnipeg.runtimeUrl}"`);
      for (const list of customerLists(html)) expect(list[1]).toContain("<figcaption>City of Winnipeg</figcaption>");
      expect(html).not.toMatch(/permission|pending|written|legal/i);
    } finally {
      winnipeg.logoDisplayAllowed = allowed;
    }
  });

  it("offers a native, unpressed pause control with explicit toggle labels", () => {
    expect(render()).toContain('data-paused="false"');
    expect(render()).toMatch(/<button type="button" class="trusted-organizations-pause" aria-pressed="false">Pause logo animation<\/button>/);
    expect(source).toContain('paused ? "Resume logo animation" : "Pause logo animation"');
    expect(source).toContain("setPaused(value => !value)");
    expect(css).toContain(".trusted-organizations-pause:focus-visible");
    expect(css).toContain(".trusted-organizations-customers:hover .trusted-organizations-list");
    expect(css).toContain(".trusted-organizations-customers:focus-within .trusted-organizations-list");
    expect(css).toContain('.trusted-organizations-customers[data-paused="true"] .trusted-organizations-list { animation-play-state: paused; }');
  });

  it("uses equal viewport-filling groups and a transform-only 24-second seamless loop", () => {
    expect(css).toContain(".trusted-organizations-track { display: flex; width: 100%; }");
    expect(css).toMatch(/\.trusted-organizations-list\s*\{[^}]*flex-shrink: 0;[^}]*min-width: 100%;[^}]*width: max-content;[^}]*padding: 0 20px 0 0;/);
    expect(css).toContain("animation: trusted-organizations-marquee 24s linear infinite");
    expect(css).toContain("from { transform: translateX(0); }");
    expect(css).toContain("to { transform: translateX(-100%); }");
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".trusted-organizations-viewport { overflow: visible; }");
    expect(css).toContain(".trusted-organizations-list[aria-hidden=\"true\"], .trusted-organizations-pause { display: none; }");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none;\s*transform: none;/);
  });

  it("keeps full-color contained marks on white without an empty supporter column", () => {
    expect(css).toContain("background: #fff");
    expect(css).toContain("color: #000");
    expect(css).toContain("object-fit: contain");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toMatch(/\.trusted-organizations-inner\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
    expect(css).toMatch(/\.trusted-organizations-mark--city-of-winnipeg \.trusted-organizations-logo\s*\{[^}]*padding: 12px 20%/);
    expect(css).not.toContain(".trusted-organizations-supporter");
    expect(css).not.toMatch(/(?:^|[;{])\s*(?:filter|opacity)\s*:/m);
    expect(css).not.toMatch(/object-fit:\s*cover/);
  });
});
