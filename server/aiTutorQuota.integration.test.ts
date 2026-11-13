import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { and, eq, inArray } from "drizzle-orm";
import { productAnalyticsEvents } from "../drizzle/schema";
import { assertAuditIntegrationDatabaseTarget } from "./auditIntegrationGuard";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import {
  enforceAiTutorDailyQuota,
  recordAiTutorUsage,
  releaseAiTutorReservation,
} from "./_core/aiTutorPolicy";
import { hashAnalyticsEmail } from "./analytics";

// A test must never adopt a deployment database merely because DATABASE_URL exists.
const enabled = process.env.AUDIT_INTEGRATION_TEST_DB === "1";
const rawUrl = process.env.DATABASE_URL;
if (enabled) {
  assertAuditIntegrationDatabaseTarget(rawUrl, url => /^\/echelon_audit_[a-z0-9_]+$/.test(url.pathname));
}
const databaseSuite = describe.skipIf(!enabled);

let pool: mysql.Pool;
let db: MySql2Database;
const runId = randomUUID().replaceAll("-", "");
const email = `tutor-quota-${runId}@example.test`;
const emailHash = hashAnalyticsEmail(email);
const usage = { examType: "class1-water", productKey: "synthetic-class1", extra: { questionNum: 7, patternMode: false } };

beforeAll(async () => {
  if (!enabled) return;
  pool = mysql.createPool({ uri: rawUrl!, connectionLimit: 12 });
  db = drizzle(pool) as unknown as MySql2Database;
  mocks.getDb.mockResolvedValue(db);
});

afterAll(async () => {
  if (!enabled) return;
  await db.delete(productAnalyticsEvents).where(eq(productAnalyticsEvents.emailHash, emailHash));
  await db.delete(productAnalyticsEvents).where(inArray(productAnalyticsEvents.emailHash,
    Array.from({ length: 8 }, (_, index) => hashAnalyticsEmail(`pool-${index}-${email}`))));
  await pool.end();
});

async function countToday() {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const rows = await db.select({ id: productAnalyticsEvents.id, metadata: productAnalyticsEvents.metadata })
    .from(productAnalyticsEvents)
    .where(and(eq(productAnalyticsEvents.eventName, "ai_tutor_message"), eq(productAnalyticsEvents.emailHash, emailHash)));
  return rows;
}

databaseSuite("AI Tutor daily allowance is reserved atomically", () => {
  it("admits exactly the limit when many requests arrive at once", async () => {
    const limit = 3;
    const identity = { userId: null, email, anonymousId: null };
    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () => enforceAiTutorDailyQuota(identity, { limit, usage })),
    );
    const granted = attempts.filter(result => result.status === "fulfilled");
    const refused = attempts.filter(result => result.status === "rejected");
    expect(granted).toHaveLength(limit);
    expect(refused).toHaveLength(10 - limit);
    for (const result of refused) {
      expect((result as PromiseRejectedResult).reason).toMatchObject({ code: "TOO_MANY_REQUESTS" });
    }
    const rows = await countToday();
    expect(rows).toHaveLength(limit);
    expect(rows.every(row => JSON.parse(row.metadata ?? "{}").reserved === true)).toBe(true);
  });

  it("does not deadlock the pool when more learners arrive at once than there are connections", async () => {
    // A two-connection pool with eight different learners. If any statement
    // after the lock went back to the pool for a second connection, the first
    // two requests would hold both connections while waiting for a third that
    // can never free, and this test would time out.
    const smallPool = mysql.createPool({ uri: rawUrl!, connectionLimit: 2 });
    const smallDb = drizzle(smallPool) as unknown as MySql2Database;
    mocks.getDb.mockResolvedValue(smallDb);
    try {
      const results = await Promise.race([
        Promise.allSettled(Array.from({ length: 8 }, (_, index) =>
          enforceAiTutorDailyQuota({ userId: null, email: `pool-${index}-${email}`, anonymousId: null }, { limit: 3, usage }))),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("pool deadlock: reservations did not complete in 15s")), 15_000)),
      ]);
      expect(results.every(result => result.status === "fulfilled")).toBe(true);
    } finally {
      mocks.getDb.mockResolvedValue(db);
      await smallPool.end();
    }
  }, 20_000);
  it("finalizes a reservation after a reply and releases one after a provider failure", async () => {
    const [first, second] = await countToday();
    await recordAiTutorUsage({ eventId: first.id }, usage);
    await releaseAiTutorReservation({ eventId: second.id });
    const rows = await countToday();
    expect(rows).toHaveLength(2);
    const finalized = rows.find(row => row.id === first.id);
    expect(JSON.parse(finalized?.metadata ?? "{}")).toMatchObject({ reserved: false, questionNum: 7 });
    // The released slot is available again, so one more message is admitted and the next is refused.
    const identity = { userId: null, email, anonymousId: null };
    await expect(enforceAiTutorDailyQuota(identity, { limit: 3, usage })).resolves.toMatchObject({ eventId: expect.any(Number) });
    await expect(enforceAiTutorDailyQuota(identity, { limit: 3, usage })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
