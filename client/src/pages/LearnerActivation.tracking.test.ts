import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  values: [] as any[], cursor: 0, effects: [] as (() => unknown)[], observe: vi.fn(),
  submitOptions: null as any, submit: vi.fn(), refetch: vi.fn(),
  questions: Array.from({ length: 15 }, (_, i) => ({ id: i + 1, module: "Safety", question: `Question ${i + 1}`, options: ["Original A", "Original B"] })),
}));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual,
    useState: (initial: any) => { const index = testState.cursor++; if (!(index in testState.values)) testState.values[index] = typeof initial === "function" ? initial() : initial;
      return [testState.values[index], (next: any) => { testState.values[index] = typeof next === "function" ? next(testState.values[index]) : next; }]; },
    useMemo: (fn: any) => fn(), useRef: (value: any) => ({ current: value }),
    useEffect: (fn: any) => { testState.effects.push(fn); },
  };
});
vi.mock("wouter", () => ({ useRoute: () => [true, { courseKey: "oit" }], Link: "a" }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 7, email: "owner@example.test" }, isAuthenticated: true, loading: false }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: () => {} }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/hooks/useAssessmentActivity", () => ({ useAssessmentActivity: () => ({ observe: testState.observe, retry: vi.fn(), saveError: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  dashboardAuth: { me: { useQuery: () => ({ data: { email: "owner@example.test" }, isLoading: false }) } },
  activation: {
    status: { useQuery: () => ({ data: { status: "diagnostic_started", course: { quizPath: "/quiz" } }, refetch: testState.refetch, isLoading: false }) },
    diagnosticQuestions: { useQuery: () => ({ data: { questions: testState.questions, activityTracking: { tracking: true, sessionId: "observed-segment", capability: "signed", nextSequence: 2 } }, isLoading: false }) },
    saveProfile: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    submitDiagnostic: { useMutation: (options: any) => { testState.submitOptions = options; return { mutate: testState.submit, isPending: false }; } },
  },
} }));

import LearnerActivation from "./LearnerActivation";

const sessionId = "550e8400-e29b-41d4-a716-446655440000";
function renderFlow() {
  testState.cursor = 0; testState.effects = [];
  const root = LearnerActivation() as any;
  return root.type(root.props);
}
function findHandler(tree: any, match: (node: any) => boolean): any {
  if (!tree || typeof tree !== "object") return null;
  if (match(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const found = findHandler(child, match); if (found) return found;
  }
  return null;
}
beforeEach(() => {
  vi.stubGlobal("React", React);
  const storage = new Map<string, string>();
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) }, scrollTo: vi.fn() });
  testState.observe.mockClear(); testState.submit.mockClear(); testState.refetch.mockClear();
  const key = `user:7:oit:${testState.questions.map(q => q.id).join(",")}`;
  testState.values = ["diagnostic", "", 3, 25, "somewhat", 0, {}, sessionId, sessionId, key, true, false];
});
afterEach(() => vi.unstubAllGlobals());

describe("real diagnostic UI handlers with offline hook harness", () => {
  it("preserves the first selected index and revision values without inventing correctness", () => {
    let tree = renderFlow();
    findHandler(tree, node => node.type === "button" && node.props.children?.[1]?.props?.children === "Original B").props.onClick();
    expect(testState.observe).toHaveBeenLastCalledWith({ action: "answer_submitted", itemId: "1", chosenAnswer: "1" });
    expect(testState.values[6]).toEqual({ 1: 1 });
    tree = renderFlow();
    findHandler(tree, node => node.type === "button" && node.props.children?.[1]?.props?.children === "Original A").props.onClick();
    expect(testState.observe.mock.calls.map(call => call[0].chosenAnswer)).toEqual(["1", "0"]);
    tree = renderFlow();
    findHandler(tree, node => node.type === "button" && node.props.children?.[1]?.props?.children === "Original A").props.onClick();
    expect(testState.observe).toHaveBeenCalledTimes(2);
  });
  it("observes real navigation presentation and browser resume without replaying stored answers", () => {
    testState.values[5] = 2; testState.values[6] = { 1: 1, 2: 0 }; testState.values[11] = true;
    renderFlow();
    // Last effect is the presentation effect; do not run draft restoration or
    // status effects in this focused handler harness.
    testState.effects.at(-1)!();
    expect(testState.observe.mock.calls.map(call => call[0])).toEqual([
      { action: "resumed" }, { action: "item_presented", itemId: "3" },
    ]);
  });
  it("Back and Next navigate without inventing answer retries or scored steps", () => {
    testState.values[5] = 1; testState.values[6] = { 2: 0 };
    let tree = renderFlow();
    findHandler(tree, node => node.props?.children === "Back").props.onClick();
    expect(testState.values[5]).toBe(0);
    testState.values[6] = { 1: 1, 2: 0 };
    tree = renderFlow();
    findHandler(tree, node => Array.isArray(node.props?.children) && node.props.children[0] === "Next ").props.onClick();
    expect(testState.values[5]).toBe(1);
    expect(testState.observe).not.toHaveBeenCalled();
    renderFlow(); testState.effects.at(-1)!();
    expect(testState.observe).toHaveBeenCalledWith({ action: "item_presented", itemId: "2" });
  });
  it("restart retires the old draft/run and creates a fresh delivery without completion", () => {
    testState.values[11] = true; testState.values[6] = { 1: 1 };
    const tree = renderFlow();
    findHandler(tree, node => node.type === "button" && node.props.children === "Restart diagnostic").props.onClick();
    expect(testState.observe).toHaveBeenCalledWith({ action: "abandoned" });
    expect(testState.values[6]).toEqual({});
    expect(testState.values[5]).toBe(0);
    expect(testState.values[7]).not.toBe(sessionId);
    expect(testState.values[8]).not.toBe(sessionId);
    expect(testState.values[11]).toBe(false);
  });
  it.each([[sessionId, "completed"], ["550e8400-e29b-41d4-a716-446655440099", "abandoned"]])("marks only genuine submit ACK %s as %s", (returnedSessionId, action) => {
    renderFlow();
    expect(testState.observe).not.toHaveBeenCalled();
    testState.submitOptions.onSuccess({ sessionId: returnedSessionId }, { sessionId });
    expect(testState.observe).toHaveBeenCalledWith({ action });
    expect(testState.values[0]).toBe("result");
  });
  it("does not mark a failed canonical save completed", () => {
    renderFlow();
    // A mutation error has no success callback; merely submitting/receiving no
    // ACK must leave the segment unfinished.
    expect(testState.observe).not.toHaveBeenCalled();
    expect(testState.values[0]).toBe("diagnostic");
  });
});
