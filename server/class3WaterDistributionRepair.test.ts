import { describe, expect, it } from "vitest";
// @ts-expect-error - this standalone guarded release helper is executed as ESM by Node and Vitest.
import { BACKUP_EVIDENCE_MAX_AGE_MS, BANK, RELEASE, TARGETS, beginReadOnlyPlanTransaction, buildPlan, fingerprint, optionsOf, parseCurrentBackupEvidence, readLiveBaseline } from "../scripts/recovery/class3WaterDistributionRepair.mjs";

function baselineRows() {
  return Array.from({ length: 571 }, (_, index) => ({
    id: 200_000 + index,
    bankKey: BANK,
    questionNum: index + 1,
    module: "Distribution fundamentals",
    difficulty: "medium",
    question: `Baseline question ${index + 1}?`,
    options: ["original answer", "option B", "option C", "option D"],
    correctIndex: 0,
    explanation: `Baseline explanation ${index + 1}.`,
    steps: null,
    reviewStatus: "unreviewed",
  }));
}

function manifestFor(rows: ReturnType<typeof baselineRows>) {
  return {
    bankKey: BANK,
    release: RELEASE,
    targets: TARGETS.map((questionNum: number) => {
      const row = rows[questionNum - 1];
      return { questionNum, id: row.id, fingerprint: fingerprint(row) };
    }),
  };
}

describe("Class 3 Water Distribution repair safeguards", () => {
  it("preserves source options and before-images when a planned repair changes an answer", () => {
    const rows = baselineRows();
    const originalOptions = [...rows[507].options];
    const plan = buildPlan(rows, manifestFor(rows), { bankKey: BANK, totalQuestions: 571, contentVersion: 1 });
    const repaired = plan.changes.find((change: { before: { questionNum: number; options: string[] }; after: { options: string[] } }) => change.before.questionNum === 508);

    expect(optionsOf(rows[507])).toEqual(originalOptions);
    expect(repaired?.before.options).toEqual(originalOptions);
    expect(repaired?.after.options).not.toEqual(originalOptions);
  });

  it("accepts only fresh backup evidence tied to the exact plan", () => {
    const now = Date.parse("2026-09-22T21:00:00Z");
    const valid = JSON.stringify({
      release: RELEASE,
      planDigest: "exact-live-plan",
      backupId: "verified-backup-123",
      backedUpAt: "2026-09-22T20:30:00Z",
    });

    expect(parseCurrentBackupEvidence(valid, "exact-live-plan", now)).toEqual({
      backupId: "verified-backup-123",
      backedUpAt: "2026-09-22T20:30:00.000Z",
    });
    expect(() => parseCurrentBackupEvidence(JSON.stringify({
      release: RELEASE,
      planDigest: "different-plan",
      backupId: "verified-backup-123",
      backedUpAt: "2026-09-22T20:30:00Z",
    }), "exact-live-plan", now)).toThrow(/exact live plan/);
    expect(() => parseCurrentBackupEvidence(JSON.stringify({
      release: RELEASE,
      planDigest: "exact-live-plan",
      backupId: "verified-backup-123",
      backedUpAt: new Date(now - BACKUP_EVIDENCE_MAX_AGE_MS - 1).toISOString(),
    }), "exact-live-plan", now)).toThrow(/older than one hour/);
    expect(() => parseCurrentBackupEvidence(JSON.stringify({
      release: RELEASE,
      planDigest: "exact-live-plan",
      backupId: "verified-backup-123",
      backedUpAt: "2026-09-22 20:30:00",
    }), "exact-live-plan", now)).toThrow(/ISO-8601 time with timezone/);
  });

  it("uses a read-only, non-locking plan and locks only an explicit apply", async () => {
    const calls: string[] = [];
    const connection = {
      execute: async (statement: string) => {
        calls.push(statement);
        return [[]];
      },
      query: async (statement: string) => {
        calls.push(statement);
        return [[]];
      },
      beginTransaction: async () => {
        calls.push("BEGIN");
      },
    };

    await beginReadOnlyPlanTransaction(connection);
    expect(calls).toEqual(["SET TRANSACTION READ ONLY", "BEGIN"]);

    calls.length = 0;
    await readLiveBaseline(connection, false);
    expect(calls).toHaveLength(2);
    expect(calls.every(statement => !statement.includes("FOR UPDATE"))).toBe(true);
    expect(calls.every(statement => statement.includes(BANK))).toBe(false);

    calls.length = 0;
    await readLiveBaseline(connection, true);
    expect(calls).toHaveLength(2);
    expect(calls.every(statement => statement.includes("FOR UPDATE"))).toBe(true);
  });
});
