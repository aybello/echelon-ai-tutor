import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression cover for a money defect found on 2026-10-16.
 *
 * The free AI Tutor preview is capped at AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT
 * messages. Anonymous identity is written to product_analytics_events.anonymousHash
 * by resolveAnalyticsHashes in server/analytics.ts, and emailHash is left NULL for a
 * signed-out visitor.
 *
 * The quota read used to compare the anonymous hash against emailHash. That column is
 * always NULL for the visitor being counted, so the count was always zero and the free
 * cap never fired. Verified against the authoritative production database: a single
 * anonymous visitor took 14 free tutor messages in one day against a cap of 3, and 21
 * messages in total were served beyond the cap.
 *
 * These tests exercise the real query builder and assert on the SQL that reaches the
 * database, so a future edit that points the filter back at the wrong column fails here
 * rather than quietly giving the product away.
 */

const captured: { sql: string[] } = { sql: [] };
let rowTotal = 0;

vi.mock("../db", () => ({
  getDb: async () => {
    const builder = {
      from() {
        return this;
      },
      where(condition: unknown) {
        // Walk the drizzle condition tree and record every column it touches.
        // This is what actually reaches the database, so the assertion below
        // cannot pass unless the filter really targets the right column.
        const seen = new Set<unknown>();
        const columns: string[] = [];
        const walk = (node: unknown): void => {
          if (!node || typeof node !== "object" || seen.has(node)) return;
          seen.add(node);
          const record = node as Record<string, unknown>;
          if (typeof record.name === "string" && record.table) {
            columns.push(record.name);
            // A column carries a back reference to its table, which carries every
            // other column. Descending into it would report columns the filter
            // never touches and make the assertion meaningless.
            return;
          }
          for (const [key, value] of Object.entries(record)) {
            if (key === "table" || key === "_" || key === "schema") continue;
            if (Array.isArray(value)) value.forEach(walk);
            else walk(value);
          }
        };
        walk(condition);
        captured.sql.push(columns.join(" "));
        return Promise.resolve([{ total: rowTotal }]);
      },
      then(resolve: (value: unknown) => unknown) {
        return Promise.resolve([{ total: rowTotal }]).then(resolve);
      },
    };
    return { select: () => builder };
  },
}));

const { enforceAiTutorDailyQuota, AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT } = await import(
  "./aiTutorPolicy"
);

afterEach(() => {
  captured.sql = [];
  rowTotal = 0;
});

function filterSql(): string {
  return captured.sql.join(" ");
}

describe("anonymous free preview quota", () => {
  it("counts an anonymous visitor on the column their identity is actually stored in", async () => {
    rowTotal = 0;
    await enforceAiTutorDailyQuota(
      { userId: null, email: null, anonymousId: "visitor-fixture" },
      { limit: AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT },
    );

    const sql = filterSql();
    expect(sql).toContain("anonymousHash");
    // Reading emailHash for an anonymous visitor always matched zero rows, which is
    // exactly how the cap was bypassed in production.
    expect(sql).not.toContain("emailHash");
  });

  it("blocks an anonymous visitor who already used the free messages", async () => {
    rowTotal = AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT;
    await expect(
      enforceAiTutorDailyQuota(
        { userId: null, email: null, anonymousId: "visitor-fixture" },
        { limit: AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT },
      ),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("blocks an anonymous visitor well past the cap", async () => {
    // The real production case: 14 messages against a cap of 3.
    rowTotal = 14;
    await expect(
      enforceAiTutorDailyQuota(
        { userId: null, email: null, anonymousId: "visitor-fixture" },
        { limit: AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT },
      ),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("still lets an anonymous visitor through below the cap", async () => {
    rowTotal = AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT - 1;
    await expect(
      enforceAiTutorDailyQuota(
        { userId: null, email: null, anonymousId: "visitor-fixture" },
        { limit: AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT },
      ),
    ).resolves.toBeUndefined();
  });

  it("keeps counting a known email on the email column", async () => {
    rowTotal = 0;
    await enforceAiTutorDailyQuota({
      userId: null,
      email: "learner@echelon.test",
      anonymousId: "visitor-fixture",
    });
    const sql = filterSql();
    expect(sql).toContain("emailHash");
  });

  it("keeps counting a signed-in learner on the user column", async () => {
    rowTotal = 0;
    await enforceAiTutorDailyQuota({
      userId: "user-fixture",
      email: null,
      anonymousId: null,
    });
    expect(filterSql()).toContain("userId");
  });
});
