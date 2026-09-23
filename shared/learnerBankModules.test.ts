import { describe, expect, it } from "vitest";
import { reconcileLearnerBankModules } from "./learnerBankModules";

describe("reconcileLearnerBankModules", () => {
  it("preserves curated module ordering when every label has learner-visible questions", () => {
    expect(reconcileLearnerBankModules(
      ["Disinfection", "Distribution"],
      ["Distribution", "Disinfection", "Hydraulics"],
    )).toEqual(["Disinfection", "Distribution"]);
  });

  it("replaces stale Class 1 Wastewater display labels with the module stored on its active questions", () => {
    expect(reconcileLearnerBankModules(
      [
        "Wastewater Characteristics & Preliminary Treatment",
        "Primary Treatment",
        "Secondary Treatment",
      ],
      ["Wastewater Treatment"],
    )).toEqual(["Wastewater Treatment"]);
  });

  it("does not expose metadata filters when no learner-visible modules are available", () => {
    expect(reconcileLearnerBankModules(
      ["Primary Treatment", "Secondary Treatment"],
      [],
    )).toEqual([]);
  });

  it("preserves the exact stored module value used by the practice filter", () => {
    expect(reconcileLearnerBankModules(
      ["Disinfection"],
      [" Disinfection", " Disinfection"],
    )).toEqual([" Disinfection"]);
  });
});
