import { readFileSync } from "node:fs";
import { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { Duplex } from "node:stream";
import express from "express";
import { initTRPC } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { databaseCutoverWriteFreeze } from "./databaseCutover";
import { interactiveContentNoStore } from "./interactiveContentCache";
import { trpcRateLimitDispatcher } from "../trpcRateLimit";

// Node HTTP objects and an in-memory stream exercise Express without listen(),
// a socket, database, or outbound traffic.
async function request(app: express.Express, url: string, options: {
  method?: string; body?: string; contentType?: string;
} = {}) {
  const body = options.body ?? "";
  const chunks: Buffer[] = [];
  const stream = new Duplex({
    read() {},
    write(chunk, _encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); },
  });
  const socket = stream as unknown as Socket;
  const req = new IncomingMessage(socket);
  req.method = options.method ?? "GET";
  req.url = url;
  req.headers = { host: "example.test", ...(options.contentType ? {
    "content-type": options.contentType,
    "content-length": String(Buffer.byteLength(body)),
  } : {}) };
  const res = new ServerResponse(req);
  res.assignSocket(socket);
  const done = new Promise<void>(resolve => res.on("finish", resolve));
  (app as unknown as { handle(req: IncomingMessage, res: ServerResponse): void }).handle(req, res);
  req.complete = true;
  req.push(body || null);
  if (body) req.push(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([done, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`response timeout: ${url}, status ${res.statusCode}, sent ${res.headersSent}, ended ${res.writableEnded}, request complete ${req.complete}`)), 1000);
    })]);
  } finally {
    clearTimeout(timer);
  }
  return { status: res.statusCode, cache: res.getHeader("cache-control"), raw: Buffer.concat(chunks).toString() };
}

const t = initTRPC.create();
const router = t.router({
  interactive: t.router({
    getContent: t.procedure.input(z.object({ courseKey: z.string() })).mutation(({ input }) => input),
    getCatalog: t.procedure.input(z.object({ courseKey: z.string() })).mutation(({ input }) => input),
    startSession: t.procedure.input(z.object({ courseKey: z.string(), mode: z.string() })).mutation(({ input }) => input),
  }),
  quiz: t.router({ getInteractiveQuestions: t.procedure.input(z.object({ bankKey: z.string() })).mutation(({ input }) => input) }),
  other: t.router({ get: t.procedure.query(() => "ok") }),
  tutor: t.router({ chat: t.procedure.mutation(() => "ok") }),
});

function appWithStack() {
  const app = express();
  app.use("/api/trpc", interactiveContentNoStore);
  app.use(databaseCutoverWriteFreeze());
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/trpc", trpcRateLimitDispatcher);
  app.use("/api/trpc", createExpressMiddleware({ router }));
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status ?? 500).send("parser error");
  });
  app.get("/commerce", (_req, res) => res.set("Cache-Control", "public, max-age=60").send("ok"));
  return app;
}

const target = "/api/trpc/interactive.getContent";
const json = { method: "POST", contentType: "application/json" };
afterEach(() => { delete process.env.DATABASE_CUTOVER_MODE; });

