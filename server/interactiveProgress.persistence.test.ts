import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { interactiveDailyActivity } from "../drizzle/schema";
import { getDb } from "./db";
import { dueItemIds, readProgress, saveResults } from "./interactiveProgress";
vi.mock("./db", () => ({ getDb: vi.fn() }));
const now = new Date("2026-11-15T12:00:00Z");
const dialect = new MySqlDialect();
beforeEach(() => vi.clearAllMocks());
describe("transactional saved answers", () => {
  it("issues atomic per-item increments with dueAt before box, even for concurrent batches", async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const daily: unknown[] = [];
    const tx = {
      execute: vi.fn(async query => { statements.push(dialect.sqlToQuery(query)); }),
      insert: vi.fn(table => {
        expect(table).toBe(interactiveDailyActivity);
        return { values: (value: unknown) => ({ onDuplicateKeyUpdate: async (update: unknown) => { daily.push({ value, update }); } }) };
      }),
    };
    const db = { transaction: vi.fn(async callback => callback(tx)), select: vi.fn() };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const results = [{ itemId: "same-item", mode: "rapid-swipe", correct: true }];
    await Promise.all(Array.from({ length: 12 }, () => saveResults("user:1", "oit", results, "2026-11-15", now)));
    expect(db.transaction).toHaveBeenCalledTimes(12);
    expect(db.select).not.toHaveBeenCalled();
    expect(statements).toHaveLength(12);
    expect(daily).toHaveLength(12);
    for (const query of statements) {
      expect(query.sql).toContain("ON DUPLICATE KEY UPDATE");
      expect(query.sql).toContain("attempts = attempts + 1");
      expect(query.sql).toContain("correctCount = correctCount + ?");
      expect(query.sql.indexOf("dueAt = TIMESTAMPADD")).toBeLessThan(query.sql.indexOf("box = LEAST"));
      expect(query.sql).not.toContain("user:1"); // identity remains parameterized
      expect(query.params).toContain("user:1");
    }
    // This verifies concurrent requests use SQL-side arithmetic, not stale read/overwrite.
    // Actual InnoDB locking is not simulated and needs a separately authorized local DB rehearsal.
  });
  it("rejects the whole transaction when daily totals fail (no successful acknowledgement)", async () => {
    const tx = { execute: vi.fn(async () => undefined), insert: () => ({ values: () => ({ onDuplicateKeyUpdate: async () => { throw new Error("daily failed"); } }) }) };
    const db = { transaction: vi.fn(async callback => callback(tx)) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(saveResults("user:1", "oit", [{ itemId: "one", mode: "rapid-swipe", correct: false }], "2026-11-15", now)).rejects.toThrow("daily failed");
    expect(db.transaction).toHaveBeenCalledOnce();
  });
});
describe("due card and replay consistency", () => {
  it("counts overdue solid boxes 3 and 4 as due and includes them in replay", async () => {
    const rows = [0, 3, 4].map(box => ({ itemId: `box-${box}`, mode: "rapid-swipe", box, attempts: 5, correctCount: 4, dueAt: new Date(now.getTime() - 1) }));
    const replayWhere = vi.fn((_predicate: unknown) => ({ orderBy: () => ({ limit: async () => rows.map(({ itemId }) => ({ itemId })) }) }));
    let call = 0;
    vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: () => ({ where: (...args: unknown[]) => {
      call++;
      if (call === 1) return Promise.resolve(rows);
      if (call === 2) return Promise.resolve([]);
      return replayWhere(args[0]);
    } }) }) } as never);
    const summary = await readProgress("user:1", "oit", "2026-11-15", now);
    const ids = await dueItemIds("user:1", "oit", "rapid-swipe", 50, now);
    expect(summary.dueCount).toBe(3);
    expect(summary.modes[0]).toMatchObject({ due: 3, solid: 2 });
    expect(ids).toEqual(["box-0", "box-3", "box-4"]);
    const predicate = dialect.sqlToQuery(replayWhere.mock.calls[0][0] as never).sql;
    expect(predicate).toContain("dueAt");
    expect(predicate).not.toContain("box");
  });
});
