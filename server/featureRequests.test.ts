import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect, getTableConfig } from "drizzle-orm/mysql-core";
import { featureRequests } from "../drizzle/schema";
import { featureRequestStatuses, featureRequestStatusLabels } from "../shared/featureRequests";
import type { TrpcContext } from "./_core/context";
const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);
import { featureRequestsRouter, resetFeatureRequestLimiterForTests } from "./routers/featureRequestsRouter";

const input = { courseKey: "oit", pagePath: "/dashboard", source: "dashboard" as const, suggestion: "Add more worked examples" };
const dialect = new MySqlDialect();
function caller(overrides: Partial<TrpcContext> = {}) {
  return featureRequestsRouter.createCaller({
    req: { ip: "192.0.2.1", headers: {} } as never, res: {} as never,
    user: null, studentEmail: null, ...overrides,
  });
}
function admin() { return caller({ user: { id: 1, role: "admin" } as never }); }
const fixtures = Array.from({ length: 11 }, (_, i) => ({
  id: 11 - i, userId: null, email: null, ...input, problem: null, followUpAllowed: false,
  status: featureRequestStatuses[i % 4],
  createdAt: new Date(Date.UTC(2026, 10, 1) - i * 1000), updatedAt: new Date(Date.UTC(2026, 10, 1)),
}));
function arrange() {
  let selected = fixtures;
  let limit = 100;
  let offset = 0;
  const query = {
    from: vi.fn(() => query),
    where: vi.fn((condition: any) => {
      if (condition) {
        const sql = dialect.sqlToQuery(condition);
        selected = fixtures.filter(row => row.status === sql.params[0]);
      }
      return query;
    }),
    orderBy: vi.fn(() => query),
    limit: vi.fn((n: number) => { limit = n; return query; }),
    offset: vi.fn((n: number) => { offset = n; return query; }),
    then: (resolve: (value: typeof fixtures) => unknown) => Promise.resolve(selected.slice(offset, offset + limit)).then(resolve),
  };
  const values = vi.fn().mockResolvedValue([{ affectedRows: 1, insertId: 12 }]);
  const updateWhere = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
  const set = vi.fn(() => ({ where: updateWhere }));
  const db = { insert: vi.fn(() => ({ values })), select: vi.fn(() => query), update: vi.fn(() => ({ set })) };
  mocks.getDb.mockResolvedValue(db);
  return { db, query, values, updateWhere, set };
}
beforeEach(() => { vi.clearAllMocks(); resetFeatureRequestLimiterForTests(); arrange(); });
afterEach(() => { vi.useRealTimers(); });

