import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { storagePut } from "../server/storage";

const root = path.resolve(import.meta.dirname, "..");
const baselinePath = path.join(root, "content", "oit", "production-baseline.json");
const evidencePath = path.join(root, "content", "oit", "production-baseline.evidence.json");
const bytes = fs.readFileSync(baselinePath);
const payloadChecksum = createHash("sha256").update(bytes).digest("hex");
const baseline = JSON.parse(bytes.toString("utf8"));

if (!baseline.baselineChecksum) throw new Error("The rollback snapshot is missing its baseline checksum.");
const storageKey = `governed-content-backups/oit/2026-09-09/production-baseline-${payloadChecksum}.json`;
const { key, url } = await storagePut(storageKey, bytes, "application/json");
const evidence = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  purpose: "Pre-update rollback snapshot for the checksum-gated OIT conceptual-question revision.",
  snapshotChecksum: payloadChecksum,
  baselineChecksum: baseline.baselineChecksum,
  storageKey: key,
  storageUrl: url,
  banks: baseline.banks.map((bank: { bankKey: string; count: number }) => ({ bankKey: bank.bankKey, count: bank.count })),
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
