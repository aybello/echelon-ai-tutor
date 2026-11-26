import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ overrides: new Map<unknown, unknown>(), index: 0, indexed: new Map<number, unknown>() }));
vi.mock("react", async original => {
  const actual: any = await original();
  return { ...actual, useState: (initial: any) => {
    const value = typeof initial === "function" ? initial() : initial;
    const index = state.index++;
    return actual.useState(state.indexed.has(index) ? state.indexed.get(index) : state.overrides.has(value) ? state.overrides.get(value) : value);
  } };
});
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/components/GuideNav", () => ({ default: () => null }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: () => {} }));
vi.mock("@/hooks/useGuideProgress", () => ({ getGuideResumeStep: () => null }));
import ChemCalc from "./ChemCalc";
import Lab from "./Lab";
const render = (component: typeof Lab) => renderToStaticMarkup(createElement(component));
beforeEach(() => { vi.stubGlobal("React", React); state.overrides.clear(); state.indexed.clear(); state.index = 0; });
describe("actual public calculator regression", () => {
  it("blank RPD is incomplete, not a failed sample", () => {
    state.overrides.set("sampling", "calc"); state.overrides.set("12.5", "");
    const html = render(Lab); expect(html).toContain('role="status"'); expect(html).not.toContain("Re-sample required");
    expect(html).toContain('aria-label="Sample Result"');
    expect(html).toContain("at least one must be greater than zero"); expect(html).not.toContain("Final DO");
  });
  it.each(["", "9"])("invalid BOD does not claim compliance: %s", finalDO => {
    state.overrides.set("sampling", "calc"); state.overrides.set("rpd", "bod"); state.overrides.set("3.2", finalDO);
    const html = render(Lab); expect(html).toContain('role="status"'); expect(html).not.toContain("Low BOD"); expect(html).not.toContain("meets typical");
  });
  it.each([
    ["8.5", "20", "0.0"], ["8", "20", "10.0"], ["7.25", "20", "25.0"],
    ["3.2", "20", "106.0"], ["3.2", "40", "212.0"],
  ])("BOD arithmetic %s/%s is not an analytical or compliance result", (finalDO, factor, expected) => {
    state.overrides.set("sampling", "calc"); state.overrides.set("rpd", "bod");
    state.overrides.set("3.2", finalDO); state.overrides.set("20", factor);
    const html = render(Lab);
    expect(html).toContain(`${expected} mg/L`);
    expect(html).toContain("Educational BOD₅ arithmetic estimate");
    expect(html).toContain("not a valid analytical BOD₅ result or a compliance determination");
    expect(html).toContain("blank/seed corrections");
    expect(html).not.toMatch(/Low BOD|Moderate BOD|High BOD|meets typical|may not meet|PASS|FAIL/);
    expect(html).not.toContain("O. Reg. 129/04");
  });
  it("zero final dilution volume cannot render Infinity", () => {
    state.overrides.set("sampling", "calc"); state.overrides.set("rpd", "dilution"); state.indexed.set(9, "0");
    const html = render(Lab); expect(html).not.toContain("Infinity"); expect(html).toContain('role="status"');
    expect(html).toContain("final volume at least as large as initial volume"); expect(html).not.toContain("Final DO");
  });
  it.each(["", "0", "-1"])("polymer rejects missing/invalid concentration %s", concentration => {
    state.overrides.set("chlorine", "polymer"); state.indexed.set(3, concentration);
    const html = render(ChemCalc); expect(html).toContain('role="status"'); expect(html).not.toContain("1000 L/day"); expect(html).not.toContain("metering pump");
  });
  it("lime removes the inert pH control and explains its unchanged fixed target", () => {
    state.overrides.set("chlorine", "lime"); const html = render(ChemCalc);
    expect(html).not.toContain("Target pH"); expect(html).toContain("fixed target of 100 mg/L"); expect(html).toContain("124.44 kg/day");
    expect(html).toContain("12.44 mg/L"); expect(html).not.toContain("164.44 kg/day");
    expect(html).toContain("56/100 = 0.56"); expect(html).toContain("× 0.56 ÷ (CaO purity % / 100)");
    expect(html).toContain("https://www.mrwa.com/wp-content/uploads/2021/04/16-Lime-Softening.pdf#page=6");
    expect(html).toContain("Educational estimate only — not a complete softening demand");
    expect(html).toContain('for="lime-purity"'); expect(html).toContain('id="lime-purity"');
  });
  it("lime at or above target does not issue a dosing instruction", () => {
    state.overrides.set("chlorine", "lime"); state.overrides.set("80", "120");
    const html = render(ChemCalc);
    expect(html).toContain("No alkalinity deficit in this educational estimate");
    expect(html).not.toContain("no lime addition required"); expect(html).not.toContain("124.44 kg/day");
  });
  it.each([["naf", "13.33 kg/day", "9.26 g/min"], ["fsa", "9.88 kg/day", "6.86 g/min"]])("dry fluoride %s renders mass units, never pump volume", (chemical, mass, feed) => {
    state.overrides.set("chlorine", "fluoride"); state.overrides.set("hfs", chemical);
    const html = render(ChemCalc);
    expect(html).toContain(mass); expect(html).toContain(feed); expect(html).toContain("Dry Product Feed Rate");
    expect(html).toContain("elemental F by product mass");
    expect(html).not.toContain("mL/min"); expect(html).not.toContain("metering pump");
  });
  it("liquid fluoride retains 23% F and liquid volume feed units", () => {
    state.overrides.set("chlorine", "fluoride"); const html = render(ChemCalc);
    expect(html).toContain("Hydrofluosilicic Acid (23% F)"); expect(html).toContain("not 23% H₂SiF₆");
    expect(html).toContain("21.38 L/day"); expect(html).toContain("14.85 mL/min");
    expect(html).toContain("Solution Feed Rate"); expect(html).not.toContain("Dry Product Feed Rate");
  });
  it("invalid dry fluoride cannot display a finite feed result", () => {
    state.overrides.set("chlorine", "fluoride"); state.overrides.set("hfs", "naf"); state.overrides.set("10000", "");
    const html = render(ChemCalc);
    expect(html).toContain('role="status"'); expect(html).not.toContain("9.26 g/min"); expect(html).not.toContain("NaN"); expect(html).not.toContain("Infinity");
  });
  it("changing irrelevant granular purity never changes liquid feed math", () => {
    state.overrides.set("granular", "liquid"); state.overrides.set("65", "30"); const html = render(ChemCalc);
    expect(html).toContain("166.67 L/day"); expect(html).toContain("115.74 mL/min"); expect(html).not.toContain("555.56");
  });
});
