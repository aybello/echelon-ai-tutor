import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
const page = (name: string) => readFileSync(new URL(`../client/src/pages/${name}.tsx`, import.meta.url), "utf8");
it("keeps Ontario initial reporting immediate and distinguishes the written follow-up", () => {
  for (const name of ["Formulas", "FormulasWQA", "FormulasWpiClass4"]) {
    const s = page(name);
    expect(s).toMatch(/immediate verbal/i);
    expect(s).toMatch(/written (?:notice|follow-up).*within 24 hours/i);
    expect(s).toContain("Spills Action Centre");
    expect(s).not.toContain("no later than 24 hours after becoming aware");
    expect(s).not.toContain("next day at latest");
  }
});
it("does not restore the known false universal CT and UV requirements", () => {
  for (const name of ["Formulas", "FormulasWQA", "FormulasWater1", "FormulasWater2", "FormulasWater3"]) {
    const s = page(name);
    expect(s).not.toContain("requires CT ≥ 6");
    expect(s).not.toContain("requires 4-log for both Giardia");
    expect(s).not.toContain("Dose ≥ 40 mJ/cm² for 4-log virus");
    expect(s).not.toContain("requires 40 mJ/cm² for 4-log Giardia and 4-log virus");
  }
});
it("labels solution concentration, mass, volume and pump power consistently", () => {
  const s = page("Formulas");
  expect(s).toContain("12% available chlorine by mass");
  expect(s).toContain("250 ÷ 1.20 = 208.3 L/d");
  expect(15000 * 2 / 1000 / .12 / 1.2).toBeCloseTo(208.333, 2);
  expect(s).toContain("P (kW) = ρgQH ÷ (1000η)");
});
