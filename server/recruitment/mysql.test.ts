import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { organizations, organizationMembers, subscriptions, questions, recruitmentAssessments, recruitmentAssignments } from "../../drizzle/schema";
import { operateRecruitmentCandidate } from "./store";
import { createRecruitmentAssessment, inviteRecruitmentCandidate, listRecruitmentAssessments, recruitmentCatalog, recruitmentResults } from "./service";
import { RECRUITMENT_CONSENT_VERSION, type RecruitmentQuestion } from "../../shared/recruitmentAssessment";
import { DELEGATED_MANAGER_ROLE } from "../teams/delegatedManagers";
import type { TrpcContext } from "../_core/context";

const enabled = process.env.ECHELON_TEST_DATABASE === "I_UNDERSTAND_THIS_IS_A_DISPOSABLE_LOCAL_DATABASE";
const email = "candidate@example.test";
const ctx = { user: null, studentEmail: email, req: { headers: {} }, res: {} } as TrpcContext;
const snapshot: RecruitmentQuestion[] = Array.from({ length: 5 }, (_, n) => ({ id: String(n + 1), module: n < 3 ? "Treatment" : "Safety", prompt: `Synthetic fixture question ${n + 1}`, options: ["A", "B", "C", "D"], correctIndex: n % 4 }));
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let orgId: number, memberId: number;
const start = (id: string) => operateRecruitmentCandidate(ctx, id, { kind: "start", input: { assignmentId: id, acceptedNotice: true, consentVersion: RECRUITMENT_CONSENT_VERSION } });
const read = async (id: string) => (await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.id, id)))[0];
async function fixture() {
  const assessmentId = randomUUID(), assignmentId = randomUUID(), now = Date.now();
  await db.insert(recruitmentAssessments).values({ id: assessmentId, orgId, title: "Synthetic recruitment fixture", courseKey: "class2-water", courseLabel: "Class II Water Treatment", modules: ["Treatment", "Safety"], questionCount: 5, timeLimitMinutes: 30, questions: snapshot, creatorEmail: "manager@example.test", createdAtMs: now, expiresAtMs: now + 86_400_000 });
  await db.insert(recruitmentAssignments).values({ id: assignmentId, assessmentId, orgId, memberId, candidateEmail: email, candidateName: "Synthetic Candidate", creatorEmail: "manager@example.test", createdAtMs: now, updatedAtMs: now, expiresAtMs: now + 86_400_000, answers: {} });
  return assignmentId;
}

