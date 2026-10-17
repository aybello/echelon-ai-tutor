#!/usr/bin/env node
import path from "node:path";
import { lstat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";
import { DEFAULT_OIT_REPAIR_BACKUP_ROOT, writeDurableOitRepairBackup } from "./lib/oitReportedItemBackup.mjs";
import { applyPublicQuestionCorrection, PUBLIC_QUESTION_CORRECTION_VERSION } from "./lib/publicQuestionCorrection.mjs";

export function parseRepairArguments(args) {
  const { values } = parseArgs({ args: args.filter(arg => arg !== "--"), options: {
    apply: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
    "expected-plan-sha256": { type: "string" },
    "backup-file": { type: "string" },
  } });
  if (values.help) return values;
  if (values.apply && (!/^[a-f0-9]{64}$/.test(values["expected-plan-sha256"] ?? "") || !values["backup-file"])) throw new Error("--apply requires a reviewed --expected-plan-sha256 and a new private --backup-file.");
  if (!values.apply && (values["expected-plan-sha256"] || values["backup-file"])) throw new Error("Plan hashes and backup paths are apply-only arguments.");
  if (values["backup-file"]) {
    values["backup-file"] = path.resolve(values["backup-file"]);
    if (path.dirname(values["backup-file"]) !== DEFAULT_OIT_REPAIR_BACKUP_ROOT || !/^[a-z0-9][a-z0-9._-]*\.json$/i.test(path.basename(values["backup-file"]))) throw new Error("--backup-file must be a direct new .json file in the managed private backup directory.");
  }
  return values;
}

export function authoritativeRepairConnection(env = process.env) {
  if (env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== "true") throw new Error("Explicit DATABASE_CUTOVER_USE_EXTERNAL_TARGET=true is required.");
  const selected = activeScriptConnection(env);
  const trustedTLS = selected.options?.ssl?.rejectUnauthorized === true && typeof selected.options.ssl.ca === "string" && selected.options.ssl.ca.includes("BEGIN CERTIFICATE");
  if (!selected.external || !trustedTLS || selected.options.database !== env.DATABASE_CUTOVER_TARGET_DATABASE) throw new Error("Refusing correction without the authoritative target and trusted TLS.");
  return selected;
}

export async function main(args = process.argv.slice(2)) {
  const values = parseRepairArguments(args);
  if (values.help) {
    console.log("Usage: node scripts/repair-public-question-items.mjs [--apply --expected-plan-sha256 SHA256 --backup-file PRIVATE_NEW_JSON]\nDefault: read-only plan. Arithmetic and serialization correction only. Historical attempts and review status remain untouched.");
    return;
  }
  const selected = authoritativeRepairConnection();
  const backupFile = values["backup-file"];
  if (backupFile) {
    // This preflight is informative only. O_EXCL in the durable helper is authoritative.
    const exists = await lstat(backupFile).then(() => true, error => { if (error.code === "ENOENT") return false; throw error; });
    if (exists) throw new Error("Backup file already exists. Choose a new private file.");
  }
  // This dependency is supplied by the independently reviewed content commit.
  const { corrections } = await import("./content/plan-public-question-corrections.mjs");
  const { default: mysql } = await import("mysql2/promise");
  const connection = await mysql.createConnection(selected.options);
  try {
    const result = await applyPublicQuestionCorrection(connection, {
      apply: values.apply, corrections,
      expectedPlanHash: values["expected-plan-sha256"],
      backup: values.apply ? payload => writeDurableOitRepairBackup({ backupFile, payload }) : undefined,
    });
    console.log(JSON.stringify({ mode: values.apply ? "apply" : "read-only-plan", repairVersion: PUBLIC_QUESTION_CORRECTION_VERSION,
      ready: result.ready, applied: result.applied, alreadyApplied: result.alreadyApplied, planHash: result.planHash,
      postApplyPlanHash: result.postApplyPlanHash, errors: result.errors,
      changes: result.changes.map(({ expected, replacement }) => ({ id: expected.id, bankKey: expected.bankKey, questionNum: expected.questionNum, fields: Object.keys(replacement).sort() })),
      unchanged: result.unchanged, historicalAttemptsChanged: false,
    }, null, 2));
    if (!result.ready) process.exitCode = 1;
  } finally { await connection.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  console.error(`Public question correction failed: ${error.message}`);
  process.exitCode = 1;
});
