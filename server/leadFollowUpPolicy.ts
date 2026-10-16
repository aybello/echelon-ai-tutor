import { and, eq, gt, or, sql } from "drizzle-orm";
import { abandonedCheckouts, organizations, purchases, subscriptions, teamFlexOrders, trialEmails } from "../drizzle/schema";
import type { Database } from "./stripe/eventLedger";

/** Historical buyers remain customers after a licence expires or is cancelled. */
export async function hasHistoricalPayment(db: Database, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const rows = await Promise.all([
    db.select({ id: purchases.id }).from(purchases).where(and(
      sql`LOWER(TRIM(${purchases.email})) = ${normalized}`, gt(purchases.amountCAD, 0),
      sql`${purchases.refundedAt} IS NULL`,
    )).limit(1),
    // Reconciliation can recover a verified Stripe subscription without its amount.
    // This conservative suppression is not a revenue calculation or an access grant.
    db.select({ id: subscriptions.id }).from(subscriptions).where(and(
      sql`LOWER(TRIM(${subscriptions.email})) = ${normalized}`,
      or(gt(subscriptions.amountCAD, 0), sql`${subscriptions.stripeSubscriptionId} IS NOT NULL`),
    )).limit(1),
    db.select({ id: teamFlexOrders.id }).from(teamFlexOrders).where(and(
      sql`LOWER(TRIM(${teamFlexOrders.managerEmail})) = ${normalized}`, eq(teamFlexOrders.status, "paid"),
    )).limit(1),
    db.select({ id: organizations.id }).from(organizations).where(and(
      sql`LOWER(TRIM(${organizations.managerEmail})) = ${normalized}`, eq(organizations.billingType, "stripe"),
      sql`${organizations.stripeSubscriptionId} IS NOT NULL`,
    )).limit(1),
  ]);
  return rows.some(row => row.length > 0);
}

export async function isFollowUpSuppressed(db: Database, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const rows = await Promise.all([
    db.select({ id: trialEmails.id }).from(trialEmails).where(and(
      sql`LOWER(TRIM(${trialEmails.email})) = ${normalized}`, eq(trialEmails.optOut, true),
    )).limit(1),
    db.select({ id: abandonedCheckouts.id }).from(abandonedCheckouts).where(and(
      sql`LOWER(TRIM(${abandonedCheckouts.email})) = ${normalized}`, eq(abandonedCheckouts.optOut, true),
    )).limit(1),
  ]);
  return rows.some(row => row.length > 0);
}

/** An unsubscribe applies across duplicate captures and both reminder sequences. */
export async function unsubscribeFollowUpEmail(db: Database, email: string) {
  const normalized = email.trim().toLowerCase();
  await db.transaction(async tx => {
    await tx.update(trialEmails).set({ optOut: true })
      .where(sql`LOWER(TRIM(${trialEmails.email})) = ${normalized}`);
    await tx.update(abandonedCheckouts).set({ optOut: true })
      .where(sql`LOWER(TRIM(${abandonedCheckouts.email})) = ${normalized}`);
  });
}
