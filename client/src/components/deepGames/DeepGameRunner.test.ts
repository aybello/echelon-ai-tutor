import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import type { DeepSessionResponse, DeepTask, LadderTask, ProcessTask, ErrorTask, EvidenceTask } from "@shared/deepGames";
import type { DeepGameActivity } from "./DeepGameRunner";

// Real component handlers and pure scoring, deterministic hooks only. This is not a DOM/browser test.
const harness = vi.hoisted(() => ({ path: "", cursor: 0, cells: new Map<string, any>(), effects: [] as Array<() => void> }));
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
  useEffect(effect: () => void, dependencies: any[]) {
    const key = `${harness.path}:${harness.cursor++}`;
    const previous = harness.cells.get(key);
    if (!previous || dependencies.some((value, index) => value !== previous[index])) harness.effects.push(effect);
    harness.cells.set(key, dependencies);
  },
}));
import { DeepGameRunner } from "./DeepGameRunner";

type Node = { type: any; props: any; children: Node[] };
function expand(element: any, path = "root"): Node[] {
  if (element == null || typeof element === "boolean") return [];
  if (Array.isArray(element)) return element.flatMap((child, index) => expand(child, `${path}/${child?.key ?? index}`));
  if (typeof element !== "object") return [{ type: "text", props: { text: String(element) }, children: [] }];
  if (element.type === React.Fragment) return expand(element.props.children, `${path}/fragment`);
  if (typeof element.type === "function") {
    harness.path = `${path}/${element.type.name}/${element.key ?? ""}`; harness.cursor = 0;
    return expand(element.type(element.props), harness.path);
  }
  return [{ type: element.type, props: element.props, children: expand(element.props.children, `${path}/children`) }];
}
const flatten = (nodes: Node[]): Node[] => nodes.flatMap(node => [node, ...flatten(node.children)]);
const text = (node: Node): string => node.type === "text" ? node.props.text : node.children.map(text).join("");
const base = { revision: "r1", prompt: "Synthetic task prompt", assumptions: "Synthetic stated assumptions", topicId: "synthetic", level: "oit" as const };
const choice = (id: string) => ({ id, prompt: `Decision ${id}`, options: [{ id: "wrong", label: `${id} alternative` }, { id: "right", label: `${id} target` }], correctOptionId: "right", explanation: `Private explanation ${id}` });
const ladder: LadderTask = { ...base, id: "ladder-source", mode: "calculation-ladder", choices: [choice("formula"), choice("units"), choice("substitution")], result: { id: "result", prompt: "Enter zero units to two decimal places", unitOptions: [{ id: "u", label: "Units" }, { id: "bad", label: "Other units" }], expected: "0", expectedUnitId: "u", absoluteTolerance: "0", explanation: "Private result explanation" } };
const process: ProcessTask = { ...base, id: "process-source", mode: "build-process", configuration: "One synthetic reviewed order", cards: [{ id: "C", label: "Card C" }, { id: "A", label: "Card A" }, { id: "B", label: "Card B" }], correctOrder: ["A", "B", "C"], explanation: "Private order explanation" };
const errorTask: ErrorTask = { ...base, id: "error-source", mode: "find-calculation-error", lines: [{ id: "line-a", label: "First displayed working" }, { id: "line-b", label: "Second displayed working" }], firstWrongLineId: "line-b", correctedLine: "Private corrected working", explanation: "Private error explanation" };
const evidence: EvidenceTask = { ...base, id: "evidence-source", mode: "evidence-detective", evidence: [{ id: "observation", label: "Synthetic visible observation" }], inference: choice("inference"), nextClue: choice("next-clue"), clueText: { wrong: "Private alternative clue", right: "Private target clue" } };
function session(tasks: DeepTask[], mission = false, id = "delivery-one"): DeepSessionResponse {
  const occurrences = tasks.map((task, index) => ({ id: `occurrence:${index}`, sourceId: task.id, task }));
  return { sessionId: id, courseKey: "oit", version: "v1", mode: mission ? "exam-escape-room" : tasks[0].mode, tasks: occurrences, ...(mission ? { mission: { id: "mission", revision: "r1", mode: "exam-escape-room" as const, title: "Synthetic mission", tasks: occurrences.map(item => ({ taskId: item.sourceId, revision: item.task.revision, occurrenceId: item.id })) } } : {}) };
}
async function game(initial: DeepSessionResponse, throwObservation = false) {
  const events: DeepGameActivity[] = [];
  let delivery = initial;
  const newRound = vi.fn();
  let tree: Node[] = [];
  const render = async () => { tree = expand(React.createElement(DeepGameRunner, { session: delivery, onNewRound: newRound, onActivity: event => { if (throwObservation) throw Error("offline"); events.push(event); } })); harness.effects.splice(0).forEach(effect => effect()); await Promise.resolve(); };
  const nodes = () => flatten(tree);
  const button = (label: string) => {
    const found = nodes().find(node => node.type === "button" && text(node) === label);
    if (!found) throw Error(`Missing button ${label}: ${nodes().filter(node => node.type === "button").map(text)}`);
    return found;
  };
  await render();
  return {
    events, newRound, render, nodes, button,
    content: () => tree.map(text).join(""),
    async click(label: string) { const node = button(label); if (!node.props.disabled) node.props.onClick({}); await render(); },
    async radio(label: string) { const found = nodes().find(node => node.type === "label" && text(node) === label); if (!found) throw Error(`Missing radio ${label}`); const input = flatten(found.children).find(node => node.type === "input")!; if (!input.props.disabled) input.props.onChange(); await render(); },
    async input(value: string) { const node = nodes().find(node => node.type === "input" && node.props.type === "text")!; node.props.onChange({ target: { value } }); await render(); },
    async unit(value: string) { nodes().find(node => node.type === "select")!.props.onChange({ target: { value } }); await render(); },
    async move(name: string) { const node = nodes().find(node => node.type === "button" && node.props["aria-label"] === name); if (!node) throw Error(`Missing move ${name}`); if (!node.props.disabled) node.props.onClick(); await render(); },
    async deliver(next: DeepSessionResponse) { delivery = next; await render(); },
  };
}
async function solveLadder(view: Awaited<ReturnType<typeof game>>) {
  for (const id of ["formula", "units", "substitution"]) { await view.radio(`${id} target`); await view.click("Check answer"); await view.click("Next step"); }
  await view.input("0.00"); await view.unit("u"); await view.click("Check result");
}
async function solveProcess(view: Awaited<ReturnType<typeof game>>) { await view.move("Move Card C down"); await view.move("Move Card C down"); await view.click("Check order"); }
async function solveError(view: Awaited<ReturnType<typeof game>>) { await view.radio("Line 2: Second displayed working"); await view.click("Check answer"); }
async function solveEvidence(view: Awaited<ReturnType<typeof game>>) {
  await view.radio("inference target"); await view.click("Check answer");
  await view.radio("next-clue target");
  const unchecked = view.nodes().find(node => node.type === "button" && text(node) === "Check answer" && !node.props.disabled)!;
  unchecked.props.onClick(); await view.render();
}
beforeEach(() => { harness.cells.clear(); harness.effects = []; vi.stubGlobal("React", React); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("deeper game actual component handlers (no browser)", () => {
  it("gates ladder steps, preserves first answers, logs explicit retry and never leaks future explanations", async () => {
    const view = await game(session([ladder]));
    expect(view.events).toEqual([{ action: "started" }, { action: "item_presented", itemId: "occurrence:0" }]);
    expect(view.content()).not.toContain("Private explanation");
    expect(view.content()).not.toContain(ladder.result.prompt);
    expect(view.button("Next step").props.disabled).toBe(true);
    await view.radio("formula alternative"); expect(view.events).toHaveLength(2);
    await view.click("Check answer");
    expect(view.events.at(-1)).toEqual({ action: "step_answer", itemId: "occurrence:0", stepId: "formula", chosenAnswer: "wrong", observedCorrect: false });
    expect(view.content()).not.toContain("Private explanation formula");
    await view.click("Show explanation");
    expect(view.content()).toContain("Private explanation formula");
    expect(view.events.at(-1)).toEqual({ action: "explanation_opened", itemId: "occurrence:0", stepId: "formula" });
    await view.click("Try again"); expect(view.events.at(-1)).toEqual({ action: "retry", itemId: "occurrence:0", stepId: "formula" });
    await view.radio("formula target"); await view.click("Check answer");
    expect(view.content()).toContain("Correct after retry; your first answer is preserved.");
    await view.click("Next step");
    for (const id of ["units", "substitution"]) { await view.radio(`${id} target`); await view.click("Check answer"); await view.click("Next step"); }
    await view.input("0.00"); await view.unit("u"); await view.click("Check result");
    expect(view.events.at(-1)).toEqual({ action: "step_answer", itemId: "occurrence:0", stepId: "result", chosenAnswer: "n:0.00:u", observedCorrect: true });
    expect(view.events.some(event => event.action === "completed")).toBe(false);
    const finish = view.button("Finish round"); finish.props.onClick(); finish.props.onClick(); await view.render();
    expect(view.content()).toContain("3 / 4 steps"); expect(view.content()).toContain("4 / 4 steps");
    expect(view.events.filter(event => event.action === "completed")).toHaveLength(1);
    expect(view.content()).toContain("Explicit retries1");
  });
  it("malformed numeric values do not fabricate answers; wrong units are valid incorrect attempts", async () => {
    const view = await game(session([ladder]));
    for (const id of ["formula", "units", "substitution"]) { await view.radio(`${id} target`); await view.click("Check answer"); await view.click("Next step"); }
    const count = view.events.length;
    await view.click("Check result"); expect(view.content()).toContain("Choose a unit");
    await view.unit("u");
    for (const value of ["", " 0", "+0", "00", ".0", "1e2", "1+1", "Infinity", "NaN", "1,000", "0."]) {
      await view.input(value); await view.click("Check result");
      expect(view.nodes().some(node => node.props.role === "alert")).toBe(true);
    }
    expect(view.events).toHaveLength(count);
    await view.input("0"); await view.unit("bad"); await view.click("Check result");
    expect(view.events.at(-1)?.observedCorrect).toBe(false); expect(view.button("Finish round").props.disabled).toBe(true);
    await view.click("Try again"); await view.unit("u"); await view.click("Check result"); await view.click("Finish round");
    expect(view.content()).toContain("3 / 4 steps"); expect(view.content()).toContain("4 / 4 steps");
  });
  it("process moves log no pointer/selection stream; checks log exact slots; retry then confirm works", async () => {
    const view = await game(session([process]));
    expect(view.content()).not.toContain(process.explanation);
    await view.click("Check order");
    expect(view.events.filter(event => event.action === "step_answer").map(event => [event.stepId, event.chosenAnswer, event.observedCorrect])).toEqual([["slot:0", "C", false], ["slot:1", "A", false], ["slot:2", "B", false]]);
    expect(view.button("Finish round").props.disabled).toBe(true);
    await view.click("Try order again"); const eventCount = view.events.length;
    await view.move("Move Card C down"); await view.move("Move Card C down");
    expect(view.events).toHaveLength(eventCount);
    await view.click("Check order"); expect(view.button("Finish round").props.disabled).toBe(false);
    await view.click("Finish round");
    expect(view.content()).toContain("0 / 3 steps"); expect(view.content()).toContain("3 / 3 steps"); expect(view.content()).toContain("Explicit retries1");
    expect(view.events.filter(event => event.action === "retry").map(event => event.stepId)).toEqual(["slot:0", "slot:1", "slot:2"]);
  });
  it("process supports drag/drop and Alt-arrow moves using the same permutation", async () => {
    const view = await game(session([process]));
    const rows = () => view.nodes().filter(node => node.type === "li" && node.props.draggable !== undefined);
    rows()[0].props.onDragStart({ dataTransfer: { setData: vi.fn() } });
    rows()[2].props.onDrop({ preventDefault: vi.fn() }); await view.render();
    expect(rows().map(text).map(value => value.includes("Card A") ? "A" : value.includes("Card B") ? "B" : "C")).toEqual(["A", "B", "C"]);
    rows()[1].props.onKeyDown({ altKey: true, key: "ArrowUp", preventDefault: vi.fn() }); await view.render();
    expect(text(rows()[0])).toContain("Card B");
    rows()[0].props.onKeyDown({ altKey: true, key: "ArrowDown", preventDefault: vi.fn() }); await view.render();
    await view.click("Check order"); expect(view.button("Finish round").props.disabled).toBe(false);
    expect(view.events.filter(event => event.action === "step_answer")).toHaveLength(3);
  });
  it("error diagnosis reveals corrected line only after Check, and keeps the first wrong line choice", async () => {
    const view = await game(session([errorTask]));
    expect(view.content()).not.toContain(errorTask.correctedLine);
    await view.radio("Line 1: First displayed working"); expect(view.content()).not.toContain(errorTask.correctedLine);
    await view.click("Check answer"); expect(view.content()).toContain(errorTask.correctedLine);
    expect(view.content()).not.toContain(errorTask.explanation);
    await view.click("Show explanation"); expect(view.content()).toContain(errorTask.explanation);
    await view.click("Try again"); await solveError(view); await view.click("Finish round");
    expect(view.content()).toContain("0 / 1 steps"); expect(view.content()).toContain("1 / 1 steps");
    expect(view.events.filter(event => event.action === "step_answer").map(event => [event.stepId, event.chosenAnswer])).toEqual([["first-error", "line-a"], ["first-error", "line-b"]]);
  });
  it("evidence decisions score independently and reveal only the checked authored clue", async () => {
    const view = await game(session([evidence]));
    expect(view.content()).toContain("Synthetic visible observation");
    expect(view.content()).not.toContain("Private target clue"); expect(view.content()).not.toContain("Private alternative clue");
    await view.radio("inference target"); await view.click("Check answer");
    await view.radio("next-clue alternative"); await view.click("Check answer");
    expect(view.content()).toContain("Private alternative clue"); expect(view.content()).not.toContain("Private target clue");
    expect(view.events.some(event => event.action === "explanation_opened")).toBe(false);
    expect(view.events.filter(event => event.action === "step_answer").map(event => [event.stepId, event.observedCorrect])).toEqual([["inference", true], ["next-clue", false]]);
    expect(view.button("Finish round").props.disabled).toBe(true);
    await view.click("Try again"); await view.radio("next-clue target"); await view.click("Check answer");
    expect(view.content()).toContain("Private target clue"); expect(view.content()).not.toContain("Private alternative clue");
    await view.click("Finish round"); expect(view.content()).toContain("1 / 2 steps"); expect(view.content()).toContain("2 / 2 steps");
  });
  it("mission composes all four renderers and completes once only after every stage", async () => {
    const view = await game(session([ladder, process, errorTask, evidence], true));
    expect(view.button("Next stage").props.disabled).toBe(true);
    await solveLadder(view); expect(view.events.some(event => event.action === "completed")).toBe(false); await view.click("Next stage");
    await solveProcess(view); await view.click("Next stage");
    await solveError(view); await view.click("Next stage");
    await solveEvidence(view); expect(view.events.some(event => event.action === "completed")).toBe(false);
    await view.click("Finish round");
    expect(view.content()).toContain("10 / 10 steps");
    expect(view.events.filter(event => event.action === "item_presented").map(event => event.itemId)).toEqual(["occurrence:0", "occurrence:1", "occurrence:2", "occurrence:3"]);
    expect(view.events.filter(event => event.action === "completed")).toHaveLength(1);
  });
  it("new round calls parent once without replaying a capability; changed delivery resets state", async () => {
    const view = await game(session([errorTask])); await solveError(view); await view.click("Finish round");
    const count = view.events.length; const button = view.button("New round"); button.props.onClick(); button.props.onClick(); await view.render();
    expect(view.newRound).toHaveBeenCalledTimes(1); expect(view.events).toHaveLength(count);
    expect(view.button("Requesting new round…").props.disabled).toBe(true);
    await view.deliver(session([errorTask], false, "delivery-two"));
    expect(view.content()).not.toContain("Private corrected working"); expect(view.button("Finish round").props.disabled).toBe(true);
    expect(view.events.filter(event => event.action === "started")).toHaveLength(2);
  });
  it("guarded duplicate handlers do not duplicate answers, explanations, retries or lifecycle effects", async () => {
    const view = await game(session([errorTask])); await view.radio("Line 1: First displayed working");
    const check = view.button("Check answer"); check.props.onClick(); check.props.onClick(); await view.render();
    expect(view.events.filter(event => event.action === "step_answer")).toHaveLength(1);
    const explain = view.button("Show explanation"); explain.props.onClick(); explain.props.onClick(); await view.render();
    const retry = view.button("Try again"); retry.props.onClick(); retry.props.onClick(); await view.render();
    expect(view.events.filter(event => event.action === "explanation_opened")).toHaveLength(1);
    expect(view.events.filter(event => event.action === "retry")).toHaveLength(1);
    await view.render(); expect(view.events.filter(event => event.action === "started")).toHaveLength(1);
  });
  it("rapid Next clicks cannot skip a required task or reactivate old handlers", async () => {
    const view = await game(session([errorTask, { ...errorTask, id: "second-error" }, { ...errorTask, id: "third-error" }]));
    await solveError(view);
    const oldExplanation = view.button("Show explanation");
    const next = view.button("Next task"); next.props.onClick(); next.props.onClick(); oldExplanation.props.onClick(); await view.render();
    expect(view.events.filter(event => event.action === "item_presented").map(event => event.itemId)).toEqual(["occurrence:0", "occurrence:1"]);
    expect(view.button("Next task").props.disabled).toBe(true);
    expect(view.events.some(event => event.action === "explanation_opened")).toBe(false);
    expect(view.events.some(event => event.action === "completed")).toBe(false);
  });
  it.each(["oit", "class1-water"] as const)("does not depend on tracking availability or course-specific authorship for %s", async courseKey => {
    const delivery = session([errorTask]); delivery.courseKey = courseKey; delivery.tasks[0].task = { ...errorTask, level: courseKey === "oit" ? "oit" : "class1" };
    const view = await game(delivery, true); await solveError(view); await view.click("Finish round");
    expect(view.content()).toContain("Practice round complete"); expect(view.content()).toContain("1 / 1 steps");
  });
});
