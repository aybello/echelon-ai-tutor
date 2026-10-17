import { resolve } from "node:path";
import { commandProblem, runCommand } from "./dailyAudit.mjs";

export const AUTOMATED_BLOG_TAG = "Automated Article";
const WEEK = 7 * 24 * 60 * 60_000;
const MINUTE = 60_000;
const PHASES = new Set(["topic", "plan-submit", "plan-poll", "research", "draft-submit", "draft-poll", "review-submit", "review-poll", "publish"]);
const field = (row, camel, snake) => row?.[camel] ?? row?.[snake];
const time = value => value == null || value === "" ? NaN : new Date(value).getTime();

/** Separate from test isolation: only this read-only CLI gets the two Forge credentials. */
export function blogHeartbeatEnv(parent, home) {
  return Object.fromEntries(Object.entries({ PATH: parent.PATH, LANG: parent.LANG, HOME: home,
    TZ: "UTC", NO_COLOR: "1", BUILT_IN_FORGE_API_URL: parent.BUILT_IN_FORGE_API_URL,
    BUILT_IN_FORGE_API_KEY: parent.BUILT_IN_FORGE_API_KEY }).filter(([, value]) => value != null));
}

/** Fixed read commands only; no application imports, callbacks, model calls or repair actions. */
export async function readBlogHeartbeatSnapshot({ weeklyTaskUid, parentEnv, home, cwd, outputDir,
  timeoutMs = 35_000, run = runCommand }) {
  const snapshot = { jobs: null, weeklyRuns: null, blocked: [], logs: [] };
  if (!parentEnv.BUILT_IN_FORGE_API_URL || !parentEnv.BUILT_IN_FORGE_API_KEY) {
    snapshot.blocked.push("Heartbeat Forge credentials unavailable");
    return snapshot;
  }
  const end = performance.now() + Math.min(timeoutMs, 35_000);
  async function read(name, args) {
    const remaining = Math.floor(end - performance.now());
    if (remaining <= 0) throw new Error("Heartbeat snapshot deadline exhausted");
    const result = await run("manus-heartbeat", args, { cwd, env: blogHeartbeatEnv(parentEnv, home),
      logPath: resolve(outputDir, `blog-heartbeat-${name}.log`), timeoutMs: Math.min(12_000, remaining),
      captureBytes: 1024 * 1024, maxOutputBytes: 1024 * 1024 });
    snapshot.logs.push(result.logPath);
    if (commandProblem(result) || result.exitCode !== 0) throw new Error(`Heartbeat ${name} read unavailable; see private command log`);
    try { return JSON.parse(result.tail); } catch { throw new Error(`Heartbeat ${name} returned malformed JSON`); }
  }
  try {
    const data = await read("jobs", ["list", "--page", "1", "--page-size", "200"]);
    if (!Array.isArray(data.jobs) || !Number.isInteger(data.total) || data.total !== data.jobs.length) {
      throw new Error("Heartbeat job list incomplete or unsupported (200-job snapshot bound)");
    }
    snapshot.jobs = data.jobs;
  } catch (error) { snapshot.blocked.push(error.message); }
  if (typeof weeklyTaskUid !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,64}$/.test(weeklyTaskUid)) {
    snapshot.blocked.push("No valid bound weekly identity for log read");
  } else try {
    // A finite window of newest runs, without response bodies or customer payloads.
    const data = await read("weekly", ["logs", "--task-uid", weeklyTaskUid, "--page", "1", "--page-size", "20"]);
    if (!Array.isArray(data.runs) || !Number.isInteger(data.total) || data.total < 0
      || data.runs.length !== Math.min(data.total, 20) || field(data, "taskUid", "task_uid") !== weeklyTaskUid) {
      throw new Error("Heartbeat weekly log shape unsupported or incomplete");
    }
    snapshot.weeklyRuns = data.runs;
  } catch (error) { snapshot.blocked.push(error.message); }
  return snapshot;
}

/** Latest Monday 14:00 UTC slot. Grace is handled separately, not by resetting at Monday midnight. */
export function weeklyBlogSlot(now) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  date.setUTCHours(14, 0, 0, 0);
  if (date.getTime() > time(now)) date.setUTCDate(date.getUTCDate() - 7);
  return date.getTime();
}

