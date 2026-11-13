import { and, eq } from "drizzle-orm";
import { examDates, purchaseReadColumns, purchases } from "../drizzle/schema";
import { isSyntheticCustomerEmail } from "../shared/revenueReporting";
import { normalizeExamDateKey, parseExamCalendarDate, upsertExamDate } from "./examDateRecords";
import type { Database } from "./stripe/eventLedger";

/**
 * Capturing the exam date at the moment of purchase.
 *
 * The reminder engine sends study emails 30, 14, 7 and 1 day before an exam,
 * but it can only reach learners who have an exam date on file. Before this,
 * the only way to set one was to find the tracker inside the dashboard, so
 * 20 of 26 recent paying learners had no date and never received a reminder.
 *
 * The buyer's Stripe checkout session id is a secret only they hold (it lives
 * in their own success page URL), the same trust the referral question on that
 * page already relies on. It is enough to prove which purchase this is, so the
 * learner does not need to be signed in yet.
 *
 * An existing date is never overwritten from here. Changing a date that is
 * already on file requires the verified sign-in path in the dashboard.
 */

/** Furthest ahead an exam date is accepted. Operators book exams months out. */
export const MAX_EXAM_DATE_DAYS_AHEAD = 730;

export type PurchaseExamDateResult =
  | { status: "saved"; examDate: string; productKey: string }
  | { status: "already_set"; examDate: string }
  | { status: "invalid_date"; reason: string }
  | { status: "purchase_not_found" };

/**
 * Validates a calendar date for a new exam. Today is allowed so a learner
 * sitting an exam this week is not rejected. A one day tolerance absorbs the
 * gap between the learner's local date and the server's UTC date.
 */
export function validateNewExamDate(
  value: string,
  now: Date = new Date()
): { ok: true; date: string } | { ok: false; reason: string } {
  let parsed: Date;
  try {
    parsed = parseExamCalendarDate(value);
  } catch {
    return { ok: false, reason: "Enter a valid exam date." };
  }
  const dayMs = 24 * 60 * 60 * 1000;
  // Exam dates are stored at UTC noon, so compare whole calendar days rather
  // than instants. Otherwise an Ontario learner entering today's date late in
  // the evening, when UTC is already tomorrow, could be rejected.
  const startOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const earliest = startOfTodayUtc - dayMs;
  const latest = startOfTodayUtc + MAX_EXAM_DATE_DAYS_AHEAD * dayMs + dayMs;
  const parsedDay = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  if (parsedDay < earliest) return { ok: false, reason: "That date has already passed." };
  if (parsedDay > latest) return { ok: false, reason: "That date is too far away." };
  return { ok: true, date: value };
}

export async function savePurchaseExamDate(
  db: Database,
  input: { sessionId: string; examDate: string },
  now: Date = new Date()
): Promise<PurchaseExamDateResult> {
  const checked = validateNewExamDate(input.examDate, now);
  if (!checked.ok) return { status: "invalid_date", reason: checked.reason };

  const rows = await db
    .select(purchaseReadColumns)
    .from(purchases)
    .where(eq(purchases.stripeSessionId, input.sessionId))
    .limit(1);
  const purchase = rows[0];
  // Only a real, active purchase may create a reminder record.
  if (!purchase || purchase.status !== "active" || purchase.refundedAt || isSyntheticCustomerEmail(purchase.email)) {
    return { status: "purchase_not_found" };
  }

  let key: { email: string; productKey: string };
  try {
    key = normalizeExamDateKey(purchase.email, purchase.productKey);
  } catch {
    // A product with no exam course (for example a bundle) has nothing to remind about.
    return { status: "purchase_not_found" };
  }

  const existing = await db
    .select()
    .from(examDates)
    .where(and(eq(examDates.email, key.email), eq(examDates.productKey, key.productKey)))
    .limit(1);
  if (existing.length) {
    return { status: "already_set", examDate: existing[0].examDate.toISOString().slice(0, 10) };
  }

  await upsertExamDate(db, { ...key, date: checked.date, orgId: null, organizationMemberId: null });
  return { status: "saved", examDate: checked.date, productKey: key.productKey };
}
