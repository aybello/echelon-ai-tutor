import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-ignore - standalone guarded release helper executes as ESM by Node and Vitest.
import {
  BACKUP_EVIDENCE_MAX_AGE_MS,
  BANK,
  EVIDENCE_ROOT,
  LEARNER_VISIBLE_REPAIR_STATUS,
  PACKAGE_SHA256,
  RELEASE,
  REPAIR_COUNT,
  STORED_COUNT,
  assertSnapshots,
  assertUnchangedRowsPreserved,
  buildBaselineManifest,
  buildPlan,
  evidenceSignature,
  fullRowPayload,
  parseBackupEvidence,
  parsePreflightEvidence,
  reconcileUncertainOutcome,
  readTrustedRepairs,
  // @ts-ignore - standalone guarded release helper executes as ESM by Node and Vitest.
} from "../scripts/recovery/releaseWpiClass3WaterDistributionRemediation.mjs";

type QuestionFixture = Record<string, any>;
const TARGET = "test-authoritative-target";

function rows(): QuestionFixture[] {
  return Array.from({ length: STORED_COUNT }, (_, index) => ({
    id: 2_000_000 + index,
    bankKey: BANK,
    questionNum: index + 1,
    module: "Distribution operation",
    difficulty: "medium",
    question: `Established WPI Class III Distribution question ${index + 1}?`,
    options: JSON.stringify(["A", "B", "C", "D"]),
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
    reviewStatus: "unreviewed",
    reviewedBy: null,
    reviewedAt: null,
  }));
}
function metadata() { return { bankKey: BANK, totalQuestions: STORED_COUNT, contentVersion: 8 }; }
function planFor(live = rows(), meta = metadata(), target = TARGET) {
  return buildPlan(live, meta, target, buildBaselineManifest(live, meta, target));
}
function snapshotsFor(plan: ReturnType<typeof planFor>, sourceContentVersion: number) {
  return plan.changes.map((change: { before: QuestionFixture }) => {
    const payload = fullRowPayload(change.before);
    return {
      questionId: change.before.id,
      questionNum: change.before.questionNum,
      sourceContentVersion,
      contentHash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
      payload: JSON.stringify(payload),
    };
  });
}

