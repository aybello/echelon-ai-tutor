import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";
import { getDb } from "./db";
import { databaseWritesFrozen } from "./_core/databaseCutover";
import { blogRunKey, recentAutomatedPost, type BlogClaim, type BlogProgress } from "./blogWorkflow";
import type { Database } from "./stripe/eventLedger";
const ID = "weekly-echelon-blog";
const DEFINITELY_UNSENT_ERROR = 'Blog step failed: {"phase":"draft-submit","service":"openai","kind":"missing_credential"}';
const DEFINITELY_UNSENT_ARCHIVE_REASON = "definitely_unsent_missing_credential";
const affected = (result: any) => Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
function deadlock(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth += 1) {
    const value = current as { code?: unknown; errno?: unknown; sqlState?: unknown; cause?: unknown };
    if (value.code === "ER_LOCK_DEADLOCK" || value.errno === 1213 || value.sqlState === "40001") return true;
    current = value.cause;
  }
  return false;
}
type DefinitelyUnsentArchive = {
  sourceRunId: string;
  sourceRunKey: string;
  sourceStatus: string;
  phase: string;
  attempts: number;
  failureService: string;
  failureKind: string;
  archiveReason: string;
  sourceStartedAt: Date;
  sourceFailedAt: Date;
};
function canonicalWeeklyRunKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^weekly:\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value.slice("weekly:".length)}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.getUTCDay() === 1
    && `weekly:${date.toISOString().slice(0, 10)}` === value;
}
function timestamp(value: unknown): Date | null {
  const date = value instanceof Date ? value : typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}
