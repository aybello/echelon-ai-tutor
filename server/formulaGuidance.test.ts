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
