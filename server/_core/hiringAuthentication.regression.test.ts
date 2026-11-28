import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql-proxy";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { dashboardOtps, emailOtpCodes, hiringTerms, organizations, recruitmentAssignments, recruitmentAssessments } from "../../drizzle/schema";
import { getDb } from "../db";
import { emailOtpRouter } from "../routers/emailOtpRouter";
import { dashboardAuthRouter } from "../routers/dashboardAuthRouter";
import { createContext, type TrpcContext } from "./context";
import { ENV } from "./env";
import { ECHELON_SESSION_COOKIE, issueVerifiedEmailSessionCookie, readVerifiedEmailFromRequest } from "./emailSession";
import { ASSESSMENT_ONLY_COOKIE, assertLearnerStateAllowed, issueAssessmentOnlySession, readAssessmentOnlySession } from "./assessmentOnlySession";

const state = vi.hoisted(() => ({
  user: null as User | null,
  resolveEntitlements: vi.fn(),
  issueToken: vi.fn(async () => "synthetic-learner-token"),
  sendEmail: vi.fn(),
  sendMail: vi.fn(),
  failCapabilityCommit: false,
  inTransaction: false,
  queries: [] as string[],
}));
vi.mock("../db", () => ({ getDb: vi.fn() }));
vi.mock("./sdk", () => ({ sdk: { authenticateRequest: async () => state.user } }));
vi.mock("./access", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  resolveEntitlementsByEmail: state.resolveEntitlements,
}));
vi.mock("./subscriptionToken", () => ({ issueSubscriptionToken: state.issueToken }));
vi.mock("../teams/billingIdentity", () => ({ hasRecoverableTeamBilling: async () => false }));
vi.mock("../routers/trainingRouter", () => ({ hasTrainingRecord: async () => false }));
vi.mock("../email", () => ({ sendOtpEmail: state.sendEmail }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: state.sendMail }) } }));
vi.mock("../analytics", () => ({ trackEvent: vi.fn(async () => undefined) }));
vi.mock("../learnerSignIn", () => ({ recordLearnerSignIn: vi.fn(async () => undefined) }));

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
const NOW = new Date("2040-01-01T12:00:00Z");
const APPLICANT = "applicant-a@example.test";
const PURCHASER = "purchaser-b@example.test";
const ASSIGNMENT_ID = "11111111-1111-4111-8111-111111111111";
const ASSESSMENT_ID = "22222222-2222-4222-8222-222222222222";
const GRANT_ID = "33333333-3333-4333-8333-333333333333";
const ORG_ID = 1;
const COURSE = "class2-water";
const CODE = "314159";
const TIMESTAMP = NOW.toISOString().replace("T", " ").replace("Z", "");
let sqlite: InstanceType<typeof DatabaseSync>;
let previousSecret: string;
let previousSmtp: Pick<typeof ENV, "smtpHost" | "smtpUser" | "smtpPass">;

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type OtpTable = typeof emailOtpCodes | typeof dashboardOtps;

function noAccess(email: string) {
  return { email, hasAnyAccess: false, isManager: false, unlockedExamTypes: [], purchasedProductKeys: [], activeSubscriptionRows: [], sources: [] };
}
function learnerAccess(email: string) {
  return { ...noAccess(email), hasAnyAccess: true, unlockedExamTypes: ["oit"], purchasedProductKeys: ["oit"], sources: ["purchase"] };
}

