import { createHash, randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardOtps, emailOtpCodes, magicLinks } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { ECHELON_SESSION_COOKIE, readVerifiedEmailFromRequest } from "./_core/emailSession";
import { verifySubscriptionToken } from "./_core/subscriptionToken";

const state = vi.hoisted(() => ({
  db: null as MySql2Database<Record<string, never>> | null,
  hasAccess: true,
  isManager: false,
  failEntitlements: false,
  observedClaim: false,
  beforeEntitlements: null as (() => Promise<void>) | null,
}));
// Inject only the disposable connection. Verification, transactions, SQL, JWTs
// and session-cookie issuance are the real production implementations.
vi.mock("./db", () => ({ getDb: async () => state.db }));
vi.mock("./_core/access", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  resolveEntitlementsByEmail: vi.fn(async (email: string) => {
    await state.beforeEntitlements?.();
    if (state.failEntitlements) throw new Error("Synthetic entitlement failure");
    return {
      email,
      hasAnyAccess: state.hasAccess,
      isManager: state.isManager,
      unlockedExamTypes: state.hasAccess ? ["wwt-1"] : [],
      purchasedProductKeys: state.hasAccess ? ["wwt-1"] : [],
      activeSubscriptionRows: [],
      sources: [],
    };
  }),
}));
vi.mock("./email", () => ({ sendOtpEmail: vi.fn(), sendMagicLinkEmail: vi.fn() }));
vi.mock("./analytics", () => ({ trackEvent: vi.fn(async () => undefined) }));
vi.mock("./routers/trainingRouter", () => ({ hasTrainingRecord: vi.fn(async () => false) }));

const { emailOtpRouter } = await import("./routers/emailOtpRouter");
const { dashboardAuthRouter } = await import("./routers/dashboardAuthRouter");
const { magicLinkRouter } = await import("./routers/magicLinkRouter");
const enabled = process.env.AUDIT_INTEGRATION_TEST_DB === "1";
const fixtureEmails: string[] = [];
let pool: mysql.Pool | undefined;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const code = "314159";
const kinds = ["emailOtp", "dashboardAuth"] as const;
type Kind = typeof kinds[number];
const tableFor = (kind: Kind) => kind === "emailOtp" ? emailOtpCodes : dashboardOtps;

