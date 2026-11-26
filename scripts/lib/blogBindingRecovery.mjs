import { isDeepStrictEqual } from "node:util";
import { readFile, lstat } from "node:fs/promises";
import path from "node:path";
import { writeDurableOitRepairBackup } from "./oitReportedItemBackup.mjs";

export const CONTRACT = Object.freeze({
  version: "blog-binding-recovery-20261017-v1",
  id: "weekly-echelon-blog", old: "gNrrRXxb5V8mQEUpHZGXSb",
  weekly: "RCdSVHj37rLDyqV3cYkjaP", owner: "310519663446228701",
  oldName: "echelon-blog-continuation",
  weeklyCron: "0 0 14 * * 1", weeklyPath: "/api/scheduled/generate-blog",
  name: "echelon-blog-continuation-recovered-20261017",
  cron: "0 * * * * *", path: "/api/scheduled/continue-blog", method: "POST",
});
export const JOURNAL_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/blog-binding";
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
export function validNewUid(uid) {
  requireThat(typeof uid === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,64}$/.test(uid)
    && uid !== CONTRACT.old && uid !== CONTRACT.weekly, "Invalid or non-distinct expected new worker UID");
}
// Reject inconsistent aliases rather than silently choosing one representation.
export function field(row, camel, snake) {
  requireThat(!(camel in row && snake in row) || row[camel] === row[snake], "Conflicting Heartbeat field aliases");
  return row[camel] ?? row[snake];
}
function verifyEmptyPayload(job) {
  const payload = field(job, "callbackPayload", "callback_payload");
  if (payload === "") return;
  let parsed;
  try { parsed = typeof payload === "string" ? JSON.parse(payload) : payload; } catch { /* rejected below */ }
  requireThat(parsed && typeof parsed === "object" && !Array.isArray(parsed)
    && Object.getPrototypeOf(parsed) === Object.prototype && Reflect.ownKeys(parsed).length === 0,
  "Heartbeat payload must be empty or an empty JSON object");
}
export function verifyJobs(snapshot, newUid) {
  validNewUid(newUid);
  requireThat(snapshot.actorUserId === CONTRACT.owner && snapshot.total === snapshot.jobs.length, "Incomplete or wrong-owner Heartbeat list");
  const ids = new Set();
  for (const job of snapshot.jobs) {
    const uid = field(job, "taskUid", "task_uid");
    requireThat(typeof uid === "string" && uid.length > 0 && !ids.has(uid), "Missing or duplicate Heartbeat UID");
    ids.add(uid);
    requireThat(field(job, "userId", "user_id") === CONTRACT.owner, "Heartbeat list includes an unverified owner");
    requireThat(typeof field(job, "isEnable", "is_enable") === "boolean", "Unknown Heartbeat enable state");
    if (field(job, "isEnable", "is_enable") === true) {
      const callbackPath = field(job, "callbackPath", "callback_path");
      requireThat(typeof callbackPath === "string" && callbackPath.startsWith("/api/scheduled/"),
        "Enabled Heartbeat callback path is missing or invalid");
    }
  }
  const find = uid => snapshot.jobs.find(job => field(job, "taskUid", "task_uid") === uid);
  const old = find(CONTRACT.old), next = find(newUid), weekly = find(CONTRACT.weekly);
  requireThat(old && next && weekly, "Missing original, replacement or weekly Heartbeat");
  requireThat(field(old, "isEnable", "is_enable") === false, "Original worker must remain paused");
  requireThat(old.name === CONTRACT.oldName && field(old, "cronExpression", "cron_expression") === CONTRACT.cron
    && field(old, "callbackPath", "callback_path") === CONTRACT.path
    && field(old, "callbackMethod", "callback_method") === CONTRACT.method, "Original worker configuration differs");
  requireThat(weekly.name === CONTRACT.id && field(weekly, "isEnable", "is_enable") === true
    && field(weekly, "cronExpression", "cron_expression") === CONTRACT.weeklyCron
    && field(weekly, "callbackPath", "callback_path") === CONTRACT.weeklyPath
    && field(weekly, "callbackMethod", "callback_method") === CONTRACT.method, "Weekly Heartbeat configuration differs");
  requireThat(next.name === CONTRACT.name && field(next, "isEnable", "is_enable") === true
    && field(next, "cronExpression", "cron_expression") === CONTRACT.cron
    && field(next, "callbackPath", "callback_path") === CONTRACT.path
    && field(next, "callbackMethod", "callback_method") === CONTRACT.method, "Replacement worker configuration differs");
  for (const job of [old, next, weekly]) verifyEmptyPayload(job);
  requireThat(snapshot.jobs.filter(job => job.name === CONTRACT.name).length === 1, "Replacement name is not unique");
  requireThat(snapshot.jobs.filter(job => field(job, "callbackPath", "callback_path") === CONTRACT.path
    && field(job, "isEnable", "is_enable") === true).length === 1, "Another enabled continuation worker exists");
}
export function verifyRow(rows, workerUid) {
  requireThat(Array.isArray(rows) && rows.length === 1, "Expected exactly one blog state row");
  const row = rows[0];
  requireThat(row.id === CONTRACT.id && row.weeklyTaskUid === CONTRACT.weekly && row.workerTaskUid === workerUid,
    "Blog identity or exact expected bindings differ");
  requireThat(row.status === "completed" && row.runKey === "", "Blog must be the completed empty-run placeholder");
  let progress;
  try { progress = typeof row.progress === "string" ? JSON.parse(row.progress) : row.progress; } catch { /* rejected below */ }
  requireThat(progress && typeof progress === "object" && !Array.isArray(progress) && Object.keys(progress).length === 0,
    "Nonempty/uncertain progress; manual inspection required");
  requireThat(row.claimToken === null && row.leaseUntil === null, "Any claim or lease blocks recovery, even if expired");
  requireThat(row.lastError === null || row.lastError === "", "Prior error/uncertain submission blocks recovery");
  return row;
}
const withoutUpdatedAt = row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "updatedAt"));
export function verifyPostimage(before, after, newUid) {
  requireThat(isDeepStrictEqual(withoutUpdatedAt({ ...before, workerTaskUid: newUid }), withoutUpdatedAt(after)),
    "Postimage changed fields other than workerTaskUid/normal updatedAt");
}
export function journalPath(file) {
  requireThat(typeof file === "string" && path.isAbsolute(file) && path.dirname(file) === JOURNAL_ROOT
    && /^[a-z0-9][a-z0-9._-]*\.json$/i.test(path.basename(file)), "Journal must be a direct private JSON file in the fixed external backup root");
  return file;
}
export async function writeJournal(file, payload) {
  journalPath(file);
  return writeDurableOitRepairBackup({ backupFile: file, payload, backupRoot: JOURNAL_ROOT });
}
export async function readJournal(file) {
  journalPath(file);
  const root = await lstat(JOURNAL_ROOT), stat = await lstat(file);
  requireThat(root.isDirectory() && !root.isSymbolicLink() && (root.mode & 0o077) === 0
    && root.uid === process.getuid() && stat.isFile() && !stat.isSymbolicLink()
    && (stat.mode & 0o777) === 0o600 && stat.uid === process.getuid(), "Untrusted journal permissions/type/owner");
  return JSON.parse(await readFile(file, "utf8"));
}
export function verifyJournal(journal, current, newUid) {
  requireThat(journal.version === CONTRACT.version && journal.phase === "prepared" && journal.newUid === newUid,
    "Journal contract or expected new UID differs");
  verifyRow([journal.before], CONTRACT.old);
  verifyPostimage(journal.before, current, newUid);
}

