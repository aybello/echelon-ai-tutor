import * as React from "react";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECRUITMENT_CONSENT_VERSION,
  type RecruitmentCandidateView,
} from "@shared/recruitmentAssessment";

// Execute the actual component hooks and async handlers in Node; no server, DOM or network.
const h = vi.hoisted(() => ({
  slots: [] as any[],
  cursor: 0,
  layoutEffects: [] as (() => void)[],
  effects: [] as (() => void)[],
  dirty: false,
  mounted: true,
  updatesAfterUnmount: 0,
  query: {} as any,
  client: null as any,
  utils: null as any,
  fetch: vi.fn(),
  cancel: vi.fn(),
  start: vi.fn(),
  save: vi.fn(),
  submit: vi.fn(),
  initialQuery: vi.fn(),
  autoQuery: false,
  monotonicMs: 0,
  tick: null as null | (() => void),
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
        if (!h.mounted) {
          h.updatesAfterUnmount += 1;
          return;
        }
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
        h.slots[i].setup = fn;
        h.slots[i].cleanup = fn();
      });
    }
  },
  useLayoutEffect: (fn: () => void | (() => void), deps: unknown[]) => {
    const i = h.cursor++;
    if (!h.slots[i] || deps.some((v, n) => !Object.is(v, h.slots[i].deps[n]))) {
      const old = h.slots[i];
      h.slots[i] = { deps };
      h.layoutEffects.push(() => {
        old?.cleanup?.();
        h.slots[i].layout = true;
        h.slots[i].setup = fn;
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
        useQuery: (_input: unknown, options: any) => {
          const observer = React.useRef<QueryObserver | null>(null);
          if (h.autoQuery && !observer.current) {
            observer.current = new QueryObserver(h.client, {
              ...options,
              queryKey: key(),
              queryFn: h.initialQuery,
            });
          }
          React.useLayoutEffect(() => {
            if (!h.autoQuery) return;
            // Exercise actual QueryClient + QueryObserver fetch, cancellation,
            // remount and replay, not hand-authored isFetchedAfterMount flags.
            const unsubscribe = observer.current!.subscribe(result => {
              h.query = result;
              h.dirty = true;
            });
            h.query = observer.current!.getCurrentResult();
            h.dirty = true;
            return unsubscribe;
          }, []);
          return h.query;
        },
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
    for (const effect of h.layoutEffects.splice(0)) effect();
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
function unmount() {
  if (!h.mounted) return;
  h.mounted = false;
  // React runs layout cleanup synchronously before passive effect cleanup.
  for (const layout of [true, false]) {
    for (const slot of h.slots) {
      if (Boolean(slot?.layout) !== layout) continue;
      slot?.cleanup?.();
      if (slot) slot.cleanup = undefined;
    }
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function actionHandler(action: "start" | "save" | "submit") {
  if (action === "start") {
    ready({ ...fixture, status: "invited", questions: [], answers: {} });
    nodes(render())
      .find(n => n.type === "checkbox")
      .props.onCheckedChange(true);
    return button(render(), "Start assessment").props.onClick;
  }
  ready();
  if (action === "save") {
    const choices = nodes(render()).find(n => n.type === "radio-group");
    return () => choices.props.onValueChange("0");
  }
  button(render(), "Review submission").props.onClick();
  return button(render(), "Submit assessment").props.onClick;
}
async function settle() {
  for (let i = 0; i < 25; i++) {
    await Promise.resolve();
    if (h.mounted) render();
  }
}
function fail(code: string) {
  return Object.assign(new Error(`Synthetic ${code}`), { data: { code } });
}
const key = () =>
  getQueryKey(trpc.recruitment.candidateGet, { assignmentId }, "query");
function publishFetchSuccess(view: RecruitmentCandidateView) {
  // Synchronous fixtures for handler-only tests; real QueryObserver tests below
  // exercise transport/lifecycle provenance instead of these synthetic events.
  const cache = h.client.getQueryCache();
  const query = cache.build(h.client, { queryKey: key() });
  cache.notify({ type: "updated", query, action: { type: "fetch" } });
  h.client.setQueryData(key(), view);
  cache.notify({
    type: "updated",
    query,
    action: { type: "success", data: view },
  });
  h.query = {
    data: query.state.data,
    isFetching: false,
    isFetchedAfterMount: true,
    isSuccess: true,
    isError: false,
    isLoading: false,
  };
}
function ready(view = fixture) {
  render(); // Install the before-useQuery subscription before publishing a fetch.
  publishFetchSuccess(view);
  return render();
}
beforeEach(() => {
  h.slots = [];
  h.layoutEffects = [];
  h.effects = [];
  h.cursor = 0;
  h.dirty = false;
  h.mounted = true;
  h.updatesAfterUnmount = 0;
  h.autoQuery = false;
  h.monotonicMs = 0;
  h.tick = null;
  h.listeners.clear();
  for (const mock of [
    h.fetch,
    h.cancel,
    h.start,
    h.save,
    h.submit,
    h.initialQuery,
  ])
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
  vi.stubGlobal("performance", { now: () => h.monotonicMs });
  vi.stubGlobal("window", {
    ...events,
    setInterval: (fn: () => void) => {
      h.tick = fn;
      return 1;
    },
    clearInterval: () => {
      h.tick = null;
    },
  });
  vi.stubGlobal("document", { ...events, visibilityState: "visible" });
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => fn());
});
afterEach(() => {
  unmount();
  h.client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function timer() {
  return text(nodes(render()).find(n => n.props?.role === "timer"));
}
function advance(ms: number) {
  h.monotonicMs += ms;
  h.tick?.();
}
async function freshTimedQuery(view = fixture, delayMs = 5000) {
  h.autoQuery = true;
  h.query = { ...h.query, data: undefined, isSuccess: false, isLoading: true };
  h.initialQuery.mockImplementation(async () => {
    advance(delayMs);
    return view;
  });
  render();
  await settle();
}

describe("candidate monotonic request clock contract", () => {
  it("charges a delayed initial hook request from the actual fetch, not component render", async () => {
    // Time spent before the actual request is not request latency.
    h.monotonicMs = 120000;
    await freshTimedQuery();
    expect(h.initialQuery).toHaveBeenCalledTimes(1);
    expect(timer()).toBe("04:55");
    advance(2000);
    expect(timer()).toBe("04:53");
  });

  it("ticks from performance.now despite backwards and forwards wall-clock changes", async () => {
    await freshTimedQuery();
    const wallClock = vi
      .spyOn(Date, "now")
      .mockReturnValue(fixture.serverNowMs - 86400000);
    advance(3000);
    expect(timer()).toBe("04:52");
    wallClock.mockReturnValue(fixture.serverNowMs + 86400000);
    advance(2000);
    expect(timer()).toBe("04:50");
  });

  it("charges delayed start once and ignores cancellation wait before the actual request", async () => {
    await freshTimedQuery(
      { ...fixture, status: "invited", questions: [], answers: {} },
      0
    );
    h.cancel.mockImplementation(async () => {
      advance(20000);
    });
    h.start.mockImplementation(async () => {
      advance(7000);
      return { ...fixture, serverNowMs: fixture.serverNowMs + 20000 };
    });
    nodes(render())
      .find(n => n.type === "checkbox")
      .props.onCheckedChange(true);
    button(render(), "Start assessment").props.onClick();
    await settle();
    expect(timer()).toBe("04:33");
    // Cache effects consume the same DTO again, without subtracting the whole
    // assessment age or adding the already-accounted request delay again.
    h.query = { ...h.query, data: h.client.getQueryData(key()) };
    expect(timer()).toBe("04:33");
    advance(3000);
    h.query = { ...h.query, data: { ...h.query.data } };
    expect(timer()).toBe("04:30");
    expect(h.start).toHaveBeenCalledTimes(1);
  });

  it("charges delayed save and repeated setData/effect merges never increase or double-charge time", async () => {
    await freshTimedQuery(fixture, 0);
    advance(40000);
    h.save.mockImplementation(async () => {
      advance(6000);
      return {
        ...fixture,
        revision: 8,
        serverNowMs: fixture.serverNowMs + 40000,
      };
    });
    nodes(render())
      .find(n => n.type === "radio-group")
      .props.onValueChange("0");
    await settle();
    expect(timer()).toBe("04:14");
    h.query = { ...h.query, data: h.client.getQueryData(key()) };
    expect(timer()).toBe("04:14");
    advance(1000);
    h.query = { ...h.query, data: { ...h.query.data } };
    expect(timer()).toBe("04:13");
    // An old equal-revision server sample must not rewind the display clock.
    h.query = {
      ...h.query,
      data: { ...h.query.data, serverNowMs: fixture.serverNowMs + 40000 },
    };
    expect(timer()).toBe("04:13");
  });

  it("measures a delayed manual candidateGet from its own request start", async () => {
    await freshTimedQuery(fixture, 0);
    h.save.mockRejectedValue(new Error("Temporary connection failure"));
    nodes(render())
      .find(n => n.type === "radio-group")
      .props.onValueChange("0");
    await settle();
    h.cancel.mockImplementation(async () => {
      advance(20000);
    });
    h.fetch.mockImplementation(async () => {
      advance(8000);
      return { ...fixture, serverNowMs: fixture.serverNowMs + 20000 };
    });
    nodes(render())
      .find(n => typeof n.type === "function" && n.type.name === "ErrorNotice")
      .props.onRetry();
    await settle();
    expect(timer()).toBe("04:32");
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(h.save).toHaveBeenCalledTimes(1);
  });

  it.each(["save", "submit"] as const)(
    "measures %s conflict refresh separately and preserves manual reconfirmation",
    async action => {
      await freshTimedQuery(fixture, 0);
      h[action].mockImplementation(async () => {
        advance(10000);
        throw fail("CONFLICT");
      });
      h.fetch.mockImplementation(async () => {
        advance(4000);
        return {
          ...fixture,
          revision: 9,
          serverNowMs: fixture.serverNowMs + 10000,
        };
      });
      if (action === "save") {
        nodes(render())
          .find(n => n.type === "radio-group")
          .props.onValueChange("0");
      } else {
        button(render(), "Review submission").props.onClick();
        button(render(), "Submit assessment").props.onClick();
      }
      await settle();
      expect(timer()).toBe("04:46");
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
        false
      );
    }
  );

  it("retains server submission authority after a delayed submit", async () => {
    await freshTimedQuery(fixture, 0);
    h.submit.mockImplementation(async () => {
      advance(6000);
      return {
        ...fixture,
        serverNowMs: fixture.serverNowMs + 6000,
        revision: 8,
        status: "submitted",
      };
    });
    button(render(), "Review submission").props.onClick();
    button(render(), "Submit assessment").props.onClick();
    await settle();
    expect(h.submit).toHaveBeenCalledWith({ assignmentId, revision: 7 });
    expect(text(render())).toContain("Assessment submitted");
  });

  it("waits from actual receipt despite early advisory zero and repeated cached merges, then renders only the terminal server result", async () => {
    const closeDeadline = {
      ...fixture,
      deadlineMs: fixture.serverNowMs + 40000,
      serverNowMs: fixture.serverNowMs + 24000,
    };
    h.fetch.mockResolvedValueOnce({
      ...closeDeadline,
      serverNowMs: closeDeadline.deadlineMs,
      revision: 8,
      status: "timed_out",
    });
    // The server samples at 24s during a 25s request. Its real deadline is
    // still 15s away at receipt, but the conservative display is already zero.
    await freshTimedQuery(closeDeadline, 25000);
    expect(timer()).toBe("00:00");
    expect(h.fetch).not.toHaveBeenCalled();
    expect(text(render())).toContain(fixture.questions[0].prompt);
    expect(
      nodes(render()).find(n => n.type === "radio-group").props.disabled
    ).toBe(false);
    expect(button(render(), "Review submission").props.disabled).toBe(false);
    for (let i = 0; i < 15; i++) {
      advance(1000);
      // Re-run admission with the very same authorized DTO. This is a cache
      // consumption, not a new response receipt, and cannot postpone the read.
      h.query = { ...h.query, isFetchedAfterMount: false };
      render();
      h.query = { ...h.query, isFetchedAfterMount: true };
      await settle();
      expect(h.fetch).not.toHaveBeenCalled();
      expect(text(render())).not.toContain("Assessment time has ended");
    }
    advance(999);
    await settle();
    expect(h.fetch).not.toHaveBeenCalled();
    advance(1);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(text(render())).toContain("Assessment time has ended");
    expect(h.start).not.toHaveBeenCalled();
    expect(h.save).not.toHaveBeenCalled();
    expect(h.submit).not.toHaveBeenCalled();
    advance(60000);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it.each(["save", "submit"] as const)(
    "keeps %s usable after a delayed initial response displays zero while the real server deadline is future",
    async action => {
      const closeDeadline = {
        ...fixture,
        deadlineMs: fixture.serverNowMs + 4000,
        serverNowMs: fixture.serverNowMs + 2500,
      };
      h.fetch.mockRejectedValue(new Error("An early read would block actions"));
      await freshTimedQuery(closeDeadline, 3000);
      expect(timer()).toBe("00:00");
      advance(500);
      await settle();
      expect(h.fetch).not.toHaveBeenCalled();
      const latest = {
        ...closeDeadline,
        serverNowMs: fixture.serverNowMs + 3500,
        revision: 8,
        answers: { q1: 0 },
      };
      if (action === "save") {
        h.save.mockResolvedValueOnce(latest);
        const choices = nodes(render()).find(n => n.type === "radio-group");
        expect(choices.props.disabled).toBe(false);
        choices.props.onValueChange("0");
      } else {
        expect(button(render(), "Review submission").props.disabled).toBe(false);
        button(render(), "Review submission").props.onClick();
        expect(h.submit).not.toHaveBeenCalled();
        expect(button(render(), "Submit assessment").props.disabled).toBe(false);
        h.submit.mockResolvedValueOnce({ ...latest, status: "submitted" });
        button(render(), "Submit assessment").props.onClick();
      }
      await settle();
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h[action]).toHaveBeenCalledWith(
        action === "save"
          ? { assignmentId, questionId: "q1", selectedIndex: 0, revision: 7 }
          : { assignmentId, revision: 7 }
      );
      expect(h.fetch).not.toHaveBeenCalled();
      expect(text(render())).not.toContain("Refresh the server status");
      expect(text(render())).toContain(
        action === "save" ? fixture.questions[0].prompt : "Assessment submitted"
      );
    }
  );

  it("anchors initial scheduling at response receipt, not delayed effect admission", async () => {
    const closeDeadline = {
      ...fixture,
      deadlineMs: fixture.serverNowMs + 4000,
      serverNowMs: fixture.serverNowMs + 2500,
    };
    const pending = deferred<RecruitmentCandidateView>();
    h.autoQuery = true;
    h.initialQuery.mockReturnValueOnce(pending.promise);
    h.fetch.mockResolvedValueOnce({
      ...closeDeadline,
      serverNowMs: closeDeadline.deadlineMs,
      revision: 8,
      status: "timed_out",
    });
    render();
    advance(3000);
    pending.resolve(closeDeadline);
    // Let QueryClient record receipt without running the page's passive merge.
    for (let i = 0; i < 25; i++) await Promise.resolve();
    advance(1499);
    await settle();
    expect(timer()).toBe("00:00");
    expect(h.fetch).not.toHaveBeenCalled();
    advance(1);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(text(render())).toContain("Assessment time has ended");
  });

  it("bounds near-deadline checks despite conservative latency and waits for the pending read", async () => {
    const closeDeadline = {
      ...fixture,
      deadlineMs: fixture.serverNowMs + 4000,
    };
    const pending = deferred<RecruitmentCandidateView>();
    h.fetch
      .mockResolvedValueOnce({
        ...closeDeadline,
        serverNowMs: fixture.serverNowMs + 3500,
      })
      .mockReturnValueOnce(pending.promise);
    await freshTimedQuery(closeDeadline, 5000);
    expect(h.fetch).not.toHaveBeenCalled();
    advance(3999);
    await settle();
    expect(h.fetch).not.toHaveBeenCalled();
    advance(1);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 4; i++) {
      advance(1000);
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(1);
    }
    advance(1000);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(2);
    advance(60000);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(2);
    pending.resolve({
      ...closeDeadline,
      status: "timed_out",
      revision: 8,
      serverNowMs: closeDeadline.deadlineMs,
    });
    await settle();
    expect(text(render())).toContain("Assessment time has ended");
  });

  it("backs off failed deadline reads with three bounded retries, then requires an explicit refresh", async () => {
    const closeDeadline = {
      ...fixture,
      deadlineMs: fixture.serverNowMs + 4000,
    };
    h.fetch.mockRejectedValue(new Error("Synthetic deadline read failure"));
    await freshTimedQuery(closeDeadline, 5000);
    expect(h.fetch).not.toHaveBeenCalled();
    advance(3999);
    await settle();
    expect(h.fetch).not.toHaveBeenCalled();
    expect(
      nodes(render()).find(n => n.type === "radio-group").props.disabled
    ).toBe(false);
    advance(1);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(1);
    for (const [delay, count] of [
      [5000, 2],
      [10000, 3],
      [20000, 4],
    ]) {
      advance(delay - 1000);
      // Reconsuming the initial DTO must not reset failures or postpone retries.
      h.query = { ...h.query, isFetchedAfterMount: false };
      render();
      h.query = { ...h.query, isFetchedAfterMount: true };
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(count - 1);
      advance(1000);
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(count);
    }
    advance(120000);
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(4);
    expect(h.submit).not.toHaveBeenCalled();
    expect(text(render())).not.toContain("Assessment time has ended");
    h.fetch.mockResolvedValue({
      ...closeDeadline,
      status: "timed_out",
      revision: 8,
      serverNowMs: closeDeadline.deadlineMs,
    });
    nodes(render())
      .find(n => typeof n.type === "function" && n.type.name === "ErrorNotice")
      .props.onRetry();
    await settle();
    expect(h.fetch).toHaveBeenCalledTimes(5);
    expect(text(render())).toContain("Assessment time has ended");
  });

  it.each(["UNAUTHORIZED", "FORBIDDEN", "PRECONDITION_FAILED"])(
    "clears private candidate content on safe deadline %s without replaying writes or retrying automatically",
    async code => {
      const closeDeadline = {
        ...fixture,
        deadlineMs: fixture.serverNowMs + 4000,
        serverNowMs: fixture.serverNowMs + 2500,
      };
      h.fetch.mockRejectedValueOnce(fail(code));
      await freshTimedQuery(closeDeadline, 3000);
      const oldChoice = nodes(render()).find(n => n.type === "radio-group");
      button(render(), "Review submission").props.onClick();
      const oldSubmit = button(render(), "Submit assessment");
      const otherKey = ["unrelated", "candidate"];
      h.client.setQueryData(otherKey, "Other candidate fixture");
      advance(1499);
      await settle();
      expect(h.fetch).not.toHaveBeenCalled();
      expect(oldChoice.props.disabled).toBe(false);
      expect(oldSubmit.props.disabled).toBe(false);
      advance(1);
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expectPrivateContentCleared();
      if (code === "PRECONDITION_FAILED") replacementNotice();
      else
        expect(text(render())).toContain(
          code === "UNAUTHORIZED"
            ? "Sign in to open"
            : "not available to this account"
        );
      expect(h.client.getQueryData(otherKey)).toBe("Other candidate fixture");
      oldChoice.props.onValueChange("0");
      oldSubmit.props.onClick();
      advance(120000);
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expect(h.save).not.toHaveBeenCalled();
      expect(h.submit).not.toHaveBeenCalled();
    }
  );

  it.each(["start", "save"] as const)(
    "allows selected answers and manual confirmed submission after delayed active %s reaches display zero",
    async action => {
      const closeDeadline = {
        ...fixture,
        deadlineMs: fixture.serverNowMs + 4000,
      };
      const delayedActive = {
        ...closeDeadline,
        revision: 8,
        serverNowMs: fixture.serverNowMs + 2500,
      };
      // The sample is taken late in the request; the full-duration charge
      // conservatively overshoots while the actual server deadline is future.
      h[action].mockImplementationOnce(async () => {
        advance(3000);
        return delayedActive;
      });
      h.fetch.mockRejectedValue(new Error("An early read would block actions"));
      await freshTimedQuery(
        action === "start"
          ? { ...closeDeadline, status: "invited", questions: [], answers: {} }
          : closeDeadline,
        0
      );
      if (action === "start") {
        nodes(render())
          .find(n => n.type === "checkbox")
          .props.onCheckedChange(true);
        button(render(), "Start assessment").props.onClick();
      } else {
        nodes(render())
          .find(n => n.type === "radio-group")
          .props.onValueChange("0");
      }
      await settle();
      expect(timer()).toBe("00:00");
      expect(h.fetch).not.toHaveBeenCalled();
      expect(text(render())).toContain(
        "Display estimate; server deadline applies"
      );
      expect(h.submit).not.toHaveBeenCalled();

      const saved = {
        ...delayedActive,
        revision: 9,
        serverNowMs: fixture.serverNowMs + 3200,
        answers: { q1: 0 },
      };
      advance(200);
      h.save.mockResolvedValue(saved);
      const choices = nodes(render()).find(n => n.type === "radio-group");
      expect(choices.props.disabled).toBe(false);
      choices.props.onValueChange("0");
      await settle();
      expect(h.save.mock.calls.at(-1)?.[0]).toEqual({
        assignmentId,
        questionId: "q1",
        selectedIndex: 0,
        revision: 8,
      });
      expect(
        nodes(render()).find(n => n.type === "radio-group").props.value
      ).toBe("0");
      expect(timer()).toBe("00:00");
      expect(h.fetch).not.toHaveBeenCalled();
      expect(button(render(), "Review submission").props.disabled).toBe(false);
      button(render(), "Review submission").props.onClick();
      expect(h.submit).not.toHaveBeenCalled();
      expect(button(render(), "Submit assessment").props.disabled).toBe(false);
      h.submit.mockResolvedValue({
        ...saved,
        status: "submitted",
        revision: 10,
      });
      button(render(), "Submit assessment").props.onClick();
      await settle();
      expect(h.submit).toHaveBeenCalledTimes(1);
      expect(h.submit).toHaveBeenCalledWith({
        assignmentId,
        revision: 9,
      });
      expect(text(render())).toContain("Assessment submitted");
      expect(h.fetch).not.toHaveBeenCalled();
    }
  );

  it("permits a consented start after early display expiry without a blocking deadline read", async () => {
    const invited: RecruitmentCandidateView = {
      ...fixture,
      status: "invited",
      questions: [],
      answers: {},
      deadlineMs: fixture.serverNowMs + 4000,
      serverNowMs: fixture.serverNowMs + 2500,
    };
    h.fetch.mockRejectedValue(new Error("An early read would block starting"));
    await freshTimedQuery(invited, 3000);
    expect(text(render())).toContain("The display estimate has reached");
    expect(h.fetch).not.toHaveBeenCalled();
    nodes(render())
      .find(n => n.type === "checkbox")
      .props.onCheckedChange(true);
    expect(button(render(), "Start assessment").props.disabled).toBe(false);
    button(render(), "Start assessment").props.onClick();
    await settle();
    expect(h.start).toHaveBeenCalledTimes(1);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it.each(["expired", "timed_out"] as const)(
    "does not allow actions when the deadline check returns genuinely terminal %s",
    async status => {
      const closeDeadline = {
        ...fixture,
        deadlineMs: fixture.serverNowMs + 4000,
      };
      await freshTimedQuery(closeDeadline, 0);
      const oldChoice = nodes(render()).find(n => n.type === "radio-group");
      button(render(), "Review submission").props.onClick();
      const oldSubmit = button(render(), "Submit assessment");
      h.fetch.mockResolvedValue({
        ...closeDeadline,
        status,
        revision: 8,
        serverNowMs: closeDeadline.deadlineMs,
      });
      advance(5000);
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expect(text(render())).toContain(
        status === "expired"
          ? "This invitation has expired"
          : "Assessment time has ended"
      );
      expect(nodes(render()).some(n => n.type === "radio-group")).toBe(false);
      expect(button(render(), "Start assessment")).toBeUndefined();
      expect(button(render(), "Review submission")).toBeUndefined();
      oldChoice.props.onValueChange("0");
      oldSubmit.props.onClick();
      await settle();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.submit).not.toHaveBeenCalled();
    }
  );
});

describe("candidate assessment session and confirmation contract", () => {
  it.each(["start", "save", "submit"] as const)(
    "rejects a retained %s immediately after reset before rerender and after fresh reauthorization",
    async action => {
      const invited = { ...fixture, status: "invited" as const, questions: [], answers: {} };
      const admitted = action === "start" ? invited : fixture;
      await freshTimedQuery(admitted, 0);
      let handler: () => void;
      if (action === "start") {
        nodes(render()).find(n => n.type === "checkbox").props.onCheckedChange(true);
        handler = button(render(), "Start assessment").props.onClick;
      } else if (action === "save") {
        const choices = nodes(render()).find(n => n.type === "radio-group");
        handler = () => choices.props.onValueChange("0");
      } else {
        button(render(), "Review submission").props.onClick();
        handler = button(render(), "Submit assessment").props.onClick;
      }
      h.fetch.mockResolvedValueOnce(admitted); // Deliberately reuse the exact old DTO.
      emit("focus");
      handler(); // No render/effect/await between the reset and retained callback.
      expect(h.cancel).not.toHaveBeenCalled();
      expect(h[action]).not.toHaveBeenCalled();
      await settle();
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expect(text(render())).toContain(admitted.title);
      if (action === "start")
        nodes(render()).find(n => n.type === "checkbox").props.onCheckedChange(true);
      else if (action === "submit")
        button(render(), "Review submission").props.onClick();
      render();
      handler();
      await settle();
      expect(h[action]).not.toHaveBeenCalled();
      expect(h.cancel).toHaveBeenCalledTimes(1); // Only the fresh authorization read.
      const freshHandler = action === "start"
        ? button(render(), "Start assessment").props.onClick
        : action === "submit"
          ? button(render(), "Submit assessment").props.onClick
          : () => nodes(render()).find(n => n.type === "radio-group").props.onValueChange("0");
      freshHandler();
      await settle();
      expect(h[action]).toHaveBeenCalledTimes(1);
    }
  );

  it("clears consent synchronously on uncheck while Start awaits cancellation, without rerender", async () => {
    await freshTimedQuery({ ...fixture, status: "invited", questions: [], answers: {} }, 0);
    nodes(render()).find(n => n.type === "checkbox").props.onCheckedChange(true);
    const reviewedTree = render();
    const handler = button(reviewedTree, "Start assessment").props.onClick;
    const cancellation = deferred<void>();
    h.cancel.mockReturnValueOnce(cancellation.promise);
    handler();
    nodes(reviewedTree).find(n => n.type === "checkbox").props.onCheckedChange(false);
    cancellation.resolve();
    for (let i = 0; i < 25; i++) await Promise.resolve();
    expect(h.start).not.toHaveBeenCalled();
    handler(); // Retained accepted=true render still cannot supply consent.
    expect(h.cancel).toHaveBeenCalledTimes(1);
    expect(h.start).not.toHaveBeenCalled();
    expect(nodes(render()).find(n => n.type === "checkbox").props.checked).toBe(false);
  });

  it.each(["start", "save", "submit"] as const)(
    "rejects unsent %s when the exact reviewed DTO changes while cancellation is pending",
    async action => {
      const cancellation = deferred<void>();
      h.cancel.mockReturnValueOnce(cancellation.promise);
      actionHandler(action)();
      publishFetchSuccess({
        ...fixture,
        status: action === "start" ? "invited" : "active",
        questions: action === "start" ? [] : fixture.questions,
        answers: action === "start" ? {} : { q1: 0 },
        revision: 8,
      });
      render();
      cancellation.resolve();
      await settle();
      expect(h[action]).not.toHaveBeenCalled();
    }
  );

  it.each(["start", "save", "submit"] as const)(
    "never dispatches an unsent %s after delayed cancellation resolves following unmount",
    async action => {
      const cancellation = deferred<void>();
      h.cancel.mockReturnValueOnce(cancellation.promise);
      const handler = actionHandler(action);
      handler();
      expect(h.cancel).toHaveBeenCalledTimes(1);
      expect(h.cancel).toHaveBeenCalledWith({ assignmentId });
      expect(h[action]).not.toHaveBeenCalled();
      unmount();
      cancellation.resolve();
      await settle();
      // Retained UI callbacks cannot start a new operation after navigation either.
      handler();
      await settle();
      expect(h.cancel).toHaveBeenCalledTimes(1);
      expect(h.start).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.submit).not.toHaveBeenCalled();
      expect(h.fetch).not.toHaveBeenCalled();
      expect(h.updatesAfterUnmount).toBe(0);
      expect(h.client.getQueryData(key())).toBeUndefined();
    }
  );

  it.each(["start", "save", "submit"] as const)(
    "invalidates captured %s scope during layout cleanup even if effects become live again",
    async action => {
      const cancellation = deferred<void>();
      h.cancel.mockReturnValueOnce(cancellation.promise);
      actionHandler(action)();
      // Locate the lifetime effect by excluding the query subscription effect.
      const effects = h.slots.filter(
        slot => slot?.layout && slot?.cleanup && slot?.setup
      );
      expect(effects).toHaveLength(2);
      const fence = effects.at(-1)!;
      fence.cleanup();
      fence.cleanup = fence.setup();
      cancellation.resolve();
      await settle();
      expect(h.start).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.submit).not.toHaveBeenCalled();
    }
  );

  it.each(["start", "save", "submit"] as const)(
    "does not dispatch %s when the session changes while cancellation is pending",
    async action => {
      const cancellation = deferred<void>();
      h.cancel.mockReturnValueOnce(cancellation.promise);
      actionHandler(action)();
      emit("storage", { key: "manus-runtime-user-info" });
      render();
      expect(text(render())).not.toContain(fixture.title);
      h.fetch.mockRejectedValue(fail("FORBIDDEN"));
      cancellation.resolve();
      await settle();
      expect(h.start).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.submit).not.toHaveBeenCalled();
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expect(h.client.getQueryData(key())).toBeUndefined();
    }
  );

  it.each(["start", "save", "submit"] as const)(
    "ignores the completion of an already-dispatched %s after unmount without claiming request cancellation",
    async action => {
      const response = deferred<RecruitmentCandidateView>();
      h[action].mockReturnValueOnce(response.promise);
      actionHandler(action)();
      await settle();
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h[action].mock.calls[0][0]).toEqual(
        action === "start"
          ? {
              assignmentId,
              acceptedNotice: true,
              consentVersion: RECRUITMENT_CONSENT_VERSION,
            }
          : action === "save"
            ? { assignmentId, questionId: "q1", selectedIndex: 0, revision: 7 }
            : { assignmentId, revision: 7 }
      );
      unmount();
      response.resolve({
        ...fixture,
        revision: 8,
        status: action === "submit" ? "submitted" : "active",
      });
      await settle();
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.cancel).toHaveBeenCalledTimes(1);
      expect(h.fetch).not.toHaveBeenCalled();
      expect(h.client.getQueryData(key())).toBeUndefined();
      expect(h.updatesAfterUnmount).toBe(0);
    }
  );

  it.each(["save", "submit"] as const)(
    "does not dispatch a conflict refresh when an already-sent %s rejects after unmount",
    async action => {
      const response = deferred<RecruitmentCandidateView>();
      h[action].mockReturnValueOnce(response.promise);
      actionHandler(action)();
      await settle();
      expect(h[action]).toHaveBeenCalledTimes(1);
      unmount();
      response.reject(fail("CONFLICT"));
      await settle();
      expect(h.fetch).not.toHaveBeenCalled();
      expect(h.updatesAfterUnmount).toBe(0);
    }
  );

  it.each(["save", "submit"] as const)(
    "ignores an already-dispatched %s conflict read that completes after unmount",
    async action => {
      const response = deferred<RecruitmentCandidateView>();
      h[action].mockRejectedValueOnce(fail("CONFLICT"));
      h.fetch.mockReturnValueOnce(response.promise);
      actionHandler(action)();
      await settle();
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.fetch).toHaveBeenCalledTimes(1);
      expect(h.fetch).toHaveBeenCalledWith({ assignmentId }, { staleTime: 0 });
      unmount();
      response.resolve({ ...fixture, revision: 9, answers: { q1: 0 } });
      await settle();
      expect(h.client.getQueryData(key())).toBeUndefined();
      expect(h.updatesAfterUnmount).toBe(0);
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.fetch).toHaveBeenCalledTimes(1);
    }
  );

  it("does not dispatch a manual read after delayed cancellation and unmount", async () => {
    ready();
    h.save.mockRejectedValue(new Error("Synthetic save failure"));
    nodes(render())
      .find(n => n.type === "radio-group")
      .props.onValueChange("0");
    await settle();
    const cancellation = deferred<void>();
    h.cancel.mockReturnValueOnce(cancellation.promise);
    nodes(render())
      .find(n => typeof n.type === "function" && n.type.name === "ErrorNotice")
      .props.onRetry();
    unmount();
    cancellation.resolve();
    await settle();
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.updatesAfterUnmount).toBe(0);
  });

  it.each([null, 5])(
    "explains the before-start scoring policy for time limit %s",
    timeLimitMinutes => {
      const copy = text(
        ready({
          ...fixture,
          status: "invited",
          timeLimitMinutes,
          questions: [],
          answers: {},
        })
      );
      expect(copy).toContain(
        timeLimitMinutes === null
          ? "this untimed assessment expires without a score"
          : "At the server deadline, your saved answers are automatically recorded and scored"
      );
    }
  );

  it("never hydrates cached entry data before the fresh successful response has finished", () => {
    expect(text(render())).not.toContain(fixture.title);
    h.query.isFetchedAfterMount = true;
    h.query.isFetching = true;
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
    h.query.isFetching = false;
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
    publishFetchSuccess(fixture);
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
    publishFetchSuccess({ ...fixture, revision: 8, answers: { q1: 0 } });
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

function remount() {
  unmount();
  h.slots = [];
  h.layoutEffects = [];
  h.effects = [];
  h.mounted = true;
  h.query = { data: undefined, isSuccess: false, isLoading: true };
  return render();
}
function replayEffects() {
  // Match StrictMode's synchronous layout cleanup/setup, followed by passive
  // cleanup/setup, preserving the hook state and actual QueryObserver instance.
  for (const layout of [true, false]) {
    const effects = h.slots.filter(
      slot => Boolean(slot?.layout) === layout && slot?.setup
    );
    for (const effect of effects) effect.cleanup?.();
    for (const effect of effects) effect.cleanup = effect.setup();
  }
}
function expectPrivateContentCleared(tree = render()) {
  expect(text(tree)).not.toContain(fixture.title);
  expect(text(tree)).not.toContain(fixture.questions[0].prompt);
  for (const option of fixture.questions[0].options)
    expect(text(tree)).not.toContain(option);
  expect(nodes(tree).some(n => n.type === "radio-group")).toBe(false);
  expect(nodes(tree).some(n => n.type === "dialog")).toBe(false);
  expect(h.client.getQueryData(key())).toBeUndefined();
}
function replacementNotice(tree = render()) {
  const notice = nodes(tree).find(
    n => typeof n.type === "function" && n.type.name === "ErrorNotice"
  );
  expect(text(tree)).toContain("This assessment form is unavailable");
  expect(notice.props.message).toContain("hiring team to replace");
  return notice;
}

describe("candidate current-session QueryClient read admission", () => {
  it.each(["success", "UNAUTHORIZED", "FORBIDDEN"])(
    "cancels and evicts an old pending read on remount; requires the new %s response",
    async outcome => {
      const old = deferred<RecruitmentCandidateView>();
      const fresh = deferred<RecruitmentCandidateView>();
      const other = deferred<string>();
      const otherKey = getQueryKey(
        trpc.recruitment.candidateGet,
        { assignmentId: "22222222-2222-4222-8222-222222222222" },
        "query"
      );
      const otherRead = h.client.fetchQuery({
        queryKey: otherKey,
        queryFn: () => other.promise,
      });
      let oldSignal!: AbortSignal;
      h.autoQuery = true;
      h.initialQuery
        .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => {
          oldSignal = signal;
          return old.promise; // Transport intentionally ignores abort.
        })
        .mockReturnValueOnce(fresh.promise);
      render();
      const oldQuery = h.client
        .getQueryCache()
        .find({ queryKey: key(), exact: true });
      expect(h.initialQuery).toHaveBeenCalledTimes(1);
      unmount();
      expect(oldSignal.aborted).toBe(true);
      expect(
        h.client.getQueryCache().find({ queryKey: key(), exact: true })
      ).toBeUndefined();
      expect(h.client.getQueryState(otherKey)?.fetchStatus).toBe("fetching");
      remount();
      expect(h.initialQuery).toHaveBeenCalledTimes(2);
      expect(
        h.client.getQueryCache().find({ queryKey: key(), exact: true })
      ).not.toBe(oldQuery);
      old.resolve(fixture);
      await settle();
      expectPrivateContentCleared();
      if (outcome === "success") {
        const next = {
          ...fixture,
          title: "Current session assessment",
          revision: 9,
          answers: {},
          questions: [
            {
              ...fixture.questions[0],
              prompt: "Current session prompt",
              options: ["New first", "New second"],
            },
          ],
        };
        fresh.resolve(next);
        await settle();
        expect(text(render())).toContain("Current session prompt");
        expect(text(render())).not.toContain(fixture.questions[0].prompt);
        expect(
          nodes(render()).find(n => n.type === "radio-group").props.value
        ).toBe("");
        expect(h.client.getQueryData(key())).toEqual(next);
      } else {
        fresh.reject(fail(outcome));
        await settle();
        expectPrivateContentCleared();
        expect(text(render())).toContain(
          outcome === "UNAUTHORIZED"
            ? "Sign in to open"
            : "not available to this account"
        );
      }
      other.resolve("Other candidate data");
      await otherRead;
      expect(h.client.getQueryData(otherKey)).toBe("Other candidate data");
      expect(h.updatesAfterUnmount).toBe(0);
      expect(h.save).not.toHaveBeenCalled();
    }
  );

  it("never admits a pre-session pending fetch that the observer joins", async () => {
    const old = deferred<RecruitmentCandidateView>();
    const oldRead = h.client.fetchQuery({
      queryKey: key(),
      queryFn: () => old.promise,
    });
    h.autoQuery = true;
    render();
    old.resolve(fixture);
    await oldRead;
    await settle();
    expect(h.query.isFetchedAfterMount).toBe(true);
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
    expect(h.initialQuery).not.toHaveBeenCalled();
    // A real fresh fetch started under the page's current subscription authorizes.
    await h.client.fetchQuery({
      queryKey: key(),
      queryFn: async () => fixture,
      staleTime: 0,
    });
    await settle();
    expect(text(render())).toContain(fixture.questions[0].prompt);
  });

  it("does not authorize manual setQueryData even if isFetchedAfterMount becomes true", async () => {
    const fresh = deferred<RecruitmentCandidateView>();
    h.autoQuery = true;
    h.initialQuery.mockReturnValue(fresh.promise);
    render();
    await h.client.cancelQueries({ queryKey: key(), exact: true });
    h.client.setQueryData(key(), fixture);
    await settle();
    expect(h.query.isFetchedAfterMount).toBe(true);
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
    fresh.resolve(fixture);
    await settle();
    expect(text(render())).not.toContain(fixture.questions[0].prompt);
  });

  it.each(["success", "FORBIDDEN"])(
    "StrictMode-style effect replay cancels the earlier read and requires the current %s",
    async outcome => {
      const old = deferred<RecruitmentCandidateView>();
      const fresh = deferred<RecruitmentCandidateView>();
      h.autoQuery = true;
      h.initialQuery
        .mockReturnValueOnce(old.promise)
        .mockReturnValueOnce(fresh.promise);
      render();
      replayEffects();
      await settle();
      expect(h.initialQuery).toHaveBeenCalledTimes(2);
      old.resolve(fixture);
      await settle();
      expectPrivateContentCleared();
      if (outcome === "success") {
        fresh.resolve({ ...fixture, revision: 9, answers: {} });
        await settle();
        expect(text(render())).toContain(fixture.questions[0].prompt);
        expect(
          nodes(render()).find(n => n.type === "radio-group").props.value
        ).toBe("");
      } else {
        fresh.reject(fail("FORBIDDEN"));
        await settle();
        expectPrivateContentCleared();
      }
      expect(h.save).not.toHaveBeenCalled();
      expect(h.updatesAfterUnmount).toBe(0);
    }
  );
});

describe("candidate explicit frozen-form withdrawal contract", () => {
  it("initial QueryClient PRECONDITION_FAILED never restores seeded content", async () => {
    h.client.setQueryData(key(), fixture);
    h.autoQuery = true;
    h.initialQuery.mockRejectedValue(fail("PRECONDITION_FAILED"));
    render();
    await settle();
    expectPrivateContentCleared();
    replacementNotice();
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it("clears an open prompt, saved answer, confirmation and exact cache synchronously on query withdrawal", async () => {
    await freshTimedQuery(fixture, 0);
    button(render(), "Review submission").props.onClick();
    expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
      true
    );
    expect(
      nodes(render()).find(n => n.type === "radio-group").props.value
    ).toBe("1");
    const oldSubmit = button(render(), "Submit assessment");
    const oldChoice = nodes(render()).find(n => n.type === "radio-group");
    const otherKey = ["unrelated", "candidate"];
    h.client.setQueryData(otherKey, "Other candidate fixture");
    await h.client
      .fetchQuery({
        queryKey: key(),
        queryFn: async () => {
          throw fail("PRECONDITION_FAILED");
        },
        staleTime: 0,
      })
      .catch(() => undefined);
    // Before running passive query effects, the cache-event failure handler has
    // cleared local DTO refs, saved choices and the confirmation revision.
    const tree = rawRender();
    expectPrivateContentCleared(tree);
    replacementNotice(tree);
    expect(h.client.getQueryData(otherKey)).toBe("Other candidate fixture");
    oldSubmit.props.onClick();
    oldChoice.props.onValueChange("0");
    await settle();
    expect(h.submit).not.toHaveBeenCalled();
    expect(h.save).not.toHaveBeenCalled();
  });

  it.each(["start", "save", "submit"] as const)(
    "%s withdrawal removes candidate content without replay or conflict recovery",
    async action => {
      h[action].mockRejectedValue(fail("PRECONDITION_FAILED"));
      actionHandler(action)();
      await settle();
      expectPrivateContentCleared();
      replacementNotice();
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.fetch).not.toHaveBeenCalled();
      // Stale query flags and manual cache data cannot restore the withdrawn DTO.
      h.client.setQueryData(key(), fixture);
      h.query = { ...h.query, data: fixture, isSuccess: true };
      expect(text(render())).not.toContain(fixture.questions[0].prompt);
      expect(h[action]).toHaveBeenCalledTimes(1);
    }
  );

  it("manual refresh withdrawal clears saved answers and an open confirmation; explicit fresh recovery never replays", async () => {
    ready();
    button(render(), "Review submission").props.onClick();
    h.save.mockRejectedValue(new Error("Synthetic save failure"));
    nodes(render())
      .find(n => n.type === "radio-group")
      .props.onValueChange("0");
    await settle();
    expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
      true
    );
    h.fetch.mockRejectedValueOnce(fail("PRECONDITION_FAILED"));
    nodes(render())
      .find(n => typeof n.type === "function" && n.type.name === "ErrorNotice")
      .props.onRetry();
    await settle();
    expectPrivateContentCleared();
    const notice = replacementNotice();
    h.fetch.mockResolvedValueOnce({ ...fixture, revision: 9, answers: {} });
    notice.props.onRetry();
    await settle();
    expect(
      nodes(render()).find(n => n.type === "radio-group").props.value
    ).toBe("");
    expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
      false
    );
    expect(h.save).toHaveBeenCalledTimes(1);
    expect(h.submit).not.toHaveBeenCalled();
    expect(h.fetch).toHaveBeenCalledTimes(2);
  });

  it.each(["save", "submit"] as const)(
    "%s conflict-recovery withdrawal removes the frozen form and never retries the write",
    async action => {
      h[action].mockRejectedValueOnce(fail("CONFLICT"));
      h.fetch.mockRejectedValueOnce(fail("PRECONDITION_FAILED"));
      actionHandler(action)();
      await settle();
      expectPrivateContentCleared();
      replacementNotice();
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.fetch).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["save", "submit"] as const)(
    "ordinary %s revision conflict retains the form and requires manual refresh after recovery failure",
    async action => {
      h[action].mockRejectedValueOnce(fail("CONFLICT"));
      h.fetch.mockRejectedValueOnce(
        new Error("Synthetic recovery read failure")
      );
      actionHandler(action)();
      await settle();
      expect(text(render())).toContain(fixture.questions[0].prompt);
      expect(
        nodes(render()).find(n => n.type === "radio-group").props.value
      ).toBe("1");
      expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
        false
      );
      expect(text(render())).not.toContain("form is unavailable");
      const notice = nodes(render()).find(
        n => typeof n.type === "function" && n.type.name === "ErrorNotice"
      );
      expect(notice.props.message).toContain("Synthetic recovery read failure");
      h.fetch.mockResolvedValueOnce({
        ...fixture,
        revision: 9,
        answers: { q1: 0 },
      });
      notice.props.onRetry();
      await settle();
      expect(
        nodes(render()).find(n => n.type === "radio-group").props.value
      ).toBe("0");
      expect(h[action]).toHaveBeenCalledTimes(1);
      expect(h.fetch).toHaveBeenCalledTimes(2);
      expect(nodes(render()).find(n => n.type === "dialog").props.open).toBe(
        false
      );
    }
  );
});
