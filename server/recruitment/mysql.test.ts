import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { organizations, organizationMembers, subscriptions, questions, recruitmentAssessments, recruitmentAssignments } from "../../drizzle/schema";
import { operateRecruitmentCandidate } from "./store";
import { createRecruitmentAssessment, inviteRecruitmentCandidate, listRecruitmentAssessments, recruitmentCatalog, recruitmentResults, revokeRecruitmentAssignment } from "./service";
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

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

describe.skipIf(!enabled)("Recruitment transactions on a fresh network-isolated MySQL database", () => {
  beforeAll(async () => {
    const value = await getDb(); if (!value) throw new Error("Disposable database unavailable"); db = value;
    const now = Date.now();
    await db.insert(questions).values(snapshot.map(q => ({ id: Number(q.id), bankKey: "class2-water", questionNum: 50_000 + Number(q.id),
      module: q.module, question: q.prompt, options: JSON.stringify(q.options), correctIndex: q.correctIndex,
      explanation: "Synthetic source", reviewStatus: "approved" as const })));
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
    expect(catalog.courses.find(c => c.courseKey === "class2-water")?.modules.reduce((sum, m) => sum + m.count, 0)).toBe(13);
    expect(catalog.candidates.find(c => c.memberId === memberId)?.courseKeys).toContain("class2-water");
    const membersBefore = await db.select().from(organizationMembers), subsBefore = await db.select().from(subscriptions);
    const created = await createRecruitmentAssessment(manager, { orgId, title: "Synthetic Manager Flow", courseKey: "class2-water", modules: ["Treatment", "Safety"], questionCount: 5, timeLimitMinutes: null, expiresInDays: 7 });
    const [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, created.assessmentId));
    expect(new Set(definition.questions.map(q => q.module))).toEqual(new Set(["Treatment", "Safety"]));
    const sourcesBefore = await db.select().from(questions).where(eq(questions.bankKey, "class2-water"));
    await db.update(questions).set({ question: "Edited synthetic content after assessment creation", module: "Later authored topic",
      options: JSON.stringify(["Later A", "Later B", "Later C", "Later D"]), correctIndex: 3 }).where(eq(questions.bankKey, "class2-water"));
    const invitations = await Promise.all([inviteRecruitmentCandidate(manager, orgId, created.assessmentId, memberId), inviteRecruitmentCandidate(manager, orgId, created.assessmentId, memberId)]);
    expect(invitations[0].assignmentId).toBe(invitations[1].assignmentId);
    expect(await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.assessmentId, created.assessmentId))).toHaveLength(1);
    const view = await start(invitations[0].assignmentId);
    expect(view.questions).toEqual(definition.questions.map(({ correctIndex: _key, ...q }) => q));
    expect((await inviteRecruitmentCandidate(manager, orgId, created.assessmentId, memberId)).assignmentId).toBe(invitations[0].assignmentId);
    const report = await recruitmentResults(manager, orgId, created.assessmentId);
    expect(report.results[0].score).toBeNull(); expect(report.assessment.completed).toBe(0);
    expect(report.results[0].answers).toEqual({}); expect(report.results[0].questions).toEqual([]);
    const originalQuestion = definition.questions.find(q => q.correctIndex !== 3)!;
    expect(originalQuestion).toBeDefined(); // Distinguish frozen scoring from every newer authored key.
    const saved = await operateRecruitmentCandidate(ctx, invitations[0].assignmentId, { kind: "answer", input: {
      assignmentId: invitations[0].assignmentId, questionId: originalQuestion.id, selectedIndex: originalQuestion.correctIndex, revision: view.revision } });
    await operateRecruitmentCandidate(ctx, invitations[0].assignmentId, { kind: "submit", input: { assignmentId: invitations[0].assignmentId, revision: saved.revision } });
    const completed = await recruitmentResults(manager, orgId, created.assessmentId);
    expect(completed.results[0]).toMatchObject({ questions: definition.questions, score: { correct: 1, answered: 1 }, answers: { [originalQuestion.id]: originalQuestion.correctIndex } });
    expect((await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, created.assessmentId)))[0]).toEqual(definition);
    await expect(recruitmentResults({ ...manager, studentEmail: "intruder@example.test" }, orgId, created.assessmentId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await db.select().from(organizationMembers)).toEqual(membersBefore);
    expect(await db.select().from(subscriptions)).toEqual(subsBefore);
    for (const source of sourcesBefore) await db.update(questions).set({ module: source.module, question: source.question,
      options: source.options, correctIndex: source.correctIndex }).where(eq(questions.id, source.id));
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

  it.each(["in_review", "rejected", "other bank", "missing"] as const)("rejects the whole frozen form when one source becomes %s, preserving saved attempts and snapshot", async change => {
    const activeId = await fixture(), view = await start(activeId), invitedId = await fixture();
    await operateRecruitmentCandidate(ctx, activeId, { kind: "answer", input: { assignmentId: activeId, questionId: "1", selectedIndex: 0, revision: view.revision } });
    const activeBefore = await read(activeId), invitedBefore = await read(invitedId);
    const [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, activeBefore.assessmentId));
    const [source] = await db.select().from(questions).where(eq(questions.id, 3));
    try {
      if (change === "missing") await db.delete(questions).where(eq(questions.id, 3));
      else await db.update(questions).set(change === "other bank" ? { bankKey: "class2-water-dist" } : { reviewStatus: change }).where(eq(questions.id, 3));
      const operations = [
        operateRecruitmentCandidate(ctx, invitedId, { kind: "get" }), start(invitedId),
        operateRecruitmentCandidate(ctx, activeId, { kind: "get" }),
        operateRecruitmentCandidate(ctx, activeId, { kind: "answer", input: { assignmentId: activeId, questionId: "1", selectedIndex: 1, revision: activeBefore.revision } }),
        operateRecruitmentCandidate(ctx, activeId, { kind: "submit", input: { assignmentId: activeId, revision: activeBefore.revision } }),
      ];
      const outcomes = await Promise.allSettled(operations);
      expect(outcomes.every(outcome => outcome.status === "rejected")).toBe(true);
      for (const outcome of outcomes) if (outcome.status === "rejected") expect(outcome.reason).toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i) });
      expect(await read(activeId)).toEqual(activeBefore); expect(await read(invitedId)).toEqual(invitedBefore);
      expect((await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, definition.id)))[0]).toEqual(definition);
    } finally {
      if (change === "missing") await db.insert(questions).values(source);
      else await db.update(questions).set({ bankKey: source.bankKey, reviewStatus: source.reviewStatus }).where(eq(questions.id, 3));
    }
  });

  it("reevaluates governed visibility after a real source UPDATE wait under READ COMMITTED", async () => {
    const id = await fixture(), before = await read(id);
    let release!: () => void, ready!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), locked = new Promise<void>(resolve => { ready = resolve; });
    const governance = db.transaction(async tx => {
      await tx.select().from(questions).where(eq(questions.id, 3)).for("update");
      await tx.update(questions).set({ reviewStatus: "in_review" }).where(eq(questions.id, 3)); ready(); await held;
    });
    await locked;
    let returned = false;
    const pending = start(id).then(value => { returned = true; return value; }, error => { returned = true; throw error; });
    const outcome = pending.then(() => "unexpected success", error => error.code);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); expect(returned).toBe(false);
      release(); await governance; expect(await outcome).toBe("PRECONDITION_FAILED"); expect(await read(id)).toEqual(before);
    } finally {
      release(); await Promise.allSettled([governance, pending]);
      await db.update(questions).set({ reviewStatus: "approved" }).where(eq(questions.id, 3));
    }
  });

  it("keeps SHARE governance locks through candidate commit, blocking subsequent hiding writes", async () => {
    const id = await fixture();
    let release!: () => void, ready!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), accepted = new Promise<void>(resolve => { ready = resolve; });
    const realTransaction = db.transaction.bind(db);
    const transaction = vi.spyOn(db, "transaction").mockImplementationOnce((callback, config) => realTransaction(async tx => {
      const result = await callback(tx); ready(); await held; return result;
    }, config));
    const pending = start(id); let hidden = false;
    let hide: Promise<unknown> | undefined;
    try {
      await accepted;
      hide = db.update(questions).set({ reviewStatus: "rejected" }).where(eq(questions.id, 3)).then(result => { hidden = true; return result; });
      await new Promise(resolve => setTimeout(resolve, 100)); expect(hidden).toBe(false);
      release(); expect((await pending).questions).toHaveLength(5); await hide;
      await expect(operateRecruitmentCandidate(ctx, id, { kind: "get" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      expect((await read(id)).revision).toBe(1);
    } finally {
      release(); await Promise.allSettled([pending, ...(hide ? [hide] : [])]); transaction.mockRestore();
      await db.update(questions).set({ reviewStatus: "approved" }).where(eq(questions.id, 3));
    }
  });

  it("captures answer acceptance only after real source governance waits cross the deadline", async () => {
    const id = await fixture(), view = await start(id), before = await read(id);
    const deadline = Date.now() + 60_000;
    await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, id));
    let release!: () => void, ready!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), locked = new Promise<void>(resolve => { ready = resolve; });
    const governance = db.transaction(async tx => { await tx.select().from(questions).where(eq(questions.id, 3)).for("update"); ready(); await held; });
    await locked;
    const clock = vi.spyOn(Date, "now").mockReturnValue(deadline - 1);
    let returned = false;
    const pending = operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } }).then(value => { returned = true; return value; });
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); expect(returned).toBe(false);
      clock.mockReturnValue(deadline); release(); await governance;
      expect((await pending).status).toBe("timed_out");
      expect(await read(id)).toMatchObject({ status: "timed_out", answers: before.answers, submittedAtMs: deadline, score: { correct: 0 }, revision: view.revision + 1 });
    } finally { release(); await Promise.allSettled([governance, pending]); clock.mockRestore(); }
  });

  it("retains submitted and durable timeout evidence after source rejection, without candidate redelivery", async () => {
    const submittedId = await fixture(), submittedView = await start(submittedId), timedId = await fixture(), timedView = await start(timedId);
    const saved = await operateRecruitmentCandidate(ctx, submittedId, { kind: "answer", input: { assignmentId: submittedId, questionId: "1", selectedIndex: 0, revision: submittedView.revision } });
    await operateRecruitmentCandidate(ctx, submittedId, { kind: "submit", input: { assignmentId: submittedId, revision: saved.revision } });
    await operateRecruitmentCandidate(ctx, timedId, { kind: "answer", input: { assignmentId: timedId, questionId: "1", selectedIndex: 0, revision: timedView.revision } });
    const deadline = Date.now() - 1;
    await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, timedId));
    await db.update(questions).set({ reviewStatus: "rejected" }).where(eq(questions.id, 3));
    const manager = { ...ctx, studentEmail: "manager@example.test" };
    try {
      // Reporting finalizes accepted durable answers independently of current source delivery permission.
      for (const id of [submittedId, timedId]) {
        const original = await read(id), report = await recruitmentResults(manager, orgId, original.assessmentId), durable = await read(id);
        expect(report.results[0]).toMatchObject({ answers: { "1": 0 }, score: { correct: 1, answered: 1 }, questions: snapshot });
        expect(report.assessment.completed).toBe(1);
        const candidate = await operateRecruitmentCandidate(ctx, id, { kind: "get" }); expect(candidate.questions).toEqual([]);
        await operateRecruitmentCandidate(ctx, id, { kind: "submit", input: { assignmentId: id, revision: 0 } });
        expect(await read(id)).toEqual(durable);
        await revokeRecruitmentAssignment(manager, orgId, id);
        expect((await recruitmentResults(manager, orgId, original.assessmentId)).results[0]).toMatchObject({ status: "revoked", answers: { "1": 0 }, score: { correct: 1 }, questions: snapshot });
      }
    } finally { await db.update(questions).set({ reviewStatus: "approved" }).where(eq(questions.id, 3)); }
  });

  it.each(["missing", "other bank", "in_review", "rejected"] as const)("revalidates selected create sources changed to %s after the real unlocked pool query", async change => {
    const manager = { ...ctx, studentEmail: "manager@example.test" }, module = `Create race ${change}`;
    const rows = await db.insert(questions).values(snapshot.map((q, n) => ({ bankKey: "class2-water", questionNum: 70_000 + n,
      module, question: q.prompt, options: JSON.stringify(q.options), correctIndex: q.correctIndex,
      explanation: "Synthetic isolated create race", reviewStatus: "approved" as const }))).$returningId();
    const sourceId = rows[2].id, [source] = await db.select().from(questions).where(eq(questions.id, sourceId));
    const formsBefore = await db.select().from(recruitmentAssessments), held = barrier(), sampled = barrier();
    const realTransaction = db.transaction.bind(db);
    // Queries remain real MySQL. Pause the pool query only AFTER its unlocked
    // results have materialized, so selection cannot rely on stale visibility.
    const transaction = vi.spyOn(db, "transaction").mockImplementationOnce((callback, config) => realTransaction(tx => callback(new Proxy(tx, {
      get(target, property) {
        if (property === "select") return (...args: Parameters<typeof tx.select>) => {
          const builder = target.select(...args), originalFrom = builder.from.bind(builder);
          builder.from = ((table: Parameters<typeof originalFrom>[0]) => {
            const query = originalFrom(table);
            if (table === questions) {
              const execute = query.execute.bind(query);
              query.execute = (async (...executeArgs: Parameters<typeof execute>) => {
                const values = await execute(...executeArgs);
                if (!query.toSQL().sql.includes("for share")) { sampled.release(); await held.promise; }
                return values;
              }) as typeof query.execute;
            }
            return query;
          }) as typeof builder.from;
          return builder;
        };
        return Reflect.get(target, property, target);
      },
    })), config));
    const pending = createRecruitmentAssessment(manager, { orgId, title: "Synthetic create race", courseKey: "class2-water",
      modules: [module], questionCount: 5, timeLimitMinutes: 5, expiresInDays: 7 });
    const outcome = pending.then(() => "unexpected success", error => error.code);
    try {
      await Promise.race([sampled.promise, outcome.then(() => { throw new Error("Create returned before post-pool governance validation"); })]);
      if (change === "missing") await db.delete(questions).where(eq(questions.id, sourceId));
      else await db.update(questions).set(change === "other bank" ? { bankKey: "class2-water-dist" } : { reviewStatus: change }).where(eq(questions.id, sourceId));
      held.release(); expect(await outcome).toBe("PRECONDITION_FAILED");
      expect(await db.select().from(recruitmentAssessments)).toEqual(formsBefore);
      expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
    } finally {
      held.release(); await outcome; transaction.mockRestore();
      if (change === "missing") await db.insert(questions).values(source);
      for (const { id } of rows) await db.delete(questions).where(eq(questions.id, id));
    }
  });

  it.each([
    { label: "correctIndex", patch: { correctIndex: 3 }, unchanged: false },
    { label: "prompt", patch: { question: "Later authored prompt" }, unchanged: false },
    { label: "module", patch: { module: "Later authored topic" }, unchanged: false },
    { label: "options", patch: { options: '["B","A","C","D"]' }, unchanged: false },
    { label: "malformed JSON options", patch: { options: "{invalid}" }, unchanged: false },
    { label: "options object", patch: { options: '{"0":"A","1":"B"}' }, unchanged: false },
    { label: "undersized options", patch: { options: '["A"]' }, unchanged: false },
    { label: "blank option", patch: { options: '["A"," ","C","D"]' }, unchanged: false },
    { label: "unchanged parsed payload", patch: { options: '[ "A", "B", "C", "D" ]', explanation: "Unrelated authored explanation edit" }, unchanged: true },
  ].flatMap(change => (["before source lock", "actual UPDATE wait"] as const).map(phase => ({ ...change, phase }))))
    ("checks sampled $label during creation at $phase with no replacement sampling", async ({ label, patch, unchanged, phase }) => {
      const manager = { ...ctx, studentEmail: "manager@example.test" }, module = `Payload race ${label} ${phase}`;
      const rows = await db.insert(questions).values(snapshot.map((q, n) => ({ bankKey: "class2-water", questionNum: 71_000 + n,
        module, question: q.prompt, options: JSON.stringify(q.options), correctIndex: q.correctIndex,
        explanation: "Synthetic isolated payload race", reviewStatus: "approved" as const }))).$returningId();
      const sourceId = rows[2].id, formsBefore = await db.select().from(recruitmentAssessments);
      const poolGate = barrier(), sampled = barrier(), atSource = barrier(), updateGate = barrier(), updated = barrier();
      const realTransaction = db.transaction.bind(db), sourceReads: number[] = [];
      let poolReads = 0, returned = false, holder: Promise<unknown> | undefined;
      // Every statement and lock is real MySQL. Materialize the unlocked pool,
      // then let the authored edit commit before locking or hold its UPDATE lock
      // until the exact source SHARE query has genuinely started waiting.
      const transaction = vi.spyOn(db, "transaction").mockImplementationOnce((callback, config) => realTransaction(tx => callback(new Proxy(tx, {
        get(target, property) {
          if (property === "select") return (...args: Parameters<typeof tx.select>) => {
            const builder = target.select(...args), originalFrom = builder.from.bind(builder);
            builder.from = ((table: Parameters<typeof originalFrom>[0]) => {
              const query = originalFrom(table);
              if (table === questions) {
                const execute = query.execute.bind(query);
                query.execute = (async (...executeArgs: Parameters<typeof execute>) => {
                  const sql = query.toSQL();
                  if (sql.sql.includes("for share")) {
                    const id = Number(sql.params[0]); sourceReads.push(id);
                    if (id === sourceId) atSource.release();
                    return execute(...executeArgs);
                  }
                  const values = await execute(...executeArgs); poolReads++;
                  sampled.release(); await poolGate.promise; return values;
                }) as typeof query.execute;
              }
              return query;
            }) as typeof builder.from;
            return builder;
          };
          return Reflect.get(target, property, target);
        },
      })), config));
      const pending = createRecruitmentAssessment(manager, { orgId, title: "Synthetic payload race", courseKey: "class2-water",
        modules: [module], questionCount: 5, timeLimitMinutes: 5, expiresInDays: 7 });
      const outcome = pending.then(value => { returned = true; return { value, code: null }; }, error => { returned = true; return { value: null, code: error.code }; });
      try {
        await Promise.race([sampled.promise, outcome.then(() => { throw new Error("Create skipped the unlocked sampling gate"); })]);
        if (phase === "before source lock") {
          await db.update(questions).set(patch).where(eq(questions.id, sourceId));
          poolGate.release();
        } else {
          holder = realTransaction(async tx => {
            await tx.update(questions).set(patch).where(eq(questions.id, sourceId));
            updated.release(); await updateGate.promise;
          });
          await updated.promise; poolGate.release();
          await Promise.race([atSource.promise, outcome.then(() => { throw new Error("Create skipped the exact source lock"); })]);
          await new Promise(resolve => setTimeout(resolve, 100)); expect(returned).toBe(false);
          updateGate.release(); await holder;
        }
        const result = await outcome;
        expect(poolReads).toBe(1);
        expect(sourceReads).toEqual(rows.slice(0, unchanged ? 5 : 3).map(row => row.id));
        expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
        if (unchanged) {
          expect(result.code).toBeNull(); expect(result.value).not.toBeNull();
          const [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, result.value!.assessmentId));
          expect([...definition.questions].sort((a, b) => Number(a.id) - Number(b.id)))
            .toEqual(snapshot.map((q, n) => ({ ...q, id: String(rows[n].id), module })));
          expect(await db.select().from(recruitmentAssessments)).toHaveLength(formsBefore.length + 1);
        } else {
          expect(result.code).toBe("PRECONDITION_FAILED"); expect(result.value).toBeNull();
          expect(await db.select().from(recruitmentAssessments)).toEqual(formsBefore);
        }
      } finally {
        poolGate.release(); updateGate.release();
        await Promise.allSettled([outcome, ...(holder ? [holder] : [])]); transaction.mockRestore();
        for (const { id } of rows) await db.delete(questions).where(eq(questions.id, id));
      }
    });

  it.each(["fresh", "invited", "active"] as const)("checks immutable original sources before a real %s invite INSERT or usable duplicate return", async mode => {
    for (const change of ["missing", "other bank", "in_review", "rejected"] as const) {
      const id = await fixture(); if (mode === "active") await start(id);
      const before = await read(id);
      if (mode === "fresh") await db.delete(recruitmentAssignments).where(eq(recruitmentAssignments.id, id));
      const [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, before.assessmentId));
      const [source] = await db.select().from(questions).where(eq(questions.id, 3));
      const manager = { ...ctx, studentEmail: "manager@example.test" };
      try {
        if (change === "missing") await db.delete(questions).where(eq(questions.id, 3));
        else await db.update(questions).set(change === "other bank" ? { bankKey: "class2-water-dist" } : { reviewStatus: change }).where(eq(questions.id, 3));
        await expect(inviteRecruitmentCandidate(manager, orgId, definition.id, memberId)).rejects.toMatchObject({
          code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i),
        });
        const assignments = await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.assessmentId, definition.id));
        expect(assignments).toEqual(mode === "fresh" ? [] : [before]);
        expect((await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, definition.id)))[0]).toEqual(definition);
      } finally {
        if (change === "missing") await db.insert(questions).values(source);
        else await db.update(questions).set({ bankKey: source.bankKey, reviewStatus: source.reviewStatus }).where(eq(questions.id, 3));
      }
    }
  });

  it.each(["fresh", "invited", "active"] as const)("denies the %s invite path after a concurrent source withdrawal commits during a real governance wait", async mode => {
    const id = await fixture(); if (mode === "active") await start(id);
    const original = await read(id);
    if (mode === "fresh") await db.delete(recruitmentAssignments).where(eq(recruitmentAssignments.id, id));
    const held = barrier(), locked = barrier();
    const governance = db.transaction(async tx => {
      await tx.select().from(questions).where(eq(questions.id, 3)).for("update");
      await tx.update(questions).set({ reviewStatus: "in_review" }).where(eq(questions.id, 3));
      locked.release(); await held.promise;
    });
    await locked.promise;
    const manager = { ...ctx, studentEmail: "manager@example.test" };
    let returned = false;
    const pending = inviteRecruitmentCandidate(manager, orgId, original.assessmentId, memberId);
    const outcome = pending.then(() => { returned = true; return "unexpected success"; }, error => { returned = true; return error.code; });
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); expect(returned).toBe(false);
      held.release(); await governance; expect(await outcome).toBe("PRECONDITION_FAILED");
      expect(await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.assessmentId, original.assessmentId))).toEqual(mode === "fresh" ? [] : [original]);
    } finally {
      held.release(); await Promise.allSettled([governance, outcome]);
      await db.update(questions).set({ reviewStatus: "approved" }).where(eq(questions.id, 3));
    }
  });

  it.each(["invited", "active", "untimed"] as const)("durably finalizes real overdue %s attempts with withdrawn sources without manager reporting", async mode => {
    for (const kind of ["get", "start", "answer", "submit"] as const) {
      const id = await fixture(), original = await read(id);
      if (mode === "untimed") await db.update(recruitmentAssessments).set({ timeLimitMinutes: null }).where(eq(recruitmentAssessments.id, original.assessmentId));
      if (mode !== "invited") {
        const view = await start(id);
        await operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } });
      }
      const deadline = Date.now() - 1;
      await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, id));
      const before = await read(id), [definition] = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, original.assessmentId));
      await db.update(questions).set({ reviewStatus: "rejected" }).where(eq(questions.id, 3));
      try {
        const view = kind === "start" ? await start(id) : await operateRecruitmentCandidate(ctx, id,
          kind === "get" ? { kind: "get" } : kind === "answer" ? { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 1, revision: 0 } }
            : { kind: "submit", input: { assignmentId: id, revision: 0 } });
        const status = mode === "active" ? "timed_out" : "expired";
        expect(view).toMatchObject({ status, questions: [], answers: {}, revision: before.revision + 1 });
        expect(JSON.stringify(view)).not.toMatch(/correctIndex|explanation|"score"/);
        const durable = await read(id);
        expect(durable).toMatchObject({ status, answers: before.answers,
          submittedAtMs: mode === "active" ? deadline : null, score: mode === "active" ? { correct: 1, answered: 1 } : null });
        await operateRecruitmentCandidate(ctx, id, { kind: "get" });
        await operateRecruitmentCandidate(ctx, id, { kind: "submit", input: { assignmentId: id, revision: 0 } });
        expect(await read(id)).toEqual(durable);
        expect((await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.id, definition.id)))[0]).toEqual(definition);
      } finally { await db.update(questions).set({ reviewStatus: "approved" }).where(eq(questions.id, 3)); }
    }
  });

  it.each([
    ["active", "approved"], ["active", "rejected"], ["invited", "approved"], ["invited", "rejected"],
  ] as const)("commits a redacted %s deadline receipt when an actual clock crosses a %s source lock wait", async (mode, visibility) => {
    const id = await fixture();
    if (mode === "active") {
      const view = await start(id);
      await operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 0, revision: view.revision } });
    }
    const before = await read(id), deadline = Date.now() + 1500;
    await db.update(recruitmentAssignments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssignments.id, id));
    const held = barrier(), locked = barrier(), atSource = barrier();
    const realTransaction = db.transaction.bind(db);
    const governance = realTransaction(async tx => {
      await tx.select().from(questions).where(eq(questions.id, 3)).for("update");
      await tx.update(questions).set({ reviewStatus: visibility }).where(eq(questions.id, 3));
      locked.release(); await held.promise;
    });
    await locked.promise;
    let beforeWaitMs = 0, returned = false;
    const transaction = vi.spyOn(db, "transaction").mockImplementationOnce((callback, config) => realTransaction(tx => callback(new Proxy(tx, {
      get(target, property) {
        if (property === "select") return (...args: Parameters<typeof tx.select>) => {
          const builder = target.select(...args), originalFrom = builder.from.bind(builder);
          builder.from = ((table: Parameters<typeof originalFrom>[0]) => {
            const query = originalFrom(table);
            if (table === questions) {
              const execute = query.execute.bind(query);
              query.execute = ((...executeArgs: Parameters<typeof execute>) => {
                if (query.toSQL().params[0] === 3) { beforeWaitMs = Date.now(); atSource.release(); }
                return execute(...executeArgs);
              }) as typeof query.execute;
            }
            return query;
          }) as typeof builder.from;
          return builder;
        };
        return Reflect.get(target, property, target);
      },
    })), config));
    const pending = mode === "active"
      ? operateRecruitmentCandidate(ctx, id, { kind: "answer", input: { assignmentId: id, questionId: "1", selectedIndex: 1, revision: 0 } })
      : start(id);
    const outcome = pending.then(value => { returned = true; return value; }, error => { returned = true; throw error; });
    try {
      await Promise.race([atSource.promise, outcome.then(() => { throw new Error("Candidate skipped governance before the actual deadline"); })]);
      expect(beforeWaitMs).toBeLessThan(deadline);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, deadline - Date.now()) + 100));
      expect(Date.now()).toBeGreaterThanOrEqual(deadline); expect(returned).toBe(false);
      held.release(); await governance;
      const view = await outcome, status = mode === "active" ? "timed_out" : "expired";
      expect(view).toMatchObject({ status, questions: [], answers: {}, revision: before.revision + 1 });
      expect(view.serverNowMs).toBeGreaterThanOrEqual(deadline);
      expect(JSON.stringify(view)).not.toMatch(/correctIndex|explanation|"score"/);
      expect(await read(id)).toMatchObject({ status, answers: before.answers,
        submittedAtMs: mode === "active" ? deadline : null,
        score: mode === "active" ? { correct: 1, answered: 1 } : null, revision: before.revision + 1 });
    } finally {
      held.release(); await Promise.allSettled([governance, outcome]); transaction.mockRestore();
      await db.update(questions).set({ reviewStatus: "approved" }).where(eq(questions.id, 3));
    }
  });

  it.each(["fresh", "duplicate"] as const)("rejects real %s invitations whose deadline lapses during governance waits", async mode => {
    const id = await fixture(), original = await read(id), deadline = Date.now() + 60_000;
    await db.update(recruitmentAssessments).set({ expiresAtMs: deadline }).where(eq(recruitmentAssessments.id, original.assessmentId));
    if (mode === "fresh") await db.delete(recruitmentAssignments).where(eq(recruitmentAssignments.id, id));
    const held = barrier(), locked = barrier();
    const governance = db.transaction(async tx => { await tx.select().from(questions).where(eq(questions.id, 3)).for("update"); locked.release(); await held.promise; });
    await locked.promise;
    const clock = vi.spyOn(Date, "now").mockReturnValue(deadline - 1);
    const manager = { ...ctx, studentEmail: "manager@example.test" };
    let returned = false;
    const pending = inviteRecruitmentCandidate(manager, orgId, original.assessmentId, memberId);
    const outcome = pending.then(() => { returned = true; return "unexpected success"; }, error => { returned = true; return error.code; });
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); expect(returned).toBe(false);
      clock.mockReturnValue(deadline); held.release(); await governance;
      expect(await outcome).toBe("CONFLICT");
      expect(await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.assessmentId, original.assessmentId))).toEqual(mode === "fresh" ? [] : [original]);
    } finally { held.release(); await Promise.allSettled([governance, outcome]); clock.mockRestore(); }
  });

  it.each(["empty list", "populated list", "missing result", "nonowned result", "owned result",
    "missing revoke", "nonowned revoke", "already revoked", "active revoke"] as const)("gates revoked delegation before real private %s branches", async branch => {
    const delegateEmail = "boundary-delegate@example.test", now = Date.now();
    const testOrg = (await db.insert(organizations).values({ name: "Synthetic Boundary Team", province: "ontario", tier: "all-access", seatsTotal: 1,
      managerEmail: "boundary-owner@example.test", billingType: "invoice", status: "active", termStart: new Date(now - 86_400_000), termEnd: new Date(now + 86_400_000) }).$returningId())[0].id;
    const delegateId = (await db.insert(organizationMembers).values({ orgId: testOrg, email: delegateEmail, name: "Synthetic Boundary Delegate",
      role: DELEGATED_MANAGER_ROLE, status: "assigned", courseKey: null, courseKeys: null }).$returningId())[0].id;
    const foreignId = await fixture(), foreign = await read(foreignId), ownedFormId = randomUUID(), ownedId = randomUUID();
    if (branch !== "empty list") {
      await db.insert(recruitmentAssessments).values({ id: ownedFormId, orgId: testOrg, title: "Synthetic private definition", courseKey: "class2-water",
        courseLabel: "Class II Water Treatment", modules: ["Treatment", "Safety"], questionCount: 5, timeLimitMinutes: 30,
        questions: snapshot, creatorEmail: "boundary-owner@example.test", createdAtMs: now, expiresAtMs: now + 86_400_000 });
      await db.insert(recruitmentAssignments).values({ id: ownedId, assessmentId: ownedFormId, orgId: testOrg, memberId: delegateId,
        candidateEmail: "synthetic-boundary-candidate@example.test", creatorEmail: "boundary-owner@example.test", createdAtMs: now,
        updatedAtMs: now, expiresAtMs: now + 86_400_000, answers: {}, status: branch === "already revoked" ? "revoked" : "invited" });
    }
    let release!: () => void, entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), atTransaction = new Promise<void>(resolve => { entered = resolve; });
    const realTransaction = db.transaction.bind(db), privateTables: string[] = [];
    // Pause only after genuine global manager preflight. Once resumed, proxy
    // delegates every query to real MySQL while recording attempted tables.
    const transaction = vi.spyOn(db, "transaction").mockImplementationOnce((callback, config) => (async () => {
      entered(); await held;
      return realTransaction(tx => callback(new Proxy(tx, { get(target, property) {
        if (property === "select") return (...args: Parameters<typeof tx.select>) => {
          const builder = target.select(...args), originalFrom = builder.from.bind(builder);
          builder.from = ((table: Parameters<typeof originalFrom>[0]) => {
            if (table === recruitmentAssessments) privateTables.push("definitions");
            if (table === recruitmentAssignments) privateTables.push("assignments");
            return originalFrom(table);
          }) as typeof builder.from;
          return builder;
        };
        return Reflect.get(target, property, target);
      } })), config);
    })());
    const manager = { ...ctx, studentEmail: delegateEmail };
    const targetForm = branch === "missing result" ? randomUUID() : branch === "nonowned result" ? foreign.assessmentId : ownedFormId;
    const targetAssignment = branch === "missing revoke" ? randomUUID() : branch === "nonowned revoke" ? foreignId : ownedId;
    const pending = branch.includes("list") ? listRecruitmentAssessments(manager, testOrg)
      : branch.includes("result") ? recruitmentResults(manager, testOrg, targetForm) : revokeRecruitmentAssignment(manager, testOrg, targetAssignment);
    const outcome = pending.then(() => "unexpected success", error => error.code);
    try {
      await Promise.race([atTransaction, outcome.then(() => { throw new Error("Manager operation returned without locked reauthorization"); })]);
      await db.update(organizationMembers).set({ status: "revoked" }).where(eq(organizationMembers.id, delegateId));
      release(); expect(await outcome).toBe("FORBIDDEN"); expect(privateTables).toEqual([]);
      expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
      expect(await read(foreignId)).toEqual(foreign);
      // Authorized ownership lookup still distinguishes missing/nonowned only
      // after authority; a revoked delegate never receives those branches.
      if (branch.includes("missing") || branch.includes("nonowned")) {
        const owner = { ...ctx, studentEmail: "boundary-owner@example.test" };
        if (branch.includes("result")) await expect(recruitmentResults(owner, testOrg, targetForm)).rejects.toMatchObject({ code: "NOT_FOUND" });
        else await expect(revokeRecruitmentAssignment(owner, testOrg, targetAssignment)).rejects.toMatchObject({ code: "NOT_FOUND" });
      }
    } finally {
      release(); await outcome; transaction.mockRestore();
      await db.delete(recruitmentAssignments).where(eq(recruitmentAssignments.orgId, testOrg));
      await db.delete(recruitmentAssessments).where(eq(recruitmentAssessments.orgId, testOrg));
      await db.delete(organizationMembers).where(eq(organizationMembers.id, delegateId));
      await db.delete(organizations).where(eq(organizations.id, testOrg));
    }
  });
});
