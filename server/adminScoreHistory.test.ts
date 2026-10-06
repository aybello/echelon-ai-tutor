import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { examResults, users } from "../drizzle/schema";

const dbMock = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMock);
import { adminRouter } from "./routers/admin";

function caller(role: "admin" | "user" | null) {
  return adminRouter.createCaller({ req: {} as never, res: {} as never, user: role ? { id: 1, role } as never : null, studentEmail: null });
}
const createdAt = new Date("2026-10-06T07:00:00.000Z");
function record(overrides: Record<string, unknown> = {}) {
  return { id: 41, userId: 12, studentEmail: "recorded@example.test", sessionId: "synthetic-exam", examType: "oit", stream: "water", score: 72, total: 100, passed: "yes", timeTakenSeconds: 1800, moduleBreakdown: '{"Math":{"correct":4,"total":5}}', createdAt, learnerName: "  Example Learner  ", accountEmail: "account@example.test", ...overrides };
}
function mockQuery(rows: ReturnType<typeof record>[]) {
  const query = { from: vi.fn(), leftJoin: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn().mockResolvedValue(rows) };
  for (const key of ["from", "leftJoin", "where", "orderBy"] as const) query[key].mockReturnValue(query);
  const select = vi.fn().mockReturnValue(query);
  dbMock.getDb.mockResolvedValue({ select });
  return { select, ...query };
}

beforeEach(() => vi.clearAllMocks());
describe("protected admin score history", () => {
  it.each([null, "user"] as const)("refuses %s before reading learner identity", async role => {
    await expect(caller(role).getScoreHistory({ limit: 25, examType: "all" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMock.getDb).not.toHaveBeenCalled();
  });
  it("joins only the recorded account ID, selects name/email only, and preserves scores and timestamp", async () => {
    const q = mockQuery([record()]);
    const result = await caller("admin").getScoreHistory({ limit: 25, examType: "all" });
    expect(q.select).toHaveBeenCalledOnce();
    expect(q.select.mock.calls[0][0]).toEqual({ ...getTableColumns(examResults), learnerName: users.name, accountEmail: users.email });
    expect(q.from).toHaveBeenCalledWith(examResults);
    expect(q.leftJoin.mock.calls[0][0]).toBe(users);
    const dialect = new MySqlDialect();
    const join = dialect.sqlToQuery(q.leftJoin.mock.calls[0][1]);
    expect(join.sql).toBe('`exam_results`.`userId` = `users`.`id`');
    expect(q.where).toHaveBeenCalledWith(undefined);
    expect(q.limit).toHaveBeenCalledWith(25);
    expect(result[0]).toMatchObject({ id: 41, learnerName: "Example Learner", learnerEmail: "recorded@example.test", score: 72, total: 100, passed: "yes", timeTakenSeconds: 1800, createdAt, moduleBreakdown: { Math: { correct: 4, total: 5 } } });
    expect(result[0]).not.toHaveProperty("accountEmail");
    expect(result[0]).not.toHaveProperty("openId");
  });
  it("retains email-only, deleted-account and anonymous historical score rows without invented names", async () => {
    mockQuery([
      record({ userId: null, learnerName: null, accountEmail: null }),
      record({ userId: 99, learnerName: null, accountEmail: null }),
      record({ studentEmail: null, learnerName: null, accountEmail: "  account@example.test  " }),
      record({ userId: null, studentEmail: null, learnerName: " ", accountEmail: null }),
    ]);
    const rows = await caller("admin").getScoreHistory({ limit: 25, examType: "all" });
    expect(rows).toHaveLength(4);
    expect(rows.map(r => r.learnerName)).toEqual([null, null, null, null]);
    expect(rows.map(r => r.learnerEmail)).toEqual(["recorded@example.test", "recorded@example.test", "account@example.test", null]);
  });
  it("filters in SQL before the limit and uses a deterministic newest-first tie breaker", async () => {
    const q = mockQuery([]);
    await caller("admin").getScoreHistory({ limit: 1, examType: "oit" });
    const dialect = new MySqlDialect();
    expect(dialect.sqlToQuery(q.where.mock.calls[0][0])).toMatchObject({ sql: '`exam_results`.`examType` = ?', params: ["oit"] });
    expect(q.orderBy.mock.calls[0].map(v => dialect.sqlToQuery(v).sql)).toEqual(['`exam_results`.`createdAt` desc', '`exam_results`.`id` desc']);
  });
  it("reports unavailable storage rather than fabricating an empty history", async () => {
    dbMock.getDb.mockResolvedValue(null);
    await expect(caller("admin").getScoreHistory({ limit: 25, examType: "all" })).rejects.toThrow("Database unavailable");
  });
});