describe("interactive getContent response caching", () => {
  it("registers the actual production middleware before all terminating gates", () => {
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    const marker = source.indexOf('app.use("/api/trpc", interactiveContentNoStore)');
    expect(marker).toBeGreaterThan(0);
    for (const later of ["app.use(databaseCutoverWriteFreeze())", 'registerStripeWebhook(app)', 'app.use(express.json(', 'app.use("/api/trpc", trpcRateLimitDispatcher)', "createExpressMiddleware({"]) {
      expect(source.indexOf(later)).toBeGreaterThan(marker);
    }
  });

  it("protects successful and invalid tRPC requests, including GET and mixed batches", async () => {
    const app = appWithStack();
    const cases = [
      [target, { ...json, body: '{"courseKey":"test"}' }, 200],
      [target, { ...json, body: '{}' }, 400],
      [target, {}, 405],
      [target, { method: "HEAD" }, 204],
      ['/api/trpc/interactive.getContent,tutor.chat?batch=1', { ...json, body: '{"0":{"courseKey":"test"},"1":null}' }, 200],
      [`${target}?input=%7Bnot-json`, {}, 405],
      ['/api/trpc/other.get,interactive.getContent?batch=1&input=%7B%7D', {}, 400],
      ['/api/trpc/interactive%2EgetContent%2Cother.get?batch=1', {}, 400],
      ['/api/trpc/other.get,interactive.getContent,%ZZ?batch=1', {}, 500],
    ] as const;
    for (const [url, options, status] of cases) {
      const response = await request(app, url, options);
      expect(response.status, url).toBe(status);
      expect(response.cache, url).toBe("private, no-store");
    }
  });

  it.each(["interactive.getCatalog", "interactive.startSession"])("protects %s before JSON parsing and GET rejection", async procedure => {
    const app = appWithStack();
    const path = `/api/trpc/${procedure}`;
    const input = { courseKey: "test", ...(procedure.endsWith("startSession") ? { mode: "rapid-swipe" } : {}) };
    const cases: Array<[string, { method?: string; body?: string; contentType?: string }, number]> = [
      [path, { ...json, body: JSON.stringify(input) }, 200],
      [path, { ...json, body: '{}' }, 400],
      [path, {}, 405],
      [path, { method: "HEAD" }, 204],
      [`${path}?input=%7Bnot-json`, {}, 405],
      [path, { ...json, body: '{' }, 400],
      [path, { ...json, body: JSON.stringify({ x: "x".repeat(1_048_577) }) }, 413],
      [`/api/trpc/${procedure},other.get?batch=1`, { ...json, body: '{' }, 400],
      [`/api/trpc/${procedure.replace(".", "%2E")}%2Cother.get?batch=1`, {}, 400],
      [`/api/trpc/other.get,${procedure},%ZZ?batch=1`, {}, 500],
    ];
    for (const [url, options, status] of cases) {
      const response = await request(app, url, options);
      expect(response.status, url).toBe(status);
      expect(response.cache, url).toBe("private, no-store");
    }
    for (const url of [`${path}Extra`, `/api/trpc/other.get?input=${procedure}`, `/api/trpc/other.get,${procedure}Extra?batch=1`]) {
      expect((await request(app, url)).cache, url).toBeUndefined();
    }
  });

  it("protects fallback POSTs, batches, and parser failures without broadening cache policy", async () => {
    const app = appWithStack();
    const path = "/api/trpc/quiz.getInteractiveQuestions";
    const cases: Array<[string, { method?: string; body?: string; contentType?: string }, number]> = [
      [path, { ...json, body: '{"bankKey":"oit"}' }, 200],
      [path, { ...json, body: '{}' }, 400],
      [path, {}, 405],
      [path, { ...json, body: '{' }, 400],
      [path, { ...json, body: JSON.stringify({x: "x".repeat(1_048_577)}) }, 413],
      ['/api/trpc/tutor.chat,quiz.getInteractiveQuestions?batch=1', { ...json, body: '{"0":null,"1":{"bankKey":"oit"}}' }, 200],
      ['/api/trpc/quiz%2EgetInteractiveQuestions%2Ctutor.chat?batch=1', { ...json, body: '{' }, 400],
      ['/api/trpc/quiz.getInteractiveQuestions,%ZZ?batch=1', {}, 500],
    ];
    for (const [url, options, status] of cases) {
      const response = await request(app, url, options);
      expect(response.status, url).toBe(status);
      expect(response.cache, url).toBe("private, no-store");
    }
    for (const url of ['/api/trpc/quiz.getQuestions', '/api/trpc/quiz.getInteractiveQuestionsExtra', '/api/trpc/other.get?input=quiz.getInteractiveQuestions']) {
      expect((await request(app, url)).cache, url).toBeUndefined();
    }
  });

  it("sets protection before malformed and oversized JSON parser errors", async () => {
    const app = appWithStack();
    const invalid = await request(app, target, { ...json, body: '{' });
    expect(invalid.status).toBe(400);
    expect(invalid.cache).toBe("private, no-store");
    const oversized = await request(app, target, { ...json, body: JSON.stringify({ x: "x".repeat(1_048_577) }) });
    expect(oversized.status).toBe(413);
    expect(oversized.cache).toBe("private, no-store");
  });

  it("protects responses rejected by the real cutover gate and rate limiter", async () => {
    const app = appWithStack();
    process.env.DATABASE_CUTOVER_MODE = "freeze";
    const frozen = await request(app, target, { ...json, body: '{}' });
    expect(frozen.status).toBe(503);
    expect(frozen.cache).toBe("private, no-store");
    const frozenFallback = await request(app, '/api/trpc/quiz.getInteractiveQuestions', { ...json, body: '{}' });
    expect(frozenFallback.status).toBe(503);
    expect(frozenFallback.cache).toBe("private, no-store");
    for (const procedure of ["interactive.getCatalog", "interactive.startSession"]) {
      const frozenEngine = await request(app, `/api/trpc/${procedure}`, { ...json, body: '{' });
      expect(frozenEngine.status).toBe(503);
      expect(frozenEngine.cache).toBe("private, no-store");
    }
    delete process.env.DATABASE_CUTOVER_MODE;
    // The tutor member selects the existing strict AI limiter (15/minute).
    let limited: Awaited<ReturnType<typeof request>> | undefined;
    for (let i = 0; i < 16; i++) {
      limited = await request(app, '/api/trpc/tutor.chat,interactive.getContent?batch=1', { ...json, body: '{}' });
    }
    expect(limited?.status).toBe(429);
    expect(limited?.cache).toBe("private, no-store");
    const limitedFallback = await request(app, '/api/trpc/tutor.chat,quiz.getInteractiveQuestions?batch=1', { ...json, body: '{}' });
    expect(limitedFallback.status).toBe(429);
    expect(limitedFallback.cache).toBe("private, no-store");
    for (const procedure of ["interactive.getCatalog", "interactive.startSession"]) {
      const limitedEngine = await request(app, `/api/trpc/tutor.chat,${procedure}?batch=1`, { ...json, body: '{}' });
      expect(limitedEngine.status).toBe(429);
      expect(limitedEngine.cache).toBe("private, no-store");
    }
  });

  it("does not change unrelated tRPC or commerce cache policies", async () => {
    const app = appWithStack();
    for (const path of ['/api/trpc/other.get', '/api/trpc/interactive.getContentExtra', '/api/trpc/other.get?input=interactive.getContent', '/api/trpc/other.get,interactive.getContentExtra?batch=1']) {
      expect((await request(app, path)).cache, path).toBeUndefined();
    }
    expect((await request(app, '/commerce')).cache).toBe('public, max-age=60');
  });
});
