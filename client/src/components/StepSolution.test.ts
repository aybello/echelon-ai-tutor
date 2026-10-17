import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import StepSolution from "./StepSolution";

const render = (steps: unknown) => renderToStaticMarkup(createElement(StepSolution, { steps }));

describe("StepSolution legacy text bodies", () => {
  // The production Vite transform provides the JSX runtime; Vitest uses classic JSX.
  beforeAll(() => vi.stubGlobal("React", React));
  afterAll(() => vi.unstubAllGlobals());

  it("renders every existing WPI string body rather than the unavailable fallback", () => {
    const steps = [
      "Formula: H = (P_d − P_s)C, where H is pump-added head in feet of water, P_d is discharge pressure in psi, P_s is suction pressure in psi, and C is the pressure-to-head conversion factor, 2.31 ft of water per psi.",
      "Substitute: H = (70 psi − 30 psi) × 2.31 ft/psi = 40 psi × 2.31 ft/psi.",
      "The pump adds 92.4 ft of head, which matches option C.",
    ];
    const html = render(steps);
    for (const body of steps) expect(html).toContain(body);
    expect(html).not.toContain("Worked solution steps are unavailable");
    expect(html.indexOf(steps[0])).toBeLessThan(html.indexOf(steps[1]));
    expect(html.indexOf(steps[1])).toBeLessThan(html.indexOf(steps[2]));
  });

  it("keeps unavailable feedback for blank strings and objects lacking real bodies", () => {
    const html = render(["", " \t\n", { l: "Y = 0.50", c: "" }, { label: "Body missing" }, null]);
    expect(html).toContain("Worked solution steps are unavailable");
    expect(html).not.toContain("Y = 0.50");
  });

  it("escapes untrusted text bodies instead of interpreting them as HTML", () => {
    const html = render(["<script>alert(1)</script>"]);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
