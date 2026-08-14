import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const teamsSource = readFileSync(new URL("../client/src/pages/Teams.tsx", import.meta.url), "utf8");

describe("Teams page public proof points", () => {
  it("uses product-led proof points rather than unsupported customer metrics or ratings", () => {
    expect(teamsSource).toContain('value: "Annual All-Access"');
    expect(teamsSource).toContain('value: "Course Passes"');
    expect(teamsSource).toContain('value: "Team dashboard"');
    expect(teamsSource).toContain("Built for");
    expect(teamsSource).not.toContain('value: "25"');
    expect(teamsSource).not.toContain('value: "105"');
    expect(teamsSource).not.toContain('value: "18,885"');
    expect(teamsSource).not.toContain("Trusted by <span");
  });
});
