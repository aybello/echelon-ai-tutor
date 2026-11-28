import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql-proxy";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import { dashboardOtps, emailOtpCodes, hiringTerms, organizations, questions, recruitmentAssignments, recruitmentAssessments } from "../../drizzle/schema";
import { getDb } from "../db";
import { emailOtpRouter } from "../routers/emailOtpRouter";
import { dashboardAuthRouter } from "../routers/dashboardAuthRouter";
import { recruitmentRouter } from "../routers/recruitmentRouter";
import { createContext, type TrpcContext } from "./context";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { assertAccess, identityEmail, resolveAccessForRequest, resolveVerifiedIdentity, verifyAccessTokenAndRecheckDb } from "./accessService";
import { ECHELON_SESSION_COOKIE, issueVerifiedEmailSessionCookie, readVerifiedEmailFromRequest } from "./emailSession";
import { ASSESSMENT_ONLY_COOKIE, assertLearnerStateAllowed, issueAssessmentOnlySession, readAssessmentOnlySession } from "./assessmentOnlySession";
import { issueApplicantCapability } from "../recruitment/service";
import { verifiedRecruitmentEmail } from "../recruitment/access";
import { readRecruitmentAssignment } from "../recruitment/store";
import { recordLearnerSignIn } from "../learnerSignIn";
import { trackEvent } from "../analytics";

const state = vi.hoisted(() => ({
  oauthUsers: new Map<string, User>(),
  resolveEntitlements: vi.fn(),
  resolveAccess: vi.fn(),
  resolveAccessByEmail: vi.fn(),
  issueToken: vi.fn(async () => "synthetic-learner-token"),
  sendEmail: vi.fn(),
  sendMail: vi.fn(),
  failCapabilityCommit: false,
  inTransaction: false,
  queries: [] as string[],
}));
// OAuth JWT verification and cookie parsing are real; replace only the local
// user lookup/write so no OAuth network request or production database is used.
vi.mock("../db", () => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(async (openId: string) => state.oauthUsers.get(openId)),
  upsertUser: vi.fn(async () => undefined),
}));
vi.mock("./access", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  FREE_EXAM_TYPES: new Set(["electrician-309a"]),
  resolveEntitlementsByEmail: state.resolveEntitlements,
  resolveAccess: state.resolveAccess,
  resolveAccessByEmail: state.resolveAccessByEmail,
}));
vi.mock("./subscriptionToken", async importOriginal => ({
  ...await importOriginal<typeof import("./subscriptionToken")>(),
  issueSubscriptionToken: state.issueToken,
}));
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
  const jsonColumns = new Map<string, Set<string>>();
  for (const table of [emailOtpCodes, dashboardOtps, recruitmentAssignments, recruitmentAssessments, organizations, hiringTerms, questions]) {
    jsonColumns.set(getTableName(table), new Set(Object.values(getTableColumns(table))
      .filter(column => column.dataType === "json").map(column => column.name)));
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
      // mysql2 returns JSON columns already decoded; SQLite stores their text.
      const json = jsonColumns.get(/ from `([^`]+)`/i.exec(query)?.[1] ?? "");
      return { rows: statement.all(...params).map(row => Object.entries(row)
        .map(([name, value]) => json?.has(name) && typeof value === "string" ? JSON.parse(value) : value)) };
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
  const snapshot = Array.from({ length: 5 }, (_, index) => ({
    id: String(index + 1), module: "Treatment", prompt: `Synthetic question ${index + 1}`,
    options: ["One", "Two"], correctIndex: 0,
  }));
  for (const question of snapshot) {
    sqlite.prepare("INSERT INTO questions (id, bankKey, module, question, options, correctIndex, reviewStatus) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(Number(question.id), COURSE, question.module, question.prompt, JSON.stringify(question.options), question.correctIndex, "unreviewed");
  }
  sqlite.prepare("INSERT INTO organizations (id, name, province, tier, seatsTotal, managerEmail, termStart, termEnd, billingType, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ORG_ID, "Test Annual team", "ontario", "all-access", 5, "manager@example.test", "2039-12-01 00:00:00.000", "2040-12-01 00:00:00.000", "stripe", "active", TIMESTAMP);
  sqlite.prepare("INSERT INTO hiring_terms (id, orgId, basis, sourceInvoiceId, startsAtMs, endsAtMs, quota, used, state, paymentState, createdByEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(GRANT_ID, ORG_ID, "paid", "in_test_hiring", NOW.getTime() - 86_400_000, NOW.getTime() + 86_400_000, 100, 1, "active", "active", "manager@example.test");
  sqlite.prepare("INSERT INTO recruitment_assessments (id, orgId, title, courseKey, courseLabel, modules, questionCount, questions, creatorEmail, createdAtMs, expiresAtMs, timeLimitMinutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ASSESSMENT_ID, ORG_ID, "Applicant assessment", COURSE, "Class 2 Water", '["Treatment"]', snapshot.length, JSON.stringify(snapshot), "manager@example.test", NOW.getTime(), NOW.getTime() + 3_600_000, 45);
  sqlite.prepare("INSERT INTO recruitment_assignments (id, assessmentId, orgId, memberId, grantId, candidateEmail, accessKind, status, expiresAtMs, creatorEmail, createdAtMs, updatedAtMs, answers, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ASSIGNMENT_ID, ASSESSMENT_ID, ORG_ID, null, GRANT_ID, APPLICANT, "applicant", "invited", NOW.getTime() + 3_600_000, "manager@example.test", NOW.getTime(), NOW.getTime(), "{}", 0);
}
function seedOtp(table: OtpTable, email = APPLICANT) {
  // Represents a correctly issued, still-live OTP. Invitation state is changed
  // only after issuance, independently of the OTP's ten-minute expiry.
  sqlite.prepare(`INSERT INTO \`${getTableName(table)}\` (id, email, codeHash, expiresAt, usedAt, attempts, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(1, email, createHash("sha256").update(CODE).digest("hex"), "2040-01-01 12:10:00.000", null, 0, TIMESTAMP);
}
const OTHER_ASSIGNMENT = "44444444-4444-4444-8444-444444444444";
function addNewerInvitation(id = OTHER_ASSIGNMENT) {
  const columns = Object.values(getTableColumns(recruitmentAssignments)).map(column => `\`${column.name}\``);
  const values = columns.map(column => column === "`id`" || column === "`createdAtMs`" ? "?" : column);
  sqlite.prepare(`INSERT INTO recruitment_assignments (${columns.join(",")}) SELECT ${values.join(",")} FROM recruitment_assignments WHERE id = ?`)
    .run(id, NOW.getTime() + 1, ASSIGNMENT_ID);
}
function otpWasConsumed(table: OtpTable) {
  return sqlite.prepare(`SELECT usedAt FROM \`${getTableName(table)}\` WHERE id = 1`).get()?.usedAt !== null;
}