/** Builds sparse audit metadata only for the one proven pre-transport credential failure. */
function definitelyUnsentArchive(row: Record<string, unknown>, nextRunKey: string): DefinitelyUnsentArchive | null {
  if (row.id !== ID || row.status !== "failed" || row.claimToken !== null || row.leaseUntil !== null
    || !canonicalWeeklyRunKey(row.runKey) || !canonicalWeeklyRunKey(nextRunKey) || row.runKey > nextRunKey
    || row.lastError !== DEFINITELY_UNSENT_ERROR || !Number.isInteger(row.attempts) || Number(row.attempts) < 0)
    return null;
  const startedAt = timestamp(row.startedAt);
  const failedAt = timestamp(row.updatedAt);
  if (!startedAt || !failedAt || typeof row.progress !== "string") return null;
  let progress: unknown;
  try { progress = JSON.parse(row.progress); } catch { return null; }
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) return null;
  const data = progress as Record<string, unknown>;
  if (data.phase !== "draft-submit" || data.revision !== 0 || data.submissionPending !== true
    || data.submissionNotSent !== true || Object.hasOwn(data, "responseId")
    || Object.hasOwn(data, "article") || Object.hasOwn(data, "issues")) return null;
  return { sourceRunId: ID, sourceRunKey: row.runKey, sourceStatus: "failed", phase: "draft-submit",
    attempts: Number(row.attempts), failureService: "openai", failureKind: "missing_credential",
    archiveReason: DEFINITELY_UNSENT_ARCHIVE_REASON, sourceStartedAt: startedAt, sourceFailedAt: failedAt };
}
async function database() {
  if (databaseWritesFrozen()) throw new Error("Blog automation paused for maintenance");
  const db = await getDb();
  if (!db) throw new Error("Blog automation database unavailable");
  return db;
}
export async function enqueueWeeklyBlog(now = new Date()) {
  const db = await database();
  // This transaction changes only queue/audit state, never provider or publication work.
  for (let attempt = 0; attempt < 2; attempt += 1) try {
    return await db.transaction(async tx => {
    await tx.execute(sql`INSERT IGNORE INTO blog_automation_runs (id, runKey, status, progress) VALUES (${ID}, '', 'completed', '{}')`);
    const [rows] = await tx.execute(sql`SELECT id, runKey, status, progress, claimToken, leaseUntil, attempts, lastError, startedAt, updatedAt FROM blog_automation_runs WHERE id = ${ID} FOR UPDATE`) as any;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Blog automation state row is missing after bootstrap");
    if (["pending", "processing"].includes(String(row.status))) return { ok: true, action: "already_queued" };
    const period = blogRunKey(now);
    // A calendar boundary is not operator authorization to discard a failed run.
    // In particular, submissionPending may represent a paid response whose ID
    // was never saved. Preserve its evidence until explicit reconciliation.
    if (row.status === "failed") {
      const archive = definitelyUnsentArchive(row, period);
      if (!archive) return { ok: true, action: "failed_requires_inspection" };
      const [existingArchives] = await tx.execute(sql`SELECT id FROM blog_automation_run_archives WHERE sourceRunId = ${archive.sourceRunId} AND sourceRunKey = ${archive.sourceRunKey} FOR UPDATE`) as any;
      if (existingArchives.length > 0) return { ok: true, action: "failed_requires_inspection" };
      await tx.execute(sql`INSERT INTO blog_automation_run_archives (sourceRunId, sourceRunKey, sourceStatus, phase, attempts, failureService, failureKind, archiveReason, sourceStartedAt, sourceFailedAt) VALUES (${archive.sourceRunId}, ${archive.sourceRunKey}, ${archive.sourceStatus}, ${archive.phase}, ${archive.attempts}, ${archive.failureService}, ${archive.failureKind}, ${archive.archiveReason}, ${archive.sourceStartedAt}, ${archive.sourceFailedAt})`);
      const result = await tx.execute(sql`UPDATE blog_automation_runs SET runKey = ${period}, status = 'pending', progress = ${JSON.stringify({ phase: "topic", revision: 0 })}, claimToken = NULL, leaseUntil = NULL, attempts = 0, lastError = NULL, startedAt = CURRENT_TIMESTAMP WHERE id = ${ID} AND status = 'failed' AND runKey = ${archive.sourceRunKey} AND claimToken IS NULL AND leaseUntil IS NULL`);
      if (affected(result) !== 1) throw new Error("Blog definitely-unsent recovery lost ownership");
      return { ok: true, action: "queued_after_definitely_unsent_archive" };
    }
    if (row.runKey === period) return { ok: true, action: "already_completed" };
    await tx.execute(sql`UPDATE blog_automation_runs SET runKey = ${period}, status = 'pending', progress = ${JSON.stringify({ phase: "topic", revision: 0 })}, claimToken = NULL, leaseUntil = NULL, attempts = 0, lastError = NULL, startedAt = CURRENT_TIMESTAMP WHERE id = ${ID}`);
    return { ok: true, action: "queued" };
    });
  } catch (error) {
    if (!deadlock(error) || attempt === 1) throw error;
  }
  throw new Error("Blog queue deadlock retry unexpectedly completed without a result");
}
export async function claimBlogStep(): Promise<BlogClaim | null> {
  const db = await database();
  const token = randomUUID();
  const result = await db.execute(sql`UPDATE blog_automation_runs SET status = 'processing', claimToken = ${token}, leaseUntil = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 SECOND), attempts = attempts + 1 WHERE id = ${ID} AND (status = 'pending' OR (status = 'processing' AND leaseUntil < CURRENT_TIMESTAMP))`);
  if (affected(result) !== 1) return null;
  const [rows] = await db.execute(sql`SELECT runKey, startedAt, progress FROM blog_automation_runs WHERE id = ${ID} AND claimToken = ${token}`) as any;
  const row = rows[0];
  const run = { runKey: row.runKey, startedAt: new Date(row.startedAt), progress: JSON.parse(row.progress) as BlogProgress };
  const finish = async (status: string, reason: string | null, progress?: BlogProgress) => {
    const result = await db.execute(sql`UPDATE blog_automation_runs SET status = ${status}, lastError = ${reason}, progress = ${JSON.stringify(progress ?? run.progress)}, claimToken = NULL, leaseUntil = NULL WHERE id = ${ID} AND status = 'processing' AND claimToken = ${token} AND leaseUntil >= CURRENT_TIMESTAMP`);
    if (affected(result) !== 1) throw new Error("Blog step lost ownership");
  };
  return {
    run,
    checkpoint: async progress => {
      const result = await db.execute(sql`UPDATE blog_automation_runs SET progress = ${JSON.stringify(progress)}, attempts = attempts + 1 WHERE id = ${ID} AND status = 'processing' AND claimToken = ${token} AND leaseUntil >= CURRENT_TIMESTAMP`);
      if (affected(result) !== 1) throw new Error("Blog submission lost ownership");
      run.progress = structuredClone(progress);
    },
    save: progress => finish("pending", null, progress),
    complete: reason => finish("completed", reason),
    fail: (reason, progress) => finish("failed", reason, progress),
    retry: progress => finish("pending", "Retryable source or provider read failure", progress),
    publish: post => publishClaimedBlog(db, token, post),
  };
}
export async function publishClaimedBlog(db: Database, token: string, post: typeof blogPosts.$inferInsert) {
  return db.transaction(async tx => {
    if (databaseWritesFrozen()) throw new Error("Blog automation paused for maintenance");
    const [rows] = await tx.execute(sql`SELECT progress FROM blog_automation_runs WHERE id = ${ID} AND status = 'processing' AND claimToken = ${token} AND leaseUntil >= CURRENT_TIMESTAMP FOR UPDATE`) as any;
    if (rows.length !== 1) throw new Error("Blog publication lost ownership");
    const progress = JSON.parse(rows[0].progress) as BlogProgress;
    if (progress.phase !== "publish" || progress.approved !== true || progress.topic?.slug !== post.slug)
      throw new Error("Blog publication is not approved for this run");
    const existing = await tx.select({ slug: blogPosts.slug, title: blogPosts.title, tags: blogPosts.tags, createdAt: blogPosts.createdAt }).from(blogPosts);
    let action: "published" | "already_published" | "recent_article";
    if (existing.some(row => row.slug === post.slug)) action = "already_published";
    else if (recentAutomatedPost(existing, new Date())) action = "recent_article";
    else {
      await tx.insert(blogPosts).values({ ...post, author: "Echelon Institute Editorial Team" });
      action = "published";
    }
    const result = await tx.execute(sql`UPDATE blog_automation_runs SET status = 'completed', lastError = NULL, claimToken = NULL, leaseUntil = NULL WHERE id = ${ID} AND claimToken = ${token}`);
    if (affected(result) !== 1) throw new Error("Blog publication lost ownership");
    return action;
  });
}