// Exercise actual MySQL-generated email/accessKind/status/expiry predicates in
// SQLite memory, not prefiltered rows or source-text assertions. Row locking is
// omitted only for this single-threaded adapter; concurrency is not under test.
function memoryDatabase(): Database {
  for (const table of [emailOtpCodes, dashboardOtps, recruitmentAssignments, recruitmentAssessments, organizations, hiringTerms]) {
    sqlite.exec(`CREATE TABLE \`${getTableName(table)}\` (${Object.values(getTableColumns(table))
      .map(column => {
        const type = column.dataType === "number" ? "INTEGER" : "TEXT";
        const otp = table === emailOtpCodes || table === dashboardOtps;
        const defaults = otp && column.name === "id" ? " PRIMARY KEY AUTOINCREMENT"
          : otp && column.name === "attempts" ? " DEFAULT 0"
          : otp && column.name === "createdAt" ? ` DEFAULT '${TIMESTAMP}'` : "";
        return `\`${column.name}\` ${type}${defaults}`;
      }).join(",")})`);
  }
  const db = drizzle(async (query, params, method) => {
    // MySQL permits DEFAULT in an individual VALUES slot; SQLite requires its
    // equivalent NULL for the auto-increment id. Restore other OTP defaults
    // after insertion so the real verifier sees exactly the intended row state.
    state.queries.push(query);
    const statement = sqlite.prepare(query.replace(/\s+for (?:share|update)\s*$/i, "").replaceAll("default", "null"));
    if (method === "all") {
      return { rows: statement.all(...params).map(row => Object.values(row)) };
    }
    const result = statement.run(...params);
    if (query.startsWith("insert into")) {
      for (const table of [emailOtpCodes, dashboardOtps]) {
        sqlite.prepare(`UPDATE \`${getTableName(table)}\` SET attempts = COALESCE(attempts, 0), createdAt = COALESCE(createdAt, ?)`)
          .run(TIMESTAMP);
      }
    }
    return { rows: [{ affectedRows: Number(result.changes), insertId: Number(result.lastInsertRowid) }] };
  });
  // mysql-proxy does not implement transactions. Keep the real verifier and all
  // its conditional updates, supplying atomic local transactions in the fixture.
  Object.assign(db, { transaction: async (run: (tx: typeof db) => Promise<unknown>) => {
    sqlite.exec("BEGIN");
    state.inTransaction = true;
    const firstQuery = state.queries.length;
    try {
      const result = await run(db);
      if (state.failCapabilityCommit && state.queries.slice(firstQuery).some(query => query.includes("`hiring_terms`"))) {
        throw new Error("Synthetic capability transaction commit failure");
      }
      sqlite.exec("COMMIT");
      return result;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    } finally {
      state.inTransaction = false;
    }
  } });
  return db as unknown as Database;
}

