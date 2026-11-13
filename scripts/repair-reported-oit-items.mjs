#!/usr/bin/env node
import path from "node:path";
import { parseArgs } from "node:util";
import mysql from "mysql2/promise";
import { activeDatabaseSettings } from "../server/db.ts";
import { databasePoolOptions } from "../server/_core/databaseTls.ts";
import {
  DEFAULT_OIT_REPAIR_BACKUP_ROOT,
  writeDurableOitRepairBackup,
} from "./lib/oitReportedItemBackup.mjs";
import {
  applyReportedOitItemRepair,
  OIT_REPORTED_ITEM_REPAIR_VERSION,
} from "./lib/oitReportedItemRepair.mjs";

const { values } = parseArgs({
  args: process.argv.slice(2).filter(argument => argument !== "--"),
  options: {
    apply: { type: "boolean", default: false },
    "expected-plan-sha256": { type: "string" },
    "backup-file": { type: "string" },
  },
});

const apply = values.apply;
if (apply && (!values["expected-plan-sha256"] || !values["backup-file"])) {
  throw new Error("--apply requires a reviewed --expected-plan-sha256 and a new private --backup-file.");
}
if (process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== "true") {
  throw new Error("Refusing to run outside the selected authoritative external database target.");
}

const settings = activeDatabaseSettings();
if (settings.label !== "external MySQL") {
  throw new Error("Refusing to run outside the authoritative external database target.");
}
if (settings.requireTls !== true || !settings.caCertificate?.includes("BEGIN CERTIFICATE")) {
  throw new Error("Refusing OIT repair without certificate-verified TLS and a trusted private CA.");
}

const backupFile = values["backup-file"] ? path.resolve(values["backup-file"]) : undefined;
if (backupFile && path.dirname(backupFile) !== DEFAULT_OIT_REPAIR_BACKUP_ROOT) {
  throw new Error("--backup-file must be a direct file in the managed private OIT repair backup directory.");
}

const connectionOptions = databasePoolOptions(settings.connectionString, {
  caCertificate: settings.caCertificate,
  requireTls: settings.requireTls,
  connectTimeout: 15_000,
});
if (!connectionOptions.ssl || connectionOptions.ssl.rejectUnauthorized !== true || !connectionOptions.ssl.ca) {
  throw new Error("Refusing OIT repair because certificate verification is not active.");
}
const connection = await mysql.createConnection(connectionOptions);

try {
  const result = await applyReportedOitItemRepair(connection, {
    apply,
    expectedPlanHash: values["expected-plan-sha256"],
    backup: apply ? async ({ repairVersion, planHash, rows, metadataBefore }) => {
      await writeDurableOitRepairBackup({
        backupFile,
        payload: {
          savedAtUtc: new Date().toISOString(),
          repairVersion,
          planHash,
          rows,
          metadataBefore,
        },
      });
    } : undefined,
  });

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    repairVersion: OIT_REPORTED_ITEM_REPAIR_VERSION,
    ready: result.ready,
    applied: result.applied ?? false,
    alreadyApplied: result.alreadyApplied ?? false,
    planHash: result.planHash,
    postApplyPlanHash: result.postApplyPlanHash,
    errors: result.errors,
    changes: result.changes.map(change => ({ bankKey: change.bankKey, questionNum: change.questionNum })),
    unchanged: result.unchanged,
  }, null, 2));
} finally {
  await connection.end();
}
