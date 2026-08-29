import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { importOitPayloads } from "./lib/oitImporter.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(repoRoot, "content", "oit", "manifest.json");
const validatorPath = path.join(repoRoot, "scripts", "validate-oit-question-banks.mjs");
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const payloads = manifest.banks.map(bank => {
  const filePath = path.join(repoRoot, "content", "oit", bank.file);
  const bytes = fs.readFileSync(filePath);
  return { ...bank, bytes, questions: JSON.parse(bytes) };
});

execFileSync(process.execPath, [validatorPath], { cwd: repoRoot, stdio: "inherit" });

const checksum = createHash("sha256")
  .update(manifestBytes)
  .update(payloads.map(payload => payload.bytes).reduce((combined, bytes) => Buffer.concat([combined, bytes]), Buffer.alloc(0)))
  .digest("hex");
const apply = process.argv.includes("--apply");

console.log(`OIT import plan ${checksum.slice(0, 12)}: 500 water + 500 wastewater questions.`);
console.log("Mode: additive question numbers 1001-1500; existing lower-numbered questions and historical attempts are unchanged.");

if (!apply) {
  console.log("Dry run complete. Database was not contacted.");
  console.log(`To apply this exact payload, set CONFIRM_OIT_IMPORT=${checksum} and pass --apply.`);
  process.exit(0);
}

if (process.env.CONFIRM_OIT_IMPORT !== checksum) {
  throw new Error(`Apply blocked. Set CONFIRM_OIT_IMPORT=${checksum} to confirm this exact validated payload.`);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --apply.");

const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const result = await importOitPayloads({ connection, payloads });
  console.log(`OIT import complete: ${result.inserted} new questions staged transactionally for individual approval.`);
} catch (error) {
  throw error;
} finally {
  await connection.end();
}
