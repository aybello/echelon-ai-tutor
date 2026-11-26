import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => createElement("span", null, children) }));
import FormulasWW1 from "./FormulasWW1";
beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

describe("rendered Class I wastewater formula sheet", () => {
  it("prints the corrected conversion, dimensional substitution and answer together", () => {
    const html = renderToStaticMarkup(createElement(FormulasWW1));
    expect(html).toContain("Sludge Volume (Primary)");
    expect(html).toContain("[Q × SS_removed × 10⁻³] ÷ [ρ_sludge × solids fraction]");
    expect(html).toContain("750 kg/d ÷ 40 kg/m³");
    expect(html).toContain("Answer: 18.75 m³/d");
    expect(html).not.toContain("750,000 ÷ 40,000,000");
  });
});
