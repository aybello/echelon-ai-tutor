import { getDb } from "../db";
import { purchases, subscriptions, organizations } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { getAllUnlockedExamTypes } from "../stripe/products";
import {
  getAllSubscriptionExamTypes,
  type SubscriptionTier,
  type SubscriptionProvince,
} from "../stripe/subscriptionProducts";
import { ENV } from "./env";

/** Number of questions a non-entitled user may access per bank (free funnel). */
export const FREE_TRIAL_LIMIT = 15;

/**
 * Exam types that are fully free — no purchase or subscription required.
 * OIT (Operator-in-Training) is the free funnel product.
 */
export const FREE_EXAM_TYPES = new Set(["oit", "oit-ww"]);

/** Canonical email form for storage AND comparison. */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Map a question bankKey to the product examType.
 * For most banks these are identical (e.g. "oit", "class1-ww").
 * Add overrides here if a bankKey differs from its product examType.
 */
const BANKKEY_EXAMTYPE_OVERRIDES: Record<string, string> = {
  "class1": "class1-water",
  "class1-wastewater": "class1-ww",
  "class2-wastewater": "class2-ww",
  "class3-wastewater": "class3-ww",
  "class4-wastewater": "class4-ww",
  "wpi-class1-wastewater-coll": "wpi-class1-water-coll",
  "wpi-class2-wastewater-coll": "wpi-class2-water-coll",
  "wpi-class3-wastewater-coll": "wpi-class3-water-coll",
  "wpi-class4-wastewater-coll": "wpi-class4-water-coll",
};

export function bankKeyToExamType(bankKey: string): string {
  return BANKKEY_EXAMTYPE_OVERRIDES[bankKey] ?? bankKey;
}

export type AccessResult = { hasAccess: boolean; isOwner: boolean };

// ---------------------------------------------------------------------------
// Entitlement source and result types
// ---------------------------------------------------------------------------

export type EntitlementSource =
  | "free"
  | "purchase"
  | "subscription"
  | "owner"
  | "admin"
  | "org_manager";

export type ResolvedEntitlements = {
  email: string;
  hasAnyAccess: boolean;
  unlockedExamTypes: string[];
  purchasedProductKeys: string[];
  activeSubscriptionRows: Array<{
    tier: string;
    province: string;
    status: string;
    currentPeriodEnd: Date;
    orgId: number | null;
  }>;
  isManager: boolean;
  sources: EntitlementSource[];
};

/**
 * Status sets for access decisions — fail closed by default.
 * Only these statuses count for access; all others (cancelled, expired, refunded, disputed) do not.
 */
const PURCHASE_ACCESS_STATUSES = new Set(["active"]);
const SUBSCRIPTION_ACCESS_STATUSES = new Set(["active", "past_due"]);
const ORG_ACCESS_STATUSES = new Set(["active", "past_due"]);

/**
 * Full entitlement resolver — single source of truth for who has access to what.
 *
 * Rules:
 * 1. Normalizes email; returns no-access for empty/null email.
 * 2. Active one-time purchases only (status missing/null or "active"; excludes refunded/disputed).
 * 3. Active subscriptions only (status "active" or "past_due" AND currentPeriodEnd > now).
 * 4. Unknown purchase product keys → unlock nothing (fail closed).
 * 5. Unknown subscription tier/province → unlock nothing (fail closed, caught per-row).
 * 6. Manager status alone does NOT grant course access unless backed by an active org seat/sub.
 * 7. All unlockedExamTypes are deduplicated.
 */
