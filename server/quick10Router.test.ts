import { beforeEach, describe, expect, it, vi } from "vitest";
import { questionAttempts, questions } from "../drizzle/schema";
import { quick10Router } from "./routers/quick10Router";
import { buildPreviewSample, previewRowsForBank, quizRouter } from "./routers/quizRouter";
import { resolveAccessForRequest } from "./_core/accessService";
import { issuePracticeReceipt, practiceIdentity } from "./practiceQuestionReceipt";
import { resolveLearningIdentity } from "./_core/learningIdentity";
import { resolveAttemptAttribution } from "./teams/attemptAttribution";
import { resolvePrimaryStudyFocus } from "./_core/studyFocus";
import { getDb } from "./db";
import { FREE_TRIAL_LIMIT } from "./_core/access";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/accessService", async importOriginal => ({ ...await importOriginal<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn() }));
vi.mock("./practiceQuestionReceipt", async importOriginal => ({ ...await importOriginal<typeof import("./practiceQuestionReceipt")>(), practiceIdentity: vi.fn(), issuePracticeReceipt: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn() }));
vi.mock("./teams/attemptAttribution", async importOriginal => ({ ...await importOriginal<typeof import("./teams/attemptAttribution")>(), resolveAttemptAttribution: vi.fn() }));
vi.mock("./_core/studyFocus", () => ({ resolvePrimaryStudyFocus: vi.fn() }));
vi.mock("./_core/access", async importOriginal => ({ ...await importOriginal<typeof import("./_core/access")>(), resolveEntitlementsByEmail: vi.fn(async () => ({ unlockedExamTypes: ["class1-water"] })) }));
vi.mock("./routers/quizRouter", async importOriginal => ({ ...await importOriginal<typeof import("./routers/quizRouter")>(), quizRouter: { createCaller: vi.fn() } }));

const MODULES = ["Network", "Hydraulics", "Storage", "Quality"];
/** 60 question rows in four modules, with the secret fields filled in so a leak would show. */
const bankRows = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1, bankKey: "class1-water", questionNum: i + 1, module: MODULES[i % 4], difficulty: "medium",
  question: `Question ${i + 1}?`, options: JSON.stringify(["A", "B", "C", "D"]), correctIndex: 2,
  explanation: `SECRET-EXPLANATION-${i + 1}`, steps: JSON.stringify([{ l: "s", c: "SECRET-STEP" }]), tip: "SECRET-TIP",
  isCalc: "no", topic: `Topic ${i % 4}`, cognitiveLevel: "recall",
}));

/** A tiny stand-in for the database: each table returns the rows it was given. */
function fakeDb(rowsByTable: Map<unknown, unknown[]>) {
  return {
    select: () => ({
      from: (table: unknown) => {
        const chain: Record<string, unknown> = {};
        for (const m of ["where", "orderBy", "limit", "innerJoin", "groupBy"]) chain[m] = () => chain;
        chain.then = (resolve: (v: unknown) => unknown) => resolve(rowsByTable.get(table) ?? []);
        return chain;
      },
    }),
  };
}
const attemptRow = (questionId: number, correct: "yes" | "no", minutesAgo: number) =>
  ({ id: questionId, questionId, correct, createdAt: new Date(Date.now() - minutesAgo * 60_000) });

const caller = () => quick10Router.createCaller({ user: null, studentEmail: "learner@example.com", req: {}, res: {} } as unknown as TrpcContext);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDb).mockResolvedValue(fakeDb(new Map<unknown, unknown[]>([[questions, bankRows], [questionAttempts, []]])) as never);
  vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
  vi.mocked(practiceIdentity).mockResolvedValue({ owner: "owner-1", context: {} } as never);
  vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: null, studentEmail: "learner@example.com" } as never);
  vi.mocked(resolveAttemptAttribution).mockResolvedValue({} as never);
  vi.mocked(issuePracticeReceipt).mockResolvedValue("receipt-token");
  vi.mocked(resolvePrimaryStudyFocus).mockResolvedValue({ courseKey: "class1-water", examType: "class1-water", source: "attempts" } as never);
});

