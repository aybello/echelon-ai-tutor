import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Business rule, set by the owner and repeatedly enforced:
 * a municipal or employer lead must never be steered toward an individual plan.
 * The team page is the employer surface, so it must not advertise individual
 * passes or link into the individual pricing page.
 *
 * This existed as a convention held in people's heads, and it was violated in
 * production: the team page carried "Buying for one learner? View 12-month
 * Individual Exam Passes" linking to /pricing. This test makes the rule
 * enforceable instead of remembered.
 */
const TEAMS_PAGE = readFileSync(
  join(process.cwd(), "client/src/pages/Teams.tsx"),
  "utf8"
);

describe("employer surfaces never divert to individual plans", () => {
  it("does not advertise individual passes on the team page", () => {
    const banned = [
      "Individual Exam Pass",
      "Buying for one learner",
      "individual plan",
    ];
    const found = banned.filter(phrase => TEAMS_PAGE.includes(phrase));
    expect(found).toEqual([]);
  });

  it("does not link the employer page into individual pricing", () => {
    // A municipal buyer sent to /pricing sees per-learner plans and leaves the
    // team purchase flow, which loses the larger B2B order.
    expect(TEAMS_PAGE).not.toMatch(/href=["']\/pricing["']/);
  });

  it("shows no test fixture data to a paying buyer", () => {
    // A placeholder like a fixture address signals an unfinished product to a
    // municipality evaluating a purchase.
    expect(TEAMS_PAGE).not.toMatch(/fixture-\d+@/);
    expect(TEAMS_PAGE).not.toMatch(/@example\.com/);
  });
});
