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
const scheduleDeps = { getDb, list: listHeartbeatJobs, create: createHeartbeatJob, update: updateHeartbeatJob };
async function readBindings(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const [rows] = await db.execute(sql`SELECT weeklyTaskUid, workerTaskUid FROM blog_automation_runs WHERE id = 'weekly-echelon-blog'`) as any;
  return rows[0] as { weeklyTaskUid?: string; workerTaskUid?: string } | undefined;
}
/** Configuration repair is not permission to resume. A saved binding is authoritative. */
export async function ensureDurableBlogHeartbeat(deps = scheduleDeps) {
  if (process.env.DEPLOYMENT_ENV === "preview") throw new Error("Preview cannot change blog schedules");
  const db = await deps.getDb();
  if (!db) throw new Error("Blog scheduling database unavailable");
  await db.execute(sql`INSERT IGNORE INTO blog_automation_runs (id, runKey, status, progress) VALUES ('weekly-echelon-blog', '', 'completed', '{}')`);
  const bindings = await readBindings(db);
  await ensureWeeklyBlogHeartbeat(deps, bindings?.weeklyTaskUid);
  const { jobs } = await deps.list("", { page: 1, pageSize: 100 });
  const weeklyMatches = jobs.filter(job => bindings?.weeklyTaskUid ? job.taskUid === bindings.weeklyTaskUid : job.name === "weekly-echelon-blog");
  if (weeklyMatches.length !== 1) throw new Error("Bound weekly blog task is missing or ambiguous");
  const workerMatches = jobs.filter(job => bindings?.workerTaskUid ? job.taskUid === bindings.workerTaskUid : job.name === BLOG_CONTINUATION_HEARTBEAT.name);
  if (workerMatches.length > 1 || (bindings?.workerTaskUid && !workerMatches.length)) throw new Error("Bound continuation task is missing or ambiguous");
  const worker = workerMatches[0];
  let workerUid: string;
  if (!worker) workerUid = (await deps.create(BLOG_CONTINUATION_HEARTBEAT, "")).taskUid;
  else {
    workerUid = worker.taskUid;
    if (worker.cronExpression !== BLOG_CONTINUATION_HEARTBEAT.cron ||
        worker.callbackPath !== BLOG_CONTINUATION_HEARTBEAT.path ||
        worker.callbackMethod.toUpperCase() !== "POST")
      await deps.update(workerUid, { ...BLOG_CONTINUATION_HEARTBEAT }, "");
  }
  if (!weeklyMatches[0].taskUid || !workerUid) throw new Error("Missing blog schedule task identity");
  await db.execute(sql`UPDATE blog_automation_runs SET weeklyTaskUid = ${weeklyMatches[0].taskUid}, workerTaskUid = ${workerUid} WHERE id = 'weekly-echelon-blog'`);
  return { weekly: "registered", continuation: worker ? "registered" : "created" };
}
/** Explicit owner-approved recovery only. Startup never calls this function. */
export async function resumeBoundBlogHeartbeat(kind: "weekly" | "worker", expectedTaskUid: string, deps = scheduleDeps) {
  if (process.env.NODE_ENV !== "production" || process.env.DEPLOYMENT_ENV === "preview") throw new Error("Resume requires the production deployment");
  const db = await deps.getDb();
  if (!db) throw new Error("Blog scheduling database unavailable");
  const bindings = await readBindings(db);
  const bound = kind === "weekly" ? bindings?.weeklyTaskUid : bindings?.workerTaskUid;
  if (!bound || bound !== expectedTaskUid) throw new Error("Resume task does not match saved binding");
  const { jobs } = await deps.list("", { page: 1, pageSize: 100 });
  const task = jobs.find(job => job.taskUid === bound);
  const path = kind === "weekly" ? "/api/scheduled/generate-blog" : BLOG_CONTINUATION_HEARTBEAT.path;
  if (!task || task.callbackPath !== path || task.callbackMethod.toUpperCase() !== "POST") throw new Error("Resume callback configuration is not ready");
  await deps.update(bound, { enable: true }, "");
}
export async function blogTaskAuthorized(taskUid: string | undefined, kind: "weekly" | "worker") {
  if (!taskUid) return false;
  const db = await getDb();
  if (!db) return false;
  const column = kind === "weekly" ? sql`weeklyTaskUid` : sql`workerTaskUid`;
  const [rows] = await db.execute(sql`SELECT id FROM blog_automation_runs WHERE id = 'weekly-echelon-blog' AND ${column} = ${taskUid}`) as any;
  return rows.length === 1;
}
