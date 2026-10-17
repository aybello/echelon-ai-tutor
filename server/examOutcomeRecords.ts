import { createHash } from "node:crypto";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { examOutcomes, type InsertExamOutcome } from "../drizzle/schema";
import { parseExamCalendarDate } from "./examDateRecords";
import type { Database } from "./stripe/eventLedger";

export function outcomeExamDate(value: string, now = new Date()) {
  const date = parseExamCalendarDate(value);
  if (value > now.toISOString().slice(0, 10)) throw new Error("The official exam date cannot be in the future.");
  return date;
}

/** No exam time is collected: exclude the whole exam day conservatively. */
export function preExamCutoff(date: Date) {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export function examAttemptKey(input: { orgId: number; memberEmail: string; courseKey: string; examDate: Date }) {
  return createHash("sha256").update(JSON.stringify([
    input.orgId, input.memberEmail.trim().toLowerCase(), input.courseKey,
    input.examDate.toISOString().slice(0, 10),
  ])).digest("hex");
}

/** Correcting one dated attempt does not replace a different sitting or double-count a retry. */
export async function saveExamOutcome(db: Database, input: InsertExamOutcome) {
  const values = { ...input, memberEmail: input.memberEmail.trim().toLowerCase(), recordedAt: new Date() };
  if (!values.examDate) {
    // An undated manager report has no defensible pre-exam estimate or stable attempt identity.
    await db.insert(examOutcomes).values({ ...values, readinessScoreAtOutcome: null, readinessModelVersion: null });
    return;
  }
  const key = examAttemptKey({ ...values, examDate: values.examDate });
  const dayStart = preExamCutoff(values.examDate);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const [legacy] = await db.select({ id: examOutcomes.id, examAttemptKey: examOutcomes.examAttemptKey })
    .from(examOutcomes).where(and(
      eq(examOutcomes.orgId, values.orgId), eq(examOutcomes.memberEmail, values.memberEmail),
      eq(examOutcomes.courseKey, values.courseKey),
      gte(examOutcomes.examDate, dayStart), lt(examOutcomes.examDate, dayEnd),
    )).orderBy(desc(examOutcomes.id)).limit(1);
  if (legacy && !legacy.examAttemptKey) {
    // Adopt only the matching historical sitting; preserve every other exam date.
    await db.update(examOutcomes).set({ ...values, examAttemptKey: key }).where(eq(examOutcomes.id, legacy.id));
    return;
  }
  await db.insert(examOutcomes).values({ ...values, examAttemptKey: key }).onDuplicateKeyUpdate({ set: {
    result: values.result, recordedBy: values.recordedBy, recordedAt: values.recordedAt,
  } });
}
