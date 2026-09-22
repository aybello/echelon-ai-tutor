import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const journeyChecks = readFileSync(resolve(process.cwd(), "scripts/journey-checks.py"), "utf8");
const documentHead = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("daily live journey checks", () => {
  it("checks the current Individual Exam Pass picker rather than retired subscription cards", () => {
    expect(journeyChecks).toContain('"#individual-course-picker"');
    expect(journeyChecks).toContain("text=Choose your Individual Exam Pass");
    expect(journeyChecks).toContain('"12 months of access from successful payment"');
    expect(journeyChecks).not.toContain('"View individual practice passes"');
    expect(journeyChecks).not.toContain('"Annual All-Access"');
  });

  it("does not add inline document-head event handlers that production CSP blocks", () => {
    expect(documentHead).toContain('rel="stylesheet"');
    expect(documentHead).not.toMatch(/\son[a-z]+\s*=/i);
  });
});
