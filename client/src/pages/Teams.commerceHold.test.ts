import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Teams.tsx", import.meta.url), "utf8");

describe("Teams clean-launch hold", () => {
  it("shows current individual availability without reopening organization checkout", () => {
    expect(source).toContain("35 released water and wastewater courses");
    expect(source).toContain("19,024 learner-ready questions");
    expect(source).toContain("500-question Ontario 309A bank");
    expect(source).toContain("Organization pricing stays paused");
    expect(source).toContain("No checkout or payment is taken today.");
  });
});
