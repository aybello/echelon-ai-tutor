import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Teams.tsx", import.meta.url), "utf8");

describe("Teams commercial launch", () => {
  it("offers annual and Flex checkout flows with the approved licence terms", () => {
    expect(source).toContain("Teams Annual");
    expect(source).toContain("Teams Flex");
    expect(source).toContain("Combine 3- and 6-month licences in one order.");
    expect(source).toContain("one named operator");
    expect(source).toContain("createTeamCheckout.mutate");
    expect(source).toContain("FlexOrderBuilder");
  });
});
