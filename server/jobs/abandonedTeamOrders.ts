import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { organizations, teamFlexOrderItems, teamFlexOrders } from "../../drizzle/schema";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { sendAbandonedTeamOrderEmail } from "../abandonedTeamOrderEmail";

/**
 * Recovers team orders that reached Stripe Checkout and were never paid.
 *
 * Why this exists: a manager who configures licences, names their utility and
 * opens Stripe has already decided to buy. Live data showed nine team orders
 * created and only two paid. Every unpaid one belonged to a named manager at a
 * real municipal water utility, and nobody ever followed up. Those are the
 * highest-value leads the business has, worth multiples of an individual pass,
 * and they were silently discarded.
 *
 * An individual who abandons checkout may simply be browsing. A procurement
 * manager who abandons checkout is almost always blocked by something
 * mechanical: a purchase order is needed, a card is declined for a municipal
 * account, or approval must come from a supervisor. Those are all solvable by
 * a single human reply, which is why this reaches out rather than discounting.
 */

/** Wait this long before reaching out, so a slow payment is not interrupted. */
export const RECOVERY_DELAY_HOURS = 2;

/** Stop chasing after this long. Older than this is a cold lead, not a recovery. */
export const RECOVERY_WINDOW_DAYS = 14;

/** Never email the same order twice. */
export const RECOVERY_STATUS = "recovery_sent";

export interface RecoverableOrder {
  orderId: number;
  organizationId: number;
  organizationName: string;
  managerEmail: string;
  totalLicences: number;
  subtotalCents: number;
  courseKeys: string[];
  createdAt: Date;
}

/**
 * Addresses that must never receive recovery mail: internal testing, the
 * owner's own trials, and placeholder domains. Sending to these would be noise
 * at best and embarrassing at worst.
 */
const EXCLUDED_PATTERNS = [
  "@example.com",
  "@echelon.test",
  "@echeloninstitute.ca",
  "test@",
];

export function isContactableManager(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  if (!normalized.includes("@")) return false;
  return !EXCLUDED_PATTERNS.some(pattern => normalized.includes(pattern));
}

/**
 * A manager who already paid for the same course does not need chasing. This
 * is checked per manager rather than per order because a municipal buyer often
 * retries checkout several times before one attempt succeeds, leaving older
 * pending rows behind that were never real abandonment.
 */
export function shouldRecover(input: {
  managerEmail: string;
  paidOrderCourseKeys: readonly string[];
  orderCourseKeys: readonly string[];
}): boolean {
  if (!isContactableManager(input.managerEmail)) return false;
  const paid = new Set(input.paidOrderCourseKeys);
  // If every course on this order was already bought by the same manager, the
  // pending row is a retry artefact and not a lost sale.
  return input.orderCourseKeys.some(key => !paid.has(key));
}

export interface RecoveryResult {
  considered: number;
  contacted: number;
  skipped: number;
  errors: number;
}

export async function recoverAbandonedTeamOrders(options: { dryRun?: boolean } = {}): Promise<RecoveryResult> {
  const result: RecoveryResult = { considered: 0, contacted: 0, skipped: 0, errors: 0 };
  const db = await getDb();
  if (!db) return result;

  const now = Date.now();
  const notBefore = new Date(now - RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const notAfter = new Date(now - RECOVERY_DELAY_HOURS * 60 * 60 * 1000);

  const rows = await db
    .select({
      orderId: teamFlexOrders.id,
      organizationId: teamFlexOrders.organizationId,
      organizationName: organizations.name,
      managerEmail: teamFlexOrders.managerEmail,
      totalLicences: teamFlexOrders.totalLicences,
      subtotalCents: teamFlexOrders.subtotalCents,
      createdAt: teamFlexOrders.createdAt,
    })
    .from(teamFlexOrders)
    .innerJoin(organizations, eq(organizations.id, teamFlexOrders.organizationId))
    .where(
      and(
        eq(teamFlexOrders.status, "pending"),
        isNull(teamFlexOrders.paidAt),
        gte(teamFlexOrders.createdAt, notBefore),
        lte(teamFlexOrders.createdAt, notAfter),
      ),
    );

  result.considered = rows.length;
  if (rows.length === 0) return result;

  // Courses each manager has already paid for, so retries are not chased.
  const paidRows = await db
    .select({
      managerEmail: teamFlexOrders.managerEmail,
      courseKey: teamFlexOrderItems.courseKey,
    })
    .from(teamFlexOrders)
    .innerJoin(teamFlexOrderItems, eq(teamFlexOrderItems.orderId, teamFlexOrders.id))
    .where(eq(teamFlexOrders.status, "paid"));

  const paidByManager = new Map<string, string[]>();
  for (const row of paidRows) {
    const key = row.managerEmail.toLowerCase();
    paidByManager.set(key, [...(paidByManager.get(key) ?? []), row.courseKey]);
  }

  for (const row of rows) {
    try {
      const items = await db
        .select({ courseKey: teamFlexOrderItems.courseKey })
        .from(teamFlexOrderItems)
        .where(eq(teamFlexOrderItems.orderId, row.orderId));
      const courseKeys = items.map(item => item.courseKey);

      const eligible = shouldRecover({
        managerEmail: row.managerEmail,
        paidOrderCourseKeys: paidByManager.get(row.managerEmail.toLowerCase()) ?? [],
        orderCourseKeys: courseKeys,
      });

      if (!eligible) {
        result.skipped += 1;
        continue;
      }

      if (options.dryRun) {
        result.contacted += 1;
        continue;
      }

      await sendAbandonedTeamOrderEmail({
        managerEmail: row.managerEmail,
        organizationName: row.organizationName,
        totalLicences: row.totalLicences,
        subtotalCents: row.subtotalCents,
        courseNames: courseKeys.map(key => resolveCourseKey(key)?.displayName ?? key),
      });

      // Marked only after a successful send, so a delivery failure retries
      // next run rather than silently dropping the lead.
      await db
        .update(teamFlexOrders)
        .set({ status: RECOVERY_STATUS })
        .where(and(eq(teamFlexOrders.id, row.orderId), eq(teamFlexOrders.status, "pending")));

      result.contacted += 1;
    } catch (error) {
      result.errors += 1;
      console.error(`[team-recovery] order ${row.orderId} failed:`, error);
    }
  }

  return result;
}

/**
 * Counts organizations created by abandoned checkouts that never became real
 * customers. These inflate the organization list and make the same utility
 * look like six different employers.
 */
export async function countProvisionalOrganizations(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(organizations)
    .where(and(eq(organizations.billingType, "course-pass"), eq(organizations.status, "pending")));
  return Number(rows[0]?.n ?? 0);
}
