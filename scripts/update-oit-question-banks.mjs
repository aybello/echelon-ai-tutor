import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { applyOitRevision } from "./lib/oitRevision.mjs";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
if (args.some(arg => !["--database", "--apply"].includes(arg))) throw new Error("Use --database for reconciliation or --apply for the exact content update.");
execFileSync(process.execPath, [path.join(root, "scripts", "validate-oit-question-banks.mjs")], { cwd: root, stdio: "inherit" });
const manifestBytes = fs.readFileSync(path.join(root, "content", "oit", "manifest.json"));
const manifest = JSON.parse(manifestBytes);
const hash = createHash("sha256").update(manifestBytes);
const payloads = manifest.banks.map(bank => {
  const bytes = fs.readFileSync(path.join(root, "content", "oit", bank.file));
  hash.update(bytes);
  return { ...bank, questions: JSON.parse(bytes) };
});
const payloadChecksum = hash.digest("hex");
const baseline = JSON.parse(fs.readFileSync(path.join(root, "content", "oit", "production-baseline.json"), "utf8"));
console.log(JSON.stringify({ payloadChecksum, baselineChecksum: baseline.baselineChecksum, banks: payloads.map(payload => ({ bankKey: payload.bankKey, count: payload.questions.length })) }));
const apply = args.includes("--apply");
if (apply && process.env.CONFIRM_OIT_CONTENT_UPDATE !== payloadChecksum) throw new Error(`Set CONFIRM_OIT_CONTENT_UPDATE=${payloadChecksum} for this exact package.`);
if (apply && process.env.CONFIRM_OIT_BASELINE !== baseline.baselineChecksum) throw new Error(`Set CONFIRM_OIT_BASELINE=${baseline.baselineChecksum} for the captured production baseline.`);
if (apply && process.env.BACKUP_EVIDENCE_ID !== baseline.baselineChecksum) {
  throw new Error(`Set BACKUP_EVIDENCE_ID=${baseline.baselineChecksum} after verifying the recoverable pre-release snapshot.`);
}
if (!apply && !args.includes("--database")) {
  console.log("Repository validation only. Run --database for production reconciliation.");
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for reconciliation or apply.");
const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const result = await applyOitRevision(connection, payloads, baseline, apply);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) process.exitCode = 1;
} finally {
  await connection.end();
}
