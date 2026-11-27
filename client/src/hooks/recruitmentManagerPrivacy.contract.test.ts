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
      slots[i] = { deps };
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
function render() {
  let loops = 0;
  do {
    h.dirty = false;
    h.seen.clear();
    tree = panelMounted
      ? expand(React.createElement(RecruitmentPanel, { orgId }), "root")
      : null;
    for (const [id, frame] of h.frames)
      if (!h.seen.has(id)) {
        frame.slots.forEach((slot: any) => slot?.cleanup?.());
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
    find(
      n =>
        n.type === "checkbox" && typeof n.props.onCheckedChange === "function"
    ).props.onCheckedChange(true);
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
    find(
      n =>
        n.type === "checkbox" && typeof n.props.onCheckedChange === "function"
    ).props.onCheckedChange(true);
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
