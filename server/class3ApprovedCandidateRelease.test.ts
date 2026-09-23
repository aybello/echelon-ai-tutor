import { describe, expect, it } from "vitest";
// @ts-expect-error - standalone guarded release helper executes as ESM by Node and Vitest.
import { APPROVED_AT, BACKUP_EVIDENCE_MAX_AGE_MS, BANK, CANDIDATE_COUNT, FINAL_STORED_COUNT, RELEASE, REVIEWER, assertBaselinePreserved, authoritativeProductionConnectionOptions, beginReadOnlyTransaction, buildPlan, parseBackupEvidence, parsePreflightEvidence, questionPayload, readLiveState, targetFingerprintFor, verifyWriteAssumptions } from "../scripts/recovery/releaseClass3ApprovedCandidates.mjs";

const TARGET = "production-target-fingerprint";

function baselineRows() {
  return Array.from({ length: 571 }, (_, index) => ({
    id: 400_000 + index,
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
    cognitiveLevel: "recall",
    sourceTitle: null,
    sourceReference: null,
    sourceUrl: null,
    blueprintObjective: null,
    reviewStatus: "unreviewed",
    reviewedBy: null,
    reviewedAt: null,
  }));
}

function metadata() {
  return { bankKey: BANK, totalQuestions: 571, contentVersion: 12 };
}

