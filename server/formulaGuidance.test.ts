import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
const page = (name: string) => readFileSync(new URL(`../client/src/pages/${name}.tsx`, import.meta.url), "utf8");
const auditedFormulaPages = [
  "Formulas",
  "FormulasWQA",
  "FormulasWater1",
  "FormulasWater2",
  "FormulasWater3",
  "FormulasWater4",
  "FormulasWW1",
  "FormulasWW2",
  "FormulasWW3",
  "FormulasWW4",
  "FormulasWpiClass1",
  "FormulasWpiClass1Ww",
  "FormulasWpiClass2",
  "FormulasWpiClass3",
  "FormulasWpiClass4",
  "FormulasWpiClass4Ww",
  "FormulasWpiClass2Ww",
  "FormulasWpiClass3Ww",
];

it("keeps Ontario initial reporting immediate and distinguishes the written follow-up", () => {
  for (const name of ["Formulas", "FormulasWQA", "FormulasWater4", "FormulasWpiClass4"]) {
    const s = page(name);
    expect(s).toMatch(/immediate verbal/i);
    expect(s).toMatch(/written (?:notice|follow-up).*within 24 hours/i);
    expect(s).toContain("Spills Action Centre");
    expect(s).not.toContain("no later than 24 hours after becoming aware");
    expect(s).not.toContain("next day at latest");
    expect(s).not.toContain("written report within 7 days");
    expect(s).not.toContain("Written report = within 7 days");
  }
});
it("does not restore the known false universal CT and UV requirements", () => {
  for (const name of auditedFormulaPages) {
    const s = page(name);
    expect(s).not.toContain("requires CT ≥ 6");
    expect(s).not.toContain("requires 4-log for both Giardia");
    expect(s).not.toContain("Dose ≥ 40 mJ/cm² for 4-log virus");
    expect(s).not.toContain("requires 40 mJ/cm² for 4-log Giardia and 4-log virus");
    expect(s).not.toContain("requires UV dose ≥ 40 mJ/cm²");
    expect(s).not.toContain("Minimum UV dose for 4-log virus inactivation: 186 mJ/cm²");
    expect(s).not.toContain("Effective CT for 3-log Giardia inactivation at 10°C with free chlorine");
  }
});
it("does not mix drinking-water distribution residuals with wastewater effluent limits", () => {
  for (const name of ["FormulasWW1", "FormulasWW2", "FormulasWW3", "FormulasWW4", "FormulasWpiClass1Ww", "FormulasWpiClass4Ww"]) {
    const s = page(name);
    expect(s).toMatch(/permit|approval/i);
    expect(s).not.toContain("Ontario O. Reg. 170/03 requires minimum 0.2 mg/L free chlorine residual in distribution");
  }
});
it("keeps Western provincial formula sheets jurisdictional and validated", () => {
  for (const name of ["FormulasWpiClass1", "FormulasWpiClass2", "FormulasWpiClass3", "FormulasWpiClass4"]) {
    const s = page(name);
    expect(s).toMatch(/governing|validated|jurisdiction/i);
    expect(s).not.toContain("Health Canada requires ≥40 mJ/cm²");
    expect(s).not.toContain("Regulatory minimum: 40 mJ/cm²");
  }
});
it("labels solution concentration, mass, volume and pump power consistently", () => {
  const s = page("Formulas");
  expect(s).toContain("12% available chlorine by mass");
  expect(s).toContain("250 ÷ 1.20 = 208.3 L/d");
  expect(15000 * 2 / 1000 / .12 / 1.2).toBeCloseTo(208.333, 2);
  expect(s).toContain("P (kW) = ρgQH ÷ (1000η)");
});

it("keeps WPI Class II wastewater examples calculation-focused and approval-bound", () => {
  const s = page("FormulasWpiClass2Ww");
  expect(s).toContain("Study examples only.");
  expect(s).toMatch(/facility's validated procedure, approval or permit/i);
  expect(s).toContain("O₃ Dose = 5,000 ÷ 500 = 10 g/m³ = 10 mg/L");
  expect(s).not.toContain("Effluent BOD limit (Ontario ECA)");
  expect(s).not.toContain("Wastewater effluent CT for 2-log E. coli reduction");
  expect(s).not.toContain("Typical Class B biosolids available N");
  expect(s).not.toContain("Class A reuse: ≥100 mJ/cm²");
  expect(s).not.toContain("O₃ Applied (g/h) ÷ Flow (m³/h) × 1,000");
  expect(s).toContain("Mixing ratio = (10 + 0.1) ÷ 0.1 = 101:1");
});

it("keeps WPI Class III wastewater arithmetic correct and regulatory claims source-bound", () => {
  const s = page("FormulasWpiClass3Ww");
  expect(s).toContain("Study examples only.");
  expect(s).toContain("SDNR = (20−5) × 10,000 / (2,000 × 2,500) = 150,000 / 5,000,000 = 0.03");
  expect(s).toContain("F/M = (10,000 × 200) / (4,000 × 2,200) = 2,000,000 / 8,800,000 = 0.23");
  expect(s).not.toContain("× 1/1,000 = 2,000,000 / 8,800,000");
  expect(s).not.toContain("Class B biosolids require VSR");
  expect(s).not.toContain("Setback distances: 30 m from watercourses");
  expect(s).not.toContain("IU_limit = POTW_limit");
  expect(s).not.toContain("WSER requires LC50 > 100%");
  expect(s).not.toContain("IPCC default EF for direct N₂O");
  expect(s).toMatch(/approved sewer-use by-law or permit/i);
  expect(s).toMatch(/accredited-lab testing of 100% effluent/i);
  expect(s).toContain("P removed (kg/d) = (P_in − P_eff) × Q ÷ 1,000");
});
