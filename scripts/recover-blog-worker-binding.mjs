#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify, parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";
import { blogHeartbeatEnv } from "./lib/blogAutomationHealth.mjs";
import { CONTRACT, field, recoverBinding, validNewUid, journalPath, verifyJobs } from "./lib/blogBindingRecovery.mjs";

export function authoritativeConnection(env) {
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === "0" || env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== "true")
    throw new Error("Explicit authoritative external target and verified TLS required");
  const selected = activeScriptConnection(env);
  if (!selected.external || selected.options.ssl?.rejectUnauthorized !== true)
    throw new Error("Authoritative certificate-verified TLS required");
  return { ...selected.options, dateStrings: true, multipleStatements: false };
}
export async function listJobs(env, run = promisify(execFile)) {
  // Full official list, no --user-id override, no mutations, no shell, no credential logging.
  const jobs = []; let total;
  for (let page = 1; page <= 100; page++) {
    let data;
    try {
      const { stdout } = await run("manus-heartbeat", ["list", "--page", String(page), "--page-size", "200"],
        { env: blogHeartbeatEnv(env, env.HOME), timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
      data = JSON.parse(stdout);
    } catch { throw new Error("Official Heartbeat list unavailable or malformed; no changes made"); }
    const owner = field(data, "actorUserId", "actor_user_id");
    if (owner !== CONTRACT.owner || !Number.isInteger(data.total) || data.total < 0 || !Array.isArray(data.jobs)
      || (total !== undefined && total !== data.total)) throw new Error("Incomplete, unstable or wrong-owner Heartbeat list");
    total = data.total;
    if (data.jobs.length !== Math.min(200, total - jobs.length)) throw new Error("Heartbeat pagination incomplete");
    jobs.push(...data.jobs);
    if (jobs.length === total) return { jobs, total, actorUserId: owner };
  }
  throw new Error("Heartbeat pagination bound exceeded; inspect manually");
}
export function argumentsFor(args) {
  const { values } = parseArgs({ args, options: {
    "expected-new-worker": { type: "string" }, apply: { type: "boolean", default: false },
    plan: { type: "boolean", default: false }, "journal-file": { type: "string" },
    "env-file": { type: "string" }, help: { type: "boolean", default: false },
  } });
  if (values.help) return values;
  validNewUid(values["expected-new-worker"]);
  if (values.apply && values.plan) throw new Error("Choose --plan or --apply, not both");
  if (values.apply && !values["journal-file"]) throw new Error("--apply requires an exclusive private --journal-file");
  if (values["journal-file"]) journalPath(values["journal-file"]);
  return values;
}
export async function main(args = process.argv.slice(2)) {
  const values = argumentsFor(args);
  if (values.help) {
    console.log("Usage: node scripts/recover-blog-worker-binding.mjs --expected-new-worker EXACT_UID [--plan | --apply --journal-file /home/ubuntu/private/echelon-authoritative-recovery/blog-binding/NEW.json] [--env-file /absolute/app.env]\nDefault is read-only. No automatic dotenv, scheduler mutations, callback calls, publication or requeue.");
    return;
  }
  let env = { ...process.env };
  if (values["env-file"]) {
    if (!values["env-file"].startsWith("/")) throw new Error("--env-file must be explicit absolute path");
    const { readFile } = await import("node:fs/promises");
    const { parse } = await import("dotenv");
    // Explicit app file is authoritative for app DB variables; do not mutate process.env.
    env = { ...env, ...parse(await readFile(values["env-file"])) };
  }
  const options = authoritativeConnection(env);
  const snapshot = await listJobs(process.env);
  verifyJobs(snapshot, values["expected-new-worker"]);
  const { default: mysql } = await import("mysql2/promise");
  let connection;
  try {
    connection = await mysql.createConnection(options);
    await connection.query("SET time_zone = '+00:00'");
    const independentRead = async () => {
      const check = await mysql.createConnection(options);
      try {
        await check.query("SET time_zone = '+00:00'");
        await check.query("SET SESSION TRANSACTION READ ONLY");
        const [rows] = await check.query("SELECT * FROM blog_automation_runs");
        return rows;
      } finally { await check.end(); }
    };
    const result = await recoverBinding({ connection, independentRead, snapshot,
      newUid: values["expected-new-worker"], apply: values.apply, journalFile: values["journal-file"] });
    console.log(JSON.stringify(result, null, 2));
  } finally { if (connection) await connection.end().catch(() => { /* cleanup must not mask COMMIT outcome */ }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  // Only controlled errors are exposed; connection/driver/env errors may contain credentials.
  console.error(error.name === "CommitOutcomeAmbiguous" || error.name === "RecoveryStopped"
    ? error.message : "Recovery blocked before a verified result; inspect configuration/arguments and private state. No automatic retry.");
  process.exitCode = 1;
});
