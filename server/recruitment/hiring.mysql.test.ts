import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  hiringTerms, organizationMembers, organizations, questions,
  recruitmentAssessments, recruitmentAssignments, subscriptions,
} from "../../drizzle/schema";
import type { RecruitmentQuestion } from "../../shared/recruitmentAssessment";
import type { TrpcContext } from "../_core/context";
import { ASSESSMENT_ONLY_COOKIE, readAssessmentOnlySession } from "../_core/assessmentOnlySession";
import { getDb } from "../db";
import { inviteRecruitmentCandidate, issueApplicantCapability, revokeRecruitmentAssignment } from "./service";
import type { RecruitmentDb, RecruitmentTransaction } from "./types";

// Only the central learner-entitlement preflight is synthetic. getDb, manager
// authorization, source visibility, invitation/issuance/revoke, SQL, locks,
// rollback/commit and local JWT signing all run their production implementations.
const preflight = vi.hoisted(() => ({ entitlements: vi.fn(async () => ({ hasAnyAccess: false })) }));
vi.mock("../_core/access", async original => ({
  ...await original<typeof import("../_core/access")>(),
  resolveEntitlementsByEmail: preflight.entitlements,
}));

const enabled = process.env.ECHELON_TEST_DATABASE === "I_UNDERSTAND_THIS_IS_A_DISPOSABLE_LOCAL_DATABASE";
const DAY = 86_400_000;
let db: RecruitmentDb;
let snapshot: RecruitmentQuestion[];

