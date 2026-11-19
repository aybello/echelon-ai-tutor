import * as React from "react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { createTRPCQueryUtils, getQueryKey, TRPCUntypedClient } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

const h = vi.hoisted(() => ({
  states: [] as unknown[], cursor: 0, fetching: 0, utils: null as any,
  data: {} as Record<string, unknown>, error: false,
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = h.cursor++;
    return [index in h.states ? h.states[index] : initial, vi.fn()];
  },
}));
vi.mock("@tanstack/react-query", async original => ({
  ...await original<typeof import("@tanstack/react-query")>(),
  useIsFetching: () => h.fetching,
}));
vi.mock("@/lib/trpc", () => {
  const endpoint = (name: string) => ({
    _def: () => ({ path: ["admin", name] }),
    useQuery: () => ({ data: h.data[name], isLoading: false, isError: h.error, isFetching: false, refetch: vi.fn() }),
  });
  return { trpc: { useUtils: () => h.utils, admin: {
    learnerSearch: endpoint("learnerSearch"), learnerActivity: endpoint("learnerActivity"),
    learnerAssessments: endpoint("learnerAssessments"), learnerAssessmentDetails: endpoint("learnerAssessmentDetails"),
  } } };
});
import { trpc } from "@/lib/trpc";
import AdminLearnerActivity, { refreshLearnerActivityQueries } from "./AdminLearnerActivity";

const learner = { key: "email:fixture@example.test", selection: { email: "fixture@example.test" }, name: null, email: "fixture@example.test" };
const procedures = ["learnerSearch", "learnerActivity", "learnerAssessments", "learnerAssessmentDetails"] as const;
let client: QueryClient;
let cleanups: (() => void)[];
function observe(name: typeof procedures[number], input: any, enabled = true, subscribed = true) {
  const queryFn = vi.fn(async () => ({ fresh: true }));
  const queryKey = getQueryKey(trpc.admin[name] as typeof trpc.admin.learnerSearch, input, "query");
  const observer = new QueryObserver(client, { queryKey, queryFn, enabled, retry: false, staleTime: Infinity, initialData: { fresh: false } });
  if (subscribed) cleanups.push(observer.subscribe(() => {}));
  return { queryFn, queryKey };
}
function render() { h.cursor = 0; return AdminLearnerActivity(); }
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
const button = (tree: any) => nodes(tree).find(node => node.type === "button" && /Refresh learner activity|Refreshing…/.test(text(node)));
beforeEach(() => {
  vi.stubGlobal("React", React);
  h.cursor = 0; h.states = ["fixture@example.test", "fixture@example.test", learner, 7]; h.fetching = 0; h.error = false;
  h.data = { learnerActivity: { items: [], partial: false, lastObservedAt: new Date("2026-11-18T10:00:00Z"), recordedStudySeconds: 0 } };
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); cleanups = [];
  h.utils = createTRPCQueryUtils<AppRouter>({ queryClient: client, client: new TRPCUntypedClient<AppRouter>({ links: [] }) });
});
afterEach(() => { for (const cleanup of cleanups) cleanup(); client.clear(); vi.unstubAllGlobals(); });

describe("bounded learner-view manual refresh", () => {
  it("re-reads current search, timeline, assessment sessions and the OPEN detail cursor only, excluding old caches and disabled placeholders", async () => {
    const detailInput = { learner: learner.selection, days: 7 as const, sessionId: "session-fixture", cursor: 50 };
    const current = [
      observe("learnerSearch", { query: "fixture@example.test" }),
      observe("learnerActivity", { learner: learner.selection, days: 7 }),
      observe("learnerAssessments", { learner: learner.selection, days: 7 }),
      observe("learnerAssessmentDetails", detailInput),
    ];
    const untouched = [
      observe("learnerSearch", { query: "" }, false),
      observe("learnerSearch", { query: "old-search" }, true, false),
      observe("learnerActivity", { learner: { userId: 1 }, days: 7 }, false),
      observe("learnerActivity", { learner: learner.selection, days: 30 }, true, false),
      observe("learnerAssessments", { learner: { userId: 99 }, days: 7 }, true, false),
      observe("learnerAssessmentDetails", { learner: learner.selection, days: 7, sessionId: "session-fixture", cursor: 0 }, true, false),
    ];
    button(render()).props.onClick();
    for (const query of current) expect(query.queryFn).toHaveBeenCalledTimes(1);
    // onClick deliberately discards its promise; await the same in-flight refresh.
    await refreshLearnerActivityQueries(h.utils.admin);
    for (const query of current) expect(query.queryFn).toHaveBeenCalled();
    for (const query of untouched) expect(query.queryFn).not.toHaveBeenCalled();
    expect(h.states[2]).toBe(learner);
    expect(current[3].queryKey).toEqual(getQueryKey(trpc.admin.learnerAssessmentDetails, detailInput, "query"));
  });
  it("shares an in-flight read instead of cancelling/restarting it", async () => {
    let release!: (value: { fresh: boolean }) => void;
    const queryFn = vi.fn(() => new Promise<{ fresh: boolean }>(resolve => { release = resolve; }));
    const observer = new QueryObserver(client, { queryKey: getQueryKey(trpc.admin.learnerAssessments, { learner: learner.selection, days: 7 }, "query"), queryFn, initialData: { fresh: false }, retry: false });
    cleanups.push(observer.subscribe(() => {}));
    const first = refreshLearnerActivityQueries(h.utils.admin);
    const second = refreshLearnerActivityQueries(h.utils.admin);
    expect(queryFn).toHaveBeenCalledTimes(1);
    release({ fresh: true }); await Promise.all([first, second]);
  });
  it("keeps the full-view control available on empty/error states and disables it for any learner query fetching", () => {
    h.error = true; h.data = {}; h.states[2] = null;
    expect(button(render()).props.disabled).toBe(false);
    h.fetching = 1;
    const busy = button(render());
    expect(busy.props.disabled).toBe(true); expect(text(busy)).toBe("Refreshing…");
  });
  it("labels the timestamp and empty state as timeline-only, with the separate assessment scope disclosed", () => {
    const content = text(render());
    expect(content).toContain("Last activity in the timeline below");
    expect(content).toContain("Observed assessment sessions are listed separately and are not included in this timestamp.");
    expect(content).toContain("Check observed assessment sessions separately below.");
    expect(content).toContain("require an exact email, not a prefix");
    expect(content).not.toContain("Last observed activity in window");
  });
  it("wires the page header to the same refresh with shared fetching state, without remounting learner details", () => {
    const admin = readFileSync(new URL("../pages/Admin.tsx", import.meta.url), "utf8");
    expect(admin).toContain('const learnerRefresh = useLearnerActivityRefresh();');
    expect(admin).toMatch(/if \(activeTab === "learners"\) \{\s*void learnerRefresh.refresh\(\);\s*return;/);
    expect(admin).toContain('disabled={activeTab === "learners" && learnerRefresh.isRefreshing}');
    expect(admin).toContain('activeTab === "learners" && <AdminLearnerActivity />');
  });
});
