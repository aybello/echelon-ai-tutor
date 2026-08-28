import { createHash } from "crypto";
import { z } from "zod";
import type { LearningActivitySession } from "../drizzle/schema";
import { courseKeyToLabel, resolveCourseKey } from "../shared/courseRegistry";

export const ACTIVITY_LABELS = {
  quiz: "Practice questions",
  mock_exam: "Mock exam",
  flashcards: "Flashcards",
  process_guide: "Process Guide",
  ai_tutor: "AI Tutor",
} as const;

export type TrainingActivityType = keyof typeof ACTIVITY_LABELS;

export type TrainingSessionView = Pick<LearningActivitySession,
  "sessionKey" | "studentEmail" | "courseKey" | "activityType" | "topic" |
  "startedAt" | "activeSeconds" | "unitsCompleted" | "score" | "total" | "status"
>;

export const OJT_DAILY_CAP_SECONDS = 7 * 60 * 60;
export const OJT_ROUNDING_SECONDS = 15 * 60;

export const SIGNER_AUTHORITIES = {
  oro: "Overall Responsible Operator (ORO)",
  oro_authorized_designate: "ORO-authorized designate",
  oro_manager_or_supervisor: "Manager or supervisor of the ORO",
  oro_authorized_training_coordinator: "Training coordinator authorized by the ORO",
  manager_acknowledgement: "Manager acknowledgement only",
} as const;

export type SignerAuthority = keyof typeof SIGNER_AUTHORITIES;

export function assignedAnnualCourseKeys(courseKey: string | null, courseKeys: string | null): string[] {
  let assigned = courseKey ? [courseKey] : [];
  if (courseKeys) {
    try {
      const parsed = JSON.parse(courseKeys);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
        if (valid.length > 0) assigned = valid;
      }
    } catch {
      // Retain the legacy singular assignment when malformed JSON exists.
    }
  }
  return [...new Set(assigned.map((key) => resolveCourseKey(key)?.courseKey).filter((key): key is string => !!key))];
}

function ontarioDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Produces a separate supervisor-review duration without changing the raw
 * platform record. Ontario OJT summaries are normally capped at seven hours
 * per day and rounded down to the nearest quarter hour. Final eligibility
 * still belongs to the employer and regulator, not this calculation.
 */
export function calculateSupervisorReviewDuration(rows: TrainingSessionView[]) {
  const dailyTotals = new Map<string, { date: string; platformRecordedSeconds: number }>();
  for (const row of rows) {
    const date = ontarioDateKey(row.startedAt);
    const current = dailyTotals.get(date) ?? { date, platformRecordedSeconds: 0 };
    current.platformRecordedSeconds += Math.max(0, row.activeSeconds ?? 0);
    dailyTotals.set(date, current);
  }

  const days = [...dailyTotals.values()].sort((a, b) => a.date.localeCompare(b.date)).map((day) => {
    const cappedSeconds = Math.min(day.platformRecordedSeconds, OJT_DAILY_CAP_SECONDS);
    const supervisorReviewSeconds = Math.floor(cappedSeconds / OJT_ROUNDING_SECONDS) * OJT_ROUNDING_SECONDS;
    return { ...day, cappedSeconds, supervisorReviewSeconds };
  });

  return {
    supervisorReviewSeconds: days.reduce((total, day) => total + day.supervisorReviewSeconds, 0),
    days,
    timeZone: "America/Toronto" as const,
    dailyCapSeconds: OJT_DAILY_CAP_SECONDS,
    roundingSeconds: OJT_ROUNDING_SECONDS,
  };
}

export function summarizeTrainingSessions(rows: TrainingSessionView[]) {
  const byCourse = new Map<string, { courseKey: string; courseName: string; activeSeconds: number; sessionCount: number }>();
  const byActivity = new Map<string, { activityType: TrainingActivityType; label: string; activeSeconds: number; sessionCount: number }>();
  let activeSeconds = 0;

  for (const row of rows) {
    const seconds = Math.max(0, row.activeSeconds ?? 0);
    activeSeconds += seconds;
    const course = byCourse.get(row.courseKey) ?? {
      courseKey: row.courseKey,
      courseName: courseKeyToLabel(row.courseKey),
      activeSeconds: 0,
      sessionCount: 0,
    };
    course.activeSeconds += seconds;
    course.sessionCount += 1;
    byCourse.set(row.courseKey, course);

    const activityType = row.activityType as TrainingActivityType;
    const activity = byActivity.get(activityType) ?? {
      activityType,
      label: ACTIVITY_LABELS[activityType] ?? activityType,
      activeSeconds: 0,
      sessionCount: 0,
    };
    activity.activeSeconds += seconds;
    activity.sessionCount += 1;
    byActivity.set(activityType, activity);
  }

  return {
    activeSeconds,
    sessionCount: rows.length,
    byCourse: [...byCourse.values()].sort((a, b) => b.activeSeconds - a.activeSeconds),
    byActivity: [...byActivity.values()].sort((a, b) => b.activeSeconds - a.activeSeconds),
    supervisorReview: calculateSupervisorReviewDuration(rows),
  };
}

