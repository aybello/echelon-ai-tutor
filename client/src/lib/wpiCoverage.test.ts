import { describe, expect, it } from "vitest";
import { WPI_COVERAGE, WPI_PROVINCE_COUNT } from "./wpiCoverage";

describe("WPI public coverage", () => {
  it("includes Nova Scotia in the public province count and coverage panel", () => {
    expect(WPI_PROVINCE_COUNT).toBe(5);
    expect(WPI_COVERAGE).toHaveLength(5);
    expect(WPI_COVERAGE).toContainEqual(expect.objectContaining({
      province: "Nova Scotia",
      detail: "NSECC · Shared WPI preparation",
      supportingText: "14 eligible WPI courses",
    }));
  });
});
