import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rmSync } from "node:fs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { TrpcContext } from "./_core/context";
import { router } from "./_core/trpc";
import { interactiveRouter } from "./routers/interactiveRouter";
import { InteractiveContentEngine, getInteractiveContentEngine } from "./interactiveContent/engine/loader";
import { fixture } from "./interactiveContent/engine/testFixtures";
import { dueItemIds, readProgress, saveResults } from "./interactiveProgress";

vi.mock("./_core/env", () => ({ ENV: { cookieSecret: "test-only-not-for-production" } }));
vi.mock("./interactiveContent/engine/loader", async original => ({ ...await original<typeof import("./interactiveContent/engine/loader")>(), getInteractiveContentEngine: vi.fn() }));
vi.mock("./interactiveProgress", async original => ({
  ...await original<typeof import("./interactiveProgress")>(),
  saveResults: vi.fn(), readProgress: vi.fn(), dueItemIds: vi.fn(),
}));

const setHeader = vi.fn();
const anonymous = { user: null, studentEmail: null, req: { headers: {} }, res: { setHeader } } as unknown as TrpcContext;
const account = { user: { id: 42 }, studentEmail: null, req: { headers: {} }, res: { setHeader } } as unknown as TrpcContext;
const emailStudent = { user: null, studentEmail: "learner@example.test", req: { headers: {} }, res: { setHeader } } as unknown as TrpcContext;
const httpRouter = router({ interactive: interactiveRouter });
let root: string;
let engine: InteractiveContentEngine;
const course = "class1-water";

