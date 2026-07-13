/**
 * Regression tests for resolveEntitlementsByEmail — the central entitlement resolver.
 *
 * Covers:
 *   - Null/empty email → no access (fail closed)
 *   - DB unavailable → no access (fail closed)
 *   - Unknown product key → no access (fail closed)
 *   - Refunded / disputed purchase → no access
 *   - Null status purchase (legacy) → access granted
 *   - Cancelled subscription → no access
 *   - Active subscription → correct exam types unlocked
 *   - past_due subscription → access granted (grace period)
 *   - Unknown tier/province → no access (fail closed, no throw)
 *   - Multiple entitlements → deduplicated union
 *   - Manager with active org → isManager=true, hasAnyAccess=true
 *   - Manager with cancelled org → no access
 *   - Email normalisation (whitespace + uppercase)
 *   - Ontario distribution/collection via subscription
 *   - Ontario distribution via direct purchase
 *   - WPI collection via western subscription
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb before importing access ──────────────────────────────────────
vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { resolveEntitlementsByEmail } from "./access";

// ── Types ────────────────────────────────────────────────────────────────────

type PurchaseRow = { productKey: string; status: string | null };
type SubRow = {
  tier: string;
  province: string;
  status: string;
  currentPeriodEnd: Date;
  orgId: number | null;
};
type OrgRow = { id: number; status: string };

// ── Dates ────────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

// ── DB mock factory ──────────────────────────────────────────────────────────
//
// The resolver makes exactly 3 sequential DB calls:
//   Call 1: purchases  — .select().from().where()  → returns PurchaseRow[]
//   Call 2: subscriptions — .select().from().where() → returns SubRow[]
//   Call 3: organizations — .select().from().where().limit(1) → returns OrgRow[]
//
// We track call order with a counter and return the right rows for each call.

function mockDb(
  purchaseRows: PurchaseRow[],
  subRows: SubRow[],
  orgRows: OrgRow[],
) {
  let call = 0;

  const makeWhere = () => ({
    where: () => {
      call++;
      if (call === 1) return Promise.resolve(purchaseRows);
      if (call === 2) return Promise.resolve(subRows);
      // call 3 — organizations — has an extra .limit(1) chained
      return { limit: () => Promise.resolve(orgRows) };
    },
  });

  const db = {
    select: () => ({ from: () => makeWhere() }),
  };

  vi.mocked(getDb).mockResolvedValue(db as any);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function purchase(productKey: string, status: string | null = null): PurchaseRow {
  return { productKey, status };
}

function sub(
  tier: string,
  province: string,
  status = "active",
  currentPeriodEnd = FUTURE,
): SubRow {
  return { tier, province, status, currentPeriodEnd, orgId: null };
}

function org(status = "active"): OrgRow {
  return { id: 1, status };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("resolveEntitlementsByEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Fail-closed edge cases ─────────────────────────────────────────────────

  it("returns no access for null email", async () => {
    const r = await resolveEntitlementsByEmail(null);
    expect(r.hasAnyAccess).toBe(false);
    expect(r.unlockedExamTypes).toHaveLength(0);
    expect(r.email).toBe("");
  });

  it("returns no access for blank email", async () => {
    const r = await resolveEntitlementsByEmail("   ");
    expect(r.hasAnyAccess).toBe(false);
  });

  it("returns no access when db is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.hasAnyAccess).toBe(false);
    expect(r.unlockedExamTypes).toHaveLength(0);
  });

  it("returns no access for unknown product key (fail closed)", async () => {
    mockDb([purchase("totally-unknown-product-key")], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toHaveLength(0);
    expect(r.hasAnyAccess).toBe(false);
  });

  // ── Purchase status filtering ──────────────────────────────────────────────

  it("grants access for purchase with null status (legacy active)", async () => {
    mockDb([purchase("class1-water", null)], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class1-water");
    expect(r.sources).toContain("purchase");
    expect(r.hasAnyAccess).toBe(true);
  });

  it("grants access for purchase with status=active", async () => {
    mockDb([purchase("class2-water", "active")], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class2-water");
  });

  it("denies access for refunded purchase", async () => {
    mockDb([purchase("class3-water", "refunded")], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).not.toContain("class3-water");
    expect(r.hasAnyAccess).toBe(false);
  });

  it("denies access for disputed purchase", async () => {
    mockDb([purchase("class4-water", "disputed")], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).not.toContain("class4-water");
    expect(r.hasAnyAccess).toBe(false);
  });

  // ── Subscription status filtering ─────────────────────────────────────────

  it("grants access for active Ontario subscription", async () => {
    mockDb([], [sub("class1", "ontario", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class1-water");
    expect(r.unlockedExamTypes).toContain("class1-ww");
    expect(r.sources).toContain("subscription");
  });

  it("grants access for past_due subscription (grace period)", async () => {
    mockDb([], [sub("class2", "ontario", "past_due", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class2-water");
    expect(r.hasAnyAccess).toBe(true);
  });

  it("denies access for cancelled subscription", async () => {
    mockDb([], [sub("class3", "ontario", "cancelled", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).not.toContain("class3-water");
    expect(r.hasAnyAccess).toBe(false);
  });

  it("does not throw for unknown tier (fail closed)", async () => {
    mockDb([], [sub("class99", "ontario", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    // class99 not in ONTARIO_BY_TIER → returns [] → no access
    expect(r.unlockedExamTypes).toHaveLength(0);
    expect(r.hasAnyAccess).toBe(false);
  });

  it("does not throw for unknown province (fail closed)", async () => {
    mockDb([], [sub("class1", "mars", "active", FUTURE)], []);
    // Should not throw — resolver catches per-row errors
    await expect(resolveEntitlementsByEmail("user@example.com")).resolves.toBeDefined();
  });

  // ── Western Canada subscriptions ───────────────────────────────────────────

  it("grants correct WPI exam types for western subscription", async () => {
    mockDb([], [sub("class2", "western", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("wpi-class2-water");
    expect(r.unlockedExamTypes).toContain("wpi-class2-wastewater");
    expect(r.unlockedExamTypes).toContain("wpi-class2-water-dist");
    expect(r.unlockedExamTypes).toContain("wpi-class2-water-coll");
  });

  // ── Multiple entitlements ──────────────────────────────────────────────────

  it("combines purchase and subscription without duplicates", async () => {
    mockDb(
      [purchase("class1-water", null)],
      [sub("class1", "ontario", "active", FUTURE)],
      [],
    );
    const r = await resolveEntitlementsByEmail("user@example.com");
    const count = r.unlockedExamTypes.filter(t => t === "class1-water").length;
    expect(count).toBe(1); // deduplicated
    expect(r.unlockedExamTypes).toContain("class1-ww"); // from subscription
    expect(r.sources).toContain("purchase");
    expect(r.sources).toContain("subscription");
  });

  // ── Manager access ─────────────────────────────────────────────────────────

  it("sets isManager=true and hasAnyAccess=true for active org manager", async () => {
    mockDb([], [], [org("active")]);
    const r = await resolveEntitlementsByEmail("manager@example.com");
    expect(r.isManager).toBe(true);
    expect(r.hasAnyAccess).toBe(true);
    expect(r.sources).toContain("org_manager");
    // Manager alone does NOT grant course exam types
    expect(r.unlockedExamTypes).toHaveLength(0);
  });

  it("sets isManager=true for past_due org", async () => {
    mockDb([], [], [org("past_due")]);
    const r = await resolveEntitlementsByEmail("manager@example.com");
    expect(r.isManager).toBe(true);
    expect(r.hasAnyAccess).toBe(true);
  });

  it("does not set isManager for cancelled org", async () => {
    mockDb([], [], [org("cancelled")]);
    const r = await resolveEntitlementsByEmail("manager@example.com");
    expect(r.isManager).toBe(false);
    expect(r.hasAnyAccess).toBe(false);
  });

  it("does not set isManager when no org row found", async () => {
    mockDb([], [], []);
    const r = await resolveEntitlementsByEmail("nobody@example.com");
    expect(r.isManager).toBe(false);
    expect(r.hasAnyAccess).toBe(false);
  });

  // ── Email normalisation ────────────────────────────────────────────────────

  it("normalises email to lowercase and trims whitespace", async () => {
    mockDb([purchase("class1-water", null)], [], []);
    const r = await resolveEntitlementsByEmail("  USER@EXAMPLE.COM  ");
    expect(r.email).toBe("user@example.com");
    expect(r.unlockedExamTypes).toContain("class1-water");
  });

  // ── Ontario distribution and collection courses ────────────────────────────

  it("grants Ontario distribution courses via class3 subscription", async () => {
    mockDb([], [sub("class3", "ontario", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class3-water-dist");
    expect(r.unlockedExamTypes).toContain("class3-wastewater-coll");
  });

  it("grants Ontario class4 distribution via class4 subscription", async () => {
    mockDb([], [sub("class4", "ontario", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class4-water-dist");
    expect(r.unlockedExamTypes).toContain("class4-wastewater-coll");
  });

  it("grants Ontario distribution via direct purchase", async () => {
    mockDb([purchase("class4-water-dist", null)], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("class4-water-dist");
    expect(r.purchasedProductKeys).toContain("class4-water-dist");
  });

  it("grants WPI collection courses via western class4 subscription", async () => {
    mockDb([], [sub("class4", "western", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("wpi-class4-water-coll");
    expect(r.unlockedExamTypes).toContain("wpi-class4-water-dist");
  });

  // ── All-access subscriptions ───────────────────────────────────────────────

  it("all-access Ontario unlocks all Ontario exam types", async () => {
    mockDb([], [sub("all-access", "ontario", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    // Spot-check a few from each class
    expect(r.unlockedExamTypes).toContain("oit");
    expect(r.unlockedExamTypes).toContain("class4-water");
    expect(r.unlockedExamTypes).toContain("class4-wastewater-coll");
    expect(r.unlockedExamTypes).toContain("wqa");
  });

  it("all-access western unlocks all WPI exam types", async () => {
    mockDb([], [sub("all-access", "western", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.unlockedExamTypes).toContain("wpi-class1-water");
    expect(r.unlockedExamTypes).toContain("wpi-class4-wastewater");
    expect(r.unlockedExamTypes).toContain("wpi-class4-water-coll");
    expect(r.unlockedExamTypes).toContain("wpi-class4-water-dist");
  });

  // ── purchasedProductKeys field ─────────────────────────────────────────────

  it("populates purchasedProductKeys from active purchases", async () => {
    mockDb(
      [purchase("class1-water", null), purchase("class2-ww", "active")],
      [],
      [],
    );
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.purchasedProductKeys).toContain("class1-water");
    expect(r.purchasedProductKeys).toContain("class2-ww");
  });

  it("excludes refunded keys from purchasedProductKeys", async () => {
    mockDb([purchase("class3-water", "refunded")], [], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.purchasedProductKeys).not.toContain("class3-water");
  });

  // ── activeSubscriptionRows field ──────────────────────────────────────────

  it("populates activeSubscriptionRows from eligible subscriptions", async () => {
    mockDb([], [sub("class2", "ontario", "active", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.activeSubscriptionRows).toHaveLength(1);
    expect(r.activeSubscriptionRows[0].tier).toBe("class2");
    expect(r.activeSubscriptionRows[0].province).toBe("ontario");
  });

  it("excludes cancelled rows from activeSubscriptionRows", async () => {
    mockDb([], [sub("class2", "ontario", "cancelled", FUTURE)], []);
    const r = await resolveEntitlementsByEmail("user@example.com");
    expect(r.activeSubscriptionRows).toHaveLength(0);
  });
});
