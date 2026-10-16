import { describe, expect, it } from "vitest";
import { normalizeQuestionSteps } from "./questionSteps";

describe("normalizeQuestionSteps", () => {
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
      null, undefined, 3, true, "text", [], {}, { l: "Body missing" },
      { label: "Empty", content: "   " }, { l: {}, c: {} }, { l: "Invalid", c: 180 },
      { l: "Valid", c: "360 ÷ 2 = 180" },
    ])).toEqual([{ l: "Valid", c: "360 ÷ 2 = 180" }]);
  });

  it.each([undefined, null, {}, "[]", 42, true])("rejects non-array input %j", value => {
    expect(normalizeQuestionSteps(value)).toEqual([]);
  });
});
