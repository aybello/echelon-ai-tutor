import { open } from "node:fs/promises";
import { parseArgs } from "node:util";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { planExamDateReconciliation, type ExamDateSnapshotRow } from "./examDateReconciliation";
import { EXAM_REMINDER_INTERVALS } from "../../server/examDateRecords";
import { workKey } from "../../server/jobs/durableWork";

const { values } = parseArgs({ options: {
  apply: { type: "boolean", default: false },
  sha256: { type: "string" }, backup: { type: "string" },
} });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
if (values.apply && (process.env.EXAM_DATE_RECONCILIATION_APPROVED !== "APPLY_REVIEWED_EXAM_DATES" ||
    process.env.EXAM_DATE_WRITERS_PAUSED !== "ALL_WRITERS_PAUSED" ||
    process.env.MIGRATION_BACKUP_CONFIRMED !== "BACKUP_VERIFIED" || !values.sha256 || !values.backup))
  throw new Error("Apply requires reviewed SHA, private backup path, verified database backup and paused application/scheduled writers");

const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z", dateStrings: true });
try {
  await db.query("SET time_zone = '+00:00'");
  if (values.apply) await db.beginTransaction();
  const [rows] = await db.query<(RowDataPacket & ExamDateSnapshotRow)[]>(
    `SELECT id, email, productKey, examDate, remindersSent, createdAt, updatedAt,
      orgId, organizationMemberId, courseKey FROM exam_dates ORDER BY id${values.apply ? " FOR UPDATE" : ""}`);
  const plan = planExamDateReconciliation(rows);
  if (!values.apply) {
    // Output includes private learner data: retain only in a restricted release workspace.
    console.log(JSON.stringify(plan, null, 2));
  } else {
    if (plan.sha256 !== values.sha256) throw new Error("Snapshot changed; generate and review a new plan");
    if (plan.blockers.length) throw new Error("Unresolved plan blockers; no changes applied");
    // Never lose a possibly-sent legacy alias delivery when switching its hashed work key.
    for (const change of plan.changes) {
      for (const old of rows.filter(r => r.id === change.keeper.id || change.removeIds.includes(r.id))) {
        if (old.productKey === change.keeper.productKey) continue;
        for (const interval of EXAM_REMINDER_INTERVALS) {
          const legacyKey = workKey("exam-email", `${old.email.trim().toLowerCase()}:${old.productKey}:${old.examDate.slice(0, 10)}:${interval}`);
          const [delivery] = await db.query<RowDataPacket[]>("SELECT status FROM scheduled_work WHERE workKey = ?", [legacyKey]);
          if (delivery.length) throw new Error(`Legacy alias delivery exists for exam-date row ${old.id}; reconcile delivery evidence before changing its identity`);
        }
      }
    }
    const backup = await open(values.backup!, "wx", 0o600);
    try { await backup.writeFile(JSON.stringify({ savedAt: new Date().toISOString(), rows, plan }, null, 2)); await backup.sync(); }
    finally { await backup.close(); }
    for (const change of plan.changes) {
      for (const id of change.removeIds) await db.execute("DELETE FROM exam_dates WHERE id = ?", [id]);
      const r = change.keeper;
      await db.execute(`UPDATE exam_dates SET email = ?, productKey = ?, examDate = ?,
        remindersSent = ?, courseKey = ?, updatedAt = ? WHERE id = ?`,
        [r.email, r.productKey, r.examDate, r.remindersSent, r.courseKey, r.updatedAt, r.id]);
    }
    const [after] = await db.query<(RowDataPacket & ExamDateSnapshotRow)[]>(
      "SELECT id, email, productKey, examDate, remindersSent, createdAt, updatedAt, orgId, organizationMemberId, courseKey FROM exam_dates ORDER BY id");
    const verified = planExamDateReconciliation(after);
    if (verified.changes.length || verified.blockers.length ||
        after.length !== rows.length - plan.changes.reduce((n, c) => n + c.removeIds.length, 0))
      throw new Error("Reconciliation verification failed");
    await db.commit();
    console.log(JSON.stringify({ reconciled: plan.changes.length, remainingRows: after.length, sha256: verified.sha256 }));
  }
} catch (error) {
  if (values.apply) await db.rollback();
  throw error;
} finally { await db.end(); }
