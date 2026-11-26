import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const harness = vi.hoisted(() => ({
  cells: [] as any[], cursor: 0, effects: [] as (() => void)[], dirty: false,
  events: [] as any[], pages: [] as any[], saves: [] as ((saved: boolean) => void)[],
  fetch: vi.fn(), log: vi.fn(), observeFor: vi.fn(), freeQuestions: [] as any[],
}));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const memo = (factory: () => any, deps?: any[]) => {
    const i = harness.cursor++, old = harness.cells[i];
    if (!old || !deps || deps.some((value, index) => !Object.is(value, old.deps[index]))) harness.cells[i] = { value: factory(), deps };
    return harness.cells[i].value;
  };
  return { ...actual,
    useState(initial: any) {
      const i = harness.cursor++;
      if (!(i in harness.cells)) harness.cells[i] = typeof initial === "function" ? initial() : initial;
      return [harness.cells[i], (next: any) => { const value = typeof next === "function" ? next(harness.cells[i]) : next; if (!Object.is(value, harness.cells[i])) { harness.cells[i] = value; harness.dirty = true; } }];
    },
    useRef: (value: any) => memo(() => ({ current: value }), []),
    useMemo: memo,
    useCallback: (fn: any, deps: any[]) => memo(() => fn, deps),
    useEffect(fn: () => any, deps?: any[]) {
      const i = harness.cursor++, old = harness.cells[i];
      if (!old || !deps || deps.some((value, index) => !Object.is(value, old.deps?.[index]))) {
        harness.effects.push(() => { old?.cleanup?.(); harness.cells[i].cleanup = fn(); });
        harness.cells[i] = { deps, cleanup: undefined };
      }
    },
  };
});
vi.mock("wouter", () => ({ useSearch: () => "", useLocation: () => ["", vi.fn()], Link: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock("@/components/QuizGate", () => ({ setTrialUnlocked: vi.fn() }));
vi.mock("@/components/PracticeSaveStatus", () => ({ useStablePracticeActorKey: () => "user:7" }));
vi.mock("@/components/QuizModeBar", () => ({ useAttemptLogger: () => harness.log }));
vi.mock("@/hooks/useLearningActivitySession", () => ({ useLearningActivitySession: () => {} }));
vi.mock("@/components/QuizSettingsDrawer", () => ({ DEFAULT_QUIZ_SETTINGS: { sessionSize: 2, difficulty: "all", timedMode: false } }));
vi.mock("@/hooks/useAssessmentActivity", () => ({ useAssessmentActivity: (cap: any) => ({
  observe: (event: any) => harness.events.push({ cap: cap?.capability, ...event }), observeFor: harness.observeFor, retry: vi.fn(), saveError: false, trackingAvailable: !!cap,
}) }));
vi.mock("@/lib/anonymousAnalytics", () => ({ getAnonymousAnalyticsId: () => "anonymous-test" }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  stripe: { checkAccess: { useQuery: () => ({ data: access }) } },
  funnelAnalytics: { track: { useMutation: () => analytics } },
  quiz: { getMissedQuestions: { useQuery: () => ({ data: undefined, refetch: vi.fn() }) } },
  dashboard: { bookmarkedQuestions: { useQuery: () => ({}) }, lowConfidenceQuestions: { useQuery: () => ({}) } },
  useUtils: () => ({ client: { quiz: { getRandomQuestions: { query: harness.fetch } } } }),
} }));
const access = { hasAccess: true };
const analytics = { mutate: vi.fn() };
import { createHistoryEntry, summarizeHistory, useQuizSession } from "./useQuizSession";
const question = { id: 7, module: "Safety", question: "Prompt", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Explanation", difficulty: "easy", isCalc: false, steps: [{ l: "Work", c: "Details" }] };
const cap = (id: string) => ({ tracking: true as const, sessionId: id, capability: id, nextSequence: 2, expiresAt: "2026-11-19T12:00:00Z", source: "observed" as const });
const delivered = (id: number, capability: string) => ({ ...question, id, activityTracking: cap(capability), attemptToken: `receipt-${id}` });
let view: ReturnType<typeof useQuizSession>;
let freeCourse = false;
async function render() {
  for (let pass = 0; pass < 35; pass++) {
    harness.dirty = false; harness.cursor = 0;
    view = useQuizSession({ examType: "class1-water", allQuestions: harness.freeQuestions, freeCourse });
    harness.effects.splice(0).forEach(effect => effect());
    for (let micro = 0; micro < 12; micro++) await Promise.resolve();
    if (!harness.dirty) return;
  }
  throw Error("Hook failed to settle");
}
async function answer(timed = false) {
  view.setSelected(0); await render();
  if (timed) view.handleTimeUp(); else view.handleConfirm();
  await render();
}
const terminals = () => harness.events.filter(event => ["completed", "abandoned"].includes(event.action));
beforeEach(() => {
  harness.cells = []; harness.effects = []; harness.events = []; harness.pages = []; harness.saves = []; harness.freeQuestions = [];
  harness.observeFor.mockReset().mockImplementation((target: any, event: any) => harness.events.push({ cap: target?.capability, ...event }));
  harness.fetch.mockReset().mockImplementation(async () => harness.pages.shift() ?? { questions: [], total: 0, hasMore: false, locked: false });
  harness.log.mockReset().mockImplementation(() => new Promise<boolean>(resolve => harness.saves.push(resolve)));
  vi.stubGlobal("localStorage", { getItem: () => null });
  freeCourse = false;
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("practice activity answer truth", () => {
  it("does not classify an unanswered timeout as an incorrect answer", () => {
    const entry = createHistoryEntry(question, null, 50);
    expect(entry.selectedOption).toBeNull(); expect(entry.correct).toBeUndefined();
    expect(summarizeHistory([entry, createHistoryEntry(question, 0, null)])).toEqual({ correctCount: 1, wrongCount: 0 });
  });
  it("preserves a real timed choice", () => expect(createHistoryEntry(question, 0, null)).toMatchObject({ selectedOption: 0, correct: true }));
});
describe("real practice handlers with asynchronous canonical acknowledgments", () => {
  it.each([false, true])("rechecks final completion after %s timed ACK even after current is gone", async timed => {
    vi.useFakeTimers();
    harness.pages.push({ questions: [delivered(1, "page-a"), delivered(2, "page-a")], total: 2, hasMore: false, locked: false });
    await render(); await answer(timed); harness.saves.shift()!(true); await render();
    view.handleNext(); await render(); await answer(timed);
    view.handleNext(); await render(); expect(view.current).toBeNull(); expect(terminals()).toEqual([]);
    harness.saves.shift()!(true); await render();
    expect(terminals()).toEqual([{ cap: "page-a", action: "completed" }]);
    expect(harness.log).toHaveBeenCalledTimes(2);
  });
  it("routes page completion and Back explanation to original capabilities", async () => {
    harness.pages.push({ questions: [delivered(1, "page-a")], total: 2, hasMore: true, locked: false }, { questions: [delivered(2, "page-b")], total: 2, hasMore: false, locked: false });
    await render(); await answer(); view.handleNext(); await render();
    expect(view.current?.id).toBe(2); expect(terminals()).toEqual([]);
    harness.saves.shift()!(true); await render(); expect(terminals()).toEqual([{ cap: "page-a", action: "completed" }]);
    view.goBack(); await render(); view.setShowSteps(true); await render();
    expect(harness.events.at(-1)).toEqual({ cap: "page-a", action: "explanation_opened", itemId: "1" });
    view.handleNext(); await render(); await answer(); view.handleNext(); await render();
    harness.saves.shift()!(true); await render();
    expect(terminals()).toEqual([{ cap: "page-a", action: "completed" }, { cap: "page-b", action: "completed" }]);
  });
  it("retires an early filtered page only after its original canonical ACK", async () => {
    harness.pages.push({ questions: [delivered(1, "old"), delivered(2, "old")], total: 2, hasMore: false, locked: false });
    await render(); await answer(); view.handleModuleChange("Other"); await render();
    expect(terminals()).toEqual([]); harness.saves.shift()!(true); await render();
    expect(terminals()).toEqual([{ cap: "old", action: "abandoned" }]);
  });
  it("does not fabricate an answer or completion on unanswered timeout", async () => {
    vi.useFakeTimers(); harness.pages.push({ questions: [delivered(1, "timeout")], total: 1, hasMore: false, locked: false });
    await render(); view.handleTimeUp(); await render(); view.handleNext(); await render();
    expect(harness.log).not.toHaveBeenCalled(); expect(view.wrongCount).toBe(0);
    expect(harness.events).toContainEqual({ cap: "timeout", action: "timed_out", itemId: "1" });
    expect(terminals()).toEqual([{ cap: "timeout", action: "abandoned" }]);
  });
  it("adopts a server-delivered capability in the free local branch without issuing fake tracking", async () => {
    freeCourse = true; harness.freeQuestions = [delivered(1, "free-server")];
    await render(); view.initialize(); await render(); await answer();
    expect(harness.events).toContainEqual({ cap: "free-server", action: "answer_submitted", itemId: "1", chosenAnswer: "0", observedCorrect: true });
    expect(harness.fetch).not.toHaveBeenCalled();
  });
});

// Preserve original Quick 10 retry identity coverage alongside hook lifecycle tests.
describe("Quick 10 exact retry input", () => {
  it("retains all original fields and copies caller input", async () => {
    const { retainQuick10Answer } = await import("../pages/Quick10");
    const original = { courseKey: "class1-water", questionId: 7, selectedIndex: 2, sessionId: "original", operationId: "operation", attemptToken: "receipt", accessToken: "token" };
    const pending = retainQuick10Answer(null, original); original.selectedIndex = 3;
    const retry = retainQuick10Answer(pending, { ...original, selectedIndex: 1, operationId: "changed" });
    expect(retry).toBe(pending); expect(retry.selectedIndex).toBe(2); expect(Object.isFrozen(retry)).toBe(true);
  });
});
