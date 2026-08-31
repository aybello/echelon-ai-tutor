import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { organizationMembers, organizations, teamFlexLicences } from "../drizzle/schema";

const { sendCoursePassInvitationEmail } = vi.hoisted(() => ({
  sendCoursePassInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./email", () => ({ sendCoursePassInvitationEmail }));

function makeCtx(studentEmail: string): TrpcContext {
  return {
    user: null,
    studentEmail,
    req: { protocol: "https", headers: {}, cookies: {} } as any,
    res: { clearCookie: () => {}, cookie: () => {} } as any,
  };
}

const RUN_ID = Date.now().toString(36);
const MANAGER = `course-pass-manager-${RUN_ID}@echelon-test.invalid`;
const OPERATOR = `course-pass-operator-${RUN_ID}@echelon-test.invalid`;
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let orgId = 0;
let licenceId = 0;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  const connection = await getDb();
  if (!connection) return;
  db = connection;

  const now = new Date();
  const [org] = await db.insert(organizations).values({
    name: `Course Pass Lifecycle Test ${RUN_ID}`,
    province: "ontario",
    tier: "all-access",
    seatsTotal: 0,
    managerEmail: MANAGER,
    termStart: now,
    termEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    billingType: "invoice",
    status: "active",
  });
  orgId = Number((org as any).insertId);

  await db.insert(organizationMembers).values({
    orgId,
    email: MANAGER,
    role: "manager",
    status: "assigned",
  });

  const [licence] = await db.insert(teamFlexLicences).values({
    orderItemId: 9_900_000,
    organizationId: orgId,
    courseKey: "class4-wastewater",
    termMonths: 6,
    status: "unused",
    activationDeadline: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
  });
  licenceId = Number((licence as any).insertId);
});

afterAll(async () => {
  if (!db || !orgId) return;
  await db.delete(teamFlexLicences).where(eq(teamFlexLicences.organizationId, orgId)).catch(() => {});
  await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgId)).catch(() => {});
  await db.delete(organizations).where(eq(organizations.id, orgId)).catch(() => {});
});

describe("Team Flex Course Pass lifecycle", () => {
  it("skips gracefully when the database is unavailable", () => {
    if (!process.env.DATABASE_URL) return;
    expect(db).toBeTruthy();
  });

  it("takes a paid unused Course Pass from manager preview through invitation, claim, activation, and operator access", async () => {
    if (!db) return;
    const manager = appRouter.createCaller(makeCtx(MANAGER));
    const operator = appRouter.createCaller(makeCtx(OPERATOR));

    const initialInventory = await manager.teamFlex.listLicences({ orgId });
    expect(initialInventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: licenceId, courseKey: "class4-wastewater", status: "unused" }),
    ]));

    await expect(manager.teamFlex.inviteLicence({ licenceId, operatorEmail: OPERATOR, orgId }))
      .resolves.toEqual({ invitationSent: true });
    expect(sendCoursePassInvitationEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: OPERATOR,
      courseName: expect.any(String),
      termMonths: 6,
      claimUrl: expect.stringContaining("/course-pass/claim?token="),
    }));

    const invitationPayload = sendCoursePassInvitationEmail.mock.calls[0]?.[0];
    const token = new URL(invitationPayload.claimUrl).searchParams.get("token");
    expect(token).toMatch(/^[a-f0-9]{64}$/i);

    const invitation = await operator.teamFlex.getInvitation({ token: token! });
    expect(invitation).toMatchObject({ licenceId, courseKey: "class4-wastewater", termMonths: 6 });

    await expect(operator.teamFlex.claimInvitation({ token: token! }))
      .resolves.toMatchObject({ licenceId, courseKey: "class4-wastewater" });

    const afterClaim = await operator.teamFlex.myLicences();
    expect(afterClaim).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: licenceId, status: "assigned", invitedEmail: OPERATOR }),
    ]));

    const activated = await operator.teamFlex.activateLicence({ licenceId });
    expect(activated).toMatchObject({ licenceId, courseKey: "class4-wastewater" });
    expect(activated.accessEndsAt.getTime()).toBeGreaterThan(activated.startsAt.getTime());
    expect(activated.reportingEndsAt.getTime()).toBeGreaterThan(activated.accessEndsAt.getTime());

    const finalOperatorAccess = await operator.teamFlex.myLicences();
    expect(finalOperatorAccess).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: licenceId, status: "active", courseKey: "class4-wastewater" }),
    ]));
    const finalManagerInventory = await manager.teamFlex.listLicences({ orgId });
    expect(finalManagerInventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: licenceId, status: "active", invitedEmail: OPERATOR }),
    ]));
  });
});
