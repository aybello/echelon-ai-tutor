import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentActivityCapability } from "@shared/assessmentActivity";
import { assessmentActivityOutboxKey, loadAssessmentActivityOutbox, saveAssessmentActivityOutbox, type AssessmentActivityOutbox, type AssessmentActivityStorage } from "@/lib/assessmentActivityOutbox";

// Minimal deterministic hook dispatcher: executes the real hook, effects, callbacks and
// async RPC continuations in Node. No DOM/browser/provider or source-text assertions.
const h = vi.hoisted(() => ({
  slots: [] as any[], cursor: 0, effects: [] as (() => void)[],
  record: vi.fn(), resume: vi.fn(), allowed: true,
}));
vi.mock("react", () => {
  const changed = (a: unknown[], b: unknown[]) => !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  return {
    useRef: (value: unknown) => { const i = h.cursor++; return h.slots[i] ??= { current: value }; },
    useState: (value: unknown) => {
      const i = h.cursor++; h.slots[i] ??= { value };
      return [h.slots[i].value, (next: unknown) => { h.slots[i].value = next; }];
    },
    useCallback: (fn: unknown, deps: unknown[]) => {
      const i = h.cursor++;
      if (!h.slots[i] || changed(h.slots[i].deps, deps)) h.slots[i] = { fn, deps };
      return h.slots[i].fn;
    },
    useEffect: (fn: () => (() => void) | void, deps: unknown[]) => {
      const i = h.cursor++;
      if (!h.slots[i] || changed(h.slots[i].deps, deps)) {
        const old = h.slots[i]; h.slots[i] = { deps };
        h.effects.push(() => { old?.cleanup?.(); h.slots[i].cleanup = fn(); });
      }
    },
  };
});
vi.mock("@/lib/trpc", () => ({ trpc: { assessmentActivity: {
  record: { useMutation: () => ({ mutateAsync: h.record }) },
  resume: { useMutation: () => ({ mutateAsync: h.resume }) },
} } }));
vi.mock("@/lib/learnerActivityPreference", () => ({ learnerActivityPreference: () => h.allowed ? "allowed" : "denied" }));
import { useAssessmentActivity } from "./useAssessmentActivity";
const cap = (n: number): AssessmentActivityCapability => ({ tracking: true, sessionId: `550e8400-e29b-41d4-a716-${String(n).padStart(12, "0")}`, capability: `cap-${n}`, nextSequence: 2, expiresAt: "2027-01-01T00:00:00.000Z", source: "observed" });
const event = { eventId: "550e8400-e29b-41d4-a716-111111111111", action: "answer_submitted" as const, itemId: "original-item", chosenAnswer: "2" };
const box = (n: number, actorKey = "user:7"): AssessmentActivityOutbox => ({ version: 1, actorKey, capability: cap(n), queue: [{ ...event }] });
let store: AssessmentActivityStorage;
let online: (() => void) | undefined;
function render(tracking: AssessmentActivityCapability | null, actor = "user:7") {
  h.cursor = 0;
  const result = useAssessmentActivity(tracking, actor);
  for (const effect of h.effects.splice(0)) effect();
  return result;
}
async function settle() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
beforeEach(() => {
  h.slots = []; h.effects = []; h.cursor = 0; h.allowed = true;
  h.record.mockReset(); h.resume.mockReset();
  const values = new Map<string, string>();
  store = { get length() { return values.size; }, key: i => [...values.keys()][i] ?? null, getItem: k => values.get(k) ?? null, setItem: (k, v) => { values.set(k, v); }, removeItem: k => { values.delete(k); } };
  online = undefined;
  vi.stubGlobal("window", { sessionStorage: store, addEventListener: (_: string, callback: () => void) => { online = callback; }, removeEventListener: () => {} });
  h.resume.mockImplementation(async ({ capability }) => ({ ...cap(Number(capability.split("-")[1])), status: "active" }));
  h.record.mockResolvedValue({ tracking: true, recorded: true, nextSequence: 3 });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("assessment activity recovery hook", () => {
  it("retries tracking:false resume without dropping the original queue or UUID", async () => {
    const original = box(1); saveAssessmentActivityOutbox(store, original);
    h.resume.mockResolvedValueOnce({ tracking: false });
    let hook = render(cap(1)); await settle();
    expect(h.record).not.toHaveBeenCalled();
    expect(loadAssessmentActivityOutbox(store, original).value?.queue).toEqual(original.queue);
    expect(render(cap(1)).saveError).toBe(true);
    await hook.retry(); await settle();
    expect(h.resume).toHaveBeenCalledTimes(2);
    expect(h.record).toHaveBeenCalledWith({ capability: "cap-1", accessToken: undefined, events: [{ ...event, sequence: 2 }] });
    expect(store.length).toBe(0);
    hook = render(cap(1)); expect(hook.saveError).toBe(false);
  });
  it("drains persisted historical capabilities on mount with no current capability and never another actor", async () => {
    const mine = box(1); const anonymous = box(2, "anonymous"); const other = box(3, "user:8");
    [mine, anonymous, other].forEach(value => saveAssessmentActivityOutbox(store, value));
    render(null); await settle();
    expect(h.resume).toHaveBeenCalledTimes(1); expect(h.resume).toHaveBeenCalledWith({ capability: "cap-1", accessToken: undefined });
    expect(h.record).toHaveBeenCalledTimes(1); expect(h.record).toHaveBeenCalledWith({ capability: "cap-1", accessToken: undefined, events: [{ ...event, sequence: 2 }] });
    expect(loadAssessmentActivityOutbox(store, anonymous).value).toEqual(anonymous);
    expect(loadAssessmentActivityOutbox(store, other).value).toEqual(other);
  });
  it("retries an old capability after replacement and online, without relabelling events", async () => {
    h.record.mockResolvedValue({ tracking: false, recorded: false });
    const old = box(1); saveAssessmentActivityOutbox(store, old);
    render(cap(1)); await settle();
    render(cap(2)); await settle();
    expect(loadAssessmentActivityOutbox(store, old).value?.queue[0]).toEqual({ ...event, sequence: 2 });
    h.record.mockResolvedValue({ tracking: true, recorded: true, nextSequence: 3 });
    online?.(); await settle();
    expect(h.record.mock.calls.at(-1)?.[0]).toEqual({ capability: "cap-1", accessToken: undefined, events: [{ ...event, sequence: 2 }] });
    expect(loadAssessmentActivityOutbox(store, old).value).toBeNull();
  });
  it("finishes an old in-flight worker under its original scope after the current capability becomes null", async () => {
    let finish!: (value: unknown) => void;
    h.record.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const original = box(1); saveAssessmentActivityOutbox(store, original);
    render(cap(1)); await settle();
    render(null); await settle();
    finish({ tracking: true, recorded: true, nextSequence: 3 }); await settle();
    expect(h.record).toHaveBeenCalledTimes(1);
    expect(loadAssessmentActivityOutbox(store, original).value).toBeNull();
  });
  it("clears retired actors and never acknowledges their late response into a new actor", async () => {
    let finish!: (value: unknown) => void;
    h.record.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const old = box(1); saveAssessmentActivityOutbox(store, old);
    render(cap(1)); await settle();
    render(null, "user:8"); await settle();
    expect(loadAssessmentActivityOutbox(store, old).value).toBeNull();
    finish({ tracking: true, recorded: true, nextSequence: 3 }); await settle();
    expect(store.length).toBe(0);
    expect(h.record).toHaveBeenCalledTimes(1);
  });
  it("preference denial clears all actor pending queues even with no current capability", async () => {
    const mine = box(1); const other = box(2, "user:8");
    [mine, other].forEach(value => saveAssessmentActivityOutbox(store, value));
    h.allowed = false; render(null); await settle();
    expect(loadAssessmentActivityOutbox(store, mine).value).toBeNull();
    expect(loadAssessmentActivityOutbox(store, other).value).toEqual(other);
    expect(h.resume).not.toHaveBeenCalled(); expect(h.record).not.toHaveBeenCalled();
  });
  it("fails closed for a corrupt historical queue and permits harmless server-rejected retries", async () => {
    const original = box(1); store.setItem(assessmentActivityOutboxKey(original), "{");
    const hook = render(null); await settle();
    expect(h.record).not.toHaveBeenCalled(); expect(render(null).saveError).toBe(true);
    saveAssessmentActivityOutbox(store, original);
    h.resume.mockResolvedValue({ tracking: false });
    await hook.retry(); await hook.retry();
    expect(h.resume).toHaveBeenCalledTimes(2); expect(h.record).not.toHaveBeenCalled();
    expect(loadAssessmentActivityOutbox(store, original).value).toEqual(original);
  });
});

it("records late real observations in their original capability, never the current lifecycle or a retired actor", async () => {
  let hook = render(cap(1)); await settle();
  hook = render(cap(2)); await settle();
  hook.observeFor(cap(1), { action: "answer_submitted", itemId: "old-page", chosenAnswer: "3" }); await settle();
  expect(h.record).toHaveBeenCalledWith({ capability: "cap-1", accessToken: undefined, events: [expect.objectContaining({ itemId: "old-page", chosenAnswer: "3", sequence: 2 })] });
  expect(h.record.mock.calls.every(([input]) => input.capability === "cap-1")).toBe(true);
  render(null, "user:8"); await settle();
  hook.observeFor(cap(1), { action: "answer_submitted", itemId: "old-page", chosenAnswer: "3" }); await settle();
  expect(h.record).toHaveBeenCalledTimes(1);
});

it("reads fresh signed access tokens per transport request and never persists them", async () => {
  let token = "synthetic-first";
  vi.stubGlobal("localStorage", { getItem: () => token });
  h.resume.mockImplementation(async ({ capability }) => { token = "synthetic-refreshed"; return { ...cap(Number(capability.split("-")[1])), status: "active" }; });
  h.record.mockResolvedValue({ tracking: false, recorded: false });
  const original = box(1); saveAssessmentActivityOutbox(store, original);
  const hook = render(null); await settle();
  expect(h.resume).toHaveBeenCalledWith({ capability: "cap-1", accessToken: "synthetic-first" });
  expect(h.record).toHaveBeenCalledWith({ capability: "cap-1", accessToken: "synthetic-refreshed", events: [{ ...event, sequence: 2 }] });
  expect(store.getItem(assessmentActivityOutboxKey(original))).not.toContain("synthetic");
  token = "synthetic-next-retry"; await hook.retry();
  expect(h.record.mock.calls.at(-1)?.[0].accessToken).toBe("synthetic-next-retry");
});
