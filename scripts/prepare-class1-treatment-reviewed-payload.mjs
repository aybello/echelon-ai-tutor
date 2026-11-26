import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const repo = resolve(import.meta.dirname, "..");
const contentRoot = `${repo}/content/class1-treatment`;
const reviewedRoot = "/home/ubuntu/class1_treatment_release_payload";
const remediationRoot = "/home/ubuntu/class1_treatment_hold_remediation";
const banks = [
  { key: "class1-water", name: "water", file: "questions/water-250.json" },
  { key: "class1-wastewater", name: "wastewater", file: "questions/wastewater-250.json" },
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

await mkdir(`${contentRoot}/audit`, { recursive: true });
await cp(`${reviewedRoot}/water-250.json`, `${contentRoot}/questions/water-250.json`);
await cp(`${reviewedRoot}/wastewater-250.json`, `${contentRoot}/questions/wastewater-250.json`);
await cp(`${reviewedRoot}/release-ledger.json`, `${contentRoot}/audit/independent-release-ledger.json`);
await cp(`${reviewedRoot}/payload-validation.json`, `${contentRoot}/audit/payload-validation.json`);
await cp(`${remediationRoot}/external_evidence.md`, `${contentRoot}/audit/external-evidence.md`);

const entries = [];
for (const bank of banks) {
  const bytes = await readFile(`${contentRoot}/${bank.file}`);
  const questions = JSON.parse(bytes.toString("utf8"));
  const answerPositions = [0, 1, 2, 3].map((index) => questions.filter((question) => question.correctIndex === index).length);
  entries.push({
    bankKey: bank.key,
    file: bank.file,
    sha256: sha256(bytes),
    count: questions.length,
    conceptual: questions.filter((question) => question.isCalc !== "yes").length,
    calculations: questions.filter((question) => question.isCalc === "yes").length,
    canonicalAnswerPositions: answerPositions,
  });
}
const manifest = {
  version: "2026-09-11-v2-independently-cleared",
  status: "independently-cleared-release-candidate",
  releaseMode: "additive-exact-batch-after-full-live-bank-reconciliation",
  numberRange: { start: 2001, end: 2250 },
  individualApprovalRequired: false,
  productionWrites: false,
  reviewSummary: {
    initialIndependentApproval: 465,
    firstRemediationIndependentApproval: 22,
    finalRemediationIndependentApproval: 13,
    finalClearedCount: 500,
    auditLedger: "audit/independent-release-ledger.json",
    sourceEvidence: "audit/external-evidence.md",
  },
  banks: entries,
};
await writeFile(`${contentRoot}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ manifest, status: "prepared" }, null, 2));
