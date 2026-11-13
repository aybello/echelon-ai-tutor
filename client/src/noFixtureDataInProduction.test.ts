import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Test fixture addresses leaked into production and were visible to paying
 * customers. The team order form asked a municipality for its billing email
 * and showed "fixture-25@example.com" in the box. The same pattern appeared on
 * login, the national waitlist, partnerships, continuing education and the
 * organization dashboard.
 *
 * A buyer evaluating a purchase reads that as an unfinished product. This guard
 * fails the build if fixture-style data reaches any customer-facing screen.
 */

const CLIENT_SRC = join(process.cwd(), "client/src");

/** Fixture data generators leave these shapes behind. */
const FIXTURE_PATTERNS: { pattern: RegExp; what: string }[] = [
  { pattern: /fixture-\d+@/, what: "a generated fixture email address" },
  { pattern: /\btest-?user-?\d+@/i, what: "a generated test user address" },
  { pattern: /\blorem ipsum\b/i, what: "placeholder body copy" },
  { pattern: /\bTODO:|\bFIXME:/, what: "an unfinished-work marker in visible copy" },
];

function collectTsxFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTsxFiles(full, found);
      continue;
    }
    // Tests and generated UI primitives are not customer-facing screens.
    if (!entry.endsWith(".tsx")) continue;
    if (entry.includes(".test.")) continue;
    if (full.includes(join("components", "ui"))) continue;
    found.push(full);
  }
  return found;
}

describe("customer-facing screens show no test fixture data", () => {
  const files = collectTsxFiles(CLIENT_SRC);

  it("finds the customer-facing screens to check", () => {
    // Guards the scanner. If this collapses to nothing, the check below would
    // pass while inspecting an empty list.
    expect(files.length).toBeGreaterThan(20);
  });

  it("contains no fixture or placeholder artifacts", () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const { pattern, what } of FIXTURE_PATTERNS) {
        const match = source.match(pattern);
        if (match) {
          const relative = file.slice(process.cwd().length + 1);
          violations.push(`${relative}: ${what} (${match[0]})`);
        }
      }
    }

    expect(
      violations,
      `These customer-facing screens contain test fixture or placeholder data. ` +
        `A buyer sees this as an unfinished product. Replace each with real ` +
        `guidance copy:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});
