import * as React from "react";
import { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RecruitmentCandidateView } from "@shared/recruitmentAssessment";

// Execute the actual component hooks and async handlers in Node; no server, DOM or network.
const h = vi.hoisted(() => ({
  slots: [] as any[],
  cursor: 0,
  effects: [] as (() => void)[],
  dirty: false,
  query: {} as any,
  client: null as any,
  utils: null as any,
  fetch: vi.fn(),
  cancel: vi.fn(),
  start: vi.fn(),
  save: vi.fn(),
  submit: vi.fn(),
  listeners: new Map<string, Set<(...args: any[]) => void>>(),
}));
vi.mock("react", async original => ({
  ...(await original<typeof import("react")>()),
  useRef: (value: unknown) => {
    const i = h.cursor++;
    return (h.slots[i] ??= { current: value });
  },
  useState: (initial: any) => {
    const i = h.cursor++;
    h.slots[i] ??= {
      value: typeof initial === "function" ? initial() : initial,
    };
    return [
      h.slots[i].value,
      (value: any) => {
        const next =
          typeof value === "function" ? value(h.slots[i].value) : value;
        if (!Object.is(next, h.slots[i].value)) {
          h.slots[i].value = next;
          h.dirty = true;
        }
      },
    ];
  },
  useCallback: (fn: unknown, deps: unknown[]) => {
    const i = h.cursor++;
    if (!h.slots[i] || deps.some((v, n) => !Object.is(v, h.slots[i].deps[n])))
      h.slots[i] = { fn, deps };
    return h.slots[i].fn;
  },
  useEffect: (fn: () => void | (() => void), deps: unknown[]) => {
    const i = h.cursor++;
    if (!h.slots[i] || deps.some((v, n) => !Object.is(v, h.slots[i].deps[n]))) {
      const old = h.slots[i];
      h.slots[i] = { deps };
      h.effects.push(() => {
        old?.cleanup?.();
        h.slots[i].cleanup = fn();
      });
    }
  },
}));
vi.mock("@tanstack/react-query", async original => ({
  ...(await original<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => h.client,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => h.utils,
    recruitment: {
      candidateGet: {
        _def: () => ({ path: ["recruitment", "candidateGet"] }),
        useQuery: () => h.query,
      },
      start: { useMutation: () => ({ mutateAsync: h.start }) },
      saveAnswer: { useMutation: () => ({ mutateAsync: h.save }) },
      submit: { useMutation: () => ({ mutateAsync: h.submit }) },
    },
  },
}));
vi.mock("wouter", () => ({ useRoute: () => [true, null] }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/components/SiteNav", () => ({
  ECHELON_LOGO_URL: "/synthetic-logo.svg",
}));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@/components/ui/checkbox", () => ({ Checkbox: "checkbox" }));
vi.mock("@/components/ui/label", () => ({ Label: "label" }));
vi.mock("@/components/ui/radio-group", () => ({
  RadioGroup: "radio-group",
  RadioGroupItem: "radio-item",
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: "dialog",
  DialogContent: "dialog-content",
  DialogDescription: "dialog-description",
  DialogFooter: "dialog-footer",
  DialogHeader: "dialog-header",
  DialogTitle: "dialog-title",
}));
import RecruitmentAssessment from "./RecruitmentAssessment";
import { trpc } from "@/lib/trpc";

