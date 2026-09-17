import { describe, expect, it } from "vitest";
import { getIndividualExamPassExpiry } from "./individualExamPass";

describe("Individual Exam Pass entitlements", () => {
  it("issues permanent access for a validated new Individual Exam Pass", () => {
    expect(getIndividualExamPassExpiry()).toBeNull();
  });
});
