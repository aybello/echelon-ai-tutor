import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardOtps, emailOtpCodes, magicLinks } from "../drizzle/schema";
import { consumeMagicLinkAtomically, verifyAndConsumeOtp } from "./auth/atomicVerification";
import type { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const state = vi.hoisted(() => ({ db: null as Database | null, issueSession: vi.fn(), issueToken: vi.fn() }));
vi.mock("./db", () => ({ getDb: async () => state.db }));
vi.mock("./_core/access", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  resolveEntitlementsByEmail: vi.fn(async () => ({
    hasAnyAccess: true, isManager: false, unlockedExamTypes: ["wwt-1"], purchasedProductKeys: [],
  })),
}));
vi.mock("./_core/emailSession", () => ({ issueVerifiedEmailSessionCookie: state.issueSession }));
vi.mock("./_core/subscriptionToken", () => ({ issueSubscriptionToken: state.issueToken }));
vi.mock("./email", () => ({ sendOtpEmail: vi.fn(), sendMagicLinkEmail: vi.fn() }));
vi.mock("./analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./routers/trainingRouter", () => ({ hasTrainingRecord: vi.fn() }));
const { emailOtpRouter } = await import("./routers/emailOtpRouter");
const { dashboardAuthRouter } = await import("./routers/dashboardAuthRouter");
const { magicLinkRouter } = await import("./routers/magicLinkRouter");
const email = "audit-auth@example.test";
const code = "314159";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

type Row = typeof emailOtpCodes.$inferSelect;
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: 1, email, codeHash: hash(code), expiresAt: new Date(Date.now() + 600_000),
    usedAt: null, attempts: 0, createdAt: new Date(), ...overrides,
  };
}
/** Deterministic fixture for edge cases only. Concurrency is tested against SQL in the integration suite. */
function fixture(initial: Row | null, options: {
  affectedRows?: number; commitFailure?: boolean; afterLock?: () => void;
} = {}) {
  let persisted = initial && structuredClone(initial);
  const update = vi.fn();
  const lock = vi.fn();
  const db = {
    transaction: async (run: (tx: unknown) => Promise<unknown>) => {
      const locked = persisted && structuredClone(persisted);
      const tx = {
        select: () => ({ from: () => ({ where: () => {
          const query = { limit: () => ({ for: async () => {
            lock();
            options.afterLock?.();
            return locked ? [structuredClone(locked)] : [];
          } }) };
          return { ...query, orderBy: () => query };
        } }) }),
        update: () => ({ set: (values: { attempts?: unknown; usedAt?: Date }) => ({
          where: async () => {
            update(values);
            const affectedRows = options.affectedRows ?? 1;
            if (locked && affectedRows === 1) {
              if (values.attempts !== undefined) locked.attempts += 1;
              if (values.usedAt) locked.usedAt = values.usedAt;
            }
            return [{ affectedRows }];
          },
        }) }),
      };
      const result = await run(tx);
      if (options.commitFailure) throw new Error("Synthetic commit failure");
      persisted = locked;
      return result;
    },
  } as unknown as Database;
  return { db, update, lock, persisted: () => persisted };
}
function context() {
  return {
    user: null, studentEmail: null,
    req: { headers: {}, protocol: "https" }, res: { cookie: vi.fn() },
  } as unknown as TrpcContext;
}
afterEach(() => {
  vi.useRealTimers();
  state.db = null;
  state.issueSession.mockClear();
  state.issueToken.mockClear();
});

