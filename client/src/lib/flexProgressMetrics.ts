type ProgressRow = { status: string; operatorKey?: string | null; operatorEmail: string | null; totalAttempts: number; correctAttempts: number; readinessScore: number; readinessAvailable: boolean; activityAvailable: boolean; daysActive30: number; accessEndsAt: Date | string | null };
export function flexRowIsStudying(row: Pick<ProgressRow, 'status' | 'daysActive30' | 'accessEndsAt'>, now = new Date()) {
  return row.status === 'active' && !!row.accessEndsAt && new Date(row.accessEndsAt) > now && row.daysActive30 > 0;
}
export function summarizeFlexProgress(rows: ProgressRow[], now = new Date()) {
  const active = rows.filter(row => row.status === "active" && !!row.accessEndsAt && new Date(row.accessEndsAt) > now);
  const lifetimeActivityComplete = rows.every(row => row.activityAvailable);
  // An active row is outside the current cohort only when its end is known
  // and elapsed. A missing or invalid end makes cohort membership uncertain.
  const activeActivityComplete = rows.every(row => {
    if (row.status !== "active") return true;
    const end = row.accessEndsAt == null ? NaN : new Date(row.accessEndsAt).getTime();
    return Number.isFinite(end) && (end <= now.getTime() || row.activityAvailable);
  });
  const key = (row: ProgressRow) => row.operatorEmail?.trim().toLowerCase() || row.operatorKey;
  const assigned = new Set(rows.filter(row => row.status !== "invited").map(key).filter(Boolean));
  const studying = new Set(active.filter(row => flexRowIsStudying(row, now)).map(key).filter(Boolean));
  const totalAttempts = rows.reduce((sum, row) => sum + row.totalAttempts, 0);
  const correctAttempts = rows.reduce((sum, row) => sum + row.correctAttempts, 0);
  const recorded = active.filter(row => row.totalAttempts > 0 && row.readinessAvailable);
  return { activatedLicences: active.length, assignedLearners: assigned.size, studyingLearners: studying.size, lifetimeActivityComplete, activeActivityComplete,
    totalAttempts, avgAccuracy: totalAttempts ? Math.round(correctAttempts / totalAttempts * 100) : null,
    avgReadiness: recorded.length ? Math.round(recorded.reduce((sum, row) => sum + row.readinessScore, 0) / recorded.length) : null };
}

/**
 * Count every licence the organization has paid for, from the full licence
 * list rather than the progress rows. Progress rows exclude unused licences
 * and expired ones past their reporting grace, so using them as the
 * denominator showed "2 activated / 2 licences" to a manager who had paid for
 * eight. Revoked (refunded) and cancelled licences are not purchased capacity;
 * a suspended licence under an open dispute still is until the dispute closes.
 */
export function countPurchasedFlexLicences(licences: ReadonlyArray<{ status: string }>) {
  return licences.filter(licence => !["cancelled", "revoked"].includes(licence.status)).length;
}
