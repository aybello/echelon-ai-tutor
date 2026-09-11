import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { createBaseline, loadClass1NetworksPackage, planClass1NetworksImport, readClass1NetworksProductionSnapshot, stageClass1NetworksPackage } from "./lib/class1NetworksImporter.mjs";

const mode = process.argv[2] ?? "check";
if (!new Set(["check", "preflight", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/import-class1-networks.mjs [check|preflight|apply]");
}
const packageInfo = loadClass1NetworksPackage();
const releaseDirectory = process.env.CLASS1_NETWORKS_IMPORT_RELEASE_DIR ?? "/home/ubuntu/class1_networks_import_release";
const writeResult = (name, result) => {
  fs.mkdirSync(releaseDirectory, { recursive: true });
  const outputPath = path.join(releaseDirectory, name);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return outputPath;
};

console.log(`Class 1 candidate package ${packageInfo.checksum}: 250 Distribution + 250 Collection questions in additive range 2001–2250.`);
if (mode === "check") {
  console.log("Package validation passed. No database connection or production write was attempted.");
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for preflight or apply.");
if (mode === "apply" && process.env.CONFIRM_CLASS1_NETWORKS_IMPORT !== packageInfo.checksum) {
  throw new Error(`Apply blocked. Set CONFIRM_CLASS1_NETWORKS_IMPORT=${packageInfo.checksum} to confirm this exact package.`);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  if (mode === "preflight") {
    await connection.beginTransaction();
    const snapshot = await readClass1NetworksProductionSnapshot({ connection });
    const plan = planClass1NetworksImport({ payloads: packageInfo.payloads, rows: snapshot.rows, metadata: snapshot.metadata });
    const result = { mode: "read_only_preflight", capturedAtUtc: new Date().toISOString(), packageChecksum: packageInfo.checksum,
      proposedCounts: Object.fromEntries(plan.banks.map((bank) => [bank.bankKey, bank.expectedStagedCount])), plan,
      candidateBaseline: createBaseline({ checksum: packageInfo.checksum, ...snapshot }) };
    await connection.rollback();
    const outputPath = writeResult("class1-networks-import-preflight.json", result);
    console.log(JSON.stringify({ outputPath, ready: plan.ready, state: plan.state, errors: plan.errors, proposedCounts: result.proposedCounts }, null, 2));
  } else {
    const baselinePath = process.env.CLASS1_NETWORKS_IMPORT_BASELINE_PATH ?? path.join(releaseDirectory, "class1-networks-import-baseline.json");
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    const result = await stageClass1NetworksPackage({ connection, payloads: packageInfo.payloads, checksum: packageInfo.checksum, baseline });
    const outputPath = writeResult("class1-networks-import-apply-result.json", result);
    console.log(JSON.stringify({ outputPath, applied: result.applied, mode: result.mode, checksum: result.checksum, baselineChecksum: result.baselineChecksum }, null, 2));
  }
} finally {
  await connection.end();
}
