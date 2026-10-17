import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { purchases, subscriptions, organizationMembers, organizations, teamFlexLicences } from "../drizzle/schema";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./stripe/stripe", () => ({ stripe: {} }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./analytics", () => ({ hashAnalyticsAnonymousId: vi.fn(), trackEvent: vi.fn() }));
import { getDb } from "./db";
import { stripeRouter } from "./routers/stripeRouter";

const future = new Date(Date.now() + 86_400_000);
let orgStatus: string;
let termEnd: Date;
let memberStatus: string;
let includePersonal: boolean;
let seatPredicate: unknown[];
beforeEach(() => {
  orgStatus = "active";
  termEnd = future;
  memberStatus = "assigned";
  includePersonal = false;
  seatPredicate = [];
  vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: (table: unknown) => {
    const where = async () => {
      if (table === subscriptions) return [
        { tier: "class1", province: "ontario", status: "active", currentPeriodEnd: future, orgId: 701 },
        ...(includePersonal ? [{ tier: "class2", province: "western", status: "active", currentPeriodEnd: future, orgId: null }] : []),
      ];
      if (table === purchases || table === organizations || table === teamFlexLicences) return [];
      throw new Error("Unexpected mocked table");
    };
    return { where, innerJoin: () => ({ where: async (condition: any) => {
      expect(table).toBe(organizationMembers);
      seatPredicate = new MySqlDialect().sqlToQuery(condition).params;
      return memberStatus === "assigned" && termEnd > new Date() ? [{
        courseKey: "class1-water", courseKeys: null, orgProvince: "ontario", orgTier: "stream-water", orgStatus, orgTermEnd: termEnd,
      }] : [];
    } }) };
  } }) } as any);
});
function caller() {
  return stripeRouter.createCaller({ user: null, studentEmail: "annual-operator@example.test", req: { headers: {} }, res: { cookie: vi.fn() } } as unknown as TrpcContext);
}
describe("Annual common-resolver checkAccess boundary", () => {
  it("grants the assigned course but not a same-class course in another stream", async () => {
    expect(await caller().checkAccess({ examType: "class1-water" })).toMatchObject({ hasAccess: true });
    expect(await caller().checkAccess({ examType: "class1-ww" })).toMatchObject({ hasAccess: false });
    expect(seatPredicate.slice(0, 2)).toEqual(["annual-operator@example.test", "assigned"]);
    expect(seatPredicate[2]).toMatch(/^\d{4}-\d{2}-\d{2} /);
  });
  it.each(["cancelled", "revoked"])("denies an org-backed subscription for a %s organization", async status => {
    orgStatus = status;
    expect(await caller().checkAccess({ examType: "class1-water" })).toMatchObject({ hasAccess: false });
  });
  it("denies an expired organization even if its subscription row is still active", async () => {
    termEnd = new Date(0);
    expect(await caller().checkAccess({ examType: "class1-water" })).toMatchObject({ hasAccess: false });
  });
  it("denies a revoked membership even if its subscription row is still active", async () => {
    memberStatus = "revoked";
    expect(await caller().checkAccess({ examType: "class1-water" })).toMatchObject({ hasAccess: false });
  });
  it("keeps an independent active personal subscription after organization expiry", async () => {
    termEnd = new Date(0);
    includePersonal = true;
    expect(await caller().checkAccess({ examType: "wpi-class2-water" })).toMatchObject({ hasAccess: true });
    expect(await caller().checkAccess({ examType: "class1-water" })).toMatchObject({ hasAccess: false });
  });
});
