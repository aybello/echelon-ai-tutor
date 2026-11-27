import { TRPCError } from "@trpc/server";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { getTableName } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RecruitmentAssessmentRow, RecruitmentAssignmentRow } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import { RECRUITMENT_CONSENT_VERSION } from "../../shared/recruitmentAssessment";
import type { RecruitmentOperation } from "./types";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), assertCandidate: vi.fn() }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("./access", async original => ({ ...await original<typeof import("./access")>(), assertRecruitmentCandidate: mocks.assertCandidate }));
import { operateRecruitmentCandidate, persistRecruitmentTransition, readRecruitmentAssessment } from "./store";

const NOW = Date.parse("2026-11-27T19:00:00Z");
const ID = "11111111-1111-4111-8111-111111111111";
const context = { user: null, studentEmail: "candidate@example.test", req: {}, res: {} } as unknown as TrpcContext;
const form = () => ({ id: "22222222-2222-4222-8222-222222222222", orgId: 7, title: "Synthetic assessment", courseKey: "class2-water", courseLabel: "Class 2 Water", modules: ["Treatment"], questionCount: 5, timeLimitMinutes: 5, expiresAtMs: NOW + 900_000,
  questions: Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1), module: "Treatment", prompt: `Synthetic prompt ${i + 1}`, options: ["One", "Two"], correctIndex: 0 })),
} as RecruitmentAssessmentRow);
const invitation = () => ({ id: ID, assessmentId: form().id, orgId: 7, memberId: 31, candidateEmail: "candidate@example.test", creatorEmail: "manager@example.test", status: "invited", startedAtMs: null, submittedAtMs: null, consentVersion: null, consentAcceptedAtMs: null, expiresAtMs: NOW + 900_000, updatedAtMs: NOW - 1000, answers: {}, score: null, revision: 0, revokedAtMs: null, revokedByEmail: null } as RecruitmentAssignmentRow);
const started = () => ({ ...invitation(), status: "active" as const, startedAtMs: NOW, consentAcceptedAtMs: NOW, consentVersion: RECRUITMENT_CONSENT_VERSION, revision: 1 });
const start: RecruitmentOperation = { kind: "start", input: { assignmentId: ID, acceptedNotice: true, consentVersion: RECRUITMENT_CONSENT_VERSION } };
const answer = (revision = 1, questionId = "1", selectedIndex = 0): RecruitmentOperation => ({ kind: "answer", input: { assignmentId: ID, revision, questionId, selectedIndex } });
const submit = (revision = 1): RecruitmentOperation => ({ kind: "submit", input: { assignmentId: ID, revision } });

/** A deterministic test double: serial callbacks and rollback-on-throw model the
 * service contract only. It is NOT evidence of MySQL isolation or row locking. */
