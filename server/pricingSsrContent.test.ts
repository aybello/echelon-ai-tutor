/**
 * The crawlable SSR body served to Googlebot for /, /pricing, and /oit
 * has to actually contain the prices and CTAs — not just render them on
 * the client after hydration.
 *
 * These tests pin the crawlable content so a future refactor of the client
 * pricing UI can't accidentally revert the SSR body to prose-only.
 */
import { describe, expect, it } from "vitest";
import { STATIC_PAGE_META } from "./pageSsr";
import { INDIVIDUAL_PRICES_CAD, TEAMS_ALL_ACCESS_PRICE_CENTS } from "../shared/pricingCatalogue";

function bodyFor(path: string): string {
  const page = STATIC_PAGE_META.find(m => m.path === path);
  if (!page) throw new Error(`No SSR page for ${path}`);
  return page.bodyHtml;
}

describe("/pricing SSR body", () => {
  const body = bodyFor("/pricing");

  it("shows the Ontario OIT price (CA$49)", () => {
    expect(body).toMatch(/CA\$49/);
  });

  it("shows every tier price a user might buy", () => {
    for (const price of ["49", "99", "149", "249", "299"]) {
      expect(body).toContain(`CA$${price}`);
    }
  });

  it("shows the Teams All-Access price and links to /teams", () => {
    const price = (TEAMS_ALL_ACCESS_PRICE_CENTS / 100).toString();
    expect(body).toContain(`CA$${price}`);
    expect(body).toMatch(/href="[^"]*\/teams"/);
  });

  it("shows the volume discount bands", () => {
    expect(body).toMatch(/10%/);
    expect(body).toMatch(/15%/);
    expect(body).toMatch(/20%/);
  });

  it("shows a free trial CTA with 'no account or credit card'", () => {
    expect(body).toMatch(/15 questions free/i);
    expect(body).toMatch(/no account or credit card/i);
  });

  it("links to the free preview quizzes", () => {
    expect(body).toMatch(/href="[^"]*\/quiz"/);
    expect(body).toMatch(/href="[^"]*\/oit-ww"/);
  });

  it("states the correct refund policy (7 days, 50 questions)", () => {
    expect(body).toMatch(/7-day refund/);
    expect(body).toMatch(/50 questions/);
  });

  it("does not misrepresent the refund window as 'money-back' or unlimited", () => {
    expect(body).not.toMatch(/money.back guarantee/i);
    expect(body).not.toMatch(/full refund at any time/i);
  });

  it("shows the WPI course tier prices", () => {
    // WPI Class I is CA$149 (matches canonical catalogue)
    expect(INDIVIDUAL_PRICES_CAD["wpi-class1-water"]).toBe(14900);
    // Prices live in separate <td> cells, so we look for the row starting
    // with 'Class I' and ending with the expected price on the same row.
    expect(body).toMatch(/Class I[^\n]*CA\$149/);
    expect(body).toMatch(/Class IV[^\n]*CA\$299/);
  });
});

describe("/oit SSR body (new page, was a 404)", () => {
  const body = bodyFor("/oit");

  it("exists at /oit", () => {
    expect(STATIC_PAGE_META.find(m => m.path === "/oit")).toBeDefined();
  });

  it("links to both free OIT previews (Water and Wastewater)", () => {
    expect(body).toMatch(/href="[^"]*\/quiz"/);
    expect(body).toMatch(/href="[^"]*\/oit-ww"/);
  });

  it("links to the OIT mock exams and flashcards", () => {
    expect(body).toMatch(/href="[^"]*\/oit-mock"/);
    expect(body).toMatch(/href="[^"]*\/oit-ww-mock"/);
    expect(body).toMatch(/href="[^"]*\/oit-water-flashcards"/);
    expect(body).toMatch(/href="[^"]*\/oit-ww-flashcards"/);
  });

  it("links to pricing and to the Ontario course catalogue", () => {
    expect(body).toMatch(/href="[^"]*\/pricing"/);
    expect(body).toMatch(/href="[^"]*\/canada\/ontario"/);
  });

  it("mentions OWWCO as the authority and includes the independence disclosure", () => {
    expect(body).toMatch(/OWWCO/);
    expect(body).toMatch(/independent/i);
  });

  it("mentions the CA$49 OIT price", () => {
    expect(body).toMatch(/CA\$49/);
  });
});

describe("/ (homepage) SSR body pricing at-a-glance", () => {
  const body = bodyFor("/");

  it("now includes a Pricing at a Glance section", () => {
    expect(body).toMatch(/Pricing at a Glance/i);
  });

  it("shows at least the Ontario OIT price on the homepage body", () => {
    expect(body).toMatch(/CA\$49/);
  });

  it("links to /pricing and /oit", () => {
    expect(body).toMatch(/href="[^"]*\/pricing"/);
    expect(body).toMatch(/href="[^"]*\/oit"/);
  });
});
