import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { randomUUID } from "node:crypto";
const mocks = vi.hoisted(() => ({ persist: vi.fn(async (_payload: any) => {}), execute: vi.fn(), db: vi.fn() }));
vi.mock("./analytics", () => ({ persistAnalyticsEvent: mocks.persist }));
vi.mock("./db", () => ({ getDb: mocks.db }));
vi.mock("./_core/env", () => ({ ENV: { cookieSecret: "synthetic-game-analytics-key" } }));
import { gameIdentity, issueGameCapability, verifyGameCapability, recordGameActivity, readGameActivity } from "./gameAnalytics";
import { gameActivityInputSchema } from "../shared/gameAnalytics";
import { interactiveModes, type InteractiveSessionResponse } from "../shared/interactiveSessions";
import type { TrpcContext } from "./_core/context";
const ctx = { req: { headers: {} }, res: {}, user: null, studentEmail: null } as unknown as TrpcContext;
const visitorId = randomUUID();
const session = (mode = "rapid-swipe"): InteractiveSessionResponse => ({ sessionId: randomUUID(), courseKey: "oit", mode: mode as any, available: true, locked: false, version: "v1", totalAvailableCount: 2, examples: [{ id: "a", mode: "rapid-swipe", prompt: "Synthetic", correctAnswer: true, explanation: "Synthetic" }, { id: "b", mode: "rapid-swipe", prompt: "Synthetic", correctAnswer: true, explanation: "Synthetic" }], filters: { topicId: null, difficulty: null, requestedSize: 20 } });
function input(mode?: string) { return { capability: issueGameCapability(session(mode), ctx, visitorId)!, visitorId, round: 0, timed: false, event: { kind: "answer" as const, itemId: "a", sequence: 0 } }; }
beforeEach(() => { vi.clearAllMocks(); mocks.db.mockResolvedValue({ execute: mocks.execute }); mocks.execute.mockResolvedValue([[{ answered: 2 }], []]); });
describe("privacy-safe course game activity", () => {
  it.each(interactiveModes)("accepts actual play for %s without correctness or PII", async mode => {
    expect(await recordGameActivity(input(mode), ctx)).toEqual({ accepted: true });
    expect(mocks.persist).toHaveBeenCalledWith(expect.objectContaining({ event: "game_answered", productKey: "oit", identityHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    const payload = mocks.persist.mock.calls[0]![0] as any;
    expect(payload).not.toHaveProperty("email"); expect(payload).not.toHaveProperty("userId"); expect(payload.extra).not.toHaveProperty("correct");
  });
  it("rejects tampering, wrong browser, expired capability and unknown items", async () => {
    const value = input();
    expect(verifyGameCapability(value.capability + "x", ctx, visitorId)).toBeNull();
    expect(verifyGameCapability(value.capability, ctx, randomUUID())).toBeNull();
    expect(await recordGameActivity({ ...value, event: { ...value.event, itemId: "unknown" } }, ctx)).toEqual({ accepted: false });
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 7 * 3600000);
    expect(verifyGameCapability(value.capability, ctx, visitorId)).toBeNull(); vi.restoreAllMocks();
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("uses only server identity and excludes admins, internal and synthetic identities", () => {
    expect(gameIdentity({ ...ctx, user: { id: 4, email: "learner@example.org", role: "user" } as any }, visitorId)?.kind).toBe("identified");
    expect(gameIdentity({ ...ctx, studentEmail: "learner@example.org" }, visitorId)?.kind).toBe("identified");
    expect(gameIdentity({ ...ctx, user: { id: 4, role: "admin" } as any }, visitorId)).toBeNull();
    expect(gameIdentity({ ...ctx, studentEmail: "fixture@echelon.test" }, visitorId)).toBeNull();
    vi.stubEnv("INTERNAL_BUYER_EMAILS", "team@example.org");
    expect(gameIdentity({ ...ctx, studentEmail: "team@example.org" }, visitorId)).toBeNull(); vi.unstubAllEnvs();
  });
  it("rechecks identity and privacy headers on every write", async () => {
    const value = input();
    expect(await recordGameActivity(value, { ...ctx, studentEmail: "new@example.org" })).toEqual({ accepted: false });
    expect(await recordGameActivity(value, { ...ctx, req: { headers: { dnt: "1" } } as any })).toEqual({ accepted: false });
    expect(await recordGameActivity(value, { ...ctx, req: { headers: { "sec-gpc": "1" } } as any })).toEqual({ accepted: false });
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("retries/double callbacks share event IDs; restarts and timed repeat sequences do not", async () => {
    const value = input();
    await recordGameActivity(value, ctx); await recordGameActivity(value, ctx);
    const id = () => (mocks.persist.mock.calls.at(-1)![0] as any).extra.eventId;
    const first = id(); expect((mocks.persist.mock.calls[0]![0] as any).extra.eventId).toBe(first);
    await recordGameActivity({ ...value, round: 1 }, ctx); expect(id()).not.toBe(first);
    await recordGameActivity({ ...value, timed: true }, ctx); const timed = id();
    await recordGameActivity({ ...value, timed: true, event: { ...value.event, sequence: 1 } }, ctx); expect(id()).not.toBe(timed);
  });
  it("requires every untimed delivered item, or at least one timed answer, before completion", async () => {
    const value = input(); const event = { kind: "complete" as const };
    mocks.execute.mockResolvedValueOnce([[{ answered: 1 }], []]);
    expect(await recordGameActivity({ ...value, event }, ctx)).toEqual({ accepted: false });
    expect(mocks.persist).not.toHaveBeenCalled();
    expect(await recordGameActivity({ ...value, event }, ctx)).toEqual({ accepted: true });
    mocks.execute.mockResolvedValueOnce([[{ answered: 0 }], []]);
    expect(await recordGameActivity({ ...value, timed: true, event }, ctx)).toEqual({ accepted: false });
    mocks.execute.mockResolvedValueOnce([[{ answered: 1 }], []]);
    expect(await recordGameActivity({ ...value, timed: true, event }, ctx)).toEqual({ accepted: true });
  });
  it("rejects arbitrary payloads and bounded abusive sequences", () => {
    expect(gameActivityInputSchema.safeParse({ ...input(), email: "claim@example.org" }).success).toBe(false);
    expect(gameActivityInputSchema.safeParse({ ...input(), event: { kind: "answer", itemId: "a", sequence: 10001 } }).success).toBe(false);
    expect(gameActivityInputSchema.safeParse({ ...input(), round: 101 }).success).toBe(false);
  });
  it("does not turn unavailable storage into a zero report", async () => {
    mocks.db.mockResolvedValue(null);
    await expect(readGameActivity(30)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
  it("reads only aggregate rows and returns separate identified/browser estimates", async () => {
    mocks.execute.mockResolvedValueOnce([[{ players: 3, anonymousBrowsers: 2, identifiedPlayers: 1, roundsStarted: 5, questionsAnswered: 8 }], []])
      .mockResolvedValueOnce([[{ n: 1 }], []]).mockResolvedValueOnce([[{ n: 2 }], []])
      .mockResolvedValueOnce([[{ k: "oit", n: 5 }], []]).mockResolvedValueOnce([[{ k: "rapid-swipe", n: 5 }], []])
      .mockResolvedValueOnce([[{ firstTrackedAt: new Date("2026-11-17T12:00:00Z") }], []]);
    expect(await readGameActivity(7)).toMatchObject({ players: 3, anonymousBrowsers: 2, identifiedPlayers: 1, returningPlayers: 1, roundsCompleted: 2, questionsAnswered: 8 });
    expect(mocks.execute).toHaveBeenCalledTimes(6);
    const queries = mocks.execute.mock.calls.map(([query]) => new MySqlDialect().sqlToQuery(query));
    expect(queries[0].sql).toContain("COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.eventId')))");
    expect(queries[1].sql).toContain("GROUP BY anonymousHash, JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.eventId'))");
    expect(queries[1].sql).toContain("HAVING COUNT(DISTINCT answeredDay) >= 2");
    expect(queries[1].sql).toContain("$.utcDay");
    expect(queries[0].params[0]).toBeInstanceOf(Date);
    expect(queries[3].sql).toContain("LIMIT 3");
  });
});

describe("game analytics RPC role and input contracts", () => {
  it("gates the actual admin route before any database read", async () => {
    const { adminRouter } = await import("./routers/admin");
    await expect(adminRouter.createCaller(ctx).gameActivity({ days: 30 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminRouter.createCaller({ ...ctx, user: { id: 123, role: "user" } as any }).gameActivity({ days: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.db).not.toHaveBeenCalled();
    await expect(adminRouter.createCaller({ ...ctx, user: { id: 123, role: "admin" } as any }).gameActivity({ days: 90 } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.db).not.toHaveBeenCalled();
  });
});

describe("bounded ingestion", () => {
  it("limits signed capabilities per privacy identity even with batched RPC traffic", async () => {
    const browser = randomUUID();
    const capability = issueGameCapability(session(), ctx, browser)!;
    const value = { ...input(), capability, visitorId: browser };
    for (let i = 0; i < 120; i++) await recordGameActivity(value, ctx);
    await expect(recordGameActivity(value, ctx)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
