type ProgressRow = { status: string; operatorKey?: string | null; operatorEmail: string | null; totalAttempts: number; correctAttempts: number; readinessScore: number; daysActive30: number; accessEndsAt: Date | string | null };
export function flexRowIsStudying(row: Pick<ProgressRow, 'status' | 'daysActive30' | 'accessEndsAt'>, now = new Date()) {
  return row.status === 'active' && !!row.accessEndsAt && new Date(row.accessEndsAt) > now && row.daysActive30 > 0;
}
export function summarizeFlexProgress(rows: ProgressRow[], now = new Date()) {
  const active = rows.filter(row => row.status === "active" && !!row.accessEndsAt && new Date(row.accessEndsAt) > now);
  const key = (row: ProgressRow) => row.operatorEmail?.trim().toLowerCase() || row.operatorKey;
  const assigned = new Set(rows.filter(row => row.status !== "invited").map(key).filter(Boolean));
  const studying = new Set(active.filter(row => flexRowIsStudying(row, now)).map(key).filter(Boolean));
  const totalAttempts = rows.reduce((sum, row) => sum + row.totalAttempts, 0);
  const correctAttempts = rows.reduce((sum, row) => sum + row.correctAttempts, 0);
  const recorded = active.filter(row => row.totalAttempts > 0);
  return { activatedLicences: active.length, assignedLearners: assigned.size, studyingLearners: studying.size,
    totalAttempts, avgAccuracy: totalAttempts ? Math.round(correctAttempts / totalAttempts * 100) : 0,
    avgReadiness: recorded.length ? Math.round(recorded.reduce((sum, row) => sum + row.readinessScore, 0) / recorded.length) : 0 };
}
