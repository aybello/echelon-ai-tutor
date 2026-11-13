import { Duplex } from "node:stream";
import { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicProcedure, router } from "./_core/trpc";
import { interactiveRouter } from "./routers/interactiveRouter";
import { interactiveModes } from "./interactiveContent/schema";
import { validateInteractivePackage } from "./interactiveContent/loader";
import { getInteractiveContentEngine, type InteractiveContentEngine } from "./interactiveContent/engine/loader";

vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));
vi.mock("./interactiveContent/engine/loader", () => ({ getInteractiveContentEngine: vi.fn() }));
const examples = interactiveModes.flatMap(mode => ["preview", "paid"].map(kind => {
  const base = { id: `${kind}-${mode}`, mode, prompt: "Synthetic prompt" };
  if (mode === "rapid-swipe") return { ...base, correctAnswer: true, explanation: "Synthetic" };
  if (mode === "before-after") return { ...base, correctAnswer: "before", explanation: "Synthetic" };
  if (mode === "speed-match") return { ...base, pairs: [
    { id: "a", left: "A", right: "1" }, { id: "b", left: "B", right: "2" }, { id: "c", left: "C", right: "3" },
  ] };
  return { ...base, options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], correctOptionId: "a", explanation: "Synthetic" };
}));
const pkg = validateInteractivePackage("class1-water", { approved: true, content: {
  courseKey: "class1-water", status: "approved", version: "http-fixture", examples,
  previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `preview-${mode}`])),
} });
// Synthetic engine only: no artifact discovery or real DB connections.
const sessionEngine = {
  getCatalog: vi.fn((courseKey: string, hasAccess: boolean) => ({ courseKey, available: true, locked: !hasAccess, version: pkg!.version, modes: interactiveModes.map(mode => ({ mode, totalCount: pkg!.examples.filter(example => example.mode === mode).length, topics: [], difficulties: [] })) })),
  startSession: vi.fn((input: { courseKey: string; mode: typeof interactiveModes[number]; sessionSize: number }, hasAccess: boolean) => {
    const selected = pkg!.examples.filter(example => example.mode === input.mode && (hasAccess || example.id.startsWith("preview-")));
    return { courseKey: input.courseKey, available: true, locked: !hasAccess, version: pkg!.version,
      sessionId: "synthetic-session", mode: input.mode, totalAvailableCount: selected.length, examples: selected.slice(0, input.sessionSize),
      filters: { topicId: null, difficulty: null, requestedSize: input.sessionSize } };
  }),
};
const testRouter = router({ interactive: interactiveRouter, other: publicProcedure.mutation(() => ({ ok: true })) });
const app = express();
// Mirrors the relevant production order; no listener or network connection is made.
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use("/api/trpc", createExpressMiddleware({ router: testRouter, createContext: ({ req, res }) => ({ req, res, user: null, studentEmail: null }) }));

async function request(path: string, body: string, method = "POST") {
  const chunks: Buffer[] = [];
  const socket = new Duplex({ read() {}, write(_chunk, _encoding, done) { done(); } });
  const req = new IncomingMessage(socket as Socket);
  req.method = method;
  req.url = `/api/trpc/${path}`;
  req.headers = { host: "localhost", "content-type": "application/json", "content-length": String(Buffer.byteLength(body)) };
  const res = new ServerResponse(req);
  // Preserve the real Express/ServerResponse header API while capturing the
  // adapter's output in memory instead of binding a listening socket.
  res.write = ((chunk: string | Buffer) => { chunks.push(Buffer.from(chunk)); return true; }) as typeof res.write;
  res.end = ((chunk?: string | Buffer) => { if (chunk) chunks.push(Buffer.from(chunk)); res.emit("finish"); return res; }) as typeof res.end;
  const finished = new Promise<void>((resolve, reject) => { res.once("finish", resolve); res.once("error", reject); });
  req.push(body); req.complete = true; req.push(null);
  app(req, res);
  await finished;
  const content = Buffer.concat(chunks).toString();
  return { status: res.statusCode, cache: res.getHeader("Cache-Control"), body: content, json: () => JSON.parse(content) };
}
const envelope = (input: unknown) => ({ json: input });
const path = "interactive.startSession,interactive.startSession?batch=1";
const valid = { courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 20 };
beforeEach(() => {
  vi.clearAllMocks();
  if (!pkg) throw new Error("Synthetic interactive package failed validation");
  vi.mocked(getInteractiveContentEngine).mockReturnValue(sessionEngine as unknown as InteractiveContentEngine);
});

