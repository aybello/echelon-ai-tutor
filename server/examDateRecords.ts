import { and, eq, sql } from "drizzle-orm";
import { examDates } from "../drizzle/schema";
import { resolveCourseKey } from "../shared/courseRegistry";
import type { Database } from "./stripe/eventLedger";

export const EXAM_REMINDER_INTERVALS = [30, 14, 7, 1] as const;

export function normalizeExamDateKey(email: string, productKey: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
    throw new Error("Invalid learner email");
  const course = resolveCourseKey(productKey.trim().toLowerCase());
  if (!course) throw new Error("Unknown exam course");
  return { email: normalizedEmail, productKey: course.courseKey };
}

/** A calendar date, stored at UTC noon; reject JS's silent February-30 rollover. */
export function parseExamCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use a YYYY-MM-DD exam date");
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value ||
      date.getUTCFullYear() < 1971 || date.getUTCFullYear() > 2037)
    throw new Error("Invalid exam date");
  return date;
}

export function parseReminderHistory(value: string): number[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some(n => !EXAM_REMINDER_INTERVALS.includes(n as any)))
    throw new Error("Invalid exam reminder history");
  return [...new Set(parsed as number[])].sort((a, b) => b - a);
}

type Writer = Pick<Database, "insert" | "delete">;
export async function upsertExamDate(db: Writer, input: {
  email: string; productKey: string; date: string;
  orgId: number | null; organizationMemberId: number | null;
}) {
  const key = normalizeExamDateKey(input.email, input.productKey);
  const examDate = parseExamCalendarDate(input.date);
  await db.insert(examDates).values({
    ...key, examDate, remindersSent: "[]", courseKey: key.productKey,
    orgId: input.orgId, organizationMemberId: input.organizationMemberId,
  }).onDuplicateKeyUpdate({ set: {
    // Evaluate against the old date BEFORE assigning the replacement date.
    remindersSent: sql`IF(DATE(${examDates.examDate}) = ${input.date}, ${examDates.remindersSent}, '[]')`,
    examDate, courseKey: key.productKey,
    orgId: input.orgId, organizationMemberId: input.organizationMemberId,
    updatedAt: sql`CURRENT_TIMESTAMP`,
  } });
}

export async function removeExamDate(db: Writer, email: string, productKey: string) {
  const key = normalizeExamDateKey(email, productKey);
  await db.delete(examDates).where(and(eq(examDates.email, key.email), eq(examDates.productKey, key.productKey)));
}

/** A late email acknowledgement must not mark a replacement date as reminded. */
export async function recordExamReminder(db: Database, row: typeof examDates.$inferSelect, interval: number) {
  if (!EXAM_REMINDER_INTERVALS.includes(interval as any)) throw new Error("Invalid reminder interval");
  await db.update(examDates).set({
    remindersSent: sql`IF(JSON_CONTAINS(${examDates.remindersSent}, ${String(interval)}),
      ${examDates.remindersSent}, JSON_ARRAY_APPEND(${examDates.remindersSent}, '$', ${interval}))`,
  }).where(and(eq(examDates.id, row.id), eq(examDates.examDate, row.examDate)));
}
