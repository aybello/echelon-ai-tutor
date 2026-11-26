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
 *
 * It was then violated a second time, in a different file. Checking Teams.tsx
 * alone passed while the live team page still told employers that individual
 * passes were available, because the order builder it renders carried the
 * sentence. Guarding one file is not guarding the surface, so every component
 * the employer sees is checked here.
 */

/** Every file whose text reaches a buyer on the employer surface. */
const EMPLOYER_SURFACE_FILES = [
  "client/src/pages/Teams.tsx",
  "client/src/components/FlexOrderBuilder.tsx",
];

function read(file: string): string {
  return readFileSync(join(process.cwd(), file), "utf8");
}

const EMPLOYER_SURFACES = EMPLOYER_SURFACE_FILES.map(file => ({
  file,
  source: read(file),
}));

describe("employer surfaces never divert to individual plans", () => {
  it("renders only components that are themselves guarded", () => {
    // If the team page starts rendering another component, that component's
    // copy becomes employer-facing too and must be added to the list above.
    const teams = read("client/src/pages/Teams.tsx");
    const locallyImported = [
      ...teams.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@\/components\/([\w/]+)["']/g),
    ].map(match => `client/src/components/${match[2]}.tsx`);

    // Only components that actually render purchase copy matter here.
    const purchaseComponents = locallyImported.filter(path =>
      /FlexOrderBuilder|Pricing|Plan|Checkout|Order/i.test(path)
    );

    const unguarded = purchaseComponents.filter(
      path => !EMPLOYER_SURFACE_FILES.includes(path)
    );

    expect(
      unguarded,
      `The team page renders purchase copy from files that are not checked for ` +
        `individual-plan diversion. Add them to EMPLOYER_SURFACE_FILES: ` +
        unguarded.join(", ")
    ).toEqual([]);
  });

  it.each(EMPLOYER_SURFACES)(
    "does not advertise individual passes in $file",
    ({ source }) => {
      const banned = [
        "Individual Exam Pass",
        "Buying for one learner",
        "individual plan",
      ];
      const found = banned.filter(phrase => source.includes(phrase));
      expect(found).toEqual([]);
    }
  );

  it.each(EMPLOYER_SURFACES)(
    "does not link $file into individual pricing",
    ({ source }) => {
      // A municipal buyer sent to /pricing sees per-learner plans and leaves the
      // team purchase flow, which loses the larger B2B order.
      expect(source).not.toMatch(/href=["']\/pricing["']/);
    }
  );

  it.each(EMPLOYER_SURFACES)(
    "shows no test fixture data to a paying buyer in $file",
    ({ source }) => {
      // A placeholder like a fixture address signals an unfinished product to a
      // municipality evaluating a purchase.
      expect(source).not.toMatch(/fixture-\d+@/);
      expect(source).not.toMatch(/@example\.com/);
    }
  );
});
