import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  INDIVIDUAL_REFUND_QUESTION_LIMIT,
  INDIVIDUAL_REFUND_SUMMARY,
  REFUND_CONTACT_EMAIL,
  TEAM_REFUND_SUMMARY,
} from "../shared/refundPolicy";
import { STATIC_PAGE_META } from "./pageSsr";

const source = (relativePath: string) => fs.readFileSync(
  path.resolve(process.cwd(), relativePath),
  "utf8",
);

describe("public trust content", () => {
  it("keeps the OIT seed guide free of the known unsafe exam claims", () => {
    const guide = source("server/scripts/seedBlog.mjs");

    expect(guide).toContain("up to four areas");
    expect(guide).toContain("97 to 389 mg·min/L");
    expect(guide).toContain("Health Canada's free-chlorine table</a>");
    expect(guide).toContain("https://owwco.ca/preparing-for-your-exam/");
    expect(guide).not.toMatch(/CT of 0\.2 mg·min\/L achieves/i);
    expect(guide).not.toMatch(/The Six Exam Modules/i);
    expect(guide).not.toMatch(/without a formula sheet/i);
    expect(guide).not.toMatch(/all formulas must be memorized/i);
    expect(guide).not.toMatch(/40 to 60 hours studying/i);
  });

  it("ships a forward correction for the existing published OIT article", () => {
    const migration = source("drizzle/0061_correct_oit_guide.sql");

    expect(migration).toContain("how-to-pass-ontario-oit-water-exam");
    expect(migration).toContain("up to four areas");
    expect(migration).toContain("97 to 389 mg·min/L");
    expect(migration).toContain("Health Canada''s free-chlorine table</a>");
    expect(migration).toContain("formula/conversion tables");
  });

  it("uses one unambiguous refund threshold and contact", () => {
    expect(INDIVIDUAL_REFUND_QUESTION_LIMIT).toBe(50);
    expect(INDIVIDUAL_REFUND_SUMMARY).toMatch(/fewer than 50 questions/i);
    expect(TEAM_REFUND_SUMMARY).toMatch(/no operator seat or Course Pass has been assigned or activated/i);
    expect(REFUND_CONTACT_EMAIL).toBe("abello@echeloninstitute.ca");

    for (const pagePath of ["/pricing", "/refund"]) {
      const page = STATIC_PAGE_META.find(candidate => candidate.path === pagePath);
      expect(page?.bodyHtml, pagePath).toContain(INDIVIDUAL_REFUND_SUMMARY);
    }

    const publicPages = [
      "client/src/pages/Landing.tsx",
      "client/src/pages/Pricing.tsx",
      "client/src/pages/Refund.tsx",
      "client/src/pages/Terms.tsx",
    ].map(source).join("\n");
    expect(publicPages).not.toMatch(/up to 50 questions|more than 50 questions|haven't completed more than 50 questions/i);
    expect(publicPages).not.toContain("support@echeloninstitute.ca");
  });
});