function fakeTransactionalStore(initial = invitation(), beforeSourceRead?: () => void) {
  let durable = structuredClone(initial);
  const assessment = form();
  const sources = assessment.questions.map(q => ({ id: Number(q.id), bankKey: "class2-water", reviewStatus: "approved" }));
  const events: string[] = [];
  const writes: { table: string; fields: Record<string, unknown>; predicate: unknown }[] = [];
  const reads: { table: string; predicate: unknown; locked: boolean; tx: boolean }[] = [];
  let tail = Promise.resolve();
  const selectFor = (row: () => RecruitmentAssignmentRow, transactional: boolean) => vi.fn(() => ({
    from: (table: Parameters<typeof getTableName>[0]) => {
      const tableName = getTableName(table);
      return { where: (predicate: unknown) => {
        const read = { table: tableName, predicate, locked: false, tx: transactional };
        reads.push(read);
        const result = () => {
          if (transactional && tableName === "recruitment_assignments") {
            if (!read.locked) throw new Error("Candidate attempt read was not locked");
            if (events.at(-1) !== "org-share") throw new Error("Attempt lock was acquired before organization SHARE");
            events.push("locked-read");
          }
          if (tableName === "organizations") {
            if (!transactional || !read.locked) throw new Error("Organization must be SHARE locked in transaction");
            events.push("org-share");
            return [{ id: 7, name: "Synthetic utility", province: "ontario", tier: "all-access" }];
          }
          if (tableName === "recruitment_assignments") {
            const { params } = new MySqlDialect().sqlToQuery(predicate as never);
            return row().id === params[0] && row().candidateEmail === params[1]
              && (params.length < 3 || row().orgId === params[2]) ? [structuredClone(row())] : [];
          }
          if (tableName === "recruitment_assessments") return [structuredClone(assessment)];
          if (tableName === "questions") {
            if (!transactional || !read.locked) throw new Error("Source governance must be SHARE locked in transaction");
            beforeSourceRead?.();
            const { params } = new MySqlDialect().sqlToQuery(predicate as never);
            return sources.filter(source => source.id === params[0] && source.bankKey === params[1]
              && !params.slice(2).includes(source.reviewStatus)).map(source => ({ id: source.id }));
          }
          throw new Error(`Unexpected non-recruitment read: ${tableName}`);
        };
        const builder = {
          limit: (_limit: number) => builder,
          for: (mode: string) => {
            const expected = ["organizations", "questions"].includes(tableName) ? "share" : "update";
            if (!transactional || mode !== expected) throw new Error("Unexpected lock");
            read.locked = true; return builder;
          },
          then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve().then(result).then(resolve, reject),
        };
        return builder;
      } };
    },
  }));
  const db = {
    select: selectFor(() => durable, false),
    update: vi.fn(() => { throw new Error("Attempt update escaped its transaction"); }),
    insert: vi.fn(() => { throw new Error("Candidate attempt wrote a learner or entitlement record"); }),
    delete: vi.fn(() => { throw new Error("Candidate attempt deleted a record"); }),
    transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>, options: unknown) => {
      const task = tail.then(async () => {
        let local = structuredClone(durable);
        events.push("begin");
        const tx = {
          select: selectFor(() => local, true),
          update: (table: Parameters<typeof getTableName>[0]) => ({ set: (fields: Record<string, unknown>) => ({ where: async (predicate: unknown) => {
            const tableName = getTableName(table);
            if (tableName !== "recruitment_assignments") throw new Error(`Non-recruitment write: ${tableName}`);
            if (!events.includes("locked-read")) throw new Error("Write before row lock");
            writes.push({ table: tableName, fields: structuredClone(fields), predicate });
            local = { ...local, ...structuredClone(fields) };
            events.push("write");
            return [{ affectedRows: 1 }];
          } }) }),
          insert: db.insert, delete: db.delete,
        };
        try { const result = await callback(tx); durable = local; events.push("commit"); return result; }
        catch (error) { events.push("rollback"); throw error; }
      });
      tail = task.then(() => undefined, () => undefined);
      return task;
    }),
  };
  mocks.getDb.mockResolvedValue(db);
  return { db, assessment, sources, events, writes, reads, row: () => structuredClone(durable) };
}

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW);
  mocks.assertCandidate.mockResolvedValue({ id: 7, name: "Synthetic utility" });
});
afterEach(() => vi.useRealTimers());

