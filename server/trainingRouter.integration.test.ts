import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { getDb } from "./db";
import {
  learningActivitySessions,
  organizationMembers,
  organizations,
  subscriptions,
  teamFlexLicences,
  trainingAttestations,
} from "../drizzle/schema";

function makeCtx(studentEmail: string): TrpcContext {
  return {
    user: null,
    studentEmail,
    req: { protocol: "https", headers: {}, cookies: {} } as any,
    res: { clearCookie: () => {}, cookie: () => {} } as any,
  };
}

const RUN_ID = Date.now().toString(36);
const MANAGER_A = `training-manager-a-${RUN_ID}@echelon-test.invalid`;
const MANAGER_B = `training-manager-b-${RUN_ID}@echelon-test.invalid`;
const OPERATOR = `training-operator-${RUN_ID}@echelon-test.invalid`;
const ZERO_ACTIVITY_OPERATOR = `training-zero-${RUN_ID}@echelon-test.invalid`;
const COURSE_PASS_ZERO_ACTIVITY_OPERATOR = `training-flex-zero-${RUN_ID}@echelon-test.invalid`;
const LEGACY_UNASSIGNED_OPERATOR = `training-legacy-${RUN_ID}@echelon-test.invalid`;
let db: Awaited<ReturnType<typeof getDb>>;
let orgAId = 0;
let orgBId = 0;

async function insertSubscription(email: string, tier: "class1" | "all-access", orgId: number | null) {
  if (!db) return;
  await db.insert(subscriptions).values({
    email,
    tier,
    province: "ontario",
    stripeSubscriptionId: `training-test-${RUN_ID}-${email}`.slice(0, 128),
    status: "active",
    currentPeriodStart: new Date(Date.now() - 60_000),
    currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    orgId,
  });
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  db = await getDb();
  if (!db) return;
  const termStart = new Date(Date.now() - 60_000);
  const termEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const [orgA] = await db.insert(organizations).values({
    name: `Training Test A ${RUN_ID}`,
    province: "ontario",
    tier: "all-access",
    seatsTotal: 10,
    managerEmail: MANAGER_A,
    termStart,
    termEnd,
    billingType: "invoice",
    status: "active",
  });
  orgAId = Number((orgA as any).insertId);
  const [orgB] = await db.insert(organizations).values({
    name: `Training Test B ${RUN_ID}`,
    province: "ontario",
    tier: "all-access",
    seatsTotal: 10,
    managerEmail: MANAGER_B,
    termStart,
    termEnd,
    billingType: "invoice",
    status: "active",
  });
  orgBId = Number((orgB as any).insertId);

  await db.insert(organizationMembers).values([
    { orgId: orgAId, email: MANAGER_A, role: "manager", status: "assigned" },
    { orgId: orgBId, email: MANAGER_B, role: "manager", status: "assigned" },
    { orgId: orgAId, email: OPERATOR, role: "operator", status: "assigned", courseKey: "class1-water" },
    { orgId: orgAId, email: ZERO_ACTIVITY_OPERATOR, role: "operator", status: "assigned", courseKey: "class1-water" },
    { orgId: orgAId, email: LEGACY_UNASSIGNED_OPERATOR, role: "operator", status: "assigned" },
  ]);
  await db.insert(teamFlexLicences).values({
    orderItemId: 900_000,
    organizationId: orgAId,
    courseKey: "class1-water",
    termMonths: 12,
    status: "active",
    invitedEmail: COURSE_PASS_ZERO_ACTIVITY_OPERATOR,
    assignedAt: termStart,
    activatedAt: termStart,
    startsAt: termStart,
    accessEndsAt: termEnd,
    originalAccessEndsAt: termEnd,
    reportingEndsAt: termEnd,
    activationDeadline: termEnd,
  });
  await insertSubscription(OPERATOR, "class1", orgAId);
  await insertSubscription(ZERO_ACTIVITY_OPERATOR, "class1", orgAId);
  await insertSubscription(LEGACY_UNASSIGNED_OPERATOR, "all-access", null);
});

afterAll(async () => {
  if (!db) return;
  for (const email of [OPERATOR, ZERO_ACTIVITY_OPERATOR, COURSE_PASS_ZERO_ACTIVITY_OPERATOR, LEGACY_UNASSIGNED_OPERATOR]) {
    await db.delete(trainingAttestations).where(eq(trainingAttestations.operatorEmail, email)).catch(() => {});
    await db.delete(learningActivitySessions).where(eq(learningActivitySessions.studentEmail, email)).catch(() => {});
    await db.delete(subscriptions).where(eq(subscriptions.email, email)).catch(() => {});
  }
  if (orgAId) {
    await db.delete(teamFlexLicences).where(eq(teamFlexLicences.organizationId, orgAId)).catch(() => {});
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgAId)).catch(() => {});
    await db.delete(organizations).where(eq(organizations.id, orgAId)).catch(() => {});
  }
  if (orgBId) {
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgBId)).catch(() => {});
    await db.delete(organizations).where(eq(organizations.id, orgBId)).catch(() => {});
  }
});