describe("feature request learner submissions", () => {
  it("stores a separate anonymous request without a rating or identity and uses DB timestamps", async () => {
    const q = arrange();
    expect(await caller().submit(input)).toEqual({ success: true });
    expect(q.db.insert).toHaveBeenCalledWith(featureRequests);
    expect(q.values).toHaveBeenCalledWith({ ...input, userId: null, email: null, problem: null, followUpAllowed: false, status: "new" });
    expect(q.values.mock.calls[0][0]).not.toHaveProperty("createdAt");
    expect(q.values.mock.calls[0][0]).not.toHaveProperty("rating");
  });
  it("prefers verified OTP identity without associating an unrelated OAuth account", async () => {
    const q = arrange();
    await caller({ studentEmail: "OTP@echelon.test", user: { id: 9, role: "user", email: "oauth@echelon.test" } as never })
      .submit({ ...input, followUpAllowed: true });
    expect(q.values.mock.calls[0][0]).toMatchObject({ email: "otp@echelon.test", userId: null, followUpAllowed: true });
  });
  it("retains the signed-in user ID when normalized OTP and OAuth emails match", async () => {
    const q = arrange();
    await caller({ studentEmail: "OTP@echelon.test", user: { id: 9, role: "user", email: " otp@echelon.test " } as never })
      .submit(input);
    expect(q.values.mock.calls[0][0]).toMatchObject({ email: "otp@echelon.test", userId: 9 });
  });
  it("uses OAuth email when no verified email session exists", async () => {
    const q = arrange();
    await caller({ user: { id: 9, role: "user", email: "oauth@echelon.test" } as never }).submit({ ...input, followUpAllowed: true });
    expect(q.values.mock.calls[0][0]).toMatchObject({ email: "oauth@echelon.test", userId: 9 });
  });
  it("accepts verified-email learners without an OAuth account", async () => {
    const q = arrange();
    await caller({ studentEmail: "otp@echelon.test" }).submit({ ...input, followUpAllowed: true });
    expect(q.values.mock.calls[0][0]).toMatchObject({ email: "otp@echelon.test", userId: null });
  });
  it.each([{}, { user: { id: 9, role: "user", email: null } }, { studentEmail: "invalid" }])
    ("rejects follow-up without a valid server-verified email: %j", async context => {
      await expect(caller(context as never).submit({ ...input, followUpAllowed: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(mocks.getDb).not.toHaveBeenCalled();
    });
  it.each(["email", "userId", "status", "rating", "createdAt", "accessToken"])("rejects forged %s", async field => {
    await expect(caller().submit({ ...input, [field]: "forged" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("trims text and persists an empty optional problem as null", async () => {
    const q = arrange();
    await caller().submit({ ...input, courseKey: " oit ", pagePath: " /dashboard ", suggestion: "  New idea  ", problem: "  " });
    expect(q.values.mock.calls[0][0]).toMatchObject({ courseKey: "oit", pagePath: "/dashboard", suggestion: "New idea", problem: null });
  });
  it.each(["dashboard", "quick10", "practice"] as const)("accepts source %s", async source => {
    await expect(caller().submit({ ...input, source })).resolves.toEqual({ success: true });
  });
  it("accepts exact text and path boundaries", async () => {
    const path = "/" + Array(16).fill("a".repeat(15)).join("/");
    expect(path.length).toBe(256);
    await expect(caller().submit({ ...input, courseKey: "a".repeat(64), pagePath: path, suggestion: "a".repeat(2000), problem: "a".repeat(1000) })).resolves.toEqual({ success: true });
    await expect(caller().submit({ ...input, suggestion: "abc" })).resolves.toEqual({ success: true });
  });
  it.each([
    { suggestion: "" }, { suggestion: "   " }, { suggestion: "ab" }, { suggestion: "a".repeat(2001) },
    { problem: "a".repeat(1001) }, { courseKey: "" }, { courseKey: "a".repeat(65) },
    { source: "other" }, { pagePath: "" }, { pagePath: "/".repeat(257) }, { followUpAllowed: "yes" },
  ])("rejects invalid bounded learner input %j", async invalid => {
    await expect(caller().submit({ ...input, ...invalid } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it.each([
    "/dashboard?token=private", "/practice#secret", "https://example.test/dashboard", "//example.test", "dashboard",
    "/dashboard%3Ftoken%3Dprivate", "/dashboard%253Ftoken", "/auth/callback", "/magic-link/abc", "/token/private",
    "/dashboard/eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.signature", "/dashboard\\secret", "/dashboard\nprivate",
  ])("rejects unsafe pathname %s", async pagePath => {
    await expect(caller().submit({ ...input, pagePath })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("rejects unavailable or failed storage rather than acknowledging", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(caller().submit(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    const q = arrange();
    q.values.mockRejectedValueOnce(new Error("Synthetic insert failure"));
    await expect(caller().submit(input)).rejects.toThrow("Synthetic insert failure");
    q.values.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(caller().submit(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("feature request admin queue", () => {
  it.each([null, "user"] as const)("rejects %s on both admin procedures", async role => {
    const actor = caller({ user: role ? { id: 3, role } as never : null, studentEmail: "learner@echelon.test" });
    await expect(actor.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(actor.setStatus({ id: 1, status: "released" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("returns bounded items and pagination metadata with stable newest-first SQL order", async () => {
    const q = arrange();
    expect(await admin().list({ page: 2, limit: 3 })).toEqual({ items: fixtures.slice(3, 6), page: 2, limit: 3, hasMore: true });
    expect(q.query.from).toHaveBeenCalledWith(featureRequests);
    expect(q.query.where).toHaveBeenCalledWith(undefined);
    expect(q.query.limit).toHaveBeenCalledWith(4);
    expect(q.query.offset).toHaveBeenCalledWith(3);
    expect(q.query.orderBy.mock.calls[0].map(sql => dialect.sqlToQuery(sql).sql)).toEqual(["`feature_requests`.`createdAt` desc", "`feature_requests`.`id` desc"]);
  });
  it("uses safe defaults and returns an empty page beyond the end", async () => {
    expect(await admin().list()).toEqual({ items: fixtures, page: 1, limit: 50, hasMore: false });
    arrange();
    expect(await admin().list({ page: 10, limit: 3 })).toEqual({ items: [], page: 10, limit: 3, hasMore: false });
  });
  it.each(featureRequestStatuses)("filters %s before pagination and updates that status", async status => {
    const q = arrange();
    const matching = fixtures.filter(row => row.status === status);
    expect(await admin().list({ status, limit: 2 })).toEqual({ items: matching.slice(0, 2), page: 1, limit: 2, hasMore: matching.length > 2 });
    expect(dialect.sqlToQuery(q.query.where.mock.calls[0][0])).toMatchObject({ params: [status], sql: "`feature_requests`.`status` = ?" });
    expect(q.query.where.mock.invocationCallOrder[0]).toBeLessThan(q.query.limit.mock.invocationCallOrder[0]);
    expect(await admin().setStatus({ id: 2, status })).toEqual({ success: true });
    expect(q.db.update).toHaveBeenCalledWith(featureRequests);
    expect(q.set).toHaveBeenCalledWith({ status });
    expect(dialect.sqlToQuery(q.updateWhere.mock.calls[0][0])).toMatchObject({ params: [2], sql: "`feature_requests`.`id` = ?" });
  });
  it.each([{ limit: 101 }, { limit: 0 }, { page: 0 }, { page: 1.5 }, { page: 100001 }, { status: "unknown" }])("rejects invalid list filter %j", async filters => {
    await expect(admin().list(filters as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it.each([{ id: 0, status: "new" }, { id: 1, status: "New" }, { id: 1, status: "new", email: "forged" }])("rejects invalid status update %j", async update => {
    await expect(admin().setStatus(update as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not acknowledge a missing request, malformed result, DB failure or missing DB", async () => {
    const q = arrange();
    q.updateWhere.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(admin().setStatus({ id: 99, status: "planned" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    q.updateWhere.mockResolvedValueOnce([{}]);
    await expect(admin().setStatus({ id: 99, status: "planned" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    q.updateWhere.mockRejectedValueOnce(new Error("Synthetic update failure"));
    await expect(admin().setStatus({ id: 99, status: "planned" })).rejects.toThrow("Synthetic update failure");
    mocks.getDb.mockResolvedValue(null);
    await expect(admin().list({})).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    await expect(admin().setStatus({ id: 99, status: "planned" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("feature request abuse controls and schema", () => {
  it("allows three per ten minutes and rejects the fourth, ignoring forged identity headers", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
    for (let i = 0; i < 3; i++) await caller().submit(input);
    await expect(caller({ req: { ip: "192.0.2.1", headers: { "x-forwarded-for": "192.0.2.99", "x-student-email": "fake@echelon.test" } } as never }).submit(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    vi.advanceTimersByTime(10 * 60 * 1000);
    await expect(caller().submit(input)).resolves.toEqual({ success: true });
  });
  it("keeps verified learners independent of a shared IP but limits one learner across IPs", async () => {
    for (let i = 0; i < 3; i++) await caller({ studentEmail: "one@echelon.test" }).submit(input);
    await expect(caller({ studentEmail: "one@echelon.test", req: { ip: "192.0.2.99" } as never }).submit(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(caller({ studentEmail: "two@echelon.test" }).submit(input)).resolves.toEqual({ success: true });
    resetFeatureRequestLimiterForTests();
    await expect(caller({ studentEmail: "one@echelon.test" }).submit(input)).resolves.toEqual({ success: true });
  });
  it("has a separate table, DB-owned timestamps, status/date index, and four display labels", () => {
    const config = getTableConfig(featureRequests);
    expect(config.name).toBe("feature_requests");
    expect(config.columns.map(col => col.name)).not.toContain("rating");
    expect(featureRequests.createdAt.hasDefault).toBe(true);
    expect(featureRequests.updatedAt.hasDefault).toBe(true);
    expect(featureRequests.status.enumValues).toEqual([...featureRequestStatuses]);
    expect(featureRequestStatuses.map(status => featureRequestStatusLabels[status])).toEqual(["New", "Reviewing", "Planned", "Released"]);
    expect(config.indexes[0].config.columns.map(col => "name" in col ? col.name : "")).toEqual(["status", "createdAt"]);
  });
});
