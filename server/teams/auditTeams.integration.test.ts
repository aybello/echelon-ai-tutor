import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray, or } from "drizzle-orm";
import { organizations, organizationMembers, teamFlexLicences, questionAttempts, subscriptions, questions, purchases, studentProfiles, examResults, learnerOnboarding, diagnosticSessions, examDates, teamFlexOrders, teamFlexOrderItems } from "../../drizzle/schema";
import { getDb } from "../db";
import { createIsolatedAuditDatabase } from "./auditSqlHarness";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const isolated = vi.hoisted(() => ({ db: null as any }));
vi.mock("../db", () => ({ getDb: async () => isolated.db }));
const external = vi.hoisted(() => {
  let checkoutSequence = 0;
  const checkoutRun = Date.now();
  return { portal: vi.fn().mockResolvedValue({ url: "https://billing.example.test" }), update: vi.fn().mockResolvedValue({}), checkout: vi.fn().mockImplementation(async () => ({ id: `cs_audit_${checkoutRun}_${++checkoutSequence}`, url: "https://checkout.example.test" })) };
});
vi.mock("../stripe/stripe", () => ({ stripe: { billingPortal: { sessions: { create: external.portal } }, subscriptions: { retrieve: vi.fn().mockResolvedValue({ items: { data: [{ id: "si_audit" }] } }), update: external.update }, checkout: { sessions: { create: external.checkout } } } }));
vi.mock("../email", () => ({ sendTeamEnrollmentEmail: vi.fn(), sendWelcomeOnboardingEmail: vi.fn(), sendConfirmationEmail: vi.fn(), sendOperatorStudyReminderEmail: vi.fn(), sendCoursePassInvitationEmail: vi.fn() }));
vi.mock("../analytics", () => ({ trackEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../_core/notification", () => ({ notifyOwner: vi.fn() }));
const suffix = randomUUID();
const manager = `manager-${suffix}@example.test`, learner = `learner-${suffix}@example.test`, revoked = `revoked-${suffix}@example.test`;
const paidEmail = `paid-${suffix}@example.test`;
const annualEmail = `annual-${suffix}@example.test`;
const newManagers = [`new-manager-${suffix}@example.test`, `new-oauth-manager-${suffix}@example.test`];
const syntheticModule = `Synthetic paid module ${suffix}`;
vi.mock("../commercialAvailability", () => ({ ORGANIZATION_COMMERCE_ENABLED: true, ORGANIZATION_COMMERCE_HOLD_MESSAGE: "Synthetic hold", getCommercialAvailability: vi.fn().mockResolvedValue([{ key: "class3-water-dist" }]) }));
const course = "class3-water-dist";
const now = new Date();
const past = new Date(now.getTime() - 5 * 86400000), future = new Date(now.getTime() + 90 * 86400000);
const ctx = (email: string | null, userId?: number): TrpcContext => ({ user: userId ? { id: userId, email, openId: `audit-${userId}`, role: "user" } : null, studentEmail: userId ? null : email, req: { headers: {}, cookies: {} }, res: { cookie: vi.fn() } }) as any;
const suite = describe;
let close: () => void | Promise<void>;
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let orgId: number, lapsedId: number, memberId: number, revokedId: number, licenceId: number;
suite("October 3 team boundary regressions (isolated synthetic database)", () => {
  beforeAll(async () => {
    const database = await createIsolatedAuditDatabase();
    db = database.db as any; isolated.db = db; close = database.close;
    const [o] = await db.insert(organizations).values({ name: "Synthetic current team", managerEmail: manager, province: "ontario", tier: "all-access", seatsTotal: 5, status: "active", termStart: past, termEnd: future, billingType: "stripe", stripeCustomerId: "cus_audit_team", stripeSubscriptionId: "sub_audit_team" }); orgId = Number(o.insertId);
    const [old] = await db.insert(organizations).values({ name: "Synthetic lapsed team", managerEmail: manager, province: "ontario", tier: "all-access", seatsTotal: 5, status: "expired", termStart: new Date(now.getTime() - 400 * 86400000), termEnd: past, billingType: "stripe", stripeCustomerId: "cus_audit_lapsed", stripeSubscriptionId: "sub_audit_lapsed" }); lapsedId = Number(old.insertId);
    await db.insert(organizationMembers).values({ orgId: lapsedId, email: manager, role: "manager", status: "assigned" });
    const [m] = await db.insert(organizationMembers).values({ orgId, email: learner, role: "operator", status: "assigned", courseKey: course }); memberId = Number(m.insertId);
    const [r] = await db.insert(organizationMembers).values({ orgId, email: revoked, role: "operator", status: "revoked", courseKey: course }); revokedId = Number(r.insertId);
    const [l] = await db.insert(teamFlexLicences).values({ organizationId: orgId, orderItemId: 999001, courseKey: course, termMonths: 3, invitedEmail: learner, status: "active", activatedAt: past, startsAt: past, accessEndsAt: future, activationDeadline: future }); licenceId = Number(l.insertId);
    await db.insert(questionAttempts).values([
      { studentEmail: learner, examType: course, courseKey: course, bankKey: course, questionId: 999001, correct: "yes", topic: "Synthetic", orgId: null, createdAt: now },
      { studentEmail: learner, examType: course, courseKey: course, bankKey: course, questionId: 999002, correct: "yes", topic: "Synthetic", orgId: lapsedId, createdAt: now },
      { studentEmail: revoked, examType: course, questionId: 999003, correct: "yes", topic: "Synthetic", orgId, organizationMemberId: revokedId, createdAt: now },
    ]);
    await db.insert(subscriptions).values({ email: manager, tier: "all-access", province: "ontario", orgId: null, stripeSubscriptionId: `sub_personal_${suffix}`, stripeCustomerId: "cus_audit_personal", status: "active", currentPeriodStart: past, currentPeriodEnd: future });
  });
  afterAll(async () => {
    if (!db) return;
    try {
      const emails = [manager, learner, revoked, paidEmail, annualEmail, ...newManagers];
      const ownedOrgs = await db.select({ id: organizations.id }).from(organizations).where(inArray(organizations.managerEmail, [manager, ...newManagers]));
      const orgIds = ownedOrgs.map(row => row.id);
      await db.delete(questionAttempts).where(inArray(questionAttempts.studentEmail, emails));
      await db.delete(examResults).where(eq(examResults.studentEmail, paidEmail));
      await db.delete(purchases).where(eq(purchases.email, paidEmail));
      await db.delete(studentProfiles).where(or(inArray(studentProfiles.studentEmail, [paidEmail, annualEmail]), eq(studentProfiles.userId, 801)));
      await db.delete(examDates).where(eq(examDates.email, annualEmail));
      await db.delete(questions).where(eq(questions.module, syntheticModule));
      await db.delete(subscriptions).where(inArray(subscriptions.email, emails));
      if (orgIds.length) {
        const orders = await db.select({ id: teamFlexOrders.id }).from(teamFlexOrders).where(inArray(teamFlexOrders.organizationId, orgIds));
        if (orders.length) await db.delete(teamFlexOrderItems).where(inArray(teamFlexOrderItems.orderId, orders.map(row => row.id)));
        await db.delete(teamFlexLicences).where(inArray(teamFlexLicences.organizationId, orgIds));
        await db.delete(teamFlexOrders).where(inArray(teamFlexOrders.organizationId, orgIds));
        await db.delete(organizationMembers).where(inArray(organizationMembers.orgId, orgIds));
        await db.delete(organizations).where(inArray(organizations.id, orgIds));
      }
    } finally { await close(); }
  });
  it("does not include personal or other-employer attempts in Flex progress or readiness", async () => {
    const [progress] = await appRouter.createCaller(ctx(manager)).teamFlex.getFlexProgress({ orgId });
    expect(progress.totalAttempts).toBe(0); expect(progress.readinessScore).toBe(0); expect(progress.lastActiveAt).toBeNull(); expect(progress.daysActive30).toBe(0);
  });
  it("seat increases target the displayed current organization even without a manager membership", async () => {
    external.update.mockClear();
    const caller = appRouter.createCaller(ctx(manager));
    expect((await caller.org.getOrgOverview()).orgId).toBe(orgId);
    await caller.stripe.updateTeamSeats({ seats: 6 });
    expect(external.update).toHaveBeenCalledWith("sub_audit_team", expect.anything());
  });
  it("lapsed team portal uses the team customer, never the personal fallback", async () => {
    await db.update(organizations).set({ status: "expired", termEnd: past }).where(eq(organizations.id, orgId));
    try {
      external.portal.mockClear();
      await appRouter.createCaller(ctx(manager)).stripe.createBillingPortalSession({ orgId } as any);
      expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_audit_team" }));
    } finally { await db.update(organizations).set({ status: "active", termEnd: future }).where(eq(organizations.id, orgId)); }
  });
  it("Annual activity numerators exclude revoked members from the assigned cohort", async () => {
    const caller = appRouter.createCaller(ctx(manager));
    expect((await caller.org.getOrgOverview()).activeThisWeek).toBe(0);
    const intel = await caller.orgIntel.getTeamReadinessSummary();
    expect(intel).toMatchObject({ seatsAssigned: 1, activeThisWeek: 0, activeThirtyDays: 0, learningActivated: 0, activationRate: 0, totalQuestions: 0 });
  });
  it("rejects a signed-in purchaser naming another manager before checkout or order creation", async () => {
    external.checkout.mockClear();
    await expect(appRouter.createCaller(ctx(manager)).teamFlex.createOrder({ organizationName: "Synthetic procurement", managerEmail: "different@example.test", billingEmail: "billing@example.test", province: "ontario", items: [{ courseKey: course, termMonths: 3, quantity: 1 }] })).rejects.toThrow(/manager|signed.in/i);
    expect(external.checkout).not.toHaveBeenCalled();
  });
  it("requires explicit selection for multiple active owned organizations and never grants a legacy member ownership", async () => {
    await db.update(organizations).set({ status: "active", termEnd: future }).where(eq(organizations.id, lapsedId));
    try {
      const caller = appRouter.createCaller(ctx(manager));
      await expect(caller.org.getOrgOverview()).rejects.toThrow("Choose the organization");
      await expect(caller.stripe.updateTeamSeats({ seats: 6 })).rejects.toThrow("Choose the organization");
      await expect(caller.stripe.createBillingPortalSession({})).rejects.toThrow("Choose the organization");
      expect((await caller.org.getOrgOverview({ orgId })).orgId).toBe(orgId);
      external.update.mockClear(); await caller.stripe.updateTeamSeats({ orgId, seats: 6 });
      expect(external.update).toHaveBeenCalledWith("sub_audit_team", expect.anything());
      expect(await caller.org.listMembers({ orgId: lapsedId })).toEqual([]);
      expect((await caller.orgIntel.getTeamReadinessSummary({ orgId })).seatsAssigned).toBe(1);
      await caller.org.revokeSeat({ orgId: lapsedId, email: learner });
      expect((await db.select().from(organizationMembers).where(eq(organizationMembers.id, memberId)))[0].status).toBe("assigned");
      await db.insert(organizationMembers).values({ orgId, email: "not-owner@example.test", role: "manager", status: "assigned" });
      await expect(appRouter.createCaller(ctx("not-owner@example.test")).org.getOrgOverview({ orgId })).rejects.toThrow("not a manager");
    } finally { await db.update(organizations).set({ status: "expired", termEnd: past }).where(eq(organizations.id, lapsedId)); }
  });
  it("uses the verified OAuth account rather than a simultaneous email session for team and billing ownership", async () => {
    const mixed = { ...ctx(learner, 802), studentEmail: manager };
    const caller = appRouter.createCaller(mixed);
    await expect(caller.org.getOrgOverview({ orgId })).rejects.toThrow("not a manager");
    external.portal.mockClear();
    await expect(caller.stripe.createBillingPortalSession({})).rejects.toThrow("No Stripe customer found");
    expect(external.portal).not.toHaveBeenCalled();
  });
  it.each(["pending", "cancelled", "expired"])("denies dashboard/seat changes for %s while completed lapsed billing stays recoverable", async status => {
    await db.update(organizations).set({ status, termEnd: past }).where(eq(organizations.id, orgId));
    try {
      const caller = appRouter.createCaller(ctx(manager));
      await expect(caller.org.getOrgOverview({ orgId })).rejects.toThrow("ended");
      external.update.mockClear(); await expect(caller.stripe.updateTeamSeats({ orgId, seats: 6 })).rejects.toThrow("ended");
      expect(external.update).not.toHaveBeenCalled();
      if (status === "pending") await expect(caller.stripe.createBillingPortalSession({ orgId })).rejects.toThrow("completed billing");
      else { external.portal.mockClear(); await caller.stripe.createBillingPortalSession({ orgId }); expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_audit_team" })); }
    } finally { await db.update(organizations).set({ status: "active", termEnd: future }).where(eq(organizations.id, orgId)); }
  });
  it("denies anonymous and non-owner Flex report requests", async () => {
    await expect(appRouter.createCaller(ctx(null)).teamFlex.getFlexProgress({ orgId })).rejects.toThrow("sign in");
    await expect(appRouter.createCaller(ctx(learner)).teamFlex.getFlexProgress({ orgId })).rejects.toThrow("not a manager");
  });
  it("supports guest procurement as a new pending organization without transferring an existing team", async () => {
    const result = await appRouter.createCaller(ctx(null)).teamFlex.createOrder({ organizationName: "Synthetic guest procurement", managerEmail: manager, billingEmail: "procurement@example.test", province: "ontario", items: [{ courseKey: course, termMonths: 3, quantity: 1 }] });
    const [order] = await db.select().from(teamFlexOrders).where(eq(teamFlexOrders.id, result.orderId));
    expect(order.managerEmail).toBe(manager); expect(order.organizationId).not.toBe(orgId); expect(order.purchaserUserId).toBeNull();
    const [newOrg] = await db.select().from(organizations).where(eq(organizations.id, order.organizationId));
    expect(newOrg).toMatchObject({ status: "pending", seatsTotal: 0, managerEmail: manager });
    expect((await db.select().from(organizations).where(eq(organizations.id, orgId)))[0].managerEmail).toBe(manager);
  });
  it("honors a new signed-in manager with a separate billing contact and rejects OAuth/email manager mismatch", async () => {
    for (const identity of [ctx(newManagers[0]), ctx(newManagers[1], 800)]) {
      await expect(appRouter.createCaller(identity).teamFlex.createOrder({ organizationName: "Synthetic buyer", managerEmail: "different@example.test", province: "ontario", items: [{ courseKey: course, termMonths: 3, quantity: 1 }] })).rejects.toThrow("Signed-in checkout");
      const email = identity.user?.email ?? identity.studentEmail!;
      const result = await appRouter.createCaller(identity).teamFlex.createOrder({ organizationName: "Synthetic buyer", managerEmail: email!, billingEmail: "billing@example.test", province: "ontario", items: [{ courseKey: course, termMonths: 3, quantity: 1 }] });
      const [order] = await db.select().from(teamFlexOrders).where(eq(teamFlexOrders.id, result.orderId));
      expect(order.managerEmail).toBe(email); expect(order.purchaserUserId).toBe(identity.user?.id ?? null);
    }
  });
  it("attributes paid email/OAuth practice and mocks at issuance, excluding legacy, personal and other licences", async () => {
    const [lic] = await db.insert(teamFlexLicences).values({ organizationId: orgId, orderItemId: 999002, courseKey: course, termMonths: 3, invitedEmail: paidEmail, operatorUserId: 801, status: "active", activatedAt: past, startsAt: past, accessEndsAt: future, activationDeadline: future });
    const paidLicenceId = Number(lic.insertId);
    await db.insert(questions).values(Array.from({ length: 125 }, (_, i) => ({ bankKey: course, questionNum: 990001 + i, module: syntheticModule, topic: "Synthetic paid topic", question: "Synthetic question", options: '["A","B","C","D"]', correctIndex: 0, explanation: "Synthetic explanation", reviewStatus: "approved" as const })));
    for (const actor of [ctx(paidEmail), ctx(paidEmail, 801)]) {
      const caller = appRouter.createCaller(actor);
      const issued = await caller.quiz.getRandomQuestions({ bankKey: course, limit: 1 });
      expect(issued.locked).toBe(false);
      const question = issued.questions[0]; const sessionId = randomUUID();
      expect(await caller.quiz.logAttempt({ bankKey: course, examType: course, questionId: question.id, selectedIndex: 0, attemptToken: question.attemptToken, sessionId })).toEqual({ success: true, correct: true });
      const [attempt] = await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, sessionId));
      expect(attempt).toMatchObject({ orgId, organizationMemberId: null, flexLicenceId: paidLicenceId, studentEmail: paidEmail });
    }
    const caller = appRouter.createCaller(ctx(paidEmail));
    const issuedMock = await caller.exam.startMock({ courseKey: course });
    const mockInput = { sessionId: issuedMock.sessionId, sessionToken: issuedMock.token, examType: issuedMock.examType, bankKey: course, answers: issuedMock.questions.map(q => ({ questionNum: q.id, selectedIndex: 0 })) };
    await caller.exam.submitMock(mockInput);
    await caller.exam.submitMock(mockInput);
    const attempts = await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, issuedMock.sessionId));
    expect(attempts).toHaveLength(100); expect(attempts.every(row => row.flexLicenceId === paidLicenceId && row.orgId === orgId)).toBe(true);
    const base = { studentEmail: paidEmail, userId: 801, examType: course, courseKey: course, questionId: 990001, correct: "no" as const, topic: "Synthetic paid topic" };
    await db.insert(questionAttempts).values([
      { ...base, orgId, flexLicenceId: null }, // ambiguous legacy
      { ...base, orgId: null, flexLicenceId: null }, // personal
      { ...base, orgId: lapsedId, flexLicenceId: paidLicenceId }, // other employer
      { ...base, orgId, flexLicenceId: licenceId }, // other licence
      { ...base, orgId, flexLicenceId: paidLicenceId, createdAt: new Date(past.getTime() - 86400000) }, // before activation
      { ...base, orgId, flexLicenceId: paidLicenceId, createdAt: new Date(future.getTime() + 86400000) }, // after expiry
    ]);
    const progress = (await appRouter.createCaller(ctx(manager)).teamFlex.getFlexProgress({ orgId })).find(row => row.licenceId === paidLicenceId)!;
    expect(progress).toMatchObject({ totalAttempts: 102, correctAttempts: 102, accuracy: 100, daysActive30: 1 });
    expect(progress.readinessScore).toBeGreaterThan(0);
    // A second active employer makes issuance unreportable, not arbitrarily owned.
    const [ambiguous] = await db.insert(teamFlexLicences).values({ organizationId: lapsedId, orderItemId: 999003, courseKey: course, termMonths: 3, invitedEmail: paidEmail, status: "active", activatedAt: past, startsAt: past, accessEndsAt: future, activationDeadline: future });
    const question = (await caller.quiz.getRandomQuestions({ bankKey: course, limit: 1 })).questions[0]; const ambiguousSession = randomUUID();
    await caller.quiz.logAttempt({ bankKey: course, examType: course, questionId: question.id, selectedIndex: 0, attemptToken: question.attemptToken, sessionId: ambiguousSession });
    expect((await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, ambiguousSession)))[0]).toMatchObject({ orgId: null, flexLicenceId: null });
    await db.delete(teamFlexLicences).where(eq(teamFlexLicences.id, Number(ambiguous.insertId)));
    // Even with a unique team grant, a personal pass must not silently feed team reporting.
    await db.insert(purchases).values({ email: paidEmail, productKey: course, productName: "Synthetic personal pass", amountCAD: 29900, stripeSessionId: `cs_personal_${suffix}`, accessExpiresAt: future });
    const personalQuestion = (await caller.quiz.getRandomQuestions({ bankKey: course, limit: 1 })).questions[0]; const personalSession = randomUUID();
    await caller.quiz.logAttempt({ bankKey: course, examType: course, questionId: personalQuestion.id, selectedIndex: 0, attemptToken: personalQuestion.attemptToken, sessionId: personalSession });
    expect((await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, personalSession)))[0]).toMatchObject({ orgId: null, flexLicenceId: null });
    expect((await appRouter.createCaller(ctx(manager)).teamFlex.getFlexProgress({ orgId })).find(row => row.licenceId === paidLicenceId)!.totalAttempts).toBe(102);
  });

  it("preserves unique Annual course attribution and learner history without assigning revoked receipts to a team", async () => {
    const [member] = await db.insert(organizationMembers).values({ orgId, email: annualEmail, role: "operator", status: "assigned", courseKey: course });
    const annualMemberId = Number(member.insertId);
    const caller = appRouter.createCaller(ctx(annualEmail));
    const question = (await caller.quiz.getRandomQuestions({ bankKey: course, limit: 1 })).questions[0];
    const sessionId = randomUUID();
    await caller.quiz.logAttempt({ bankKey: course, examType: course, questionId: question.id, selectedIndex: 0, attemptToken: question.attemptToken, sessionId });
    expect((await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, sessionId)))[0]).toMatchObject({ orgId, organizationMemberId: annualMemberId, flexLicenceId: null });
    // This existing date upsert uses native MySQL SQL; verify it only against
    // the assigned real database rather than emulating its dialect in SQLite.
    if (process.env.AUDIT_INTEGRATION_TEST_DB === "1") {
      await caller.examDate.set({ email: annualEmail, productKey: course, examDate: "2030-06-01" });
      expect((await db.select().from(examDates).where(eq(examDates.email, annualEmail)))[0]).toMatchObject({ orgId, organizationMemberId: annualMemberId });
    }
    const stale = (await caller.quiz.getRandomQuestions({ bankKey: course, limit: 1 })).questions[0];
    await db.update(organizationMembers).set({ status: "revoked" }).where(eq(organizationMembers.id, annualMemberId));
    await db.insert(subscriptions).values({ email: annualEmail, tier: "all-access", province: "ontario", orgId: null, stripeSubscriptionId: `sub_annual_personal_${suffix}`, status: "active", currentPeriodStart: past, currentPeriodEnd: future });
    const revokedSession = randomUUID();
    expect(await caller.quiz.logAttempt({ bankKey: course, examType: course, questionId: stale.id, selectedIndex: 0, attemptToken: stale.attemptToken, sessionId: revokedSession })).toEqual({ success: true, correct: true });
    expect((await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, revokedSession)))[0]).toMatchObject({ orgId: null, organizationMemberId: null, flexLicenceId: null });
    expect((await db.select().from(questionAttempts).where(eq(questionAttempts.sessionId, sessionId)))[0]).toMatchObject({ orgId, organizationMemberId: annualMemberId });
  });

});