// This cookie jar models browser cookie replacement/deletion while preserving
// the current request's immutable cookies until the next request.
function browser(initial: Record<string, string> = {}) {
  const jar = { ...initial };
  const cookie = Object.entries(jar).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ");
  const req = { headers: { cookie }, protocol: "https", cookies: { ...jar } } as TrpcContext["req"];
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

async function oauthCookie(email: string, id = 7) {
  const openId = `synthetic-user-${id}`;
  state.oauthUsers.set(openId, { id, openId, email, name: "Test user", role: "user" } as User);
  return sdk.signSession({ openId, appId: "synthetic-test-app", name: "Test user" });
}
async function expectApplicantDestination(ctx: TrpcContext, email: string) {
  expect(ctx.user).toBeNull();
  expect(ctx.studentEmail).toBeNull();
  expect(identityEmail(resolveVerifiedIdentity(ctx))).toBeNull();
  expect(verifiedRecruitmentEmail(ctx)).toBe(email);
  expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: email, assignmentId: ASSIGNMENT_ID });
  expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
  await expect(recruitmentRouter.createCaller(ctx).candidateGet({ assignmentId: ASSIGNMENT_ID })).resolves.toMatchObject({
    assignmentId: ASSIGNMENT_ID, title: "Applicant assessment", status: "invited", questions: [], answers: {},
  });
  expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  await expect(assertAccess(ctx, COURSE)).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(resolveAccessForRequest(ctx, COURSE)).resolves.toBe(false);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  previousSecret = ENV.cookieSecret;
  ENV.cookieSecret = "test-only-not-for-production";
  previousSmtp = { smtpHost: ENV.smtpHost, smtpUser: ENV.smtpUser, smtpPass: ENV.smtpPass };
  Object.assign(ENV, { smtpHost: "smtp.example.test", smtpUser: "mailer@example.test", smtpPass: "test-only-placeholder" });
  state.oauthUsers.clear();
  state.failCapabilityCommit = false;
  state.inTransaction = false;
  state.queries = [];
  state.resolveEntitlements.mockReset().mockImplementation(async (email: string) => {
    if (state.inTransaction) throw new Error("Global entitlement resolution attempted under transaction locks");
    return noAccess(email);
  });
  state.resolveAccessByEmail.mockReset().mockImplementation(async (email: string, course: string) => ({
    hasAccess: (await state.resolveEntitlements(email)).unlockedExamTypes.includes(course),
  }));
  state.resolveAccess.mockReset().mockImplementation(async (user: User, course: string) => state.resolveAccessByEmail(user.email, course));
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
    request: (ctx: TrpcContext, assignmentId?: string) => emailOtpRouter.createCaller(ctx).requestOtp({ email: APPLICANT, assignmentId }),
    deliveredCode: () => state.sendEmail.mock.calls[0][0].code as string,
    verify: (ctx: TrpcContext, email = APPLICANT, code = CODE, assignmentId?: string) => emailOtpRouter.createCaller(ctx).verifyOtp({ email, code, assignmentId }),
  },
  {
    name: "dashboardAuthRouter", table: dashboardOtps,
    request: (ctx: TrpcContext, assignmentId?: string) => dashboardAuthRouter.createCaller(ctx).sendOtp({ email: APPLICANT, assignmentId }),
    deliveredCode: () => (state.sendMail.mock.calls[0][0].subject as string).split(": ")[1],
    verify: (ctx: TrpcContext, email = APPLICANT, code = CODE, assignmentId?: string) => dashboardAuthRouter.createCaller(ctx).verifyOtp({ email, code, assignmentId }),
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
        if (identity === "OAuth user") cookies[COOKIE_NAME] = await oauthCookie(APPLICANT);
        else if (identity === "verified email cookie") cookies[ECHELON_SESSION_COOKIE] = await verifiedCookie(APPLICANT);
        else cookies[ASSESSMENT_ONLY_COOKIE] = await applicantCookie();
        const client = browser(cookies);
        const ctx = await contextFor(client);
        if (identity === "OAuth user") expect(ctx.user?.email).toBe(APPLICANT);
        const result = await route.verify(ctx, PURCHASER);
        if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
        expect(result).toMatchObject({ email: PURCHASER, sessionKind: "assessment-only" });
        expect(result.accessToken).toBeFalsy();
        expect(otpWasConsumed(route.table)).toBe(true);
        expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({
          candidateEmail: PURCHASER, assignmentId: ASSIGNMENT_ID, courseKey: COURSE,
        });
        expect(client.jar[ECHELON_SESSION_COOKIE]).toBeUndefined();
        expect(client.jar[COOKIE_NAME]).toBeUndefined();
        if (identity === "OAuth user") {
          expect(client.res.clearCookie).toHaveBeenCalledWith(COOKIE_NAME, {
            ...getSessionCookieOptions(client.req), sameSite: "lax",
          });
        }
        // Issuance must not overwrite the current request's previously resolved identity.
        expect(ctx.user?.email ?? null).toBe(identity === "OAuth user" ? APPLICANT : null);
        expect(ctx.studentEmail).toBe(identity === "verified email cookie" ? APPLICANT : null);
        expect(state.issueToken).not.toHaveBeenCalled();
        expect(recordLearnerSignIn).not.toHaveBeenCalled();
        expect(trackEvent).not.toHaveBeenCalled();
        expect(client.res.cookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true }));

        const destination = browser(client.jar);
        await expectApplicantDestination(await contextFor(destination), PURCHASER);
        await expectApplicantDestination(await contextFor(browser(destination.jar)), PURCHASER);
      },
    );

    it("clears the previous OAuth identity on local HTTP as well as secure requests", async () => {
      seedOtp(route.table);
      const client = browser({ [COOKIE_NAME]: await oauthCookie(PURCHASER) });
      Object.assign(client.req, { protocol: "http" });
      const ctx = await contextFor(client);
      expect(ctx.user?.email).toBe(PURCHASER);
      await route.verify(ctx);
      expect(client.res.clearCookie).toHaveBeenCalledWith(COOKIE_NAME, {
        ...getSessionCookieOptions(client.req), sameSite: "lax", secure: false,
      });
      await expectApplicantDestination(await contextFor(browser(client.jar)), APPLICANT);
    });

    it("does not sign out an OAuth user for an unverified switch attempt", async () => {
      seedOtp(route.table);
      const token = await oauthCookie(PURCHASER);
      const client = browser({ [COOKIE_NAME]: token });
      const ctx = await contextFor(client);
      if (route.name === "emailOtpRouter") {
        await expect(route.verify(ctx, APPLICANT, "000000")).resolves.toMatchObject({ valid: false, reason: "wrong_code" });
      } else {
        await expect(route.verify(ctx, APPLICANT, "000000")).rejects.toThrow("Incorrect code.");
      }
      expect(client.jar[COOKIE_NAME]).toBe(token);
      expect((await contextFor(browser(client.jar))).user?.email).toBe(PURCHASER);
    });

    it("lets a genuinely later independent OAuth login replace the fresh applicant, not vice versa", async () => {
      seedOtp(route.table);
      const login = browser({ [COOKIE_NAME]: await oauthCookie(PURCHASER, 42) });
      await route.verify(await contextFor(login));
      const applicant = browser(login.jar);
      await expectApplicantDestination(await contextFor(applicant), APPLICANT);

      // An independent login occurs AFTER OTP success. Context must still give
      // that new verified identity priority over the now-stale applicant cookie.
      state.resolveEntitlements.mockImplementation(async email => email === PURCHASER ? learnerAccess(email) : noAccess(email));
      const laterLogin = browser({ ...applicant.jar, [COOKIE_NAME]: await oauthCookie(PURCHASER, 43) });
      const learner = await contextFor(laterLogin);
      expect(learner.user?.email).toBe(PURCHASER);
      expect(verifiedRecruitmentEmail(learner)).toBe(PURCHASER);
      expect(learner.assessmentOnlySession).toBeNull();
      expect(laterLogin.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
      await expect(assertAccess(learner, "oit")).resolves.toBeUndefined();
      await expect(resolveAccessForRequest(learner, "oit")).resolves.toBe(true);
      await expect(readRecruitmentAssignment((await getDb())!, ASSIGNMENT_ID, verifiedRecruitmentEmail(learner)))
        .rejects.toMatchObject({ code: "FORBIDDEN" });
      const following = await contextFor(browser(laterLogin.jar));
      expect(following.user?.email).toBe(PURCHASER);
      expect(following.assessmentOnlySession).toBeNull();
      await expect(assertAccess(following, "oit")).resolves.toBeUndefined();
    });

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

    it("uses the requested older invitation rather than the newest same-email row", async () => {
      addNewerInvitation();
      const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
      const ctx = await contextFor(client);
      await route.request(ctx, ASSIGNMENT_ID);
      await route.verify(ctx, APPLICANT, route.deliveredCode(), ASSIGNMENT_ID);
      expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({ assignmentId: ASSIGNMENT_ID });
      expect(recordLearnerSignIn).not.toHaveBeenCalled(); expect(trackEvent).not.toHaveBeenCalled();
    });

    it.each(["elapsed timer", "suspended grant", "expired assessment", "expired organization"])(
      "unbound login skips a newer invitation with %s and issues the valid older invitation", async invalid => {
        addNewerInvitation();
        if (invalid === "elapsed timer") {
          sqlite.prepare("UPDATE recruitment_assignments SET status = 'active', startedAtMs = ? WHERE id = ?")
            .run(NOW.getTime() - 45 * 60_000, OTHER_ASSIGNMENT);
        } else if (invalid === "suspended grant") {
          sqlite.exec("INSERT INTO hiring_terms SELECT * FROM hiring_terms");
          // The memory adapter intentionally has no production constraints.
          sqlite.prepare("UPDATE hiring_terms SET id = ?, state = 'suspended' WHERE rowid = (SELECT MAX(rowid) FROM hiring_terms)")
            .run("55555555-5555-4555-8555-555555555555");
          sqlite.prepare("UPDATE recruitment_assignments SET grantId = ? WHERE id = ?")
            .run("55555555-5555-4555-8555-555555555555", OTHER_ASSIGNMENT);
        } else if (invalid === "expired assessment") {
          sqlite.exec("INSERT INTO recruitment_assessments SELECT * FROM recruitment_assessments");
          sqlite.prepare("UPDATE recruitment_assessments SET id = ?, expiresAtMs = ? WHERE rowid = (SELECT MAX(rowid) FROM recruitment_assessments)")
            .run("66666666-6666-4666-8666-666666666666", NOW.getTime());
          sqlite.prepare("UPDATE recruitment_assignments SET assessmentId = ? WHERE id = ?")
            .run("66666666-6666-4666-8666-666666666666", OTHER_ASSIGNMENT);
        } else {
          sqlite.exec("INSERT INTO organizations SELECT * FROM organizations");
          sqlite.prepare("UPDATE organizations SET id = 2, termEnd = ? WHERE rowid = (SELECT MAX(rowid) FROM organizations)").run(TIMESTAMP);
          sqlite.prepare("UPDATE recruitment_assignments SET orgId = 2 WHERE id = ?").run(OTHER_ASSIGNMENT);
        }
        const client = browser();
        const ctx = await contextFor(client);
        await route.request(ctx);
        await route.verify(ctx, APPLICANT, route.deliveredCode());
        expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({ assignmentId: ASSIGNMENT_ID });
        expect(client.res.cookie).toHaveBeenCalledTimes(1);
        expect(recordLearnerSignIn).not.toHaveBeenCalled(); expect(trackEvent).not.toHaveBeenCalled();
      },
    );

    it.each([undefined, OTHER_ASSIGNMENT])("cannot verify an invitation-bound code as scope %s", async wrongScope => {
      addNewerInvitation();
      const client = browser({
        [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(), [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT),
      });
      const ctx = await contextFor(client);
      await route.request(ctx, ASSIGNMENT_ID);
      const code = route.deliveredCode();
      if (route.name === "emailOtpRouter") {
        await expect(route.verify(ctx, APPLICANT, code, wrongScope)).resolves.toMatchObject({ valid: false, reason: "wrong_code" });
      } else {
        await expect(route.verify(ctx, APPLICANT, code, wrongScope)).rejects.toThrow("Incorrect code.");
      }
      expect(otpWasConsumed(route.table)).toBe(false); expect(client.jar).toEqual({});
      expect(client.res.cookie).not.toHaveBeenCalled(); expect(recordLearnerSignIn).not.toHaveBeenCalled();
      await route.verify(ctx, APPLICANT, code, ASSIGNMENT_ID);
      expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({ assignmentId: ASSIGNMENT_ID });
    });

    it("fresh bound OTP authorizes Y but revoked X capability alone cannot", async () => {
      addNewerInvitation();
      sqlite.prepare("UPDATE recruitment_assignments SET status = 'revoked' WHERE id = ?").run(ASSIGNMENT_ID);
      const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() });
      const ctx = await contextFor(client);
      await expect(issueApplicantCapability(ctx, OTHER_ASSIGNMENT)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await route.request(ctx, OTHER_ASSIGNMENT);
      await route.verify(ctx, APPLICANT, route.deliveredCode(), OTHER_ASSIGNMENT);
      expect(await readAssessmentOnlySession(browser(client.jar).req)).toMatchObject({ assignmentId: OTHER_ASSIGNMENT });
      expect(ctx.studentEmail).toBeNull();
      expect(recordLearnerSignIn).not.toHaveBeenCalled(); expect(trackEvent).not.toHaveBeenCalled();
    });

    it("never falls back from a requested invalid invitation to another valid one", async () => {
      addNewerInvitation();
      const client = browser(), ctx = await contextFor(client);
      await route.request(ctx, OTHER_ASSIGNMENT);
      sqlite.prepare("UPDATE recruitment_assignments SET status = 'revoked' WHERE id = ?").run(OTHER_ASSIGNMENT);
      await expect(route.verify(ctx, APPLICANT, route.deliveredCode(), OTHER_ASSIGNMENT)).rejects.toThrow("This invitation is no longer available.");
      expect(otpWasConsumed(route.table)).toBe(true); expect(client.jar).toEqual({});
      expect(client.res.cookie).not.toHaveBeenCalled();
    });

    it.each([false, true])("does not retry issuer commit failure (bound invitation %s)", async bound => {
      addNewerInvitation();
      const client = browser(), ctx = await contextFor(client);
      const assignmentId = bound ? ASSIGNMENT_ID : undefined;
      await route.request(ctx, assignmentId);
      state.failCapabilityCommit = true;
      await expect(route.verify(ctx, APPLICANT, route.deliveredCode(), assignmentId)).rejects.toThrow("This invitation is no longer available.");
      expect(client.res.cookie).toHaveBeenCalledTimes(1); expect(client.jar).toEqual({});
      expect(recordLearnerSignIn).not.toHaveBeenCalled(); expect(trackEvent).not.toHaveBeenCalled();
    });

    it.each(["invited", "active"])("authenticates a valid %s applicant only for their assessment", async status => {
      sqlite.prepare("UPDATE recruitment_assignments SET status = ? WHERE id = ?").run(status, ASSIGNMENT_ID);
      seedOtp(route.table);
      const client = browser({ [ECHELON_SESSION_COOKIE]: await verifiedCookie(APPLICANT) });
      const result = await route.verify(await contextFor(client));
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result).toMatchObject({ email: APPLICANT, sessionKind: "assessment-only" });
      expect("valid" in result ? result.valid : result.success).toBe(true);
      expect("examTypes" in result ? result.examTypes : result.unlockedExamTypes).toEqual([]);
      expect(result.accessToken).toBeFalsy();
      expect(state.issueToken).not.toHaveBeenCalled();
      expect(otpWasConsumed(route.table)).toBe(true);
      expect(recordLearnerSignIn).not.toHaveBeenCalled();
      expect(trackEvent).not.toHaveBeenCalled();
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

    it.each([false, true])("clears an applicant cookie when an independently entitled learner logs in (old OAuth: %s)", async oldOAuth => {
      seedOtp(route.table, PURCHASER);
      state.resolveEntitlements.mockImplementation(async (email: string) => email === PURCHASER ? learnerAccess(email) : noAccess(email));
      const cookies: Record<string, string> = { [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() };
      if (oldOAuth) cookies[COOKIE_NAME] = await oauthCookie(APPLICANT);
      const client = browser(cookies);
      const before = await contextFor(client);
      expect(verifiedRecruitmentEmail(before)).toBe(APPLICANT);
      const result = await route.verify(before, PURCHASER);
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result).toMatchObject({ email: PURCHASER, accessToken: "synthetic-learner-token", sessionKind: "verified-email" });
      expect("examTypes" in result ? result.examTypes : result.unlockedExamTypes).toEqual(["oit"]);
      expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
      expect(state.issueToken).toHaveBeenCalledOnce();
      expect(state.issueToken).toHaveBeenCalledWith({ email: PURCHASER, examTypes: ["oit"] });
      expect(recordLearnerSignIn).toHaveBeenCalledWith(client.req, { email: PURCHASER }, route.name === "emailOtpRouter" ? "email_otp" : "dashboard_otp");
      expect(client.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
      expect(client.res.cookie).toHaveBeenCalledOnce();
      expect(client.res.cookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true, path: "/" }));
      const next = browser(client.jar);
      const ctx = await contextFor(next);
      expect(ctx.user).toBeNull();
      expect(ctx.studentEmail).toBe(PURCHASER);
      expect(ctx.assessmentOnlySession).toBeNull();
      expect(() => assertLearnerStateAllowed(ctx)).not.toThrow();
      await expect(assertAccess(ctx, "oit")).resolves.toBeUndefined();
      await expect(resolveAccessForRequest(ctx, "oit")).resolves.toBe(true);
      const following = await contextFor(browser(next.jar));
      expect(verifiedRecruitmentEmail(following)).toBe(PURCHASER);
      await expect(assertAccess(following, "oit")).resolves.toBeUndefined();
      await expect(readRecruitmentAssignment((await getDb())!, ASSIGNMENT_ID, verifiedRecruitmentEmail(following)))
        .rejects.toMatchObject({ code: "FORBIDDEN" });
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

    it("clears a queued ordinary identity cookie if access-token issuance fails", async () => {
      seedOtp(route.table, PURCHASER);
      state.resolveEntitlements.mockImplementation(async (email: string) => learnerAccess(email));
      state.issueToken.mockRejectedValueOnce(new Error("Synthetic token-signing failure"));
      const client = browser();
      await expect(route.verify(await contextFor(client), PURCHASER)).rejects.toThrow("Synthetic token-signing failure");
      expect(client.res.cookie).toHaveBeenCalledWith(ECHELON_SESSION_COOKIE, expect.any(String), expect.any(Object));
      expect(client.jar).toEqual({}); expect(recordLearnerSignIn).not.toHaveBeenCalled();
    });

    it("does not block independent manager entitlement because their old invitation expired", async () => {
      seedOtp(route.table);
      sqlite.prepare("UPDATE recruitment_assignments SET expiresAtMs = ? WHERE id = ?").run(NOW.getTime() - 1, ASSIGNMENT_ID);
      state.resolveEntitlements.mockImplementation(async (email: string) => ({ ...noAccess(email), isManager: true, hasAnyAccess: true, sources: ["org_manager"] }));
      const client = browser();
      const result = await route.verify(await contextFor(client));
      if ("valid" in result && !result.valid) throw new Error(`Unexpected OTP rejection: ${result.reason}`);
      expect(result.accessToken).toBeFalsy();
      expect(result.sessionKind).toBe("verified-email");
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
  it.each(["otp", "oauth"] as const)("denies verified B borrowing entitled C's signed token after stale A is cleared (%s)", async identity => {
    const tokenOwner = "learner-c@example.test";
    state.resolveEntitlements.mockImplementation(async email => email === tokenOwner ? learnerAccess(email) : noAccess(email));
    const { issueSubscriptionToken } = await vi.importActual<typeof import("./subscriptionToken")>("./subscriptionToken");
    const token = await issueSubscriptionToken({ email: tokenOwner, examTypes: ["oit"] });
    expect(await verifyAccessTokenAndRecheckDb(token, "oit")).toEqual({ hasAccess: true, email: tokenOwner });
    const cookies: Record<string, string> = { [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() };
    if (identity === "otp") cookies[ECHELON_SESSION_COOKIE] = await verifiedCookie(PURCHASER);
    else cookies[COOKIE_NAME] = await oauthCookie(PURCHASER, 42);
    const client = browser(cookies);
    const ctx = await contextFor(client);
    expect(identityEmail(resolveVerifiedIdentity(ctx))).toBe(PURCHASER);
    expect(ctx.assessmentOnlySession).toBeNull();
    expect(client.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
    state.resolveAccessByEmail.mockClear();
    await expect(assertAccess(ctx, "oit", { accessToken: token })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(resolveAccessForRequest(ctx, "oit", { accessToken: token })).resolves.toBe(false);
    expect(state.resolveAccessByEmail).not.toHaveBeenCalledWith(tokenOwner, "oit");
    const following = await contextFor(browser(client.jar));
    expect(identityEmail(resolveVerifiedIdentity(following))).toBe(PURCHASER);
    await expect(assertAccess(following, "oit", { accessToken: token })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it.each(["verified purchaser cookie", "authenticated purchaser user"] as const)(
    "clears applicant A's cookie without blocking B via %s", async identity => {
      state.resolveEntitlements.mockImplementation(async (email: string) => email === PURCHASER ? learnerAccess(email) : noAccess(email));
      const cookies: Record<string, string> = { [ASSESSMENT_ONLY_COOKIE]: await applicantCookie() };
      if (identity === "verified purchaser cookie") cookies[ECHELON_SESSION_COOKIE] = await verifiedCookie(PURCHASER);
      else cookies[COOKIE_NAME] = await oauthCookie(" Purchaser-B@Example.TEST ", 42);
      const client = browser(cookies);
      const ctx = await contextFor(client);

      expect(ctx.studentEmail).toBe(identity === "verified purchaser cookie" ? PURCHASER : null);
      expect(ctx.user?.email ?? null).toBe(identity === "authenticated purchaser user" ? " Purchaser-B@Example.TEST " : null);
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
    else cookies[COOKIE_NAME] = await oauthCookie(APPLICANT);
    const ctx = await contextFor(browser(cookies));
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: APPLICANT });
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(true);
    expect(() => assertLearnerStateAllowed(ctx)).not.toThrow();
  });

  it("does not clear the same applicant's capability merely because identity is verified", async () => {
    const client = browser({ [ASSESSMENT_ONLY_COOKIE]: await applicantCookie(), [COOKIE_NAME]: await oauthCookie(" Applicant-A@Example.TEST ") });
    const ctx = await contextFor(client);
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: APPLICANT });
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    expect(client.res.clearCookie).not.toHaveBeenCalled();
    expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });
});
