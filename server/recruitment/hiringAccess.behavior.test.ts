import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HiringTerm, Organization, RecruitmentAssessmentRow, RecruitmentAssignmentRow, User } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), entitlements: vi.fn(), manager: vi.fn(), authenticate: vi.fn(), visible: vi.fn() }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../_core/access", async original => ({ ...await original<typeof import("../_core/access")>(), resolveEntitlementsByEmail: mocks.entitlements }));
vi.mock("../_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticate } }));
vi.mock("../teams/resolveManagerOrganization", () => ({ resolveManagedOrganization: mocks.manager }));
vi.mock("./questions", async original => ({ ...await original<typeof import("./questions")>(), assertRecruitmentSourcesVisible: mocks.visible }));

import { issueApplicantCapability, inviteRecruitmentCandidate, recruitmentResults } from "./service";
import { assertRecruitmentCandidate, verifiedRecruitmentEmail } from "./access";
import { operateRecruitmentCandidate } from "./store";
import { createContext } from "../_core/context";
import { ASSESSMENT_ONLY_COOKIE, assertLearnerStateAllowed, issueAssessmentOnlySession, readAssessmentOnlySession } from "../_core/assessmentOnlySession";
import { ECHELON_SESSION_COOKIE, issueVerifiedEmailSessionCookie } from "../_core/emailSession";

const NOW = Date.parse("2026-11-28T05:00:00Z");
const ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "33333333-3333-4333-8333-333333333333";
const FORM = "22222222-2222-4222-8222-222222222222";
const GRANT = "44444444-4444-4444-8444-444444444444";
const EMAIL = "applicant@example.test", MANAGER = "manager@example.test", KEY = "class2-water";
const organization = () => ({ id: 7, name: "Synthetic team", province: "ontario", tier: "all-access", billingType: "stripe", status: "active", managerEmail: MANAGER,
  termStart: new Date(NOW - 1000), termEnd: new Date(NOW + 86_400_000) } as Organization);
const assessment = () => ({ id: FORM, orgId: 7, title: "Synthetic form", courseKey: KEY, courseLabel: "Class 2 Water", modules: ["Treatment"], questionCount: 5,
  timeLimitMinutes: 5, expiresAtMs: NOW + 900_000, createdAtMs: NOW - 1000,
  questions: Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1), module: "Treatment", prompt: `Synthetic prompt ${i + 1}`, options: ["One", "Two"], correctIndex: 0 })) } as RecruitmentAssessmentRow);
const assignment = () => ({ id: ID, assessmentId: FORM, orgId: 7, memberId: null, accessKind: "applicant", grantId: GRANT, candidateEmail: EMAIL, candidateName: "Synthetic applicant", creatorEmail: MANAGER,
  status: "invited", expiresAtMs: NOW + 900_000, createdAtMs: NOW - 1000, updatedAtMs: NOW - 1000, startedAtMs: null, submittedAtMs: null,
  consentVersion: null, consentAcceptedAtMs: null, answers: {}, score: null, revision: 0, revokedAtMs: null, revokedByEmail: null } as RecruitmentAssignmentRow);
const term = () => ({ id: GRANT, orgId: 7, basis: "paid", state: "active", paymentState: "active", startsAtMs: NOW - 1000, endsAtMs: NOW + 86_400_000, quota: 100, used: 99 } as HiringTerm);

function browser(cookies: Record<string, string> = {}, studentEmail: string | null = EMAIL) {
  const jar = { ...cookies };
  const res = { cookie: vi.fn((name: string, value: string) => { jar[name] = value; }), clearCookie: vi.fn((name: string) => { delete jar[name]; }) };
  const ctx = { req: { cookies: jar }, res, user: null, studentEmail, assessmentOnlySession: null } as unknown as TrpcContext;
  return { ctx, jar, res };
}

