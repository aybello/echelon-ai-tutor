import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
// @ts-ignore - standalone guarded release helper executes as ESM by Node and Vitest.
import { BACKUP_EVIDENCE_MAX_AGE_MS, BANK, CANDIDATE_END, CANDIDATE_START, HISTORIC_REPAIR_MANIFEST_SHA256, HISTORIC_REPAIR_RELEASE, LEARNER_VISIBLE_REPAIR_STATUS, ORIGINAL_COUNT, RELEASE, REPAIR_COUNT, STORED_COUNT, assertSnapshots, assertUnchangedRowsPreserved, buildBaselineManifest, buildPlan, fullRowPayload, parseBackupEvidence, parsePreflightEvidence, questionPayload } from "../scripts/recovery/releaseClass3OriginalRepairs.mjs";
// @ts-ignore - standalone guarded repair helper executes as ESM by Node and Vitest.
import { TARGETS, fingerprint } from "../scripts/recovery/class3WaterDistributionRepair.mjs";
// @ts-ignore - checked-in candidate authoring source executes as ESM by Node and Vitest.
import { buildCandidateQuestions } from "../content/class3-water-dist/new-questions-2026-09-22.mjs";

const TARGET = "production-target-fingerprint";
type QuestionFixture = Record<string, any>;

function originalRows(): QuestionFixture[] {
  return Array.from({ length: ORIGINAL_COUNT }, (_, index) => ({
    id: 700_000 + index,
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
    reviewStatus: index < 126 ? "approved" : "unreviewed",
    reviewedBy: null,
    reviewedAt: null,
  }));
}

function candidateRows(): QuestionFixture[] {
  return (buildCandidateQuestions() as Array<Record<string, any>>).map((candidate, index: number) => ({
    ...candidate,
    id: 800_000 + index,
    reviewStatus: "approved",
    reviewedBy: "owner-approval:class3-water-distribution-candidates",
    reviewedAt: new Date("2026-09-23T00:32:07.000Z"),
  }));
}

function rows(): QuestionFixture[] {
  return [...originalRows(), ...candidateRows()];
}

function metadata() {
  return { bankKey: BANK, totalQuestions: STORED_COUNT, contentVersion: 17 };
}

function historicManifestFor(live: ReturnType<typeof rows>) {
  const byNumber = new Map(live.map(row => [row.questionNum, row]));
  return {
    release: HISTORIC_REPAIR_RELEASE,
    trustedDigest: HISTORIC_REPAIR_MANIFEST_SHA256,
    bankKey: BANK,
    targets: TARGETS.map((questionNum: number) => {
      const row = byNumber.get(questionNum)!;
      return { questionNum, id: row.id, fingerprint: fingerprint(row) };
    }),
  };
}

function planFor(live = rows(), meta = metadata(), target = TARGET) {
  const historic = historicManifestFor(live);
  const baseline = buildBaselineManifest(live, meta, target, historic);
  return buildPlan(live, meta, target, historic, baseline);
}