/** Pure evaluation; neither a completed placeholder nor manual/draft articles prove an outcome. */
export function evaluateBlogAutomationHealth({ rows, latestArticle, heartbeat, now = new Date(),
  graceMs = 60 * MINUTE, staleMs = 5 * MINUTE, maxRunMs = 30 * MINUTE }) {
  const findings = [];
  const add = (code, status, detail) => findings.push({ code, status, detail });
  const finish = () => ({ status: findings.some(f => f.status === "fail") ? "fail"
    : findings.some(f => f.status === "blocked") ? "blocked" : findings.some(f => f.status === "warn") ? "warn" : "pass",
  detail: findings.map(f => `${f.code}: ${f.detail}`).join("; "), findings });
  const at = time(now);
  if (!Number.isFinite(at) || !Number.isFinite(graceMs) || graceMs < 0) {
    add("clock", "blocked", "Invalid audit clock or grace"); return finish();
  }
  for (const reason of heartbeat?.blocked ?? []) add("heartbeat-capability", "blocked", reason);
  if (!Array.isArray(rows)) { add("database", "blocked", "Blog state read unavailable"); return finish(); }
  if (rows.length !== 1) { add("bindings", "fail", `Expected one weekly blog state row, found ${rows.length}`); return finish(); }
  const row = rows[0];
  let progress;
  try { progress = typeof row.progress === "string" ? JSON.parse(row.progress) : row.progress; } catch { /* Invalid below. */ }
  const realRun = /^weekly:\d{4}-\d{2}-\d{2}$/.test(row.runKey ?? "") && PHASES.has(progress?.phase)
    && Number.isInteger(Number(row.attempts)) && Number(row.attempts) > 0;
  const boundWeekly = row.weeklyTaskUid;
  const boundWorker = row.workerTaskUid;
  if (!boundWeekly || !boundWorker || boundWeekly === boundWorker) add("bindings", "fail", "Weekly/worker bindings missing or not distinct");
  const jobs = heartbeat?.jobs;
  let weekly;
  if (!Array.isArray(jobs)) add("heartbeat-jobs", "blocked", "Complete heartbeat job snapshot unavailable");
  else for (const [kind, uid, name, path, cron] of [
    ["weekly", boundWeekly, "weekly-echelon-blog", "/api/scheduled/generate-blog", "0 0 14 * * 1"],
    ["worker", boundWorker, "echelon-blog-continuation", "/api/scheduled/continue-blog", "0 * * * * *"],
  ]) {
    if (!uid) continue;
    const matches = jobs.filter(job => field(job, "taskUid", "task_uid") === uid);
    if (matches.length !== 1) { add(`${kind}-binding`, "fail", `Bound ${kind} task missing or ambiguous`); continue; }
    const job = matches[0];
    if (kind === "weekly") weekly = job;
    const acceptedName = job.name === name || (kind === "worker"
      && /^echelon-blog-continuation-recovered-\d{8}$/.test(job.name));
    if (!acceptedName || field(job, "callbackPath", "callback_path") !== path
      || String(field(job, "callbackMethod", "callback_method")).toUpperCase() !== "POST"
      || field(job, "cronExpression", "cron_expression") !== cron) add(`${kind}-configuration`, "fail", `Bound ${kind} schedule/callback differs from contract`);
    const enabled = field(job, "isEnable", "is_enable");
    if (enabled === false) add(`${kind}-disabled`, "fail", `Bound ${kind} task is disabled`);
    else if (enabled !== true) add(`${kind}-enabled`, "blocked", `Bound ${kind} enable state unavailable`);
    if (jobs.some(other => other !== job && other.name === job.name)) add(`${kind}-duplicate`, "fail", `Multiple ${kind} jobs share the expected name; inspect bindings`);
  }
  const slot = weeklyBlogSlot(now);
  const dueSlot = at >= slot + graceMs ? slot : slot - WEEK;
  const created = time(field(weekly, "createdAt", "created_at"));
  const firstRun = Number.isFinite(created) && created <= at && created > dueSlot;
  if (!Number.isFinite(created) || created > at) add("first-run", "blocked", "Weekly creation time unavailable or future-dated; cannot establish first eligible deadline");
  const runs = heartbeat?.weeklyRuns;
  if (!Array.isArray(runs)) add("weekly-log", "blocked", "Bound weekly execution history unavailable");
  else {
    const validRuns = runs.filter(run => field(run, "taskUid", "task_uid") === boundWeekly
      && Number.isFinite(time(field(run, "scheduledAt", "scheduled_at")))
      && typeof field(run, "isManualTrigger", "is_manual_trigger") === "boolean");
    if (validRuns.length !== runs.length) add("weekly-log", "blocked", "Unrecognized or mismatched execution records");
    const scheduled = validRuns.filter(run => field(run, "isManualTrigger", "is_manual_trigger") === false)
      .sort((a, b) => time(field(b, "scheduledAt", "scheduled_at")) - time(field(a, "scheduledAt", "scheduled_at")));
    const latest = scheduled[0];
    if (latest) {
      const http = Number(field(latest, "httpStatus", "http_status"));
      if (time(field(latest, "scheduledAt", "scheduled_at")) > at) add("weekly-log-clock", "blocked", "Weekly execution is future-dated");
      if (["failed", "timeout"].includes(latest.status) || http >= 300) add("weekly-execution", "fail", `Latest scheduled weekly execution ${latest.status}, HTTP ${Number.isFinite(http) ? http : "unknown"}`);
      else if (latest.status === "success" && (!Number.isFinite(http) || http < 200)) add("weekly-execution", "blocked", "Weekly success record lacks a successful HTTP response");
      else if (!["success", "running", "skipped"].includes(latest.status)) add("weekly-execution", "blocked", "Unknown weekly execution status");
      else if (latest.status !== "success") add("weekly-execution", "warn", `Latest weekly execution is ${latest.status}, not successful`);
      if (!firstRun && time(field(latest, "scheduledAt", "scheduled_at")) < dueSlot) add("weekly-missing", "fail", "No scheduled weekly execution for the elapsed deadline");
    } else if (!firstRun) {
      add("weekly-missing", runs.length >= 20 ? "blocked" : "fail", runs.length >= 20
        ? "No scheduled execution in bounded log window" : "No scheduled weekly execution after an eligible deadline");
    }
  }
  if (row.status === "failed") add("run-failed", "fail", "Persisted blog workflow failed; inspect private provider/editorial logs");
  else if (!["completed", "pending", "processing"].includes(row.status)) add("run-status", "blocked", "Unknown persisted blog status");
  if (["pending", "processing"].includes(row.status)) {
    const started = time(row.startedAt), updated = time(row.updatedAt);
    if (![started, updated].every(Number.isFinite) || started > at || updated > at) add("run-clock", "blocked", "Active run timestamps unavailable or future-dated");
    else if (at - started > maxRunMs || at - updated > staleMs) add("run-stale", "fail", "Active blog run exceeded 30 minutes or made no progress for over five minutes");
  }
  if (!realRun) add("run-evidence", firstRun ? "warn" : "fail", "Empty/invalid runKey, progress or attempt count is not completed automation evidence");
  if (firstRun) add("first-run", "warn", "No eligible weekly deadline has elapsed since task creation; publication not yet proven");
  if (latestArticle === undefined) add("publication", "blocked", "Published automated article read unavailable");
  else if (!firstRun) {
    const published = time(latestArticle?.publishedAt);
    const automated = latestArticle?.tags?.split(",").map(tag => tag.trim()).includes(AUTOMATED_BLOG_TAG);
    if (!latestArticle || Number(latestArticle.published) !== 1 || !automated || !Number.isFinite(published)
      || published < dueSlot || published > at) add("publication-overdue", "fail", `No tagged published automated article since ${new Date(dueSlot).toISOString()} (60-minute grace)`);
    else add("publication", "pass", `Tagged automated article published ${new Date(published).toISOString()}`);
  }
  return finish();
}
