import assert from "node:assert/strict";
import test from "node:test";
import { hashWpiNewQuestionRows, hashWpiQuestionRows } from "../lib/wpiClass4Release.mjs";
import {
  APPROVED_ARCHIVE_SHA256,
  BANK_KEY,
  PLANNED_METADATA,
  REVIEW_ACTOR,
  buildReleasePlan,
  validateApprovedPackage,
} from "./releaseWpiClass4Treatment.mjs";

function question(questionNum, id, revision = "before", reviewStatus = "unreviewed") {
  const position = questionNum >= 2001 ? questionNum - 2001 : questionNum - 1;
  const module = [
    "Equipment Evaluation, Maintenance & Operation",
    "Treatment Process Evaluation & Adjustment",
    "Laboratory Analysis",
    "Security, Safety & Administrative Procedures",
  ][position % 4];
  return {
    id,
    bankKey: BANK_KEY,
    questionNum,
    module,
    difficulty: revision === "before" ? "medium" : "hard",
    question: `${revision} Class IV operating scenario ${questionNum}`,
    options: JSON.stringify(["Option one", "Option two", "Option three", "Option four"]),
    correctIndex: position % 4,
    explanation: `${revision} worked explanation for ${questionNum}`,
    steps: JSON.stringify([]),
    tip: null,
    isCalc: Math.floor(position / 8) % 3 === 0 ? "yes" : "no",
    topic: `topic-${position % 12}`,
    cognitiveLevel: Math.floor(position / 4) % 2 === 0 ? "recall" : "application",
    sourceTitle: "Reviewed source",
    sourceReference: "Section 1",
    sourceUrl: "https://example.test/source",
    blueprintObjective: `objective-${position % 20}`,
    reviewStatus,
    reviewedBy: null,
    reviewedAt: null,
  };
}

function fixture() {
  const baselineRows = Array.from({ length: 657 }, (_, i) => question(i + 1, 45_000 + i));
  const existingRows = baselineRows.map(row => question(row.questionNum, row.id, "after"));
  const additionRows = Array.from({ length: 250 }, (_, i) => question(2001 + i, null, "new", "in_review"));
  const baselineSha256 = hashWpiQuestionRows(baselineRows);
  const manifest = {
    targetBankKey: BANK_KEY,
    sourcePackageBaselineRowsSha256: baselineSha256,
    existingRowsSha256: hashWpiQuestionRows(existingRows),
    newRowsSha256: hashWpiNewQuestionRows(additionRows),
    promotedNewRowsSha256: hashWpiNewQuestionRows(additionRows.map(row => ({ ...row, reviewStatus: "approved" }))),
  };
  const approved = validateApprovedPackage(
    { archiveSha256: APPROVED_ARCHIVE_SHA256, manifest, baselineRows, existingRows, additionRows },
    { baselineSha256 },
  );
  const currentRows = baselineRows.slice(0, 606).map((row, index) => ({
    ...row,
    id: 90_000 + index,
    reviewStatus: "in_review",
    reviewedBy: null,
    reviewedAt: null,
  }));
  return { approved, currentRows };
}

test("reconciles the 606 clean rows to the reviewed 657+250 package", () => {
  const { approved, currentRows } = fixture();
  const plan = buildReleasePlan(currentRows, null, approved);
  assert.equal(plan.status, "ready");
  assert.equal(plan.updates.length, 606);
  assert.equal(plan.missingExisting.length, 51);
  assert.equal(plan.inserts.length, 301);
  assert.equal(plan.beforeMatches, 606);
  assert.equal(plan.afterMatches, 0);
  assert.equal(plan.updates[0].id, currentRows[0].id);
  assert.equal(plan.updates[0].after.id, currentRows[0].id);
  assert.equal(plan.updates[0].after.question, "after Class IV operating scenario 1");
  assert.match(plan.confirmationDigest, /^[a-f0-9]{64}$/);
});

test("accepts staged rows that already contain the reviewed final content", () => {
  const { approved, currentRows } = fixture();
  const finalOne = approved.existing.get(1);
  currentRows[0] = { ...currentRows[0], ...finalOne, id: currentRows[0].id, reviewStatus: "in_review", reviewedBy: null, reviewedAt: null };
  const plan = buildReleasePlan(currentRows, null, approved);
  assert.equal(plan.beforeMatches, 605);
  assert.equal(plan.afterMatches, 1);
});

test("blocks an unreviewed or drifted clean row", () => {
  const { approved, currentRows } = fixture();
  currentRows[12] = { ...currentRows[12], question: "Unexpected drift" };
  assert.throws(() => buildReleasePlan(currentRows, null, approved), /matches neither/);
});

test("blocks a different private archive", () => {
  const baselineRows = Array.from({ length: 657 }, (_, i) => question(i + 1, 45_000 + i));
  const existingRows = baselineRows.map(row => question(row.questionNum, row.id, "after"));
  const additionRows = Array.from({ length: 250 }, (_, i) => question(2001 + i, null, "new", "in_review"));
  const baselineSha256 = hashWpiQuestionRows(baselineRows);
  const manifest = {
    targetBankKey: BANK_KEY,
    sourcePackageBaselineRowsSha256: baselineSha256,
    existingRowsSha256: hashWpiQuestionRows(existingRows),
    newRowsSha256: hashWpiNewQuestionRows(additionRows),
    promotedNewRowsSha256: hashWpiNewQuestionRows(additionRows.map(row => ({ ...row, reviewStatus: "approved" }))),
  };
  assert.throws(() => validateApprovedPackage(
    { archiveSha256: "0".repeat(64), manifest, baselineRows, existingRows, additionRows },
    { baselineSha256 },
  ), /ZIP SHA-256/);
});

test("recognizes the exact completed release as a no-op", () => {
  const { approved } = fixture();
  const currentRows = [...approved.orderedExisting, ...approved.orderedAdditions].map((row, index) => ({
    ...row,
    id: 120_000 + index,
    reviewStatus: "approved",
    reviewedBy: REVIEW_ACTOR,
    reviewedAt: new Date("2026-09-17T00:00:00Z"),
  }));
  const plan = buildReleasePlan(currentRows, PLANNED_METADATA, approved);
  assert.equal(plan.status, "already_released");
});