/** Controlled mocked waits and rollback, not proof of real InnoDB isolation. */
function database(options: {
  org?: Organization | null; form?: RecruitmentAssessmentRow | null; rows?: RecruitmentAssignmentRow[]; grants?: HiringTerm[];
  beforeRead?: (table: string, lock: string | null, state: State) => void | Promise<void>;
  affectedRows?: number; insertFailure?: boolean; afterIncrement?: () => void; beforeCommit?: () => void | Promise<void>;
} = {}) {
  type Row = Record<string, any>;
  const state = { org: options.org === null ? null : options.org ?? organization(), form: options.form === null ? null : options.form ?? assessment(),
    rows: options.rows ?? [assignment()], grants: options.grants ?? [term()] };
  const events: string[] = [], reads: { table: string; lock: string | null; sql: string; params: unknown[] }[] = [], writes: string[] = [];
  let held = false;
  const dialect = new MySqlDialect();
  const matches = (row: Row, query: { sql: string; params: unknown[] }) => {
    // Equality bindings are enough for these fixture queries; live grant/time
    // predicates are also rechecked by the real authorization functions.
    const equalities = [...query.sql.matchAll(/`[^`]+`\.`([^`]+)` = \?/g)];
    return equalities.every(match => row[match[1]] === query.params[(query.sql.slice(0, match.index).match(/\?/g) ?? []).length]);
  };
  const tx = {
    select: vi.fn((selection?: Record<string, unknown>) => ({ from: (table: Parameters<typeof getTableName>[0]) => {
      const name = getTableName(table);
      const where = (condition: SQL) => {
        const query = dialect.sqlToQuery(condition), read = { table: name, lock: null as string | null, ...query }; reads.push(read);
        const builder = {
          limit: () => builder, orderBy: () => builder,
          for: (lock: string) => { read.lock = lock; return builder; },
          then: (resolve: (value: unknown[]) => unknown, reject?: (error: unknown) => unknown) => (async () => {
            events.push(`read:${name}:${read.lock ?? "none"}`);
            await options.beforeRead?.(name, read.lock, state);
            const values: Row[] = name === "organizations" ? (state.org ? [state.org] : [])
              : name === "recruitment_assignments" ? state.rows : name === "recruitment_assessments" ? (state.form ? [state.form] : [])
              : name === "hiring_terms" ? state.grants : [];
            const result = values.filter(row => matches(row, query));
            return structuredClone(selection ? result.map(row => Object.fromEntries(Object.keys(selection).map(key => [key, row[key]]))) : result);
          })().then(resolve, reject),
        };
        return builder;
      };
      return { where };
    } })),
    update: vi.fn((table: Parameters<typeof getTableName>[0]) => ({ set: (values: Row) => ({ where: async (condition: SQL) => {
      const name = getTableName(table); writes.push(`update:${name}`);
      const query = dialect.sqlToQuery(condition);
      if (name === "hiring_terms") {
        const affectedRows = options.affectedRows ?? 1;
        if (affectedRows === 1) for (const grant of state.grants.filter(row => matches(row, query))) grant.used++;
        options.afterIncrement?.();
        return [{ affectedRows }];
      }
      for (const row of state.rows.filter(row => matches(row, query))) Object.assign(row, structuredClone(values));
      return [{ affectedRows: 1 }];
    } }) })),
    insert: vi.fn((table: Parameters<typeof getTableName>[0]) => ({ values: async (values: Row) => {
      const name = getTableName(table); writes.push(`insert:${name}`);
      if (options.insertFailure) throw new Error("synthetic insert failure");
      state.rows.push({ ...assignment(), ...values } as RecruitmentAssignmentRow);
    } })),
  };
  const db = { ...tx, transaction: vi.fn(async (callback: (value: unknown) => unknown) => {
    const snapshot = structuredClone(state); events.push("transaction"); held = true;
    try { const result = await callback(tx); await options.beforeCommit?.(); events.push("commit"); return result; }
    catch (error) { Object.assign(state, snapshot); events.push("rollback"); throw error; }
    finally { held = false; }
  }) };
  mocks.getDb.mockResolvedValue(db);
  mocks.entitlements.mockImplementation(async () => { expect(held).toBe(false); events.push("entitlements"); return { hasAnyAccess: false, unlockedExamTypes: [], isManager: false }; });
  return { state, reads, writes, events, db, tx };
}
type State = { org: Organization | null; form: RecruitmentAssessmentRow | null; rows: RecruitmentAssignmentRow[]; grants: HiringTerm[] };

beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW);
  mocks.authenticate.mockResolvedValue(null); mocks.manager.mockResolvedValue(organization()); mocks.visible.mockResolvedValue(undefined);
  mocks.entitlements.mockResolvedValue({ hasAnyAccess: false, unlockedExamTypes: [], isManager: false });
});
afterEach(() => vi.useRealTimers());

