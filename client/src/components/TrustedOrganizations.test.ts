import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrustedOrganizations from "./TrustedOrganizations";
import { customers, supporter } from "@/lib/trustedOrganizations";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

const render = () => renderToStaticMarkup(React.createElement(TrustedOrganizations));
const css = readFileSync(new URL("./TrustedOrganizations.css", import.meta.url), "utf8");
const source = readFileSync(new URL("./TrustedOrganizations.tsx", import.meta.url), "utf8");

describe("homepage trusted organizations", () => {
  it("lists exactly the three requested customer organizations", () => {
    expect(customers.map(item => item.name)).toEqual([
      "Utilities Kingston", "City of Winnipeg", "City of Quinte West",
    ]);
    const html = render();
    const customerGroup = html.split('class="trusted-organizations-customers"')[1].split('class="trusted-organizations-supporter"')[0];
    expect(customerGroup).toContain('aria-labelledby="trusted-organizations-title"');
    expect(customerGroup).toContain(">Trusted by</h2>");
    expect(customerGroup).toContain("Used by operators and teams at");
    expect(customerGroup.match(/<li>/g)).toHaveLength(3);
    for (const customer of customers) expect(customerGroup).toContain(`<figcaption>${customer.name}</figcaption>`);
    expect(customerGroup).not.toContain("Black Entrepreneurship Alliance");
  });

  it("labels BEA as support, never as a customer, funder or endorsement", () => {
    expect(supporter.name).toBe("Black Entrepreneurship Alliance");
    expect(customers).not.toContainEqual(supporter);
    const supportGroup = render().split('class="trusted-organizations-supporter"')[1];
    expect(supportGroup).toContain('aria-labelledby="supported-organizations-title"');
    expect(supportGroup).toContain(">Supported by</h2>");
    expect(supportGroup).toContain("Black Entrepreneurship Alliance");
    expect(supportGroup).not.toContain("Trusted by");
    expect(render()).not.toMatch(/endorsed|official partner|funded by|applied to|Startup Canada|Black Founders Network/i);
  });

  it("uses managed official assets with meaningful alt text, dimensions and persistent labels", () => {
    const html = render();
    expect(html.match(/<img /g)).toHaveLength(4);
    for (const organization of [...customers, supporter]) {
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
    expect(html.match(/loading="eager" decoding="async"/g)).toHaveLength(4);
    expect(html).not.toContain("<a ");
    expect(source).not.toMatch(/onError|useEffect|IntersectionObserver|setTimeout|carousel|scrollIntoView/);
  });

  it.each([false, undefined, "true"])("withholds a mark unless its display flag is strict true (%s)", flag => {
    const winnipeg = customers.find(item => item.slug === "city-of-winnipeg")!;
    const allowed = winnipeg.logoDisplayAllowed;
    try {
      Object.assign(winnipeg, { logoDisplayAllowed: flag });
      const html = render();
      expect(html.match(/<img /g)).toHaveLength(3);
      expect(html).not.toContain(`src="${winnipeg.runtimeUrl}"`);
      expect(html).toContain("<figcaption>City of Winnipeg</figcaption>");
      expect(html).not.toMatch(/permission|pending|written|legal/i);
    } finally {
      winnipeg.logoDisplayAllowed = allowed;
    }
  });

  it("keeps full-color contained marks on white with a separate mobile support row", () => {
    expect(css).toContain("background: #fff");
    expect(css).toContain("color: #000");
    expect(css).toContain("object-fit: contain");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toContain("border-left: 1px solid");
    expect(css).toMatch(/\.trusted-organizations-mark--city-of-winnipeg \.trusted-organizations-logo\s*\{[^}]*padding: 12px 20%/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.trusted-organizations-supporter\s*\{[^}]*border-left: 0;[^}]*border-top: 1px solid/);
    expect(css).not.toMatch(/(?:^|[;{])\s*(?:filter|opacity|animation|transform)\s*:/m);
    expect(css).not.toMatch(/object-fit:\s*cover/);
  });
});
