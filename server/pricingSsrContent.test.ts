import { describe, expect, it } from "vitest";
import {
  INDIVIDUAL_PRICES_CAD,
  TEAMS_ALL_ACCESS_PRICE_CENTS,
} from "../shared/pricingCatalogue";
import { STATIC_PAGE_META } from "./pageSsr";

function bodyFor(path: string): string {
  const page = STATIC_PAGE_META.find(candidate => candidate.path === path);
  if (!page?.bodyHtml) throw new Error(`No SSR body for ${path}`);
  return page.bodyHtml;
}

describe("crawlable pricing", () => {
  const body = bodyFor("/pricing");

  it("renders every individual price tier from the canonical catalogue", () => {
    const priceTiers = new Set(Object.values(INDIVIDUAL_PRICES_CAD));
    for (const cents of priceTiers) {
      expect(body).toContain(`CA$${cents / 100}`);
    }
  });

  it("distinguishes Course Pass from All-Access", () => {
    expect(body).toContain("Teams Course Pass");
    expect(body).toContain("Teams All-Access");
    expect(body).toContain(`CA$${TEAMS_ALL_ACCESS_PRICE_CENTS / 100}`);
    expect(body).toMatch(/requires at least 5 operators/i);
    expect(body).toMatch(/one certification course/i);
  });

  it("states the graduated discounts and exact refund limits", () => {
    expect(body).toMatch(/10% off/);
    expect(body).toMatch(/15% off/);
    expect(body).toMatch(/20% off/);
    expect(body).toMatch(/within 7 days/);
    expect(body).toMatch(/fewer than 50 questions/);
    expect(body).toMatch(/no seats have been activated/);
  });

  it("links directly to free previews with no account or card", () => {
    expect(body).toMatch(/href="[^"]*\/quiz"/);
    expect(body).toMatch(/href="[^"]*\/oit-ww"/);
    expect(body).toMatch(/no account or credit card/i);
  });

  it("does not overstate question inventory or spaced repetition", () => {
    expect(body).not.toMatch(/over 500|500\+/i);
    expect(body).not.toMatch(/spaced repetition/i);
    expect(body).toMatch(/400\+ practice questions/i);
  });
});

describe("Ontario OIT hub SSR", () => {
  const body = bodyFor("/oit");

  it("has direct routes for both practice streams and study modes", () => {
    for (const path of [
      "/quiz",
      "/oit-ww",
      "/oit-mock",
      "/oit-ww-mock",
      "/oit-water-flashcards",
      "/oit-ww-flashcards",
    ]) {
      expect(body).toContain(`href="https://echeloninstitute.ca${path}"`);
    }
  });

  it("states product scope, price, access term, and independence", () => {
    expect(body).toContain("CA$49");
    expect(body).toMatch(/12 months of access for one named learner/i);
    expect(body).toMatch(/one selected OIT course/i);
    expect(body).toMatch(/OWWCO/);
    expect(body).toMatch(/independent exam-preparation provider/i);
  });

  it("links to pricing and the complete Ontario catalogue", () => {
    expect(body).toContain('href="https://echeloninstitute.ca/pricing"');
    expect(body).toContain('href="https://echeloninstitute.ca/canada/ontario"');
  });
});

describe("public inventory claims", () => {
  it("does not overstate the homepage or FAQ question count", () => {
    const homepage = bodyFor("/");
    expect(homepage).not.toMatch(/over 500|500\+/i);
    expect(homepage).toMatch(/400\+ practice questions/i);

    const faq = STATIC_PAGE_META.find(page => page.path === "/faq");
    expect(faq?.jsonLd).not.toMatch(/over 500|500\+/i);
  });
});
