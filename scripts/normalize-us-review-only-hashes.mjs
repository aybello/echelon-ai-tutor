#!/usr/bin/env node
/**
 * Metadata-only normalizer for review-only U.S. candidate-package hashes.
 * It changes only contentHash values using the canonical algorithm declared in
 * US_FIRST_REVIEW_ONLY_AUTHORING_CONTRACT_2026-10-29.md. It never writes to a
 * database and never modifies learner-visible content, sources, or review status.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json"), "utf8"));
const outputRoot = path.join(root, "artifacts/us-review-only-candidates");
const changes = [];
const canonicalPayload = (question) => ({
  question: question.question,
  options: question.options,
  correctIndex: question.correctIndex,
  explanation: question.explanation,
  steps: question.steps,
  tip: question.tip,
  source: {
    title: question.source.title,
    url: question.source.url,
    reference: question.source.reference,
  },
});
for (const route of manifest.selected) {
  const filePath = path.join(outputRoot, route.id, "01-draft.json");
  const batch = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(batch.questions) || batch.questions.length === 0) continue;
  for (const question of batch.questions) {
    const oldHash = question.contentHash;
    const newHash = crypto.createHash("sha256").update(JSON.stringify(canonicalPayload(question))).digest("hex");
    if (oldHash !== newHash) {
      question.contentHash = newHash;
      changes.push({ routeId: route.id, candidateId: question.candidateId, oldHash, newHash });
    }
  }
  fs.writeFileSync(filePath, `${JSON.stringify(batch, null, 2)}\n`);
}
const audit = {
  schemaVersion: "1.0",
  action: "canonical_content_hash_normalization",
  contractPath: "docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_CONTRACT_2026-10-29.md",
  changedHashCount: changes.length,
  changes,
  guarantee: "Only contentHash metadata changed; no learner-visible field, source record, author record, review record, route identity, or status changed.",
};
const auditPath = path.join(outputRoot, "hash-normalization-01.json");
fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ auditPath, changedHashCount: changes.length }, null, 2));
