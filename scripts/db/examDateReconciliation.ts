import { createHash } from "node:crypto";
import { normalizeExamDateKey, parseReminderHistory } from "../../server/examDateRecords";

export type ExamDateSnapshotRow = {
  id: number; email: string; productKey: string; examDate: string;
  remindersSent: string; createdAt: string; updatedAt: string;
  orgId: number | null; organizationMemberId: number | null; courseKey: string | null;
};
export function examDateSnapshotHash(rows: ExamDateSnapshotRow[]) {
  return createHash("sha256").update(JSON.stringify([...rows].sort((a, b) => a.id - b.id))).digest("hex");
}

/** Pure/read-only plan. The exact snapshot and proposed changes must be reviewed before apply. */
export function planExamDateReconciliation(rows: ExamDateSnapshotRow[]) {
  const groups = new Map<string, ExamDateSnapshotRow[]>();
  const blockers: Array<{ ids: number[]; reason: string }> = [];
  for (const row of rows) {
    try {
      const key = normalizeExamDateKey(row.email, row.productKey);
      parseReminderHistory(row.remindersSent);
      if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(row.examDate) ||
          !Number.isFinite(Date.parse(row.examDate.replace(" ", "T") + "Z")))
        throw new Error("Invalid stored date");
      if (row.courseKey && normalizeExamDateKey(row.email, row.courseKey).productKey !== key.productKey)
        throw new Error("Conflicting course attribution");
      const id = JSON.stringify(key);
      groups.set(id, [...(groups.get(id) ?? []), row]);
    } catch { blockers.push({ ids: [row.id], reason: "Invalid identity/course/date/reminder data; repair explicitly before reconciliation" }); }
  }
  const changes: Array<{ keeper: ExamDateSnapshotRow; removeIds: number[]; previousDates: string[] }> = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);
    const winner = sorted[0];
    const key = normalizeExamDateKey(winner.email, winner.productKey);
    const affiliations = new Set(group.map(r => JSON.stringify([r.orgId, r.organizationMemberId])));
    if (affiliations.size > 1) {
      blockers.push({ ids: group.map(r => r.id), reason: "Conflicting organization attribution; do not guess ownership" });
      continue;
    }
    const day = winner.examDate.slice(0, 10);
    const reminders = [...new Set(group.filter(r => r.examDate.slice(0, 10) === day)
      .flatMap(r => parseReminderHistory(r.remindersSent)))].sort((a, b) => b - a);
    const keeper = { ...winner, ...key, courseKey: key.productKey,
      examDate: `${day} 12:00:00`, remindersSent: JSON.stringify(reminders) };
    if (group.length > 1 || JSON.stringify(keeper) !== JSON.stringify(winner))
      changes.push({ keeper, removeIds: sorted.slice(1).map(r => r.id),
        previousDates: [...new Set(group.map(r => r.examDate.slice(0, 10)))] });
  }
  return { sha256: examDateSnapshotHash(rows), rowCount: rows.length, changes, blockers };
}