describe("WPI Class III Water Distribution remediation release safeguards", () => {
  it("uses the immutable 209-question GPT-6 Sol package with controlled sources", () => {
    const repairs = readTrustedRepairs();
    expect(repairs.size).toBe(REPAIR_COUNT);
    expect(REPAIR_COUNT).toBe(209);
    expect(PACKAGE_SHA256).toHaveLength(64);
    expect([...repairs.values()].every(item => item.reviewStatus === "in_review" && item.sourceTitle && item.sourceReference && item.sourceUrl.startsWith("https://"))).toBe(true);
    expect([...repairs.values()].every(item => ["recall", "application"].includes(item.cognitiveLevel))).toBe(true);
    expect([...repairs.keys()].every(number => number >= 1 && number <= STORED_COUNT)).toBe(true);
  });

  it("plans exactly 209 learner-visible replacements while preserving the 611-question inventory", () => {
    const live = rows();
    const before = structuredClone(live);
    const plan = planFor(live);
    expect(live).toEqual(before);
    expect(plan.changes).toHaveLength(REPAIR_COUNT);
    expect(plan.storedCount).toBe(STORED_COUNT);
    expect(plan.learnerVisibleCount).toBe(STORED_COUNT);
    expect(plan.expectedContentVersion).toBe(9);
    expect(plan.changes.every((change: { after: { reviewStatus: string } }) => change.after.reviewStatus === LEARNER_VISIBLE_REPAIR_STATUS)).toBe(true);
  });

  it("allows the verified stale metadata count and plans its correction", () => {
    const staleMetadata = { ...metadata(), totalQuestions: 590 };
    const plan = planFor(rows(), staleMetadata);
    expect(plan.sourceMetadataTotalQuestions).toBe(590);
    expect(plan.expectedMetadataTotalQuestions).toBe(STORED_COUNT);
  });

  it("binds the exact plan to the target, package, full bank before-image, and metadata version", () => {
    const firstRows = rows();
    const baseline = buildBaselineManifest(firstRows, metadata(), TARGET);
    const first = buildPlan(firstRows, metadata(), TARGET, baseline);
    expect(buildPlan(rows(), metadata(), TARGET, buildBaselineManifest(rows(), metadata(), TARGET)).planDigest).toBe(first.planDigest);

    const driftedTarget = rows();
    const target = first.changes[0].before.questionNum;
    driftedTarget.find(row => row.questionNum === target)!.topic = "unauthorized drift";
    expect(() => buildPlan(driftedTarget, metadata(), TARGET, baseline)).toThrow(/exact before-image baseline/);
    expect(() => buildPlan(rows(), { ...metadata(), contentVersion: 9 }, TARGET, baseline)).toThrow(/full before-image baseline/);
    expect(() => buildPlan(rows(), metadata(), "other-target", baseline)).toThrow(/full before-image baseline/);
  });

  it("preserves every non-target question", () => {
    const live = rows();
    const plan = planFor(live);
    const post = structuredClone(live);
    for (const change of plan.changes) Object.assign(post.find(row => row.questionNum === change.after.questionNum)!, change.after);
    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).not.toThrow();
    const nonTarget = post.find(row => !plan.changes.some((change: { after: { questionNum: number } }) => change.after.questionNum === row.questionNum))!;
    nonTarget.explanation = "Unexpected drift.";
    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).toThrow(/non-target question/);

    nonTarget.explanation = `Established explanation ${nonTarget.questionNum}.`;
    nonTarget.options = '["A", "B", "C", "D"]';
    expect(() => assertUnchangedRowsPreserved(post, plan.baseline, plan.changes.map((change: { before: unknown }) => change.before))).toThrow(/non-target question/);
  });

  it("verifies all complete before-images", () => {
    const plan = planFor();
    const snapshots = plan.changes.map((change: { before: QuestionFixture }) => ({
      questionId: change.before.id,
      questionNum: change.before.questionNum,
      sourceContentVersion: 8,
      contentHash: createHash("sha256").update(JSON.stringify(fullRowPayload(change.before))).digest("hex"),
      payload: JSON.stringify(fullRowPayload(change.before)),
    }));
    snapshots[0].payload = fullRowPayload(plan.changes[0].before);
    expect(() => assertSnapshots(snapshots, plan.changes, 8)).not.toThrow();
    snapshots[0].questionNum = 999;
    expect(() => assertSnapshots(snapshots, plan.changes, 8)).toThrow(/before-image mismatch/);
  });

  it("requires fresh target-bound preflight and recovery evidence", () => {
    const now = Date.parse("2026-09-23T07:40:00Z");
    const baseline = planFor().baseline;
    const key = "controlled-private-evidence-key-0123456789";
    const preflightValue = { release: RELEASE, planDigest: "exact-plan", targetFingerprint: TARGET, plannedAt: "2026-09-23T07:20:00Z", storedCount: STORED_COUNT, repairCount: REPAIR_COUNT, packageSha256: PACKAGE_SHA256 };
    const evidenceDir = `${EVIDENCE_ROOT}/wpi-release-test-${process.pid}`;
    const artifactPath = `${evidenceDir}/recovery-artifact.json`;
    mkdirSync(evidenceDir, { recursive: true, mode: 0o700 });
    const artifact = { release: RELEASE, bankKey: BANK, planDigest: "exact-plan", targetFingerprint: TARGET, backupId: "scoped-backup", baseline };
    const artifactRaw = `${JSON.stringify(artifact)}\n`;
    writeFileSync(artifactPath, artifactRaw, { mode: 0o600 });
    const backupValue = { release: RELEASE, planDigest: "exact-plan", targetFingerprint: TARGET, backupId: "scoped-backup", backupArtifactPath: artifactPath, backupArtifactSha256: createHash("sha256").update(artifactRaw).digest("hex"), backedUpAt: "2026-09-23T07:20:00Z", storedCount: STORED_COUNT, repairCount: REPAIR_COUNT, packageSha256: PACKAGE_SHA256, baseline };
    const preflight = JSON.stringify({ ...preflightValue, signature: evidenceSignature(preflightValue, key) });
    const backup = JSON.stringify({ ...backupValue, signature: evidenceSignature(backupValue, key) });
    try {
      expect(parsePreflightEvidence(preflight, "exact-plan", TARGET, key, now)).toEqual({ plannedAt: "2026-09-23T07:20:00.000Z" });
      expect(parseBackupEvidence(backup, "exact-plan", TARGET, baseline, key, now)).toEqual({ backupId: "scoped-backup", backedUpAt: "2026-09-23T07:20:00.000Z" });
      expect(() => parsePreflightEvidence(JSON.stringify({ ...JSON.parse(preflight), targetFingerprint: "wrong" }), "exact-plan", TARGET, key, now)).toThrow(/integrity-protected/);
      expect(() => parseBackupEvidence(JSON.stringify({ ...JSON.parse(backup), backedUpAt: new Date(now - BACKUP_EVIDENCE_MAX_AGE_MS - 1).toISOString() }), "exact-plan", TARGET, baseline, key, now)).toThrow(/integrity-protected/);
      expect(() => parseBackupEvidence(JSON.stringify({ ...JSON.parse(backup), baseline: [] }), "exact-plan", TARGET, baseline, key, now)).toThrow(/integrity-protected/);
      expect(() => parseBackupEvidence(JSON.stringify({ ...JSON.parse(backup), backupArtifactSha256: "0".repeat(64) }), "exact-plan", TARGET, baseline, key, now)).toThrow(/integrity-protected/);
    } finally { rmSync(evidenceDir, { recursive: true, force: true }); }
  });

  it("reconciles a durable uncertain-commit gate before allowing any retry", () => {
    const liveRows = rows();
    const liveMetadata = metadata();
    const plan = planFor(liveRows, liveMetadata);
    const outcome = { release: RELEASE, bankKey: BANK, planDigest: plan.planDigest, targetFingerprint: TARGET, sourceContentVersion: liveMetadata.contentVersion, sourceMetadataTotalQuestions: plan.sourceMetadataTotalQuestions, expectedContentVersion: plan.expectedContentVersion, expectedMetadataTotalQuestions: plan.expectedMetadataTotalQuestions, baseline: plan.baseline };
    expect(reconcileUncertainOutcome(outcome, liveRows, liveMetadata, [], TARGET)).toBe("not_committed");
    expect(() => reconcileUncertainOutcome(outcome, liveRows, liveMetadata, snapshotsFor(plan, liveMetadata.contentVersion), TARGET)).toThrow(/snapshots without a committed write/);

    const postRows = liveRows.map(row => ({ ...row }));
    for (const { before, after } of plan.changes) Object.assign(postRows.find(row => row.id === before.id)!, after);
    expect(reconcileUncertainOutcome(outcome, postRows, { ...liveMetadata, contentVersion: plan.expectedContentVersion }, snapshotsFor(plan, liveMetadata.contentVersion), TARGET)).toBe("committed");

    const partialRows = postRows.map(row => ({ ...row }));
    Object.assign(partialRows.find(row => row.id === plan.changes[0].before.id)!, liveRows.find(row => row.id === plan.changes[0].before.id)!);
    expect(() => reconcileUncertainOutcome(outcome, partialRows, { ...liveMetadata, contentVersion: plan.expectedContentVersion }, snapshotsFor(plan, liveMetadata.contentVersion), TARGET)).toThrow(/partial or inconsistent write/);
  });
});
