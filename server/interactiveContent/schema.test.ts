import { describe, expect, it } from "vitest";
import { interactiveModes, interactivePackageSchema } from "./schema";
// @ts-expect-error The offline converter is plain JavaScript.
import { validatePack } from "../../scripts/validate-interactive-drafts.mjs";

const drafts = () => interactiveModes.flatMap(mode => ["preview", "paid"].map(kind => {
  const item = { id: `${kind}-${mode}`, mode, prompt: `Question ${kind} ${mode}`, instruction: undefined as string | undefined,
    answer: "", explanation: "Synthetic explanation", sources: ["Synthetic citation"], options: [] as string[], pairs: [] as { left: string; right: string }[] };
  if (mode === "rapid-swipe") item.answer = "true";
  else if (mode === "speed-match") { item.answer = "Match the pairs"; item.pairs = [{ left: "X", right: "One" }, { left: "Y", right: "Two" }, { left: "Z", right: "Three" }]; }
  else if (mode === "before-after") { item.options = ["A", "B"]; item.answer = "A"; }
  else { item.options = ["Alpha", "Beta"]; item.answer = "Alpha"; }
  return item;
}));

function check(options: string[], prompt: string, instruction = "") {
  const input = drafts();
  const example = input.find(item => item.id === "paid-before-after")!;
  example.options = options;
  example.answer = options[0];
  example.prompt = prompt;
  example.instruction = instruction || undefined;
  const converted = validatePack(input);
  // Test the server independently even when the converter rejects the item.
  const serverExamples = input.map(item => {
    const base = { id: item.id, mode: item.mode, prompt: item.prompt, ...(item.instruction ? { instruction: item.instruction } : {}), explanation: item.explanation };
    if (item.mode === "rapid-swipe") return { ...base, correctAnswer: true };
    if (item.mode === "speed-match") return { ...base, pairs: item.pairs.map((pair, i) => ({ ...pair, id: `pair-${i}` })) };
    if (item.mode === "before-after") return { ...base, options: item.options, correctAnswer: item.answer };
    return { ...base, options: item.options.map((label, i) => ({ id: `option-${i}`, label })), correctOptionId: "option-0" };
  });
  const server = interactivePackageSchema.safeParse({ courseKey: "class1-water", status: "approved", version: "test", previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `preview-${mode}`])), examples: serverExamples });
  return { converter: converted.valid, server: server.success };
}

describe("before-after visible option detection", () => {
  it.each([
    [["A", "B"], "What happens?", "", true],
    [["A", "B"], "What happens?", "Think about stages", true],
    [["A", "B"], "What happens?", "Consider (a).", false],
    [["A", "B"], "A, perhaps?", "", false],
    [["A", "B"], "A", "", false],
    [["A", "B"], "alpha béta", "", true],
    [["A", "B"], "a_1 and 2b", "", true],
    [["12", "34"], "Refer to 1234", "", true],
    [["12", "34"], "Refer to (12).", "", false],
    [["C++", "C#"], "Consider C++.", "", false],
    [["C++", "C#"], "Consider XC++Y.", "", true],
    [["Ａ", "Ｂ"], "What happens?", "", true],
    [["Ａ", "Ｂ"], "A is shown.", "", false],
    [["é", "ø"], "café", "", true],
    [["é", "ø"], "Use e\u0301.", "", false],
    [["cat", "dog"], "Concatenate these", "", true],
    [["cat", "dog"], "A cat!", "", false],
    [["screen", "filter"], "Prescreening is complete", "", false],
    [["Café", "Tea"], "Consider CAFE\u0301.", "", false],
    [["A", "B"], "What happens?", "The answer is A", false],
    [["A", "B"], "What happens?", "Water → process", false],
  ])("checks %j against prompt %j and instruction %j", (options, prompt, instruction, valid) => {
    expect(check(options, prompt, instruction)).toEqual({ converter: valid, server: valid });
  });
});
