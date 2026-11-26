import fs from "node:fs";
import path from "node:path";
import { applyHistoricalSubsetRevision } from "./lib/historicalOitSubsetRevision.mjs";

const args = process.argv.slice(2);
if (args.some((arg) => !["--database", "--apply"].includes(arg))) throw new Error("Use --database for read-only reconciliation or --apply for the guarded historical approved-subset update.");
const root = path.resolve(import.meta.dirname, "..");
const payloadPath = process.env.HISTORICAL_OIT_SUBSET_PAYLOAD ?? "/home/ubuntu/historical_oit_unresolved_review/approved_subset_release_worklist/staged_release_payload.json";
const baselinePath = path.join(root, "content", "oit", "historical-approved-subset-baseline.json");
const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
console.log(JSON.stringify({ payloadChecksum: payload.payloadChecksum, baselineChecksum: baseline.baselineChecksum, candidates: payload.counts }, null, 2));
const apply = args.includes("--apply");
if (apply && process.env.CONFIRM_HISTORICAL_OIT_SUBSET !== payload.payloadChecksum) throw new Error(`Set CONFIRM_HISTORICAL_OIT_SUBSET=${payload.payloadChecksum} for this exact staged payload.`);
if (apply && process.env.CONFIRM_HISTORICAL_OIT_BASELINE !== baseline.baselineChecksum) throw new Error(`Set CONFIRM_HISTORICAL_OIT_BASELINE=${baseline.baselineChecksum} for the captured baseline.`);
if (apply && process.env.BACKUP_EVIDENCE_ID !== baseline.baselineChecksum) throw new Error(`Set BACKUP_EVIDENCE_ID=${baseline.baselineChecksum} after verifying managed rollback evidence.`);
if (!apply && !args.includes("--database")) { console.log("Repository-only validation. Run --database for production reconciliation."); process.exit(0); }
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for reconciliation or apply.");
const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const result = await applyHistoricalSubsetRevision(connection, payload, baseline, apply);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) process.exitCode = 1;
} finally {
  await connection.end();
}