/** No app imports, callbacks, requeues or publishing. Dependencies allow entirely synthetic tests. */
export async function recoverBinding({ connection, independentRead, snapshot, newUid, apply = false,
  journalFile, saveJournal = writeJournal, loadJournal = readJournal }) {
  verifyJobs(snapshot, newUid);
  if (apply) journalPath(journalFile);
  let transaction = false, commitAttempted = false;
  try {
    await connection.query(apply ? "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE" : "SET TRANSACTION READ ONLY");
    await connection.beginTransaction(); transaction = true;
    const [rows] = await connection.query(`SELECT * FROM blog_automation_runs${apply ? " FOR UPDATE" : ""}`);
    requireThat(rows.length === 1, "Expected exactly one blog state row");
    if (rows[0].workerTaskUid === newUid) {
      verifyRow(rows, newUid);
      requireThat(journalFile, "Already-bound identity requires the original beforeimage journal");
      const journal = await loadJournal(journalFile);
      verifyJournal(journal, rows[0], newUid);
      await connection.rollback(); transaction = false;
      const verified = await independentRead();
      verifyRow(verified, newUid); verifyPostimage(journal.before, verified[0], newUid);
      return { outcome: "already-bound-verified", changed: false };
    }
    const before = verifyRow(rows, CONTRACT.old);
    if (!apply) {
      await connection.rollback(); transaction = false;
      return { outcome: "read-only-plan", changed: false, rowId: before.id, expectedOld: CONTRACT.old,
        expectedWeekly: CONTRACT.weekly, newUid, changedFields: ["workerTaskUid"] };
    }
    // Exclusive 0600 beforeimage + file fsync + directory fsync MUST complete before UPDATE.
    await saveJournal(journalFile, { version: CONTRACT.version, phase: "prepared", newUid,
      recordedAt: new Date().toISOString(), before });
    const [result] = await connection.execute(`UPDATE blog_automation_runs SET workerTaskUid = ?
      WHERE BINARY id = BINARY ? AND BINARY workerTaskUid = BINARY ? AND BINARY weeklyTaskUid = BINARY ?`,
    [newUid, CONTRACT.id, CONTRACT.old, CONTRACT.weekly]);
    requireThat(result.affectedRows === 1, "CAS did not affect exactly one row");
    const [after] = await connection.query("SELECT * FROM blog_automation_runs");
    verifyRow(after, newUid); verifyPostimage(before, after[0], newUid);
    commitAttempted = true;
    await connection.commit(); transaction = false;
    const verified = await independentRead();
    verifyRow(verified, newUid); verifyPostimage(before, verified[0], newUid);
    await saveJournal(`${journalFile}.verified.json`, { version: CONTRACT.version, phase: "verified-after-commit", newUid,
      recordedAt: new Date().toISOString(), after: verified[0] });
    return { outcome: "committed-independently-verified", changed: true, journalFile };
  } catch {
    let rollbackConfirmed = !transaction;
    if (transaction) { try { await connection.rollback(); rollbackConfirmed = true; } catch { /* never imply rollback succeeded */ } }
    const error = new Error(commitAttempted
      ? "COMMIT attempted: outcome may be committed, including verification/journal failure. STOP; inspect private journal and independent DB state. No automatic retry or reverse UPDATE."
      : `Recovery stopped before COMMIT; rollback ${rollbackConfirmed ? "acknowledged" : "unconfirmed"}. Inspect state/journal before any explicit retry.`);
    error.name = commitAttempted ? "CommitOutcomeAmbiguous" : "RecoveryStopped";
    throw error; // Do not expose driver messages, credentials or private row payloads.
  }
}