export function buildOperatorRows(rows: TrainingSessionView[]) {
  const grouped = new Map<string, TrainingSessionView[]>();
  for (const row of rows) {
    const key = `${row.studentEmail}\u0000${row.courseKey}`;
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }
  return [...grouped.values()].map((sessions) => {
    const summary = summarizeTrainingSessions(sessions);
    const latestAt = sessions.reduce((latest, row) => row.startedAt > latest ? row.startedAt : latest, sessions[0].startedAt);
    return {
      operatorEmail: sessions[0].studentEmail,
      courseKey: sessions[0].courseKey,
      courseName: courseKeyToLabel(sessions[0].courseKey),
      activeSeconds: summary.activeSeconds,
      sessionCount: summary.sessionCount,
      latestAt,
    };
  }).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}

export function canonicalSnapshotDigest(snapshotJson: string): string {
  return createHash("sha256").update(snapshotJson, "utf8").digest("hex");
}

function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  // Excel and other spreadsheet tools may evaluate cells beginning with these
  // characters as formulas. Topics are learner-controlled, so neutralize the
  // entire class of formula-injection prefixes before applying CSV quoting.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function sessionsToCsv(rows: TrainingSessionView[]): string {
  const header = ["Date", "Start time", "Duration minutes", "Course", "Activity", "Topic", "Units", "Score"];
  const lines = rows.map((row) => {
    const date = row.startedAt.toISOString();
    const score = row.score != null && row.total ? `${row.score}/${row.total}` : "";
    return [
      date.slice(0, 10),
      date.slice(11, 19),
      (Math.max(0, row.activeSeconds) / 60).toFixed(1),
      courseKeyToLabel(row.courseKey),
      ACTIVITY_LABELS[row.activityType as TrainingActivityType] ?? row.activityType,
      row.topic ?? "",
      row.unitsCompleted,
      score,
    ].map(csvCell).join(",");
  });
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}

const snapshotSessionSchema = z.object({
  sessionKey: z.string().uuid(),
  startedAt: z.string().datetime(),
  activeSeconds: z.number().int().nonnegative(),
  activityType: z.enum(["quiz", "mock_exam", "flashcards", "process_guide", "ai_tutor"]),
  topic: z.string().nullable(),
  unitsCompleted: z.number().int().nonnegative(),
  score: z.number().int().nullable(),
  total: z.number().int().nullable(),
});

const summaryGroupSchema = z.object({
  activeSeconds: z.number().int().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
});

export const trainingSnapshotSchema = z.object({
  version: z.literal(1),
  reportId: z.string().uuid(),
  orgId: z.number().int().positive(),
  operatorEmail: z.string().email(),
  operatorName: z.string().nullable(),
  courseKey: z.string().min(1),
  courseName: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  signedAt: z.string().datetime(),
  summary: z.object({
    activeSeconds: z.number().int().nonnegative(),
    sessionCount: z.number().int().nonnegative(),
    byCourse: z.array(summaryGroupSchema.extend({ courseKey: z.string(), courseName: z.string() })),
    byActivity: z.array(summaryGroupSchema.extend({ activityType: z.string(), label: z.string() })),
    supervisorReview: z.object({
      supervisorReviewSeconds: z.number().int().nonnegative(),
      days: z.array(z.object({
        date: z.string(),
        platformRecordedSeconds: z.number().int().nonnegative(),
        cappedSeconds: z.number().int().nonnegative(),
        supervisorReviewSeconds: z.number().int().nonnegative(),
      })),
      timeZone: z.literal("America/Toronto"),
      dailyCapSeconds: z.number().int().positive(),
      roundingSeconds: z.number().int().positive(),
    }),
  }),
  sessions: z.array(snapshotSessionSchema),
  providerName: z.string(),
  instructorName: z.string(),
  instructorContact: z.string(),
  learningObjectives: z.string(),
  signedByName: z.string(),
  signedByEmail: z.string().email(),
  signedRole: z.string(),
  signerAuthority: z.enum([
    "oro",
    "oro_authorized_designate",
    "oro_manager_or_supervisor",
    "oro_authorized_training_coordinator",
    "manager_acknowledgement",
  ]),
  attestationKind: z.enum(["ojt_attestation", "manager_acknowledgement"]),
  statement: z.string(),
});

export type TrainingSnapshot = z.infer<typeof trainingSnapshotSchema>;

export function parseVerifiedTrainingSnapshot(snapshotJson: string, digestSha256: string): TrainingSnapshot {
  if (canonicalSnapshotDigest(snapshotJson) !== digestSha256) {
    throw new Error("Training record integrity check failed.");
  }
  return trainingSnapshotSchema.parse(JSON.parse(snapshotJson));
}
