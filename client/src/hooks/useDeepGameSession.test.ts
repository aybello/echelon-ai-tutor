import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepCatalogResponse, DeepSessionResponse } from "@shared/deepGames";

// Same deterministic React dispatcher style as the existing activity-hook tests.
// Transport work runs through a real QueryClient/cache and real abort signals.
const h = vi.hoisted(() => ({
  slots: [] as any[], cursor: 0, effects: [] as (() => void)[],
  queryCursor: 0, observers: [] as any[], options: [] as any[], client: null as any,
  catalog: vi.fn(), session: vi.fn(),
}));
vi.mock("react", () => {
  const changed = (a: unknown[] | undefined, b: unknown[]) => !a || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  return {
    useRef: (value: unknown) => { const index = h.cursor++; return h.slots[index] ??= { current: value }; },
    useState: (initial: unknown) => {
      const index = h.cursor++; h.slots[index] ??= { value: initial };
      return [h.slots[index].value, (next: any) => { h.slots[index].value = typeof next === "function" ? next(h.slots[index].value) : next; }];
    },
    useMemo: (fn: () => unknown, deps: unknown[]) => {
      const index = h.cursor++;
      if (!h.slots[index] || changed(h.slots[index].deps, deps)) h.slots[index] = { value: fn(), deps };
      return h.slots[index].value;
    },
    useCallback: (fn: unknown, deps: unknown[]) => {
      const index = h.cursor++;
      if (!h.slots[index] || changed(h.slots[index].deps, deps)) h.slots[index] = { value: fn, deps };
      return h.slots[index].value;
    },
    useEffect: (fn: () => (() => void) | void, deps: unknown[]) => {
      const index = h.cursor++;
      if (!h.slots[index] || changed(h.slots[index].deps, deps)) {
        const old = h.slots[index]; h.slots[index] = { deps };
        h.effects.push(() => { old?.cleanup?.(); h.slots[index].cleanup = fn(); });
      }
    },
  };
});
vi.mock("@tanstack/react-query", async importOriginal => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => h.client, useQuery: (options: any) => {
    const index = h.queryCursor++; h.options[index] = options;
    // Keep current queries observed, while explicitly controlling transport scheduling.
    const observed = { ...options, enabled: false };
    if (!h.observers[index]) {
      const observer = new actual.QueryObserver(h.client, observed);
      const unsubscribe = observer.subscribe(() => {});
      h.observers[index] = { observer, unsubscribe };
    } else h.observers[index].observer.setOptions(observed);
    return h.observers[index].observer.getCurrentResult();
  } };
});
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ client: { deepGames: {
  getCatalog: { mutate: h.catalog }, startSession: { mutate: h.session },
} } }) } }));
import { QueryClient } from "@tanstack/react-query";
import { DeepGameVersionMismatch, useDeepGameSession, validateDeepCatalog, validateDeepSession, type DeepGameLifecycle } from "./useDeepGameSession";

const catalog: DeepCatalogResponse = { courseKey: "oit", version: "test-v1", available: true,
  modes: [{ mode: "find-calculation-error", title: "Find the Calculation Error", count: 2 }], authoredTaskCount: 2, missionCount: 0 };
