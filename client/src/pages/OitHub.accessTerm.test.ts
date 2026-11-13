import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("OIT hub access term", () => {
  it("describes a 12-month pass rather than permanent access", () => {
    const source = readFileSync(new URL("./OitHub.tsx", import.meta.url), "utf8");
    expect(source).toMatch(/A 12-month\s+pass for one selected OIT course is CA\$49/);
    expect(source).toContain("12 months of access for one named learner from successful payment");
    expect(source).not.toMatch(/permanent\s+pass/i);
  });
});
