import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { storagePut } from "../server/storage";

const baselinePath = process.env.CLASS1_REPAIR_BASELINE_PATH ?? "/home/ubuntu/class1_complete_repair_release/class1-complete-repair-baseline.json";
const evidencePath = path.join(path.dirname(baselinePath), "class1-complete-repair-baseline.evidence.json");
const bytes = fs.readFileSync(baselinePath);
const snapshotChecksum = createHash("sha256").update(bytes).digest("hex");
const baseline = JSON.parse(bytes.toString("utf8"));
if (!baseline.baselineChecksum || !baseline.repairPackageSha256) throw new Error("Class 1 rollback baseline is incomplete.");
const storageKey = `governed-content-backups/class1/complete-repair/${baseline.baselineChecksum}.json`;
const { key, url } = await storagePut(storageKey, bytes, "application/json");
const evidence = {
  schemaVersion: 1,
  capturedAtUtc: new Date().toISOString(),
  purpose: "Managed rollback evidence for the guarded Class 1 complete-repair release.",
  snapshotChecksum,
  baselineChecksum: baseline.baselineChecksum,
  repairPackageSha256: baseline.repairPackageSha256,
  storageKey: key,
  storageUrl: url,
  expectedBankCounts: baseline.expectedBankCounts,
  affectedAttemptCountTotal: Object.values(baseline.affectedAttemptCounts as Record<string, number>).reduce((sum, count) => sum + count, 0),
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
