import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import type { DrillActivity, DrillExample } from "./InteractiveDrill";

// A deterministic hook harness exercises handlers without a DOM/browser, live
// credentials or replacing the game logic with a test implementation.
const harness = vi.hoisted(() => ({ path: "", cursor: 0, cells: new Map<string, any>(), effects: [] as (() => void)[] }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState(initial: any) {
    const key = `${harness.path}:${harness.cursor++}`;
    if (!harness.cells.has(key)) harness.cells.set(key, typeof initial === "function" ? initial() : initial);
    return [harness.cells.get(key), (value: any) => harness.cells.set(key, typeof value === "function" ? value(harness.cells.get(key)) : value)];
  },
  useRef(initial: any) {
    const key = `${harness.path}:${harness.cursor++}`;
    if (!harness.cells.has(key)) harness.cells.set(key, { current: initial });
    return harness.cells.get(key);
  },
  useId() { return `${harness.path}:${harness.cursor++}`; },
  useLayoutEffect() { harness.cursor++; },
  useEffect(effect: () => void, dependencies: any[]) {
    const key = `${harness.path}:${harness.cursor++}`;
    const old = harness.cells.get(key);
    if (!old || dependencies.some((value, index) => value !== old[index])) harness.effects.push(effect);
    harness.cells.set(key, dependencies);
  },
}));
import { InteractiveDrill } from "./InteractiveDrill";

type Node = { type: string; props: any; children: Node[] };
function expand(element: any, path = "root"): Node[] {
  if (element == null || typeof element === "boolean") return [];
  if (Array.isArray(element)) return element.flatMap((child, i) => expand(child, `${path}/${i}`));
  if (typeof element !== "object") return [{ type: "text", props: { text: String(element) }, children: [] }];
  if (typeof element.type === "function") {
    harness.path = `${path}/${element.type.name}/${element.key ?? ""}`; harness.cursor = 0;
    return expand(element.type(element.props), harness.path);
  }
  return [{ type: element.type, props: element.props, children: expand(element.props.children, `${path}/children`) }];
}
function flatten(nodes: Node[]): Node[] { return nodes.flatMap(node => [node, ...flatten(node.children)]); }
function text(node: Node): string { return node.type === "text" ? node.props.text : node.children.map(text).join(""); }
async function drill(example: DrillExample | DrillExample[], timerSeconds: 30 | null = null) {
  const events: DrillActivity[] = []; const results: any[] = [];
  const props = { examples: Array.isArray(example) ? example : [example], timerSeconds, onActivity: (event: DrillActivity) => events.push(event), onResult: (result: any) => results.push(result) };
  let tree: Node[] = [];
  const render = async () => { tree = expand(React.createElement(InteractiveDrill, props)); harness.effects.splice(0).forEach(effect => effect()); await Promise.resolve(); };
  await render();
  return { events, results, render, async click(label: string) { const button = flatten(tree).find(node => node.type === "button" && text(node) === label); if (!button) throw new Error(`Missing ${label}`); button.props.onClick({ detail: 1 }); await render(); } };
}
beforeEach(() => { harness.cells.clear(); harness.effects = []; vi.stubGlobal("React", React); });
afterEach(() => vi.unstubAllGlobals());

