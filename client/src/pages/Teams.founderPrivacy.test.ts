import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { customers } from "../lib/trustedOrganizations";

describe("Teams page privacy", () => {
  it("does not display the unrelated founder and AfroPuppyYoga profile", () => {
    const teams = readFileSync(join(process.cwd(), "client/src/pages/Teams.tsx"), "utf8");
    expect(teams).not.toMatch(/teams-founder-band|Built by a founder who has done this before/i);
    expect(teams).not.toMatch(/AfroPuppyYoga|Ayoola Bello/i);
    expect(teams).toContain("Choose the right team product");
    expect(teams).toContain('import TrustedOrganizations from "@/components/TrustedOrganizations"');
    expect(teams).toContain("<TrustedOrganizations />");
    expect(teams).not.toContain("teams-customer-proof-names");
    expect(customers.map(customer => customer.name)).toEqual([
      "Utilities Kingston", "City of Winnipeg", "City of Quinte West", "City of Peterborough",
    ]);
    expect(customers.every(customer => customer.logoDisplayAllowed === true)).toBe(true);
    expect(customers.some(customer => /BEA|Black Entrepreneurship Alliance/i.test(customer.name))).toBe(false);
  });
});
