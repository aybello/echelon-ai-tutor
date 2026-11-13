import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
// @ts-ignore - standalone guarded release helper executes as ESM by Node and Vitest.
import { BACKUP_EVIDENCE_MAX_AGE_MS, BANK, CANDIDATE_END, CANDIDATE_START, LEARNER_VISIBLE_REPAIR_STATUS, ORIGINAL_COUNT, RELEASE, REPAIR_COUNT, REMEDIATION_SOURCE_SHA256, SOURCE_PACK_SHA256, STORED_COUNT, assertSnapshots, assertUnchangedRowsPreserved, buildBaselineManifest, buildPlan, fullRowPayload, parseBackupEvidence, parsePreflightEvidence, readTrustedRepairs } from "../scripts/recovery/releaseClass3GptRemediation.mjs";
// @ts-ignore - checked-in candidate authoring source executes as ESM by Node and Vitest.
import { buildCandidateQuestions } from "../content/class3-water-dist/new-questions-2026-09-22.mjs";

const TARGET = "test-authoritative-target";
type QuestionFixture = Record<string, any>;

function originalRows(): QuestionFixture[] {
  return Array.from({ length: ORIGINAL_COUNT }, (_, index) => ({
    id: 900_000 + index,
    bankKey: BANK,
    questionNum: index + 1,
    module: "Distribution fundamentals",
    difficulty: "medium",
    question: `Established Class 3 question ${index + 1}?`,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    explanation: `Established explanation ${index + 1}.`,
    steps: null,
    tip: null,
    isCalc: "no",
    topic: "fundamentals",
    cognitiveLevel: null,
    sourceTitle: null,
    sourceReference: null,
    sourceUrl: null,
    blueprintObjective: null,
    reviewStatus: index < 120 ? "approved" : "unreviewed",
    reviewedBy: null,
    reviewedAt: null,
  }));
}

function candidateRows(): QuestionFixture[] {
  return (buildCandidateQuestions() as Array<Record<string, any>>).map((candidate, index: number) => ({
    ...candidate,
    id: 1_000_000 + index,
    reviewStatus: "approved",
    reviewedBy: "owner-approval:class3-water-distribution-candidates",
    reviewedAt: new Date("2026-09-23T00:32:07.000Z"),
  }));
}

function rows(): QuestionFixture[] {
  return [...originalRows(), ...candidateRows()];
}

function metadata() {
  return { bankKey: BANK, totalQuestions: STORED_COUNT, contentVersion: 41 };
}

function planFor(live = rows(), meta = metadata(), target = TARGET) {
  const baseline = buildBaselineManifest(live, meta, target);
  return buildPlan(live, meta, target, baseline);
}