describe("Class 3 approved-candidate release safeguards", () => {
  it("plans exactly 250 approved additions without changing existing rows", () => {
    const rows = baselineRows();
    const before = structuredClone(rows);
    const plan = buildPlan(rows, metadata(), TARGET);

    expect(rows).toEqual(before);
    expect(plan.additions).toHaveLength(CANDIDATE_COUNT);
    expect(plan.baselineStoredCount).toBe(571);
    expect(plan.baselineVisibleCount).toBe(571);
    expect(plan.finalStoredCount).toBe(FINAL_STORED_COUNT);
    expect(plan.finalVisibleCount).toBe(FINAL_STORED_COUNT);
    expect(plan.expectedContentVersion).toBe(13);
    expect(new Set(plan.additions.map((item: { questionNum: number }) => item.questionNum)).size).toBe(CANDIDATE_COUNT);
    expect(plan.additions.every((item: { reviewStatus: string; reviewedBy: string; reviewedAt: string }) =>
      item.reviewStatus === "approved" && item.reviewedBy === REVIEWER && item.reviewedAt === APPROVED_AT,
    )).toBe(true);
  });

  it("binds confirmation to the full 571-row baseline, metadata version, target, and candidate content", () => {
    const first = buildPlan(baselineRows(), metadata(), TARGET);
    const changedContent = baselineRows();
    changedContent[0].explanation = "A changed legacy explanation that must invalidate the release plan.";
    const changedReview = baselineRows();
    changedReview[0].reviewStatus = "approved";

    expect(buildPlan(baselineRows(), metadata(), TARGET).planDigest).toBe(first.planDigest);
    expect(buildPlan(changedContent, metadata(), TARGET).planDigest).not.toBe(first.planDigest);
    expect(buildPlan(changedReview, metadata(), TARGET).planDigest).not.toBe(first.planDigest);
    expect(buildPlan(baselineRows(), { ...metadata(), contentVersion: 13 }, TARGET).planDigest).not.toBe(first.planDigest);
    expect(buildPlan(baselineRows(), metadata(), "different-production-target").planDigest).not.toBe(first.planDigest);
    expect(questionPayload(first.additions[0]).reviewStatus).toBe("approved");
  });

  it("rejects a changed or replaced original question during post-write verification", () => {
    const rows = baselineRows();
    const plan = buildPlan(rows, metadata(), TARGET);
    expect(() => assertBaselinePreserved(rows, plan.baseline)).not.toThrow();

    const changed = structuredClone(rows);
    changed[307].explanation = "This legacy content changed while the candidate release was applying.";
    expect(() => assertBaselinePreserved(changed, plan.baseline)).toThrow(/baseline preservation mismatch/);

    const replaced = structuredClone(rows);
    replaced[307].id = 999_999;
    expect(() => assertBaselinePreserved(replaced, plan.baseline)).toThrow(/baseline preservation mismatch/);
  });

  it("fails closed when production has an invalid baseline, visibility state, or occupied candidate number", () => {
    expect(() => buildPlan(baselineRows().slice(1), metadata(), TARGET)).toThrow(/exactly 571/);

    const held = baselineRows();
    held[0].reviewStatus = "in_review";
    expect(() => buildPlan(held, metadata(), TARGET)).toThrow(/learner-visible baseline/);

    const nullStatus = baselineRows();
    (nullStatus[0] as { reviewStatus: string | null }).reviewStatus = null;
    expect(() => buildPlan(nullStatus, metadata(), TARGET)).toThrow(/invalid or null review status/);

    const occupied = baselineRows();
    occupied[0] = { ...occupied[0], questionNum: 2001 };
    expect(() => buildPlan(occupied, metadata(), TARGET)).toThrow(/missing existing Class 3 question 1/);

    expect(() => buildPlan(baselineRows(), { ...metadata(), totalQuestions: 570 }, TARGET)).toThrow(/metadata/);
  });

  it("accepts only fresh target-bound preflight and recovery evidence for the exact live plan", () => {
    const now = Date.parse("2026-09-23T00:34:00Z");
    const preflight = JSON.stringify({
      release: RELEASE,
      planDigest: "live-plan-digest",
      targetFingerprint: TARGET,
      plannedAt: "2026-09-23T00:20:00Z",
    });
    const backup = JSON.stringify({
      release: RELEASE,
      planDigest: "live-plan-digest",
      targetFingerprint: TARGET,
      backupId: "provider-verified-backup",
      backedUpAt: "2026-09-23T00:20:00Z",
    });

    expect(parsePreflightEvidence(preflight, "live-plan-digest", TARGET, now)).toEqual({ plannedAt: "2026-09-23T00:20:00.000Z" });
    expect(parseBackupEvidence(backup, "live-plan-digest", TARGET, now)).toEqual({
      backupId: "provider-verified-backup",
      backedUpAt: "2026-09-23T00:20:00.000Z",
    });
    expect(() => parsePreflightEvidence(JSON.stringify({
      release: RELEASE,
      planDigest: "different-digest",
      targetFingerprint: TARGET,
      plannedAt: "2026-09-23T00:20:00Z",
    }), "live-plan-digest", TARGET, now)).toThrow(/exact production plan/);
    expect(() => parseBackupEvidence(JSON.stringify({
      release: RELEASE,
      planDigest: "live-plan-digest",
      targetFingerprint: "different-target",
      backupId: "provider-verified-backup",
      backedUpAt: "2026-09-23T00:20:00Z",
    }), "live-plan-digest", TARGET, now)).toThrow(/exact production plan/);
    expect(() => parseBackupEvidence(JSON.stringify({
      release: RELEASE,
      planDigest: "live-plan-digest",
      targetFingerprint: TARGET,
      backupId: "provider-verified-backup",
      backedUpAt: new Date(now - BACKUP_EVIDENCE_MAX_AGE_MS - 1).toISOString(),
    }), "live-plan-digest", TARGET, now)).toThrow(/older than one hour/);
  });

  it("refuses the platform database and requires an explicit TLS-verified authoritative target", () => {
    const baseEnvironment = {
      DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true",
      EXTERNAL_DATABASE_URL: "mysql://release-user:release-password@db.example:25060/default?ssl-mode=VERIFY_IDENTITY",
      EXTERNAL_DATABASE_CA: "-----BEGIN CERTIFICATE-----\\nvalid-ca\\n-----END CERTIFICATE-----",
      DATABASE_CUTOVER_TARGET_DATABASE: "echelon_production",
    };
    expect(authoritativeProductionConnectionOptions(baseEnvironment)).toMatchObject({
      host: "db.example",
      port: 25060,
      database: "echelon_production",
      ssl: { rejectUnauthorized: true },
    });
    expect(() => authoritativeProductionConnectionOptions({ ...baseEnvironment, DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "false" })).toThrow(/explicitly selected/);
    expect(() => authoritativeProductionConnectionOptions({ ...baseEnvironment, EXTERNAL_DATABASE_URL: "mysql://release-user:release-password@db.example:25060/default" })).toThrow(/TLS/);
    expect(() => authoritativeProductionConnectionOptions({ ...baseEnvironment, DATABASE_CUTOVER_TARGET_DATABASE: "bad-name" })).toThrow(/target database name/);
  });

  it("uses a read-only plan and checks transactional engine, uniqueness, and target identity before apply", async () => {
    const calls: string[] = [];
    const connection = {
      query: async (statement: string) => { calls.push(statement); return [[]]; },
      beginTransaction: async () => { calls.push("BEGIN"); },
      execute: async (statement: string) => {
        calls.push(statement);
        if (statement.includes("DATABASE()")) return [[{ databaseName: "echelon", serverUuid: "server-uuid" }]];
        if (statement.includes("SHOW TABLE STATUS")) return [[
          { Name: "questions", Engine: "InnoDB" },
          { Name: "question_bank_meta", Engine: "InnoDB" },
        ]];
        if (statement.includes("SHOW INDEX FROM `questions`")) return [[
          { Key_name: "bank_question_idx", Non_unique: 0, Seq_in_index: 1, Column_name: "bankKey" },
          { Key_name: "bank_question_idx", Non_unique: 0, Seq_in_index: 2, Column_name: "questionNum" },
        ]];
        if (statement.includes("SHOW INDEX FROM `question_bank_meta`")) return [[
          { Key_name: "question_bank_meta_bankKey_unique", Non_unique: 0, Seq_in_index: 1, Column_name: "bankKey" },
        ]];
        if (statement.includes("transaction_isolation")) return [[{ isolationLevel: "REPEATABLE-READ" }]];
        if (statement.includes("questionNum` BETWEEN")) return [[]];
        if (statement.includes("question_bank_meta")) return [[metadata()]];
        return [baselineRows()];
      },
    };

    await beginReadOnlyTransaction(connection);
    expect(calls).toEqual(["SET TRANSACTION READ ONLY", "BEGIN"]);
    calls.length = 0;
    await verifyWriteAssumptions(connection);
    expect(calls.some(statement => statement.includes("SHOW TABLE STATUS"))).toBe(true);
    expect(calls.some(statement => statement.includes("SHOW INDEX"))).toBe(true);
    expect(calls.some(statement => statement.includes("transaction_isolation"))).toBe(true);
    const target = await targetFingerprintFor(connection);
    expect(target).toMatch(/^[a-f0-9]{64}$/);
    calls.length = 0;
    await readLiveState(connection, false);
    expect(calls.every(statement => !statement.includes("FOR UPDATE"))).toBe(true);
    calls.length = 0;
    await readLiveState(connection, true);
    expect(calls.every(statement => statement.includes("FOR UPDATE"))).toBe(true);
  });
});