describe("interactive HTTP batches through Express", () => {
  it("batches answer-free catalogs and a bounded fixed preview session with response-wide no-store", async () => {
    const response = await request("interactive.getCatalog,interactive.startSession?batch=1", JSON.stringify({ 0: envelope({ courseKey: "class1-water" }), 1: envelope(valid) }));
    expect(response.status).toBe(200);
    expect(response.cache).toBe("private, no-store");
    const [catalog, session] = response.json().map((item: any) => item.result.data.json);
    expect(catalog).toMatchObject({ courseKey: "class1-water", available: true, locked: true, version: "http-fixture" });
    expect(catalog.modes.map((item: any) => item.mode)).toEqual(interactiveModes);
    expect(catalog.modes.every((item: any) => item.totalCount === 2)).toBe(true);
    expect(JSON.stringify(catalog)).not.toMatch(/examples|correctAnswer|paid-/);
    expect(session).toMatchObject({ mode: "rapid-swipe", totalAvailableCount: 1, filters: { topicId: null, difficulty: null, requestedSize: 20 } });
    expect(session.examples.map((item: any) => item.id)).toEqual(["preview-rapid-swipe"]);
    expect(response.body).not.toContain("paid-");
  });
  it("returns separately indexed previews for a batch and sets response-wide private no-store", async () => {
    const response = await request(path, JSON.stringify({ 0: envelope(valid), 1: envelope(valid) }));
    expect(response.status).toBe(200);
    expect(response.cache).toBe("private, no-store");
    const result = response.json();
    expect(result).toHaveLength(2);
    for (const item of result) {
      expect(item.result.data.json).toMatchObject({ available: true, locked: true, version: "http-fixture" });
      expect(item.result.data.json.examples.map((x: { id: string }) => x.id)).toEqual(["preview-rapid-swipe"]);
    }
  });
  it("isolates a schema-invalid sibling without exposing paid examples and marks the whole response no-store", async () => {
    const response = await request(path, JSON.stringify({ 0: envelope(valid), 1: envelope({ ...valid, email: "foreign@example.test" }) }));
    expect(response.status).toBe(207);
    expect(response.cache).toBe("private, no-store");
    const result = response.json();
    expect(result[0].result.data.json.locked).toBe(true);
    expect(result[0].result.data.json.examples).toHaveLength(1);
    expect(result[1].error.json.data.code).toBe("BAD_REQUEST");
    expect(response.body).not.toContain("paid-");
    expect(getInteractiveContentEngine).toHaveBeenCalledTimes(1);
  });
  it("covers an unrelated successful sibling with the interactive response's no-store header", async () => {
    const response = await request("other,interactive.startSession?batch=1", JSON.stringify({ 0: envelope(null), 1: envelope(valid) }));
    expect(response.status).toBe(200);
    expect(response.cache).toBe("private, no-store");
    expect(response.json()[0].result.data.json).toEqual({ ok: true });
    expect(response.json()[1].result.data.json.locked).toBe(true);
  });
  it("returns an unavailable locked response with no-store for an absent package", async () => {
    vi.mocked(getInteractiveContentEngine).mockReturnValue({ startSession: () => ({ courseKey: "class1-water", available: false, locked: true, version: null, sessionId: "synthetic-absent", mode: "rapid-swipe", totalAvailableCount: 0, examples: [], filters: { topicId: null, difficulty: null, requestedSize: 20 } }) } as unknown as InteractiveContentEngine);
    const response = await request("interactive.startSession", JSON.stringify(envelope(valid)));
    expect(response.status).toBe(200);
    expect(response.cache).toBe("private, no-store");
    expect(response.json().result.data.json).toEqual({ courseKey: "class1-water", available: false, locked: true, version: null, sessionId: "synthetic-absent", mode: "rapid-swipe", totalAvailableCount: 0, examples: [], filters: { topicId: null, difficulty: null, requestedSize: 20 } });
  });
  it("fails closed with no-store for an invalid registered package", async () => {
    vi.mocked(getInteractiveContentEngine).mockReturnValue({ startSession: () => { throw new Error("private-artifact-error"); } } as unknown as InteractiveContentEngine);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const response = await request("interactive.startSession", JSON.stringify(envelope(valid)));
      expect(response.status).toBe(500);
      expect(response.cache).toBe("private, no-store");
      expect(response.json().error.json.data.code).toBe("INTERNAL_SERVER_ERROR");
      expect(response.body).not.toContain("paid-");
      expect(warn).not.toHaveBeenCalled();
      expect(response.body).not.toContain("private-artifact-error");
    } finally {
      warn.mockRestore();
    }
  });
  it("documents malformed JSON rejected by Express before tRPC can set no-store", async () => {
    const response = await request(path, "{");
    expect(response.status).toBe(400);
    expect(response.cache).toBeUndefined();
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
  });
  it("documents GET rejection before interactive procedure middleware", async () => {
    const response = await request("interactive.startSession", "", "GET");
    expect(response.status).toBe(405);
    expect(response.cache).toBeUndefined();
  });
});