const forbidden = { code: "FORBIDDEN" };

describe("live applicant capability issuance", () => {
  it("discovers scope unlocked, then signs within org -> assignment -> grant locks, without seat writes", async () => {
    const client = browser(), db = database({ beforeCommit: () => { expect(client.res.cookie).toHaveBeenCalledOnce(); } });
    const result = await issueApplicantCapability(client.ctx, ID);
    expect(result).toMatchObject({ assignmentId: ID, candidateEmail: EMAIL, courseKey: KEY });
    expect(client.ctx.assessmentOnlySession).toEqual(result);
    expect(db.reads.filter(read => read.lock).map(read => [read.table, read.lock])).toEqual([
      ["organizations", "share"], ["recruitment_assignments", "update"], ["hiring_terms", "share"],
    ]);
    expect(db.reads[0]).toMatchObject({ table: "recruitment_assignments", lock: null });
    expect(db.events.indexOf("entitlements")).toBeLessThan(db.events.indexOf("transaction"));
    expect(db.events.at(-1)).toBe("commit"); expect(db.writes).toEqual([]);
    expect(await readAssessmentOnlySession(client.ctx.req)).toEqual(result);
  });

  it.each(["revoked", "expired", "submitted", "timed_out"] as const)("does not freshly sign terminal %s assignments or change historical evidence", async status => {
    const row = { ...assignment(), status, submittedAtMs: status === "submitted" || status === "timed_out" ? NOW - 1 : null, answers: { "1": 0 } };
    const before = structuredClone(row), db = database({ rows: [row] }), client = browser();
    await expect(issueApplicantCapability(client.ctx, ID)).rejects.toMatchObject(forbidden);
    expect(client.res.cookie).not.toHaveBeenCalled(); expect(db.state.rows).toEqual([before]); expect(db.writes).toEqual([]);
  });

  it.each(["assignment", "assessment", "timer"])("rejects effective %s deadline before signing", async kind => {
    const row = assignment(), form = assessment();
    if (kind === "assignment") row.expiresAtMs = NOW;
    if (kind === "assessment") form.expiresAtMs = NOW;
    if (kind === "timer") { row.status = "active"; row.startedAtMs = NOW - 300_000; }
    database({ rows: [row], form }); const client = browser();
    await expect(issueApplicantCapability(client.ctx, ID)).rejects.toMatchObject(forbidden); expect(client.res.cookie).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", []], ["refunded", [{ ...term(), paymentState: "refunded" }]], ["revoked", [{ ...term(), state: "revoked" }]],
    ["future", [{ ...term(), startsAtMs: NOW + 1 }]], ["expired", [{ ...term(), endsAtMs: NOW }]], ["wrong org", [{ ...term(), orgId: 8 }]],
  ] as const)("rejects %s grant", async (_label, grants) => {
    database({ grants: [...grants] as HiringTerm[] }); const client = browser();
    await expect(issueApplicantCapability(client.ctx, ID)).rejects.toMatchObject(forbidden); expect(client.res.cookie).not.toHaveBeenCalled();
  });

  it.each(["grant", "organization", "assessment", "assignment"])("fails closed if %s expires during final grant lock wait", async kind => {
    const org = organization(), form = assessment(), row = assignment(), grant = term();
    if (kind === "grant") grant.endsAtMs = NOW + 1000;
    if (kind === "organization") org.termEnd = new Date(NOW + 1000);
    if (kind === "assessment") form.expiresAtMs = NOW + 1000;
    if (kind === "assignment") row.expiresAtMs = NOW + 1000;
    const db = database({ org, form, rows: [row], grants: [grant], beforeRead: (table, lock) => {
      if (table === "hiring_terms" && lock) {
        vi.setSystemTime(NOW + 1000);
      }
    } });
    const client = browser(); await expect(issueApplicantCapability(client.ctx, ID)).rejects.toMatchObject(forbidden);
    expect(client.res.cookie).not.toHaveBeenCalled(); expect(db.events.at(-1)).toBe("rollback");
  });

  it.each(["assessmentId", "orgId", "grantId", "candidateEmail"] as const)("rechecks discovered %s after assignment lock wait", async field => {
    database({ beforeRead: (table, lock, state) => { if (table === "recruitment_assignments" && lock) (state.rows[0] as any)[field] = field === "orgId" ? 8 : "changed"; } });
    const client = browser(); await expect(issueApplicantCapability(client.ctx, ID)).rejects.toMatchObject({ code: expect.stringMatching(/FORBIDDEN|CONFLICT/) });
    expect(client.res.cookie).not.toHaveBeenCalled();
  });

  it.each(["org", "form"] as const)("fails closed on missing %s parent", async kind => {
    database({ [kind]: null }); const client = browser();
    await expect(issueApplicantCapability(client.ctx, ID)).rejects.toMatchObject({ code: expect.stringMatching(/FORBIDDEN|NOT_FOUND/) });
    expect(client.res.cookie).not.toHaveBeenCalled();
  });

  it.each(["assignment", "assessment", "timer", "grant", "organization"])("bounds signed expiry to earliest %s deadline", async kind => {
    const row = assignment(), form = assessment(), grant = term(), org = organization();
    const deadline = NOW + 45_000;
    if (kind === "assignment") row.expiresAtMs = deadline;
    if (kind === "assessment") form.expiresAtMs = deadline;
    if (kind === "timer") { row.status = "active"; row.startedAtMs = deadline - 300_000; }
    if (kind === "grant") grant.endsAtMs = deadline;
    if (kind === "organization") org.termEnd = new Date(deadline);
    database({ rows: [row], form, grants: [grant], org }); const client = browser();
    const result = await issueApplicantCapability(client.ctx, ID);
    expect(client.ctx.assessmentOnlySession?.exp).toBe(Math.floor(deadline / 1000)); expect(result.assignmentId).toBe(ID);
  });

  it("uses the requested invitation for two invitations sharing one email", async () => {
    const second = { ...assignment(), id: OTHER_ID, expiresAtMs: NOW + 45_000 };
    database({ rows: [assignment(), second] }); const client = browser({}, null);
    await issueAssessmentOnlySession(client.ctx.res, { assignmentId: ID, candidateEmail: EMAIL, courseKey: KEY });
    client.ctx.assessmentOnlySession = await readAssessmentOnlySession(client.ctx.req);
    expect(verifiedRecruitmentEmail(client.ctx)).toBe(EMAIL);
    await issueApplicantCapability(client.ctx, OTHER_ID);
    expect(client.ctx.assessmentOnlySession).toMatchObject({ assignmentId: OTHER_ID, exp: Math.floor((NOW + 45_000) / 1000) });
  });
});