describe("Class 3 GPT remediation release safeguards", () => {
  it("uses a pinned 212-question package with controlled-source evidence", () => {
    const repairs = readTrustedRepairs();
    expect(repairs.size).toBe(REPAIR_COUNT);
    expect(REPAIR_COUNT).toBe(212);
    expect(REMEDIATION_SOURCE_SHA256).toHaveLength(64);
    expect(SOURCE_PACK_SHA256).toHaveLength(64);
    expect([...repairs.values()].every(item => item.reviewStatus === "in_review" && item.sourceTitle && item.sourceReference && item.sourceUrl.startsWith("https://"))).toBe(true);
    expect([...repairs.keys()].every(number => number >= 1 && number <= ORIGINAL_COUNT)).toBe(true);
  });

  it("plans exactly 212 learner-visible replacements while preserving the 821-question inventory", () => {
    const live = rows();
    const before = structuredClone(live);
    const plan = planFor(live);

    expect(live).toEqual(before);
    expect(plan.changes).toHaveLength(REPAIR_COUNT);
    expect(plan.storedCount).toBe(STORED_COUNT);
    expect(plan.learnerVisibleCount).toBe(STORED_COUNT);
    expect(plan.expectedContentVersion).toBe(42);
    expect(plan.changes.every((change: { after: { reviewStatus: string } }) => change.after.reviewStatus === LEARNER_VISIBLE_REPAIR_STATUS)).toBe(true);
    expect(new Set(plan.changes.map((change: { before: { questionNum: number } }) => change.before.questionNum)).size).toBe(REPAIR_COUNT);
  });

  it("binds the exact release plan to target, source digests, all rows, and full before-images", () => {
    const firstRows = rows();
    const baseline = buildBaselineManifest(firstRows, metadata(), TARGET);
    const first = buildPlan(firstRows, metadata(), TARGET, baseline);

    expect(buildPlan(rows(), metadata(), TARGET, buildBaselineManifest(rows(), metadata(), TARGET)).planDigest).toBe(first.planDigest);

    const changedCandidate = rows();
    changedCandidate.find(row => row.questionNum === CANDIDATE_START)!.explanation = "Published candidate drift.";
    expect(() => planFor(changedCandidate)).toThrow(/published candidate/);

    const changedTarget = rows();
    const targetNumber = first.changes[0].before.questionNum;
    changedTarget.find(row => row.questionNum === targetNumber)!.topic = "Unauthorized drift.";
    expect(() => buildPlan(changedTarget, metadata(), TARGET, baseline)).toThrow(/full before-image baseline/);

    expect(() => buildPlan(rows(), { ...metadata(), contentVersion: 42 }, TARGET, baseline)).toThrow(/full before-image baseline/);
    expect(() => buildPlan(rows(), metadata(), "other-target", baseline)).toThrow(/full before-image baseline/);
  });

  it("preserves every non-target row including all published candidates", () => {
    const live = rows();
    const plan = planFor(live);
    const post = structuredClone(live);
    for (const change of plan.changes) Object.assign(post.find(row => row.questionNum === change.after.questionNum)!, change.after);

    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).not.toThrow();
    post.find(row => row.questionNum === CANDIDATE_END)!.explanation = "Unexpected candidate edit.";
    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).toThrow(/non-target question/);
  });

  it("verifies all 212 complete before-images", () => {
    const plan = planFor();
    const snapshots = plan.changes.map((change: { before: QuestionFixture }) => ({
      questionId: change.before.id,
      questionNum: change.before.questionNum,
      sourceContentVersion: 41,
      contentHash: createHash("sha256").update(JSON.stringify(fullRowPayload(change.before))).digest("hex"),
      payload: JSON.stringify(fullRowPayload(change.before)),
    }));
    snapshots[0].payload = fullRowPayload(plan.changes[0].before);
    expect(() => assertSnapshots(snapshots, plan.changes, 41)).not.toThrow();
    snapshots[0].questionNum = 999;
    expect(() => assertSnapshots(snapshots, plan.changes, 41)).toThrow(/before-image mismatch/);
  });

  it("requires fresh target-bound preflight and recovery evidence", () => {
    const now = Date.parse("2026-09-23T04:40:00Z");
    const preflight = JSON.stringify({ release: RELEASE, planDigest: "exact-plan", targetFingerprint: TARGET, plannedAt: "2026-09-23T04:20:00Z" });
    const backup = JSON.stringify({ release: RELEASE, planDigest: "exact-plan", targetFingerprint: TARGET, backupId: "scoped-backup", backedUpAt: "2026-09-23T04:20:00Z" });

    expect(parsePreflightEvidence(preflight, "exact-plan", TARGET, now)).toEqual({ plannedAt: "2026-09-23T04:20:00.000Z" });
    expect(parseBackupEvidence(backup, "exact-plan", TARGET, now)).toEqual({ backupId: "scoped-backup", backedUpAt: "2026-09-23T04:20:00.000Z" });
    expect(() => parsePreflightEvidence(JSON.stringify({ ...JSON.parse(preflight), targetFingerprint: "wrong" }), "exact-plan", TARGET, now)).toThrow(/exact production plan/);
    expect(() => parseBackupEvidence(JSON.stringify({ ...JSON.parse(backup), backedUpAt: new Date(now - BACKUP_EVIDENCE_MAX_AGE_MS - 1).toISOString() }), "exact-plan", TARGET, now)).toThrow(/older than one hour/);
  });
});
