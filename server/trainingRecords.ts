import { createHash } from "crypto";
import type { LearningActivitySession } from "../drizzle/schema";
import { courseKeyToLabel } from "../shared/courseRegistry";

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
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
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
