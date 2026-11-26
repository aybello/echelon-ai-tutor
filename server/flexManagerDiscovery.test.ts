import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { organizations, organizationMembers, purchases, subscriptions, teamFlexLicences } from "../drizzle/schema";
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import { resolveEntitlementsByEmail } from "./_core/access";

const now = new Date();
const past = new Date(now.getTime() - 86_400_000);
const future = new Date(now.getTime() + 86_400_000);
let status: string;
let licence: { status: string; activationDeadline: Date; accessEndsAt: Date | null; reportingEndsAt: Date | null };
let inventoryReads: number;
beforeEach(() => {
  status = "active";
  inventoryReads = 0;
  licence = { status: "expired", activationDeadline: past, accessEndsAt: past, reportingEndsAt: future };
  vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: (table: unknown) => {
    const where = async (condition: any) => {
      if (table === purchases || table === subscriptions) return [];
      if (table === organizations) return [{ id: 701, status, termEnd: past, createdAt: past }];
      if (table === teamFlexLicences) {
        const params = new MySqlDialect().sqlToQuery(condition).params;
        if (params[0] === "manager@echelon.test") return [];
        expect(params).toEqual([701]);
        inventoryReads++;
        return [licence];
      }
      throw new Error("Unexpected table");
    };
    return { where, innerJoin: () => ({ where: async () => {
      expect(table).toBe(organizationMembers);
      return [];
    } }) };
  } }) } as any);
});

describe("paid Flex manager discovery does not grant learner entitlement", () => {
  it("recognizes a reporting-only manager after the organization term ends", async () => {
    const result = await resolveEntitlementsByEmail("manager@echelon.test");
    expect(result.isManager).toBe(true);
    expect(result.hasAnyAccess).toBe(true);
    expect(result.unlockedExamTypes).toEqual([]);
    expect(result.activeSubscriptionRows).toEqual([]);
    expect(inventoryReads).toBe(1);
  });
  it("recognizes unactivated paid inventory before its existing activation deadline", async () => {
    licence = { status: "unused", activationDeadline: future, accessEndsAt: null, reportingEndsAt: null };
    const result = await resolveEntitlementsByEmail("manager@echelon.test");
    expect(result.isManager).toBe(true);
    expect(result.unlockedExamTypes).toEqual([]);
  });
  it.each(["cancelled", "pending", "revoked", "checkout_failed"])("does not revive a %s organization", async value => {
    status = value;
    const result = await resolveEntitlementsByEmail("manager@echelon.test");
    expect(result.isManager).toBe(false);
    expect(result.unlockedExamTypes).toEqual([]);
    expect(inventoryReads).toBe(0);
  });
  it.each(["revoked", "suspended", "refunded"])("does not use %s inventory to restore manager access", async value => {
    licence.status = value;
    expect((await resolveEntitlementsByEmail("manager@echelon.test")).isManager).toBe(false);
  });
  it("ends discovery when the existing reporting window closes", async () => {
    licence.reportingEndsAt = past;
    expect((await resolveEntitlementsByEmail("manager@echelon.test")).isManager).toBe(false);
  });
});
