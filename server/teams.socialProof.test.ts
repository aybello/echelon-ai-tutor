import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const teamsSource = readFileSync(new URL("../client/src/pages/Teams.tsx", import.meta.url), "utf8");

describe("Teams page clean-launch state", () => {
  it("offers the launched team products without publishing unsupported proof points", () => {
    expect(teamsSource).toContain("Echelon for Teams");
    expect(teamsSource).toContain("Stripe checkout and paid invoice");
    expect(teamsSource).toContain("Teams Annual");
    expect(teamsSource).toContain("Teams Flex");
    expect(teamsSource).not.toContain("No checkout or payment is taken today.");
    expect(teamsSource).not.toContain('value: "25"');
    expect(teamsSource).not.toContain('value: "105"');
    expect(teamsSource).not.toContain('value: "18,885"');
    expect(teamsSource).not.toContain("Trusted by <span");
  });
});
