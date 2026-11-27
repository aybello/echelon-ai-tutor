import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Organization, OrganizationMember, RecruitmentAssessmentRow, RecruitmentAssignmentRow } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import { DELEGATED_MANAGER_ROLE } from "../teams/delegatedManagers";

const mocks = vi.hoisted(() => ({ recruitmentManager: vi.fn(), assertRecruitmentSeat: vi.fn(), recruitmentDb: vi.fn(), readRecruitmentAssessment: vi.fn(), persistRecruitmentTransition: vi.fn() }));
vi.mock("./access", async original => ({ ...await original<typeof import("./access")>(), recruitmentManager: mocks.recruitmentManager, assertRecruitmentSeat: mocks.assertRecruitmentSeat }));
vi.mock("./store", () => ({ recruitmentDb: mocks.recruitmentDb, readRecruitmentAssessment: mocks.readRecruitmentAssessment, persistRecruitmentTransition: mocks.persistRecruitmentTransition }));
import { inviteRecruitmentCandidate, listRecruitmentAssessments, recruitmentDefinitionSummary, recruitmentResults, revokeRecruitmentAssignment } from "./service";
import { recruitmentResult } from "./state";

const NOW = Date.parse("2026-11-27T19:00:00Z");
const ID = "11111111-1111-4111-8111-111111111111";
const FORM_ID = "22222222-2222-4222-8222-222222222222";
const EMAIL = "manager@example.test";
const context = { user: null, studentEmail: EMAIL, req: {}, res: {} } as unknown as TrpcContext;
const org = () => ({ id: 7, name: "Synthetic utility", province: "ontario", tier: "all-access", billingType: "stripe", status: "active", termStart: new Date(NOW - 1000), termEnd: new Date(NOW + 86_400_000), managerEmail: EMAIL } as Organization);
const member = () => ({ id: 31, orgId: 7, email: "candidate@example.test", name: "Synthetic candidate", role: "operator", status: "assigned", courseKey: "class2-water", courseKeys: null } as OrganizationMember);
const form = () => ({ id: FORM_ID, orgId: 7, title: "Synthetic assessment", courseKey: "class2-water", courseLabel: "Class 2 Water", modules: ["Treatment"], questionCount: 5, timeLimitMinutes: 5, createdAtMs: NOW - 1000, expiresAtMs: NOW + 900_000,
  questions: Array.from({ length: 5 }, (_, i) => ({ id: `q${i + 1}`, module: "Treatment", prompt: `Synthetic prompt ${i + 1}`, options: ["One", "Two"], correctIndex: 0 })),
} as RecruitmentAssessmentRow);
const invited = () => ({ id: ID, assessmentId: FORM_ID, orgId: 7, memberId: 31, candidateEmail: member().email, candidateName: member().name, creatorEmail: EMAIL, status: "invited", startedAtMs: null, submittedAtMs: null, consentVersion: null, consentAcceptedAtMs: null, expiresAtMs: NOW + 900_000, createdAtMs: NOW - 1000, updatedAtMs: NOW - 1000, answers: {}, score: null, revision: 0, revokedAtMs: null, revokedByEmail: null } as RecruitmentAssignmentRow);
const active = () => ({ ...invited(), status: "active" as const, startedAtMs: NOW, revision: 1 });

/** Read/write spy only: no assertion of real MySQL transaction isolation. */
function fakeManagerDb(lockedOrg: Organization, existing?: RecruitmentAssignmentRow) {
  const reads: { table: string; lock: string | null }[] = [];
  const insertValues = vi.fn(async () => undefined);
  const insert = vi.fn(() => ({ values: insertValues }));
  const tx = {
    select: vi.fn(() => ({ from: (table: Parameters<typeof getTableName>[0]) => ({ where: () => {
      const name = getTableName(table), read = { table: name, lock: null as string | null };
      reads.push(read);
      const rows = name === "organizations" ? [lockedOrg] : name === "recruitment_assignments" ? (existing ? [existing] : []) : [];
      const builder = {
        limit: () => builder,
        for: (lock: string) => { read.lock = lock; return builder; },
        then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject),
      };
      return builder;
    } }) })),
    insert,
  };
  const db = { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(tx)) };
  mocks.recruitmentDb.mockResolvedValue(db);
  return { db, reads, insert, insertValues };
}

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

