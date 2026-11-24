import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INDIVIDUAL_PRODUCTS } from "../../../shared/products";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const standard = INDIVIDUAL_PRODUCTS.filter(product => !product.key.startsWith("us-"));
const pricing = read("client/src/pages/Pricing.tsx");

function pricingBlock(key: string) {
  const start = pricing.indexOf(`    key: "${key}",`);
  expect(start, `Missing pricing card for ${key}`).toBeGreaterThan(-1);
  return pricing.slice(start, pricing.indexOf("\n  },", start));
}

describe("released standard-course question copy", () => {
  it("advertises the verified lower bound on all 35 standard catalogue and pricing entries", () => {
    expect(standard).toHaveLength(35);
    for (const product of standard) {
      expect(product.description, product.key).toContain("1,000+");
      expect(pricingBlock(product.key), product.key).toContain('features: ["1,000+ practice questions"');
    }
  });

  it("leaves the separate dedicated US inventories unchanged", () => {
    for (const [key, count] of [["us-class1-water", 200], ["us-class1-water-dist", 198], ["us-texas-class-d-water", 120]] as const) {
      expect(INDIVIDUAL_PRODUCTS.find(product => product.key === key)?.description).toContain(`${count} original questions`);
      expect(pricingBlock(key)).toContain(`${count} original practice questions`);
      expect(pricingBlock(key)).not.toContain("1,000+");
    }
  });

  it("removes old static bank claims from standard quiz, hub, mock-intro and province copy", () => {
    const files = readdirSync(join(process.cwd(), "client/src/pages"))
      .filter(file => /^(?:Class\d\w*|WpiClass\d\w*|OIT\w*|WQA\w*|OitHub)\.tsx$/.test(file));
    for (const file of files) {
      expect(read(`client/src/pages/${file}`), file).not.toMatch(/\b(?:400\+|[2-9]\d\d) (?:questions|Questions|[^"`\n]{0,55}questions — unlimited attempts)/);
    }
    expect(read("client/src/lib/provinceConfig.ts")).not.toMatch(/\b(?:400\+|500) questions/);
  });

  it("labels all 16 WPI cards with a lower bound and keeps flashcard counts separate", () => {
    const wpi = read("client/src/pages/WpiLanding.tsx");
    expect(wpi.match(/questions: 1000/g)).toHaveLength(16);
    expect(wpi).toContain('{cls.questions.toLocaleString("en-CA")}+ questions');
    expect(wpi).toContain('"16,000+", "Practice questions across 16 banks"');
    expect(wpi).toContain("1,000+ adaptive practice questions");
    expect(wpi).toContain("400+ flashcards");
  });

  it("scopes the homepage claim rather than promising 1,000 for every course", () => {
    const discovery = read("client/src/components/HomepageCourseDiscovery.tsx");
    expect(discovery).toContain("35 standard Ontario and WPI course banks each include 1,000+ practice questions");
    expect(discovery).toContain("Other course totals vary.");
    expect(discovery).toContain('href="/electrician-309a"');
  });

  it("preserves separate 309A inventory and mock length and OIT flashcard and mock counts", () => {
    const ssr = read("server/pageSsr.ts");
    expect(ssr).toContain("500 original practice questions");
    expect(ssr).toContain("1,000+ practice questions, 400+ flashcards");
    expect(ssr).toContain("a timed 100-question mock exam");
    expect(read("client/src/pages/OitHub.tsx")).toContain("400+ concept flashcards");
  });

  it("keeps generic enrollment emails course-scoped without a universal numeric promise", () => {
    const email = read("server/email.ts");
    expect(email).toContain("Your full course-specific practice question bank");
    expect(email).toContain("Full practice question bank for your assigned course");
    expect(email).not.toMatch(/(?:400\+|1,000\+) (?:practice )?questions per (?:course|exam level)/);
  });
});
