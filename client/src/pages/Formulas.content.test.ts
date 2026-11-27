import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Formulas.tsx", import.meta.url), "utf8");

describe("Formula Library release content", () => {
  it("keeps fluoride calculation units dimensionally consistent", () => {
    expect(source).toContain("Feed (L/d) = Q (m³/d) × Target (mg/L) ÷ Strength (g/L)");
    expect(source).toContain("Feed = 5,000 × 0.7 ÷ 20");
    expect(source).not.toContain("× 1,000,000");
  });

  it("makes the OLR mg/L to kg/m³ conversion explicit", () => {
    expect(source).toContain("OLR = Q × BOD ÷ (V × 1000)");
    expect(source).toContain("Influent BOD (mg/L; divide by 1000 to obtain kg/m³)");
    expect(source).toContain("The ÷1000 in this equation converts BOD from mg/L to kg/m³.");
  });

  it("labels pump output as shaft power and avoids a universal NPSH margin", () => {
    expect(source).toContain("What shaft power is required?");
    expect(source).toContain("13.1 kW shaft power");
    expect(source).toContain("Do not treat one fixed safety margin as universal.");
    expect(source).not.toContain("What is the power draw?");
  });

  it("supports formula discovery and an actionable practice handoff", () => {
    expect(source).toContain("variable.sym} ${variable.desc}");
    expect(source).toContain("Start with the common calculations");
    expect(source).toContain("Practise this formula →");
    expect(source).toContain('role="button"');
    expect(source).toContain("aria-expanded={isExpanded}");
    expect(source).toContain("Save for review");
  });
});
