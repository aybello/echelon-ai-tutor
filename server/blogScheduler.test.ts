import express, { type Request, type Response } from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeBlogCallback, registerBlogAutomationRoutes } from "./blogScheduler";
const authorized = vi.hoisted(() => vi.fn());
vi.mock("./blogSchedule", () => ({ blogTaskAuthorized: authorized }));
let server: Server | undefined;
afterEach(async () => { if (server) await new Promise<void>(resolve => server!.close(() => resolve())); server = undefined; vi.unstubAllEnvs(); vi.clearAllMocks(); });
async function fixture() {
  const app = express();
  const deps = { authorize: vi.fn().mockResolvedValue(true), enqueue: vi.fn().mockResolvedValue({ ok: true, action: "queued" }),
    advance: vi.fn().mockResolvedValue({ ok: true, action: "progress_saved" }) };
  registerBlogAutomationRoutes(app, deps);
  server = createServer(app); await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const request = async (path: string) => { const r = await fetch(origin + path, { method: "POST" }); return { status: r.status, body: await r.json() }; };
  return { deps, request };
}
describe("short durable blog callbacks", () => {
  it("acknowledges only an enqueued run and never reports it as published", async () => {
    const { deps, request } = await fixture();
    expect(await request("/api/scheduled/generate-blog")).toEqual({ status: 200, body: { ok: true, action: "queued", published: false } });
    expect(deps.advance).not.toHaveBeenCalled();
    expect(deps.authorize).toHaveBeenCalledWith(expect.anything(), expect.anything(), "weekly");
  });
  it("rejects other tasks before any queue or model work", async () => {
    const { deps, request } = await fixture(); deps.authorize.mockResolvedValue(false);
    expect((await request("/api/scheduled/generate-blog")).status).toBe(403);
    expect((await request("/api/scheduled/continue-blog")).status).toBe(403);
    expect(deps.enqueue).not.toHaveBeenCalled(); expect(deps.advance).not.toHaveBeenCalled();
  });
  it("reports retryable reads, editorial failures and actual publication honestly", async () => {
    const { deps, request } = await fixture();
    deps.advance.mockResolvedValueOnce({ ok: false, action: "retry_pending" });
    expect((await request("/api/scheduled/continue-blog")).status).toBe(503);
    deps.advance.mockResolvedValueOnce({ ok: false, action: "failed" });
    expect((await request("/api/scheduled/continue-blog")).status).toBe(422);
    deps.advance.mockResolvedValueOnce({ ok: true, action: "article_published" });
    expect(await request("/api/scheduled/continue-blog")).toEqual({ status: 200, body: { ok: true, action: "article_published", published: true } });
  });
  it("does not leak raw provider or database errors to execution logs", async () => {
    const { deps, request } = await fixture(); deps.enqueue.mockRejectedValue(new Error("private-provider-body"));
    const result = await request("/api/scheduled/generate-blog");
    expect(result.status).toBe(503); expect(JSON.stringify(result.body)).not.toContain("private-provider-body");
  });
  it("accepts only the stored task identity at the designated production host", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("DEPLOYMENT_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://echeloninstitute.ca"); authorized.mockResolvedValue(true);
    const req = { headers: { host: "echeloninstitute.ca" } } as Request;
    const res = { locals: { cronUser: { isCron: true, taskUid: "fixture-task" } } } as unknown as Response;
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(true);
    expect(authorized).toHaveBeenCalledWith("fixture-task", "worker");
    req.headers.host = "echeloninstitute.manus.space";
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(true);
    req.headers.host = "3000-preview.manus.computer";
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    req.headers.host = "echeloninstitute.ca";
    res.locals = { scheduledAuthenticated: true };
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    res.locals = { cronUser: { isCron: true, taskUid: "other-task" } }; authorized.mockResolvedValue(false);
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    vi.stubEnv("DEPLOYMENT_ENV", "preview");
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
  });
  it("accepts a bound platform task header only after shared middleware authenticates its secret", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("DEPLOYMENT_ENV", "production");
    const req = { headers: { host: "echeloninstitute.ca", "x-manus-cron-task-uid": "bound-worker" } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    authorized.mockResolvedValue(true);
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    expect(authorized).not.toHaveBeenCalled();
    res.locals.scheduledAuthenticated = true;
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(true);
    expect(authorized).toHaveBeenLastCalledWith("bound-worker", "worker");
    authorized.mockResolvedValue(false);
    expect(await authorizeBlogCallback(req, res, "weekly")).toBe(false);
    expect(authorized).toHaveBeenLastCalledWith("bound-worker", "weekly");
    req.headers["x-manus-cron-task-uid"] = ["bound-worker", "other-task"];
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    delete req.headers["x-manus-cron-task-uid"];
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
  });
  it("never lets a header override an authenticated SDK task, even when secret authentication also succeeded", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("DEPLOYMENT_ENV", "production");
    const req = { headers: { host: "echeloninstitute.manus.space", "x-manus-cron-task-uid": "bound-worker" } } as unknown as Request;
    const res = { locals: { scheduledAuthenticated: true, cronUser: { isCron: true, taskUid: "wrong-sdk-task" } } } as unknown as Response;
    authorized.mockResolvedValue(false);
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    expect(authorized).toHaveBeenLastCalledWith("wrong-sdk-task", "worker");
    res.locals.cronUser = { isCron: true };
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
    res.locals = { scheduledAuthenticated: true };
    req.headers.host = "3000-preview.manus.computer";
    authorized.mockResolvedValue(true);
    expect(await authorizeBlogCallback(req, res, "worker")).toBe(false);
  });
});
