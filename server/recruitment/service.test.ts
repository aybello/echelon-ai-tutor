import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Organization, OrganizationMember, RecruitmentAssessmentRow, RecruitmentAssignmentRow, Subscription } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import { DELEGATED_MANAGER_ROLE } from "../teams/delegatedManagers";

const mocks = vi.hoisted(() => ({ recruitmentManager: vi.fn(), assertRecruitmentSeat: vi.fn(), recruitmentDb: vi.fn(), readRecruitmentAssessment: vi.fn(), persistRecruitmentTransition: vi.fn(), loadRecruitmentPools: vi.fn() }));
vi.mock("./access", async original => ({ ...await original<typeof import("./access")>(), recruitmentManager: mocks.recruitmentManager, assertRecruitmentSeat: mocks.assertRecruitmentSeat }));
vi.mock("./store", () => ({ recruitmentDb: mocks.recruitmentDb, readRecruitmentAssessment: mocks.readRecruitmentAssessment, persistRecruitmentTransition: mocks.persistRecruitmentTransition }));
vi.mock("./questions", async original => ({ ...await original<typeof import("./questions")>(), loadRecruitmentPools: mocks.loadRecruitmentPools }));
import { createRecruitmentAssessment, inviteRecruitmentCandidate, listRecruitmentAssessments, recruitmentCatalog, recruitmentDefinitionSummary, recruitmentResults, revokeRecruitmentAssignment } from "./service";
import { recruitmentResult } from "./state";

const NOW = Date.parse("2026-11-27T19:00:00Z");
const ID = "11111111-1111-4111-8111-111111111111";
const FORM_ID = "22222222-2222-4222-8222-222222222222";
const EMAIL = "manager@example.test";
const context = { user: null, studentEmail: EMAIL, req: {}, res: {} } as unknown as TrpcContext;
const org = () => ({ id: 7, name: "Synthetic utility", province: "ontario", tier: "all-access", billingType: "stripe", status: "active", termStart: new Date(NOW - 1000), termEnd: new Date(NOW + 86_400_000), managerEmail: EMAIL } as Organization);
const member = () => ({ id: 31, orgId: 7, email: "candidate@example.test", name: "Synthetic candidate", role: "operator", status: "assigned", courseKey: "class2-water", courseKeys: null } as OrganizationMember);
const form = () => ({ id: FORM_ID, orgId: 7, title: "Synthetic assessment", courseKey: "class2-water", courseLabel: "Class 2 Water", modules: ["Treatment"], questionCount: 5, timeLimitMinutes: 5, createdAtMs: NOW - 1000, expiresAtMs: NOW + 900_000,
  questions: Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1), module: "Treatment", prompt: `Synthetic prompt ${i + 1}`, options: ["One", "Two"], correctIndex: 0 })),
} as RecruitmentAssessmentRow);
const invited = () => ({ id: ID, assessmentId: FORM_ID, orgId: 7, memberId: 31, candidateEmail: member().email, candidateName: member().name, creatorEmail: EMAIL, status: "invited", startedAtMs: null, submittedAtMs: null, consentVersion: null, consentAcceptedAtMs: null, expiresAtMs: NOW + 900_000, createdAtMs: NOW - 1000, updatedAtMs: NOW - 1000, answers: {}, score: null, revision: 0, revokedAtMs: null, revokedByEmail: null } as RecruitmentAssignmentRow);
const active = () => ({ ...invited(), status: "active" as const, startedAtMs: NOW, revision: 1 });

