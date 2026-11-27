import * as React from "react";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  frames: new Map<string, any>(),
  frame: null as any,
  cursor: 0,
  dirty: false,
  effects: [] as (() => void)[],
  layouts: [] as (() => void)[],
  passiveCleanups: [] as (() => void)[],
  seen: new Set<string>(),
  contexts: new Map<any, any>(),
  client: null as any,
  listeners: new Map<string, Set<(...args: any[]) => void>>(),
  catalog: vi.fn(),
  list: vi.fn(),
  results: vi.fn(),
  fetchResults: vi.fn(),
  cancelResults: vi.fn(),
  create: vi.fn(),
  invite: vi.fn(),
  revoke: vi.fn(),
  invalidates: vi.fn(),
  clipboard: vi.fn(),
  download: vi.fn(),
}));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const changed = (a: any, b: any) =>
    !a ||
    a.length !== b.length ||
    a.some((v: any, i: number) => !Object.is(v, b[i]));
  const effect = (queue: any[], fn: any, deps: any[]) => {
    const i = h.cursor++;
    const slots = h.frame.slots;
    if (!slots[i] || changed(slots[i].deps, deps)) {
      const old = slots[i];
      slots[i] = { deps, layout: queue === h.layouts };
      queue.push(() => {
        old?.cleanup?.();
        slots[i].cleanup = fn();
      });
    }
  };
  return {
    ...actual,
    useRef: (initial: any) =>
      (h.frame.slots[h.cursor++] ??= { current: initial }),
    useState: (initial: any) => {
      const i = h.cursor++;
      const slots = h.frame.slots;
      slots[i] ??= {
        value: typeof initial === "function" ? initial() : initial,
      };
      return [
        slots[i].value,
        (next: any) => {
          const value =
            typeof next === "function" ? next(slots[i].value) : next;
          if (!Object.is(value, slots[i].value)) {
            slots[i].value = value;
            h.dirty = true;
          }
        },
      ];
    },
    useMemo: (fn: any, deps: any[]) => {
      const i = h.cursor++;
      const slots = h.frame.slots;
      if (!slots[i] || changed(slots[i].deps, deps))
        slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
    useContext: (context: any) => h.contexts.get(context) ?? null,
    useEffect: (fn: any, deps: any[]) => effect(h.effects, fn, deps),
    useLayoutEffect: (fn: any, deps: any[]) => effect(h.layouts, fn, deps),
  };
});
vi.mock("@tanstack/react-query", async original => ({
  ...(await original<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => h.client,
}));
vi.mock("@/lib/trpc", () => {
  const procedure = (name: "catalog" | "list" | "results") => ({
    _def: () => ({ path: ["recruitment", name] }),
    useQuery: (input: any, options: any) => {
      const key = [["recruitment", name], { input, type: "query" }];
      const observer = React.useMemo(
        () =>
          new QueryObserver(h.client, {
            ...options,
            queryKey: key,
            queryFn: ({ signal }: any) => h[name](input, { signal }),
          }),
        []
      );
      const [result, setResult] = React.useState<any>(() =>
        observer.getCurrentResult()
      );
      React.useLayoutEffect(() => {
        const unsubscribe = observer.subscribe(next => setResult(next));
        setResult(observer.getCurrentResult());
        return unsubscribe;
      }, []);
      return {
        ...result,
        refetch: () => observer.refetch(),
        options,
      };
    },
  });
  return {
    trpc: {
      useUtils: () => ({
        recruitment: {
          catalog: { invalidate: (input: any) => h.invalidates(input, "catalog") },
          list: { invalidate: (input: any) => h.invalidates(input, "list") },
          results: {
            invalidate: (input: any) => h.invalidates(input, "results"),
            cancel: h.cancelResults,
            fetch: h.fetchResults,
          },
        },
      }),
      recruitment: {
        catalog: procedure("catalog"),
        list: procedure("list"),
        results: procedure("results"),
        create: {
          useMutation: () => ({ mutateAsync: h.create, isPending: false }),
        },
        invite: {
          useMutation: () => ({ mutateAsync: h.invite, isPending: false }),
        },
        revoke: {
          useMutation: () => ({ mutateAsync: h.revoke, isPending: false }),
        },
      },
    },
  };
});
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@/components/ui/input", () => ({ Input: "input" }));
vi.mock("@/components/ui/label", () => ({ Label: "label" }));
vi.mock("@/components/ui/checkbox", () => ({ Checkbox: "checkbox" }));
vi.mock("@/components/ui/progress", () => ({ Progress: "progress" }));
import RecruitmentPanel from "@/components/RecruitmentPanel";
import { RecruitmentManagerPrivacyContext } from "./recruitmentManagerPrivacy";

const orgId = 7;
const assessmentId = "22222222-2222-4222-8222-222222222222";
const assessment = {
  id: assessmentId,
  title: "Private synthetic assessment",
  courseKey: "class2-water",
  courseLabel: "Class 2 Water",
  modules: ["Treatment"],
  questionCount: 5,
  timeLimitMinutes: null,
  createdAtMs: 1000,
  expiresAtMs: Date.now() + 900000,
  candidates: 1,
  completed: 0,
};
const result = {
  assignmentId: "11111111-1111-4111-8111-111111111111",
  memberId: 31,
  candidateEmail: "private@example.test",
  candidateName: "Private synthetic candidate",
  status: "invited",
  startedAtMs: null,
  submittedAtMs: null,
  expiresAtMs: Date.now() + 900000,
  score: null,
  answers: {},
  revision: 0,
  questions: [],
};
const catalog = {
  courses: [
    {
      courseKey: "class2-water",
      label: "Class 2 Water",
      modules: [{ name: "Treatment", count: 30 }],
    },
  ],
  candidates: [
    {
      memberId: 31,
      name: "Private synthetic candidate",
      email: "private@example.test",
      courseKeys: ["class2-water"],
    },
  ],
};
const key = (name: string, input: any) => [
  ["recruitment", name],
  { input, type: "query" },
];
let tree: any;
let panelMounted = true;
function expand(node: any, path: string): any {
  if (Array.isArray(node)) return node.map((n, i) => expand(n, `${path}/${i}`));
  if (!node || typeof node !== "object") return node;
  if (node.type === RecruitmentManagerPrivacyContext.Provider) {
    h.contexts.set(RecruitmentManagerPrivacyContext, node.props.value);
    const next = expand(node.props.children, `${path}/provider`);
    h.contexts.delete(RecruitmentManagerPrivacyContext);
    return next;
  }
  if (typeof node.type === "function") {
    const id = `${path}:${node.type.name}:${node.key ?? ""}`;
    h.seen.add(id);
    h.frame = h.frames.get(id) ?? { slots: [] };
    h.frames.set(id, h.frame);
    h.cursor = 0;
    return expand(node.type(node.props), id);
  }
  return {
    ...node,
    props: {
      ...node.props,
      children: expand(
        node.props.children,
        `${path}/${String(node.type)}:${node.key ?? ""}`
      ),
    },
  };
}
function render(deferPassiveCleanups = false) {
  let loops = 0;
  do {
    h.dirty = false;
    h.seen.clear();
    tree = panelMounted
      ? expand(React.createElement(RecruitmentPanel, { orgId }), "root")
      : null;
    for (const [id, frame] of h.frames)
      if (!h.seen.has(id)) {
        frame.slots.forEach((slot: any) => {
          if (deferPassiveCleanups && slot?.layout === false)
            h.passiveCleanups.push(() => slot.cleanup?.());
          else slot?.cleanup?.();
        });
        h.frames.delete(id);
      }
    h.layouts.splice(0).forEach(fn => fn());
    h.effects.splice(0).forEach(fn => fn());
  } while (h.dirty && ++loops < 30);
  if (loops >= 30) throw new Error("Harness render loop");
  return tree;
}
function text(node: any): string {
  if (Array.isArray(node)) return node.map(n => text(n)).join(" ");
  if (node == null || typeof node === "boolean") return "";
  return typeof node === "object" ? text(node.props?.children) : String(node);
}
function nodes(node: any): any[] {
  if (Array.isArray(node)) return node.flatMap(n => nodes(n));
  return node && typeof node === "object"
    ? [node, ...nodes(node.props?.children)]
    : [];
}
function find(predicate: (node: any) => boolean) {
  const node = nodes(tree).find(predicate);
  if (!node) throw new Error(`Missing test node: ${text(tree)}`);
  return node;
}
function input(id: string, value: string) {
  find(n => n.props.id === id).props.onChange({ target: { value } });
  render();
}
function deferred() {
  let resolve!: (value: any) => void;
  let reject!: (error: any) => void;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
async function settle() {
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
    render();
  }
}
async function readyDetail() {
  render();
  await settle();
  find(
    n => n.type === "button" && text(n).includes(assessment.title)
  ).props.onClick();
  render();
  await settle();
}
function reviewRevocation() {
  find(n => String(n.props["aria-label"]).startsWith("Revoke invitation")).props.onClick();
  render();
  const group = find(n => n.props["aria-labelledby"] === "recruitment-revoke-title");
  const checkbox = nodes(group).find(n => n.type === "checkbox");
  checkbox.props.onCheckedChange(true);
  render();
  return {
    checkbox,
    handler: find(n => n.type === "button" && text(n).includes("Confirm revoke")).props.onClick,
  };
}
function dispatch(name: string) {
  for (const fn of [...(h.listeners.get(name) ?? [])])
    fn({ key: "session-switch" });
}
beforeEach(() => {
  panelMounted = true;
  h.frames.clear();
  h.contexts.clear();
  h.effects = [];
  h.layouts = [];
  h.passiveCleanups = [];
  h.listeners.clear();
  h.dirty = false;
  h.client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const target = {
    addEventListener: (name: string, fn: any) => {
      const set = h.listeners.get(name) ?? new Set();
      set.add(fn);
      h.listeners.set(name, set);
    },
    removeEventListener: (name: string, fn: any) =>
      h.listeners.get(name)?.delete(fn),
  };
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", {
    ...target,
    location: { origin: "https://synthetic.example.test" },
  });
  vi.stubGlobal("document", {
    ...target,
    createElement: () => ({ click: h.download, remove: vi.fn() }),
    body: { appendChild: vi.fn() },
  });
  vi.stubGlobal("navigator", { clipboard: { writeText: h.clipboard } });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:synthetic");
  h.catalog.mockReset().mockResolvedValue(catalog);
  h.list.mockReset().mockResolvedValue([assessment]);
  h.results.mockReset().mockResolvedValue({ assessment, results: [result] });
  h.cancelResults
    .mockReset()
    .mockImplementation((input: any) =>
      h.client.cancelQueries({ queryKey: key("results", input), exact: true })
    );
  h.fetchResults.mockReset().mockImplementation((input: any, options: any) =>
    h.client.fetchQuery({
      ...options,
      queryKey: key("results", input),
      // Match tRPC utils.fetch: transport is invoked, not cached delivered props.
      queryFn: () => h.results(input),
    })
  );
  h.create.mockReset().mockResolvedValue({ assessmentId });
  h.invite.mockReset().mockResolvedValue({ assignmentId: result.assignmentId });
  h.revoke.mockReset().mockResolvedValue({ success: true });
  h.invalidates.mockReset();
  h.clipboard.mockReset().mockResolvedValue(undefined);
  h.download.mockReset();
});
afterEach(() => {
  h.passiveCleanups.splice(0).forEach(fn => fn());
  h.frames.forEach(frame =>
    frame.slots.forEach((slot: any) => slot?.cleanup?.())
  );
  h.client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("recruitment manager privacy component lifecycle (Node, synthetic transport)", () => {
  it.each(["submitted", "revision"] as const)(
    "clears a reviewed active target synchronously on results refetch and fences refreshed %s before rerender",
    async change => {
      const active = { ...result, status: "active", revision: 7 };
      h.results.mockResolvedValue({ assessment, results: [active] });
      await readyDetail();
      const oldReview = reviewRevocation();
      const pending = deferred();
      const read = h.client.fetchQuery({
        queryKey: key("results", { orgId, assessmentId }),
        queryFn: () => pending.promise,
        staleTime: 0,
        retry: false,
      });
      oldReview.handler(); // Fetch event ran, but React has not rerendered.
      expect(h.revoke).not.toHaveBeenCalled();
      const refreshed = {
        ...active,
        status: change === "submitted" ? "submitted" : "active",
        revision: 8,
      };
      pending.resolve({ assessment, results: [refreshed] });
      await read;
      oldReview.handler(); // Fresh response, still before component rerender.
      expect(h.revoke).not.toHaveBeenCalled();
      await settle();
      expect(text(tree)).not.toContain("I confirm I want to revoke");
      oldReview.checkbox.props.onCheckedChange(true);
      oldReview.handler();
      await settle();
      expect(h.revoke).not.toHaveBeenCalled();
      if (change === "revision") {
        const freshReview = reviewRevocation();
        oldReview.handler(); // New explicit confirmation cannot authorize its predecessor.
        expect(h.revoke).not.toHaveBeenCalled();
        freshReview.handler();
        await settle();
        expect(h.revoke).toHaveBeenCalledTimes(1);
        expect(h.revoke).toHaveBeenCalledWith({
          orgId,
          assignmentId: active.assignmentId,
          expectedRevision: refreshed.revision,
        });
      } else {
        expect(nodes(tree).some(n => String(n.props["aria-label"]).startsWith("Revoke invitation"))).toBe(false);
      }
    }
  );
  it("clears confirmation on a mismatched manual DTO revision before rerender and refuses manual freshness", async () => {
    await readyDetail();
    const oldReview = reviewRevocation();
    h.client.setQueryData(key("results", { orgId, assessmentId }), {
      assessment,
      results: [{ ...result, revision: 9 }],
    });
    oldReview.handler();
    expect(h.revoke).not.toHaveBeenCalled();
    render();
    expect(text(tree)).not.toContain("I confirm I want to revoke");
    expect(text(tree)).not.toContain("Revoke invitation for");
    expect(text(tree)).toContain("Loading assessment results");
  });
  it("unchecking confirmation synchronously rejects an accepted retained revoke handler", async () => {
    await readyDetail();
    reviewRevocation();
    const checkbox = nodes(find(n => n.props["aria-labelledby"] === "recruitment-revoke-title"))
      .find(n => n.type === "checkbox");
    const handler = find(n => n.type === "button" && text(n).includes("Confirm revoke")).props.onClick;
    checkbox.props.onCheckedChange(false);
    handler();
    expect(h.revoke).not.toHaveBeenCalled();
  });
  it("does not let a cancelled retained callback borrow a new confirmation for the exact same DTO", async () => {
    await readyDetail();
    const oldReview = reviewRevocation();
    find(n => n.type === "button" && text(n) === "Cancel").props.onClick();
    const freshReview = reviewRevocation();
    oldReview.checkbox.props.onCheckedChange(true);
    oldReview.handler();
    expect(h.revoke).not.toHaveBeenCalled();
    freshReview.handler();
    await settle();
    expect(h.revoke).toHaveBeenCalledTimes(1);
    expect(h.revoke).toHaveBeenCalledWith({
      orgId,
      assignmentId: result.assignmentId,
      expectedRevision: result.revision,
    });
  });
  it.each(["session", "remote"] as const)(
    "rejects retained confirmation on %s reset before rerender and after fresh authorization",
    async mode => {
      await readyDetail();
      const oldReview = reviewRevocation();
      if (mode === "session") dispatch("focus");
      else {
        await h.client.fetchQuery({
          queryKey: key("results", { orgId, assessmentId }),
          queryFn: async () => { throw { data: { code: "FORBIDDEN" } }; },
          staleTime: 0,
          retry: false,
        }).catch(() => undefined);
      }
      oldReview.handler();
      expect(h.revoke).not.toHaveBeenCalled();
      await settle();
      await readyDetail();
      const freshReview = reviewRevocation();
      oldReview.checkbox.props.onCheckedChange(true);
      oldReview.handler();
      expect(h.revoke).not.toHaveBeenCalled();
      freshReview.handler();
      await settle();
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(h.revoke).toHaveBeenCalledWith({
        orgId,
        assignmentId: result.assignmentId,
        expectedRevision: result.revision,
      });
    }
  );
  it("CONFLICT clears review, refreshes changed revision, and requires new explicit confirmation without replay", async () => {
    await readyDetail();
    const oldReview = reviewRevocation();
    h.invalidates.mockImplementation((input: any, name: string) =>
      name === "results"
        ? h.client.invalidateQueries({ queryKey: key(name, input), exact: true })
        : undefined
    );
    h.revoke.mockRejectedValueOnce({ data: { code: "CONFLICT" } });
    h.results.mockResolvedValue({ assessment, results: [{ ...result, revision: 4 }] });
    oldReview.handler();
    await settle();
    expect(h.revoke).toHaveBeenCalledTimes(1);
    expect(h.revoke).toHaveBeenCalledWith({
      orgId,
      assignmentId: result.assignmentId,
      expectedRevision: 0,
    });
    expect(h.results).toHaveBeenCalledTimes(2);
    expect(text(tree)).toContain("Revocation was not retried.");
    expect(text(tree)).not.toContain("I confirm I want to revoke");
    oldReview.checkbox.props.onCheckedChange(true);
    oldReview.handler();
    await settle();
    expect(h.revoke).toHaveBeenCalledTimes(1);
    reviewRevocation().handler();
    await settle();
    expect(h.revoke).toHaveBeenCalledTimes(2);
    expect(h.revoke.mock.calls[1][0]).toEqual({
      orgId,
      assignmentId: result.assignmentId,
      expectedRevision: 4,
    });
  });
  it.each(["current", "cleared"] as const)(
    "reconciles a deadline-finalizing CONFLICT into results and list counts with a %s review without replay",
    async reviewState => {
      const active = { ...result, status: "active", startedAtMs: 1000, revision: 3 };
      const timedAssessment = { ...assessment, timeLimitMinutes: 5 };
      h.list.mockResolvedValue([timedAssessment]);
      h.results.mockResolvedValue({ assessment: timedAssessment, results: [active] });
      await readyDetail();
      expect(text(tree).replace(/\s+/g, " ")).toContain("0 completed / 1 invited");
      const oldReview = reviewRevocation();
      const mutation = deferred();
      h.revoke.mockReturnValueOnce(mutation.promise);
      oldReview.handler();
      if (reviewState === "cleared") {
        // A pre-conflict read can clear review without seeing the deadline write.
        await h.client.fetchQuery({
          queryKey: key("results", { orgId, assessmentId }),
          queryFn: () => h.results({ orgId, assessmentId }),
          staleTime: 0,
          retry: false,
        });
        await settle();
        expect(text(tree)).not.toContain("I confirm I want to revoke");
      }
      h.invalidates.mockImplementation((input: any, name: string) =>
        h.client.invalidateQueries({ queryKey: key(name, input), exact: true })
      );
      // Revoke can commit timeout/submission evidence before returning CONFLICT.
      const finalized = {
        ...active,
        status: "timed_out",
        submittedAtMs: 301000,
        revision: 4,
      };
      const completedAssessment = { ...timedAssessment, completed: 1 };
      h.results.mockResolvedValue({ assessment: completedAssessment, results: [finalized] });
      h.list.mockResolvedValue([completedAssessment]);
      mutation.reject({ data: { code: "CONFLICT" } });
      await settle();
      expect(h.invalidates).toHaveBeenCalledWith({ orgId, assessmentId }, "results");
      expect(h.invalidates).toHaveBeenCalledWith({ orgId }, "list");
      expect(h.list).toHaveBeenCalledTimes(2);
      expect(h.client.getQueryData(key("list", { orgId }))).toEqual([completedAssessment]);
      expect(h.client.getQueryData(key("results", { orgId, assessmentId })).results[0]).toMatchObject(finalized);
      expect(text(tree).replace(/\s+/g, " ")).toContain("1 completed / 1 invited");
      expect(text(tree)).toContain("Time ended");
      expect(text(tree)).not.toContain("Invitation revoked.");
      expect(text(tree)).not.toContain("I confirm I want to revoke");
      expect(nodes(tree).some(n => String(n.props["aria-label"]).startsWith("Revoke invitation"))).toBe(false);
      if (reviewState === "cleared")
        expect(text(tree)).not.toContain("Revocation was not retried.");
      oldReview.checkbox.props.onCheckedChange(true);
      oldReview.handler();
      await settle();
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(h.revoke).toHaveBeenCalledWith({
        orgId,
        assignmentId: active.assignmentId,
        expectedRevision: active.revision,
      });
    }
  );
  it("reconciles late revoke success after results change while suppressing a stale success notice", async () => {
    await readyDetail();
    const oldReview = reviewRevocation();
    const pending = deferred();
    h.revoke.mockReturnValueOnce(pending.promise);
    oldReview.handler();
    expect(h.revoke).toHaveBeenCalledOnce();
    await h.client.fetchQuery({
      queryKey: key("results", { orgId, assessmentId }),
      queryFn: async () => ({ assessment, results: [{ ...result, status: "submitted", revision: 1 }] }),
      staleTime: 0,
      retry: false,
    });
    pending.resolve({ success: true });
    await settle();
    expect(h.invalidates).toHaveBeenCalledWith({ orgId, assessmentId }, "results");
    expect(h.invalidates).toHaveBeenCalledWith({ orgId }, "list");
    expect(text(tree)).not.toContain("Invitation revoked.");
    expect(text(tree)).not.toContain("I confirm I want to revoke");
  });
  it.each(["success", "conflict"] as const)(
    "reconciles a settled revoke %s after an actual results refetch returned a pre-revoke row",
    async outcome => {
      const otherAssessment = {
        ...assessment,
        id: "33333333-3333-4333-8333-333333333333",
        title: "Other synthetic assessment",
      };
      h.list.mockResolvedValue([assessment, otherAssessment]);
      await readyDetail();
      find(n => String(n.props["aria-label"]).startsWith("Copy invitation")).props.onClick();
      await settle();
      expect(find(n => n.props.id === "recruitment-link").props.value).toContain(result.assignmentId);
      const oldReview = reviewRevocation();
      const mutation = deferred();
      h.revoke.mockReturnValueOnce(mutation.promise);
      oldReview.handler();
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(h.revoke).toHaveBeenCalledWith({
        orgId,
        assignmentId: result.assignmentId,
        expectedRevision: result.revision,
      });
      const prerevoke = deferred();
      h.results.mockReturnValueOnce(prerevoke.promise);
      const read = h.client.fetchQuery({
        queryKey: key("results", { orgId, assessmentId }),
        queryFn: () => h.results({ orgId, assessmentId }),
        staleTime: 0,
        retry: false,
      });
      oldReview.handler(); // A retained confirmation cannot dispatch twice.
      expect(h.revoke).toHaveBeenCalledTimes(1);
      prerevoke.resolve({ assessment, results: [{ ...result }] });
      await read;
      await settle();
      expect(h.results).toHaveBeenCalledTimes(2);
      expect(text(tree)).not.toContain("I confirm I want to revoke");
      // Use actual QueryClient invalidation + active QueryObservers, not a spy
      // asserting a refresh that never reaches the transport or retained props.
      h.invalidates.mockImplementation((input: any, name: string) =>
        h.client.invalidateQueries({ queryKey: key(name, input), exact: true })
      );
      const latest = {
        ...result,
        status: outcome === "success" ? "revoked" : "active",
        revision: 4,
      };
      h.results.mockResolvedValue({ assessment, results: [latest] });
      if (outcome === "success") mutation.resolve({ success: true });
      else mutation.reject({ data: { code: "CONFLICT" } });
      await settle();
      expect(h.results.mock.calls.length).toBeGreaterThanOrEqual(3);
      expect(h.client.getQueryData(key("results", { orgId, assessmentId })).results[0]).toMatchObject(latest);
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(text(tree)).not.toContain("I confirm I want to revoke");
      expect(text(tree)).not.toContain("Invitation revoked.");
      expect(text(tree)).not.toContain("Revocation was not retried."); // Stale review notices stay suppressed.
      oldReview.checkbox.props.onCheckedChange(true);
      oldReview.handler();
      expect(h.revoke).toHaveBeenCalledTimes(1);
      if (outcome === "success") {
        expect(h.invalidates).toHaveBeenCalledWith({ orgId, assessmentId }, "results");
        expect(h.invalidates).toHaveBeenCalledWith({ orgId }, "list");
        expect(h.list.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(text(tree)).not.toContain("Candidate invitation link");
        expect(text(tree)).not.toContain("Link copied.");
        // A real detail remount must not restore the parent's revoked outcome.
        h.results.mockImplementation((input: any) => Promise.resolve({
          assessment: input.assessmentId === otherAssessment.id ? otherAssessment : assessment,
          results: [latest],
        }));
        find(n => n.type === "button" && text(n).includes(otherAssessment.title)).props.onClick();
        await settle();
        find(n => n.type === "button" && text(n).includes(assessment.title)).props.onClick();
        await settle();
        expect(text(tree)).not.toContain("Candidate invitation link");
      } else {
        expect(text(tree)).toContain("Candidate invitation link"); // Conflict did not revoke it.
        reviewRevocation().handler();
        await settle();
        expect(h.revoke).toHaveBeenCalledTimes(2);
        expect(h.revoke.mock.calls[1][0].expectedRevision).toBe(4);
      }
    }
  );
  it.each(["success", "conflict"] as const)(
    "ignores sent revoke %s after assessment-switch layout teardown before passive cleanup with the parent epoch alive",
    async outcome => {
      const otherAssessment = {
        ...assessment,
        id: "33333333-3333-4333-8333-333333333333",
        title: "Other synthetic assessment",
      };
      h.list.mockResolvedValue([assessment, otherAssessment]);
      h.results.mockImplementation((input: any) => Promise.resolve({
        assessment: input.assessmentId === otherAssessment.id ? otherAssessment : assessment,
        results: [result],
      }));
      await readyDetail();
      find(n => String(n.props["aria-label"]).startsWith("Copy invitation")).props.onClick();
      await settle();
      const parentEntry = [...h.frames.entries()].find(([id]) => id.includes(":RecruitmentPanelBody:"))!;
      const parent = parentEntry[1];
      const outcomeSlot = parent.slots.find((slot: any) => slot?.value?.assignmentId === result.assignmentId);
      const savedOutcome = outcomeSlot.value;
      const detail = [...h.frames.entries()].find(([id]) => id.includes(":RecruitmentDetail:"))![1];
      const oldReview = reviewRevocation();
      const mutation = deferred();
      h.revoke.mockReturnValueOnce(mutation.promise);
      oldReview.handler();
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(h.revoke).toHaveBeenCalledWith({
        orgId,
        assignmentId: result.assignmentId,
        expectedRevision: result.revision,
      });

      find(n => n.type === "button" && text(n).includes(otherAssessment.title)).props.onClick();
      render(true); // Commit old detail's layout teardown, withholding its passive cleanups.
      expect(h.passiveCleanups.length).toBeGreaterThan(0);
      expect(h.frames.get(parentEntry[0])).toBe(parent);
      expect(outcomeSlot.value).toBe(savedOutcome);
      const detailState = detail.slots.map((slot: any) => slot?.value);
      const clipboardCalls = h.clipboard.mock.calls.length;
      const reads = h.results.mock.calls.length;
      if (outcome === "success") mutation.resolve({ success: true });
      else mutation.reject({ data: { code: "CONFLICT" } });
      // Do not call settle/render: the old detail's passive cleanup must not run.
      for (let i = 0; i < 12; i++) await Promise.resolve();
      oldReview.checkbox.props.onCheckedChange(true);
      oldReview.handler();
      expect.soft(h.invalidates).not.toHaveBeenCalled();
      expect.soft(outcomeSlot.value).toBe(savedOutcome);
      expect.soft(detail.slots.map((slot: any) => slot?.value)).toEqual(detailState);
      expect(h.frames.get(parentEntry[0])).toBe(parent);
      expect(h.results).toHaveBeenCalledTimes(reads);
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(h.clipboard).toHaveBeenCalledTimes(clipboardCalls);
      expect(h.download).not.toHaveBeenCalled();
      expect(h.passiveCleanups.length).toBeGreaterThan(0);

      h.passiveCleanups.splice(0).forEach(fn => fn());
      await settle();
      find(n => n.type === "button" && text(n).includes(assessment.title)).props.onClick();
      await settle();
      // The surviving parent still owns its prior outcome; old sent-write
      // settlement cannot erase it or lend a new confirmation to old handlers.
      expect(find(n => n.props.id === "recruitment-link").props.value).toContain(result.assignmentId);
      expect(text(tree)).toContain("Link copied.");
      expect(text(tree)).not.toContain("Invitation revoked.");
      expect(text(tree)).not.toContain("Revocation was not retried.");
      expect(text(tree)).not.toContain("I confirm I want to revoke");
      reviewRevocation();
      oldReview.checkbox.props.onCheckedChange(true);
      oldReview.handler();
      await settle();
      expect(h.revoke).toHaveBeenCalledTimes(1);
      expect(h.invalidates).not.toHaveBeenCalled();
    }
  );
  it.each([
    ["session reset", "success"],
    ["session reset", "conflict"],
    ["unmount", "success"],
    ["unmount", "conflict"],
  ] as const)(
    "never reconciles or restores private props after %s when a pending revoke settles as %s",
    async (boundary, outcome) => {
      await readyDetail();
      find(n => String(n.props["aria-label"]).startsWith("Copy invitation")).props.onClick();
      await settle();
      const mutation = deferred();
      h.revoke.mockReturnValueOnce(mutation.promise);
      reviewRevocation().handler();
      await h.client.fetchQuery({
        queryKey: key("results", { orgId, assessmentId }),
        queryFn: () => h.results({ orgId, assessmentId }),
        staleTime: 0,
        retry: false,
      });
      await settle();
      if (boundary === "session reset") {
        h.list.mockRejectedValue({ data: { code: "FORBIDDEN" } });
        h.catalog.mockRejectedValue({ data: { code: "FORBIDDEN" } });
        dispatch("focus");
      } else panelMounted = false;
      await settle();
      const reads = h.results.mock.calls.length;
      if (outcome === "success") mutation.resolve({ success: true });
      else mutation.reject({ data: { code: "CONFLICT" } });
      await settle();
      expect(h.results).toHaveBeenCalledTimes(reads);
      expect(h.invalidates).not.toHaveBeenCalled();
      expect(h.client.getQueryData(key("results", { orgId, assessmentId }))).toBeUndefined();
      expect(text(tree)).not.toContain(result.candidateEmail);
      expect(text(tree)).not.toContain("Candidate invitation link");
      expect(text(tree)).not.toContain("Invitation revoked.");
      expect(text(tree)).not.toContain("I confirm");
    }
  );
  it("does not render seeded roster/form/list/results before a fresh successful authorization, or after denial", async () => {
    h.client.setQueryData(key("catalog", { orgId }), catalog);
    h.client.setQueryData(key("list", { orgId }), [assessment]);
    h.client.setQueryData(key("results", { orgId, assessmentId }), {
      assessment,
      results: [result],
    });
    const read = deferred();
    h.catalog.mockReturnValue(read.promise);
    h.list.mockReturnValue(read.promise);
    render();
    expect(text(tree)).not.toContain(assessment.title);
    expect(text(tree)).not.toContain(result.candidateEmail);
    expect(text(tree)).not.toContain("Create an assessment");
    read.reject({ data: { code: "FORBIDDEN" } });
    await settle();
    expect(text(tree)).toContain("could not be verified");
    expect(text(tree)).not.toContain(result.candidateName);
    expect(text(tree)).not.toContain("Download CSV");
  });
  it("requires the results query's own fresh success before exposing candidate actions or CSV", async () => {
    const read = deferred();
    h.results.mockReturnValue(read.promise);
    h.client.setQueryData(key("results", { orgId, assessmentId }), {
      assessment,
      results: [result],
    });
    render();
    await settle();
    find(
      n => n.type === "button" && text(n).includes(assessment.title)
    ).props.onClick();
    render();
    expect(text(tree)).not.toContain(result.candidateEmail);
    expect(text(tree)).not.toContain("Download CSV");
    read.resolve({ assessment, results: [result] });
    await settle();
    expect(text(tree)).toContain(result.candidateEmail);
    expect(text(tree)).toContain("Download CSV");
  });
  it("allows fresh server-authorized historical list/results, CSV and revoke after expired-term catalog FORBIDDEN", async () => {
    h.catalog.mockRejectedValue({
      message: "The current Annual term has expired.",
      data: { code: "FORBIDDEN" },
    });
    h.client.setQueryData(key("catalog", { orgId }), catalog);
    await readyDetail();
    expect(h.list).toHaveBeenCalledWith({ orgId }, expect.anything());
    expect(h.results).toHaveBeenCalledWith(
      { orgId, assessmentId },
      expect.anything()
    );
    expect(text(tree)).toContain(assessment.title);
    expect(text(tree)).toContain(result.candidateEmail);
    expect(text(tree)).toContain(
      "Current-term recruitment creation and invitations are unavailable."
    );
    expect(text(tree)).toContain("Historical assessments and results");
    expect(nodes(tree).some(n => n.props.id === "recruitment-title")).toBe(false);
    expect(nodes(tree).some(n => n.props.id === "recruitment-candidate")).toBe(
      false
    );
    expect(nodes(tree).some(n => String(n.props.href).includes("pricing"))).toBe(
      false
    );
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
    const csv = find(
      n => n.type === "button" && text(n).includes("Download CSV")
    );
    expect(csv.props.disabled).toBe(false);
    csv.props.onClick();
    await settle();
    expect(h.fetchResults).toHaveBeenCalledWith(
      { orgId, assessmentId },
      { staleTime: 0, retry: false }
    );
    expect(h.download).toHaveBeenCalledOnce();
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(await blob.text()).toContain(result.candidateEmail);
    find(n =>
      String(n.props["aria-label"]).startsWith("Revoke invitation")
    ).props.onClick();
    render();
    const group = find(
      n => n.props["aria-labelledby"] === "recruitment-revoke-title"
    );
    nodes(group)
      .find(n => n.type === "checkbox")
      .props.onCheckedChange(true);
    render();
    find(
      n => n.type === "button" && text(n).includes("Confirm revoke")
    ).props.onClick();
    await settle();
    expect(h.revoke).toHaveBeenCalledWith({
      orgId,
      assignmentId: result.assignmentId,
      expectedRevision: result.revision,
    });
    expect(text(tree)).toContain("Invitation revoked.");
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
  });
  it.each(["FORBIDDEN", "network"])(
    "does not infer reporting authority from catalog denial when the fresh list fails with %s",
    async mode => {
      h.catalog.mockRejectedValue({ data: { code: "FORBIDDEN" } });
      h.list.mockRejectedValue(
        mode === "FORBIDDEN"
          ? { data: { code: mode } }
          : new Error("Synthetic list failure")
      );
      h.client.setQueryData(key("list", { orgId }), [assessment]);
      h.client.setQueryData(key("results", { orgId, assessmentId }), {
        assessment,
        results: [result],
      });
      render();
      await settle();
      expect(text(tree)).toContain("could not be verified");
      expect(text(tree)).not.toContain(assessment.title);
      expect(text(tree)).not.toContain(result.candidateEmail);
      expect(text(tree)).not.toContain(result.candidateName);
      expect(text(tree)).not.toContain("Download CSV");
      expect(text(tree)).not.toContain("Historical assessments and results");
      expect(h.results).not.toHaveBeenCalled();
      expect(h.create).not.toHaveBeenCalled();
      expect(h.invite).not.toHaveBeenCalled();
    }
  );
  it("hides seeded private results and all detail actions on failed historical results authorization", async () => {
    h.catalog.mockRejectedValue({ data: { code: "FORBIDDEN" } });
    h.results.mockRejectedValue(new Error("Synthetic historical results failure"));
    h.client.setQueryData(key("results", { orgId, assessmentId }), {
      assessment,
      results: [result],
    });
    await readyDetail();
    expect(text(tree)).toContain("Synthetic historical results failure");
    expect(text(tree)).not.toContain(result.candidateEmail);
    expect(text(tree)).not.toContain(result.candidateName);
    expect(text(tree)).not.toContain("Candidate results");
    expect(text(tree)).not.toContain("Download CSV");
    expect(text(tree)).not.toContain("Revoke invitation");
    expect(h.download).not.toHaveBeenCalled();
    expect(h.revoke).not.toHaveBeenCalled();
  });
  it("requires a nonmanual fresh catalog success even when list and results already authorize reporting", async () => {
    const pending = deferred();
    h.catalog.mockReturnValue(pending.promise);
    await readyDetail();
    expect(text(tree)).toContain(result.candidateEmail);
    expect(text(tree)).toContain("Download CSV");
    expect(nodes(tree).some(n => n.props.id === "recruitment-title")).toBe(false);
    expect(nodes(tree).some(n => n.props.id === "recruitment-candidate")).toBe(
      false
    );
    h.client.setQueryData(key("catalog", { orgId }), catalog);
    render();
    expect(nodes(tree).some(n => n.props.id === "recruitment-title")).toBe(false);
    expect(nodes(tree).some(n => n.props.id === "recruitment-candidate")).toBe(
      false
    );
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
    pending.resolve(catalog);
    await settle();
    // A manual success consumes the pending freshness evidence. A new actual
    // fetch must succeed before this catalog can authorize create/invite.
    expect(nodes(tree).some(n => n.props.id === "recruitment-title")).toBe(false);
    h.catalog.mockResolvedValue(catalog);
    await h.client.fetchQuery({
      queryKey: key("catalog", { orgId }),
      queryFn: () => h.catalog({ orgId }),
      staleTime: 0,
      retry: false,
    });
    await settle();
    expect(find(n => n.props.id === "recruitment-title")).toBeDefined();
    expect(find(n => n.props.id === "recruitment-candidate")).toBeDefined();
  });
  it("refuses retained creation and invite handlers after current catalog refetch/denial while keeping reporting accessible", async () => {
    await readyDetail();
    input("recruitment-title", "Synthetic new assessment");
    input("recruitment-course", "class2-water");
    find(n => n.props.id === "recruitment-specific-topics").props.onCheckedChange(true);
    render();
    nodes(find(n => n.props.id === "recruitment-topic-options"))
      .find(n => n.type === "checkbox").props.onCheckedChange(true);
    render();
    input("recruitment-candidate", "31");
    const createForm = find(
      n => n.type === "form" && text(n).includes("Create assessment")
    );
    const inviteForm = find(
      n => n.type === "form" && text(n).includes("Create invitation link")
    );
    const pending = deferred();
    const refetch = h.client
      .fetchQuery({
        queryKey: key("catalog", { orgId }),
        queryFn: () => pending.promise,
        staleTime: 0,
        retry: false,
      })
      .catch(() => undefined);
    // QueryClient changes synchronously, before React delivers the new props.
    await createForm.props.onSubmit({ preventDefault: vi.fn() });
    await inviteForm.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
    render();
    await createForm.props.onSubmit({ preventDefault: vi.fn() });
    await inviteForm.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
    expect(text(tree)).toContain(result.candidateEmail);
    expect(text(tree)).toContain("Download CSV");
    expect(nodes(tree).some(n => n.props.id === "recruitment-candidate")).toBe(
      false
    );
    pending.reject({ data: { code: "FORBIDDEN" } });
    await refetch;
    await settle();
    await createForm.props.onSubmit({ preventDefault: vi.fn() });
    await inviteForm.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
    expect(text(tree)).toContain("Historical assessments and results");
    expect(text(tree)).toContain(result.candidateEmail);
    expect(text(tree)).toContain("Download CSV");
    h.catalog.mockResolvedValue(catalog);
    await h.client.fetchQuery({
      queryKey: key("catalog", { orgId }),
      queryFn: () => h.catalog({ orgId }),
      staleTime: 0,
      retry: false,
    });
    await settle();
    expect(find(n => n.props.id === "recruitment-title")).toBeDefined();
    expect(find(n => n.props.id === "recruitment-candidate")).toBeDefined();
    await createForm.props.onSubmit({ preventDefault: vi.fn() });
    await inviteForm.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).not.toHaveBeenCalled();
    expect(h.invite).not.toHaveBeenCalled();
  });
  it.each(["list", "results", "revoke"] as const)(
    "clears historical reporting and retained handlers on remote delegate %s denial even though catalog was already denied",
    async endpoint => {
      h.catalog.mockRejectedValue({ data: { code: "FORBIDDEN" } });
      await readyDetail();
      const csv = find(
        n => n.type === "button" && text(n).includes("Download CSV")
      );
      const copy = find(n =>
        String(n.props["aria-label"]).startsWith("Copy invitation")
      );
      const revoke = find(n =>
        String(n.props["aria-label"]).startsWith("Revoke invitation")
      );
      h.list.mockRejectedValue({ data: { code: "FORBIDDEN" } });
      h.results.mockRejectedValue({ data: { code: "FORBIDDEN" } });
      if (endpoint === "revoke") {
        h.revoke.mockRejectedValue({ data: { code: "FORBIDDEN" } });
        revoke.props.onClick();
        render();
        const group = find(
          n => n.props["aria-labelledby"] === "recruitment-revoke-title"
        );
        nodes(group)
          .find(n => n.type === "checkbox")
          .props.onCheckedChange(true);
        render();
        find(
          n => n.type === "button" && text(n).includes("Confirm revoke")
        ).props.onClick();
      } else {
        find(
          n =>
            n.type === "button" &&
            text(n) === (endpoint === "list" ? "Refresh" : "Refresh results")
        ).props.onClick();
      }
      await settle();
      csv.props.onClick();
      copy.props.onClick();
      revoke.props.onClick();
      render();
      expect(text(tree)).toContain("could not be verified");
      expect(text(tree)).not.toContain(assessment.title);
      expect(text(tree)).not.toContain(result.candidateEmail);
      expect(text(tree)).not.toContain(result.candidateName);
      expect(text(tree)).not.toContain("Download CSV");
      expect(text(tree)).not.toContain("I confirm");
      expect(h.download).not.toHaveBeenCalled();
      expect(h.fetchResults).not.toHaveBeenCalled();
      expect(h.clipboard).not.toHaveBeenCalled();
      expect(h.revoke).toHaveBeenCalledTimes(endpoint === "revoke" ? 1 : 0);
      expect(h.client.getQueryData(key("catalog", { orgId }))).toBeUndefined();
      expect(h.client.getQueryData(key("list", { orgId }))).toBeUndefined();
      expect(
        h.client.getQueryData(key("results", { orgId, assessmentId }))
      ).toBeUndefined();
    }
  );
  it("reads the exact submitted org and assessment on every CSV click and exports only the fresh returned snapshot", async () => {
    await readyDetail();
    const pending = deferred();
    h.results.mockReturnValueOnce(pending.promise);
    const csv = find(
      n => n.type === "button" && text(n).includes("Download CSV")
    );
    csv.props.onClick();
    csv.props.onClick();
    await settle();
    expect(h.cancelResults).toHaveBeenCalledOnce();
    expect(h.cancelResults).toHaveBeenCalledWith({
      orgId,
      assessmentId,
    });
    expect(h.fetchResults).toHaveBeenCalledOnce();
    expect(h.fetchResults).toHaveBeenCalledWith(
      { orgId, assessmentId },
      { staleTime: 0, retry: false }
    );
    expect(h.results).toHaveBeenCalledTimes(2);
    expect(h.results.mock.calls[1]).toEqual([{ orgId, assessmentId }]);
    expect(h.download).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    // Real QueryObserver sees the utility fetch. The table is unmounted while
    // the detail's same-epoch callback remains alive to complete the download.
    expect(text(tree)).toContain("Loading assessment results");
    expect(text(tree)).not.toContain("Download CSV");
    csv.props.onClick();
    expect(h.fetchResults).toHaveBeenCalledTimes(1);
    pending.resolve({
      assessment: { ...assessment, title: "Fresh server title" },
      results: [{ ...result, candidateEmail: "fresh@example.test" }],
    });
    await settle();
    expect(h.download).toHaveBeenCalledOnce();
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const content = await blob.text();
    expect(content).toContain("Fresh server title");
    expect(content).toContain("fresh@example.test");
    expect(content).not.toContain(assessment.title);
    expect(content).not.toContain(result.candidateEmail);
    expect(h.download.mock.instances[0].download).toBe(
      `recruitment-results-${assessmentId}.csv`
    );
    find(
      n => n.type === "button" && text(n).includes("Download CSV")
    ).props.onClick();
    await settle();
    expect(h.results).toHaveBeenCalledTimes(3);
    expect(h.results.mock.calls[2]).toEqual([{ orgId, assessmentId }]);
    expect(h.download).toHaveBeenCalledTimes(2);
  });
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "clears already visible private data on remote CSV %s without creating a blob",
    async code => {
      await readyDetail();
      input("recruitment-title", "Private manager draft");
      expect(text(tree)).toContain(result.candidateEmail);
      const pending = deferred();
      h.results.mockReturnValueOnce(pending.promise);
      find(
        n => n.type === "button" && text(n).includes("Download CSV")
      ).props.onClick();
      await settle();
      h.catalog.mockRejectedValue({ data: { code } });
      h.list.mockRejectedValue({ data: { code } });
      pending.reject({ data: { code } });
      await settle();
      expect(h.fetchResults).toHaveBeenCalledOnce();
      expect(h.download).not.toHaveBeenCalled();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(text(tree)).toContain("could not be verified");
      expect(text(tree)).not.toContain(result.candidateEmail);
      expect(text(tree)).not.toContain(result.candidateName);
      expect(text(tree)).not.toContain(assessment.title);
      expect(text(tree)).not.toContain("Private manager draft");
      expect(text(tree)).not.toContain("Download CSV");
      expect(
        h.client.getQueryData(key("results", { orgId, assessmentId }))
      ).toBeUndefined();
      expect(h.client.getQueryData(key("catalog", { orgId }))).toBeUndefined();
      expect(h.client.getQueryData(key("list", { orgId }))).toBeUndefined();
    }
  );
  it("does not fall back to cached results when the CSV server read fails", async () => {
    await readyDetail();
    h.results.mockRejectedValueOnce(new Error("Synthetic network failure"));
    find(
      n => n.type === "button" && text(n).includes("Download CSV")
    ).props.onClick();
    await settle();
    expect(h.results).toHaveBeenCalledTimes(2);
    expect(text(tree)).toContain("Synthetic network failure");
    expect(text(tree)).not.toContain(result.candidateEmail);
    expect(h.download).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("refuses to download a fresh response for a different assessment", async () => {
    await readyDetail();
    h.results.mockResolvedValueOnce({
      assessment: {
        ...assessment,
        id: "33333333-3333-4333-8333-333333333333",
      },
      results: [result],
    });
    find(
      n => n.type === "button" && text(n).includes("Download CSV")
    ).props.onClick();
    await settle();
    expect(text(tree)).toContain("The returned assessment did not match");
    expect(h.download).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("does not start a CSV server read after session reset while cancellation is pending", async () => {
    await readyDetail();
    const cancelling = deferred();
    h.cancelResults.mockReturnValueOnce(cancelling.promise);
    find(
      n => n.type === "button" && text(n).includes("Download CSV")
    ).props.onClick();
    dispatch("storage");
    render();
    cancelling.resolve(undefined);
    await settle();
    expect(h.fetchResults).not.toHaveBeenCalled();
    expect(h.download).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("cancels an older results read instead of joining it for CSV authorization", async () => {
    await readyDetail();
    const csv = find(
      n => n.type === "button" && text(n).includes("Download CSV")
    );
    const old = deferred();
    h.results.mockReturnValueOnce(old.promise);
    const priorRead = h
      .fetchResults({ orgId, assessmentId }, { staleTime: 0, retry: false })
      .catch(() => undefined);
    const fresh = {
      assessment,
      results: [{ ...result, candidateEmail: "post-click@example.test" }],
    };
    h.results.mockResolvedValueOnce(fresh);
    csv.props.onClick();
    await settle();
    await priorRead;
    old.resolve({ assessment, results: [result] });
    await settle();
    expect(h.results).toHaveBeenCalledTimes(3);
    expect(h.download).toHaveBeenCalledOnce();
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(await blob.text()).toContain("post-click@example.test");
    expect(await blob.text()).not.toContain(result.candidateEmail);
    expect(
      h.client.getQueryData(key("results", { orgId, assessmentId }))
    ).toEqual(fresh);
  });
  it.each(["focus", "auth-cache", "unmount"])(
    "discards a pending CSV completion after %s without a blob or restored private cache",
    async mode => {
      await readyDetail();
      const pending = deferred();
      h.results.mockReturnValueOnce(pending.promise);
      find(
        n => n.type === "button" && text(n).includes("Download CSV")
      ).props.onClick();
      await settle();
      expect(h.fetchResults).toHaveBeenCalledOnce();
      if (mode === "unmount") panelMounted = false;
      else if (mode === "auth-cache")
        h.client.setQueryData([["dashboardAuth", "me"], { type: "query" }], {
          email: "replacement-manager@example.test",
        });
      else dispatch(mode);
      render();
      pending.resolve({ assessment, results: [result] });
      await settle();
      expect(h.download).not.toHaveBeenCalled();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(text(tree)).not.toContain(result.candidateEmail);
      expect(text(tree)).not.toContain("Download CSV");
      expect(
        h.client.getQueryData(key("results", { orgId, assessmentId }))
      ).toBeUndefined();
    }
  );
  it.each(["focus", "visibilitychange", "storage"])(
    "clears private state on %s and retained CSV/copy/revoke handlers fail closed",
    async event => {
      await readyDetail();
      input("recruitment-title", "Old session draft");
      input("recruitment-candidate", "31");
      const csv = find(
        n => n.type === "button" && text(n).includes("Download CSV")
      );
      const copy = find(n =>
        String(n.props["aria-label"]).startsWith("Copy invitation")
      );
      const revoke = find(n =>
        String(n.props["aria-label"]).startsWith("Revoke invitation")
      );
      const pending = deferred();
      h.catalog.mockReturnValue(pending.promise);
      h.list.mockReturnValue(pending.promise);
      dispatch(event);
      csv.props.onClick();
      copy.props.onClick();
      revoke.props.onClick();
      render();
      expect(h.download).not.toHaveBeenCalled();
      expect(h.clipboard).not.toHaveBeenCalled();
      expect(h.revoke).not.toHaveBeenCalled();
      expect(text(tree)).not.toContain(result.candidateEmail);
      expect(text(tree)).not.toContain("Old session draft");
      expect(text(tree)).not.toContain("Download CSV");
      pending.reject({ data: { code: "UNAUTHORIZED" } });
      await settle();
      expect(text(tree)).toContain("could not be verified");
    }
  );
  it("evicts only current-org manager queries and resets when session-auth cache changes", async () => {
    await readyDetail();
    const unrelated = [
      key("candidateGet", { assignmentId: result.assignmentId }),
      key("catalog", { orgId: 8 }),
      key("results", { orgId: 8, assessmentId }),
      [["learning", "history"], { input: { orgId }, type: "query" }],
    ];
    unrelated.forEach(k => h.client.setQueryData(k, "retained"));
    h.client.setQueryData([["dashboardAuth", "me"], { type: "query" }], {
      email: "new-manager@example.test",
    });
    expect(
      h.client.getQueryData(key("results", { orgId, assessmentId }))
    ).toBeUndefined();
    unrelated.forEach(k => expect(h.client.getQueryData(k)).toBe("retained"));
    render();
    expect(text(tree)).not.toContain("Download CSV");
    await settle();
    expect(text(tree)).toContain("Select an assessment");
    expect(find(n => n.props.id === "recruitment-title").props.value).toBe("");
  });
  it("does not restore old-session in-flight result reads", async () => {
    const old = deferred();
    h.results.mockReturnValue(old.promise);
    render();
    await settle();
    find(
      n => n.type === "button" && text(n).includes(assessment.title)
    ).props.onClick();
    render();
    dispatch("focus");
    render();
    old.resolve({ assessment, results: [result] });
    await settle();
    expect(text(tree)).not.toContain(result.candidateEmail);
    expect(text(tree)).not.toContain("Download CSV");
    expect(
      h.client.getQueryData(key("results", { orgId, assessmentId }))
    ).toBeUndefined();
  });
  it("does not let an old-session invite publish links or invalidate the new-session cache", async () => {
    await readyDetail();
    input("recruitment-candidate", "31");
    const old = deferred();
    h.invite.mockReturnValue(old.promise);
    const form = find(
      n => n.type === "form" && text(n).includes("Create invitation link")
    );
    const action = form.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.invite).toHaveBeenCalledOnce();
    dispatch("storage");
    render();
    old.resolve({ assignmentId: result.assignmentId });
    await action;
    await settle();
    expect(h.clipboard).not.toHaveBeenCalled();
    expect(h.invalidates).not.toHaveBeenCalled();
    expect(text(tree)).not.toContain("Candidate invitation link");
    expect(text(tree)).not.toContain(result.candidateEmail);
  });
  it.each(["allowed", "denied"])(
    "preserves the %s clipboard outcome through actual same-epoch query refetch and clears it on session reset",
    async mode => {
      await readyDetail();
      input("recruitment-candidate", "31");
      if (mode === "denied")
        h.clipboard.mockRejectedValue(new Error("Synthetic clipboard denial"));
      const refresh = deferred();
      h.catalog.mockReturnValue(refresh.promise);
      h.invalidates.mockImplementation((scope: any) => {
        const names = scope.assessmentId ? ["results"] : ["catalog", "list"];
        for (const name of names) {
          const input =
            name === "results" ? { orgId, assessmentId } : { orgId };
          const queryKey = key(name, input);
          void h.client.invalidateQueries({ queryKey, refetchType: "none" });
          void h.client
            .fetchQuery({
              queryKey,
              queryFn: () => h[name as "catalog" | "list" | "results"](input),
              staleTime: 0,
            })
            .catch(() => undefined);
        }
      });
      await find(
        n => n.type === "form" && text(n).includes("Create invitation link")
      ).props.onSubmit({ preventDefault: vi.fn() });
      render();
      expect(text(tree)).not.toContain("Candidate invitation link");
      refresh.resolve(catalog);
      await settle();
      expect(find(n => n.props.id === "recruitment-link").props.value).toBe(
        `https://synthetic.example.test/recruitment/${result.assignmentId}`
      );
      expect(text(tree)).toContain(
        mode === "denied"
          ? "Clipboard access was unavailable. Select and copy the link below."
          : "Link copied. Share it directly with the invited candidate."
      );
      dispatch("focus");
      render();
      await settle();
      expect(text(tree)).not.toContain("Candidate invitation link");
      expect(text(tree)).not.toContain("Link copied.");
      expect(text(tree)).not.toContain("Clipboard access was unavailable.");
    }
  );
  it("does not authorize a pending mount from manual private cache writes", async () => {
    const pending = deferred();
    h.catalog.mockReturnValue(pending.promise);
    h.list.mockReturnValue(pending.promise);
    render();
    h.client.setQueryData(key("catalog", { orgId }), catalog);
    h.client.setQueryData(key("list", { orgId }), [assessment]);
    render();
    expect(text(tree)).not.toContain("Create an assessment");
    expect(text(tree)).not.toContain(assessment.title);
    pending.reject({ data: { code: "FORBIDDEN" } });
    await settle();
  });
  it("ignores an old-session create completion without selecting or invalidating its assessment", async () => {
    render();
    await settle();
    input("recruitment-title", "Synthetic new assessment");
    input("recruitment-course", "class2-water");
    find(n => n.props.id === "recruitment-specific-topics").props.onCheckedChange(true);
    render();
    nodes(find(n => n.props.id === "recruitment-topic-options"))
      .find(n => n.type === "checkbox").props.onCheckedChange(true);
    render();
    const old = deferred();
    h.create.mockReturnValue(old.promise);
    const form = find(
      n => n.type === "form" && text(n).includes("Create assessment")
    );
    const action = form.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).toHaveBeenCalledOnce();
    dispatch("focus");
    render();
    old.resolve({ assessmentId });
    await action;
    await settle();
    expect(h.invalidates).not.toHaveBeenCalled();
    expect(text(tree)).not.toContain("Assessment created.");
    expect(text(tree)).not.toContain("Download CSV");
    expect(find(n => n.props.id === "recruitment-title").props.value).toBe("");
  });
  it("ignores old-session revoke completion and discards its confirmation", async () => {
    await readyDetail();
    find(n =>
      String(n.props["aria-label"]).startsWith("Revoke invitation")
    ).props.onClick();
    render();
    const group = find(
      n => n.props["aria-labelledby"] === "recruitment-revoke-title"
    );
    nodes(group)
      .find(n => n.type === "checkbox")
      .props.onCheckedChange(true);
    render();
    const old = deferred();
    h.revoke.mockReturnValue(old.promise);
    const action = find(
      n => n.type === "button" && text(n).includes("Confirm revoke")
    ).props.onClick();
    expect(h.revoke).toHaveBeenCalledOnce();
    dispatch("visibilitychange");
    render();
    old.resolve({ success: true });
    await action;
    await settle();
    expect(h.invalidates).not.toHaveBeenCalled();
    expect(text(tree)).not.toContain("Invitation revoked.");
    expect(text(tree)).not.toContain("I confirm");
    expect(text(tree)).not.toContain(result.candidateEmail);
  });
});


function difficultyText(node: any) {
  return text(node).replace(/\s+/g, " ").trim();
}
// Difficulty-first form interactions use the same actual component/query-cache
// harness as the privacy regressions above. All writes stay synthetic.
const difficultyCatalog = {
  ...catalog,
  orgName: "Synthetic organization",
  courses: [{
    courseKey: "class2-water",
    label: "Class 2 Water",
    difficultyCounts: { mixed: 30, medium: 14, hard: 8 },
    unlabelledCount: 3,
    modules: [
      { name: "Treatment", count: 18, difficultyCounts: { mixed: 18, medium: 10, hard: 0 } },
      { name: "Safety", count: 12, difficultyCounts: { mixed: 12, medium: 4, hard: 8 } },
      { name: "Empty", count: 0, difficultyCounts: { mixed: 0, medium: 0, hard: 0 } },
    ],
  }],
};
async function readyDifficultyForm(data: unknown = difficultyCatalog) {
  h.catalog.mockResolvedValue(data);
  render();
  await settle();
  input("recruitment-title", "Synthetic difficulty assessment");
  input("recruitment-course", "class2-water");
  input("recruitment-count", "5");
}
function chooseMode(mode: string) {
  const radio = find(n => n.props.id === `recruitment-difficulty-${mode}`);
  expect(radio.props.disabled).toBe(false);
  radio.props.onChange();
  render();
}
function narrowTopics(value: boolean) {
  find(n => n.props.id === "recruitment-specific-topics").props.onCheckedChange(value);
  render();
}
function topicCheckbox(name: string) {
  const options = find(n => n.props.id === "recruitment-topic-options");
  const label = nodes(options).find(n => n.type === "label" && difficultyText(n).startsWith(name));
  if (!label) throw new Error(`Missing topic ${name}`);
  return nodes(label).find(n => n.type === "checkbox");
}
async function submitDifficultyForm() {
  await find(n => n.type === "form" && difficultyText(n).includes("Create assessment"))
    .props.onSubmit({ preventDefault: vi.fn() });
  await settle();
}

describe("difficulty-first recruitment creation (Node, synthetic transport)", () => {
  it("defaults to accessible Mixed radios after course, automatic topics, truthful counts and unlabelled disclosure", async () => {
    await readyDifficultyForm();
    const radios = nodes(tree).filter(n => n.props.type === "radio");
    expect(radios.map(n => n.props.value)).toEqual(["mixed", "medium", "hard"]);
    expect(radios.map(n => n.props.checked)).toEqual([true, false, false]);
    expect(new Set(radios.map(n => n.props.name)).size).toBe(1);
    expect(radios.every(n => !!n.props["aria-describedby"])).toBe(true);
    const allNodes = nodes(tree);
    expect(allNodes.indexOf(find(n => n.props.id === "recruitment-course")))
      .toBeLessThan(allNodes.indexOf(radios[0]));
    expect(allNodes.indexOf(radios[2]))
      .toBeLessThan(allNodes.indexOf(find(n => n.props.id === "recruitment-specific-topics")));
    expect(find(n => n.props.id === "recruitment-specific-topics").props.checked).toBe(false);
    expect(nodes(tree).some(n => n.props.id === "recruitment-topic-options")).toBe(false);
    expect(difficultyText(tree)).toContain("30 available");
    expect(difficultyText(tree)).toContain("14 available");
    expect(difficultyText(tree)).toContain("8 available");
    expect(difficultyText(tree)).toContain("including 3 unlabelled questions");
    expect(difficultyText(tree)).toContain("Automatic topic coverage · 30 matching questions available");
  });

  it.each(["mixed", "medium", "hard"])("submits %s with no topic narrowing and does not require all automatic topics", async mode => {
    await readyDifficultyForm();
    chooseMode(mode);
    await submitDifficultyForm();
    expect(h.create).toHaveBeenCalledOnce();
    expect(h.create).toHaveBeenCalledWith({
      orgId,
      title: "Synthetic difficulty assessment",
      courseKey: "class2-water",
      difficultyMode: mode,
      modules: [],
      questionCount: 5,
      timeLimitMinutes: null,
      expiresInDays: 7,
    });
  });

  it("requires at least one topic when narrowing is on and submits the explicit selected topic", async () => {
    await readyDifficultyForm();
    chooseMode("medium");
    narrowTopics(true);
    await submitDifficultyForm();
    expect(h.create).not.toHaveBeenCalled();
    expect(difficultyText(tree)).toContain("Choose at least one specific topic");
    topicCheckbox("Treatment").props.onCheckedChange(true);
    render();
    expect(difficultyText(tree)).toContain("1 topics selected · 10 matching questions available");
    await submitDifficultyForm();
    expect(h.create).toHaveBeenCalledOnce();
    expect(h.create.mock.calls[0][0]).toMatchObject({ difficultyMode: "medium", modules: ["Treatment"] });
  });

  it("retains zero-match selected topics after a mode change, marks invalid, and permits unchecking without fallback", async () => {
    await readyDifficultyForm();
    narrowTopics(true);
    topicCheckbox("Treatment").props.onCheckedChange(true);
    render();
    chooseMode("hard");
    const retained = topicCheckbox("Treatment");
    expect(retained.props.checked).toBe(true);
    expect(retained.props.disabled).toBe(false);
    expect(retained.props["aria-invalid"]).toBe(true);
    expect(topicCheckbox("Empty").props.disabled).toBe(true);
    expect(difficultyText(tree)).toContain("No matching questions. Uncheck or change difficulty.");
    expect(difficultyText(tree)).toContain("1 topics selected · 0 matching questions available");
    await submitDifficultyForm();
    expect(h.create).not.toHaveBeenCalled();
    retained.props.onCheckedChange(false);
    render();
    expect(topicCheckbox("Treatment").props.disabled).toBe(true);
    topicCheckbox("Safety").props.onCheckedChange(true);
    render();
    expect(difficultyText(tree)).toContain("1 topics selected · 8 matching questions available");
    await submitDifficultyForm();
    expect(h.create.mock.calls[0][0]).toMatchObject({ difficultyMode: "hard", modules: ["Safety"] });
  });

  it("turning narrowing off submits [] even with retained draft topics", async () => {
    await readyDifficultyForm();
    narrowTopics(true);
    topicCheckbox("Treatment").props.onCheckedChange(true);
    render();
    chooseMode("hard");
    narrowTopics(false);
    expect(difficultyText(tree)).toContain("Automatic topic coverage · 8 matching questions available");
    await submitDifficultyForm();
    expect(h.create.mock.calls[0][0]).toMatchObject({ difficultyMode: "hard", modules: [] });
  });

  it("course changes reset Mixed and clear topic narrowing and selected topics", async () => {
    await readyDifficultyForm({
      ...difficultyCatalog,
      courses: [...difficultyCatalog.courses, {
        ...difficultyCatalog.courses[0], courseKey: "second-course", label: "Second course",
      }],
    });
    narrowTopics(true);
    topicCheckbox("Safety").props.onCheckedChange(true);
    render();
    chooseMode("hard");
    input("recruitment-course", "second-course");
    expect(find(n => n.props.id === "recruitment-difficulty-mixed").props.checked).toBe(true);
    expect(find(n => n.props.id === "recruitment-specific-topics").props.checked).toBe(false);
    narrowTopics(true);
    expect(topicCheckbox("Safety").props.checked).toBe(false);
  });

  it("legacy catalog counts support Mixed but do not invent Medium/Hard availability", async () => {
    await readyDifficultyForm(catalog);
    expect(find(n => n.props.id === "recruitment-difficulty-mixed").props.disabled).toBe(false);
    for (const mode of ["medium", "hard"]) {
      expect(find(n => n.props.id === `recruitment-difficulty-${mode}`).props.disabled).toBe(true);
      const label = nodes(tree).find(n => n.type === "label" && nodes(n).some(child => child.props.id === `recruitment-difficulty-${mode}`));
      expect(difficultyText(label)).toContain("0 available");
    }
    expect(difficultyText(tree)).toContain("the unlabelled count is not available in this catalog");
    narrowTopics(true);
    topicCheckbox("Treatment").props.onCheckedChange(true);
    render();
    expect(difficultyText(tree)).toContain("1 topics selected · 30 matching questions available");
    await submitDifficultyForm();
    expect(h.create.mock.calls[0][0]).toMatchObject({ difficultyMode: "mixed", modules: ["Treatment"] });
  });

  it("all-unlabelled banks work only in Mixed with an honest notice", async () => {
    await readyDifficultyForm({
      ...difficultyCatalog,
      courses: [{
        ...difficultyCatalog.courses[0],
        difficultyCounts: { mixed: 30, medium: 0, hard: 0 },
        unlabelledCount: 30,
        modules: [{ name: "Treatment", count: 30, difficultyCounts: { mixed: 30, medium: 0, hard: 0 } }],
      }],
    });
    expect(difficultyText(tree)).toContain("including 30 unlabelled questions");
    expect(find(n => n.props.id === "recruitment-difficulty-medium").props.disabled).toBe(true);
    expect(find(n => n.props.id === "recruitment-difficulty-hard").props.disabled).toBe(true);
    await submitDifficultyForm();
    expect(h.create.mock.calls[0][0].difficultyMode).toBe("mixed");
  });

  it("keeps an unavailable selected mode after fresh catalog replacement and rejects creation rather than downgrading", async () => {
    await readyDifficultyForm();
    chooseMode("hard");
    const oldForm = find(n => n.type === "form" && difficultyText(n).includes("Create assessment"));
    const replacement = {
      ...difficultyCatalog,
      courses: [{ ...difficultyCatalog.courses[0], difficultyCounts: { mixed: 30, medium: 14, hard: 4 } }],
    };
    await h.client.fetchQuery({
      queryKey: key("catalog", { orgId }), queryFn: async () => replacement, staleTime: 0, retry: false,
    });
    // A retained handler must not create against its previous exact catalog.
    await oldForm.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).not.toHaveBeenCalled();
    await settle();
    const hard = find(n => n.props.id === "recruitment-difficulty-hard");
    expect(hard.props.checked).toBe(true);
    expect(hard.props.disabled).toBe(true);
    expect(hard.props["aria-invalid"]).toBe(true);
    expect(difficultyText(tree)).toContain("Your selection has been kept; choose another mode");
    await submitDifficultyForm();
    expect(h.create).not.toHaveBeenCalled();
  });

  it.each(["mixed", "medium", "hard"])("keeps a removed selected topic visible and removable after fresh catalog replacement in %s", async mode => {
    await readyDifficultyForm();
    chooseMode(mode);
    narrowTopics(true);
    topicCheckbox("Safety").props.onCheckedChange(true);
    render();
    const oldForm = find(n => n.type === "form" && difficultyText(n).includes("Create assessment"));
    const replacement = {
      ...difficultyCatalog,
      courses: [{
        ...difficultyCatalog.courses[0],
        difficultyCounts: { mixed: 18, medium: 10, hard: 0 },
        modules: [difficultyCatalog.courses[0].modules[0]],
      }],
    };
    await h.client.fetchQuery({
      queryKey: key("catalog", { orgId }), queryFn: async () => replacement, staleTime: 0, retry: false,
    });
    await oldForm.props.onSubmit({ preventDefault: vi.fn() });
    expect(h.create).not.toHaveBeenCalled();
    await settle();
    await submitDifficultyForm();
    expect(h.create).not.toHaveBeenCalled();
    expect(find(n => n.props.id === `recruitment-difficulty-${mode}`).props.checked).toBe(true);
    const removed = topicCheckbox("Safety");
    expect(removed.props.checked).toBe(true);
    expect(removed.props.disabled).toBe(false);
    expect(removed.props["aria-invalid"]).toBe(true);
    narrowTopics(false);
    narrowTopics(true);
    expect(topicCheckbox("Safety").props.checked).toBe(true);
    topicCheckbox("Safety").props.onCheckedChange(false);
    render();
    expect(nodes(tree).some(n => n.type === "label" && difficultyText(n).startsWith("Safety"))).toBe(false);
    chooseMode("mixed");
    topicCheckbox("Treatment").props.onCheckedChange(true);
    render();
    await submitDifficultyForm();
    expect(h.create).toHaveBeenCalledOnce();
    expect(h.create.mock.calls[0][0]).toMatchObject({ difficultyMode: "mixed", modules: ["Treatment"] });
  });

  it("rejects a question count above the mode pool without easier replacements", async () => {
    await readyDifficultyForm();
    chooseMode("hard");
    input("recruitment-count", "9");
    await submitDifficultyForm();
    expect(h.create).not.toHaveBeenCalled();
    expect(difficultyText(tree)).toContain("Only 8 matching questions are available in this course");
  });

  it.each([
    ["mixed", "Mixed"], ["medium", "Medium"], ["hard", "Hard"],
    [null, "Not recorded"], [undefined, "Not recorded"],
  ])("list, detail, results and fresh CSV share stored difficulty %s", async (mode, label) => {
    const saved = { ...assessment, difficultyMode: mode };
    h.list.mockResolvedValue([saved]);
    h.results.mockResolvedValue({ assessment: saved, results: [result] });
    await readyDetail();
    const labels = nodes(tree).filter(n => (n.type === "p" || n.type === "span") && difficultyText(n) === `Difficulty: ${label}`);
    expect(labels).toHaveLength(3);
    expect(difficultyText(tree)).toContain("Scores across different difficulty modes are not equivalent");
    find(n => n.type === "button" && difficultyText(n).includes("Download CSV")).props.onClick();
    await settle();
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const csv = await blob.text();
    expect(csv.split("\r\n")[0]).toContain('"Assessment","Course","Difficulty"');
    expect(csv).toContain(`"${label}"`);
    if (mode == null) expect(csv).not.toContain('"Mixed"');
  });
});

describe("difficulty-first recruitment count boundaries", () => {
  it("automatic coverage allows fewer questions than matching topics", async () => {
    await readyDifficultyForm({
      ...difficultyCatalog,
      courses: [{
        ...difficultyCatalog.courses[0],
        difficultyCounts: { mixed: 8, medium: 8, hard: 8 },
        unlabelledCount: 0,
        modules: Array.from({ length: 8 }, (_, index) => ({
          name: `Topic ${index + 1}`, count: 1,
          difficultyCounts: { mixed: 1, medium: 1, hard: 1 },
        })),
      }],
    });
    chooseMode("hard");
    await submitDifficultyForm();
    expect(h.create).toHaveBeenCalledOnce();
    expect(h.create.mock.calls[0][0]).toMatchObject({ modules: [], questionCount: 5, difficultyMode: "hard" });
  });
  it("explicit topic coverage still requires at least one question per selected topic", async () => {
    await readyDifficultyForm({
      ...difficultyCatalog,
      courses: [{
        ...difficultyCatalog.courses[0],
        difficultyCounts: { mixed: 12, medium: 12, hard: 12 },
        modules: Array.from({ length: 6 }, (_, index) => ({
          name: `Topic ${index + 1}`, count: 2,
          difficultyCounts: { mixed: 2, medium: 2, hard: 2 },
        })),
      }],
    });
    chooseMode("medium");
    narrowTopics(true);
    for (let index = 1; index <= 6; index++) {
      topicCheckbox(`Topic ${index}`).props.onCheckedChange(true);
      render();
    }
    await submitDifficultyForm();
    expect(h.create).not.toHaveBeenCalled();
    expect(difficultyText(tree)).toContain("Use at least one question per selected topic");
  });
  it("disables a mode below five matching questions even when Mixed has sufficient questions", async () => {
    await readyDifficultyForm({
      ...difficultyCatalog,
      courses: [{ ...difficultyCatalog.courses[0], difficultyCounts: { mixed: 30, medium: 4, hard: 5 } }],
    });
    expect(find(n => n.props.id === "recruitment-difficulty-medium").props.disabled).toBe(true);
    expect(find(n => n.props.id === "recruitment-difficulty-hard").props.disabled).toBe(false);
  });
});
