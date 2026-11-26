import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { storagePut } from "../server/storage";

const baselinePath = process.env.CLASS1_TREATMENT_IMPORT_BASELINE_PATH ?? "/home/ubuntu/class1_treatment_import_release/class1-treatment-import-baseline.json";
const evidencePath = path.join(path.dirname(baselinePath), "class1-treatment-import-baseline.evidence.json");
const bytes = fs.readFileSync(baselinePath);
const snapshotChecksum = createHash("sha256").update(bytes).digest("hex");
const baseline = JSON.parse(bytes.toString("utf8"));
if (!baseline.baselineChecksum || !baseline.packageChecksum || !baseline.questionSnapshotChecksum || !baseline.metadataSnapshotChecksum || !baseline.attemptSnapshotChecksum) {
  throw new Error("Class 1 Treatment import rollback baseline is incomplete.");
}
const storageKey = `governed-content-backups/class1/treatment-import/${baseline.baselineChecksum}.json`;
const { key, url } = await storagePut(storageKey, bytes, "application/json");
const evidence = {
  schemaVersion: 1,
  capturedAtUtc: new Date().toISOString(),
  purpose: "Managed rollback evidence for the guarded Class 1 Water Treatment and Wastewater Treatment additive import.",
  snapshotChecksum,
  baselineChecksum: baseline.baselineChecksum,
  packageChecksum: baseline.packageChecksum,
  storageKey: key,
  storageUrl: url,
  expectedBankCounts: baseline.expectedBankCounts,
  visibleCounts: baseline.visibleCounts,
  attemptCountTotal: Object.values(baseline.attemptsByQuestionId as Record<string, number>).reduce((sum, count) => sum + count, 0),
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