describe("applicant invitation quota and duplicate recovery", () => {
  const request = { candidateEmail: EMAIL, candidateName: "Synthetic applicant" };
  it("increments exactly one Hiring counter and inserts exactly one applicant, without customer or seat writes", async () => {
    const db = database({ rows: [], beforeRead: (table, lock) => { if (table === "hiring_terms" && lock) vi.setSystemTime(NOW + 1000); } });
    const result = await inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request);
    expect(result).toMatchObject({ status: "created", accessKind: "applicant" });
    expect(db.state.grants[0].used).toBe(100); expect(db.state.rows).toHaveLength(1);
    expect(db.state.rows[0]).toMatchObject({ createdAtMs: NOW + 1000, grantId: GRANT, memberId: null, accessKind: "applicant" });
    expect(db.writes).toEqual(["update:hiring_terms", "insert:recruitment_assignments"]);
  });

  it.each([0, 2])("rolls back and refuses insert unless increment affects exactly one row (%s)", async affectedRows => {
    const db = database({ rows: [], affectedRows });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.state.grants[0].used).toBe(99); expect(db.state.rows).toHaveLength(0); expect(db.writes).toEqual(["update:hiring_terms"]);
  });

  it.each(["grant", "organization", "assessment", "quota", "payment"])("revalidates %s after the term UPDATE lock wait", async kind => {
    const org = organization(), form = assessment(), grant = term();
    if (kind === "grant") grant.endsAtMs = NOW + 1000;
    if (kind === "organization") org.termEnd = new Date(NOW + 1000);
    if (kind === "assessment") form.expiresAtMs = NOW + 1000;
    const db = database({ rows: [], org, form, grants: [grant], beforeRead: (table, lock, state) => {
      if (table === "hiring_terms" && lock) {
        if (kind === "quota") state.grants[0].used = 100;
        if (kind === "payment") state.grants[0].paymentState = "refunded";
        vi.setSystemTime(NOW + 1000);
      }
    } });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).rejects.toMatchObject({ code: expect.stringMatching(/FORBIDDEN|CONFLICT|PRECONDITION_FAILED/) });
    expect(db.writes).toEqual([]); expect(db.state.rows).toHaveLength(0);
  });

  it("rolls back consumed quota when applicant insertion fails", async () => {
    const db = database({ rows: [], insertFailure: true });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).rejects.toThrow("synthetic insert failure");
    expect(db.state.grants[0].used).toBe(99); expect(db.state.rows).toHaveLength(0); expect(db.events.at(-1)).toBe("rollback");
  });

  it("rolls back if time elapses after increment but before insert", async () => {
    const db = database({ rows: [], grants: [{ ...term(), endsAtMs: NOW + 1000 }], afterIncrement: () => vi.setSystemTime(NOW + 1000) });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).rejects.toMatchObject(forbidden);
    expect(db.state.grants[0].used).toBe(99); expect(db.state.rows).toHaveLength(0);
  });

  it("recovers the same live invitation without charging quota or resetting its timer", async () => {
    const row = { ...assignment(), status: "active" as const, startedAtMs: NOW - 1000, revision: 4 }, before = structuredClone(row);
    const db = database({ rows: [row] });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).resolves.toMatchObject({ assignmentId: ID, status: "recovered" });
    expect(db.state.rows).toEqual([before]); expect(db.state.grants[0].used).toBe(99); expect(db.writes).toEqual([]);
    expect(db.reads.filter(read => read.lock).map(read => [read.table, read.lock])).toEqual([
      ["organizations", "update"], ["recruitment_assignments", "update"], ["hiring_terms", "share"],
    ]);
  });

  it.each(["missing", "refunded", "expired", "wrong org"])("does not recover a link with %s grant", async kind => {
    const grant = term(); if (kind === "refunded") grant.paymentState = "refunded";
    if (kind === "expired") grant.endsAtMs = NOW; if (kind === "wrong org") grant.orgId = 8;
    const db = database({ grants: kind === "missing" ? [] : [grant] });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).rejects.toMatchObject(forbidden);
    expect(db.writes).toEqual([]);
  });

  it("does not recover a link whose timer expires during the grant lock wait", async () => {
    const db = database({ rows: [{ ...assignment(), status: "active", startedAtMs: NOW - 299_000 }],
      beforeRead: (table, lock) => { if (table === "hiring_terms" && lock) vi.setSystemTime(NOW + 1000); } });
    await expect(inviteRecruitmentCandidate(browser({}, MANAGER).ctx, 7, FORM, request)).rejects.toMatchObject(forbidden); expect(db.writes).toEqual([]);
  });
});

