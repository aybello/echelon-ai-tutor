import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { loadClass1NetworksPackage } from "./lib/class1TreatmentImporter.mjs";
import { releaseClass1NetworksPackage } from "./lib/class1TreatmentRelease.mjs";

const mode = process.argv[2] ?? "check";
if (!new Set(["check", "preflight", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/release-class1-treatment.mjs [check|preflight|apply]");
}
const packageInfo = loadClass1NetworksPackage();
const releaseDirectory = process.env.CLASS1_TREATMENT_RELEASE_DIR ?? "/home/ubuntu/class1_treatment_promotion_release";
const writeResult = (name, result) => {
  fs.mkdirSync(releaseDirectory, { recursive: true });
  const outputPath = path.join(releaseDirectory, name);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return outputPath;
};

console.log(`Class 1 Treatment promotion package ${packageInfo.checksum}: 250 Water Treatment + 250 Wastewater Treatment staged candidates.`);
if (mode === "check") {
  console.log("Package validation passed. No database connection or status change was attempted.");
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for preflight or apply.");
if (mode === "apply" && process.env.CONFIRM_CLASS1_TREATMENT_RELEASE !== packageInfo.checksum) {
  throw new Error(`Apply blocked. Set CONFIRM_CLASS1_TREATMENT_RELEASE=${packageInfo.checksum} to promote this exact package.`);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const result = await releaseClass1NetworksPackage({
    connection,
    payloads: packageInfo.payloads,
    checksum: packageInfo.checksum,
    apply: mode === "apply",
  });
  const outputPath = writeResult(
    mode === "apply" ? "class1-treatment-promotion-apply-result.json" : "class1-treatment-promotion-preflight.json",
    { capturedAtUtc: new Date().toISOString(), ...result },
  );
  console.log(JSON.stringify({ outputPath, applied: result.applied ?? false, state: result.state ?? result.after?.state, errors: result.errors ?? [], checksum: packageInfo.checksum }, null, 2));
} finally {
  await connection.end();
}
