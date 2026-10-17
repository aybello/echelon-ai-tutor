import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../.github/workflows/quality.yml", import.meta.url), "utf8");

describe("CI browser runtime prerequisites", () => {
  it("installs the pinned Chromium runtime before browser-backed unit tests", () => {
    const install = workflow.indexOf("run: pnpm exec playwright install --with-deps chromium");
    const tests = workflow.indexOf("- name: Deterministic unit and acceptance tests");
    expect(install).toBeGreaterThan(0);
    expect(tests).toBeGreaterThan(install);
    expect(workflow.match(/run: pnpm exec playwright install --with-deps chromium/g)).toHaveLength(1);
  });

  it("does not bypass the recovery browser test to make CI green", () => {
    const phase = workflow.slice(workflow.indexOf("- name: Deterministic unit and acceptance tests"),
      workflow.indexOf("- name: Database-backed access, OTP and Stripe lifecycle tests"));
    expect(phase).toContain("pnpm exec vitest run");
    expect(phase).not.toContain("--exclude client/src/lib/practiceSaveRecovery.browser.test.ts");
    expect(phase).not.toContain("continue-on-error");
  });
});
