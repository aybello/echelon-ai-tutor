import { describe, expect, it } from "vitest";
import { normalizeQuestionSteps } from "./questionSteps";

describe("normalizeQuestionSteps", () => {
  it("retains verified WPI string steps verbatim, in order, without inventing headings", () => {
    const steps = Object.freeze([
      "Formula: H = (P_d − P_s)C, where H is pump-added head in feet of water, P_d is discharge pressure in psi, P_s is suction pressure in psi, and C is the pressure-to-head conversion factor, 2.31 ft of water per psi.",
      "Substitute: H = (70 psi − 30 psi) × 2.31 ft/psi = 40 psi × 2.31 ft/psi.",
      "The pump adds 92.4 ft of head, which matches option C.",
      "  Preserve spaces and\nline breaks.  ",
    ]);
    expect(normalizeQuestionSteps(steps)).toEqual(steps.map(c => ({ l: "", c })));
  });

  it("does not promote a label, even a formula label, into a missing solution body", () => {
    expect(normalizeQuestionSteps([
      "", " \t\n", { l: "Body missing" }, { l: "Y = 0.50", c: "" },
      { label: "Result", content: "  " }, { c: 0 }, { c: false }, { c: {} },
    ])).toEqual([]);
  });

  it("renders a substantive legacy calculation preserved in the label field", () => {
    const legacyBody = "Step 2 — Area A = π × (0.3/2)^2 = π × 0.0225 = 0.0707 m²";
    expect(normalizeQuestionSteps([{ l: legacyBody }])).toEqual([{ l: "", c: legacyBody }]);
  });

  it("requires a complete legacy calculation and preserves canonical body precedence", () => {
    const legacyBody = "  Step 2 result = 7  ";
    expect(normalizeQuestionSteps([{ l: legacyBody }])).toEqual([{ l: "", c: legacyBody }]);
    expect(normalizeQuestionSteps([{ l: "Y = 0.50" }, { l: "This label needs review" }])).toEqual([]);
    expect(normalizeQuestionSteps([{ l: legacyBody, c: "Canonical body" }])).toEqual([{ l: legacyBody, c: "Canonical body" }]);
  });

  it("retains complete canonical label and formula text without mutating input", () => {
    const step = Object.freeze({ l: "  Calculate — final  ", c: "  360 kg ÷ 2 = 180 kg.\nCheck both legs.  " });
    expect(normalizeQuestionSteps(Object.freeze([step]))).toEqual([step]);
  });

  it("normalizes the verified 309A beta q20 legacy steps", () => {
    expect(normalizeQuestionSteps([
      { label: "Identify", content: "Total balanced load = 360 kg and number of equal vertical legs = 2." },
      { label: "Calculate", content: "Load per leg = 360 kg ÷ 2 = 180 kg." },
    ])).toEqual([
      { l: "Identify", c: "Total balanced load = 360 kg and number of equal vertical legs = 2." },
      { l: "Calculate", c: "Load per leg = 360 kg ÷ 2 = 180 kg." },
    ]);
  });

  it("accepts mixed aliases and gives valid canonical fields precedence", () => {
    expect(normalizeQuestionSteps([
      { l: "Canonical", c: "Body", label: "Legacy", content: "Other" },
      { l: "Mixed", content: "Formula" },
      { label: "Mixed too", c: "Result" },
      { l: null, c: {}, label: "Legacy fallback", content: "Real body" },
      { l: "  ", c: "", label: "Nonempty label", content: "Nonempty body" },
    ])).toEqual([
      { l: "Canonical", c: "Body" },
      { l: "Mixed", c: "Formula" },
      { l: "Mixed too", c: "Result" },
      { l: "Legacy fallback", c: "Real body" },
      { l: "Nonempty label", c: "Nonempty body" },
    ]);
  });

  it("keeps genuine bodies with no usable label without inventing a heading", () => {
    expect(normalizeQuestionSteps([{ c: "Formula" }, { label: 4, content: "Result" }])).toEqual([
      { l: "", c: "Formula" }, { l: "", c: "Result" },
    ]);
  });

  it("omits malformed and bodyless entries without coercing or inventing content", () => {
    expect(normalizeQuestionSteps([
      null, undefined, 3, true, "  ", [], {}, { l: "Body missing" },
      { label: "Empty", content: "   " }, { l: {}, c: {} }, { l: "Invalid", c: 180 },
      { l: "Valid", c: "360 ÷ 2 = 180" },
    ])).toEqual([{ l: "Valid", c: "360 ÷ 2 = 180" }]);
  });

  it.each([undefined, null, {}, "[]", 42, true])("rejects non-array input %j", value => {
    expect(normalizeQuestionSteps(value)).toEqual([]);
  });
});