describe("candidate bootstrap and durable timeout evidence", () => {
  it("bootstraps through real locked issuance for a verified live applicant", async () => {
    const db = database(), client = browser();
    const view = await operateRecruitmentCandidate(client.ctx, ID, { kind: "get" });
    expect(view).toMatchObject({ status: "invited", questions: [] }); expect(client.res.cookie).toHaveBeenCalledOnce();
    expect(db.reads.filter(read => read.lock).slice(0, 3).map(read => read.table)).toEqual(["organizations", "recruitment_assignments", "hiring_terms"]);
    expect(db.writes).toEqual([]);
  });

  it.each(["revoked", "expired", "elapsed"])("does not bootstrap capability for %s assignment", async kind => {
    const row = assignment(); if (kind === "elapsed") row.expiresAtMs = NOW; else row.status = kind as "revoked" | "expired";
    database({ rows: [row] }); const client = browser();
    await expect(operateRecruitmentCandidate(client.ctx, ID, { kind: "get" })).rejects.toMatchObject(forbidden);
    expect(client.res.cookie).not.toHaveBeenCalled();
  });

  it("never enters the global resolver or fresh issuance from a locked candidate check", async () => {
    const db = database(), client = browser();
    await expect(assertRecruitmentCandidate(client.ctx, db.tx as any, assignment(), KEY, { lock: true, bootstrapApplicantCapability: true })).rejects.toMatchObject(forbidden);
    expect(mocks.entitlements).not.toHaveBeenCalled(); expect(client.res.cookie).not.toHaveBeenCalled();
  });

  it("preserves timed timeout finalization when an existing authenticated request waits past its timer", async () => {
    const row = { ...assignment(), status: "active" as const, startedAtMs: NOW - 299_000, answers: { "1": 0 }, revision: 4 };
    const db = database({ rows: [row], beforeRead: (table, lock) => { if (table === "recruitment_assignments" && lock) vi.setSystemTime(NOW + 1000); } });
    const client = browser({}, null); client.ctx.assessmentOnlySession = { typ: "assessment-only", assignmentId: ID, candidateEmail: EMAIL, courseKey: KEY, exp: Math.floor((NOW + 1000) / 1000) };
    const view = await operateRecruitmentCandidate(client.ctx, ID, { kind: "get" });
    expect(view).toMatchObject({ status: "timed_out", submittedAtMs: NOW + 1000, questions: [], answers: {}, revision: 5 });
    expect(db.state.rows[0]).toMatchObject({ status: "timed_out", submittedAtMs: NOW + 1000, answers: { "1": 0 }, score: { correct: 1 } });
    expect(client.res.cookie).not.toHaveBeenCalled(); expect(mocks.entitlements).not.toHaveBeenCalled();
  });

  it("keeps completed revoked applicant evidence reportable after org and grant expiry", async () => {
    const row = { ...assignment(), status: "revoked" as const, submittedAtMs: NOW - 1000, answers: { "1": 0 }, revision: 4 };
    const before = structuredClone(row), db = database({ rows: [row], org: { ...organization(), termEnd: new Date(NOW - 1) }, grants: [{ ...term(), endsAtMs: NOW - 1, paymentState: "refunded" }] });
    const result = await recruitmentResults(browser({}, MANAGER).ctx, 7, FORM);
    expect(result.assessment.completed).toBe(1); expect(result.results[0]).toMatchObject({ status: "revoked", submittedAtMs: NOW - 1000, score: { correct: 1 }, answers: { "1": 0 } });
    expect(db.state.rows).toEqual([before]); expect(db.writes).toEqual([]);
  });
});

