import { getDb } from "../db";
import { purchases, subscriptions } from "../../drizzle/schema";
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

/**
 * Lightweight email-only entitlement check for unauthenticated subscription customers.
 * Checks both subscriptions AND one-time purchases by email.
 */
export async function resolveAccessByEmail(
  email: string | null | undefined,
  examType: string,
): Promise<{ hasAccess: boolean }> {
  const normalised = normalizeEmail(email);
  if (!normalised) return { hasAccess: false };
  const db = await getDb();
  if (!db) return { hasAccess: false };

  // Check one-time purchases
  const purchaseRows = await db
    .select({ productKey: purchases.productKey, status: purchases.status })
    .from(purchases)
    .where(eq(purchases.email, normalised));
  const activeKeys = purchaseRows
    .filter((r) => !r.status || r.status === "active")
    .map((r) => r.productKey);
  if (getAllUnlockedExamTypes(activeKeys).includes(examType)) {
    return { hasAccess: true };
  }

  // Check active subscriptions
  const now = new Date();
  const subRows = await db
    .select({ tier: subscriptions.tier, province: subscriptions.province })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.email, normalised),
        eq(subscriptions.status, "active"),
        gt(subscriptions.currentPeriodEnd, now),
      ),
    );
  if (subRows.length === 0) return { hasAccess: false };
  const unlocked = getAllSubscriptionExamTypes(
    subRows.map((r) => ({
      tier: r.tier as SubscriptionTier,
      province: r.province as SubscriptionProvince,
    })),
  );
  return { hasAccess: unlocked.includes(examType) };
}

export async function resolveAccess(
  user: User | null,
  examType: string,
): Promise<AccessResult> {
  if (!user) return { hasAccess: false, isOwner: false };

  // Owner always has full access
  if (user.openId && user.openId === ENV.ownerOpenId) {
    return { hasAccess: true, isOwner: true };
  }
  // Admin role has full access
  if (user.role === "admin") return { hasAccess: true, isOwner: false };

  const email = normalizeEmail(user.email);
  if (!email) return { hasAccess: false, isOwner: false };

  const db = await getDb();
  if (!db) return { hasAccess: false, isOwner: false };

  // One-time purchases (exclude refunded/disputed)
  const purchaseRows = await db
    .select({ productKey: purchases.productKey, status: purchases.status })
    .from(purchases)
    .where(eq(purchases.email, email));

  const activeKeys = purchaseRows
    .filter((r) => !r.status || r.status === "active")
    .map((r) => r.productKey);

  if (getAllUnlockedExamTypes(activeKeys).includes(examType)) {
    return { hasAccess: true, isOwner: false };
  }

  // Active subscriptions
  const now = new Date();
  const subRows = await db
    .select({ tier: subscriptions.tier, province: subscriptions.province })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.email, email),
        eq(subscriptions.status, "active"),
        gt(subscriptions.currentPeriodEnd, now),
      ),
    );

  const unlocked = getAllSubscriptionExamTypes(
    subRows.map((r) => ({
      tier: r.tier as SubscriptionTier,
      province: r.province as SubscriptionProvince,
    })),
  );

  return { hasAccess: unlocked.includes(examType), isOwner: false };
}