describe("recruitment candidate locked service contract (mocked transactions)", () => {
  it("rejects anonymous visitors before DB access", async () => {
    await expect(operateRecruitmentCandidate({ ...context, studentEmail: null }, ID, { kind: "get" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("fails safely when DB is unavailable", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(operateRecruitmentCandidate(context, ID, { kind: "get" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
  it("nonexistent and non-owned invitations return the same denial before reading a form or opening a transaction", async () => {
    const store = fakeTransactionalStore();
    const error = { code: "FORBIDDEN", message: "This invitation is not available to this account." };
    await expect(operateRecruitmentCandidate({ ...context, studentEmail: "other@example.test" }, ID, { kind: "get" })).rejects.toMatchObject(error);
    await expect(operateRecruitmentCandidate(context, "99999999-9999-4999-8999-999999999999", { kind: "get" })).rejects.toMatchObject(error);
    expect(store.reads.map(read => read.table)).toEqual(["recruitment_assignments", "recruitment_assignments"]);
    expect(store.db.transaction).not.toHaveBeenCalled(); expect(mocks.assertCandidate).not.toHaveBeenCalled();
  });
  it("preflight denial cannot open a transaction or mutate answers", async () => {
    const store = fakeTransactionalStore();
    mocks.assertCandidate.mockRejectedValue(new TRPCError({ code: "FORBIDDEN", message: "Original org seat denied" }));
    await expect(operateRecruitmentCandidate(context, ID, start)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.db.transaction).not.toHaveBeenCalled(); expect(store.writes).toEqual([]);
  });
  it("rechecks permissions on the locked row and rolls back when the seat was revoked after preflight", async () => {
    const store = fakeTransactionalStore();
    mocks.assertCandidate.mockResolvedValueOnce({ name: "Synthetic utility" }).mockRejectedValueOnce(new TRPCError({ code: "FORBIDDEN", message: "Seat revoked" }));
    await expect(operateRecruitmentCandidate(context, ID, start)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.events).toEqual(["begin", "org-share", "locked-read", "rollback"]);
    expect(store.row()).toEqual(invitation()); expect(store.writes).toEqual([]);
  });
  it("locks by assignment ID under READ COMMITTED and writes only mutable recruitment attempt fields", async () => {
    const store = fakeTransactionalStore();
    const result = await operateRecruitmentCandidate(context, ID, start);
    expect(result).toMatchObject({ status: "active", startedAtMs: NOW, revision: 1 });
    expect(store.events).toEqual(["begin", "org-share", "locked-read", "write", "commit"]);
    expect(store.db.transaction.mock.calls[0][1]).toEqual({ isolationLevel: "read committed" });
    expect(mocks.assertCandidate).toHaveBeenCalledTimes(3);
    const locked = store.reads.find(read => read.tx && read.table === "recruitment_assignments")!;
    expect(locked.locked).toBe(true);
    const dialect = new MySqlDialect();
    expect(dialect.sqlToQuery(locked.predicate as Parameters<typeof dialect.sqlToQuery>[0]).params).toEqual([ID, "candidate@example.test", 7]);
    const firstRead = dialect.sqlToQuery(store.reads[0].predicate as never);
    expect(firstRead.params).toEqual([ID, "candidate@example.test"]);
    expect(firstRead.sql).toContain("`recruitment_assignments`.`candidateEmail` = ?");
    const write = store.writes[0];
    expect(write.table).toBe("recruitment_assignments");
    for (const field of ["candidateEmail", "memberId", "assessmentId", "orgId", "expiresAtMs", "creatorEmail", "questions"]) expect(write.fields).not.toHaveProperty(field);
    expect(dialect.sqlToQuery(write.predicate as Parameters<typeof dialect.sqlToQuery>[0]).params).toEqual([ID, 7]);
    expect(store.db.update).not.toHaveBeenCalled(); expect(store.db.insert).not.toHaveBeenCalled(); expect(store.db.delete).not.toHaveBeenCalled();
  });
  it("repeated start keeps the original timer and consent without a second write", async () => {
    const store = fakeTransactionalStore();
    const first = await operateRecruitmentCandidate(context, ID, start);
    vi.setSystemTime(NOW + 60_000);
    const second = await operateRecruitmentCandidate(context, ID, start);
    expect(second.startedAtMs).toBe(first.startedAtMs); expect(second.deadlineMs).toBe(first.deadlineMs);
    expect(second.revision).toBe(first.revision); expect(store.row().consentAcceptedAtMs).toBe(NOW);
    expect(store.writes).toHaveLength(1);
  });
  it("repeated submit is idempotent and writes no learner progress or practice attempts", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 0 } });
    const first = await operateRecruitmentCandidate(context, ID, submit(store.row().revision));
    vi.setSystemTime(NOW + 60_000);
    const second = await operateRecruitmentCandidate(context, ID, submit(1));
    expect(second).toMatchObject({ status: "submitted", submittedAtMs: first.submittedAtMs, revision: first.revision, answers: {} });
    expect(store.row().answers).toEqual({ "1": 0 });
    expect(store.writes).toHaveLength(1);
    expect(store.writes.map(write => write.table)).toEqual(["recruitment_assignments"]);
    expect(JSON.stringify(second)).not.toContain('"score"'); expect(JSON.stringify(second)).not.toContain('"correctIndex"');
  });
  it("stale revision throws before writes and the fake transaction rolls back unchanged", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 1 }, revision: 3 });
    const before = store.row();
    await expect(operateRecruitmentCandidate(context, ID, answer(1))).rejects.toMatchObject({ code: "CONFLICT" });
    expect(store.row()).toEqual(before); expect(store.writes).toEqual([]); expect(store.events.at(-1)).toBe("rollback");
  });
  it("stale first submit rolls back without finalizing the newer durable answers", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 1 }, revision: 3 }), before = store.row();
    await expect(operateRecruitmentCandidate(context, ID, submit(1))).rejects.toMatchObject({ code: "CONFLICT" });
    expect(store.row()).toEqual(before); expect(store.writes).toEqual([]); expect(store.events.at(-1)).toBe("rollback");
  });
  it("a save winning ahead of a stale submit is preserved and requires a fresh submission revision", async () => {
    const store = fakeTransactionalStore(started());
    const outcomes = await Promise.allSettled([operateRecruitmentCandidate(context, ID, answer(1)), operateRecruitmentCandidate(context, ID, submit(1))]);
    expect(outcomes[0].status).toBe("fulfilled"); expect(outcomes[1].status).toBe("rejected");
    expect(store.row()).toMatchObject({ status: "active", revision: 2, answers: { "1": 0 }, submittedAtMs: null });
    const view = await operateRecruitmentCandidate(context, ID, submit(2));
    expect(view).toMatchObject({ status: "submitted", revision: 3, answers: {} });
    expect(store.row().answers).toEqual({ "1": 0 });
  });
  it("stale submission at the deadline commits timeout rather than rolling it back", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 0 }, revision: 3 });
    vi.setSystemTime(NOW + 300_000);
    expect(await operateRecruitmentCandidate(context, ID, submit(1))).toMatchObject({ status: "timed_out", submittedAtMs: NOW + 300_000, revision: 4 });
    expect(store.row()).toMatchObject({ status: "timed_out", score: { correct: 1 } });
    expect(store.events.at(-1)).toBe("commit"); expect(store.writes).toHaveLength(1);
  });
  it("serial fake competing answers with the same revision accept one and refuse stale overwrite", async () => {
    const store = fakeTransactionalStore(started());
    const outcomes = await Promise.allSettled([operateRecruitmentCandidate(context, ID, answer(1, "1", 0)), operateRecruitmentCandidate(context, ID, answer(1, "1", 1))]);
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(item => item.status === "rejected")).toHaveLength(1);
    expect(store.row()).toMatchObject({ revision: 2, answers: { "1": 0 } }); expect(store.writes).toHaveLength(1);
  });
  it("late answer finalization commits timeout and does not throw a rollback-causing error", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 0, "2": 1 } });
    vi.setSystemTime(NOW + 300_000);
    const result = await operateRecruitmentCandidate(context, ID, answer(1, "2", 0));
    expect(result).toMatchObject({ status: "timed_out", answers: {}, submittedAtMs: NOW + 300_000, revision: 2, questions: [] });
    expect(store.row()).toMatchObject({ status: "timed_out", answers: { "1": 0, "2": 1 }, score: { correct: 1, total: 5, answered: 2 } });
    expect(store.events.at(-1)).toBe("commit"); expect(store.events).not.toContain("rollback");
  });
  it("computes acceptance time after permission checks rather than before the lock wait", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 1 } });
    vi.setSystemTime(NOW + 299_999);
    mocks.assertCandidate.mockResolvedValueOnce({ name: "Synthetic utility" }).mockImplementationOnce(async () => {
      vi.setSystemTime(NOW + 300_000); return { name: "Synthetic utility" };
    });
    const result = await operateRecruitmentCandidate(context, ID, answer());
    expect(result.status).toBe("timed_out"); expect(store.row().answers).toEqual({ "1": 1 });
  });
  it("candidateGet persists lazy timeout and repeated reads do not increment revision again", async () => {
    const store = fakeTransactionalStore(started());
    vi.setSystemTime(NOW + 600_000);
    const first = await operateRecruitmentCandidate(context, ID, { kind: "get" });
    const second = await operateRecruitmentCandidate(context, ID, { kind: "get" });
    expect(first.status).toBe("timed_out"); expect(second.revision).toBe(first.revision); expect(store.writes).toHaveLength(1);
    expect(store.row().submittedAtMs).toBe(NOW + 300_000);
  });
  it("revoked assignment never admits a start/save/submit mutation or snapshot disclosure", async () => {
    const store = fakeTransactionalStore({ ...started(), status: "revoked", answers: { "1": 0 } });
    for (const operation of [start, answer(), submit(store.row().revision)]) {
      const view = await operateRecruitmentCandidate(context, ID, operation);
      expect(view.status).toBe("revoked"); expect(view.questions).toEqual([]); expect(view.answers).toEqual({});
    }
    expect(store.writes).toEqual([]); expect(store.row().answers).toEqual({ "1": 0 });
  });
  it("pre-start read is locked but neither writes nor exposes questions or answers", async () => {
    const store = fakeTransactionalStore({ ...invitation(), answers: { "1": 0 } });
    const view = await operateRecruitmentCandidate(context, ID, { kind: "get" });
    expect(view).toMatchObject({ status: "invited", questions: [], answers: {} }); expect(store.writes).toEqual([]);
  });
  it.each(["get", "start", "answer", "submit"] as const)("fails the entire %s form for missing, other-bank, in-review or rejected current sources", async kind => {
    const operation = kind === "get" ? { kind: "get" } as const : kind === "start" ? start : kind === "answer" ? answer() : submit();
    for (const unavailable of ["missing", "other-bank", "in_review", "rejected"]) {
      const store = fakeTransactionalStore(kind === "start" ? invitation() : { ...started(), answers: { "1": 0 } });
      const before = store.row(), frozen = structuredClone(store.assessment);
      if (unavailable === "missing") store.sources.splice(2, 1);
      else if (unavailable === "other-bank") store.sources[2].bankKey = "class2-water-dist";
      else store.sources[2].reviewStatus = unavailable;
      await expect(operateRecruitmentCandidate(context, ID, operation)).rejects.toMatchObject({
        code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i),
      });
      expect(store.row()).toEqual(before); expect(store.assessment).toEqual(frozen); expect(store.writes).toEqual([]);
      expect(store.reads.filter(read => read.table === "questions").map(read => new MySqlDialect().sqlToQuery(read.predicate as never).params[0])).toEqual([1, 2, 3]);
      expect(store.events.at(-1)).toBe("rollback");
    }
  });
  it("returns frozen content unchanged for currently visible legacy sources", async () => {
    const store = fakeTransactionalStore(); store.sources[2].reviewStatus = "unreviewed";
    const frozen = structuredClone(store.assessment.questions);
    const view = await operateRecruitmentCandidate(context, ID, start);
    expect(view.questions.map(q => q.prompt)).toEqual(frozen.map(q => q.prompt));
    expect(store.assessment.questions).toEqual(frozen);
  });
  it.each(["submitted", "timed_out", "expired", "revoked"] as const)("never revalidates hidden sources or changes retained %s evidence on terminal get/submit", async status => {
    const store = fakeTransactionalStore({ ...started(), status, answers: { "1": 0 }, submittedAtMs: NOW,
      score: { correct: 1 } as RecruitmentAssignmentRow["score"] });
    store.sources.splice(0); const before = store.row();
    for (const operation of [{ kind: "get" } as const, submit()]) {
      const view = await operateRecruitmentCandidate(context, ID, operation);
      expect(view).toMatchObject({ status, questions: [], answers: {} });
    }
    expect(store.row()).toEqual(before); expect(store.writes).toEqual([]);
    expect(store.reads.some(read => read.table === "questions")).toBe(false);
  });
  it("captures acceptance and rechecks seat terms after governance waits, never accepting a late choice", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 1 } }, () => vi.setSystemTime(NOW + 300_000));
    vi.setSystemTime(NOW + 299_999);
    mocks.assertCandidate.mockImplementation(async (_ctx, _db, _assignment, _key, options) => {
      if (options?.lock) expect([NOW + 299_999, NOW + 300_000]).toContain(Date.now());
      return { id: 7, name: "Synthetic utility" };
    });
    const result = await operateRecruitmentCandidate(context, ID, answer());
    expect(result.status).toBe("timed_out"); expect(store.row().answers).toEqual({ "1": 1 });
    expect(store.row().submittedAtMs).toBe(NOW + 300_000); expect(store.events.at(-1)).toBe("commit");
  });
  it.each(["invited", "active", "untimed"] as const)("durably finalizes elapsed %s attempts before looking up hidden sources", async mode => {
    for (const kind of ["get", "start", "answer", "submit"] as const) {
      const initial = mode === "invited" ? invitation() : { ...started(), answers: { "1": 0, "2": 1 } };
      const store = fakeTransactionalStore({ ...initial, expiresAtMs: NOW });
      if (mode === "untimed") store.assessment.timeLimitMinutes = null;
      store.sources.splice(0);
      const frozen = structuredClone(store.assessment);
      const operation = kind === "get" ? { kind: "get" } as const : kind === "start" ? start
        : kind === "answer" ? answer(0) : submit(0);
      const result = await operateRecruitmentCandidate(context, ID, operation);
      const status = mode === "active" ? "timed_out" : "expired";
      expect(result).toMatchObject({ status, questions: [], answers: {}, revision: initial.revision + 1 });
      expect(JSON.stringify(result)).not.toMatch(/correctIndex|explanation|"score"/);
      expect(store.row()).toMatchObject({ status, answers: initial.answers,
        score: mode === "active" ? { correct: 1, answered: 2 } : null,
        submittedAtMs: mode === "active" ? NOW : null });
      expect(store.assessment).toEqual(frozen); expect(store.writes).toHaveLength(1);
      expect(store.reads.some(read => read.table === "questions")).toBe(false);
      expect(store.events.at(-1)).toBe("commit"); expect(mocks.assertCandidate).toHaveBeenLastCalledWith(
        context, expect.anything(), expect.objectContaining({ memberId: 31 }), "class2-water", { centralPreflightDone: true, lock: true });
    }
  });
  it.each(["active", "invited"] as const)("deadline finalization wins over source denial during a %s governance wait", async mode => {
    const initial = mode === "active" ? { ...started(), answers: { "1": 1 } } : invitation();
    const deadline = NOW + 1000;
    const store = fakeTransactionalStore({ ...initial, expiresAtMs: deadline }, () => vi.setSystemTime(deadline));
    store.sources[2].reviewStatus = "rejected";
    vi.setSystemTime(deadline - 1);
    const result = await operateRecruitmentCandidate(context, ID, mode === "active" ? answer(999) : start);
    expect(result).toMatchObject({ status: mode === "active" ? "timed_out" : "expired", answers: {}, questions: [], serverNowMs: deadline });
    expect(store.row().answers).toEqual(initial.answers); expect(store.writes).toHaveLength(1);
    expect(store.events.at(-1)).toBe("commit"); expect(store.row().revision).toBe(initial.revision + 1);
  });
  it("an open withdrawn form cannot strand the later overdue attempt indefinitely", async () => {
    const store = fakeTransactionalStore({ ...started(), answers: { "1": 0 } }); store.sources[2].reviewStatus = "in_review";
    vi.setSystemTime(NOW + 299_999);
    await expect(operateRecruitmentCandidate(context, ID, answer())).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(store.writes).toHaveLength(0);
    vi.setSystemTime(NOW + 300_000);
    const view = await operateRecruitmentCandidate(context, ID, { kind: "get" });
    expect(view).toMatchObject({ status: "timed_out", questions: [], answers: {} });
    expect(store.row()).toMatchObject({ status: "timed_out", score: { correct: 1 }, answers: { "1": 0 } });
    expect(store.writes).toHaveLength(1);
  });
  it("does not finalize an overdue hidden form without the locked exact seat authorization", async () => {
    const store = fakeTransactionalStore({ ...started(), expiresAtMs: NOW }); store.sources.splice(0);
    mocks.assertCandidate.mockResolvedValueOnce({ name: "Synthetic utility" }).mockRejectedValueOnce(new TRPCError({ code: "FORBIDDEN" }));
    await expect(operateRecruitmentCandidate(context, ID, { kind: "get" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.writes).toHaveLength(0); expect(store.row().status).toBe("active");
  });
  it("denies a post-governance exact term/access lapse rather than accepting or finalizing without valid seat locks", async () => {
    const store = fakeTransactionalStore(started(), () => vi.setSystemTime(NOW + 300_000));
    store.sources[2].reviewStatus = "rejected"; vi.setSystemTime(NOW + 299_999);
    mocks.assertCandidate.mockResolvedValueOnce({ name: "Synthetic utility" }).mockResolvedValueOnce({ name: "Synthetic utility" })
      .mockRejectedValueOnce(new TRPCError({ code: "FORBIDDEN" }));
    await expect(operateRecruitmentCandidate(context, ID, answer())).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.writes).toHaveLength(0); expect(store.row().status).toBe("active");
  });
  it("assessment lookup is explicitly scoped to the assignment's organization", async () => {
    const store = fakeTransactionalStore();
    await readRecruitmentAssessment(store.db as never, form().id, 7);
    const query = new MySqlDialect().sqlToQuery(store.reads[0].predicate as never);
    expect(query.sql).toContain("`recruitment_assessments`.`orgId` = ?"); expect(query.params).toEqual([form().id, 7]);
  });
  it("no-op transition does not invoke the persistence writer", async () => {
    const row = invitation(), update = vi.fn();
    await persistRecruitmentTransition({ update } as never, row, row);
    expect(update).not.toHaveBeenCalled();
  });
});
