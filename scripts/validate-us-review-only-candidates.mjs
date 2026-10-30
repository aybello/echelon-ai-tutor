#!/usr/bin/env node
/**
 * Deterministic structural validation for review-only U.S. candidate batches.
 * This tool never imports, writes to, or queries the database.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json");
const outputRoot = path.join(root, "artifacts/us-review-only-candidates");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];
const batches = [];

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}
function normalizedContent(question) {
  return JSON.stringify({
    question: question.question,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    steps: question.steps,
    tip: question.tip,
    source: question.source ? {
      title: question.source.title,
      url: question.source.url,
      reference: question.source.reference,
    } : null,
  });
}
function validateDraft(route) {
  const filePath = path.join(outputRoot, route.id, "01-draft.json");
  let batch;
  try {
    batch = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${route.id}: invalid or missing JSON (${error.message})`);
    return;
  }
  const questions = Array.isArray(batch.questions) ? batch.questions : [];
  if (batch.routeId !== route.id) errors.push(`${route.id}: routeId mismatch`);
  if (!new Set(["in_review", "held"]).has(batch.status)) errors.push(`${route.id}: top-level status must be in_review or held`);
  if (!Array.isArray(batch.questions)) errors.push(`${route.id}: questions must be an array`);
  if (questions.length === 0) {
    if (batch.status !== "held") errors.push(`${route.id}: zero-candidate artifact must have held status`);
    if (!batch.holdReason && !batch.packageNotes) errors.push(`${route.id}: zero-candidate hold needs a reason`);
    batches.push({ routeId: route.id, status: "held", questionCount: 0, path: filePath });
    return;
  }
  if (questions.length !== 25) errors.push(`${route.id}: expected 25 candidates, got ${questions.length}`);
  const ids = new Set();
  const stems = new Set();
  const answerCounts = [0, 0, 0, 0];
  for (const [index, question] of questions.entries()) {
    const prefix = `${route.id}-review-`;
    if (typeof question.candidateId !== "string" || !question.candidateId.startsWith(prefix)) errors.push(`${route.id}[${index}]: invalid candidateId`);
    if (ids.has(question.candidateId)) errors.push(`${route.id}[${index}]: duplicate candidateId`);
    ids.add(question.candidateId);
    if (typeof question.question !== "string" || !question.question.trim()) errors.push(`${route.id}[${index}]: empty question`);
    const stem = (question.question || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (stems.has(stem)) errors.push(`${route.id}[${index}]: duplicate question stem`);
    stems.add(stem);
    if (!Array.isArray(question.options) || question.options.length !== 4 || new Set(question.options.map((x) => String(x).trim().toLowerCase())).size !== 4 || question.options.some((x) => !String(x).trim())) errors.push(`${route.id}[${index}]: options must be four distinct non-empty strings`);
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) errors.push(`${route.id}[${index}]: invalid correctIndex`);
    else answerCounts[question.correctIndex] += 1;
    if (!question.explanation || !String(question.explanation).trim()) errors.push(`${route.id}[${index}]: empty explanation`);
    if (!Array.isArray(question.steps)) errors.push(`${route.id}[${index}]: steps must be an array`);
    if (!question.source || !question.source.title || !question.source.issuer || !question.source.url || !question.source.reference || !question.source.retrievedAt || !question.source.jurisdiction || !question.source.supportedClaim) errors.push(`${route.id}[${index}]: incomplete source record`);
    else { try { new URL(question.source.url); } catch { errors.push(`${route.id}[${index}]: invalid source URL`); } }
    if (!question.author || question.author.provider !== "manus_native" || question.author.role !== "drafting") errors.push(`${route.id}[${index}]: invalid author provenance`);
    if (!question.review || question.review.status !== "pending_independent_review") errors.push(`${route.id}[${index}]: missing pending independent-review state`);
    if (question.reviewStatus !== "in_review") errors.push(`${route.id}[${index}]: reviewStatus must be in_review`);
    if (!isSha256(question.contentHash)) errors.push(`${route.id}[${index}]: invalid contentHash`);
    else {
      const expected = crypto.createHash("sha256").update(normalizedContent(question)).digest("hex");
      if (question.contentHash !== expected) errors.push(`${route.id}[${index}]: contentHash mismatch`);
    }
  }
  if (Math.max(...answerCounts) - Math.min(...answerCounts) > 1) errors.push(`${route.id}: correct-index distribution is unbalanced (${answerCounts.join("/")})`);
  batches.push({ routeId: route.id, status: "drafted", questionCount: questions.length, answerDistribution: answerCounts, path: filePath });
}
for (const route of manifest.selected) validateDraft(route);
const report = { schemaVersion: "1.0", manifestPath, candidateTarget: manifest.selected.length * manifest.perBankCandidateCount, batches, errorCount: errors.length, errors };
const reportPath = path.join(outputRoot, "structural-validation-01.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, batchCount: batches.length, drafted: batches.filter((b) => b.status === "drafted").length, candidateCount: batches.reduce((sum, batch) => sum + batch.questionCount, 0), errorCount: errors.length }, null, 2));
if (errors.length) process.exitCode = 1;