describe.skipIf(!enabled)("Recruitment transactions on a fresh network-isolated MySQL database", () => {
  beforeAll(async () => {
    const value = await getDb(); if (!value) throw new Error("Disposable database unavailable"); db = value;
    const now = Date.now();
    const ids = await db.insert(organizations).values({ name: "Synthetic Utility", province: "ontario", tier: "all-access", seatsTotal: 5, managerEmail: "manager@example.test", billingType: "invoice", status: "active", termStart: new Date(now - 86_400_000), termEnd: new Date(now + 86_400_000) }).$returningId(); orgId = ids[0].id;
    const members = await db.insert(organizationMembers).values({ orgId, email, name: "Synthetic Candidate", role: "operator", status: "assigned", courseKey: "class2-water", courseKeys: '["class2-water","class2-water-dist"]' }).$returningId(); memberId = members[0].id;
    await db.insert(subscriptions).values({ orgId, email, tier: "class2", province: "ontario", stripeSubscriptionId: `org-${orgId}-${email}-class2-water`, stripeCustomerId: "", status: "active", currentPeriodStart: new Date(now - 86_400_000), currentPeriodEnd: new Date(now + 86_400_000) });
    await db.insert(subscriptions).values({ orgId, email, tier: "class2", province: "ontario", stripeSubscriptionId: `org-${orgId}-${email}-class2-water-dist`, stripeCustomerId: "", status: "active", currentPeriodStart: new Date(now - 86_400_000), currentPeriodEnd: new Date(now + 86_400_000) });
  });
  it("hides questions before consent and preserves one original start/timer under parallel requests", async () => {
    const id = await fixture();
    const before = await operateRecruitmentCandidate(ctx, id, { kind: "get" }); expect(before.questions).toEqual([]); expect(before.answers).toEqual({});
    const views = await Promise.all([start(id), start(id), start(id)]);
    expect(new Set(views.map(v => v.startedAtMs)).size).toBe(1);
    expect(new Set(views.map(v => v.deadlineMs)).size).toBe(1);
    expect(new Set(views.map(v => v.revision)).size).toBe(1);
    expect((await read(id)).revision).toBe(1);
    expect(views[0].questions).toHaveLength(5);
    expect(JSON.stringify(views)).not.toMatch(/correctIndex|explanation|"score"/);
  });
  it("allows only one same-revision save and durably preserves its winning answer", async () => {
    const id = await fixture(), view = await start(id);
    const outcomes = await Promise.allSettled([0, 1].map(selectedIndex => operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex, revision: view.revision } })));
    expect(outcomes.filter(o => o.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find(o => o.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason.code).toBe("CONFLICT");
    const row = await read(id); const winner = outcomes.find(o => o.status === "fulfilled") as PromiseFulfilledResult<any>;
    expect(row.answers).toEqual(winner.value.answers); expect(row.revision).toBe(view.revision + 1);
    const resumed = await operateRecruitmentCandidate(ctx, id, { kind: "get" }); expect(resumed.answers).toEqual(row.answers); expect(resumed.startedAtMs).toBe(view.startedAtMs);
  });
  it("submits once under concurrent requests, recomputes server score and returns no candidate answer key", async () => {
    const id = await fixture(), view = await start(id);
    const saved = await operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } });
    const completed = await Promise.all([operateRecruitmentCandidate(ctx, id, { kind: "submit", input: { assignmentId: id, revision: saved.revision } }), operateRecruitmentCandidate(ctx, id, { kind: "submit", input: { assignmentId: id, revision: saved.revision } })]);
    expect(completed.every(v => v.status === "submitted")).toBe(true);
    expect(new Set(completed.map(v => v.revision)).size).toBe(1);
    expect(JSON.stringify(completed)).not.toMatch(/correctIndex|explanation|"score"/);
    const row = await read(id); expect(row.score).toMatchObject({ correct: 1, total: 5, answered: 1, unanswered: 4, percent: 20 });
    expect(row.score?.topics).toHaveLength(2);
  });
  it("rechecks time AFTER a real lock wait, commits timeout, and cannot save the late answer", async () => {
    const id = await fixture(); await start(id);
    const deadline = Date.now() + 250;
    await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, id));
    let release!: () => void, ready!: () => void;
    const released = new Promise<void>(r => { release = r; }); const locked = new Promise<void>(r => { ready = r; });
    const holder = db.transaction(async tx => { await tx.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.id, id)).for("update"); ready(); await released; });
    await locked;
    const late = operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: 1 } });
    await new Promise(r => setTimeout(r, 400)); release(); await holder;
    expect((await late).status).toBe("timed_out");
    const row = await read(id); expect(row.status).toBe("timed_out"); expect(row.answers).toEqual({}); expect(row.submittedAtMs).toBe(deadline); expect(row.score?.correct).toBe(0);
  });
  it("waits for an accepted pre-deadline save to commit before durable results/list timeout finalization", async () => {
    const id = await fixture(), view = await start(id), original = await read(id);
    const [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, original.assessmentId));
    const membersBefore = await db.select().from(organizationMembers), subscriptionsBefore = await db.select().from(subscriptions);
    const orgsBefore = await db.select().from(organizations);
    const beforeDeadline = Date.now(), deadline = beforeDeadline + 60_000;
    await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, id));
    let release!: () => void, saved!: () => void, reportsEntered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const saveWritten = new Promise<void>(resolve => { saved = resolve; });
    const reporting = new Promise<void>(resolve => { reportsEntered = resolve; });
    const realTransaction = db.transaction.bind(db);
    let transactionNumber = 0, reportTransactions = 0;
    // Every query/lock/write/commit is real MySQL. The hook only pauses the
    // accepted candidate operation between its durable UPDATE and COMMIT.
    const transaction = vi.spyOn(db, "transaction").mockImplementation((callback, config) => {
      const isSave = transactionNumber++ === 0;
      return realTransaction(async tx => {
        if (!isSave && ++reportTransactions === 2) reportsEntered();
        const result = await callback(tx);
        if (isSave) { saved(); await held; }
        return result;
      }, config);
    });
    // Advance only the server clock, not timers: the deadline crossing does
    // not depend on CI speed, sleeps or scheduling the accepted save in time.
    const clock = vi.spyOn(Date, "now").mockReturnValue(beforeDeadline);
    const save = operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } });
    const manager = { ...ctx, studentEmail: "manager@example.test" };
    let resultsReturned = false, listReturned = false;
    let results: ReturnType<typeof recruitmentResults> | undefined, list: ReturnType<typeof listRecruitmentAssessments> | undefined;
    try {
      await saveWritten;
      clock.mockReturnValue(deadline);
      results = recruitmentResults(manager, orgId, original.assessmentId).then(report => { resultsReturned = true; return report; });
      list = listRecruitmentAssessments(manager, orgId).then(report => { listReturned = true; return report; });
      // The broken unlocked implementation returns here instead of entering
      // reporting transactions; race against it rather than hanging on a gate.
      await Promise.race([
        reporting.then(() => new Promise(resolve => setTimeout(resolve, 100))),
        results.then(() => { throw new Error("Results exposed uncommitted deadline finalization"); }),
        list.then(() => { throw new Error("List exposed uncommitted completion"); }),
      ]);
      expect(resultsReturned).toBe(false); expect(listReturned).toBe(false);
      const uncommitted = await read(id);
      expect(uncommitted).toMatchObject({ status: "active", answers: {}, score: null, submittedAtMs: null, revision: view.revision });
      release();
      const [savedView, report, summaries] = await Promise.all([save, results, list]);
      expect(savedView.answers).toEqual({ "1": 0 });
      expect(report.results[0]).toMatchObject({ status: "timed_out", answers: { "1": 0 }, submittedAtMs: deadline, revision: view.revision + 2, score: { correct: 1, answered: 1, total: 5, percent: 20 } });
      expect(report.results[0].questions).toHaveLength(5);
      expect(report.assessment.completed).toBe(1);
      expect(summaries.find(summary => summary.id === original.assessmentId)?.completed).toBe(1);
      const durable = await read(id);
      expect(durable).toMatchObject({ status: "timed_out", answers: { "1": 0 }, submittedAtMs: deadline, revision: view.revision + 2, score: report.results[0].score });
      expect(await recruitmentResults(manager, orgId, original.assessmentId)).toEqual(report);
      expect((await listRecruitmentAssessments(manager, orgId)).find(summary => summary.id === original.assessmentId)?.completed).toBe(1);
      expect(await read(id)).toEqual(durable);
      expect((await operateRecruitmentCandidate(ctx, id, { kind: "get" })).answers).toEqual({});
      expect((await read(id)).answers).toEqual({ "1": 0 });
      expect((await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, original.assessmentId)))[0]).toEqual(definition);
      expect(await db.select().from(organizationMembers)).toEqual(membersBefore);
      expect(await db.select().from(subscriptions)).toEqual(subscriptionsBefore);
      expect(await db.select().from(organizations)).toEqual(orgsBefore);
    } finally {
      release();
      await Promise.allSettled([save, ...(results ? [results] : []), ...(list ? [list] : [])]);
      transaction.mockRestore(); clock.mockRestore();
    }
  });
  it("cannot resurrect a manager-revoked assignment after waiting on its lock", async () => {
    const id = await fixture(); await start(id);
    let release!: () => void, ready!: () => void;
    const released = new Promise<void>(r => { release = r; }); const locked = new Promise<void>(r => { ready = r; });
    const holder = db.transaction(async tx => { await tx.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.id, id)).for("update"); await tx.update(recruitmentAssignments).set({ status: "revoked", revokedAtMs: Date.now(), revokedByEmail: "manager@example.test", revision: 2 }).where(eq(recruitmentAssignments.id, id)); ready(); await released; });
    await locked;
    const pending = operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: 1 } });
    await new Promise(r => setTimeout(r, 100)); release(); await holder;
    expect((await pending).status).toBe("revoked"); expect((await read(id)).answers).toEqual({});
  });
  it("rejects another verified identity and cancels requested-course access despite an active same-tier sibling", async () => {
    const id = await fixture();
    await expect(operateRecruitmentCandidate({ ...ctx, studentEmail: "other@example.test" }, id, { kind: "get" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.update(subscriptions).set({ status: "cancelled" }).where(and(eq(subscriptions.orgId, orgId), eq(subscriptions.stripeSubscriptionId, `org-${orgId}-${email}-class2-water`)));
    try { await expect(operateRecruitmentCandidate(ctx, id, { kind: "get" })).rejects.toMatchObject({ code: "FORBIDDEN" }); }
    finally { await db.update(subscriptions).set({ status: "active" }).where(eq(subscriptions.stripeSubscriptionId, `org-${orgId}-${email}-class2-water`)); }
  });
  it("rolls back invalid choice updates without consuming a revision", async () => {
    const id = await fixture(), view = await start(id);
    await expect(operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 7, revision: view.revision } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const row = await read(id); expect(row.answers).toEqual({}); expect(row.revision).toBe(view.revision);
  });
  it.each(["delegate revoked", "organization cancelled"] as const)("rejects catalog when %s after accepted preflight but before the real transaction", async change => {
    const delegateEmail = "delegate@example.test";
    const inserted = await db.insert(organizationMembers).values({ orgId, email: delegateEmail, name: "Synthetic Delegate",
      role: DELEGATED_MANAGER_ROLE, status: "assigned", courseKey: null, courseKeys: null }).$returningId();
    const delegateId = inserted[0].id;
    let release!: () => void, entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const atTransaction = new Promise<void>(resolve => { entered = resolve; });
    const realTransaction = db.transaction.bind(db);
    // Pause before opening the transaction: the real global preflight already
    // accepted, but no org/member locks have been acquired yet.
    const transaction = vi.spyOn(db, "transaction").mockImplementationOnce((callback, config) => (async () => {
      entered(); await held; return realTransaction(callback, config);
    })());
    const manager = { ...ctx, studentEmail: change === "delegate revoked" ? delegateEmail : "manager@example.test" };
    const pending = recruitmentCatalog(manager, orgId);
    const outcome = pending.then(() => "unexpected success", error => error.code);
    try {
      await Promise.race([atTransaction, outcome.then(() => { throw new Error("Catalog returned without its authorization transaction"); })]);
      if (change === "delegate revoked") await db.update(organizationMembers).set({ status: "revoked" }).where(eq(organizationMembers.id, delegateId));
      else await db.update(organizations).set({ status: "cancelled" }).where(eq(organizations.id, orgId));
      release();
      expect(await outcome).toBe("FORBIDDEN");
      expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
    } finally {
      release(); await outcome; transaction.mockRestore();
      await db.update(organizations).set({ status: "active" }).where(eq(organizations.id, orgId));
      await db.delete(organizationMembers).where(eq(organizationMembers.id, delegateId));
    }
  });
  it("expires an untimed started assessment without scoring or completion while retaining saved choices", async () => {
    const id = await fixture(), original = await read(id);
    await db.update(recruitmentAssessments).set({ timeLimitMinutes: null }).where(eq(recruitmentAssessments.id, original.assessmentId));
    const view = await start(id);
    await operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } });
    const deadline = Date.now() + 60_000;
    await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, id));
    const clock = vi.spyOn(Date, "now").mockReturnValue(deadline);
    try {
      const manager = { ...ctx, studentEmail: "manager@example.test" };
      const report = await recruitmentResults(manager, orgId, original.assessmentId);
      expect(report.assessment.completed).toBe(0);
      expect(report.results[0]).toMatchObject({ status: "expired", submittedAtMs: null, score: null, answers: {}, questions: [] });
      expect((await listRecruitmentAssessments(manager, orgId)).find(row => row.id === original.assessmentId)?.completed).toBe(0);
      const candidate = await operateRecruitmentCandidate(ctx, id, { kind: "get" });
      expect(candidate).toMatchObject({ status: "expired", questions: [], answers: {} });
      expect(JSON.stringify(candidate)).not.toMatch(/correctIndex|explanation|"score"/);
      expect(await read(id)).toMatchObject({ status: "expired", submittedAtMs: null, score: null, answers: { "1": 0 } });
    } finally { clock.mockRestore(); }
  });
  it("runs manager create/invite/results, freezes forms and deduplicates invitations without granting seats", async () => {
    const manager = { ...ctx, studentEmail: "manager@example.test" };
    await db.insert(questions).values(Array.from({ length: 8 }, (_, n) => ({ bankKey: "class2-water", questionNum: 51_000 + n, module: n < 4 ? "Treatment" : "Safety", question: `Synthetic bank question ${n + 1}`, options: JSON.stringify(["A", "B", "C", "D"]), correctIndex: n % 4, explanation: "Synthetic explanation", reviewStatus: "approved" as const })));
    const catalog = await recruitmentCatalog(manager, orgId);
    expect(catalog.courses.find(c => c.courseKey === "class2-water")?.modules.reduce((sum, m) => sum + m.count, 0)).toBe(8);
    expect(catalog.candidates.find(c => c.memberId === memberId)?.courseKeys).toContain("class2-water");
    const membersBefore = await db.select().from(organizationMembers), subsBefore = await db.select().from(subscriptions);
    const created = await createRecruitmentAssessment(manager, { orgId, title: "Synthetic Manager Flow", courseKey: "class2-water", modules: ["Treatment", "Safety"], questionCount: 5, timeLimitMinutes: null, expiresInDays: 7 });
    const [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, created.assessmentId));
    expect(new Set(definition.questions.map(q => q.module))).toEqual(new Set(["Treatment", "Safety"]));
    const invitations = await Promise.all([inviteRecruitmentCandidate(manager, orgId, created.assessmentId, memberId), inviteRecruitmentCandidate(manager, orgId, created.assessmentId, memberId)]);
    expect(invitations[0].assignmentId).toBe(invitations[1].assignmentId);
    expect(await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.assessmentId, created.assessmentId))).toHaveLength(1);
    await db.update(questions).set({ question: "Edited synthetic content after assessment creation" }).where(eq(questions.bankKey, "class2-water"));
    const view = await start(invitations[0].assignmentId);
    expect(view.questions.map(q => q.prompt)).toEqual(definition.questions.map(q => q.prompt));
    const report = await recruitmentResults(manager, orgId, created.assessmentId);
    expect(report.results[0].score).toBeNull(); expect(report.assessment.completed).toBe(0);
    expect(report.results[0].answers).toEqual({}); expect(report.results[0].questions).toEqual([]);
    await expect(recruitmentResults({ ...manager, studentEmail: "intruder@example.test" }, orgId, created.assessmentId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await db.select().from(organizationMembers)).toEqual(membersBefore);
    expect(await db.select().from(subscriptions)).toEqual(subsBefore);
  });
  it("rechecks a concurrent seat revocation after waiting on the original member row lock", async () => {
    const id = await fixture(), view = await start(id);
    let release!: () => void, ready!: () => void;
    const released = new Promise<void>(r => { release = r; }), locked = new Promise<void>(r => { ready = r; });
    const revoker = db.transaction(async tx => {
      await tx.select().from(organizationMembers).where(eq(organizationMembers.id, memberId)).for("update");
      await tx.update(organizationMembers).set({ status: "revoked" }).where(eq(organizationMembers.id, memberId));
      ready(); await released;
    });
    await locked;
    const pending = operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } });
    const outcome = pending.then(() => "unexpected success", failure => failure.code);
    await new Promise(r => setTimeout(r, 150)); release(); await revoker;
    try { expect(await outcome).toBe("FORBIDDEN"); expect((await read(id)).answers).toEqual({}); }
    finally { await db.update(organizationMembers).set({ status: "assigned" }).where(eq(organizationMembers.id, memberId)); }
  });
  it("refuses a stale irreversible submit and requires confirmation of the current durable revision", async () => {
    const id = await fixture(), original = await start(id);
    const saved = await operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: original.revision } });
    await expect(operateRecruitmentCandidate(ctx, id, { kind: "submit", input: { assignmentId: id, revision: original.revision } })).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await read(id)).status).toBe("active"); expect((await read(id)).revision).toBe(saved.revision);
    expect((await operateRecruitmentCandidate(ctx, id, { kind: "submit", input: { assignmentId: id, revision: saved.revision } })).status).toBe("submitted");
    const manager = { ...ctx, studentEmail: "manager@example.test" };
    await expect(inviteRecruitmentCandidate(manager, orgId, (await read(id)).assessmentId, memberId)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