const assignmentId = "11111111-1111-4111-8111-111111111111";
const fixture: RecruitmentCandidateView = {
  assignmentId,
  title: "Private assessment title",
  orgName: "Private organisation",
  courseLabel: "Class 2 Water",
  modules: ["Treatment"],
  questionCount: 1,
  timeLimitMinutes: 5,
  expiresAtMs: Date.now() + 900000,
  deadlineMs: Date.now() + 300000,
  serverNowMs: Date.now(),
  startedAtMs: Date.now(),
  submittedAtMs: null,
  status: "active",
  revision: 7,
  notice: "Synthetic notice",
  answers: { q1: 1 },
  questions: [
    {
      id: "q1",
      module: "Treatment",
      prompt: "Private synthetic question",
      options: ["First private option", "Second private option"],
    },
  ],
};
function nodes(tree: any): any[] {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (tree === null || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree: any): string {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  return tree?.props ? text(tree.props.children) : "";
}
function rawRender() {
  h.cursor = 0;
  const element = nodes(
    RecruitmentAssessment({ params: { assignmentId } })
  ).find(
    n => typeof n.type === "function" && n.type.name === "CandidateAssessment"
  );
  return element.type(element.props);
}
function render() {
  let tree: any;
  for (let i = 0; i < 20; i++) {
    h.dirty = false;
    tree = rawRender();
    for (const effect of h.effects.splice(0)) effect();
    if (!h.dirty) return tree;
  }
  throw new Error("Component did not settle");
}
function button(tree: any, label: string) {
  return nodes(tree).find(n => n.type === "button" && text(n) === label);
}
function emit(name: string, event?: any) {
  for (const listener of [...(h.listeners.get(name) ?? [])]) listener(event);
}
async function settle() {
  for (let i = 0; i < 25; i++) {
    await Promise.resolve();
    render();
  }
}
function fail(code: string) {
  return Object.assign(new Error(`Synthetic ${code}`), { data: { code } });
}
const key = () =>
  getQueryKey(trpc.recruitment.candidateGet, { assignmentId }, "query");
function ready(view = fixture) {
  h.query = {
    data: view,
    isFetching: false,
    isFetchedAfterMount: true,
    isSuccess: true,
    isError: false,
    isLoading: false,
  };
  h.client.setQueryData(key(), view);
  return render();
}
beforeEach(() => {
  h.slots = [];
  h.effects = [];
  h.cursor = 0;
  h.dirty = false;
  h.listeners.clear();
  for (const mock of [h.fetch, h.cancel, h.start, h.save, h.submit])
    mock.mockReset();
  h.cancel.mockResolvedValue(undefined);
  h.fetch.mockResolvedValue(fixture);
  h.start.mockResolvedValue(fixture);
  h.save.mockResolvedValue({ ...fixture, revision: 8 });
  h.submit.mockResolvedValue({ ...fixture, status: "submitted", revision: 8 });
  h.query = {
    data: fixture,
    isFetching: false,
    isFetchedAfterMount: false,
    isSuccess: true,
    isError: false,
    isLoading: false,
  };
  h.client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  h.utils = {
    recruitment: {
      candidateGet: {
        cancel: h.cancel,
        fetch: h.fetch,
        setData: (_: unknown, next: unknown) =>
          h.client.setQueryData(key(), next),
      },
    },
  };
  const events = {
    addEventListener: (name: string, fn: (...args: any[]) => void) => {
      if (!h.listeners.has(name)) h.listeners.set(name, new Set());
      h.listeners.get(name)!.add(fn);
    },
    removeEventListener: (name: string, fn: (...args: any[]) => void) =>
      h.listeners.get(name)?.delete(fn),
  };
  vi.stubGlobal("React", React);
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("window", {
    ...events,
    setInterval: () => 1,
    clearInterval: () => {},
  });
  vi.stubGlobal("document", { ...events, visibilityState: "visible" });
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => fn());
});
afterEach(() => {
  for (const slot of h.slots) slot?.cleanup?.();
  h.client.clear();
  vi.unstubAllGlobals();
});