function gate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}
async function bounded<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer!: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), 5_000);
    })]);
  } finally { clearTimeout(timer); }
}
function browser(email: string) {
  const jar: Record<string, string> = {};
  const res = {
    cookie: vi.fn((name: string, value: string) => { jar[name] = value; }),
    clearCookie: vi.fn((name: string) => { delete jar[name]; }),
  };
  const ctx = { user: null, studentEmail: email, assessmentOnlySession: null,
    req: { headers: {}, cookies: jar }, res } as unknown as TrpcContext;
  return { ctx, res, jar };
}
async function fixture(used = 99) {
  const token = randomUUID(), now = Date.now();
  const managerEmail = `manager-${token}@example.test`, candidateEmail = `applicant-${token}@example.test`;
  const [{ id: orgId }] = await db.insert(organizations).values({
    name: "Synthetic Hiring MySQL team", province: "ontario", tier: "all-access",
    seatsTotal: 5, managerEmail, billingType: "invoice", status: "active",
    termStart: new Date(now - DAY), termEnd: new Date(now + 2 * DAY),
  }).$returningId();
  const assessmentId = randomUUID(), grantId = randomUUID();
  await db.insert(recruitmentAssessments).values({
    id: assessmentId, orgId, title: "Synthetic Hiring MySQL form", courseKey: "class2-water",
    courseLabel: "Class II Water Treatment", modules: ["Treatment"], questionCount: 5,
    timeLimitMinutes: 5, questions: snapshot, creatorEmail: managerEmail,
    createdAtMs: now, expiresAtMs: now + DAY,
  });
  await db.insert(hiringTerms).values({
    id: grantId, orgId, basis: "paid", startsAtMs: now - DAY, endsAtMs: now + DAY,
    quota: 100, used, state: "active", paymentState: "active", createdByEmail: managerEmail,
  });
  return { orgId, assessmentId, grantId, candidateEmail, manager: browser(managerEmail).ctx };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
const invite = (f: Fixture, email = f.candidateEmail, name = "Synthetic Applicant") =>
  inviteRecruitmentCandidate(f.manager, f.orgId, f.assessmentId, { candidateEmail: email, candidateName: name });
const assignments = (f: Fixture) => db.select().from(recruitmentAssignments).where(and(
  eq(recruitmentAssignments.orgId, f.orgId), eq(recruitmentAssignments.assessmentId, f.assessmentId),
));
const term = async (f: Fixture) => (await db.select().from(hiringTerms).where(eq(hiringTerms.id, f.grantId)))[0];

/** Observe real SQL at its execution point, without substituting a builder,
 * driver, result or lock. Each callback is delegated to the real transaction.
 * Gates observe attempts; NOWAIT probes below independently prove held locks. */
function observeTransactions(onQuery: (transaction: number, query: string) => void) {
  const realTransaction = db.transaction.bind(db);
  let transaction = 0;
  return vi.spyOn(db, "transaction").mockImplementation((callback, config) => {
    const number = transaction++;
    return realTransaction(async tx => {
      await tx.execute(sql`set session innodb_lock_wait_timeout = 3`);
      const session = (tx as unknown as { session: { logger: { logQuery(query: string, params: unknown[]): void } } }).session;
      const logger = session.logger;
      session.logger = { logQuery(query, params) { logger.logQuery(query, params); onQuery(number, query); } };
      return callback(tx);
    }, config);
  });
}
function lockTable(query: string): string | null {
  if (!/\bfor (?:share|update)\b/i.test(query)) return null;
  return query.match(/\bfrom `([^`]+)`/i)?.[1] ?? null;
}
async function expectHeld(tx: RecruitmentTransaction, table: "organizations" | "recruitment_assignments", id: number | string) {
  // This is a different real connection: an incompatible NOWAIT lock must fail.
  await expect(tx.execute(sql`select id from ${sql.identifier(table)} where id = ${id} for update nowait`))
    .rejects.toMatchObject({ cause: { code: "ER_LOCK_NOWAIT" } });
}

describe.skipIf(!enabled)("Hiring applicant transactions on disposable real InnoDB (not mocked SQL)", () => {
  beforeAll(async () => {
    if (!(globalThis as Record<string, unknown>).__echelonTestSafetyInstalled
      || process.env.DATABASE_URL !== "mysql://recruitment_test:disposable-local-only@127.0.0.1:3306/echelon_ci") {
      throw new Error("Run only the safety-preloaded, network-isolated Hiring MySQL rehearsal.");
    }
    const value = await getDb();
    if (!value) throw new Error("Disposable database unavailable");
    db = value;
    const [engines] = await db.execute(sql`select TABLE_NAME as name, ENGINE as engine from information_schema.TABLES
      where TABLE_SCHEMA = database() and TABLE_NAME in ('organizations', 'hiring_terms', 'recruitment_assignments', 'recruitment_assessments', 'questions')`);
    expect(engines).toHaveLength(5);
    expect((engines as unknown as { engine: string }[]).every(row => row.engine === "InnoDB")).toBe(true);
    const sources = Array.from({ length: 5 }, (_, n) => ({ bankKey: "class2-water", questionNum: 91_000 + n,
      module: "Treatment", question: `Synthetic Hiring lock fixture ${n}`, options: '["One","Two"]',
      correctIndex: 0, explanation: "Disposable fixture only", reviewStatus: "approved" as const }));
    const ids = await db.insert(questions).values(sources).$returningId();
    snapshot = sources.map((source, n) => ({ id: String(ids[n].id), module: source.module,
      prompt: source.question, options: ["One", "Two"], correctIndex: 0 }));
  }, 10_000);
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  it("serializes two overlapping applicant invites at quota 100/used 99: exactly one assignment and used 100", async () => {
    const f = await fixture(), held = gate(), locked = gate(), bothEntered = gate();
    const seatsBefore = await db.select().from(organizationMembers), subsBefore = await db.select().from(subscriptions);
    const holder = db.transaction(async tx => {
      await tx.select().from(organizations).where(eq(organizations.id, f.orgId)).for("update");
      locked.release(); await held.promise;
    });
    await bounded(locked.promise, "organization holder");
    let attempts = 0;
    observeTransactions((_, query) => { if (lockTable(query) === "organizations" && ++attempts === 2) bothEntered.release(); });
    const outcomes = Promise.allSettled([invite(f), invite(f, `second-${randomUUID()}@example.test`)]);
    try {
      await bounded(bothEntered.promise, "both concurrent invitation lock attempts");
      held.release(); await bounded(holder, "organization holder commit");
      const results = await bounded(outcomes, "competing invites");
      expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
      const failure = results.find(result => result.status === "rejected") as PromiseRejectedResult;
      expect(failure.reason).toMatchObject({ code: "PRECONDITION_FAILED" });
      const rows = await assignments(f);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ memberId: null, accessKind: "applicant", grantId: f.grantId, status: "invited" });
      expect(await term(f)).toMatchObject({ quota: 100, used: 100 });
      expect(await db.select().from(organizationMembers)).toEqual(seatsBefore);
      expect(await db.select().from(subscriptions)).toEqual(subsBefore);
    } finally { held.release(); await Promise.allSettled([holder, outcomes]); }
  }, 15_000);

  it("recovers the same immutable normalized email at full quota without incrementing or changing the original row", async () => {
    const f = await fixture(), created = await invite(f), before = await assignments(f);
    const recovered = await invite(f, ` ${f.candidateEmail.toUpperCase()} `, "Changed display name");
    expect(recovered).toMatchObject({ assignmentId: created.assignmentId, accessKind: "applicant", status: "recovered" });
    expect(await assignments(f)).toEqual(before);
    expect(await term(f)).toMatchObject({ quota: 100, used: 100 });
    const candidate = browser(f.candidateEmail);
    const capability = await issueApplicantCapability(candidate.ctx, created.assignmentId);
    expect(await readAssessmentOnlySession(candidate.ctx.req)).toEqual(capability);
    expect(candidate.res.cookie).toHaveBeenCalledOnce();
    expect(capability).toMatchObject({ assignmentId: created.assignmentId, candidateEmail: f.candidateEmail, courseKey: "class2-water" });
    expect(await assignments(f)).toEqual(before);
    expect(await term(f)).toMatchObject({ used: 100 });
  }, 10_000);

  it("cannot issue a capability for a real manager-revoked applicant invitation", async () => {
    const f = await fixture(), created = await invite(f);
    await revokeRecruitmentAssignment(f.manager, f.orgId, created.assignmentId, 0);
    const before = await assignments(f), candidate = browser(f.candidateEmail);
    expect(before[0]).toMatchObject({ status: "revoked", revision: 1 });
    await expect(issueApplicantCapability(candidate.ctx, created.assignmentId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(candidate.res.cookie).not.toHaveBeenCalled();
    expect(candidate.jar[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
    expect(candidate.ctx.assessmentOnlySession).toBeNull();
    expect(await assignments(f)).toEqual(before);
    expect(await term(f)).toMatchObject({ used: 100 });
  }, 10_000);

  it("issues under org -> assignment -> grant locks while a real revoke waits, without deadlock or resurrection", async () => {
    const f = await fixture(), created = await invite(f), held = gate(), locked = gate();
    const grantAttempt = gate(), revokeAttempt = gate(), trace: string[][] = [];
    const holder = db.transaction(async tx => {
      await tx.select().from(hiringTerms).where(eq(hiringTerms.id, f.grantId)).for("update");
      locked.release(); await held.promise;
    });
    await bounded(locked.promise, "grant holder");
    observeTransactions((number, query) => {
      const table = lockTable(query);
      if (!table) return;
      (trace[number] ??= []).push(table);
      if (number === 0 && table === "hiring_terms") grantAttempt.release();
    });
    const candidate = browser(f.candidateEmail);
    let issued = false, revoked = false;
    const issuance = issueApplicantCapability(candidate.ctx, created.assignmentId).then(value => { issued = true; return value; });
    // Attach rejection handlers immediately; bounded awaits below still surface errors.
    void issuance.catch(() => {});
    let revocation: ReturnType<typeof revokeRecruitmentAssignment> | undefined;
    try {
      await bounded(grantAttempt.promise, "issuance grant lock attempt");
      // At the third query, the first two real lock reads have completed.
      await db.transaction(async tx => {
        await expectHeld(tx, "organizations", f.orgId);
        await expectHeld(tx, "recruitment_assignments", created.assignmentId);
      });
      // Restore/reinstall observation so the probe transaction is not counted.
      vi.restoreAllMocks();
      observeTransactions((_, query) => { if (lockTable(query) === "recruitment_assignments") revokeAttempt.release(); });
      revocation = revokeRecruitmentAssignment(f.manager, f.orgId, created.assignmentId, 0).then(value => { revoked = true; return value; });
      void revocation.catch(() => {});
      await bounded(revokeAttempt.promise, "revocation assignment lock attempt");
      expect(issued).toBe(false); expect(revoked).toBe(false);
      expect(candidate.res.cookie).not.toHaveBeenCalled();
      held.release(); await bounded(holder, "grant holder commit");
      const capability = await bounded(issuance, "issuance without deadlock");
      await bounded(revocation, "revocation without deadlock");
      expect(trace[0]).toEqual(["organizations", "recruitment_assignments", "hiring_terms"]);
      expect(await readAssessmentOnlySession(candidate.ctx.req)).toEqual(capability);
      expect((await assignments(f))[0]).toMatchObject({ status: "revoked", revision: 1 });
      candidate.res.cookie.mockClear();
      await expect(issueApplicantCapability(candidate.ctx, created.assignmentId)).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(candidate.res.cookie).not.toHaveBeenCalled();
      expect(await term(f)).toMatchObject({ used: 100 });
    } finally { held.release(); await Promise.allSettled([holder, issuance, ...(revocation ? [revocation] : [])]); }
  }, 15_000);

  it.each(["Hiring term", "assessment form"] as const)("rejects an invite if its %s expires across a held real Hiring-term lock, without increment or insert", async kind => {
    const f = await fixture(), before = Date.now(), deadline = before + 60_000;
    if (kind === "Hiring term") await db.update(hiringTerms).set({ endsAtMs: deadline }).where(eq(hiringTerms.id, f.grantId));
    else await db.update(recruitmentAssessments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssessments.id, f.assessmentId));
    const held = gate(), locked = gate(), attempted = gate();
    const holder = db.transaction(async tx => {
      await tx.select().from(hiringTerms).where(eq(hiringTerms.id, f.grantId)).for("update");
      locked.release(); await held.promise;
    });
    await bounded(locked.promise, "expiry grant holder");
    observeTransactions((_, query) => { if (lockTable(query) === "hiring_terms") attempted.release(); });
    // Only Date.now is controlled; timers, mysql2 I/O and the real lock wait are
    // untouched. Advance exactly to expiry only after the lock SQL is submitted.
    const clock = vi.spyOn(Date, "now").mockReturnValue(before);
    let returned = false;
    const outcome = invite(f).then(value => { returned = true; return { value, error: null }; },
      error => { returned = true; return { value: null, error }; });
    try {
      await bounded(attempted.promise, "pre-expiry Hiring-term lock attempt");
      expect(returned).toBe(false);
      clock.mockReturnValue(deadline);
      held.release(); await bounded(holder, "expiry holder commit");
      const result = await bounded(outcome, "post-expiry refusal");
      expect(result.value).toBeNull();
      expect(result.error).toMatchObject({ code: kind === "Hiring term" ? "FORBIDDEN" : "CONFLICT" });
      expect(await assignments(f)).toEqual([]);
      expect(await term(f)).toMatchObject({ quota: 100, used: 99 });
    } finally { held.release(); await Promise.allSettled([holder, outcome]); clock.mockRestore(); }
  }, 15_000);
});