function seedInvitation() {
  sqlite.prepare("INSERT INTO organizations (id, name, province, tier, seatsTotal, managerEmail, termStart, termEnd, billingType, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ORG_ID, "Test Annual team", "ontario", "all-access", 5, "manager@example.test", "2039-12-01 00:00:00.000", "2040-12-01 00:00:00.000", "stripe", "active", TIMESTAMP);
  sqlite.prepare("INSERT INTO hiring_terms (id, orgId, basis, sourceInvoiceId, startsAtMs, endsAtMs, quota, used, state, paymentState, createdByEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(GRANT_ID, ORG_ID, "paid", "in_test_hiring", NOW.getTime() - 86_400_000, NOW.getTime() + 86_400_000, 100, 1, "active", "active", "manager@example.test");
  sqlite.prepare("INSERT INTO recruitment_assessments (id, orgId, title, courseKey, courseLabel, modules, questionCount, questions, creatorEmail, createdAtMs, expiresAtMs, timeLimitMinutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ASSESSMENT_ID, ORG_ID, "Applicant assessment", COURSE, "Class 2 Water", "[]", 0, "[]", "manager@example.test", NOW.getTime(), NOW.getTime() + 3_600_000, 45);
  sqlite.prepare("INSERT INTO recruitment_assignments (id, assessmentId, orgId, memberId, grantId, candidateEmail, accessKind, status, expiresAtMs, creatorEmail, createdAtMs, updatedAtMs, answers, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ASSIGNMENT_ID, ASSESSMENT_ID, ORG_ID, null, GRANT_ID, APPLICANT, "applicant", "invited", NOW.getTime() + 3_600_000, "manager@example.test", NOW.getTime(), NOW.getTime(), "{}", 0);
}
function seedOtp(table: OtpTable, email = APPLICANT) {
  // Represents a correctly issued, still-live OTP. Invitation state is changed
  // only after issuance, independently of the OTP's ten-minute expiry.
  sqlite.prepare(`INSERT INTO \`${getTableName(table)}\` (id, email, codeHash, expiresAt, usedAt, attempts, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(1, email, createHash("sha256").update(CODE).digest("hex"), "2040-01-01 12:10:00.000", null, 0, TIMESTAMP);
}
function otpWasConsumed(table: OtpTable) {
  return sqlite.prepare(`SELECT usedAt FROM \`${getTableName(table)}\` WHERE id = 1`).get()?.usedAt !== null;
}

// This cookie jar models browser cookie replacement/deletion while preserving
// the current request's immutable cookies until the next request.
function browser(initial: Record<string, string> = {}) {
  const jar = { ...initial };
  const req = { headers: {}, protocol: "https", cookies: { ...jar } } as TrpcContext["req"];
  const res = {
    cookie: vi.fn((name: string, value: string) => { jar[name] = value; }),
    clearCookie: vi.fn((name: string) => { delete jar[name]; }),
  } as unknown as TrpcContext["res"];
  return { req, res, jar };
}
async function contextFor(client: ReturnType<typeof browser>) {
  return createContext({ req: client.req, res: client.res } as CreateExpressContextOptions);
}
async function applicantCookie() {
  const client = browser();
  await issueAssessmentOnlySession(client.res, {
    assignmentId: ASSIGNMENT_ID, candidateEmail: APPLICANT, courseKey: COURSE, ttlMs: 3_600_000,
  });
  return client.jar[ASSESSMENT_ONLY_COOKIE];
}
async function verifiedCookie(email: string) {
  const client = browser();
  await issueVerifiedEmailSessionCookie(client.res, email);
  return client.jar[ECHELON_SESSION_COOKIE];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  previousSecret = ENV.cookieSecret;
  ENV.cookieSecret = "test-only-not-for-production";
  previousSmtp = { smtpHost: ENV.smtpHost, smtpUser: ENV.smtpUser, smtpPass: ENV.smtpPass };
  Object.assign(ENV, { smtpHost: "smtp.example.test", smtpUser: "mailer@example.test", smtpPass: "test-only-placeholder" });
  state.user = null;
  state.failCapabilityCommit = false;
  state.inTransaction = false;
  state.queries = [];
  state.resolveEntitlements.mockReset().mockImplementation(async (email: string) => {
    if (state.inTransaction) throw new Error("Global entitlement resolution attempted under transaction locks");
    return noAccess(email);
  });
  state.issueToken.mockReset().mockResolvedValue("synthetic-learner-token");
  state.sendEmail.mockReset().mockResolvedValue(undefined);
  state.sendMail.mockReset().mockResolvedValue(undefined);
  sqlite = new DatabaseSync(":memory:");
  vi.mocked(getDb).mockResolvedValue(memoryDatabase());
  seedInvitation();
});
afterEach(() => {
  sqlite.close();
  ENV.cookieSecret = previousSecret;
  Object.assign(ENV, previousSmtp);
  vi.useRealTimers();
});

const routes = [
  {
    name: "emailOtpRouter", table: emailOtpCodes,
    request: (ctx: TrpcContext) => emailOtpRouter.createCaller(ctx).requestOtp({ email: APPLICANT }),
    deliveredCode: () => state.sendEmail.mock.calls[0][0].code as string,
    verify: (ctx: TrpcContext, email = APPLICANT, code = CODE) => emailOtpRouter.createCaller(ctx).verifyOtp({ email, code }),
  },
  {
    name: "dashboardAuthRouter", table: dashboardOtps,
    request: (ctx: TrpcContext) => dashboardAuthRouter.createCaller(ctx).sendOtp({ email: APPLICANT }),
    deliveredCode: () => (state.sendMail.mock.calls[0][0].subject as string).split(": ")[1],
    verify: (ctx: TrpcContext, email = APPLICANT, code = CODE) => dashboardAuthRouter.createCaller(ctx).verifyOtp({ email, code }),
  },
];

for (const route of routes) {
  describe(`${route.name} live hiring authorization`, () => {
    it.each(["revoked", "expired"] as const)("rejects a genuinely issued OTP when its invitation is subsequently %s", async reason => {
      const client = browser();
      const ctx = await contextFor(client);
      await expect(route.request(ctx)).resolves.toEqual({ sent: true });
      const code = route.deliveredCode();
      expect(code).toHaveLength(6);
      const row = sqlite.prepare(`SELECT codeHash, expiresAt FROM \`${getTableName(route.table)}\``).get();
      expect(row?.codeHash).toBe(createHash("sha256").update(code).digest("hex"));
      expect(new Date(`${row?.expiresAt}Z`).getTime()).toBeGreaterThan(Date.now());
      if (reason === "revoked") sqlite.prepare("UPDATE recruitment_assignments SET status = 'revoked' WHERE id = ?").run(ASSIGNMENT_ID);
      else sqlite.prepare("UPDATE recruitment_assignments SET expiresAtMs = ? WHERE id = ?").run(NOW.getTime(), ASSIGNMENT_ID);

      await expect(route.verify(ctx, APPLICANT, code)).rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(client.res.cookie).not.toHaveBeenCalled();
      expect(state.issueToken).not.toHaveBeenCalled();
    });

    it.each([
      { name: "revoked after OTP issuance", status: "revoked", expiresAtMs: NOW.getTime() + 3_600_000 },
      { name: "expired after OTP issuance with a stale invited status", status: "invited", expiresAtMs: NOW.getTime() - 1 },
      { name: "exact invitation expiry boundary", status: "active", expiresAtMs: NOW.getTime() },
      { name: "explicit expired status despite a future expiry timestamp", status: "expired", expiresAtMs: NOW.getTime() + 3_600_000 },
    ])("rejects $name without learner or manager entitlement", async ({ status, expiresAtMs }) => {
      seedOtp(route.table);
      sqlite.prepare("UPDATE recruitment_assignments SET status = ?, expiresAtMs = ? WHERE id = ?")
        .run(status, expiresAtMs, ASSIGNMENT_ID);
      const client = browser({
        [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(),
        [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT),
      });
      const ctx = await contextFor(client);

      await expect(route.verify(ctx)).rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true); // Failure is authorization, not invalid OTP.
      expect(state.resolveEntitlements).toHaveBeenCalledWith(APPLICANT);
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(client.res.clearCookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, { path: "/" });
      expect(client.res.cookie).not.toHaveBeenCalled();
      expect(state.issueToken).not.toHaveBeenCalled();
      expect(client.jar).toEqual({});
    });

    it("fails closed and clears identity cookies when an applicant's assessment is missing", async () => {
      seedOtp(route.table);
      sqlite.prepare("DELETE FROM recruitment_assessments WHERE id = ?").run(ASSESSMENT_ID);
      const client = browser({
        [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(),
        [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT),
      });
      const ctx = await contextFor(client);

      await expect(route.verify(ctx)).rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(client.res.cookie).not.toHaveBeenCalled();
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(client.res.clearCookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, { path: "/" });
      expect(client.jar).toEqual({});
      expect(state.issueToken).not.toHaveBeenCalled();
    });

    it.each([
      { name: "suspended grant", sql: "UPDATE hiring_terms SET state = 'suspended' WHERE id = ?", params: [GRANT_ID] },
      { name: "refunded grant", sql: "UPDATE hiring_terms SET paymentState = 'refunded' WHERE id = ?", params: [GRANT_ID] },
      { name: "disputed grant", sql: "UPDATE hiring_terms SET paymentState = 'disputed' WHERE id = ?", params: [GRANT_ID] },
      { name: "missing grant", sql: "DELETE FROM hiring_terms WHERE id = ?", params: [GRANT_ID] },
      { name: "grant bound to another organization", sql: "UPDATE hiring_terms SET orgId = 2 WHERE id = ?", params: [GRANT_ID] },
      { name: "grant not yet started", sql: "UPDATE hiring_terms SET startsAtMs = ? WHERE id = ?", params: [NOW.getTime() + 1, GRANT_ID] },
      { name: "exact grant expiry boundary", sql: "UPDATE hiring_terms SET endsAtMs = ? WHERE id = ?", params: [NOW.getTime(), GRANT_ID] },
      { name: "expired assessment with a live assignment", sql: "UPDATE recruitment_assessments SET expiresAtMs = ? WHERE id = ?", params: [NOW.getTime() - 1, ASSESSMENT_ID] },
      { name: "exact assessment expiry boundary", sql: "UPDATE recruitment_assessments SET expiresAtMs = ? WHERE id = ?", params: [NOW.getTime(), ASSESSMENT_ID] },
      { name: "assessment bound to another organization", sql: "UPDATE recruitment_assessments SET orgId = 2 WHERE id = ?", params: [ASSESSMENT_ID] },
      { name: "elapsed active assessment timer", sql: "UPDATE recruitment_assignments SET status = 'active', startedAtMs = ? WHERE id = ?", params: [NOW.getTime() - 45 * 60_000, ASSIGNMENT_ID] },
      { name: "expired Annual organization", sql: "UPDATE organizations SET termEnd = ? WHERE id = ?", params: [TIMESTAMP, ORG_ID] },
    ])("rejects $name despite a valid OTP and clears both cookies", async ({ sql, params }) => {
      seedOtp(route.table);
      sqlite.prepare(sql).run(...params);
      const client = browser({
        [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(),
        [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT),
      });
      const ctx = await contextFor(client);

      await expect(route.verify(ctx)).rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(client.res.cookie).not.toHaveBeenCalled();
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(client.res.clearCookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, { path: "/" });
      expect(client.jar).toEqual({});
      expect(state.issueToken).not.toHaveBeenCalled();
    });

    it("clears both cookies if the real issuer's transaction fails to commit after signing", async () => {
      seedOtp(route.table);
      state.failCapabilityCommit = true;
      const client = browser({
        [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(),
        [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT),
      });

      await expect(route.verify(await contextFor(client))).rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(client.res.cookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, expect.any(String), expect.any(Object));
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(client.res.clearCookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, { path: "/" });
      expect(client.jar).toEqual({});
      expect(state.issueToken).not.toHaveBeenCalled();
    });

    it.each(["OAuth user", "verified email cookie", "old assessment capability"] as const)(
      "issues for OTP-verified B, never older A via %s", async identity => {
        sqlite.prepare("UPDATE recruitment_assignments SET candidateEmail = ? WHERE id = ?").run(PURCHASER, ASSIGNMENT_ID);
        seedOtp(route.table, PURCHASER);
        const cookies: Record<string, string> = {};
        if (identity === "OAuth user") state.user = { id: 7, email: APPLICANT, role: "user" } as User;
        else if (identity === "verified email cookie") cookies[ECHELON_SESSION_COOKIE] = await verifiedCookie(APPLICANT);
        else cookies[ASSESSMENT_ONLY_COOKIE] = await applicantCookie();
        const client = browser(cookies);
        const ctx = await contextFor(client);
        const result = await route.verify(ctx, PURCHASER);
        if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
        expect(result).toMatchObject({ email: PURCHASER });
        expect(result.accessToken).toBeFalsy();
        expect(otpWasConsumed(route.table)).toBe(true);
        expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({
          candidateEmail: PURCHASER, assignmentId: ASSIGNMENT_ID, courseKey: COURSE,
        });
        expect(client.jar[ECHELON_SESSION_COOKIE]).toBeUndefined();
        // Issuance must not overwrite the current request's previously resolved identity.
        expect(ctx.user).toBe(state.user);
        expect(ctx.studentEmail).toBe(identity === "verified email cookie" ? APPLICANT : null);
        expect(state.issueToken).not.toHaveBeenCalled();
      },
    );

    it.each(["creation time", "ID tie-breaker"] as const)("selects the latest applicant invitation by %s", async ordering => {
      const latestId = "44444444-4444-4444-8444-444444444444";
      const columns = Object.values(getTableColumns(recruitmentAssignments)).map(column => `\`${column.name}\``);
      const values = columns.map(column => column === "`id`" || column === "`createdAtMs`" ? "?" : column);
      sqlite.prepare(`INSERT INTO recruitment_assignments (${columns.join(",")}) SELECT ${values.join(",")} FROM recruitment_assignments WHERE id = ?`)
        .run(latestId, NOW.getTime() + (ordering === "creation time" ? 1 : 0), ASSIGNMENT_ID);
      const client = browser();
      const ctx = await contextFor(client);
      await expect(route.request(ctx)).resolves.toEqual({ sent: true });
      const result = await route.verify(ctx, APPLICANT, route.deliveredCode());
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result).toMatchObject({ email: APPLICANT });
      expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({
        assignmentId: latestId, candidateEmail: APPLICANT, courseKey: COURSE,
      });
    });

    it.each(["invited", "active"])("authenticates a valid %s applicant only for their assessment", async status => {
      sqlite.prepare("UPDATE recruitment_assignments SET status = ? WHERE id = ?").run(status, ASSIGNMENT_ID);
      seedOtp(route.table);
      const client = browser({ [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT) });
      const result = await route.verify(await contextFor(client));
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result).toMatchObject({ email: APPLICANT });
      expect("valid" in result ? result.valid : result.success).toBe(true);
      expect("examTypes" in result ? result.examTypes : result.unlockedExamTypes).toEqual([]);
      expect(result.accessToken).toBeFalsy();
      expect(state.issueToken).not.toHaveBeenCalled();
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(client.res.clearCookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, { path: "/" });
      expect(client.res.cookie).toHaveBeenCalledTimes(1);
      expect(client.res.cookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true, path: "/" }));
      const locks = state.queries.filter(query => /\s+for (?:share|update)\s*$/i.test(query)
        && /from `(?:organizations|recruitment_assignments|hiring_terms)`/i.test(query));
      expect(locks).toHaveLength(3);
      expect(locks[0]).toMatch(/from `organizations`.*for share$/i);
      expect(locks[1]).toMatch(/from `recruitment_assignments`.*for update$/i);
      expect(locks[2]).toMatch(/from `hiring_terms`.*for share$/i);

      const next = browser(client.jar);
      expect(await readVerifiedEmailFromRequest(next.req)).toBeNull();
      expect(await readAssessmentOnlySession(next.req)).toMatchObject({
        typ: "assessment-only", assignmentId: ASSIGNMENT_ID, candidateEmail: APPLICANT, courseKey: COURSE,
      });
      const ctx = await contextFor(next);
      expect(ctx.studentEmail).toBeNull();
      expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
      expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    });

    it("clears an applicant cookie when an independently entitled learner logs in", async () => {
      seedOtp(route.table, PURCHASER);
      state.resolveEntitlements.mockImplementation(async (email: string) => email === PURCHASER ? learnerAccess(email) : noAccess(email));
      const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
      const result = await route.verify(await contextFor(client), PURCHASER);
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result).toMatchObject({ email: PURCHASER, accessToken: "synthetic-learner-token" });
      expect("examTypes" in result ? result.examTypes : result.unlockedExamTypes).toEqual(["oit"]);
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(state.issueToken).toHaveBeenCalledOnce();
      expect(state.issueToken).toHaveBeenCalledWith({ email: PURCHASER, examTypes: ["oit"] });
      expect(client.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
      expect(client.res.cookie).toHaveBeenCalledOnce();
      expect(client.res.cookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true, path: "/" }));
      const next = browser(client.jar);
      const ctx = await contextFor(next);
      expect(ctx.studentEmail).toBe(PURCHASER);
      expect(ctx.assessmentOnlySession).toBeNull();
      expect(() => assertLearnerStateAllowed(ctx)).not.toThrow();
    });

    it("does not block independent learner entitlement because their old invitation was revoked", async () => {
      seedOtp(route.table);
      sqlite.prepare("UPDATE recruitment_assignments SET status = 'revoked' WHERE id = ?").run(ASSIGNMENT_ID);
      state.resolveEntitlements.mockImplementation(async (email: string) => learnerAccess(email));
      const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
      const result = await route.verify(await contextFor(client));
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result.accessToken).toBe("synthetic-learner-token");
      expect(await readVerifiedEmailFromRequest(browser(client.jar).req)).toBe(APPLICANT);
      expect(client.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
    });

    it("does not block independent manager entitlement because their old invitation expired", async () => {
      seedOtp(route.table);
      sqlite.prepare("UPDATE recruitment_assignments SET expiresAtMs = ? WHERE id = ?").run(NOW.getTime() - 1, ASSIGNMENT_ID);
      state.resolveEntitlements.mockImplementation(async (email: string) => ({ ...noAccess(email), isManager: true, hasAnyAccess: true, sources: ["org_manager"] }));
      const client = browser();
      const result = await route.verify(await contextFor(client));
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result.accessToken).toBeFalsy();
      expect(await readVerifiedEmailFromRequest(browser(client.jar).req)).toBe(APPLICANT);
      expect(client.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
      expect(state.issueToken).not.toHaveBeenCalled();
    });

    it("does not treat someone else's live invitation as authorization", async () => {
      seedOtp(route.table, "uninvited@example.test");
      const client = browser();
      await expect(route.verify(await contextFor(client), "uninvited@example.test"))
        .rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(client.res.cookie).not.toHaveBeenCalled();
      expect(state.issueToken).not.toHaveBeenCalled();
    });
  });
}