describe.each([emailOtpCodes, dashboardOtps])("shared OTP helper edge cases", (table) => {
  it.each(["missing", "expired", "boundary", "used", "exhausted"] as const)("rejects %s without changing state", async (status) => {
    const f = fixture(status === "missing" ? null : row({
      expiresAt: new Date(Date.now() + (status === "expired" ? -1_000 : status === "boundary" ? 0 : 600_000)),
      usedAt: status === "used" ? new Date() : null,
      attempts: status === "exhausted" ? 5 : 0,
    }));
    expect(await verifyAndConsumeOtp(f.db, table, email, hash(code))).toEqual({
      valid: false, reason: status === "exhausted" ? "too_many_attempts" : "expired",
    });
    expect(f.lock).toHaveBeenCalledOnce();
    expect(f.update).not.toHaveBeenCalled();
  });
  it("commits the fifth wrong attempt, then blocks the correct code", async () => {
    const f = fixture(row({ attempts: 4 }));
    expect(await verifyAndConsumeOtp(f.db, table, email, hash("000000")))
      .toEqual({ valid: false, reason: "wrong_code", attemptsRemaining: 0 });
    expect(f.persisted()?.attempts).toBe(5);
    expect(await verifyAndConsumeOtp(f.db, table, email, hash(code)))
      .toEqual({ valid: false, reason: "too_many_attempts" });
    expect(f.update).toHaveBeenCalledOnce();
    expect(f.persisted()?.usedAt).toBeNull();
  });
  it("claims the correct hash without consuming the wrong-attempt budget and rejects replay", async () => {
    const f = fixture(row({ attempts: 4 }));
    expect(await verifyAndConsumeOtp(f.db, table, email, hash(code))).toEqual({ valid: true });
    expect(f.persisted()?.usedAt).toBeInstanceOf(Date);
    expect(f.persisted()?.attempts).toBe(4);
    expect(await verifyAndConsumeOtp(f.db, table, email, hash(code))).toEqual({ valid: false, reason: "expired" });
    expect(f.update).toHaveBeenCalledOnce();
  });
  it("checks expiry after waiting for the row lock", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-10-03T12:00:00Z");
    vi.setSystemTime(now);
    const f = fixture(row({ expiresAt: new Date(now.getTime() + 1_000) }), {
      afterLock: () => vi.setSystemTime(new Date(now.getTime() + 1_000)),
    });
    expect(await verifyAndConsumeOtp(f.db, table, email, hash(code))).toEqual({ valid: false, reason: "expired" });
    expect(f.update).not.toHaveBeenCalled();
  });
  it.each([code, "000000"])("fails closed when the conditional update does not claim exactly one row", async (entered) => {
    const f = fixture(row(), { affectedRows: 0 });
    expect(await verifyAndConsumeOtp(f.db, table, email, hash(entered))).toEqual({ valid: false, reason: "expired" });
    expect(f.persisted()?.usedAt).toBeNull();
    expect(f.persisted()?.attempts).toBe(0);
  });
});

describe("magic-link helper edge cases", () => {
  it.each(["missing", "expired", "used"] as const)("rejects %s links before claiming", async (status) => {
    const f = fixture(status === "missing" ? null : row({
      expiresAt: new Date(Date.now() + (status === "expired" ? -1_000 : 600_000)),
      usedAt: status === "used" ? new Date() : null,
    }));
    expect(await consumeMagicLinkAtomically(f.db, hash("synthetic-legacy-token"))).toBeNull();
    expect(f.update).not.toHaveBeenCalled();
  });
  it("rejects a failed conditional claim", async () => {
    const f = fixture(row(), { affectedRows: 0 });
    expect(await consumeMagicLinkAtomically(f.db, hash("synthetic-legacy-token"))).toBeNull();
  });
});

describe("routers gate sessions on a committed claim", () => {
  it.each(["emailOtp", "dashboardAuth", "magicLink"] as const)("%s never issues a session or access token after a commit failure", async (kind) => {
    const f = fixture(row(), { commitFailure: true });
    state.db = f.db;
    const ctx = context();
    const request = kind === "emailOtp"
      ? emailOtpRouter.createCaller(ctx).verifyOtp({ email, code })
      : kind === "dashboardAuth"
        ? dashboardAuthRouter.createCaller(ctx).verifyOtp({ email, code })
        : magicLinkRouter.createCaller(ctx).consumeMagicLink({ token: "synthetic-legacy-token" });
    await expect(request).rejects.toThrow("Synthetic commit failure");
    expect(f.persisted()?.usedAt).toBeNull();
    expect(state.issueSession).not.toHaveBeenCalled();
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(ctx.res.cookie).not.toHaveBeenCalled();
  });
  it("both OTP routes and legacy links fail closed when the database is unavailable", async () => {
    state.db = null;
    expect(await emailOtpRouter.createCaller(context()).verifyOtp({ email, code }))
      .toEqual({ valid: false, reason: "server_error" });
    await expect(dashboardAuthRouter.createCaller(context()).verifyOtp({ email, code }))
      .rejects.toThrow("Database unavailable");
    expect((await magicLinkRouter.createCaller(context()).consumeMagicLink({ token: "synthetic" })).valid).toBe(false);
    expect(state.issueSession).not.toHaveBeenCalled();
    expect(state.issueToken).not.toHaveBeenCalled();
  });
});