/** Read/write spy only: no assertion of real MySQL transaction isolation. */
function fakeManagerDb(lockedOrg: Organization, existing?: RecruitmentAssignmentRow, options: {
  afterPoolRead?: () => void; beforeSourceRead?: (id: number) => void | Promise<void>;
} = {}) {
  const reads: { table: string; lock: string | null }[] = [];
  const sourceIds: number[] = [];
  const sources = form().questions.map(q => ({ id: Number(q.id), bankKey: "class2-water", reviewStatus: "approved",
    module: q.module, question: q.prompt, options: JSON.stringify(q.options), correctIndex: q.correctIndex }));
  const insertValues = vi.fn(async () => undefined);
  const insert = vi.fn(() => ({ values: insertValues }));
  const tx = {
    select: vi.fn(() => ({ from: (table: Parameters<typeof getTableName>[0]) => ({ where: (predicate: SQL) => {
      const name = getTableName(table), read = { table: name, lock: null as string | null };
      reads.push(read);
      const { params } = new MySqlDialect().sqlToQuery(predicate);
      const builder = {
        limit: () => builder,
        orderBy: () => builder,
        for: (lock: string) => { read.lock = lock; return builder; },
        then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => (async () => {
          if (name === "questions") {
            if (read.lock) {
              expect(read.lock).toBe("share");
              const id = Number(params[0]); sourceIds.push(id);
              await options.beforeSourceRead?.(id);
              return sources.filter(source => source.id === id && source.bankKey === params[1]
                && !params.slice(2).includes(source.reviewStatus)).map(source => ({ id: source.id }));
            }
            const pool = structuredClone(sources.filter(source => source.bankKey === params[0]
              && !params.slice(1).includes(source.reviewStatus)));
            options.afterPoolRead?.(); return pool;
          }
          return name === "organizations" ? [lockedOrg] : name === "recruitment_assignments" ? (existing ? [existing] : []) : [];
        })().then(resolve, reject),
      };
      return builder;
    } }) })),
    insert,
  };
  const db = { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(tx)) };
  mocks.recruitmentDb.mockResolvedValue(db);
  return { db, reads, insert, insertValues, sources, sourceIds };
}

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

/** Explicit mocked lock/commit boundaries; the MySQL suite proves actual isolation. */
function fakeReportingDb(options: {
  org?: Organization | null; rows?: RecruitmentAssignmentRow[]; definitions?: RecruitmentAssessmentRow[];
  members?: OrganizationMember[]; subscriptions?: Subscription[];
  delegates?: OrganizationMember[]; waitForRead?: (table: string) => Promise<void>; beforeCommit?: () => Promise<void>;
} = {}) {
  const reads: { table: string; lock: string | null; order: string[]; sql: string; params: unknown[] }[] = [];
  const events: string[] = [];
  const rows = options.rows ?? [active()];
  const tx = {
    select: vi.fn((selection?: { id: unknown }) => ({ from: (table: Parameters<typeof getTableName>[0]) => ({ where: (condition: SQL) => {
      const name = getTableName(table), query = new MySqlDialect().sqlToQuery(condition);
      const read = { table: name, lock: null as string | null, order: [] as string[], sql: query.sql, params: query.params };
      reads.push(read);
      const builder = {
        limit: () => builder,
        orderBy: (...columns: { name?: string }[]) => { read.order = columns.map(column => column.name ?? "expression"); return builder; },
        for: (lock: string) => { read.lock = lock; return builder; },
        then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => (async () => {
          events.push(`read:${name}`);
          await options.waitForRead?.(name);
          const values = name === "organizations" ? (options.org === null ? [] : [options.org ?? org()])
            : name === "recruitment_assignments" ? (read.lock ? rows.filter(row => query.params.includes(row.id)) : rows)
            : name === "recruitment_assessments" ? options.definitions ?? [form()]
            : name === "organization_members" ? (read.lock ? options.delegates ?? [] : options.members ?? options.delegates ?? [])
            : name === "subscriptions" ? options.subscriptions ?? [] : [];
          return structuredClone(selection ? (values as RecruitmentAssignmentRow[]).map(row => ({ id: row.id })) : values);
        })().then(resolve, reject),
      };
      return builder;
    } }) })),
  };
  const db = { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
    events.push("transaction");
    const result = await callback(tx);
    events.push("before-commit");
    await options.beforeCommit?.();
    events.push("commit");
    return result;
  }) };
  mocks.recruitmentDb.mockResolvedValue(db);
  mocks.persistRecruitmentTransition.mockImplementation(async (_tx, before, after) => {
    events.push(`persist:${before.id}`);
    const index = rows.findIndex(row => row.id === before.id);
    rows[index] = structuredClone(after);
  });
  return { db, tx, reads, events, rows };
}

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW);
  mocks.recruitmentManager.mockResolvedValue(org());
  mocks.assertRecruitmentSeat.mockResolvedValue(member());
  mocks.readRecruitmentAssessment.mockResolvedValue(form());
  mocks.persistRecruitmentTransition.mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

