import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const teamsSource = readFileSync(new URL("../client/src/pages/Teams.tsx", import.meta.url), "utf8");

describe("Teams page commercial state", () => {
  it("offers the approved Flex and Annual products without unsupported proof points", () => {
    expect(teamsSource).toContain("Teams Annual");
    expect(teamsSource).toContain("Teams Flex");
    expect(teamsSource).toContain("Combine 3- and 6-month licences in one order.");
    expect(teamsSource).toContain("Stripe checkout and paid invoice");
    expect(teamsSource).toContain("createTeamCheckout.mutate");
    expect(teamsSource).not.toContain("Trusted by <span");
  });
});