describe("training records database integrity", () => {
  it("skips gracefully when DATABASE_URL is unavailable", () => {
    if (!process.env.DATABASE_URL) return;
    expect(db).toBeTruthy();
  });

  it("preserves a legacy singular course assignment for organization reporting", async () => {
    if (!db) return;
    const sessionKey = crypto.randomUUID();
    const caller = appRouter.createCaller(makeCtx(OPERATOR));
    await caller.training.start({ sessionKey, courseKey: "class1-water", activityType: "quiz" });
    const [row] = await db.select().from(learningActivitySessions)
      .where(eq(learningActivitySessions.sessionKey, sessionKey)).limit(1);
    expect(row.orgId).toBe(orgAId);
    expect(row.organizationMemberId).not.toBeNull();
  });

  it("fails closed when a legacy organization seat has no course assignment", async () => {
    if (!db) return;
    const sessionKey = crypto.randomUUID();
    const caller = appRouter.createCaller(makeCtx(LEGACY_UNASSIGNED_OPERATOR));
    await caller.training.start({ sessionKey, courseKey: "class1-water", activityType: "quiz" });
    const [row] = await db.select().from(learningActivitySessions)
      .where(eq(learningActivitySessions.sessionKey, sessionKey)).limit(1);
    expect(row.orgId).toBeNull();
    expect(row.organizationMemberId).toBeNull();
  });

  it("shows assigned annual and Course Pass operators even when they have no activity", async () => {
    if (!db) return;
    const result = await appRouter.createCaller(makeCtx(MANAGER_A)).training.managerSummary({
      from: new Date(Date.now() - 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    expect(result.operators).toEqual(expect.arrayContaining([
      expect.objectContaining({ operatorEmail: ZERO_ACTIVITY_OPERATOR, courseKey: "class1-water", activeSeconds: 0, hasActivity: false }),
      expect.objectContaining({ operatorEmail: COURSE_PASS_ZERO_ACTIVITY_OPERATOR, courseKey: "class1-water", activeSeconds: 0, hasActivity: false }),
    ]));
    expect(result.unassignedOperatorCount).toBeGreaterThanOrEqual(1);
  });

  it("expires stale heartbeats without crediting additional time", async () => {
    if (!db) return;
    const sessionKey = crypto.randomUUID();
    await db.insert(learningActivitySessions).values({
      sessionKey,
      studentEmail: OPERATOR,
      orgId: orgAId,
      courseKey: "class1-water",
      activityType: "flashcards",
      activeSeconds: 30,
      lastSequence: 1,
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000),
    });
    await expect(appRouter.createCaller(makeCtx(OPERATOR)).training.heartbeat({
      sessionKey,
      sequence: 2,
      activeSeconds: 30,
      unitsCompleted: 1,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const [row] = await db.select().from(learningActivitySessions)
      .where(eq(learningActivitySessions.sessionKey, sessionKey)).limit(1);
    expect(row.status).toBe("abandoned");
    expect(row.activeSeconds).toBe(30);
    await db.delete(learningActivitySessions).where(eq(learningActivitySessions.sessionKey, sessionKey));
  });

  it("freezes the signed snapshot and denies managers from another organization", async () => {
    if (!db) return;
    const periodStart = new Date(Date.now() - 60 * 60 * 1000);
    const periodEnd = new Date(Date.now() + 60 * 60 * 1000);
    const firstSessionKey = crypto.randomUUID();
    await db.insert(learningActivitySessions).values({
      sessionKey: firstSessionKey,
      studentEmail: OPERATOR,
      orgId: orgAId,
      courseKey: "class1-water",
      activityType: "process_guide",
      topic: "Disinfection",
      activeSeconds: 3600,
      status: "completed",
      completedAt: new Date(),
    });
    const signed = await appRouter.createCaller(makeCtx(MANAGER_A)).training.attest({
      operatorEmail: OPERATOR,
      courseKey: "class1-water",
      from: periodStart,
      to: periodEnd,
      providerName: "Echelon Institute",
      instructorName: "Echelon Institute",
      instructorContact: "support@echeloninstitute.ca",
      learningObjectives: "Build job-related Class 1 operator knowledge through structured online study.",
      signedByName: "Training Manager",
      signedRole: "Operations Manager",
      signerAuthority: "manager_acknowledgement",
      structuredAndJobRelatedConfirmed: true,
      confirmed: true,
    });
    await db.insert(learningActivitySessions).values({
      sessionKey: crypto.randomUUID(),
      studentEmail: OPERATOR,
      orgId: orgAId,
      courseKey: "class1-water",
      activityType: "ai_tutor",
      topic: "Later activity",
      activeSeconds: 900,
      status: "completed",
      completedAt: new Date(),
    });

    const immutable = await appRouter.createCaller(makeCtx(OPERATOR)).training.attestedReport({ reportId: signed.reportId });
    expect(immutable.snapshot.sessions.map((session) => session.sessionKey)).toContain(firstSessionKey);
    expect(immutable.snapshot.sessions).toHaveLength(1);
    expect(immutable.snapshot.summary.activeSeconds).toBe(3600);
    expect(immutable.snapshot.attestationKind).toBe("manager_acknowledgement");

    await expect(appRouter.createCaller(makeCtx(MANAGER_B)).training.attestedReport({ reportId: signed.reportId }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
