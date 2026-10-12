import { describe, expect, it } from "vitest";
import { normalizeTutorMath } from "./tutorMath";

describe("normalizeTutorMath", () => {
  it("converts LaTeX display delimiters into Markdown display math", () => {
    const input = String.raw`Area: \[ A = \frac{\pi d^2}{4} \]`;

    expect(normalizeTutorMath(input)).toBe(
      "Area: $$\nA = \\frac{\\pi d^2}{4}\n$$",
    );
  });

  it("converts LaTeX inline delimiters into Markdown inline math", () => {
    const input = String.raw`Use \(Q = VA\) to calculate flow.`;

    expect(normalizeTutorMath(input)).toBe("Use $Q = VA$ to calculate flow.");
  });

  it("leaves existing Markdown math unchanged", () => {
    const input = "Use $Q = VA$ and $$A = \\pi r^2$$.";

    expect(normalizeTutorMath(input)).toBe(input);
  });
});
