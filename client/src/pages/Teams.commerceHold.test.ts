import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Teams.tsx", import.meta.url), "utf8");

describe("Teams commerce launch", () => {
  it("offers annual and Flex checkout without stale recovery-era hold copy", () => {
    expect(source).toContain("Teams Annual");
    expect(source).toContain("Teams Flex");
    expect(source).toContain("Stripe checkout and paid invoice");
    expect(source).toContain("Start ${seats}-seat");
    expect(source).not.toContain("Organization pricing stays paused");
    expect(source).not.toContain("No checkout or payment is taken today.");
  });
});
