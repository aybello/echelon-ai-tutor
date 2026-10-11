import { describe, expect, it, vi } from "vitest";
import { MAX_EXAM_DATE_DAYS_AHEAD, savePurchaseExamDate, validateNewExamDate } from "./purchaseExamDate";

const NOW = new Date("2026-10-10T15:00:00.000Z");

function dateOffset(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

describe("validateNewExamDate", () => {
  it("accepts a date a few weeks ahead", () => {
    expect(validateNewExamDate(dateOffset(30), NOW)).toEqual({ ok: true, date: dateOffset(30) });
  });

  it("accepts today so a learner sitting an exam this week is not rejected", () => {
    expect(validateNewExamDate(dateOffset(0), NOW).ok).toBe(true);
  });

  it("accepts yesterday to absorb the local versus UTC date gap", () => {
    expect(validateNewExamDate(dateOffset(-1), NOW).ok).toBe(true);
  });

  it("rejects a date that has clearly passed", () => {
    const result = validateNewExamDate(dateOffset(-5), NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/passed/i);
  });

  it("rejects a date beyond the two year window", () => {
    const result = validateNewExamDate(dateOffset(MAX_EXAM_DATE_DAYS_AHEAD + 5), NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/far/i);
  });

  it("rejects an impossible calendar date instead of rolling it forward", () => {
    expect(validateNewExamDate("2026-02-30", NOW).ok).toBe(false);
  });

  it("rejects text that is not a date", () => {
    expect(validateNewExamDate("next week", NOW).ok).toBe(false);
  });
});

/**
 * A small stand-in for the database. select() answers the purchase lookup
 * first and the existing date lookup second, in the order the code asks.
 */
function fakeDb(opts: { purchase?: Record<string, unknown> | null; existingDate?: Date | null }) {
  const answers: unknown[][] = [
    opts.purchase ? [opts.purchase] : [],
    opts.existingDate ? [{ examDate: opts.existingDate }] : [],
  ];
  const execute = vi.fn(async () => undefined);
  const db = {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => answers.shift() ?? [] }) }) }),
    execute,
    delete: vi.fn(),
  };
  return { db: db as any, execute };
}

const activePurchase = {
  email: "Learner@Example.com",
  productKey: "oit",
  status: "active",
  refundedAt: null,
};

describe("savePurchaseExamDate", () => {
  it("saves a new date for an active purchase and keys it to the normalised email", async () => {
    const { db, execute } = fakeDb({ purchase: activePurchase });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result.status).toBe("saved");
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("returns the productKey it saved against so analytics can attribute it", async () => {
    const { db } = fakeDb({ purchase: activePurchase });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result).toMatchObject({ status: "saved", productKey: "oit" });
  });

  it("never overwrites a date already on file", async () => {
    const { db, execute } = fakeDb({ purchase: activePurchase, existingDate: new Date("2026-12-01T12:00:00.000Z") });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result).toEqual({ status: "already_set", examDate: "2026-12-01" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects an invalid date before touching the database", async () => {
    const { db, execute } = fakeDb({ purchase: activePurchase });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(-30) }, NOW);
    expect(result.status).toBe("invalid_date");
    expect(execute).not.toHaveBeenCalled();
  });

  it("does nothing when the session id matches no purchase", async () => {
    const { db, execute } = fakeDb({ purchase: null });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_unknown1", examDate: dateOffset(40) }, NOW);
    expect(result.status).toBe("purchase_not_found");
    expect(execute).not.toHaveBeenCalled();
  });

  it("refuses a refunded purchase", async () => {
    const { db, execute } = fakeDb({ purchase: { ...activePurchase, refundedAt: new Date("2026-10-09T00:00:00Z") } });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result.status).toBe("purchase_not_found");
    expect(execute).not.toHaveBeenCalled();
  });

  it("refuses a purchase that is not active", async () => {
    const { db, execute } = fakeDb({ purchase: { ...activePurchase, status: "disputed" } });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result.status).toBe("purchase_not_found");
    expect(execute).not.toHaveBeenCalled();
  });

  it("refuses automated test purchases so synthetic rows never create reminders", async () => {
    const { db, execute } = fakeDb({ purchase: { ...activePurchase, email: "reliability-1@echelon.test" } });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result.status).toBe("purchase_not_found");
    expect(execute).not.toHaveBeenCalled();
  });

  it("does nothing for a product with no exam course", async () => {
    const { db, execute } = fakeDb({ purchase: { ...activePurchase, productKey: "not-a-real-course" } });
    const result = await savePurchaseExamDate(db, { sessionId: "cs_live_abc12345", examDate: dateOffset(40) }, NOW);
    expect(result.status).toBe("purchase_not_found");
    expect(execute).not.toHaveBeenCalled();
  });
});
