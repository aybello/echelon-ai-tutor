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
    expect(html).not.toContain("Target pH"); expect(html).toContain("fixed target of 100 mg/L"); expect(html).toContain("164.44 kg/day");
    expect(html).toContain('for="lime-purity"'); expect(html).toContain('id="lime-purity"');
  });
  it("changing irrelevant granular purity never changes liquid feed math", () => {
    state.overrides.set("granular", "liquid"); state.overrides.set("65", "30"); const html = render(ChemCalc);
    expect(html).toContain("166.67 L/day"); expect(html).toContain("115.74 mL/min"); expect(html).not.toContain("555.56");
  });
});
