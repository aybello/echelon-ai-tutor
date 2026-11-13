import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Teams page privacy", () => {
  it("does not display the unrelated founder and AfroPuppyYoga profile", () => {
    const teams = readFileSync(join(process.cwd(), "client/src/pages/Teams.tsx"), "utf8");
    expect(teams).not.toMatch(/teams-founder-band|Built by a founder who has done this before/i);
    expect(teams).not.toMatch(/AfroPuppyYoga|Ayoola Bello/i);
    expect(teams).toContain("Choose the right team product");
    expect(teams).toContain("Utilities Kingston");
    expect(teams).toContain("City of Winnipeg");
  });
});