describe("transaction-authorized recruitment catalog", () => {
  it.each([
    ["missing", null],
    ["cancelled", { ...org(), status: "cancelled" }],
    ["future term", { ...org(), termStart: new Date(NOW + 1) }],
    ["old term", { ...org(), termEnd: new Date(NOW) }],
    ["Flex", { ...org(), billingType: "course-pass" }],
  ] as const)("rejects accepted preflight but locked %s organization before roster reads", async (_label, lockedOrg) => {
    const db = fakeReportingDb({ org: lockedOrg as Organization | null });
    await expect(recruitmentCatalog(context, 7)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.recruitmentManager).toHaveBeenCalledWith(context, 7, true);
    expect(db.reads).toEqual([expect.objectContaining({ table: "organizations", lock: "share", params: [7] })]);
    expect(mocks.loadRecruitmentPools).not.toHaveBeenCalled(); expect(db.events).not.toContain("commit");
  });

  it("rejects a revoked delegate after accepted preflight before any sensitive roster read", async () => {
    const db = fakeReportingDb({ org: { ...org(), managerEmail: "owner@example.test" }, members: [member()] });
    await expect(recruitmentCatalog(context, 7)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.reads.map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, { table: "organization_members", lock: "share" },
    ]);
    expect(db.reads[1].params).toEqual([7, EMAIL, DELEGATED_MANAGER_ROLE, "assigned"]);
    expect(mocks.loadRecruitmentPools).not.toHaveBeenCalled(); expect(db.events).not.toContain("commit");
  });

  it.each(["owner", "delegate"] as const)("returns only scoped eligible candidates for an authorized %s after lock checks and commit", async actor => {
    const delegatedOrg = { ...org(), name: "Locked current team", managerEmail: actor === "owner" ? EMAIL : "owner@example.test" };
    const delegate = { ...member(), id: 32, email: EMAIL, role: DELEGATED_MANAGER_ROLE, courseKey: null, courseKeys: null };
    const beforeCommit = barrier(), atCommit = barrier(), managerWait = barrier(), managerEntered = barrier();
    const candidate = { ...member(), courseKeys: '["class2-water","class2-water-dist","western-class2-water"]' };
    const sub = { orgId: 7, email: candidate.email, tier: "class2", province: "ontario", status: "active",
      stripeSubscriptionId: `org-7-${candidate.email}-class2-water`, currentPeriodStart: new Date(NOW - 1000), currentPeriodEnd: new Date(NOW + 86_400_000) } as Subscription;
    const db = fakeReportingDb({ org: delegatedOrg, delegates: [delegate],
      members: [candidate, delegate, { ...candidate, id: 33, orgId: 8 }, { ...candidate, id: 34, email: "uncovered@example.test" }],
      subscriptions: [sub, { ...sub, orgId: 8, email: "uncovered@example.test" }],
      waitForRead: async table => {
        if (actor === "delegate" && table === "organization_members" && db.reads.at(-1)?.lock) {
          managerEntered.release(); await managerWait.promise;
        }
      }, beforeCommit: async () => { atCommit.release(); await beforeCommit.promise; } });
    mocks.recruitmentManager.mockImplementation(async () => { expect(db.events).toEqual([]); return org(); });
    mocks.loadRecruitmentPools.mockResolvedValue(new Map([
      ["class2-water", form().questions], ["class2-water-dist", form().questions], ["western-class2-water", form().questions],
    ]));
    let returned = false;
    const pending = recruitmentCatalog(context, 7).then(value => { returned = true; return value; });
    if (actor === "delegate") {
      await managerEntered.promise;
      expect(mocks.loadRecruitmentPools).not.toHaveBeenCalled();
      expect(db.reads.every(read => read.lock === "share")).toBe(true);
      managerWait.release();
    }
    await atCommit.promise;
    expect(returned).toBe(false);
    expect(mocks.recruitmentManager).toHaveBeenCalledOnce();
    expect(mocks.loadRecruitmentPools.mock.calls[0][0]).toBe(db.tx);
    expect(mocks.loadRecruitmentPools.mock.calls[0][1]).not.toContain("western-class2-water");
    expect(db.db.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
    expect(db.reads.filter(read => read.lock).map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, ...(actor === "delegate" ? [{ table: "organization_members", lock: "share" }] : []),
    ]);
    for (const read of db.reads.filter(read => !read.lock)) {
      expect(read.sql).toContain(`\`${read.table}\`.\`orgId\` = ?`); expect(read.params).toContain(7);
    }
    beforeCommit.release();
    const catalog = await pending;
    expect(db.events.at(-1)).toBe("commit"); expect(catalog.orgName).toBe("Locked current team");
    expect(catalog.courses.map(course => course.courseKey)).toEqual(["class2-water", "class2-water-dist"]);
    expect(catalog.candidates).toEqual([{ memberId: 31, email: candidate.email, name: candidate.name, courseKeys: ["class2-water"] }]);
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });

  it("rejects term expiry during transaction reads at the final clock check without committing a catalog", async () => {
    const db = fakeReportingDb({ waitForRead: async table => { if (table === "subscriptions") vi.setSystemTime(NOW + 86_400_000); } });
    mocks.loadRecruitmentPools.mockResolvedValue(new Map());
    await expect(recruitmentCatalog(context, 7)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.reads[0]).toMatchObject({ table: "organizations", lock: "share" });
    expect(db.events).not.toContain("commit");
  });
});

