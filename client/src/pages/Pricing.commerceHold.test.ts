import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Pricing.tsx", import.meta.url), "utf8");

describe("Pricing commercial availability", () => {
  it("states the live individual and Teams access terms accurately", () => {
    expect(source).toContain("12 months of access from successful payment");
    expect(source).toContain("Teams Flex supports 3- or 6-month course-specific licences");
    expect(source).toContain("Teams Annual supports year-round organizational access by stream");
    expect(source).not.toContain("Team purchasing is temporarily paused");
  });

  it("routes the Team buyer path to the Teams plan builder", () => {
    expect(source).toContain('window.location.href = "/teams"');
  });
});
