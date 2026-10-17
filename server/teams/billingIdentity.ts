import { eq } from "drizzle-orm";
import { organizations } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";
import { getDb } from "../db";

/**
 * OTP eligibility for an existing billing owner, not paid-content entitlement.
 * Mirrors billing recovery's completed-customer guard without changing current
 * manager selection or granting learner access to an expired organization.
 */
export async function hasRecoverableTeamBilling(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({
    status: organizations.status,
    stripeCustomerId: organizations.stripeCustomerId,
  }).from(organizations).where(eq(organizations.managerEmail, normalized));
  return rows.some(row => !!row.stripeCustomerId && row.status !== "pending");
}
