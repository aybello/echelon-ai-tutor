import { describe, expect, it } from "vitest";
import { calculateChlorine, formatChlorineValue, HYPOCHLORITE_DENSITY_KG_L, type ChlorineForm } from "./chlorineCalculation";

const defaults = { flow: "10000", dose: "2.5", granularPurity: "65", form: "granular" as ChlorineForm };

describe("educational chlorine calculation", () => {
  it.each([
    ["granular", 0.65, 38.4615384615, 26.7094017094],
    ["gas", 0.995, 25.1256281407, 17.4483528755],
    ["liquid", 0.125, 200, 138.8888888889],
  ] as const)("uses selected %s purity, not hidden granular state", (form, purity, mass, feed) => {
    const result = calculateChlorine({ ...defaults, form })!;
    expect(result.activeMassKgDay).toBe(25);
    expect(result.activeMassGDay).toBe(25000);
    expect(result.purity).toBe(purity);
    expect(result.productMassKgDay).toBeCloseTo(mass, 8);
    expect(result.productFeedGMin).toBeCloseTo(feed, 8);
    expect(result.productMassKgDay * purity).toBeCloseTo(result.activeMassKgDay, 10);
    expect(result.productFeedGMin * 1440 / 1000).toBeCloseTo(result.productMassKgDay, 10);
    if (form === "liquid") {
      expect(result.liquidVolumeLDay).toBeCloseTo(166.6666666667, 8);
      expect(result.liquidFeedMlMin).toBeCloseTo(115.7407407407, 8);
      expect(result.liquidVolumeLDay! * HYPOCHLORITE_DENSITY_KG_L * purity).toBeCloseTo(25, 10);
      expect(result.liquidFeedMlMin! * 1440 / 1000).toBeCloseTo(result.liquidVolumeLDay!, 10);
    } else {
      expect(result.liquidVolumeLDay).toBeNull();
      expect(result.liquidFeedMlMin).toBeNull();
    }
  });

  it.each(["gas", "liquid"] as const)("ignores any hidden granular input for %s", form => {
    const baseline = calculateChlorine({ ...defaults, form });
    for (const granularPurity of ["30", "", "0", "-1", "101", "NaN", "Infinity"]) {
      expect(calculateChlorine({ ...defaults, form, granularPurity })).toEqual(baseline);
    }
  });

  it.each(["", " ", "0", "-1", "NaN", "Infinity", "1e999", "2bad"])("rejects invalid flow/dose %j for every form", invalid => {
    for (const form of ["gas", "liquid", "granular"] as const) {
      expect(calculateChlorine({ ...defaults, form, flow: invalid })).toBeNull();
      expect(calculateChlorine({ ...defaults, form, dose: invalid })).toBeNull();
    }
  });

  it.each(["", " ", "0", "-1", "100.01", "NaN", "Infinity", "65bad"])("rejects invalid visible granular purity %j", granularPurity => {
    expect(calculateChlorine({ ...defaults, granularPurity })).toBeNull();
  });

  it("accepts 100% and edited 30%, and scales linearly with flow and dose", () => {
    expect(calculateChlorine({ ...defaults, granularPurity: "100" })!.productMassKgDay).toBe(25);
    expect(calculateChlorine({ ...defaults, granularPurity: "30" })!.productMassKgDay).toBeCloseTo(83.3333333333, 8);
    for (const form of ["gas", "liquid", "granular"] as const) {
      const baseline = calculateChlorine({ ...defaults, form })!;
      expect(calculateChlorine({ ...defaults, form, flow: "20000" })!.productMassKgDay).toBeCloseTo(baseline.productMassKgDay * 2, 10);
      expect(calculateChlorine({ ...defaults, form, dose: "5" })!.productFeedGMin).toBeCloseTo(baseline.productFeedGMin * 2, 10);
    }
  });

  it("rejects nonfinite derived output from finite inputs", () => {
    expect(calculateChlorine({ ...defaults, flow: "1e308", dose: "1e308" })).toBeNull();
    expect(calculateChlorine({ ...defaults, granularPurity: "1e-310" })).toBeNull();
  });

  it("formats accepted extreme results without reintroducing Infinity or rounding tiny values to zero", () => {
    const result = calculateChlorine({ ...defaults, flow: "1e308", dose: "1" })!;
    expect(Number.isFinite(result.activeMassGDay)).toBe(true);
    expect(formatChlorineValue(result.activeMassGDay)).toBe("1.00e+308");
    expect(formatChlorineValue(0.000001)).toBe("1.00e-6");
    expect(formatChlorineValue(25.125628)).toBe("25.13");
    expect(formatChlorineValue(25)).toBe("25");
    expect(formatChlorineValue(Infinity)).toBe("—");
  });
});
