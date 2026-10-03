import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";
import { getDb } from "./db";
import { databaseWritesFrozen } from "./_core/databaseCutover";
import { blogRunKey, recentAutomatedPost, type BlogClaim, type BlogProgress } from "./blogWorkflow";
import type { Database } from "./stripe/eventLedger";
const ID = "weekly-echelon-blog";
const affected = (result: any) => Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
async function database() {
  if (databaseWritesFrozen()) throw new Error("Blog automation paused for maintenance");
  const db = await getDb();
  if (!db) throw new Error("Blog automation database unavailable");
  return db;
}
export async function enqueueWeeklyBlog(now = new Date()) {
  const db = await database();
  return db.transaction(async tx => {
    await tx.execute(sql`INSERT IGNORE INTO blog_automation_runs (id, runKey, status, progress) VALUES (${ID}, '', 'completed', '{}')`);
    const [rows] = await tx.execute(sql`SELECT runKey, status FROM blog_automation_runs WHERE id = ${ID} FOR UPDATE`) as any;
    if (["pending", "processing"].includes(rows[0].status)) return { ok: true, action: "already_queued" };
    const period = blogRunKey(now);
    if (rows[0].runKey === period) return { ok: true, action: rows[0].status === "failed" ? "failed_requires_inspection" : "already_completed" };
    await tx.execute(sql`UPDATE blog_automation_runs SET runKey = ${period}, status = 'pending', progress = ${JSON.stringify({ phase: "topic", revision: 0 })}, claimToken = NULL, leaseUntil = NULL, attempts = 0, lastError = NULL, startedAt = CURRENT_TIMESTAMP WHERE id = ${ID}`);
    return { ok: true, action: "queued" };
  });
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
    fail: reason => finish("failed", reason),
    retry: () => finish("pending", "Retryable source or provider read failure"),
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
