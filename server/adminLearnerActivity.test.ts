import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { diagnosticSessions, examResults, learningActivitySessions, productAnalyticsEvents, questionAttempts, users } from "../drizzle/schema";
const state = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => state);
import { adminRouter } from "./routers/admin";
import { finalizeLearnerFeed, signInMethod } from "./adminLearnerActivity";
function caller(role: "admin" | "user" | null) {
  return adminRouter.createCaller({ user: role ? { id: 1, role } as never : null, studentEmail: "verified@example.test", req: { headers: {} } as never, res: {} as never });
}
const dialect = new MySqlDialect();
function mockDatabase(data: Map<unknown, unknown[]> = new Map()) {
  const queries: { table: unknown; fields: unknown; conditions?: unknown; orders?: unknown[]; groups?: unknown[]; limit?: number }[] = [];
  const select = (fields: unknown) => {
    const call = { table: null, fields } as typeof queries[number];
    queries.push(call);
    const q = {
      from: (table: unknown) => { call.table = table; return q; },
      where: (conditions: unknown) => { call.conditions = conditions; return q; },
      orderBy: (...orders: unknown[]) => { call.orders = orders; return q; },
      groupBy: (...groups: unknown[]) => { call.groups = groups; return q; },
      limit: (limit: number) => { call.limit = limit; return Promise.resolve(data.get(call.table) ?? []); },
    };
    return q;
  };
  state.getDb.mockResolvedValue({ select, selectDistinct: select });
  return queries;
}
beforeEach(() => { vi.clearAllMocks(); });
describe("admin learner activity", () => {
  it("keeps Learners under Learning with a compact overview link, and never instruments routine authentication", () => {
    const admin = readFileSync(new URL("../client/src/pages/Admin.tsx", import.meta.url), "utf8");
    expect(admin).toMatch(/label: "Learning",[\s\S]*?id: "learners", label: "Learners"/);
    expect(admin).toContain('activeTab === "learners" && <AdminLearnerActivity />');
    expect(admin).toContain('View learner activity →');
    const sdk = readFileSync(new URL("./_core/sdk.ts", import.meta.url), "utf8");
    expect(sdk).not.toContain("recordLearnerSignIn");
    const context = readFileSync(new URL("./_core/context.ts", import.meta.url), "utf8");
    expect(context).not.toContain("recordLearnerSignIn");
  });
  it.each([null, "user"] as const)("rejects %s, including email-cookie-only identity, before querying", async role => {
    await expect(caller(role).learnerSearch({ query: "alice" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(role).learnerActivity({ learner: { email: "alice@example.test" }, days: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.getDb).not.toHaveBeenCalled();
  });
  it("validates fixed time windows, bounded inputs and strict identity shape", async () => {
    for (const days of [0, 8, 365]) await expect(caller("admin").learnerActivity({ learner: { userId: 1 }, days } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller("admin").learnerActivity({ learner: { userId: 1, email: "alice@example.test" }, days: 7 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller("admin").learnerSearch({ query: "aa" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller("admin").learnerSearch({ query: "a".repeat(321) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.getDb).not.toHaveBeenCalled();
  });
  it("returns database unavailable as an error, not empty history", async () => {
    state.getDb.mockResolvedValue(null);
    await expect(caller("admin").learnerActivity({ learner: { userId: 1 }, days: 7 })).rejects.toThrow("Database unavailable");
  });
  it("keeps email-only records separate from matching account names and uses bounded SQL search", async () => {
    const queries = mockDatabase(new Map<unknown, unknown[]>([[users, [{ id: 4, name: "Actual account", email: "alice@example.test" }]], [examResults, [{ email: "alice@example.test" }]]]));
    const result = await caller("admin").learnerSearch({ query: "ALICE@example.test" });
    expect(result.learners).toEqual([
      { key: "user:4", name: "Actual account", email: "alice@example.test", selection: { userId: 4 } },
      { key: "email:alice@example.test", name: null, email: "alice@example.test", selection: { email: "alice@example.test" } },
    ]);
    for (const query of queries) expect(query.limit).toBe(21);
    expect(dialect.sqlToQuery(queries[0].conditions as never).params).toEqual(["alice@example.test"]);
    const emailQuery = dialect.sqlToQuery(queries[1].conditions as never);
    expect(emailQuery.sql).toContain('`userId` is null');
    expect(emailQuery.sql).toContain('`startedAt` >= ?');
  });
  it("escapes prefix wildcard input and reports truncated search", async () => {
    const queries = mockDatabase(new Map<unknown, unknown[]>([[users, Array.from({ length: 21 }, (_, id) => ({ id, name: "Account", email: null }))]]));
    const result = await caller("admin").learnerSearch({ query: "a_%" });
    expect(result.learners).toHaveLength(20);
    expect(result.partial).toBe(true);
    expect(dialect.sqlToQuery(queries[0].conditions as never).params).toEqual(["a\\_\\%%", "a\\_\\%%"]);
  });
  it("uses canonical mock/math scores, recorder active seconds and diagnostic completions without exposing raw identities/content", async () => {
    const at = new Date();
    const queries = mockDatabase(new Map<unknown, unknown[]>([
      [productAnalyticsEvents, [{ id: 1, at, event: "login", metadata: '{"method":"email_otp","activityVersion":1,"token":"secret"}', course: null }, { id: 2, at, event: "ai_tutor_session_saved", metadata: '{"conversation":"secret"}', course: "oit" }]],
      [learningActivitySessions, [{ id: 3, at, startedAt: new Date(at.getTime() - 100_000), course: "oit", type: "quiz", seconds: 50, status: "completed", sessionKey: "secret" }]],
      [examResults, [{ id: 4, at, course: "oit", correct: 8, total: 10, calc: "no" }, { id: 5, at, course: "oit", correct: 4, total: 5, calc: "yes" }]],
      [diagnosticSessions, [{ id: 6, at, course: "oit", correct: 2, total: 3 }]],
      [questionAttempts, [{ group: "secret-run", at, course: "oit", mode: "standard", correct: "3", total: "4" }]],
    ]));
    const result = await caller("admin").learnerActivity({ learner: { email: "alice@example.test" }, days: 30 });
    expect(result.items).toHaveLength(7);
    expect(result.recordedStudySeconds).toBe(50);
    expect(result.items.find(item => item.kind === "mock")).toMatchObject({ label: "Mock exam", correct: 8, total: 10 });
    expect(result.items.find(item => item.kind === "math")).toMatchObject({ label: "Math practice", correct: 4, total: 5 });
    expect(result.items.find(item => item.kind === "practice")).toMatchObject({ correct: 3, total: 4 });
    expect(JSON.stringify(result)).not.toMatch(/secret|sessionKey|anonymousHash|alice@/);
    for (const query of queries) {
      expect(query.limit).toBe(201);
      expect(dialect.sqlToQuery(query.conditions as never).sql).toContain('`userId` is null');
    }
    const practiceQuery = queries.find(query => query.table === questionAttempts)!;
    expect(dialect.sqlToQuery(practiceQuery.conditions as never)).toMatchObject({ params: expect.arrayContaining(["alice@example.test"]) });
    expect(dialect.sqlToQuery(practiceQuery.conditions as never).sql).toContain("<> 'mock'");
    expect(practiceQuery.groups).toHaveLength(3);
    expect(dialect.sqlToQuery(practiceQuery.groups![0] as never).sql).toContain("concat('legacy:'");
  });
  it("account queries use recorded user IDs only and never reverse game HMACs", async () => {
    const queries = mockDatabase();
    await caller("admin").learnerActivity({ learner: { userId: 42 }, days: 7 });
    for (const query of queries) {
      const compiled = dialect.sqlToQuery(query.conditions as never);
      expect(compiled.params).toContain(query.table === productAnalyticsEvents ? "42" : 42);
      expect(compiled.sql).not.toContain("anonymousHash");
      expect(compiled.sql).not.toContain("studentEmail");
    }
  });
  it("sorts deterministically, flags truncation and invents neither session spans nor logout", () => {
    const since = new Date("2026-11-01"), until = new Date("2026-11-08");
    const item = { key: "a", at: new Date("2026-11-07"), kind: "signin" as const, label: "Signed in", course: null, detail: "OAuth" };
    expect(finalizeLearnerFeed([item], false, since, until)).toMatchObject({ recordedStudySeconds: 0, lastObservedAt: item.at, partial: false, items: [item] });
    const many = Array.from({ length: 201 }, (_, index) => ({ ...item, key: String(index).padStart(3, "0") }));
    const feed = finalizeLearnerFeed(many.reverse(), false, since, until);
    expect(feed.items).toHaveLength(200); expect(feed.items[0].key).toBe("000"); expect(feed.partial).toBe(true);
    expect(feed).not.toHaveProperty("duration"); expect(feed).not.toHaveProperty("logout");
  });
  it.each([null, "", "{", "null", '[]', '{"method":"__proto__","activityVersion":1}', '{"method":"oauth"}'])("rejects unrecognized sign-in metadata %s", metadata => expect(signInMethod(metadata)).toBeNull());
});
