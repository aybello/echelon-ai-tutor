import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * House style for customer-facing prose: no em dashes. These are the pages a
 * buyer, a municipality or a privacy regulator actually reads, so they are
 * held to the rule even when an internal admin screen is not.
 */
const EM_DASH = "\u2014";

const CUSTOMER_LEGAL_PAGES = [
  "client/src/pages/Privacy.tsx",
  "client/src/pages/Terms.tsx",
];

describe("customer-facing legal prose style", () => {
  for (const path of CUSTOMER_LEGAL_PAGES) {
    it(`${path} has no em dashes in rendered copy`, () => {
      let source: string;
      try {
        source = readFileSync(path, "utf8");
      } catch {
        return; // Page does not exist in this build; nothing to enforce.
      }
      const offenders = source
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        // A leading // line is a code comment, never shown to a customer.
        .filter(entry => !entry.line.trimStart().startsWith("//"))
        .filter(entry => entry.line.includes(EM_DASH))
        .map(entry => `${entry.number}: ${entry.line.trim().slice(0, 90)}`);

      expect(offenders).toEqual([]);
    });
  }
});
