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

  it("waits for asynchronous account and flashcard content instead of relying on short fixed delays", () => {
    expect(journeyChecks).toContain('page.wait_for_url("**/login/otp**", timeout=TIMEOUT)');
    expect(journeyChecks).toContain('page.get_by_test_id("flashcard-study-card")');
    expect(journeyChecks).toContain('page.get_by_test_id("flashcard-prompt")');
    expect(journeyChecks).toContain("selector => Boolean(document.querySelector(selector)?.textContent?.trim())");
    expect(journeyChecks).toContain("Flashcard study card rendered without prompt content");
  });

  it("preserves failed child-runner output in the daily health report", () => {
    const healthCheck = readFileSync(resolve(process.cwd(), "scripts/daily-health-check.mjs"), "utf8");
    expect(healthCheck).toContain("error?.stdout");
    expect(healthCheck).toContain("error?.stderr");
    expect(healthCheck).toContain("Journey runner exited unsuccessfully:");
    expect(healthCheck).toContain("const FAILURE_DETAIL_LIMIT = 2_000;");
    expect(healthCheck).toContain("function formatFailureDetail(err)");
  });
});