describe("quick10.start", () => {
  it("returns ten questions and never an answer key, explanation, steps or tip", async () => {
    const result = await caller().start({ courseKey: "class1-water" });
    expect(result.questions).toHaveLength(10);
    const text = JSON.stringify(result);
    expect(text).not.toMatch(/correctIndex|explanation|steps|tip|SECRET/i);
    for (const q of result.questions) expect(Object.keys(q).sort()).toEqual(["cognitiveLevel", "difficulty", "id", "isCalc", "module", "options", "question", "topic"]);
  });

  it("puts questions the learner has never attempted first", async () => {
    // Questions 1 to 50 have been answered correctly. Only 51 to 60 are new.
    const attempts = Array.from({ length: 50 }, (_, i) => attemptRow(i + 1, "yes", 100 + i));
    vi.mocked(getDb).mockResolvedValue(fakeDb(new Map<unknown, unknown[]>([[questions, bankRows], [questionAttempts, attempts]])) as never);
    const result = await caller().start({ courseKey: "class1-water" });
    expect(result.questions.map(q => q.id).sort((a, b) => a - b)).toEqual([51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
  });

  it("then adds the questions the learner got wrong most recently", async () => {
    // Only 57 to 60 are new. Of the rest, questions 1 and 2 were wrong long ago; 3 to 8 were wrong recently.
    const attempts = [
      ...Array.from({ length: 56 }, (_, i) => attemptRow(i + 1, "yes", 5000 + i)),
    ].map(a => (a.questionId <= 2 ? { ...a, correct: "no" as const, createdAt: new Date(Date.now() - 100_000 * 60_000) }
      : a.questionId <= 8 ? { ...a, correct: "no" as const, createdAt: new Date(Date.now() - a.questionId * 60_000) } : a));
    vi.mocked(getDb).mockResolvedValue(fakeDb(new Map<unknown, unknown[]>([[questions, bankRows], [questionAttempts, attempts]])) as never);
    const ids = (await caller().start({ courseKey: "class1-water" })).questions.map(q => q.id);
    expect(ids).toEqual(expect.arrayContaining([57, 58, 59, 60]));
    // Six slots remain: the six newest misses (3 to 8), not the two old ones.
    expect(ids).toEqual(expect.arrayContaining([3, 4, 5, 6, 7, 8]));
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(2);
  });

  it("mixes modules in one session", async () => {
    const result = await caller().start({ courseKey: "class1-water" });
    expect(new Set(result.questions.map(q => q.module)).size).toBe(4);
  });

  it("gives a learner without the course only the free preview questions, and says it is locked", async () => {
    vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
    const preview = buildPreviewSample(previewRowsForBank(bankRows, "class1-water"), FREE_TRIAL_LIMIT, "practice", 0);
    const allowed = new Set(preview.map(r => r.questionNum));
    const result = await caller().start({ courseKey: "class1-water" });
    expect(result.locked).toBe(true);
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions.length).toBeLessThanOrEqual(10);
    for (const q of result.questions) expect(allowed.has(q.id)).toBe(true);
    // The receipt is issued as a preview receipt (4th argument true).
    expect(issuePracticeReceipt).toHaveBeenCalledWith("class1-water", expect.any(Array), "owner-1", true, undefined);
  });

  it("a learner who owns the course gets a normal receipt for exactly the questions sent", async () => {
    const result = await caller().start({ courseKey: "class1-water" });
    expect(result.locked).toBe(false);
    expect(issuePracticeReceipt).toHaveBeenCalledWith("class1-water", result.questions.map(q => q.id), "owner-1", false, expect.anything());
    expect(result.attemptToken).toBe("receipt-token");
  });

  it("uses the course studied most recently when none is given", async () => {
    const result = await caller().start();
    expect(resolvePrimaryStudyFocus).toHaveBeenCalled();
    expect(result.courseKey).toBe("class1-water");
  });

  it("asks the learner to choose a course when there is none", async () => {
    vi.mocked(resolvePrimaryStudyFocus).mockResolvedValue({ courseKey: null, examType: null, source: "none" } as never);
    await expect(caller().start()).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses the 309A course, which keeps its own flow", async () => {
    await expect(caller().start({ courseKey: "electrician-309a" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reads the learner's history only for the verified identity, never a typed email", async () => {
    await caller().start({ courseKey: "class1-water" });
    expect(resolveLearningIdentity).toHaveBeenCalledTimes(1);
  });
});

describe("quick10.answer", () => {
  const payload = {
    courseKey: "class1-water", questionId: 5, selectedIndex: 1,
    sessionId: "11111111-1111-4111-8111-111111111111", attemptToken: "receipt-token",
  };
  const logAttempt = vi.fn();
  beforeEach(() => { logAttempt.mockReset(); vi.mocked(quizRouter.createCaller).mockReturnValue({ logAttempt } as never); });

  it("saves through the existing attempt log in quick10 mode, then reveals the answer", async () => {
    logAttempt.mockResolvedValue({ success: true, correct: false });
    vi.mocked(getDb).mockResolvedValue(fakeDb(new Map<unknown, unknown[]>([[questions, [bankRows[4]]]])) as never);
    const result = await caller().answer(payload);
    expect(logAttempt).toHaveBeenCalledWith(expect.objectContaining({
      examType: "class1-water", bankKey: "class1-water", questionId: 5, selectedIndex: 1, quizMode: "quick10", attemptToken: "receipt-token",
    }));
    expect(result).toMatchObject({ saved: true, correct: false, correctIndex: 2, explanation: "SECRET-EXPLANATION-5", tip: "SECRET-TIP" });
  });

  it("reveals nothing when the attempt was not saved (no receipt, no access or a problem)", async () => {
    logAttempt.mockResolvedValue({ success: false });
    const result = await caller().answer(payload);
    expect(result).toEqual({ saved: false });
    expect(JSON.stringify(result)).not.toMatch(/correctIndex|explanation|SECRET/);
  });

  it("reveals nothing when the attempt log returns nothing", async () => {
    logAttempt.mockResolvedValue(undefined);
    expect(await caller().answer(payload)).toEqual({ saved: false });
  });

  it("refuses the 309A course", async () => {
    await expect(caller().answer({ ...payload, courseKey: "electrician-309a" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(logAttempt).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range answer or a malformed session id", async () => {
    await expect(caller().answer({ ...payload, selectedIndex: 4 })).rejects.toThrow();
    await expect(caller().answer({ ...payload, sessionId: "not-a-uuid" })).rejects.toThrow();
  });
});