describe("manager immutable source acceptance", () => {
  const createInput = { orgId: 7, title: "Synthetic new form", courseKey: "class2-water", modules: ["Treatment"],
    questionCount: 5, timeLimitMinutes: 5, expiresInDays: 7 };

  it.each(["missing", "other-bank", "in_review", "rejected"])("refuses to freeze selected sources changed to %s after the unlocked pool read", async change => {
    const db = fakeManagerDb(org(), undefined, { afterPoolRead: () => {
      if (change === "missing") db.sources.splice(2, 1);
      else if (change === "other-bank") db.sources[2].bankKey = "class2-water-dist";
      else db.sources[2].reviewStatus = change;
    } });
    await expect(createRecruitmentAssessment(context, createInput)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i),
    });
    expect(db.sourceIds).toEqual([1, 2, 3]); expect(db.insert).not.toHaveBeenCalled();
    expect(db.reads[0]).toEqual({ table: "organizations", lock: "update" });
  });

  it("freezes selected content only after locking exact sources in order, preserving the selected snapshot", async () => {
    const db = fakeManagerDb(org(), undefined, { afterPoolRead: () => { db.sources[2].question = "Later current text"; } });
    const result = await createRecruitmentAssessment(context, createInput);
    expect(db.sourceIds).toEqual([1, 2, 3, 4, 5]);
    expect(db.insertValues).toHaveBeenCalledWith(expect.objectContaining({ id: result.assessmentId,
      questions: expect.arrayContaining([expect.objectContaining({ id: "3", prompt: "Synthetic prompt 3" })]) }));
    expect(db.db.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
  });

  it.each(["fresh", "invited", "active"] as const)("rejects unavailable original sources before returning the %s link or inserting", async mode => {
    for (const change of ["missing", "other-bank", "in_review", "rejected"]) {
      const existing = mode === "fresh" ? undefined : mode === "active" ? active() : invited();
      const before = structuredClone(existing), frozen = form();
      const db = fakeManagerDb(org(), existing);
      if (change === "missing") db.sources.splice(2, 1);
      else if (change === "other-bank") db.sources[2].bankKey = "class2-water-dist";
      else db.sources[2].reviewStatus = change;
      await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({
        code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i),
      });
      expect(db.sourceIds).toEqual([1, 2, 3]); expect(db.insert).not.toHaveBeenCalled();
      expect(existing).toEqual(before); expect(form()).toEqual(frozen);
      expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    }
  });

  it.each(["create", "fresh", "duplicate"])("rejects current Annual term lapse during source waits for %s", async mode => {
    const lockedOrg = { ...org(), termEnd: new Date(NOW + 1) };
    const db = fakeManagerDb(lockedOrg, mode === "duplicate" ? active() : undefined,
      { beforeSourceRead: () => { vi.setSystemTime(NOW + 1); } });
    const operation = mode === "create" ? createRecruitmentAssessment(context, createInput)
      : inviteRecruitmentCandidate(context, 7, FORM_ID, 31);
    await expect(operation).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it.each(["fresh", "duplicate"])("rejects %s invitation deadline crossing during governance waits", async mode => {
    mocks.readRecruitmentAssessment.mockResolvedValue({ ...form(), expiresAtMs: NOW + 1 });
    const db = fakeManagerDb(org(), mode === "duplicate" ? active() : undefined,
      { beforeSourceRead: () => { vi.setSystemTime(NOW + 1); } });
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.insert).not.toHaveBeenCalled(); expect(mocks.assertRecruitmentSeat).toHaveBeenCalledTimes(2);
  });

  it("rechecks exact seat/subscription after source waits before returning a duplicate usable link", async () => {
    const db = fakeManagerDb(org(), active());
    mocks.assertRecruitmentSeat.mockResolvedValueOnce(member()).mockRejectedValueOnce({ code: "FORBIDDEN" });
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.sourceIds).toEqual([1, 2, 3, 4, 5]); expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("recruitment duplicate invitations", () => {
  it.each(["invited", "active"] as const)("returns the original usable %s invitation without inserting or resetting it", async status => {
    const row = status === "active" ? active() : invited(), before = structuredClone(row);
    const db = fakeManagerDb(org(), row);
    expect(await inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).toEqual({ assignmentId: ID });
    expect(row).toEqual(before); expect(db.insert).not.toHaveBeenCalled();
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    expect(db.reads[0]).toEqual({ table: "organizations", lock: "update" });
  });
  it.each(["submitted", "timed_out", "expired", "revoked"] as const)("rejects duplicate terminal %s invitations with a new-form-required conflict", async status => {
    const row = { ...active(), status }, before = structuredClone(row), db = fakeManagerDb(org(), row);
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringMatching(/new assessment form/i) });
    expect(row).toEqual(before); expect(db.insert).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
  it.each([
    ["assessment expiry", "invited", NOW, NOW + 900_000, NOW],
    ["assignment expiry", "invited", NOW + 900_000, NOW, NOW],
    ["active assessment expiry", "active", NOW, NOW + 900_000, NOW],
    ["active assignment expiry", "active", NOW + 900_000, NOW, NOW],
    ["timer boundary", "active", NOW + 900_000, NOW + 900_000, NOW + 300_000],
    ["elapsed timer", "active", NOW + 900_000, NOW + 900_000, NOW + 300_001],
  ] as const)("rejects effectively unusable duplicate invitation at %s", async (_label, status, formExpiry, rowExpiry, nowMs) => {
    mocks.readRecruitmentAssessment.mockResolvedValue({ ...form(), expiresAtMs: formExpiry });
    const row = { ...(status === "active" ? active() : invited()), expiresAtMs: rowExpiry };
    const db = fakeManagerDb(org(), row); vi.setSystemTime(nowMs);
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringMatching(/new assessment form/i) });
    expect(db.insert).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
  it("permits an active duplicate just before its unchanged timer deadline", async () => {
    const row = active(), db = fakeManagerDb(org(), row); vi.setSystemTime(NOW + 299_999);
    expect(await inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).toEqual({ assignmentId: ID });
    expect(row.startedAtMs).toBe(NOW); expect(db.insert).not.toHaveBeenCalled();
  });
  it("inserts one new original invitation only for an unexpired form", async () => {
    const db = fakeManagerDb(org());
    const result = await inviteRecruitmentCandidate(context, 7, FORM_ID, 31);
    expect(db.insertValues).toHaveBeenCalledOnce();
    expect(db.insertValues).toHaveBeenCalledWith(expect.objectContaining({ id: result.assignmentId, assessmentId: FORM_ID, orgId: 7, memberId: 31, status: "invited", answers: {}, revision: 0, expiresAtMs: form().expiresAtMs }));
  });
  it("rejects an expired form without inserting a new invitation", async () => {
    mocks.readRecruitmentAssessment.mockResolvedValue({ ...form(), expiresAtMs: NOW });
    const db = fakeManagerDb(org());
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("recruitment revocation reporting boundary and retained evidence", () => {
  it.each([{ billingType: "course-pass" }, { tier: "course-pass" }])("rejects a locked organization that changed to Flex (%j)", async override => {
    const db = fakeManagerDb({ ...org(), ...override } as Organization, active());
    await expect(revokeRecruitmentAssignment(context, 7, ID)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.reads).toEqual([{ table: "organizations", lock: "share" }]);
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
  it("retains submitted evidence, completion count and recomputed review after revocation", async () => {
    const row = { ...active(), status: "submitted" as const, submittedAtMs: NOW - 100, answers: { "1": 0 }, score: { correct: 999 } as RecruitmentAssignmentRow["score"] };
    fakeManagerDb(org(), row);
    expect(await revokeRecruitmentAssignment(context, 7, ID)).toEqual({ success: true });
    const next = mocks.persistRecruitmentTransition.mock.calls[0][2] as RecruitmentAssignmentRow;
    expect(next).toMatchObject({ status: "revoked", submittedAtMs: NOW - 100, answers: { "1": 0 }, revokedAtMs: NOW, revokedByEmail: EMAIL });
    expect(recruitmentDefinitionSummary(form(), [next]).completed).toBe(1);
    expect(recruitmentResult(form(), next, NOW)).toMatchObject({ status: "revoked", answers: { "1": 0 }, score: { correct: 1, answered: 1 } });
  });
  it("finalizes an elapsed active timer before revoking and keeps that completion evidence", async () => {
    fakeManagerDb(org(), { ...active(), answers: { "1": 0 } }); vi.setSystemTime(NOW + 300_000);
    await revokeRecruitmentAssignment(context, 7, ID);
    const next = mocks.persistRecruitmentTransition.mock.calls[0][2] as RecruitmentAssignmentRow;
    expect(next).toMatchObject({ status: "revoked", submittedAtMs: NOW + 300_000, score: { correct: 1 }, revision: 3 });
    expect(recruitmentDefinitionSummary(form(), [next]).completed).toBe(1);
  });
});

describe("durable manager recruitment reporting", () => {
  it("counts only stored completion evidence, never projects an unlocked overdue row", () => {
    vi.setSystemTime(NOW + 300_000);
    expect(recruitmentDefinitionSummary(form(), [active()]).completed).toBe(0);
    expect(recruitmentDefinitionSummary(form(), [{ ...active(), status: "revoked", submittedAtMs: NOW }]).completed).toBe(1);
  });

  it.each(["results", "list"] as const)("waits for %s finalization and transaction commit before returning durable completion", async kind => {
    const beforeCommit = barrier(), atCommit = barrier();
    const db = fakeReportingDb({ rows: [{ ...active(), answers: { "1": 0 } }], beforeCommit: async () => { atCommit.release(); await beforeCommit.promise; } });
    mocks.recruitmentManager.mockImplementation(async () => { expect(db.events).toEqual([]); return org(); });
    vi.setSystemTime(NOW + 300_000);
    let returned = false;
    const pending = (kind === "results" ? recruitmentResults(context, 7, FORM_ID) : listRecruitmentAssessments(context, 7))
      .then(value => { returned = true; return value; });
    await atCommit.promise;
    expect(returned).toBe(false);
    expect(db.rows[0]).toMatchObject({ status: "timed_out", answers: { "1": 0 }, submittedAtMs: NOW + 300_000, revision: 2, score: { correct: 1, answered: 1 } });
    expect(mocks.persistRecruitmentTransition).toHaveBeenCalledOnce();
    expect(mocks.persistRecruitmentTransition.mock.calls[0][0]).toBe(db.tx);
    expect(db.reads.filter(read => read.lock).map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, { table: "recruitment_assignments", lock: "update" },
    ]);
    const assignmentRead = db.reads.find(read => read.table === "recruitment_assignments")!;
    expect(assignmentRead.order).toEqual(["id"]);
    expect(assignmentRead.sql).toContain("`recruitment_assignments`.`orgId` = ?");
    expect(assignmentRead.params).toContain(7);
    if (kind === "results") expect(assignmentRead.params).toContain(FORM_ID);
    expect(db.db.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
    expect(mocks.recruitmentManager).toHaveBeenCalledOnce();
    expect(mocks.recruitmentManager).toHaveBeenCalledWith(context, 7, false);
    beforeCommit.release();
    const result = await pending;
    expect(db.events.at(-1)).toBe("commit");
    if (Array.isArray(result)) expect(result[0].completed).toBe(1);
    else {
      expect(result.assessment.completed).toBe(1);
      expect(result.results[0]).toMatchObject({ status: "timed_out", answers: { "1": 0 }, score: { correct: 1 }, revision: 2 });
      expect(result.results[0].questions).toHaveLength(5);
    }
  });

  it("captures the clock only after assignment AND delegated-manager lock waits", async () => {
    const assignmentWait = barrier(), assignmentEntered = barrier(), managerWait = barrier(), managerEntered = barrier();
    const delegatedOrg = { ...org(), managerEmail: "different-manager@example.test" };
    const db = fakeReportingDb({ org: delegatedOrg, delegates: [{ ...member(), email: EMAIL, role: DELEGATED_MANAGER_ROLE, courseKey: null, courseKeys: null }],
      waitForRead: async table => {
        if (table === "recruitment_assignments") { assignmentEntered.release(); await assignmentWait.promise; }
        if (table === "organization_members") { managerEntered.release(); await managerWait.promise; }
      } });
    const clock = vi.spyOn(Date, "now");
    const pending = recruitmentResults(context, 7, FORM_ID);
    await managerEntered.promise;
    expect(clock).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    expect(mocks.readRecruitmentAssessment).not.toHaveBeenCalled();
    managerWait.release(); await assignmentEntered.promise;
    expect(clock).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    vi.setSystemTime(NOW + 300_000); assignmentWait.release();
    const report = await pending;
    expect(report.results[0].status).toBe("timed_out"); expect(report.assessment.completed).toBe(1);
    expect(db.reads.filter(read => read.lock).map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, { table: "organization_members", lock: "share" }, { table: "recruitment_assignments", lock: "update" },
    ]);
    clock.mockRestore();
  });

  it("locks individual same-org assignments in ID order across assessment definitions", async () => {
    const secondId = "33333333-3333-4333-8333-333333333333", secondForm = "44444444-4444-4444-8444-444444444444";
    const db = fakeReportingDb({ rows: [{ ...active(), id: secondId, assessmentId: secondForm }, active()],
      definitions: [{ ...form(), id: secondForm }, form()] });
    await listRecruitmentAssessments(context, 7);
    const locks = db.reads.filter(read => read.table === "recruitment_assignments" && read.lock === "update");
    expect(locks.map(read => read.params)).toEqual([[ID, 7], [secondId, 7]]);
    expect(locks.every(read => read.sql.includes("`recruitment_assignments`.`orgId` = ?"))).toBe(true);
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });

  it.each(["results", "list"] as const)("rechecks locked organization and manager authorization for %s", async kind => {
    const report = () => kind === "results" ? recruitmentResults(context, 7, FORM_ID) : listRecruitmentAssessments(context, 7);
    for (const override of [{ status: "cancelled" }, { billingType: "course-pass" }, { tier: "course-pass" }]) {
      const db = fakeReportingDb({ org: { ...org(), ...override } as Organization });
      await expect(report()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.reads).toHaveLength(1); expect(db.events).not.toContain("commit");
    }
    const db = fakeReportingDb({ org: { ...org(), managerEmail: "replacement@example.test" } });
    vi.setSystemTime(NOW + 300_000);
    await expect(report()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.reads.map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, { table: "organization_members", lock: "share" },
    ]);
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled(); expect(db.events).not.toContain("commit");
  });


  it("preserves resolver-authorized historical Annual reporting and stable finalization across list/results", async () => {
    const db = fakeReportingDb({ org: { ...org(), status: "past_due", termEnd: new Date(NOW - 1) }, rows: [{ ...active(), answers: { "1": 0 } }, { ...invited(), id: "33333333-3333-4333-8333-333333333333", expiresAtMs: NOW }] });
    vi.setSystemTime(NOW + 300_000);
    expect((await listRecruitmentAssessments(context, 7))[0]).toMatchObject({ candidates: 2, completed: 1 });
    expect(db.rows[1]).toMatchObject({ status: "expired", submittedAtMs: null, score: null });
    expect(mocks.persistRecruitmentTransition).toHaveBeenCalledTimes(2);
    const before = structuredClone(db.rows);
    const report = await recruitmentResults(context, 7, FORM_ID);
    expect(report.assessment.completed).toBe(1);
    expect(report.results.find(row => row.status === "expired")).toMatchObject({ score: null, questions: [], answers: {} });
    expect((await listRecruitmentAssessments(context, 7))[0].completed).toBe(1);
    expect(db.rows).toEqual(before); expect(mocks.persistRecruitmentTransition).toHaveBeenCalledTimes(2);
  });

  it("does not return a report when finalization persistence fails", async () => {
    const db = fakeReportingDb(); vi.setSystemTime(NOW + 300_000);
    mocks.persistRecruitmentTransition.mockRejectedValueOnce(new Error("synthetic write failure"));
    await expect(recruitmentResults(context, 7, FORM_ID)).rejects.toThrow("synthetic write failure");
    expect(db.events).not.toContain("commit");
  });
});

describe("authority precedes every manager private lookup branch", () => {
  const branches = ["empty list", "populated list", "missing result", "nonowned result", "owned result",
    "missing revoke", "nonowned revoke", "already revoked", "active revoke"] as const;
  it.each(branches)("denies revoked delegation before %s with no private lookup or not-found leak", async branch => {
    const db = fakeReportingDb({ org: { ...org(), managerEmail: "owner@example.test" },
      definitions: branch === "empty list" ? [] : [form()],
      rows: branch === "missing revoke" ? [] : [{ ...active(), status: branch === "already revoked" ? "revoked" : "active" }] });
    mocks.readRecruitmentAssessment.mockRejectedValue(new Error("Private definition lookup must not run"));
    const target = branch.includes("missing") || branch.includes("nonowned") ? "99999999-9999-4999-8999-999999999999" : branch.includes("result") ? FORM_ID : ID;
    const pending = branch.includes("list") ? listRecruitmentAssessments(context, 7)
      : branch.includes("result") ? recruitmentResults(context, 7, target) : revokeRecruitmentAssignment(context, 7, target);
    await expect(pending).rejects.toMatchObject({ code: "FORBIDDEN", message: "You are no longer a manager of this organization." });
    expect(db.reads.map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, { table: "organization_members", lock: "share" },
    ]);
    expect(db.reads[1].params).toEqual([7, EMAIL, DELEGATED_MANAGER_ROLE, "assigned"]);
    expect(mocks.readRecruitmentAssessment).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    expect(db.events).not.toContain("commit");
  });

  it.each([{ courseKey: "class2-water", courseKeys: null }, { courseKey: null, courseKeys: "[]" }])("rejects course-bearing or malformed delegate (%j) before private reads", async override => {
    const db = fakeReportingDb({ org: { ...org(), managerEmail: "owner@example.test" }, delegates: [
      { ...member(), email: EMAIL, role: DELEGATED_MANAGER_ROLE, ...override },
    ] });
    await expect(listRecruitmentAssessments(context, 7)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.reads).toHaveLength(2); expect(mocks.readRecruitmentAssessment).not.toHaveBeenCalled();
  });

  it.each(["results", "revoke"] as const)("returns scoped NOT_FOUND for an authorized delegate's missing/nonowned %s only after its gate", async kind => {
    const db = fakeReportingDb({ org: { ...org(), managerEmail: "owner@example.test" }, rows: [], delegates: [
      { ...member(), email: EMAIL, role: DELEGATED_MANAGER_ROLE, courseKey: null, courseKeys: null },
    ] });
    mocks.readRecruitmentAssessment.mockImplementation(async (_tx, id, scope) => {
      expect(db.reads.map(read => read.table)).toEqual(["organizations", "organization_members"]);
      expect(scope).toBe(7); expect(id).toBe(FORM_ID);
      throw new Error("scoped private not-found");
    });
    if (kind === "results") await expect(recruitmentResults(context, 7, FORM_ID)).rejects.toThrow("scoped private not-found");
    else {
      await expect(revokeRecruitmentAssignment(context, 7, ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(db.reads[2]).toMatchObject({ table: "recruitment_assignments", lock: "update", params: [ID, 7] });
    }
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
});