describe("actual six-game meaningful observations, no browser", () => {
  it.each(["odd-one-out", "tap-the-flaw", "cause-effect"] as const)("captures original option index before boolean scoring for %s", async mode => {
    const view = await drill({ id: "choice", mode, prompt: "Pick", options: [{ id: "long-one", label: "One" }, { id: "long-two", label: "Two" }], correctOptionId: "long-one", explanation: "Reason" });
    expect(view.events).toEqual([{ action: "started" }, { action: "item_presented", itemId: "choice" }]);
    await view.click("Two");
    expect(view.events.slice(2)).toEqual([{ action: "answer_submitted", itemId: "choice", chosenAnswer: "1", observedCorrect: false }, { action: "explanation_opened", itemId: "choice" }, { action: "completed" }]);
    expect(view.results).toEqual([{ exampleId: "choice", mode, correct: false }]);
    await view.click("Two"); expect(view.results).toHaveLength(1);
  });
  it("preserves yes/no and before/after aliases, never raw named labels", async () => {
    const swipe = await drill({ id: "swipe", mode: "rapid-swipe", prompt: "Statement", correctAnswer: true, explanation: "Reason" });
    await swipe.click("No"); expect(swipe.events).toContainEqual({ action: "answer_submitted", itemId: "swipe", chosenAnswer: "no", observedCorrect: false });
    harness.cells.clear();
    const ordering = await drill({ id: "order", mode: "before-after", prompt: "Pick an earlier stage", options: ["Long earlier label", "Long later label"], correctAnswer: "Long earlier label", explanation: "Reason" });
    await ordering.click("Long later label"); expect(ordering.events).toContainEqual({ action: "answer_submitted", itemId: "order", chosenAnswer: "1", observedCorrect: false });
  });
  it("records mismatched and successful pair selections, in either selection order, plus retry", async () => {
    const view = await drill({ id: "match", mode: "speed-match", prompt: "Match", pairs: ["A", "B", "C"].map(id => ({ id, left: `Left ${id}`, right: `Right ${id}` })), explanation: "Reason" });
    await view.click("Right B"); await view.click("Left A");
    expect(view.events).toContainEqual({ action: "step_answer", itemId: "match", stepId: "pair:0", chosenAnswer: "1", observedCorrect: false });
    expect(view.results).toEqual([]); expect(view.events.some(event => event.action === "explanation_opened")).toBe(false);
    for (const id of ["A", "B", "C"]) { await view.click(`Left ${id}`); await view.click(`Right ${id}`); }
    expect(view.events).toContainEqual({ action: "retry", itemId: "match", stepId: "pair:0" });
    expect(view.events.filter(event => event.action === "step_answer")).toHaveLength(4);
    expect(view.results).toEqual([{ exampleId: "match", mode: "speed-match", correct: false }]);
    expect(view.events.slice(-2)).toEqual([{ action: "explanation_opened", itemId: "match" }, { action: "completed" }]);
  });
  it("records effect choices on change and each response on Check; preserves aggregate all-effects score", async () => {
    const view = await drill({ id: "effect", mode: "cause-effect", prompt: "Predict", effects: [{ id: "p", parameter: "Pressure", direction: "decrease", explanation: "Reason" }] });
    await view.click("↑ Increases"); expect(view.results).toEqual([]);
    expect(view.events).toContainEqual({ action: "selection_changed", itemId: "effect", stepId: "effect:0", chosenAnswer: "increase" });
    await view.click("Check answer");
    expect(view.events).toContainEqual({ action: "step_answer", itemId: "effect", stepId: "effect:0", chosenAnswer: "increase", observedCorrect: false });
    expect(view.results).toEqual([{ exampleId: "effect", mode: "cause-effect", correct: false }]);
    expect(view.events.some(event => event.action === "hint_opened")).toBe(false);
  });
  it("records skipped presentation and a genuine retry before round completion", async () => {
    const example = { id: "one", mode: "rapid-swipe", prompt: "Statement", correctAnswer: true, explanation: "Reason" } as const;
    const view = await drill([example, { ...example, id: "two" }]);
    await view.click("Next activity →");
    expect(view.events).toContainEqual({ action: "item_skipped", itemId: "one" });
    expect(view.events.some(event => event.action === "completed")).toBe(false);
    await view.click("Previous"); await view.click("Yes");
    await view.click("Next activity →"); await view.click("Previous"); await view.click("No");
    expect(view.events).toContainEqual({ action: "retry", itemId: "one" });
    expect(view.events.filter(event => event.action === "answer_submitted").map(event => event.chosenAnswer)).toEqual(["yes", "no"]);
    expect(view.events.some(event => event.action === "completed")).toBe(false);
  });
  it("acknowledges the real empty timed finish without creating an answer or canonical result", async () => {
    vi.stubGlobal("document", { hidden: false, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal("window", { setInterval: vi.fn(), clearInterval() {} });
    const view = await drill({ id: "swipe", mode: "rapid-swipe", prompt: "Statement", correctAnswer: true, explanation: "Reason" }, 30);
    await view.click("Start 30-second round"); await view.click("End round");
    expect(view.events.filter(event => event.action === "completed")).toHaveLength(1);
    expect(view.events.some(event => event.action === "answer_submitted")).toBe(false);
    expect(view.results).toEqual([]);
  });
  it("times out the current repeated card, not the first card; preserves yes/no observations", async () => {
    let tick = () => {}; let now = 0;
    vi.stubGlobal("document", { hidden: false, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal("window", { setInterval: (fn: () => void) => { tick = fn; return 1; }, clearInterval() {} });
    vi.stubGlobal("performance", { now: () => now });
    const example = { id: "one", mode: "rapid-swipe", prompt: "Statement", correctAnswer: true, explanation: "Reason" } as const;
    const view = await drill([example, { ...example, id: "two" }], 30);
    await view.click("Start 30-second round"); await view.click("No"); await view.click("Next →");
    now = 31_000; tick(); await view.render();
    expect(view.events).toContainEqual({ action: "answer_submitted", itemId: "one", chosenAnswer: "no", observedCorrect: false });
    expect(view.events).toContainEqual({ action: "timed_out", itemId: "two" });
    expect(view.results).toHaveLength(1);
    expect(view.events.slice(-1)).toEqual([{ action: "completed" }]);
  });
});