function call(procedure: string, input: unknown, ctx: TrpcContext) {
  return fetchRequestHandler({
    endpoint: "/api/trpc", router: httpRouter, createContext: () => ctx,
    req: new Request(`http://localhost/api/trpc/interactive.${procedure}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ json: procedure === "recordResults" ? { expectedIdentity: createHmac("sha256", "test-only-not-for-production").update(`interactive-progress:v1:${ctx.user ? `user:${ctx.user.id}` : `email:${ctx.studentEmail}`}`).digest("hex"), ...input as object } : input }) }),
  });
}
const idsFor = (mode: string) => Array.from(engine.knownItems(course)).filter(([, m]) => m === mode).map(([id]) => id);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("INTERACTIVE_SAVED_PROGRESS_ENABLED", "true");
  const result = fixture({ perMode: 31, secondCourse: true });
  root = result.root;
  engine = new InteractiveContentEngine(root, []);
  vi.mocked(getInteractiveContentEngine).mockReturnValue(engine);
  vi.mocked(saveResults).mockResolvedValue({ saved: 0 });
  vi.mocked(dueItemIds).mockResolvedValue([]);
});
afterEach(() => { rmSync(root, { recursive: true, force: true }); vi.unstubAllEnvs(); });

describe("recordResults", () => {
  it("rejects an old account binding before any save", async () => {
    const [id] = idsFor("rapid-swipe");
    const response = await call("recordResults", { courseKey: course, expectedIdentity: "old-account-binding", results: [{ itemId: id, mode: "rapid-swipe", correct: true }] }, account);
    expect((await response.json()).result.data.json.stored).toBe(false);
    expect(saveResults).not.toHaveBeenCalled();
  });
  it("does not contact storage unless separately activated", async () => {
    vi.stubEnv("INTERACTIVE_SAVED_PROGRESS_ENABLED", "false");
    const [id] = idsFor("rapid-swipe");
    const response = await call("recordResults", { courseKey: course, results: [{ itemId: id, mode: "rapid-swipe", correct: true }] }, account);
    expect((await response.json()).result.data.json.stored).toBe(false);
    await call("getProgress", { courseKey: course }, account);
    await call("startSession", { courseKey: course, mode: "rapid-swipe", sessionSize: 5, focus: "review" }, account);
    expect(saveResults).not.toHaveBeenCalled(); expect(readProgress).not.toHaveBeenCalled(); expect(dueItemIds).not.toHaveBeenCalled();
  });

  it("stores nothing for anonymous play", async () => {
    const [id] = idsFor("rapid-swipe");
    const response = await call("recordResults", { courseKey: course, results: [{ itemId: id, mode: "rapid-swipe", correct: true }] }, anonymous);
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json).toEqual({ stored: false, saved: 0, ignored: 1 });
    expect(saveResults).not.toHaveBeenCalled();
  });

  it("saves valid answers for an account, keyed by account id", async () => {
    const [a, b] = idsFor("rapid-swipe");
    vi.mocked(saveResults).mockResolvedValue({ saved: 2 });
    const response = await call("recordResults", { courseKey: course, localDate: "2026-11-15", results: [
      { itemId: a, mode: "rapid-swipe", correct: true }, { itemId: b, mode: "rapid-swipe", correct: false },
    ] }, account);
    expect((await response.json()).result.data.json).toEqual({ stored: true, saved: 2, ignored: 0 });
    expect(saveResults).toHaveBeenCalledTimes(1);
    const [learnerKey, courseKey, results] = vi.mocked(saveResults).mock.calls[0];
    expect(learnerKey).toBe("user:42");
    expect(courseKey).toBe(course);
    expect(results).toEqual([{ itemId: a, mode: "rapid-swipe", correct: true }, { itemId: b, mode: "rapid-swipe", correct: false }]);
  });

  it("keys a verified email student by lowercased email", async () => {
    const [id] = idsFor("odd-one-out");
    vi.mocked(saveResults).mockResolvedValue({ saved: 1 });
    await call("recordResults", { courseKey: course, results: [{ itemId: id, mode: "odd-one-out", correct: true }] }, emailStudent);
    expect(vi.mocked(saveResults).mock.calls[0][0]).toBe("email:learner@example.test");
  });

  it("drops unknown items and items filed under the wrong mode", async () => {
    const [swipe] = idsFor("rapid-swipe");
    const [odd] = idsFor("odd-one-out");
    vi.mocked(saveResults).mockResolvedValue({ saved: 1 });
    const response = await call("recordResults", { courseKey: course, results: [
      { itemId: swipe, mode: "rapid-swipe", correct: true },
      { itemId: "not-a-real-item", mode: "rapid-swipe", correct: true },
      { itemId: odd, mode: "rapid-swipe", correct: true },
    ] }, account);
    expect((await response.json()).result.data.json).toEqual({ stored: true, saved: 1, ignored: 2 });
    expect(vi.mocked(saveResults).mock.calls[0][2]).toEqual([{ itemId: swipe, mode: "rapid-swipe", correct: true }]);
  });

  it("does not break the game when storage fails, and says nothing was stored", async () => {
    const [id] = idsFor("rapid-swipe");
    vi.mocked(saveResults).mockRejectedValue(new Error("Database unavailable"));
    const response = await call("recordResults", { courseKey: course, results: [{ itemId: id, mode: "rapid-swipe", correct: true }] }, account);
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json).toEqual({ stored: false, saved: 0, ignored: 1 });
  });

  it("rejects oversized batches, unknown modes and other courses before storing anything", async () => {
    const [id] = idsFor("rapid-swipe");
    const many = Array.from({ length: 51 }, () => ({ itemId: id, mode: "rapid-swipe", correct: true }));
    expect((await call("recordResults", { courseKey: course, results: many }, account)).status).toBe(400);
    expect((await call("recordResults", { courseKey: course, results: [{ itemId: id, mode: "made-up", correct: true }] }, account)).status).toBe(400);
    expect((await call("recordResults", { courseKey: "electrician-309a", results: [{ itemId: id, mode: "rapid-swipe", correct: true }] }, account)).status).toBe(400);
    expect(saveResults).not.toHaveBeenCalled();
  });
});

describe("getProgress", () => {
  it("returns an empty, unstored summary for anonymous play", async () => {
    const response = await call("getProgress", { courseKey: course }, anonymous);
    expect((await response.json()).result.data.json).toEqual({ stored: false, today: { answered: 0, correct: 0, goal: 20 }, streakDays: 0, dueCount: 0, modes: [] });
    expect(readProgress).not.toHaveBeenCalled();
  });

  it("returns the saved summary for a signed-in learner", async () => {
    vi.mocked(readProgress).mockResolvedValue({
      today: { answered: 12, correct: 9, goal: 20 }, streakDays: 3, dueCount: 4,
      modes: [{ mode: "rapid-swipe", seen: 30, solid: 10, due: 4, attempts: 40, correct: 30 }],
    });
    const response = await call("getProgress", { courseKey: course }, account);
    const data = (await response.json()).result.data.json;
    expect(data).toMatchObject({ stored: true, streakDays: 3, dueCount: 4, today: { answered: 12, correct: 9, goal: 20 } });
    expect(vi.mocked(readProgress).mock.calls[0][0]).toBe("user:42");
  });

  it("falls back to an empty summary if storage fails", async () => {
    vi.mocked(readProgress).mockRejectedValue(new Error("Database unavailable"));
    const response = await call("getProgress", { courseKey: course }, account);
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json.stored).toBe(false);
  });
});

describe("startSession replay", () => {
  const payload = { courseKey: course, mode: "rapid-swipe", sessionSize: 5 };

  it("puts a signed-in learner's due items first", async () => {
    const ids = idsFor("rapid-swipe");
    const due = [ids[7], ids[3]];
    vi.mocked(dueItemIds).mockResolvedValue(due);
    const response = await call("startSession", { ...payload, focus: "review" }, account);
    const data = (await response.json()).result.data.json;
    expect(data.examples).toHaveLength(5);
    expect(data.examples.slice(0, 2).map((example: { id: string }) => example.id)).toEqual(due);
    expect(new Set(data.examples.map((example: { id: string }) => example.id)).size).toBe(5);
    expect(vi.mocked(dueItemIds).mock.calls[0].slice(0, 3)).toEqual(["user:42", course, "rapid-swipe"]);
  });

  it("ignores replay for anonymous play and never reads progress", async () => {
    const response = await call("startSession", { ...payload, focus: "review" }, anonymous);
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json.examples).toHaveLength(5);
    expect(dueItemIds).not.toHaveBeenCalled();
  });

  it("does not read progress unless replay is asked for", async () => {
    await call("startSession", payload, account);
    expect(dueItemIds).not.toHaveBeenCalled();
  });

  it("falls back to a normal session if reading due items fails", async () => {
    vi.mocked(dueItemIds).mockRejectedValue(new Error("Database unavailable"));
    const response = await call("startSession", { ...payload, focus: "review" }, account);
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json.examples).toHaveLength(5);
  });

  it("skips due items that are no longer served and fills with other items", async () => {
    vi.mocked(dueItemIds).mockResolvedValue(["retired-item-id", idsFor("rapid-swipe")[0]]);
    const response = await call("startSession", { ...payload, focus: "review" }, account);
    const data = (await response.json()).result.data.json;
    expect(data.examples).toHaveLength(5);
    expect(data.examples[0].id).toBe(idsFor("rapid-swipe")[0]);
    expect(data.examples.some((example: { id: string }) => example.id === "retired-item-id")).toBe(false);
  });
});