describe("candidate assessment session and confirmation contract", () => {
  it("never hydrates cached entry data before the fresh successful response has finished", () => {
    expect(text(render())).not.toContain(fixture.title);
    h.query.isFetchedAfterMount = true;
    h.query.isFetching = true;
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
    h.query.isFetching = false;
    expect(text(render())).toContain(fixture.questions[0].prompt);
  });

  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "clears the view and only the exact candidate cache on query %s",
    code => {
      const otherKey = getQueryKey(
        trpc.recruitment.candidateGet,
        { assignmentId: "22222222-2222-4222-8222-222222222222" },
        "query"
      );
      ready();
      h.client.setQueryData(otherKey, { safe: "other fixture" });
      h.query = {
        ...h.query,
        error: fail(code),
        isError: true,
        isSuccess: false,
      };
      const tree = render();
      expect(text(tree)).not.toContain(fixture.title);
      expect(text(tree)).not.toContain(fixture.questions[0].prompt);
      expect(h.client.getQueryData(key())).toBeUndefined();
      expect(h.client.getQueryData(otherKey)).toEqual({
        safe: "other fixture",
      });
    }
  );

  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "clears candidate state on save %s and never replays the answer",
    async code => {
      const tree = ready();
      h.save.mockRejectedValue(fail(code));
      nodes(tree)
        .find(n => n.type === "radio-group")
        .props.onValueChange("0");
      await settle();
      expect(text(render())).not.toContain(fixture.questions[0].prompt);
      expect(h.client.getQueryData(key())).toBeUndefined();
      expect(h.save).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "clears candidate state on start %s",
    async code => {
      let tree = ready({
        ...fixture,
        status: "invited",
        questions: [],
        answers: {},
      });
      h.start.mockRejectedValue(fail(code));
      nodes(tree)
        .find(n => n.type === "checkbox")
        .props.onCheckedChange(true);
      tree = render();
      button(tree, "Start assessment").props.onClick();
      await settle();
      expect(text(render())).not.toContain(fixture.title);
      expect(h.client.getQueryData(key())).toBeUndefined();
    }
  );

  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "clears candidate state on manual refresh %s",
    async code => {
      const tree = ready();
      h.save.mockRejectedValue(new Error("Temporary connection failure"));
      nodes(tree)
        .find(n => n.type === "radio-group")
        .props.onValueChange("0");
      await settle();
      h.fetch.mockRejectedValue(fail(code));
      const notice = nodes(render()).find(
        n => typeof n.type === "function" && n.type.name === "ErrorNotice"
      );
      notice.props.onRetry();
      await settle();
      expect(text(render())).not.toContain(fixture.questions[0].prompt);
      expect(h.client.getQueryData(key())).toBeUndefined();
    }
  );

  it("closes a reviewed confirmation when a newer successful query response arrives", async () => {
    let tree = ready();
    button(tree, "Review submission").props.onClick();
    tree = render();
    const oldSubmit = button(tree, "Submit assessment");
    h.query = {
      ...h.query,
      data: { ...fixture, revision: 8, answers: { q1: 0 } },
    };
    tree = render();
    expect(nodes(tree).find(n => n.type === "dialog").props.open).toBe(false);
    oldSubmit.props.onClick();
    await settle();
    expect(h.submit).not.toHaveBeenCalled();
    button(render(), "Review submission").props.onClick();
    tree = render();
    button(tree, "Submit assessment").props.onClick();
    await settle();
    expect(h.submit).toHaveBeenCalledWith({ assignmentId, revision: 8 });
  });

  it("retains a legitimate save error and permits a fresh read, never a stale answer replay", async () => {
    const tree = ready();
    h.save.mockRejectedValue(new Error("Temporary connection failure"));
    nodes(tree)
      .find(n => n.type === "radio-group")
      .props.onValueChange("0");
    await settle();
    const notice = nodes(render()).find(
      n => typeof n.type === "function" && n.type.name === "ErrorNotice"
    );
    expect(notice.props.message).toContain("Temporary connection failure");
    expect(notice.props.onRetry).toBeTypeOf("function");
    notice.props.onRetry();
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(h.save).toHaveBeenCalledTimes(1);
    expect(text(render())).toContain(fixture.questions[0].prompt);
  });

  it("submits the exact reviewed revision and closes confirmation after a conflict refresh without retrying", async () => {
    let tree = ready();
    h.submit.mockRejectedValue(fail("CONFLICT"));
    h.fetch.mockResolvedValue({ ...fixture, revision: 9, answers: { q1: 0 } });
    button(tree, "Review submission").props.onClick();
    tree = render();
    button(tree, "Submit assessment").props.onClick();
    await settle();
    expect(h.submit).toHaveBeenCalledWith({ assignmentId, revision: 7 });
    expect(h.submit).toHaveBeenCalledTimes(1);
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
      false
    );
    expect(text(render())).toContain("confirm submission again");
    button(render(), "Review submission").props.onClick();
    tree = render();
    h.submit.mockResolvedValue({
      ...fixture,
      status: "submitted",
      revision: 10,
    });
    button(tree, "Submit assessment").props.onClick();
    await settle();
    expect(h.submit.mock.calls.at(-1)?.[0]).toEqual({
      assignmentId,
      revision: 9,
    });
  });

  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "closes submission and clears candidate data on submit %s",
    async code => {
      let tree = ready();
      h.submit.mockRejectedValue(fail(code));
      button(tree, "Review submission").props.onClick();
      tree = render();
      button(tree, "Submit assessment").props.onClick();
      await settle();
      expect(text(render())).not.toContain(fixture.questions[0].prompt);
      expect(h.client.getQueryData(key())).toBeUndefined();
    }
  );

  it("hides the prior session immediately on focus and requires fresh successful server authorization", async () => {
    ready();
    h.fetch.mockRejectedValue(fail("FORBIDDEN"));
    emit("focus");
    expect(text(render())).not.toContain(fixture.title);
    await settle();
    expect(h.fetch).toHaveBeenCalledWith({ assignmentId }, { staleTime: 0 });
    expect(text(render())).toContain("not available to this account");
    expect(h.client.getQueryData(key())).toBeUndefined();
  });

  it("does not restore a late save from a replaced session or replay it during the fresh read", async () => {
    let resolve!: (value: RecruitmentCandidateView) => void;
    h.save.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const tree = ready();
    nodes(tree)
      .find(n => n.type === "radio-group")
      .props.onValueChange("0");
    await settle();
    emit("storage", { key: "manus-runtime-user-info" });
    expect(text(render())).not.toContain(fixture.title);
    h.fetch.mockRejectedValue(fail("FORBIDDEN"));
    resolve({ ...fixture, revision: 8 });
    await settle();
    expect(h.save).toHaveBeenCalledTimes(1);
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
    expect(h.client.getQueryData(key())).toBeUndefined();
  });
});
