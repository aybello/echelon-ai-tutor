import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { userFeedback } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);
import { adminRouter } from "./routers/admin";

const fixtures = Array.from({ length: 210 }, (_, i) => ({
  id: 210 - i,
  userId: null,
  email: "feedback-fixture@echelon.test",
  examType: "oit",
  rating: i < 200 ? 5 : i === 209 ? 0 : i % 2 ? 1 : 2,
  comment: "Synthetic feedback fixture",
  feedbackType: "quiz_gate",
  province: "on",
  createdAt: new Date(Date.UTC(2026, 9, 18) - i * 1000),
}));
const dialect = new MySqlDialect();
function caller(role: "admin" | "user" | null = "admin") {
  return adminRouter.createCaller({ req: {} as never, res: {} as never,
    user: role ? { id: 1, role } as never : null, studentEmail: null });
}
function arrange(rows = fixtures) {
  let selected = rows;
  let limit = rows.length;
  let offset = 0;
  const q = {
    from: vi.fn(() => q),
    where: vi.fn((condition: any) => {
      if (condition) {
        const sql = dialect.sqlToQuery(condition);
        if (sql.sql === "`user_feedback`.`rating` <= ?") {
          selected = rows.filter(row => row.rating <= Number(sql.params[0]));
        }
      }
      return q;
    }),
    orderBy: vi.fn(() => q),
    limit: vi.fn((n: number) => { limit = n; return q; }),
    offset: vi.fn((n: number) => { offset = n; return q; }),
    then: (resolve: (value: typeof rows) => unknown) => Promise.resolve(selected.slice(offset, offset + limit)).then(resolve),
  };
  const select = vi.fn(() => q);
  mocks.getDb.mockResolvedValue({ select });
  return { ...q, select };
}
beforeEach(() => { vi.clearAllMocks(); arrange(); });

describe("admin feedback completeness", () => {
  it.each([null, "user"] as const)("rejects %s without accessing feedback", async role => {
    await expect(caller(role).getFeedback({ limit: 200 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("retains the default 200-row response and original fields", async () => {
    const rows = await caller().getFeedback({});
    expect(rows).toEqual(fixtures.slice(0, 200));
  });
  it("REGRESSION: page two returns the ten older records, not page one again", async () => {
    const first = await caller().getFeedback({ limit: 200 });
    const second = await caller().getFeedback({ limit: 200, page: 2 } as any);
    expect(second).toEqual(fixtures.slice(200));
    expect(new Set([...first, ...second].map(row => row.id)).size).toBe(210);
  });
  it("REGRESSION: low ratings beyond the newest 200 are filtered before pagination, including zero", async () => {
    const rows = await caller().getFeedback({ limit: 200, rating: "low" } as any);
    expect(rows).toEqual(fixtures.slice(200));
    expect(rows.map(row => row.rating)).toContain(0);
    expect(rows.map(row => row.rating)).toContain(1);
    expect(rows.map(row => row.rating)).toContain(2);
  });
  it("paginates filtered results without replaying or omitting rows", async () => {
    const pages = [];
    for (const page of [1, 2, 3, 4]) {
      arrange();
      pages.push(await caller().getFeedback({ limit: 4, page, rating: "low" } as any));
    }
    expect(pages.map(page => page.length)).toEqual([4, 4, 2, 0]);
    expect(pages.flat()).toEqual(fixtures.slice(200));
  });
  it("builds a feedback-only SQL filter, stable ordering and offset", async () => {
    const q = arrange();
    await caller().getFeedback({ limit: 3, page: 2, rating: "low" } as any);
    expect(q.from).toHaveBeenCalledWith(userFeedback);
    expect(dialect.sqlToQuery(q.where.mock.calls[0][0])).toMatchObject({ sql: "`user_feedback`.`rating` <= ?", params: [2] });
    expect(q.orderBy.mock.calls[0].map(value => dialect.sqlToQuery(value).sql)).toEqual(["`user_feedback`.`createdAt` desc", "`user_feedback`.`id` desc"]);
    expect(q.limit).toHaveBeenCalledWith(3);
    expect(q.offset).toHaveBeenCalledWith(3);
    expect(q.where.mock.invocationCallOrder[0]).toBeLessThan(q.limit.mock.invocationCallOrder[0]);
  });
  it("does not apply a low-rating condition to the default all view", async () => {
    const q = arrange();
    await caller().getFeedback({});
    expect(q.where).toHaveBeenCalledWith(undefined);
    expect(q.offset).toHaveBeenCalledWith(0);
  });
  it("returns an empty page past the end rather than replaying page one", async () => {
    expect(await caller().getFeedback({ page: 3, limit: 200 } as any)).toEqual([]);
  });
  it.each([
    { page: 0 }, { page: -1 }, { page: 1.5 }, { limit: 0 }, { limit: 501 }, { rating: "invalid" },
  ])("rejects invalid feedback input %j before accessing storage", async input => {
    await expect(caller().getFeedback(input as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("does not fabricate an empty queue when the database is unavailable", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(caller().getFeedback({ limit: 200 })).rejects.toThrow("Database unavailable");
  });
});
