import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCourseByKey } from "@shared/courseRegistry";

// Exercise actual component handlers without a DOM, auth provider, or services.
const hooks = vi.hoisted(() => ({ cursor: 0, state: [] as unknown[], fetch: vi.fn() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useId: () => "homepage-demo-test",
  useRef: () => ({ current: null }),
  useState(initial: unknown) {
    const index = hooks.cursor++;
    if (!(index in hooks.state)) hooks.state[index] = initial;
    return [hooks.state[index], (next: unknown) => {
      hooks.state[index] = typeof next === "function" ? next(hooks.state[index]) : next;
    }];
  },
}));
vi.mock("@/components/SiteNav", () => ({ ECHELON_LOGO_URL: "/fixture-logo.webp" }));
import HomepageProductDemo from "./HomepageProductDemo";
import StepSolution from "./StepSolution";

type Element = ReactElement<Record<string, any>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Record<string, any>>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (React.isValidElement<Record<string, any>>(node)) return text(node.props.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}
function demo() {
  let tree: Element;
  const render = () => { hooks.cursor = 0; tree = HomepageProductDemo(); };
  const find = (predicate: (element: Element) => boolean) => {
    const found = elements(tree).find(predicate);
    if (!found) throw new Error("Missing demo element");
    return found;
  };
  render();
  return {
    find,
    content: () => text(tree),
    input: () => find(node => node.type === "input"),
    button: (label: string) => find(node => node.type === "button" && text(node) === label),
    type(value: string) { find(node => node.type === "input").props.onChange({ target: { value } }); render(); },
    check() { find(node => node.type === "form").props.onSubmit({ preventDefault: vi.fn() }); render(); },
    click(label: string) { find(node => node.type === "button" && text(node) === label).props.onClick(); render(); },
    solution: () => elements(tree).find(node => node.type === StepSolution),
  };
}

beforeEach(() => {
  hooks.state = [];
  hooks.cursor = 0;
  hooks.fetch.mockReset();
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", hooks.fetch);
});
afterEach(() => {
  expect(hooks.fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("HomepageProductDemo local interactive example", () => {
  it("starts with the real question, accessible label, no exposed answer, and the matching course link", () => {
    const view = demo();
    expect(view.content()).toContain("Interactive example · Water Class 1");
    expect(view.content()).toContain("A plant treats 25 L/s. What is the daily flow in m³/d?");
    expect(view.content()).not.toContain("2,160");
    expect(view.solution()).toBeUndefined();
    expect(view.find(node => node.type === "label").props.htmlFor).toBe(view.input().props.id);
    expect(view.find(node => node.props.role === "status").props["aria-live"]).toBe("polite");
    expect(view.find(node => text(node).trim() === "Try Class 1 Water practice" && !!node.props.href).props.href).toBe(getCourseByKey("class1-water")!.quizPath);
    expect(view.find(node => text(node) === "Explore Water OIT games" && !!node.props.href).props.href).toBe("/courses/oit/interactive");
    expect(view.find(node => node.type === "img").props.src).toBe("/fixture-logo.webp");
  });

  it("preserves the first incorrect check while allowing edits and successful retries", () => {
    const view = demo();
    view.type("25"); view.check();
    expect(view.content()).toContain("Not quite.");
    expect(view.content()).toContain("First checked answer: 25 m³/d (incorrect).");
    expect(view.input().props.value).toBe("25");
    expect(view.input().props["aria-invalid"]).toBe(true);
    view.type("250"); view.check();
    expect(view.content()).toContain("First checked answer: 25 m³/d (incorrect).");
    view.type("2160"); view.check();
    expect(view.content()).toContain("Correct. 25 × 86.4 = 2,160 m³/d.");
    expect(view.content()).toContain("First checked answer: 25 m³/d (incorrect).");
    expect(view.input().props["aria-invalid"]).toBe(false);
  });

  it.each(["2160", "2,160", "2160.0", " 2,160.00 "])("accepts numeric answer %s", answer => {
    const view = demo(); view.type(answer); view.check();
    expect(view.content()).toContain("Correct.");
    expect(view.content()).not.toContain("First checked answer:");
  });

  it.each(["", " ", "not a number", "Infinity", "NaN", "25 × 86.4", "21,60", "2,160 m³/d", "0x870"])("rejects invalid input %j without recording an attempt", answer => {
    const view = demo(); view.type(answer); view.check();
    expect(view.content()).toContain("Enter a number, with or without thousands commas.");
    expect(view.content()).not.toContain("First checked answer:");
  });

  it("does not round an incorrect result up to the expected answer", () => {
    const view = demo(); view.type("2159.99"); view.check();
    expect(view.content()).toContain("Not quite.");
  });

  it("reveals and collapses the existing shared worked solution with honest steps", () => {
    const view = demo();
    expect(view.button("Show worked solution").props["aria-expanded"]).toBe(false);
    view.click("Show worked solution");
    expect(view.button("Hide worked solution").props["aria-expanded"]).toBe(true);
    const solution = view.solution()!;
    const html = renderToStaticMarkup(React.createElement(StepSolution, solution.props as { steps: unknown; tip?: string }));
    expect(html).toContain("Q = 25 × 86.4");
    expect(html).toContain("2,160 m³/d");
    expect(html).toContain("1 L/s = 86.4 m³/d.");
    view.click("Hide worked solution");
    expect(view.solution()).toBeUndefined();
  });

  it("reset clears the entered answer, feedback, first attempt, and revealed solution", () => {
    const view = demo(); view.type("10"); view.check(); view.click("Show worked solution");
    view.click(" Reset");
    expect(view.input().props.value).toBe("");
    expect(view.content()).not.toContain("First checked answer:");
    expect(view.content()).not.toContain("Not quite.");
    expect(view.content()).toContain("this example isn’t saved");
    expect(view.solution()).toBeUndefined();
    expect(view.button("Show worked solution").props["aria-expanded"]).toBe(false);
  });
});
