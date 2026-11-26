import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { aiChatSessions } from "../drizzle/schema";
import * as access from "./_core/access";
import * as primaryFocus from "./_core/studyFocus";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);

import { dashboardRouter } from "./routers/dashboardRouter";

const email = "learner-fixture@echelon.test";
const context = (user: { id: number; email?: string | null } | null = null, studentEmail: string | null = null) => ({
  user, studentEmail, req: { headers: {} }, res: {},
}) as any;
const dialect = new MySqlDialect();
const saved = (id: number, userId: number | null, studentEmail: string | null) => ({
  id, userId, studentEmail, examType: "class1-ww", sessionStart: new Date(`2026-11-01T12:00:00.000Z`),
  messageCount: 4, topicsCovered: '["Pumps"]', summary: `Saved fixture session ${id}`,
});

function queryFixture(rows = [saved(1, null, email)]) {
  let query: ReturnType<MySqlDialect["sqlToQuery"]>;
  const chain = {
    from: vi.fn((table) => { expect(table).toBe(aiChatSessions); return chain; }),
    where: vi.fn((condition) => { query = dialect.sqlToQuery(condition); return chain; }),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(async (limit: number) => {
      const scoped = query.sql.includes("is null")
        ? rows.filter(row => row.userId === null && row.studentEmail === query.params[0])
        : rows.filter(row => row.userId === query.params[0]);
      return scoped.sort((a, b) => b.id - a.id).slice(0, limit);
    }),
  };
  const select = vi.fn(() => chain);
  mocks.getDb.mockResolvedValue({ select });
  return { chain, select, query: () => query! };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("dashboard saved tutor history", () => {
  it("reads only unowned rows for the server-verified email, with deterministic order and a ten-row cap", async () => {
    const fixtures = Array.from({ length: 14 }, (_, index) => saved(index + 1, null, email));
    fixtures.push(saved(99, 7, email), saved(100, null, "other-fixture@echelon.test"));
    const fixture = queryFixture(fixtures);
    const result = await dashboardRouter.createCaller(context(null, email)).aiSessionHistory();
    expect(result.map(row => row.id)).toEqual([14, 13, 12, 11, 10, 9, 8, 7, 6, 5]);
    expect(fixture.query().params).toEqual([email]);
    expect(fixture.query().sql).toContain("`ai_chat_sessions`.`userId` is null");
    expect(fixture.query().sql).toContain("`ai_chat_sessions`.`studentEmail` = ?");
    expect(fixture.query().sql).not.toMatch(/\bor\b/i);
    expect(fixture.chain.limit).toHaveBeenCalledWith(10);
    expect(fixture.chain.orderBy.mock.calls[0]).toHaveLength(2);
    expect(result[0]).toMatchObject({ examType: "class1-ww", messageCount: 4, summary: "Saved fixture session 14" });
  });

  it("reads account ID only even when a different verified email session also exists", async () => {
    const fixture = queryFixture([saved(1, 7, null), saved(2, null, email), saved(3, 8, email)]);
    const result = await dashboardRouter.createCaller(context({ id: 7, email }, email)).aiSessionHistory();
    expect(result.map(row => row.id)).toEqual([1]);
    expect(fixture.query().params).toEqual([7]);
    expect(fixture.query().sql).not.toContain("studentEmail");
    expect(fixture.query().sql).not.toMatch(/\bor\b/i);
  });

  it("supports account history without any account email", async () => {
    queryFixture([saved(4, 7, null)]);
    expect(await dashboardRouter.createCaller(context({ id: 7, email: null })).aiSessionHistory())
      .toMatchObject([{ id: 4 }]);
  });

  it("rejects anonymous and request-supplied email before accessing storage", async () => {
    const ctx = context();
    ctx.req.headers = { "x-student-email": email, cookie: `studentEmail=${email}` };
    ctx.req.body = { email };
    await expect(dashboardRouter.createCaller(ctx).aiSessionHistory()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("does not claim history is empty when storage is unavailable", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(dashboardRouter.createCaller(context(null, email)).aiSessionHistory())
      .rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("does not fabricate a current session date for a missing recorded date", async () => {
    queryFixture([{ ...saved(1, null, email), sessionStart: null } as any]);
    expect(await dashboardRouter.createCaller(context(null, email)).aiSessionHistory())
      .toMatchObject([{ sessionStart: null }]);
  });
});

describe("dashboard unresolved course destinations", () => {
  it.each([null, "unknown-course"])("does not fall back to OIT for a %s primary focus", async courseKey => {
    vi.spyOn(access, "resolveEntitlementsByEmail").mockResolvedValue({ unlockedExamTypes: [] } as any);
    vi.spyOn(primaryFocus, "resolvePrimaryStudyFocus").mockResolvedValue({ courseKey, examType: courseKey, source: "none" } as any);
    const result = await dashboardRouter.createCaller(context(null, email)).studyFocus();
    expect(result.quizPath).toBe("/account");
    expect(result.mockExamPath).toBe("/account");
  });

  it("resolves a legacy course alias before building study-plan quiz links", async () => {
    const chain = {
      select: () => chain, from: () => chain, where: () => chain, orderBy: () => chain,
      groupBy: async () => [{ topic: "Pumps & Flow", total: 5, correct: 1 }], limit: async () => [],
      then: (resolve: (rows: any[]) => unknown) => Promise.resolve([{ count: 0 }]).then(resolve),
    };
    mocks.getDb.mockResolvedValue({ select: () => chain });
    const result = await dashboardRouter.createCaller(context(null, email)).studyPlan({ examType: "class1-wastewater" });
    expect(result?.examType).toBe("class1-ww");
    expect(result?.recommendations[0].actionHref).toBe("/class1-ww?topic=Pumps%20%26%20Flow");
  });

  it("rejects an explicit unknown study course without querying analytics", async () => {
    const select = vi.fn();
    mocks.getDb.mockResolvedValue({ select });
    await expect(dashboardRouter.createCaller(context(null, email)).studyPlan({ examType: "unknown-course" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(select).not.toHaveBeenCalled();
  });
});
