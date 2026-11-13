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
let originalPreviewIds: Record<string, string>;
const payload = { courseKey: "class1-water", mode: "rapid-swipe" as const, accessToken: "synthetic-token" };
function request(method: "GET" | "POST", procedure: string, input: unknown) {
  const body = JSON.stringify({ json: input });
  return fetchRequestHandler({ endpoint: "/api/trpc", router: httpRouter, createContext: () => ctx,
    req: new Request(`http://localhost/api/trpc/interactive.${procedure}${method === "GET" ? `?input=${encodeURIComponent(body)}` : ""}`, method === "POST" ? { method, headers: { "content-type": "application/json" }, body } : { method }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  const result = fixture({ perMode: 31, secondCourse: true }); root = result.root; originalPreviewIds = result.legacy.previewIds;
  vi.mocked(getInteractiveContentEngine).mockReturnValue(new InteractiveContentEngine(root));
  vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("interactive engine POST contract and entitlements", () => {
  it("exposes catalog and sessions as public POST mutations, not GET", async () => {
    const catalog = await request("POST", "getCatalog", { courseKey: payload.courseKey });
    expect(catalog.status).toBe(200);
    expect((await catalog.json()).result.data.json).toMatchObject({ courseKey: payload.courseKey, available: true, locked: true, version: "synthetic-v1" });
    const session = await request("POST", "startSession", payload);
    expect(session.status).toBe(200);
    const data = (await session.json()).result.data.json;
    expect(data).toMatchObject({ locked: true, totalAvailableCount: 1, filters: { topicId: null, difficulty: null, requestedSize: 20 } });
    expect(data.examples).toHaveLength(1);
    expect((await request("GET", "getCatalog", { courseKey: payload.courseKey })).status).toBe(405);
    expect((await request("GET", "startSession", payload)).status).toBe(405);
  });

  it("rechecks canonical course-scoped privileged interactive access on every endpoint and refresh", async () => {
    const caller = interactiveRouter.createCaller(ctx);
    vi.mocked(resolveAccessForRequest).mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(false);
    expect((await caller.getCatalog({ courseKey: payload.courseKey, accessToken: payload.accessToken })).locked).toBe(false);
    const paid = await caller.startSession(payload);
    expect(paid.examples).toHaveLength(20);
    expect(paid.locked).toBe(false);
    const expired = await caller.startSession(payload);
    expect(expired.locked).toBe(true);
    expect(expired.examples.map(e => e.id)).toEqual([originalPreviewIds["rapid-swipe"]]);
    expect((await caller.getContent({ courseKey: payload.courseKey, accessToken: payload.accessToken })).examples).toHaveLength(6);
    expect(resolveAccessForRequest).toHaveBeenCalledTimes(4);
    for (const call of vi.mocked(resolveAccessForRequest).mock.calls) expect(call).toEqual([ctx, "class1-water", { accessToken: "synthetic-token", privilegedInteractiveAccess: true }]);
    expect(setHeader).toHaveBeenCalledTimes(4);
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });

  it("free union across modes, filters, size and refresh is exactly the same six legacy preview IDs", async () => {
    const caller = interactiveRouter.createCaller(ctx);
    const union = new Set<string>();
    for (let refresh = 0; refresh < 4; refresh++) for (const mode of interactiveModes) {
      const session = await caller.startSession({ ...payload, mode, sessionSize: refresh % 2 ? 5 : 50, topicId: refresh % 2 ? "missing" : "beta", difficulty: refresh % 2 ? "easy" : "hard" });
      expect(session.filters.topicId).toBeNull(); expect(session.filters.difficulty).toBeNull();
      expect(session.examples).toHaveLength(1);
      session.examples.forEach(e => union.add(e.id));
      expect(session.examples[0].id).toBe(originalPreviewIds[mode]);
    }
    (await caller.getContent({ courseKey: payload.courseKey })).examples.forEach(e => union.add(e.id));
    expect(union).toEqual(new Set(Object.values(originalPreviewIds)));
  });

  it("a token belonging to another course cannot unlock the requested course", async () => {
    vi.mocked(resolveAccessForRequest).mockImplementation(async (_ctx, key) => key === "class1-water");
    const caller = interactiveRouter.createCaller(ctx);
    const second = await caller.startSession({ ...payload, courseKey: "class2-water" });
    expect(second.locked).toBe(true); expect(second.examples).toHaveLength(1);
    expect(second.examples[0].id).toMatch(/^class2-water-/);
    expect(resolveAccessForRequest).toHaveBeenLastCalledWith(ctx, "class2-water", { accessToken: "synthetic-token", privilegedInteractiveAccess: true });
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

  it("sets no-store before strict validation and propagates resolver failures without free/error fallback", async () => {
    const caller = interactiveRouter.createCaller(ctx);
    await expect(caller.startSession({ ...payload, sessionSize: 51 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.getCatalog({ courseKey: payload.courseKey, wholeBank: true } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(setHeader).toHaveBeenCalledTimes(2);
    expect(resolveAccessForRequest).not.toHaveBeenCalled();
    vi.mocked(resolveAccessForRequest).mockRejectedValueOnce(new Error("Synthetic resolver failure"));
    await expect(caller.startSession(payload)).rejects.toThrow("Synthetic resolver failure");
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledTimes(3);
  });

  it("registered missing packs fail closed for legacy, catalog and session after no-store and access", async () => {
    unlinkSync(join(root, "class1-water/manifest.json"));
    const caller = interactiveRouter.createCaller(ctx);
    await expect(caller.getCatalog({ courseKey: payload.courseKey })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Interactive content is unavailable." });
    await expect(caller.startSession(payload)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    await expect(caller.getContent({ courseKey: payload.courseKey })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(resolveAccessForRequest).toHaveBeenCalledTimes(3); expect(setHeader).toHaveBeenCalledTimes(3);
  });
});