describe("Class 3 original repair release safeguards", () => {
  it("plans exactly 118 learner-visible replacements without changing the 821-question inventory", () => {
    const live = rows();
    const before = structuredClone(live);
    const plan = planFor(live);

    expect(live).toEqual(before);
    expect(plan.changes).toHaveLength(REPAIR_COUNT);
    expect(plan.storedCount).toBe(STORED_COUNT);
    expect(plan.learnerVisibleCount).toBe(STORED_COUNT);
    expect(plan.expectedContentVersion).toBe(18);
    expect(plan.changes.every((change: { after: { reviewStatus: string } }) => change.after.reviewStatus === LEARNER_VISIBLE_REPAIR_STATUS)).toBe(true);
    expect(plan.changes.map((change: { before: { questionNum: number } }) => change.before.questionNum)).toEqual(TARGETS);
    expect(plan.changes.some((change: { before: { questionNum: number }; after: { explanation: string } }) => change.before.questionNum === 308 && change.after.explanation.includes("35,343 L"))).toBe(true);
    expect(plan.changes.some((change: { before: { questionNum: number }; after: { explanation: string } }) => change.before.questionNum === 447 && change.after.explanation.includes("500 m³/day"))).toBe(true);
  });

  it("binds the release plan to all live rows, metadata version, target, and full target before-images", () => {
    const firstRows = rows();
    const historic = historicManifestFor(firstRows);
    const baseline = buildBaselineManifest(firstRows, metadata(), TARGET, historic);
    const first = buildPlan(firstRows, metadata(), TARGET, historic, baseline);

    const changedCandidate = rows();
    changedCandidate.find(row => row.questionNum === CANDIDATE_START)!.explanation = "Unexpected candidate change.";
    const changedTargetTopic = rows();
    changedTargetTopic.find(row => row.questionNum === 308)!.topic = "Changed without approval.";

    expect(buildPlan(rows(), metadata(), TARGET, historicManifestFor(rows()), buildBaselineManifest(rows(), metadata(), TARGET, historicManifestFor(rows()))).planDigest).toBe(first.planDigest);
    expect(() => planFor(changedCandidate)).toThrow(/published candidate/);
    expect(() => buildPlan(changedTargetTopic, metadata(), TARGET, historic, baseline)).toThrow(/full before-image baseline manifest/);
    expect(() => buildPlan(rows(), { ...metadata(), contentVersion: 18 }, TARGET, historic, baseline)).toThrow(/full before-image baseline manifest/);
    expect(() => buildPlan(rows(), metadata(), "other-production-target", historic, baseline)).toThrow(/full before-image baseline manifest/);
    expect(() => buildBaselineManifest(rows(), metadata(), TARGET, { ...historic, release: "wrong-release" })).toThrow(/historic repair manifest/);
  });

  it("fails closed when a target drifts from the pinned historical baseline or candidate range is not intact", () => {
    const historic = historicManifestFor(rows());
    const baseline = buildBaselineManifest(rows(), metadata(), TARGET, historic);
    const drifted = rows();
    drifted.find(row => row.questionNum === 308)!.explanation = "Changed after the repair baseline.";
    expect(() => buildPlan(drifted, metadata(), TARGET, historic, baseline)).toThrow(/full before-image baseline manifest/);

    const candidateHeld = rows();
    candidateHeld.find(row => row.questionNum === CANDIDATE_START)!.reviewStatus = "in_review";
    expect(() => planFor(candidateHeld)).toThrow(/learner-visible questions/);

    const missing = rows().filter(row => row.questionNum !== CANDIDATE_END);
    expect(() => planFor(missing)).toThrow(/821 stored/);
  });

  it("verifies that every non-target row, including the published candidates, remains unchanged after the write", () => {
    const live = rows();
    const plan = planFor(live);
    const post = structuredClone(live);
    for (const change of plan.changes) Object.assign(post.find(row => row.questionNum === change.after.questionNum)!, change.after);

    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).not.toThrow();
    post.find(row => row.questionNum === CANDIDATE_START)!.explanation = "Published candidate changed unexpectedly.";
    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).toThrow(/non-target question/);
  });

  it("verifies all 118 stored before-images with either JSON-string or object database payloads", () => {
    const plan = planFor();
    const snapshots: Array<Record<string, any>> = plan.changes.map((change: { before: QuestionFixture }) => ({
      questionId: change.before.id,
      questionNum: change.before.questionNum,
      sourceContentVersion: 17,
      contentHash: createHash("sha256").update(JSON.stringify(fullRowPayload(change.before))).digest("hex"),
      payload: JSON.stringify(fullRowPayload(change.before)),
    }));
    snapshots[0].payload = fullRowPayload(plan.changes[0].before);
    expect(() => assertSnapshots(snapshots, plan.changes, 17)).not.toThrow();
    snapshots[0].questionNum = 999;
    expect(() => assertSnapshots(snapshots, plan.changes, 17)).toThrow(/before-image mismatch/);
  });

  it("requires fresh preflight and recovery evidence for the exact live plan", () => {
    const now = Date.parse("2026-09-23T01:25:00Z");
    const preflight = JSON.stringify({ release: RELEASE, planDigest: "exact-plan", targetFingerprint: TARGET, plannedAt: "2026-09-23T01:10:00Z" });
    const backup = JSON.stringify({ release: RELEASE, planDigest: "exact-plan", targetFingerprint: TARGET, backupId: "scoped-recovery-evidence", backedUpAt: "2026-09-23T01:10:00Z" });

    expect(parsePreflightEvidence(preflight, "exact-plan", TARGET, now)).toEqual({ plannedAt: "2026-09-23T01:10:00.000Z" });
    expect(parseBackupEvidence(backup, "exact-plan", TARGET, now)).toEqual({ backupId: "scoped-recovery-evidence", backedUpAt: "2026-09-23T01:10:00.000Z" });
    expect(() => parsePreflightEvidence(JSON.stringify({ ...JSON.parse(preflight), targetFingerprint: "other" }), "exact-plan", TARGET, now)).toThrow(/exact production plan/);
    expect(() => parseBackupEvidence(JSON.stringify({ ...JSON.parse(backup), backedUpAt: new Date(now - BACKUP_EVIDENCE_MAX_AGE_MS - 1).toISOString() }), "exact-plan", TARGET, now)).toThrow(/older than one hour/);
  });

  it("normalizes stored question payloads without sharing mutable option arrays", () => {
    const row = rows()[0];
    const payload = questionPayload(row);
    payload.options[0] = "changed only in test payload";
    expect(row.options[0]).toBe("A");
  });
});