const session: DeepSessionResponse = { courseKey: "oit", version: "test-v1", sessionId: "delivery-1", mode: "find-calculation-error", tasks: [{
  id: "occurrence-1", sourceId: "task-1", task: { id: "task-1", revision: "r1", mode: "find-calculation-error", prompt: "Synthetic diagnosis", topicId: "topic", level: "oit", assumptions: "Synthetic test only",
    lines: [{ id: "line-a", label: "First line" }, { id: "line-b", label: "Second line" }], firstWrongLineId: "line-b", correctedLine: "Corrected synthetic line", explanation: "Synthetic explanation" },
}] };
let lifecycle: DeepGameLifecycle;
function render(next = lifecycle) {
  lifecycle = next; h.cursor = 0; h.queryCursor = 0;
  const result = useDeepGameSession(lifecycle);
  for (const effect of h.effects.splice(0)) effect();
  return result;
}
async function fetchQuery(index: number) {
  const options = h.options[index];
  if (options.enabled) await h.client.fetchQuery(options).catch(() => undefined);
}
async function readySession() {
  render(); await fetchQuery(0); render(); await fetchQuery(1); return render();
}
beforeEach(() => {
  h.slots = []; h.effects = []; h.cursor = 0; h.queryCursor = 0; h.observers = []; h.options = [];
  h.client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  h.catalog.mockReset().mockResolvedValue(catalog); h.session.mockReset().mockResolvedValue(session);
  lifecycle = { courseKey: "oit", mode: "find-calculation-error", authority: { accessToken: "signed-token-fixture", revision: 0 }, actorScope: "verified-actor-A", ready: true };
});
afterEach(() => {
  for (const slot of h.slots) slot?.cleanup?.();
  for (const item of h.observers) item.unsubscribe();
  h.client.clear();
});
describe("deep session validation", () => {
  it("requires a matching positive public catalog and rejects private/zero/other-course fields", () => {
    expect(validateDeepCatalog(catalog, "oit")).toEqual(catalog);
    expect(() => validateDeepCatalog(catalog, "class1-water")).toThrow();
    expect(() => validateDeepCatalog({ ...catalog, sources: [] }, "oit")).toThrow();
    expect(() => validateDeepCatalog({ ...catalog, modes: [{ ...catalog.modes[0], count: 0 }] }, "oit")).toThrow();
  });
  it("checks course, mode, task count and source/occurrence references, not just version", () => {
    expect(validateDeepSession(session, catalog, "find-calculation-error", 5)).toEqual(session);
    expect(() => validateDeepSession({ ...session, courseKey: "class1-water" }, catalog, "find-calculation-error", 5)).toThrow();
    expect(() => validateDeepSession(session, catalog, "build-process", 5)).toThrow();
    expect(() => validateDeepSession({ ...session, tasks: [{ ...session.tasks[0], sourceId: "wrong" }] }, catalog, "find-calculation-error", 5)).toThrow();
    expect(() => validateDeepSession({ ...session, version: "new-release", privateField: true }, catalog, "find-calculation-error", 5)).toThrow(DeepGameVersionMismatch);
  });
  it("validates expanded mission references and rejects missing/changed stages", () => {
    const missionSession = { ...session, mode: "exam-escape-room", tasks: [...session.tasks, { ...session.tasks[0], id: "occurrence-2" }],
      mission: { id: "mission-1", revision: "r1", mode: "exam-escape-room", title: "Synthetic mission", tasks: [{ taskId: "task-1", revision: "r1", occurrenceId: "occurrence-1" }, { taskId: "task-1", revision: "r1", occurrenceId: "occurrence-2" }] } };
    const missionCatalog = { ...catalog, modes: [...catalog.modes, { mode: "exam-escape-room" as const, title: "Escape", count: 1 }], missionCount: 1 };
    expect(validateDeepSession(missionSession, missionCatalog, "exam-escape-room", 5).tasks).toHaveLength(2);
    expect(() => validateDeepSession({ ...missionSession, tasks: session.tasks }, missionCatalog, "exam-escape-room", 5)).toThrow();
  });
});
describe("deep session page-authority lifecycle", () => {
  it("passes signed transport credentials but starts no session for classic or unsettled identity", async () => {
    render({ ...lifecycle, mode: null }); await fetchQuery(0); render(); await fetchQuery(1);
    expect(h.catalog).toHaveBeenCalledWith({ courseKey: "oit", accessToken: "signed-token-fixture" }, { signal: expect.any(AbortSignal) });
    expect(h.session).not.toHaveBeenCalled();
    render({ ...lifecycle, ready: false, mode: "find-calculation-error" }); await fetchQuery(0); await fetchQuery(1);
    expect(render().session).toBeUndefined(); expect(h.session).not.toHaveBeenCalled();
  });
  it("delivers one selected family, requests a new round and never invents a saved resume", async () => {
    const result = await readySession(); expect(result.session?.sessionId).toBe("delivery-1");
    expect(h.session).toHaveBeenCalledWith({ courseKey: "oit", mode: "find-calculation-error", sessionSize: 5, version: "test-v1", accessToken: "signed-token-fixture" }, { signal: expect.any(AbortSignal) });
    result.newRound(); expect(render().session).toBeUndefined(); await fetchQuery(1); expect(render().session).toBeDefined();
    render({ ...lifecycle, mode: null }); expect(render().session).toBeUndefined();
  });
  it("cancels old actor transport and never exposes its late session after actor/family change", async () => {
    render(); await fetchQuery(0); render();
    let release!: (value: unknown) => void; let oldSignal!: AbortSignal;
    h.session.mockImplementationOnce((_: unknown, options: { signal: AbortSignal }) => { oldSignal = options.signal; return new Promise(resolve => { release = resolve; }); });
    const old = fetchQuery(1); await Promise.resolve();
    render({ ...lifecycle, actorScope: "verified-actor-B", authority: { accessToken: undefined, revision: 1 }, mode: null });
    expect(oldSignal.aborted).toBe(true); expect(render().session).toBeUndefined();
    release(session); await old; expect(render().session).toBeUndefined();
    expect(h.client.getQueryCache().getAll().some((query: any) => query.queryKey.includes("verified-actor-A"))).toBe(false);
  });
  it("refreshes a stale catalog once only, including strict backend CONFLICT responses", async () => {
    h.session.mockRejectedValue({ data: { code: "CONFLICT" } });
    render(); await fetchQuery(0); render(); await fetchQuery(1); render();
    render(); await fetchQuery(0); render(); await fetchQuery(1); render(); render();
    expect(h.catalog).toHaveBeenCalledTimes(2); expect(h.session).toHaveBeenCalledTimes(2);
    expect(h.options[0].queryKey.at(-1)).toBe(1);
  });
});