function fixtureEmail() {
  const email = `audit-auth-${randomUUID()}@example.test`;
  fixtureEmails.push(email);
  return email;
}
function context(): TrpcContext {
  return {
    user: null,
    studentEmail: null,
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}
async function verify(kind: Kind, email: string, enteredCode: string, ctx = context()) {
  try {
    if (kind === "emailOtp") {
      const result = await emailOtpRouter.createCaller(ctx).verifyOtp({ email, code: enteredCode });
      return { success: result.valid, result, ctx };
    }
    const result = await dashboardAuthRouter.createCaller(ctx).verifyOtp({ email, code: enteredCode });
    return { success: result.success, result, ctx };
  } catch (error) {
    return { success: false, error: error as Error, ctx };
  }
}
async function seedOtp(kind: Kind, email: string, overrides: Partial<typeof emailOtpCodes.$inferInsert> = {}) {
  await state.db!.insert(tableFor(kind)).values({
    email, codeHash: hash(code), expiresAt: new Date(Date.now() + 600_000), ...overrides,
  });
}
async function otpRow(kind: Kind, email: string) {
  const [row] = await state.db!.select().from(tableFor(kind)).where(eq(tableFor(kind).email, email));
  return row;
}
async function seedLink(email: string, overrides: Partial<typeof magicLinks.$inferInsert> = {}) {
  const token = randomUUID();
  await state.db!.insert(magicLinks).values({
    email, tokenHash: hash(token), examTypes: JSON.stringify(["stale-course"]),
    expiresAt: new Date(Date.now() + 900_000), ...overrides,
  });
  return token;
}
async function cleanFixtures() {
  if (!state.db || !fixtureEmails.length) return;
  for (const table of [emailOtpCodes, dashboardOtps, magicLinks]) {
    await state.db.delete(table).where(inArray(table.email, fixtureEmails));
  }
  fixtureEmails.length = 0;
}
async function assertSession(ctx: TrpcContext, email: string) {
  const cookie = vi.mocked(ctx.res.cookie).mock.calls as unknown as [string, string, Record<string, unknown>][];
  expect(cookie).toHaveLength(1);
  expect(cookie[0][0]).toBe(ECHELON_SESSION_COOKIE);
  expect(cookie[0][2]).toMatchObject({
    httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 86_400_000,
  });
  const req = { cookies: { [ECHELON_SESSION_COOKIE]: cookie[0][1] } } as unknown as TrpcContext["req"];
  expect(await readVerifiedEmailFromRequest(req)).toBe(email);
}

describe.skipIf(!enabled)("EC-04 disposable-database router concurrency", () => {
  beforeAll(async () => {
    // Validate before any connection, even if this test is launched outside the
    // safe runner. Never accept a production selector or a non-audit database.
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) throw new Error("Explicit disposable auth database required");
    const url = new URL(rawUrl);
    if (url.protocol !== "mysql:" || !["localhost", "127.0.0.1"].includes(url.hostname)
      || !/^\/echelon_audit_[a-z0-9_]+$/.test(url.pathname)
      || process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET === "true") {
      throw new Error("Only an isolated loopback audit database is allowed");
    }
    pool = mysql.createPool({ uri: rawUrl, connectionLimit: 12 });
    state.db = drizzle(pool);
    await pool.query("SELECT 1");
  });
  beforeEach(() => {
    state.hasAccess = true;
    state.isManager = false;
    state.failEntitlements = false;
    state.observedClaim = false;
    state.beforeEntitlements = null;
  });
  afterEach(cleanFixtures);
  afterAll(async () => {
    await cleanFixtures();
    await pool?.end();
    state.db = null;
  });

  describe.each(kinds)("%s", (kind) => {
    it("commits exactly five wrong attempts under twelve parallel requests, then rejects even the correct code", async () => {
      const email = fixtureEmail();
      await seedOtp(kind, email);
      const results = await Promise.all(Array.from({ length: 12 }, () => verify(kind, email, "000000")));
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.every(r => vi.mocked(r.ctx.res.cookie).mock.calls.length === 0)).toBe(true);
      const remaining = results.flatMap(r => {
        if ("result" in r && r.result && "attemptsRemaining" in r.result) return [r.result.attemptsRemaining];
        const match = "error" in r ? r.error?.message.match(/Incorrect code\. (\d) attempt/) : null;
        return match ? [Number(match[1])] : [];
      }).sort();
      expect(remaining).toEqual([0, 1, 2, 3, 4]);
      const row = await otpRow(kind, email);
      expect(row.attempts).toBe(5);
      expect(row.usedAt).toBeNull();
      expect((await verify(kind, email, code)).success).toBe(false);
      expect((await otpRow(kind, email)).attempts).toBe(5);
    });

    it("issues exactly one real signed session and access token for twelve concurrent correct requests, then rejects replay", async () => {
      const email = fixtureEmail();
      await seedOtp(kind, email);
      const results = await Promise.all(Array.from({ length: 12 }, () => verify(kind, email.toUpperCase(), code)));
      const winners = results.filter(r => r.success);
      expect(winners).toHaveLength(1);
      expect(results.reduce((n, r) => n + vi.mocked(r.ctx.res.cookie).mock.calls.length, 0)).toBe(1);
      await assertSession(winners[0].ctx, email);
      const result = winners[0].result!;
      expect("accessToken" in result && typeof result.accessToken === "string").toBe(true);
      const payload = await verifySubscriptionToken("accessToken" in result ? result.accessToken : null);
      expect(payload).toEqual({ email, examTypes: ["wwt-1"] });
      expect((await otpRow(kind, email)).usedAt).toBeInstanceOf(Date);
      const replay = await verify(kind, email, code);
      expect(replay.success).toBe(false);
      expect(replay.ctx.res.cookie).not.toHaveBeenCalled();
    });

    it("keeps correct and incorrect contenders within the final attempt budget", async () => {
      const email = fixtureEmail();
      await seedOtp(kind, email, { attempts: 4 });
      const results = await Promise.all([
        ...Array.from({ length: 6 }, () => verify(kind, email, "000000")),
        ...Array.from({ length: 6 }, () => verify(kind, email, code)),
      ]);
      const row = await otpRow(kind, email);
      const sessions = results.reduce((n, r) => n + vi.mocked(r.ctx.res.cookie).mock.calls.length, 0);
      expect([4, 5]).toContain(row.attempts);
      expect(sessions).toBeLessThanOrEqual(1);
      expect(results.filter(r => r.success).length).toBe(sessions);
      expect(row.usedAt !== null).toBe(sessions === 1);
      if (row.attempts === 5) expect(sessions).toBe(0);
    });

    it.each(["expired", "used", "exhausted"] as const)("rejects %s state with no session or state mutation", async (status) => {
      const email = fixtureEmail();
      await seedOtp(kind, email, {
        expiresAt: new Date(Date.now() + (status === "expired" ? -1_000 : 600_000)),
        usedAt: status === "used" ? new Date() : null,
        attempts: status === "exhausted" ? 5 : 0,
      });
      const before = await otpRow(kind, email);
      const result = await verify(kind, email, code);
      expect(result.success).toBe(false);
      expect(result.ctx.res.cookie).not.toHaveBeenCalled();
      expect(await otpRow(kind, email)).toEqual(before);
    });

    it.each(["used", "expired"] as const)("does not fall back to an older active code when the latest is %s", async (status) => {
      const email = fixtureEmail();
      await seedOtp(kind, email, { codeHash: hash("271828"), createdAt: new Date(Date.now() - 10_000) });
      await seedOtp(kind, email, {
        createdAt: new Date(),
        usedAt: status === "used" ? new Date() : null,
        expiresAt: new Date(Date.now() + (status === "expired" ? -1_000 : 600_000)),
      });
      const result = await verify(kind, email, "271828");
      expect(result.success).toBe(false);
      expect(result.ctx.res.cookie).not.toHaveBeenCalled();
    });

    it.each(["manager", "historical-record"] as const)("preserves %s identity without inventing paid access", async (identity) => {
      const email = fixtureEmail();
      state.hasAccess = false;
      state.isManager = identity === "manager";
      await seedOtp(kind, email);
      const verified = await verify(kind, email, code);
      expect(verified.success).toBe(true);
      await assertSession(verified.ctx, email);
      const result = verified.result!;
      expect("accessToken" in result && !result.accessToken).toBe(true);
    });

    it("rejects a code that expires while verification waits for its real database row lock", async () => {
      const email = fixtureEmail();
      await seedOtp(kind, email, { expiresAt: new Date(Date.now() + 1_000) });
      const row = await otpRow(kind, email);
      const locker = await pool!.getConnection();
      const tableName = kind === "emailOtp" ? "email_otp_codes" : "dashboard_otps";
      try {
        await locker.beginTransaction();
        await locker.query(`SELECT id FROM ${tableName} WHERE id = ? FOR UPDATE`, [row.id]);
        const waiting = verify(kind, email, code);
        await new Promise(resolve => setTimeout(resolve, 1_200));
        await locker.commit();
        const result = await waiting;
        expect(result.success).toBe(false);
        expect(result.ctx.res.cookie).not.toHaveBeenCalled();
        expect((await otpRow(kind, email)).usedAt).toBeNull();
      } finally {
        await locker.rollback();
        locker.release();
      }
    });

    it("isolates identities and stores only the hash when another email guesses the code", async () => {
      const email = fixtureEmail();
      const unrelated = fixtureEmail();
      await seedOtp(kind, email);
      expect((await verify(kind, unrelated, code)).success).toBe(false);
      const stored = await otpRow(kind, email);
      expect(stored.codeHash).toBe(hash(code));
      expect(stored.codeHash).not.toBe(code);
      expect(stored.attempts).toBe(0);
      expect(stored.usedAt).toBeNull();
    });

    it("commits consumption before entitlement work and never reopens the code on downstream failure", async () => {
      const email = fixtureEmail();
      await seedOtp(kind, email);
      state.beforeEntitlements = async () => {
        // This read is outside the claim transaction on a separate pooled connection.
        state.observedClaim = (await otpRow(kind, email)).usedAt !== null;
      };
      state.failEntitlements = true;
      expect((await verify(kind, email, code)).success).toBe(false);
      expect(state.observedClaim).toBe(true);
      expect((await otpRow(kind, email)).usedAt).toBeInstanceOf(Date);
      const replay = await verify(kind, email, code);
      expect(replay.success).toBe(false);
      expect(replay.ctx.res.cookie).not.toHaveBeenCalled();
    });
  });

  describe("legacy magic links", () => {
    it("allows one concurrent legacy consume, rechecks live courses, issues one signed session, and rejects replay", async () => {
      const email = fixtureEmail();
      const token = await seedLink(email);
      const contexts = Array.from({ length: 12 }, context);
      const results = await Promise.all(contexts.map(ctx => magicLinkRouter.createCaller(ctx).consumeMagicLink({ token })));
      expect(results.filter(r => r.valid)).toHaveLength(1);
      expect(contexts.reduce((n, ctx) => n + vi.mocked(ctx.res.cookie).mock.calls.length, 0)).toBe(1);
      const index = results.findIndex(r => r.valid);
      await assertSession(contexts[index], email);
      expect(results[index].examTypes).toEqual(["wwt-1"]);
      expect(await verifySubscriptionToken(results[index].accessToken)).toEqual({ email, examTypes: ["wwt-1"] });
      const replayCtx = context();
      expect((await magicLinkRouter.createCaller(replayCtx).consumeMagicLink({ token })).valid).toBe(false);
      expect(replayCtx.res.cookie).not.toHaveBeenCalled();
    });
    it.each(["expired", "used", "unknown"] as const)("rejects %s links without a session", async (status) => {
      const email = fixtureEmail();
      const token = status === "unknown" ? randomUUID() : await seedLink(email, {
        expiresAt: new Date(Date.now() + (status === "expired" ? -1_000 : 600_000)),
        usedAt: status === "used" ? new Date() : null,
      });
      const ctx = context();
      expect((await magicLinkRouter.createCaller(ctx).consumeMagicLink({ token })).valid).toBe(false);
      expect(ctx.res.cookie).not.toHaveBeenCalled();
    });
    it("preserves a valid manager-only legacy link without stale paid entitlements", async () => {
      state.hasAccess = false;
      state.isManager = true;
      const email = fixtureEmail();
      const token = await seedLink(email);
      const ctx = context();
      const result = await magicLinkRouter.createCaller(ctx).consumeMagicLink({ token });
      expect(result).toMatchObject({ valid: true, isManager: true, accessToken: "", examTypes: [] });
      await assertSession(ctx, email);
    });
    it("does not reactivate new magic-link delivery", async () => {
      const result = await magicLinkRouter.createCaller(context()).requestMagicLink({
        email: fixtureEmail(), origin: "https://attacker.example.test", next: "//attacker.example.test",
      });
      expect(result).toEqual({ sent: true });
      const { sendMagicLinkEmail } = await import("./email");
      expect(sendMagicLinkEmail).not.toHaveBeenCalled();
    });
  });
});
