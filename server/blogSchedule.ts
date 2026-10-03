import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { createHeartbeatJob, listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";
import { ensureWeeklyBlogHeartbeat } from "./blogAutomation";
export const BLOG_CONTINUATION_HEARTBEAT = {
  name: "echelon-blog-continuation",
  cron: "0 * * * * *",
  path: "/api/scheduled/continue-blog",
  method: "POST" as const,
  description: "Advance one persisted weekly editorial step; idle callbacks make no model requests.",
};
/** Called only by deployed production startup, after migration approval and deployment. */
export async function ensureDurableBlogHeartbeat(deps = {
  getDb,
  list: listHeartbeatJobs,
  create: createHeartbeatJob,
  update: updateHeartbeatJob,
}) {
  if (process.env.DEPLOYMENT_ENV === "preview") throw new Error("Preview cannot change blog schedules");
  const db = await deps.getDb();
  if (!db) throw new Error("Blog scheduling database unavailable");
  // Check schema readiness before changing live schedules.
  await db.execute(sql`INSERT IGNORE INTO blog_automation_runs (id, runKey, status, progress) VALUES ('weekly-echelon-blog', '', 'completed', '{}')`);
  await ensureWeeklyBlogHeartbeat(deps);
  const { jobs } = await deps.list("", { page: 1, pageSize: 100 });
  const weekly = jobs.find(job => job.name === "weekly-echelon-blog");
  if (!weekly) throw new Error("Weekly blog task registration is not visible yet");
  const worker = jobs.find(job => job.name === BLOG_CONTINUATION_HEARTBEAT.name);
  let workerUid: string;
  if (!worker) workerUid = (await deps.create(BLOG_CONTINUATION_HEARTBEAT, "")).taskUid;
  else {
    workerUid = worker.taskUid;
    if (worker.cronExpression !== BLOG_CONTINUATION_HEARTBEAT.cron ||
        worker.callbackPath !== BLOG_CONTINUATION_HEARTBEAT.path ||
        worker.callbackMethod.toUpperCase() !== "POST" || !worker.isEnable)
      await deps.update(workerUid, { ...BLOG_CONTINUATION_HEARTBEAT, enable: true }, "");
  }
  if (!weekly.taskUid || !workerUid) throw new Error("Missing blog schedule task identity");
  await db.execute(sql`UPDATE blog_automation_runs SET weeklyTaskUid = ${weekly.taskUid}, workerTaskUid = ${workerUid} WHERE id = 'weekly-echelon-blog'`);
  return { weekly: "registered", continuation: worker ? "registered" : "created" };
}
export async function blogTaskAuthorized(taskUid: string | undefined, kind: "weekly" | "worker") {
  if (!taskUid) return false;
  const db = await getDb();
  if (!db) return false;
  const column = kind === "weekly" ? sql`weeklyTaskUid` : sql`workerTaskUid`;
  const [rows] = await db.execute(sql`SELECT id FROM blog_automation_runs WHERE id = 'weekly-echelon-blog' AND ${column} = ${taskUid}`) as any;
  return rows.length === 1;
}
