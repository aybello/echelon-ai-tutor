import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { claimWork, WorkBusyError } from "./durableWork";
import { runReconciliation } from "./reconcile";
import { runExamReminders } from "./examReminders";
import { runTriggerEngine } from "./triggerEngine";

export const MANAGED_JOBS = {
  "reconcile-purchases": {
    cron: "0 0 3 * * *",
    run: (guard: () => Promise<void>) => runReconciliation(48, guard),
  },
  "exam-reminders": { cron: "0 0 8 * * *", run: runExamReminders },
  "study-triggers": { cron: "0 0 21 * * *", run: runTriggerEngine },
};

/** Authenticated scheduling is also bound to a designated production host and project task. */
export function managedJobHostAllowed(
  host: string | undefined,
  env = process.env
) {
  if (
    env.DEPLOYMENT_ENV !== "production" ||
    env.MANAGED_JOBS_ENABLED !== "true"
  )
    return false;
  if (!host) return false;
  // One or more explicit production origins, comma-separated. Every entry
  // must be an https origin; preview hosts are never listed here.
  for (const entry of (env.MANAGED_JOBS_ORIGIN ?? "").split(",")) {
    const candidate = entry.trim();
    if (!candidate) continue;
    try {
      const origin = new URL(candidate);
      if (origin.protocol === "https:" && host === origin.host) return true;
    } catch {
      continue;
    }
  }
  return false;
}
export function managedJobAllowed(
  host: string | undefined,
  taskUid: string | undefined,
  job: string,
  env = process.env
) {
  if (!managedJobHostAllowed(host, env)) return false;
  try {
    const tasks = JSON.parse(env.MANAGED_JOB_TASK_UIDS ?? "{}");
    return (
      typeof tasks[job] === "string" &&
      Boolean(taskUid) &&
      taskUid === tasks[job]
    );
  } catch {
    return false;
  }
}

export function requireManagedJob(
  req: Request,
  res: Response,
  job: string
): boolean {
  const taskUid =
    res.locals.cronUser?.taskUid ?? req.headers["x-manus-cron-task-uid"];
  // Behind the platform proxy (trust proxy is enabled) the Host header can be
  // rewritten to an internal service address while x-forwarded-host carries
  // the public origin the request entered through. Either may match the
  // production allowlist; authentication is enforced separately above.
  const forwardedHost = req.headers["x-forwarded-host"];
  const candidateHosts = [
    req.headers.host,
    typeof forwardedHost === "string"
      ? forwardedHost.split(",")[0]?.trim()
      : undefined,
  ];
  if (
    !(res.locals.scheduledAuthenticated || res.locals.cronUser?.isCron) ||
    !candidateHosts.some(host =>
      managedJobAllowed(
        host,
        typeof taskUid === "string" ? taskUid : undefined,
        job
      )
    )
  ) {
    recordManagedJobRejection(req, res, job, taskUid);
    // Non-secret diagnostics: which precondition failed, never the values.
    console.error(
      `[managed-job:${job}] rejected scheduled request | host=${req.headers.host ?? "none"} | ` +
        `authenticated=${Boolean(res.locals.scheduledAuthenticated || res.locals.cronUser?.isCron)} | ` +
        `taskUidPresent=${Boolean(taskUid)} | hostAllowed=${managedJobHostAllowed(req.headers.host)}`
    );
    res
      .status(503)
      .json({
        ok: false,
        error: "Managed job is not enabled for this host and task",
      });
    return false;
  }
  return true;
}

/**
 * Ring buffer of recent managed-job rejections. Production logs are not
 * directly readable during an incident, so the secret-protected diagnostics
 * endpoint exposes which gate precondition failed. Hosts are request routing
 * metadata, not secrets; task UID and secret values are never stored.
 */
const recentManagedJobRejections: Array<Record<string, unknown>> = [];

function recordManagedJobRejection(
  req: Request,
  res: Response,
  job: string,
  taskUid: unknown
) {
  let taskUidMatchesJob = false;
  try {
    const tasks = JSON.parse(process.env.MANAGED_JOB_TASK_UIDS ?? "{}");
    taskUidMatchesJob =
      typeof taskUid === "string" && tasks[job] === taskUid;
  } catch {
    taskUidMatchesJob = false;
  }
  recentManagedJobRejections.push({
    ts: new Date().toISOString(),
    job,
    host: req.headers.host ?? null,
    forwardedHost: req.headers["x-forwarded-host"] ?? null,
    authenticated: Boolean(
      res.locals.scheduledAuthenticated || res.locals.cronUser?.isCron
    ),
    viaCronIdentity: Boolean(res.locals.cronUser?.isCron),
    taskUidPresent: Boolean(taskUid),
    taskUidMatchesJob,
    hostAllowed: managedJobHostAllowed(req.headers.host),
    envReady:
      process.env.DEPLOYMENT_ENV === "production" &&
      process.env.MANAGED_JOBS_ENABLED === "true" &&
      Boolean(process.env.MANAGED_JOBS_ORIGIN),
  });
  if (recentManagedJobRejections.length > 20)
    recentManagedJobRejections.shift();
}

export function getManagedJobRejections() {
  return [...recentManagedJobRejections];
}

export async function runManagedJob(
  name: keyof typeof MANAGED_JOBS,
  now = new Date(),
  dependencies = { getDb, jobs: MANAGED_JOBS }
) {
  const db = await dependencies.getDb();
  if (!db) throw new Error("Database unavailable for managed job");
  const key = `job:${name}:${now.toISOString().slice(0, 10)}`;
  const claim = await claimWork(db, key, true);
  if (!claim) return { state: "already_completed" };
  let globalClaim: Awaited<ReturnType<typeof claimWork>> = null;
  try {
    globalClaim = await claimWork(db, `job-lock:${name}`, true);
    if (!globalClaim) throw new WorkBusyError("Job lock unavailable");
    const assertOwned = async () => {
      await claim.assertOwned();
      await globalClaim!.assertOwned();
    };
    const result = await dependencies.jobs[name].run(assertOwned);
    if (result.errors.length)
      throw new Error(
        `Managed job has ${result.errors.length} unresolved errors; inspect job logs`
      );
    await claim.finish("completed");
    return { state: "completed" };
  } catch (error) {
    await claim.finish("failed", error);
    throw error;
  } finally {
    await globalClaim?.finish("pending").catch(() => {});
  }
}

export function registerManagedJobs(app: Express, run = runManagedJob) {
  for (const name of Object.keys(MANAGED_JOBS) as Array<
    keyof typeof MANAGED_JOBS
  >) {
    app.post(`/api/scheduled/${name}`, async (req, res) => {
      if (!requireManagedJob(req, res, name)) return;
      try {
        return res.json({ ok: true, job: name, ...(await run(name)) });
      } catch (error) {
        console.error(
          `[managed-job:${name}]`,
          error instanceof Error ? error.message : "execution failed"
        );
        return res
          .status(error instanceof WorkBusyError ? 409 : 503)
          .json({
            ok: false,
            job: name,
            error: "Job incomplete; retry required",
          });
      }
    });
  }
}