/** Explicit mocked lock/commit boundaries; the MySQL suite proves actual isolation. */
function fakeReportingDb(options: {
  org?: Organization | null; rows?: RecruitmentAssignmentRow[]; definitions?: RecruitmentAssessmentRow[];
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
            : name === "organization_members" ? options.delegates ?? [] : [];
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
    const row = { ...active(), status: "submitted" as const, submittedAtMs: NOW - 100, answers: { q1: 0 }, score: { correct: 999 } as RecruitmentAssignmentRow["score"] };
    fakeManagerDb(org(), row);
    expect(await revokeRecruitmentAssignment(context, 7, ID)).toEqual({ success: true });
    const next = mocks.persistRecruitmentTransition.mock.calls[0][2] as RecruitmentAssignmentRow;
    expect(next).toMatchObject({ status: "revoked", submittedAtMs: NOW - 100, answers: { q1: 0 }, revokedAtMs: NOW, revokedByEmail: EMAIL });
    expect(recruitmentDefinitionSummary(form(), [next]).completed).toBe(1);
    expect(recruitmentResult(form(), next, NOW)).toMatchObject({ status: "revoked", answers: { q1: 0 }, score: { correct: 1, answered: 1 } });
  });
  it("finalizes an elapsed active timer before revoking and keeps that completion evidence", async () => {
    fakeManagerDb(org(), { ...active(), answers: { q1: 0 } }); vi.setSystemTime(NOW + 300_000);
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
    const db = fakeReportingDb({ rows: [{ ...active(), answers: { q1: 0 } }], beforeCommit: async () => { atCommit.release(); await beforeCommit.promise; } });
    mocks.recruitmentManager.mockImplementation(async () => { expect(db.events).toEqual([]); return org(); });
    vi.setSystemTime(NOW + 300_000);
    let returned = false;
    const pending = (kind === "results" ? recruitmentResults(context, 7, FORM_ID) : listRecruitmentAssessments(context, 7))
      .then(value => { returned = true; return value; });
    await atCommit.promise;
    expect(returned).toBe(false);
    expect(db.rows[0]).toMatchObject({ status: "timed_out", answers: { q1: 0 }, submittedAtMs: NOW + 300_000, revision: 2, score: { correct: 1, answered: 1 } });
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
      expect(result.results[0]).toMatchObject({ status: "timed_out", answers: { q1: 0 }, score: { correct: 1 }, revision: 2 });
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
    await assignmentEntered.promise;
    expect(clock).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    assignmentWait.release(); await managerEntered.promise;
    expect(clock).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    vi.setSystemTime(NOW + 300_000); managerWait.release();
    const report = await pending;
    expect(report.results[0].status).toBe("timed_out"); expect(report.assessment.completed).toBe(1);
    expect(db.reads.filter(read => read.lock).map(({ table, lock }) => ({ table, lock }))).toEqual([
      { table: "organizations", lock: "share" }, { table: "recruitment_assignments", lock: "update" }, { table: "organization_members", lock: "share" },
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
    expect(db.reads.at(-1)).toMatchObject({ table: "organization_members", lock: "share" });
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled(); expect(db.events).not.toContain("commit");
  });

  it("preserves resolver-authorized historical Annual reporting and stable finalization across list/results", async () => {
    const db = fakeReportingDb({ org: { ...org(), status: "past_due", termEnd: new Date(NOW - 1) }, rows: [{ ...active(), answers: { q1: 0 } }, { ...invited(), id: "33333333-3333-4333-8333-333333333333", expiresAtMs: NOW }] });
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
