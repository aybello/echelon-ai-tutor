import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const teamsSource = readFileSync(new URL("../client/src/pages/Teams.tsx", import.meta.url), "utf8");

describe("Teams page clean-launch state", () => {
  it("pauses organization sales without publishing unsupported proof points", () => {
    expect(teamsSource).toContain("Teams access is being rebuilt for the clean launch.");
    expect(teamsSource).toContain("Individual OIT Water and OIT Wastewater passes are live.");
    expect(teamsSource).toContain("No checkout or payment is taken today.");
    expect(teamsSource).toContain("972 verified OIT questions");
    expect(teamsSource).not.toContain('value: "25"');
    expect(teamsSource).not.toContain('value: "105"');
    expect(teamsSource).not.toContain('value: "18,885"');
    expect(teamsSource).not.toContain("Trusted by <span");
  });
});
