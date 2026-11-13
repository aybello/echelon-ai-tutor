import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("blue redesign purchase and accessibility safeguards", () => {
  it("keeps the Flex checkout action visibly styled and labels purchase controls", () => {
    const flex = read("client/src/components/FlexOrderBuilder.tsx");
    const css = read("client/src/styles/TeamsRedesign.css");
    expect(flex).toMatch(/className="teams-checkout-button[^"\n]*"\s+onClick=\{handleSubmit\}/);
    expect(css).toMatch(/\.teams-checkout-button[\s\S]*?background:\s*var\(--teams-teal\)\s*!important/);
    for (const name of ["flex-organization-name", "flex-billing-email"]) expect(flex).toContain(name);
    expect(flex).toContain('aria-label={`Course for row ${index + 1}`}');
    expect(flex).toContain('aria-label={`Quantity for row ${index + 1}`}');
  });
  it("gives U.S. pricing disclosure and navigation a stable readable section", () => {
    const page = read("client/src/pages/USLanding.tsx");
    const css = read("client/src/styles/PublicRedesign.css");
    expect(page).toContain('className="us-landing-cta"');
    expect(page).toContain('href="/pricing?country=US"');
    expect(page).toContain('Prices are in Canadian dollars (CAD).');
    expect(css).toContain('.public-redesign-us-landing > .us-landing-cta');
    expect(css).toContain('.public-redesign-us-landing .us-landing-cta-disclosure a');
  });
  it("keeps shared accent and text tokens consistent with the approved blue", () => {
    const css = read("client/src/index.css");
    expect(css).toContain('--primary: #1757b8');
    expect(css).toContain('--echelon-ink: #000000');
    expect(css).toContain('--echelon-muted: #000000');
  });
  it("exposes the pricing FAQ state and preserves a readable availability badge", () => {
    const page = read("client/src/pages/Pricing.tsx");
    expect(page).toMatch(/function FAQItem[\s\S]*?aria-expanded=\{open\}/);
    expect(page).toContain('product.badgeColor === "#16A34A" ? "#166534"');
  });
});
