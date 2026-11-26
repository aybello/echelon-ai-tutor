/**
 * Teams Flex Expiry Job
 * Runs periodically to:
 * 1. Expire active licences where NOW() > accessEndsAt
 * 2. Expire unused/invited/assigned licences where NOW() > activationDeadline
 */
import { and, eq, lte, inArray, sql } from "drizzle-orm";
import { getDb } from "../db";
import { teamFlexLicences } from "../../drizzle/schema";

export interface ExpiryJobResult {
  activeExpired: number;
  deadlineExpired: number;
}

export async function runFlexExpiryJob(): Promise<ExpiryJobResult> {
  const db = await getDb();
  if (!db) return { activeExpired: 0, deadlineExpired: 0 };

  const now = new Date();

  // 1. Expire active licences past their accessEndsAt
  const activeExpiredResult = await db.update(teamFlexLicences)
    .set({ status: "expired" })
    .where(and(
      eq(teamFlexLicences.status, "active"),
      lte(teamFlexLicences.accessEndsAt, now),
    ));

  // 2. Expire unused/invited/assigned licences past their activationDeadline
  const deadlineExpiredResult = await db.update(teamFlexLicences)
    .set({ status: "expired" })
    .where(and(
      inArray(teamFlexLicences.status, ["unused", "invited", "assigned"]),
      lte(teamFlexLicences.activationDeadline, now),
    ));

  const activeExpired = (activeExpiredResult as any)[0]?.affectedRows ?? 0;
  const deadlineExpired = (deadlineExpiredResult as any)[0]?.affectedRows ?? 0;

  if (activeExpired > 0 || deadlineExpired > 0) {
    console.log(`[Flex Expiry] Expired ${activeExpired} active licences, ${deadlineExpired} deadline-exceeded licences`);
  }

  return { activeExpired, deadlineExpired };
}
