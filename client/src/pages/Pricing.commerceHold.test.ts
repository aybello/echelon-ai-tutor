import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Pricing.tsx", import.meta.url), "utf8");

describe("Pricing commerce availability", () => {
  it("describes current Team plans without stale launch-hold language", () => {
    expect(source).not.toContain("Team purchasing is temporarily paused");
    expect(source).not.toContain("Team checkout is temporarily unavailable");
    expect(source).toContain("Teams Flex for course-specific 3- or 6-month access");
    expect(source).toContain("Build a team plan");
  });

  it("routes the Team buyer path to the live Team plan builder", () => {
    expect(source).toContain('window.location.href = "/teams"');
  });

  it("does not call the retired individual subscription checkout", () => {
    expect(source).not.toContain("createSubscriptionCheckout.useMutation");
    expect(source).toContain("Choose a Current Exam Pass");
  });

  it("uses the permanent individual-access policy in visible purchase copy", () => {
    expect(source).toContain("permanent access for the named learner");
    expect(source).toContain("One-time payment · Permanent access");
  });
});
