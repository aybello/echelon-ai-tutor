/**
 * org.teams.test.ts — Echelon for Teams feature tests
 *
 * Tests cover:
 *   1. Seat assignment grants working access via resolveAccess
 *   2. Seat revocation removes access
 *   3. Seat cap enforcement blocks over-assignment
 *   4. Bulk assignSeats respects seat cap
 *   5. Cross-org access denial (operator from org A cannot access org B)
 *   6. Re-assigning a previously revoked operator re-activates their access
 *   7. getOrgOverview returns correct seatsAssigned count
 *   8. listMembers returns correct operator status
 *
 * These tests use the live DATABASE_URL when available, otherwise skip gracefully.
 * They create isolated test data with unique emails/org names and clean up after.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { organizations, organizationMembers, subscriptions } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

// ── Prevent real emails from being sent during tests ─────────────────────────
// assignSeat fires sendTeamEnrollmentEmail as a side effect; mock it so tests
// never hit the live SMTP server or send notifications to the owner.
vi.mock("./email", () => ({
  sendTeamEnrollmentEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeOnboardingEmail: vi.fn().mockResolvedValue(undefined),
  sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCtx(studentEmail: string | null = null): TrpcContext {
  return {
    user: null,
    studentEmail,
    req: { protocol: "https", headers: {}, cookies: {} } as any,
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as any,
  };
}

/** Unique suffix to isolate test data */
const RUN_ID = Date.now().toString(36);

function testEmail(n: number) {
  return `teams-test-${RUN_ID}-${n}@echelon-test.invalid`;
}

const MANAGER_EMAIL = `teams-mgr-${RUN_ID}@echelon-test.invalid`;
const ORG_NAME = `Test Org ${RUN_ID}`;
const ORG_B_MANAGER = `teams-mgr-b-${RUN_ID}@echelon-test.invalid`;
const ORG_B_NAME = `Test Org B ${RUN_ID}`;
const MULTI_MANAGER_EMAIL = `teams-mgr-mc-${RUN_ID}@echelon-test.invalid`;
const MULTI_ORG_NAME = `Test Org Multi ${RUN_ID}`;

let orgId: number;
let orgBId: number;
let multiOrgId: number;
let db: Awaited<ReturnType<typeof getDb>>;

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;

  db = await getDb();
  if (!db) return;

  const termEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // Create org A (3 seats)
  const [insertA] = await db.insert(organizations).values({
    name: ORG_NAME,
    province: "ontario",
    tier: "all-access",
    seatsTotal: 3,
    managerEmail: MANAGER_EMAIL,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    termEnd,
    billingType: "invoice",
    status: "active",
  });
  orgId = (insertA as any).insertId;

  // Create manager member row for org A
  await db.insert(organizationMembers).values({
    orgId,
    email: MANAGER_EMAIL,
    role: "manager",
    status: "assigned",
  });

  // Create org B (2 seats)
  const [insertB] = await db.insert(organizations).values({
    name: ORG_B_NAME,
    province: "ontario",
    tier: "all-access",
    seatsTotal: 2,
    managerEmail: ORG_B_MANAGER,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    termEnd,
    billingType: "invoice",
    status: "active",
  });
  orgBId = (insertB as any).insertId;

  await db.insert(organizationMembers).values({
    orgId: orgBId,
    email: ORG_B_MANAGER,
    role: "manager",
    status: "assigned",
  });

  // Create multi-course test org (10 seats)
  const [insertMC] = await db.insert(organizations).values({
    name: MULTI_ORG_NAME,
    province: "ontario",
    tier: "all-access",
    seatsTotal: 10,
    managerEmail: MULTI_MANAGER_EMAIL,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    termEnd,
    billingType: "invoice",
    status: "active",
  });
  multiOrgId = (insertMC as any).insertId;

  await db.insert(organizationMembers).values({
    orgId: multiOrgId,
    email: MULTI_MANAGER_EMAIL,
    role: "manager",
    status: "assigned",
  });
});

