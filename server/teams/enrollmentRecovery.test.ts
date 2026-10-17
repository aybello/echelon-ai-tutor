import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { organizations, organizationMembers, organizationTermUsage, subscriptions, teamFlexLicences, diagnosticSessions } from "../../drizzle/schema";
import { createAuditSqlDatabase } from "./auditSqlHarness";
import { orgRouter, orgIntelRouter } from "../routers/orgRouter";
import { teamFlexRouter } from "../routers/teamFlexRouter";

const state = vi.hoisted(() => ({ db: null as any, send: vi.fn() }));
vi.mock("../db", () => ({ getDb: async () => state.db }));
vi.mock("../email", () => ({ sendTeamEnrollmentEmail: state.send, sendOperatorStudyReminderEmail: vi.fn() }));
vi.mock("../analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../stripe/stripe", () => ({ stripe: {} }));
const ctx = (email = "manager@example.test") => ({ user: null, studentEmail: email, req: { headers: {}, cookies: {} }, res: {} }) as any;
const courseKeys = ["class1-water", "class2-water"];
const input = { orgId: 1, email: "learner@example.test", courseKeys };
let close: () => void;
let db: any;
const caller = () => orgRouter.createCaller(ctx());
async function rows(table: any) { return db.select().from(table); }
async function member(status = "assigned", email = input.email, orgId = 1) {
  await db.insert(organizationMembers).values({ orgId, email, role: "operator", status, courseKey: courseKeys[0], courseKeys: JSON.stringify(courseKeys) });
}
async function lapse(status = "active", termEnd = new Date(Date.now() - 1000)) {
  await db.update(organizations).set({ status, termEnd }).where(eq(organizations.id, 1));
  // This paid reporting window deliberately admits the manager through the shared gate.
  await db.insert(teamFlexLicences).values({ organizationId: 1, orderItemId: 99, courseKey: courseKeys[0], termMonths: 3, status: "expired", activationDeadline: termEnd, accessEndsAt: termEnd, reportingEndsAt: new Date(Date.now() + 86400000) });
}
beforeEach(async () => {
  const isolated = createAuditSqlDatabase(); db = isolated.db; close = isolated.close; state.db = db;
  // SQLite serializes the entire test transaction; strip only MySQL's row-lock statement.
  const execute = db.execute.bind(db);
  db.execute = (query: any) => query.queryChunks?.some((chunk: any) => chunk.value?.some?.((v: string) => v.includes("FOR UPDATE"))) ? Promise.resolve([]) : execute(query);
  state.send.mockReset().mockResolvedValue(undefined);
  await db.insert(organizations).values({ id: 1, name: "Synthetic team", managerEmail: "manager@example.test", province: "ontario", tier: "all-access", status: "active", seatsTotal: 2, termStart: new Date(Date.now() - 1000), termEnd: new Date(Date.now() + 86400000), billingType: "invoice" });
});
afterEach(() => { close(); vi.restoreAllMocks(); });
describe("Annual enrollment recovery (real router, isolated SQL, mocked mail)", () => {
  it("awaits SMTP only after commit, with all course labels and normalized identity", async () => {
    let release!: () => void;
    let started!: () => void;
    const sending = new Promise<void>(resolve => { started = resolve; });
    state.send.mockImplementation(async (payload: any) => {
      expect((await rows(organizationMembers))[0].status).toBe("assigned");
      // BEGIN succeeds only after the assignment transaction has committed.
      await db.transaction(async () => {});
      expect(payload.courseName).toContain(" & "); expect(payload.email).toBe(input.email);
      started(); await new Promise<void>(resolve => { release = resolve; });
    });
    let settled = false;
    const pending = caller().assignSeat({ ...input, email: "LEARNER@example.test" }).then(value => { settled = true; return value; });
    await sending; expect(settled).toBe(false); release();
    expect(await pending).toMatchObject({ success: true, enrollment: { status: "sent" } });
  });
  it("keeps committed access on mail failure and resends without another licence or subscription write", async () => {
    state.send.mockRejectedValueOnce(new Error("synthetic SMTP failure"));
    expect(await caller().assignSeat(input)).toMatchObject({ success: true, enrollment: { status: "failed" } });
    const before = { members: await rows(organizationMembers), usage: await rows(organizationTermUsage), subs: await rows(subscriptions) };
    expect(await caller().resendEnrollment({ orgId: 1, email: input.email })).toMatchObject({ enrollment: { status: "sent" } });
    expect({ members: await rows(organizationMembers), usage: await rows(organizationTermUsage), subs: await rows(subscriptions) }).toEqual(before);
    expect(state.send).toHaveBeenCalledTimes(2);
  });
  it("rolls back a failing single transaction without mailing", async () => {
    const transaction = db.transaction;
    db.transaction = (fn: any) => transaction(async (tx: any) => { await fn(tx); throw new Error("synthetic commit failure"); });
    await expect(caller().assignSeat(input)).rejects.toThrow("synthetic commit failure");
    expect(state.send).not.toHaveBeenCalled(); expect(await rows(organizationMembers)).toEqual([]); expect(await rows(organizationTermUsage)).toEqual([]);
  });
  it("rolls back an over-cap bulk batch without any mail or consumed licence", async () => {
    await expect(caller().assignSeats({ orgId: 1, emails: ["a@example.test", "b@example.test", "c@example.test"], courseKeys })).rejects.toThrow("limit reached");
    expect(state.send).not.toHaveBeenCalled(); expect(await rows(organizationMembers)).toEqual([]); expect(await rows(organizationTermUsage)).toEqual([]);
  });
  it("reports every bulk delivery outcome after the complete batch commits", async () => {
    state.send.mockImplementationOnce(async () => { expect(await rows(organizationMembers)).toHaveLength(2); throw new Error("synthetic failure"); });
    const result = await caller().assignSeats({ orgId: 1, emails: [input.email, "second@example.test", input.email], courseKeys });
    expect(result.results.map(r => r.enrollment.status)).toEqual(["failed", "sent"]);
    expect(await rows(organizationTermUsage)).toHaveLength(2);
  });
  it("reactivates a counted operator at capacity without consuming a new seat", async () => {
    await caller().assignSeat(input); await caller().assignSeat({ ...input, email: "second@example.test" });
    await caller().revokeSeat({ orgId: 1, email: input.email });
    state.send.mockClear(); expect(await caller().assignSeat(input)).toMatchObject({ enrollment: { status: "sent" } });
    expect(await rows(organizationTermUsage)).toHaveLength(2); expect(state.send).toHaveBeenCalledOnce();
  });
  it("does not auto-email an already assigned member, but permits explicit resend", async () => {
    await member(); expect(await caller().assignSeat(input)).toMatchObject({ enrollment: { status: "not_requested" } });
    expect(state.send).not.toHaveBeenCalled(); await caller().resendEnrollment(input); expect(state.send).toHaveBeenCalledOnce();
  });
  it("resend failures remain explicit and do not mutate reminder consent/cooldown", async () => {
    await member(); await db.update(organizationMembers).set({ reminderOptOut: true, lastRemindedAt: new Date(), unsubscribeToken: "synthetic" });
    const before = await rows(organizationMembers); state.send.mockRejectedValue(new Error("synthetic"));
    expect(await caller().resendEnrollment(input)).toMatchObject({ enrollment: { status: "failed" } }); expect(await rows(organizationMembers)).toEqual(before);
  });
  it.each(["revoked", "missing", "manager", "foreign"])("rejects resend for %s recipients", async kind => {
    if (kind !== "missing") await member(kind === "revoked" ? "revoked" : "assigned", input.email, kind === "foreign" ? 2 : 1);
    if (kind === "manager") await db.update(organizationMembers).set({ role: "manager" });
    await expect(caller().resendEnrollment(input)).rejects.toMatchObject({ code: "NOT_FOUND" }); expect(state.send).not.toHaveBeenCalled();
  });
  it("denies unrelated manager ownership before delivery", async () => {
    await member(); await expect(orgRouter.createCaller(ctx("outsider@example.test")).resendEnrollment(input)).rejects.toMatchObject({ code: "FORBIDDEN" }); expect(state.send).not.toHaveBeenCalled();
  });
  it("counts repeated diagnostic completions as one learner, not multiple sessions", async () => {
    await member(); await member("assigned", "second@example.test");
    const [learner] = await rows(organizationMembers);
    await db.insert(diagnosticSessions).values([1, 2, 3].map(n => ({ sessionId: `synthetic-${n}`, studentEmail: input.email, orgId: 1, organizationMemberId: learner.id, courseKey: courseKeys[0], correct: 8, total: 10, score: 80, label: "synthetic", weakTopics: "[]", strongTopics: "[]", topicBreakdown: "[]" })));
    expect(await orgIntelRouter.createCaller(ctx()).getTeamReadinessSummary({ orgId: 1 })).toMatchObject({ diagnosticCompleted: 1, diagnosticCompletionRate: 50, seatsAssigned: 2 });
  });
  it("cannot reactivate a revoked subscription via course changes", async () => {
    await member("revoked"); await expect(caller().updateSeatCourse(input)).rejects.toThrow("Reactivate"); expect(await rows(subscriptions)).toEqual([]);
  });
});
describe("reporting-only manager cannot extend Annual learner rights", () => {
  it.each(["assign", "reactivate", "bulk", "courses", "resend"])("denies expired Annual %s despite an owned paid reporting window", async operation => {
    await member(operation === "reactivate" ? "revoked" : "assigned"); await lapse();
    // Reporting/listing remains available to the same identity.
    expect(await caller().listMembers({ orgId: 1 })).toHaveLength(1);
    const before = await rows(organizationMembers);
    const pending = operation === "bulk" ? caller().assignSeats({ orgId: 1, emails: [input.email], courseKeys }) : operation === "courses" ? caller().updateSeatCourse(input) : operation === "resend" ? caller().resendEnrollment(input) : caller().assignSeat(input);
    await expect(pending).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await rows(organizationMembers)).toEqual(before); expect(await rows(subscriptions)).toEqual([]); expect(await rows(organizationTermUsage)).toEqual([]); expect(state.send).not.toHaveBeenCalled();
  });
  it("denies Annual writes at the exact term boundary while preserving paid reporting", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const cutoff = new Date("2026-10-17T16:00:00.000Z"); vi.setSystemTime(cutoff);
      await lapse("active", cutoff);
      await expect(caller().assignSeat(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await rows(organizationTermUsage)).toEqual([]); expect(state.send).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it.each(["cancelled", "pending", "expired"])("denies %s Annual status even with a future term and paid reporting", async status => {
    await lapse(status, new Date(Date.now() + 86400000)); await expect(caller().assignSeat(input)).rejects.toMatchObject({ code: "FORBIDDEN" }); expect(await rows(organizationTermUsage)).toEqual([]);
  });
  it("retains past_due Annual assignment during the live term", async () => {
    await db.update(organizations).set({ status: "past_due" }); expect(await caller().assignSeat(input)).toMatchObject({ enrollment: { status: "sent" } });
  });
  it("preserves independently paid Flex assignment after Annual expiry", async () => {
    await lapse(); const [insert] = await db.insert(teamFlexLicences).values({ organizationId: 1, orderItemId: 100, courseKey: courseKeys[0], termMonths: 3, status: "unused", activationDeadline: new Date(Date.now() + 86400000) });
    await teamFlexRouter.createCaller(ctx()).assignLicence({ orgId: 1, licenceId: Number(insert.insertId), operatorUserId: 42 });
    const [licence] = await db.select().from(teamFlexLicences).where(eq(teamFlexLicences.id, Number(insert.insertId)));
    expect(licence.status).toBe("assigned"); expect(await rows(subscriptions)).toEqual([]); expect(await rows(organizationTermUsage)).toEqual([]);
  });
});