describe("independently authenticated learner boundary", () => {
  async function applicantBrowser() {
    const client = browser({}, null);
    await issueAssessmentOnlySession(client.ctx.res, { assignmentId: ID, candidateEmail: EMAIL, courseKey: KEY });
    client.res.cookie.mockClear(); return client;
  }

  it.each([false, true])("does not turn capability alone into learner access when email entitlement changes (%s)", async hasAnyAccess => {
    mocks.entitlements.mockResolvedValue({ hasAnyAccess, unlockedExamTypes: hasAnyAccess ? [KEY] : [], isManager: false });
    const client = await applicantBrowser(), ctx = await createContext({ req: client.ctx.req, res: client.ctx.res, info: {} } as any);
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: EMAIL }); expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    expect(mocks.entitlements).not.toHaveBeenCalled(); expect(verifiedRecruitmentEmail(ctx)).toBe(EMAIL);
    expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining(forbidden));
  });

  it.each(["otp", "oauth"])("allows matching independent %s identity only with actual learner course entitlement", async kind => {
    mocks.entitlements.mockResolvedValue({ hasAnyAccess: true, unlockedExamTypes: [KEY], isManager: false });
    const client = await applicantBrowser();
    if (kind === "otp") await issueVerifiedEmailSessionCookie(client.ctx.res, EMAIL);
    else mocks.authenticate.mockResolvedValue({ id: 42, email: " Applicant@Example.TEST " } as User);
    const ctx = await createContext({ req: client.ctx.req, res: client.ctx.res, info: {} } as any);
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(true); expect(() => assertLearnerStateAllowed(ctx)).not.toThrow();
    expect(mocks.entitlements).toHaveBeenCalledWith(EMAIL);
  });

  it("does not grant learner state for a matching independent manager-only identity", async () => {
    mocks.entitlements.mockResolvedValue({ hasAnyAccess: true, unlockedExamTypes: [], isManager: true });
    const client = await applicantBrowser(); await issueVerifiedEmailSessionCookie(client.ctx.res, EMAIL);
    const ctx = await createContext({ req: client.ctx.req, res: client.ctx.res, info: {} } as any);
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false); expect(() => assertLearnerStateAllowed(ctx)).toThrowError(expect.objectContaining(forbidden));
  });

  it.each(["otp", "oauth"])("clears A's applicant capability when independent learner B authenticates via %s", async kind => {
    const client = await applicantBrowser(); if (kind === "otp") await issueVerifiedEmailSessionCookie(client.ctx.res, "other@example.test");
    else mocks.authenticate.mockResolvedValue({ id: 42, email: "other@example.test" } as User);
    const ctx = await createContext({ req: client.ctx.req, res: client.ctx.res, info: {} } as any);
    expect(ctx.assessmentOnlySession).toBeNull(); expect(ctx.assessmentOnlyHasLearnerAccess).toBeUndefined();
    expect(client.res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" }); expect(mocks.entitlements).not.toHaveBeenCalled();
  });

  it.each(["oauth A otp B", "oauth B otp A"])("uses central OAuth precedence for conflicting identities (%s)", async kind => {
    mocks.entitlements.mockResolvedValue({ hasAnyAccess: true, unlockedExamTypes: [KEY], isManager: false });
    const client = await applicantBrowser(); await issueVerifiedEmailSessionCookie(client.ctx.res, kind === "oauth A otp B" ? "other@example.test" : EMAIL);
    mocks.authenticate.mockResolvedValue({ id: 42, email: kind === "oauth A otp B" ? EMAIL : "other@example.test" } as User);
    const ctx = await createContext({ req: client.ctx.req, res: client.ctx.res, info: {} } as any);
    if (kind === "oauth A otp B") {
      expect(ctx.assessmentOnlyHasLearnerAccess).toBe(true); expect(mocks.entitlements).toHaveBeenCalledWith(EMAIL);
    } else { expect(ctx.assessmentOnlySession).toBeNull(); expect(mocks.entitlements).not.toHaveBeenCalled(); }
  });

  it("a direct guard cannot accept a capability plus true flag without matching independent identity", () => {
    const capability = { candidateEmail: EMAIL };
    expect(() => assertLearnerStateAllowed({ assessmentOnlySession: capability, assessmentOnlyHasLearnerAccess: true })).toThrowError(expect.objectContaining(forbidden));
    expect(() => assertLearnerStateAllowed({ assessmentOnlySession: capability, assessmentOnlyHasLearnerAccess: true, studentEmail: "other@example.test" })).toThrowError(expect.objectContaining(forbidden));
    expect(() => assertLearnerStateAllowed({ assessmentOnlySession: capability, assessmentOnlyHasLearnerAccess: true, user: { id: 42, email: "other@example.test" }, studentEmail: EMAIL })).toThrowError(expect.objectContaining(forbidden));
    expect(() => assertLearnerStateAllowed({ assessmentOnlySession: capability, assessmentOnlyHasLearnerAccess: true, studentEmail: EMAIL })).not.toThrow();
  });

  it("signer fails closed rather than emitting an already-elapsed bounded capability", async () => {
    const client = browser(); await expect(issueAssessmentOnlySession(client.ctx.res, { assignmentId: ID, candidateEmail: EMAIL, courseKey: KEY, expiresAtMs: NOW })).rejects.toMatchObject(forbidden);
    expect(client.res.cookie).not.toHaveBeenCalled(); expect(client.jar[ECHELON_SESSION_COOKIE]).toBeUndefined();
  });
});
