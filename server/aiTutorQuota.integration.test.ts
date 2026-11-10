import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { and, eq } from "drizzle-orm";
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