afterAll(async () => {
  if (!db) return;

  // Clean up all test data
  const allTestEmails = [
    MANAGER_EMAIL,
    ORG_B_MANAGER,
    MULTI_MANAGER_EMAIL,
    ...Array.from({ length: 15 }, (_, i) => testEmail(i + 1)),
  ];

  // Delete subscriptions for test emails
  for (const email of allTestEmails) {
    await db.delete(subscriptions).where(eq(subscriptions.email, email)).catch(() => {});
  }

  // Delete org members
  if (orgId) {
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgId)).catch(() => {});
    await db.delete(organizations).where(eq(organizations.id, orgId)).catch(() => {});
  }
  if (orgBId) {
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgBId)).catch(() => {});
    await db.delete(organizations).where(eq(organizations.id, orgBId)).catch(() => {});
  }
  if (multiOrgId) {
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, multiOrgId)).catch(() => {});
    await db.delete(organizations).where(eq(organizations.id, multiOrgId)).catch(() => {});
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Echelon for Teams — org seat management", () => {
  it("skips all tests gracefully when DATABASE_URL is not set", async () => {
    if (!process.env.DATABASE_URL) {
      console.warn("[teams test] DATABASE_URL not set — skipping");
      return;
    }
    expect(db).toBeTruthy();
  });

  it("getOrgOverview returns org name and seat counts for the manager", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));
    const overview = await caller.org.getOrgOverview();

    expect(overview.orgName).toBe(ORG_NAME);
    expect(overview.seatsTotal).toBe(3);
    expect(overview.seatsAssigned).toBe(0);
  });

  it("assignSeat grants access to an operator (subscription row created)", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const op1 = testEmail(1);
    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));

    const result = await caller.org.assignSeat({ email: op1 });
    expect(result.success).toBe(true);
    expect(result.email).toBe(op1);

    // Verify subscription row was created
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.email, op1), eq(subscriptions.orgId, orgId)));
    expect(subs.length).toBe(1);
    expect(subs[0].status).toBe("active");
    expect(subs[0].tier).toBe("all-access");

    // Verify member row was created
    const members = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, op1)));
    expect(members.length).toBe(1);
    expect(members[0].status).toBe("assigned");
    expect(members[0].role).toBe("operator");
  });

  it("getOrgOverview reflects the newly assigned seat", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));
    const overview = await caller.org.getOrgOverview();

    expect(overview.seatsAssigned).toBe(1);
  });

  it("revokeSeat removes access (subscription expired, member revoked)", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const op1 = testEmail(1);
    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));

    const result = await caller.org.revokeSeat({ email: op1 });
    expect(result.success).toBe(true);

    // Verify subscription is expired
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.email, op1), eq(subscriptions.orgId, orgId)));
    expect(subs[0].status).toBe("expired");

    // Verify member is revoked
    const members = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, op1)));
    expect(members[0].status).toBe("revoked");
    expect(members[0].revokedAt).toBeTruthy();
  });

  it("re-assigning a previously revoked operator re-activates their access", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const op1 = testEmail(1);
    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));

    // Re-assign op1 (was revoked in previous test)
    const result = await caller.org.assignSeat({ email: op1 });
    expect(result.success).toBe(true);

    // Verify subscription is active again
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.email, op1), eq(subscriptions.orgId, orgId)));
    expect(subs[0].status).toBe("active");

    // Verify member is assigned again
    const members = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, op1)));
    expect(members[0].status).toBe("assigned");
  });

  it("seat cap enforcement: blocks assignment when all seats are taken", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const op2 = testEmail(2);
    const op3 = testEmail(3);
    const op4 = testEmail(4); // This one should fail — only 3 seats, op1 is already assigned

    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));

    // Assign op2 and op3 (should succeed — 2 seats remaining)
    await caller.org.assignSeat({ email: op2 });
    await caller.org.assignSeat({ email: op3 });

    // Now all 3 seats are taken (op1, op2, op3)
    const overview = await caller.org.getOrgOverview();
    expect(overview.seatsAssigned).toBe(3);

    // Attempt to assign op4 — should throw BAD_REQUEST
    await expect(caller.org.assignSeat({ email: op4 })).rejects.toThrow(/Seat limit reached/);
  });

  it("bulk assignSeats respects seat cap and returns per-email results", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    // Revoke op2 and op3 to free up seats for this test
    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));
    await caller.org.revokeSeat({ email: testEmail(2) });
    await caller.org.revokeSeat({ email: testEmail(3) });

    // Now 1 seat taken (op1), 2 available
    // Try to bulk-assign 3 new operators — should fail (only 2 available)
    const op5 = testEmail(5);
    const op6 = testEmail(6);
    const op7 = testEmail(7);

    await expect(
      caller.org.assignSeats({ emails: [op5, op6, op7] }),
    ).rejects.toThrow(/Not enough seats/);

    // Assign exactly 2 — should succeed
    const result = await caller.org.assignSeats({ emails: [op5, op6] });
    expect(result.results.filter(r => r.success).length).toBe(2);
    expect(result.results.filter(r => !r.success).length).toBe(0);
  });

  it("cross-org access denial: manager from org B cannot see org A data", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    // Org B manager tries to list org A members
    const callerB = appRouter.createCaller(makeCtx(ORG_B_MANAGER));
    const membersB = await callerB.org.listMembers();

    // Should only see org B members (none assigned yet)
    expect(membersB.length).toBe(0);

    // Org A manager should see their own members
    const callerA = appRouter.createCaller(makeCtx(MANAGER_EMAIL));
    const membersA = await callerA.org.listMembers();

    // op1, op5, op6 should be assigned in org A
    const assignedEmails = membersA
      .filter(m => m.status === "assigned")
      .map(m => m.email);

    expect(assignedEmails).toContain(testEmail(1));
    expect(assignedEmails).toContain(testEmail(5));
    expect(assignedEmails).toContain(testEmail(6));

    // Org B manager should not see org A operators
    const orgBEmails = membersB.map(m => m.email);
    expect(orgBEmails).not.toContain(testEmail(1));
  });

  it("unauthorized user cannot access org procedures", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    // No session at all
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.org.getOrgOverview()).rejects.toThrow(/sign in|manager account/i);
  });

  it("non-manager email is rejected by requireOrgManager", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    // testEmail(1) is an operator, not a manager
    const caller = appRouter.createCaller(makeCtx(testEmail(1)));
    await expect(caller.org.getOrgOverview()).rejects.toThrow(/manager account/i);
  });

  it("listMembers returns correct operator status fields", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const caller = appRouter.createCaller(makeCtx(MANAGER_EMAIL));
    const members = await caller.org.listMembers();

    // Every member should have the expected fields
    for (const m of members) {
      expect(m).toHaveProperty("id");
      expect(m).toHaveProperty("email");
      expect(m).toHaveProperty("status");
      expect(m).toHaveProperty("assignedAt");
      expect(m).toHaveProperty("accuracy");
      expect(m).toHaveProperty("totalAttempts");
      expect(m).toHaveProperty("lastActive");
      expect(m).toHaveProperty("examDate");
      expect(m).toHaveProperty("operatorStatus");
      expect(["not_started", "behind", "needs_focus", "on_track"]).toContain(m.operatorStatus);
    }
  });
});

