import { describe, expect, it } from "vitest";
import { PRIMARY_SLUDGE_FORMULA, primarySludgeVolume } from "./primarySludge";

describe("primary sludge dimensional conversion", () => {
  it("converts mg/L to kg/m³ before applying density and mass fraction", () => {
    // Independent mass balance: 5,000 m³/d × 1,000 L/m³ × 150 mg/L ÷ 1,000,000 mg/kg.
    const dryMassKgPerDay = 5000 * 1000 * 150 / 1_000_000;
    const solidsKgPerM3 = 1000 * 0.04;
    expect(dryMassKgPerDay).toBe(750);
    expect(solidsKgPerM3).toBe(40);
    expect(primarySludgeVolume(5000, 150, 1000, 0.04)).toBe(dryMassKgPerDay / solidsKgPerM3);
    expect(primarySludgeVolume(5000, 150, 1000, 0.04)).toBe(18.75);
    expect(PRIMARY_SLUDGE_FORMULA.example.answer).toBe("18.75 m³/d");
    expect(PRIMARY_SLUDGE_FORMULA.example.solution).toContain("750 kg/d ÷ 40 kg/m³");
    expect(PRIMARY_SLUDGE_FORMULA.formula).toContain("10⁻³");
    expect(PRIMARY_SLUDGE_FORMULA.variables.find(v => v.sym === "solids fraction")?.desc).toContain("0.04 for 4%");
  });
  it("scales with flow and inversely with solids content, including zero flow", () => {
    expect(primarySludgeVolume(10000, 150, 1000, 0.04)).toBe(37.5);
    expect(primarySludgeVolume(5000, 150, 1000, 0.08)).toBe(9.375);
    expect(primarySludgeVolume(0, 150, 1000, 0.04)).toBe(0);
  });
  it.each([[5000, 150, 1000, 4], [5000, 150, 0, 0.04], [5000, 150, 1000, 0], [-1, 150, 1000, 0.04], [5000, NaN, 1000, 0.04]])(
    "rejects invalid or percent-as-fraction inputs %j", (flow, removed, density, fraction) => {
      expect(() => primarySludgeVolume(flow, removed, density, fraction)).toThrow(RangeError);
    });
});
