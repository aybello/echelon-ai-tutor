import type { Express, Request, Response } from "express";
import { desc } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";
import { getDb } from "./db";
import { fetchOfficialSource } from "./blogAutomation";
import { submitBlogResponse, retrieveBlogResponse } from "./blogModel";
import { advanceBlogWorkflow } from "./blogWorkflow";
import { claimBlogStep, enqueueWeeklyBlog } from "./blogWorkflowStore";
import { blogTaskAuthorized } from "./blogSchedule";
import { notifyOwner } from "./_core/notification";

export async function authorizeBlogCallback(req: Request, res: Response, kind: "weekly" | "worker") {
  delete res.locals.blogAuthRejection;
  const reject = (code: string) => { res.locals.blogAuthRejection = code; return false; };
  if (process.env.NODE_ENV !== "production" || process.env.DEPLOYMENT_ENV === "preview") return reject("deployment_not_allowed");
  // A verified platform identity plus the persisted task binding is the authority.
  // Heartbeat can use an internal delivery host, not the public custom domain.
  // Still reject explicit preview/sandbox hosts, even if production env was copied.
  const host = (req.headers.host ?? "").toLowerCase();
  if (!host || /\.manus\.computer(?::\d+)?$/.test(host)) return reject("host_not_allowed");
  if (res.locals.cronUser?.isCron === true) {
    const taskUid = res.locals.cronUser.taskUid;
    if (typeof taskUid !== "string" || !taskUid) return reject("task_identity_missing");
    return await blogTaskAuthorized(taskUid, kind) || reject("task_not_bound");
  }
  // Legacy shared-secret requests do not carry a platform-verified identity.
  // They retain the public-host allowlist; forwarded headers are not trusted.
  const allowedHosts = new Set(["echeloninstitute.ca", "www.echeloninstitute.ca",
    "echelonai-9kar7mkg.manus.space", "echeloninstitute.manus.space"]);
  if (!allowedHosts.has(host)) return reject("host_not_allowed");
  if (res.locals.scheduledAuthenticated !== true) return reject("scheduled_auth_missing");
  const taskUid = req.headers["x-manus-cron-task-uid"];
  if (typeof taskUid !== "string" || !taskUid) return reject("task_identity_missing");
  return await blogTaskAuthorized(taskUid, kind) || reject("task_not_bound");
}

export async function continueWeeklyBlog() {
  return advanceBlogWorkflow({
    claim: claimBlogStep,
    now: () => new Date(),
    fetchSource: fetchOfficialSource,
    submit: submitBlogResponse,
    retrieve: retrieveBlogResponse,
    notify: (title, content) => notifyOwner({ title, content }),
    listPosts: async () => {
      const db = await getDb();
      if (!db) throw new Error("Blog database unavailable");
      return db.select({ slug: blogPosts.slug, title: blogPosts.title, tags: blogPosts.tags, createdAt: blogPosts.createdAt })
        .from(blogPosts).orderBy(desc(blogPosts.createdAt));
    },
  });
}
/** Mount after the existing scheduled authentication and maintenance middleware. */
export function registerBlogAutomationRoutes(app: Express, deps = { enqueue: enqueueWeeklyBlog, advance: continueWeeklyBlog, authorize: authorizeBlogCallback }) {
  app.post("/api/scheduled/generate-blog", async (req, res) => {
    try {
      if (!await deps.authorize(req, res, "weekly")) return res.status(403).json({ ok: false, error: "Not the designated blog task", reason: res.locals.blogAuthRejection });
      const result = await deps.enqueue();
      return res.status(result.action === "failed_requires_inspection" ? 409 : 200).json({ ...result, published: false });
    } catch {
      return res.status(503).json({ ok: false, error: "Blog queue unavailable; retry required", published: false });
    }
  });
  app.post("/api/scheduled/continue-blog", async (req, res) => {
    try {
      if (!await deps.authorize(req, res, "worker")) return res.status(403).json({ ok: false, error: "Not the designated blog task", reason: res.locals.blogAuthRejection });
      const result = await deps.advance();
      return res.status(result.action === "retry_pending" ? 503 : result.ok ? 200 : 422)
        .json({ ...result, published: result.action === "article_published" });
    } catch {
      return res.status(503).json({ ok: false, error: "Blog step incomplete; retry required", published: false });
    }
  });
}
