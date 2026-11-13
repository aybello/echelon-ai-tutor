import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { storagePut } from "../server/storage";

const root = path.resolve(import.meta.dirname, "..");
const baselinePath = path.join(root, "content", "oit", "historical-approved-subset-baseline.json");
const evidencePath = path.join(root, "content", "oit", "historical-approved-subset-baseline.evidence.json");
const bytes = fs.readFileSync(baselinePath);
const snapshotChecksum = createHash("sha256").update(bytes).digest("hex");
const baseline = JSON.parse(bytes.toString("utf8"));
if (!baseline.baselineChecksum || !baseline.stagedPayloadChecksum) throw new Error("Historical subset baseline is incomplete.");
const storageKey = `governed-content-backups/oit/historical-approved-subset/${baseline.baselineChecksum}.json`;
const { key, url } = await storagePut(storageKey, bytes, "application/json");
const evidence = { schemaVersion: 1, capturedAtUtc: new Date().toISOString(), purpose: "Pre-update rollback snapshot for the 62-item approved historical OIT subset revision.", snapshotChecksum, baselineChecksum: baseline.baselineChecksum, stagedPayloadChecksum: baseline.stagedPayloadChecksum, storageKey: key, storageUrl: url, entries: baseline.entries.length, bankCounts: baseline.entries.reduce((acc: Record<string, number>, entry: { bankKey: string }) => ({ ...acc, [entry.bankKey]: (acc[entry.bankKey] ?? 0) + 1 }), {}) };
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