describe("Multi-course seat support", () => {
  it("assignSeat with courseKeys creates one subscription per course", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const email = testEmail(11);
    const caller = appRouter.createCaller(makeCtx(MULTI_MANAGER_EMAIL));

    await caller.org.assignSeat({
      email,
      courseKeys: ["class1-water", "class1-ww"],
    });

    // Verify two active subscription rows exist
    const subs = await db!
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.email, email), eq(subscriptions.status, "active")));

    expect(subs.length).toBe(2);

    // Verify member row has courseKeys JSON
    const member = await db!
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.email, email), eq(organizationMembers.orgId, multiOrgId)))
      .limit(1)
      .then(r => r[0]);

    expect(member).toBeDefined();
    const parsedKeys = JSON.parse(member!.courseKeys ?? "[]");
    expect(parsedKeys).toContain("class1-water");
    expect(parsedKeys).toContain("class1-ww");
    expect(member!.courseKey).toBe("class1-water"); // primary = first key
  });

  it("updateSeatCourse replaces subscriptions and updates courseKeys", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const email = testEmail(12);
    const caller = appRouter.createCaller(makeCtx(MULTI_MANAGER_EMAIL));

    // Assign with one course first
    await caller.org.assignSeat({ email, courseKeys: ["class1-water"] });

    // Update to two courses
    await caller.org.updateSeatCourse({ email, courseKeys: ["class2-water", "class2-wastewater"] });

    // Old subscription should be expired, two new ones active
    const subs = await db!
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.email, email), eq(subscriptions.orgId, multiOrgId)));

    const active = subs.filter(s => s.status === "active");
    const expired = subs.filter(s => s.status === "expired");
    expect(active.length).toBe(2);
    expect(expired.length).toBeGreaterThanOrEqual(1);

    // Verify courseKeys updated
    const member = await db!
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.email, email), eq(organizationMembers.orgId, multiOrgId)))
      .limit(1)
      .then(r => r[0]);

    const parsedKeys = JSON.parse(member!.courseKeys ?? "[]");
    expect(parsedKeys).toContain("class2-water");
    expect(parsedKeys).toContain("class2-wastewater");
    expect(parsedKeys).not.toContain("class1-water");
  });

  it("listMembers includes courseKeys and courseProgress fields", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const caller = appRouter.createCaller(makeCtx(MULTI_MANAGER_EMAIL));
    const members = await caller.org.listMembers();

    for (const m of members) {
      expect(m).toHaveProperty("courseKeys");
      expect(m).toHaveProperty("courseProgress");
      // courseProgress must be an array
      expect(Array.isArray(m.courseProgress)).toBe(true);
    }
  });

  it("revoking a multi-course operator expires all subscription rows", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    const email = testEmail(13);
    const caller = appRouter.createCaller(makeCtx(MULTI_MANAGER_EMAIL));

    await caller.org.assignSeat({ email, courseKeys: ["class1-water", "class1-ww"] });
    await caller.org.revokeSeat({ email });

    const subs = await db!
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.email, email), eq(subscriptions.orgId, multiOrgId)));

    const active = subs.filter(s => s.status === "active");
    expect(active.length).toBe(0);
    expect(subs.every(s => s.status === "expired")).toBe(true);
  });

  it("assignSeat with courseKeys uses seat cap counting by operator not by course", async () => {
    if (!process.env.DATABASE_URL || !db) return;

    // multiOrgId has 10 seats — assigning one operator with 2 courses should use only 1 seat
    const email = testEmail(14);
    const caller = appRouter.createCaller(makeCtx(MULTI_MANAGER_EMAIL));

    await expect(
      caller.org.assignSeat({ email, courseKeys: ["class1-water", "class1-ww"] })
    ).resolves.toMatchObject({ success: true });

    // Verify only 1 member row created (not 2)
    const memberRows = await db!
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.email, email),
        eq(organizationMembers.orgId, multiOrgId),
        eq(organizationMembers.role, "operator"),
      ));
    expect(memberRows.length).toBe(1);
  });
});