export async function resolveEntitlementsByEmail(
  email: string | null | undefined,
): Promise<ResolvedEntitlements> {
  const normalised = normalizeEmail(email);

  const empty: ResolvedEntitlements = {
    email: normalised,
    hasAnyAccess: false,
    unlockedExamTypes: [],
    purchasedProductKeys: [],
    activeSubscriptionRows: [],
    isManager: false,
    sources: [],
  };

  if (!normalised) return empty;

  const db = await getDb();
  if (!db) return empty;

  const sources: EntitlementSource[] = [];
  const now = new Date();

  // -------------------------------------------------------------------------
  // 1. One-time purchases
  // -------------------------------------------------------------------------
  const purchaseRows = await db
    .select({ productKey: purchases.productKey, status: purchases.status })
    .from(purchases)
    .where(eq(purchases.email, normalised));

  // Preserve historic behaviour: missing status counts as active
  const activePurchaseKeys = purchaseRows
    .filter((r) => !r.status || PURCHASE_ACCESS_STATUSES.has(r.status))
    .map((r) => r.productKey);

  let purchaseExamTypes: string[] = [];
  if (activePurchaseKeys.length > 0) {
    try {
      purchaseExamTypes = getAllUnlockedExamTypes(activePurchaseKeys);
      if (purchaseExamTypes.length > 0) sources.push("purchase");
    } catch (err) {
      console.warn("[resolveEntitlements] Purchase mapping error:", err);
      // fail closed — no access from this row
    }
  }

  // -------------------------------------------------------------------------
  // 2. Subscriptions (direct + org-managed seats)
  // -------------------------------------------------------------------------
  const subRows = await db
    .select({
      tier: subscriptions.tier,
      province: subscriptions.province,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      orgId: subscriptions.orgId,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.email, normalised),
        gt(subscriptions.currentPeriodEnd, now),
      ),
    );

  const eligibleSubRows = subRows.filter((r) =>
    SUBSCRIPTION_ACCESS_STATUSES.has(r.status ?? ""),
  );

  let subscriptionExamTypes: string[] = [];
  const activeSubscriptionRows: ResolvedEntitlements["activeSubscriptionRows"] = [];

  for (const row of eligibleSubRows) {
    try {
      const examTypes = getAllSubscriptionExamTypes([
        {
          tier: row.tier as SubscriptionTier,
          province: row.province as SubscriptionProvince,
        },
      ]);
      if (examTypes.length > 0) {
        subscriptionExamTypes = subscriptionExamTypes.concat(examTypes);
        activeSubscriptionRows.push({
          tier: row.tier,
          province: row.province,
          status: row.status ?? "active",
          currentPeriodEnd: row.currentPeriodEnd,
          orgId: row.orgId ?? null,
        });
      }
    } catch (err) {
      console.warn("[resolveEntitlements] Subscription mapping error for row:", row, err);
      // fail closed — skip this row
    }
  }

  if (subscriptionExamTypes.length > 0) sources.push("subscription");

  // -------------------------------------------------------------------------
  // 3. Manager check — does NOT grant course access by itself
  // -------------------------------------------------------------------------
  let isManager = false;
  try {
    const [orgRow] = await db
      .select({ id: organizations.id, status: organizations.status })
      .from(organizations)
      .where(eq(organizations.managerEmail, normalised))
      .limit(1);

    if (orgRow && ORG_ACCESS_STATUSES.has(orgRow.status ?? "active")) {
      isManager = true;
      sources.push("org_manager");
    }
  } catch (err) {
    console.warn("[resolveEntitlements] Manager check error:", err);
    // fail closed
  }

  // -------------------------------------------------------------------------
  // 4. Combine and deduplicate
  // -------------------------------------------------------------------------
  const allExamTypes = Array.from(
    new Set([...purchaseExamTypes, ...subscriptionExamTypes]),
  );

  return {
    email: normalised,
    hasAnyAccess: allExamTypes.length > 0 || isManager,
    unlockedExamTypes: allExamTypes,
    purchasedProductKeys: activePurchaseKeys,
    activeSubscriptionRows,
    isManager,
    sources,
  };
}

// ---------------------------------------------------------------------------
// Existing per-exam checks — now delegate to the shared resolver
// ---------------------------------------------------------------------------

/**
 * Lightweight email-only entitlement check for unauthenticated subscription customers.
 * Delegates to resolveEntitlementsByEmail for consistent logic.
 */
export async function resolveAccessByEmail(
  email: string | null | undefined,
  examType: string,
): Promise<{ hasAccess: boolean }> {
  // Free exam types are always accessible — no purchase required
  if (FREE_EXAM_TYPES.has(examType)) return { hasAccess: true };

  const entitlements = await resolveEntitlementsByEmail(email);
  return { hasAccess: entitlements.unlockedExamTypes.includes(examType) };
}

export async function resolveAccess(
  user: User | null,
  examType: string,
): Promise<AccessResult> {
  // Free exam types are always accessible — no purchase required
  if (FREE_EXAM_TYPES.has(examType)) return { hasAccess: true, isOwner: false };
  if (!user) return { hasAccess: false, isOwner: false };

  // Owner always has full access
  if (user.openId && user.openId === ENV.ownerOpenId) {
    return { hasAccess: true, isOwner: true };
  }
  // Admin role has full access
  if (user.role === "admin") return { hasAccess: true, isOwner: false };

  const entitlements = await resolveEntitlementsByEmail(user.email);
  return { hasAccess: entitlements.unlockedExamTypes.includes(examType), isOwner: false };
}
