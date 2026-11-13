type ScoreHistoryRow = {
  sessionId: string;
  examType: string;
  stream: string | null;
  score: number;
  total: number;
  passed: string;
  timeTakenSeconds: number | null;
  learnerName: string | null;
  learnerEmail: string | null;
  createdAt: Date | string;
};

export function scoreLearnerIdentity(row: Pick<ScoreHistoryRow, "learnerName" | "learnerEmail">) {
  return {
    name: row.learnerName?.trim() || (row.learnerEmail?.trim() ? "Email-only learner" : "Unidentified learner"),
    email: row.learnerEmail?.trim() || "No email recorded",
  };
}

export function formatScoreSavedAt(value: Date | string, timeZone?: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { date: "Date unavailable", time: "", iso: undefined };
  return {
    date: date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone }),
    time: date.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short", timeZone }),
    iso: date.toISOString(),
  };
}

export function scoreHistoryCsvRow(row: ScoreHistoryRow) {
  return {
    learner_name: row.learnerName?.trim() || "",
    learner_email: row.learnerEmail?.trim() || "",
    session_id: row.sessionId,
    exam_type: row.examType,
    stream: row.stream ?? "",
    score: row.score,
    total: row.total,
    percent: row.total > 0 ? Math.round(row.score / row.total * 100) : 0,
    passed: row.passed,
    time_taken_seconds: row.timeTakenSeconds ?? "",
    saved_at_utc: formatScoreSavedAt(row.createdAt).iso ?? "",
  };
}
