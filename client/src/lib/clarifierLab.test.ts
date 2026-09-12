import { describe, expect, it } from "vitest";
import { CLARIFIER_PARTS, CLARIFIER_STAGES, resolveClarifierCount } from "./clarifierLab";

describe("clarifier lab learning model", () => {
  it("provides unique interactive parts and four ordered process stages", () => {
    expect(new Set(CLARIFIER_PARTS.map((part) => part.id)).size).toBe(CLARIFIER_PARTS.length);
    expect(CLARIFIER_PARTS).toHaveLength(7);
    expect(CLARIFIER_STAGES.map((stage) => stage.step)).toEqual(["01", "02", "03", "04"]);
  });

  it("keeps valid server metadata and falls back for empty values", () => {
    expect(resolveClarifierCount("805", 500)).toBe(805);
    expect(resolveClarifierCount(0, 500)).toBe(500);
    expect(resolveClarifierCount("not-a-number", 500)).toBe(500);
  });
});
