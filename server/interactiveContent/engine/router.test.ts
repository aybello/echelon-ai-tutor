import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { TrpcContext } from "../../_core/context";
import { router } from "../../_core/trpc";
import { interactiveRouter } from "../../routers/interactiveRouter";
import { resolveAccessForRequest } from "../../_core/accessService";
import { InteractiveContentEngine, getInteractiveContentEngine } from "./loader";
import { fixture } from "./testFixtures";
import { interactiveModes } from "../../../shared/interactiveSessions";

vi.mock("../../_core/accessService", () => ({ resolveAccessForRequest: vi.fn() }));
vi.mock("./loader", async original => ({ ...await original<typeof import("./loader")>(), getInteractiveContentEngine: vi.fn() }));
const setHeader = vi.fn();
const ctx = { user: null, studentEmail: null, req: { headers: {} }, res: { setHeader } } as unknown as TrpcContext;
const httpRouter = router({ interactive: interactiveRouter });
let root: string;
let records: ReturnType<typeof fixture>["records"];
const payload = { courseKey: "class1-water", mode: "rapid-swipe" as const, accessToken: "synthetic-token" };
function request(method: "GET" | "POST", procedure: string, input: unknown) {
  const body = JSON.stringify({ json: input });
  return fetchRequestHandler({ endpoint: "/api/trpc", router: httpRouter, createContext: () => ctx,
    req: new Request(`http://localhost/api/trpc/interactive.${procedure}${method === "GET" ? `?input=${encodeURIComponent(body)}` : ""}`, method === "POST" ? { method, headers: { "content-type": "application/json" }, body } : { method }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  const result = fixture({ perMode: 31, secondCourse: true }); root = result.root; records = result.records;
  vi.mocked(getInteractiveContentEngine).mockReturnValue(new InteractiveContentEngine(root));
  vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  expect(resolveAccessForRequest).not.toHaveBeenCalled();
});

describe("interactive engine public POST contract", () => {
  it("exposes all routes as public POST mutations, not GET", async () => {
    const catalog = await request("POST", "getCatalog", { courseKey: payload.courseKey });
    expect(catalog.status).toBe(200);
    const catalogData = (await catalog.json()).result.data.json;
    expect(catalogData).toMatchObject({ courseKey: payload.courseKey, available: true, locked: false, version: "synthetic-v1" });
    expect(catalogData.modes.every((mode: { totalCount: number }) => mode.totalCount === 31)).toBe(true);
    const session = await request("POST", "startSession", payload);
    expect(session.status).toBe(200);
    const data = (await session.json()).result.data.json;
    expect(data).toMatchObject({ locked: false, totalAvailableCount: 31, filters: { topicId: null, difficulty: null, requestedSize: 20 } });
    expect(data.examples).toHaveLength(20);
    const content = await request("POST", "getContent", { courseKey: payload.courseKey });
    expect(content.status).toBe(200);
    const contentData = (await content.json()).result.data.json;
    expect(contentData.locked).toBe(false);
    expect(contentData.examples).toHaveLength(12);
    for (const procedure of ["getCatalog", "startSession", "getContent"]) {
      expect((await request("GET", procedure, payload)).status).toBe(405);
    }
    expect(setHeader).toHaveBeenCalledTimes(3);
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });

  it("unlocks all endpoints and refreshes for anonymous, OTP, ordinary and privileged accounts regardless of tokens", async () => {
    const accounts = [
      { user: null, studentEmail: null },
      { user: null, studentEmail: "student@example.test" },
      { user: { id: 123, email: "student@example.test", role: "user", openId: "ordinary" }, studentEmail: null },
      { user: { id: 124, email: "admin@example.test", role: "admin", openId: "admin" }, studentEmail: null },
    ];
    for (const account of accounts) for (const accessToken of [undefined, "arbitrary-token", "expired-token", "other-course-token", "paid-token"]) {
      const caller = interactiveRouter.createCaller({ ...ctx, ...account } as TrpcContext);
      const input = { courseKey: payload.courseKey, accessToken };
      expect((await caller.getCatalog(input)).locked).toBe(false);
      for (let refresh = 0; refresh < 2; refresh++) {
        const session = await caller.startSession({ ...input, mode: payload.mode });
        expect(session).toMatchObject({ locked: false, totalAvailableCount: 31 });
        expect(session.examples).toHaveLength(20);
      }
      const content = await caller.getContent(input);
      expect(content.locked).toBe(false);
      expect(content.examples).toHaveLength(12);
    }
    expect(resolveAccessForRequest).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledTimes(accounts.length * 5 * 4);
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });

  it("honors public filters and bounded sizes across all modes, exposing the full published bank without replacement", async () => {
    const caller = interactiveRouter.createCaller(ctx);
    const union = new Set<string>();
    for (const mode of interactiveModes) for (const selection of [
      { sessionSize: 5 },
      { sessionSize: 50 },
      { sessionSize: 50, topicId: "beta", difficulty: "hard" as const },
      { sessionSize: 5, topicId: "missing", difficulty: "easy" as const },
    ]) {
      const session = await caller.startSession({ courseKey: payload.courseKey, mode, ...selection });
      const eligible = records.filter(record => record.example.mode === mode && (!selection.topicId || record.topicId === selection.topicId) && (!selection.difficulty || record.difficulty === selection.difficulty));
      expect(session).toMatchObject({ locked: false, totalAvailableCount: eligible.length, filters: { topicId: selection.topicId ?? null, difficulty: selection.difficulty ?? null, requestedSize: selection.sessionSize } });
      expect(session.examples).toHaveLength(Math.min(selection.sessionSize, eligible.length));
      expect(new Set(session.examples.map(example => example.id)).size).toBe(session.examples.length);
      const eligibleIds = new Set(eligible.map(record => record.example.id));
      for (const example of session.examples) { expect(eligibleIds.has(example.id)).toBe(true); union.add(example.id); }
    }
    expect(union).toEqual(new Set(records.map(record => record.example.id)));
  });

  it("unlocks another published course even with a token for the first course", async () => {
    const caller = interactiveRouter.createCaller(ctx);
    const second = await caller.startSession({ ...payload, courseKey: "class2-water" });
    expect(second).toMatchObject({ locked: false, totalAvailableCount: 2 });
    expect(second.examples).toHaveLength(2);
    for (const example of second.examples) expect(example.id).toMatch(/^class2-water-/);
    expect(resolveAccessForRequest).not.toHaveBeenCalled();
  });

  it.each(["electrician-309a", "electrician-309a-demo", "class1", "unknown", "../class1-water"])("rejects canonical-excluded/alias/path course %s before access or content", async courseKey => {
    const caller = interactiveRouter.createCaller(ctx);
    await expect(caller.getCatalog({ courseKey })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.startSession({ ...payload, courseKey })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.getContent({ courseKey })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(resolveAccessForRequest).not.toHaveBeenCalled();
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledTimes(3);
  });

  it("sets no-store before strict validation and rejects out-of-bounds sizes before content", async () => {
    const caller = interactiveRouter.createCaller(ctx);
    for (const sessionSize of [4, 51, 5.5]) {
      await expect(caller.startSession({ ...payload, sessionSize })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    await expect(caller.getCatalog({ courseKey: payload.courseKey, wholeBank: true } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(setHeader).toHaveBeenCalledTimes(4);
    expect(resolveAccessForRequest).not.toHaveBeenCalled();
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
  });

  it("registered missing packs fail closed for legacy, catalog and session after no-store without entitlement reads", async () => {
    unlinkSync(join(root, "class1-water/manifest.json"));
    const caller = interactiveRouter.createCaller(ctx);
    await expect(caller.getCatalog({ courseKey: payload.courseKey })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Interactive content is unavailable." });
    await expect(caller.startSession(payload)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    await expect(caller.getContent({ courseKey: payload.courseKey })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(resolveAccessForRequest).not.toHaveBeenCalled(); expect(setHeader).toHaveBeenCalledTimes(3);
  });
});