describe("createContext applicant cookie identity isolation", () => {
  it.each(["verified purchaser cookie", "authenticated purchaser user"] as const)(
    "clears applicant A's cookie without blocking B via %s", async identity => {
      state.resolveEntitlements.mockImplementation(async (email: string) => email === PURCHASER ? learnerAccess(email) : noAccess(email));
      const cookies: Record<string, string> = { [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() };
      if (identity === "verified purchaser cookie") cookies[ECHELON_SESSION_COOKIE] = await verifiedCookie(PURCHASER);
      else state.user = { id: 42, email: " Purchaser-B@Example.TEST ", role: "user" } as User;
      const client = browser(cookies);
      const ctx = await contextFor(client);

      expect(ctx.studentEmail).toBe(identity === "verified purchaser cookie" ? PURCHASER : null);
      expect(ctx.user).toBe(state.user);
      expect(ctx.assessmentOnlySession).toBeNull();
      expect(ctx.assessmentOnlyHasLearnerAccess).toBeUndefined();
      expect(client.res.clearCookie).toHaveBeenCalledOnce();
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(client.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
      expect(state.resolveEntitlements).not.toHaveBeenCalledWith(APPLICANT);
      expect(() => assertLearnerStateAllowed(ctx)).not.toThrow();
    },
  );

  it("does not use applicant A's paid entitlement for purchaser B", async () => {
    // An old applicant can separately acquire paid access. That still must not
    // attach their capability or entitlement flags to a different identity.
    state.resolveEntitlements.mockImplementation(async (email: string) => email === APPLICANT ? learnerAccess(email) : noAccess(email));
    const client = browser({
      [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(),
      [ECHELON_SESSION_COOKIE]: await verifiedCookie(PURCHASER),
    });
    const ctx = await contextFor(client);
    expect(ctx.studentEmail).toBe(PURCHASER);
    expect(ctx.assessmentOnlySession).toBeNull();
    expect(ctx.assessmentOnlyHasLearnerAccess).not.toBe(true);
    expect(state.resolveEntitlements).not.toHaveBeenCalledWith(APPLICANT);
    expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
  });

  it("retains and restricts A's assessment capability when no other identity is verified", async () => {
    const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
    const ctx = await contextFor(client);
    expect(ctx.user).toBeNull();
    expect(ctx.studentEmail).toBeNull();
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: APPLICANT, assignmentId: ASSIGNMENT_ID });
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    expect(client.res.clearCookie).not.toHaveBeenCalled();
    expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("keeps a cookie-only applicant assessment-only even if their email later purchases a course", async () => {
    state.resolveEntitlements.mockImplementation(async (email: string) => learnerAccess(email));
    const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
    const ctx = await contextFor(client);
    expect(ctx.user).toBeNull();
    expect(ctx.studentEmail).toBeNull();
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("does not turn manager-only entitlement into learner access for an applicant", async () => {
    state.resolveEntitlements.mockImplementation(async (email: string) => ({ ...noAccess(email), hasAnyAccess: true, isManager: true, sources: ["org_manager"] }));
    const client = browser({
      [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(),
      [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT),
    });
    const ctx = await contextFor(client);
    expect(ctx.studentEmail).toBe(APPLICANT);
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it.each(["otp", "oauth"] as const)("allows an independently verified %s learner with real course entitlement", async identity => {
    state.resolveEntitlements.mockImplementation(async (email: string) => learnerAccess(email));
    const cookies: Record<string, string> = { [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() };
    if (identity === "otp") cookies[ECHELON_SESSION_COOKIE] = await verifiedCookie(APPLICANT);
    else state.user = { id: 7, email: APPLICANT, role: "user" } as User;
    const ctx = await contextFor(browser(cookies));
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: APPLICANT });
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(true);
    expect(() => assertLearnerStateAllowed(ctx)).not.toThrow();
  });

  it("does not clear the same applicant's capability merely because identity is verified", async () => {
    state.user = { id: 7, email: " Applicant-A@Example.TEST ", role: "user" } as User;
    const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
    const ctx = await contextFor(client);
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: APPLICANT });
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    expect(client.res.clearCookie).not.toHaveBeenCalled();
    expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });
});
