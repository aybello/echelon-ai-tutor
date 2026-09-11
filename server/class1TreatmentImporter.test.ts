import { describe, expect, it } from "vitest";
// @ts-expect-error The guarded CLI helper is a standalone ESM module exercised by Node and Vitest.
import { CLASS1_NETWORKS_BASELINE_COUNTS, createBaseline, digest, loadClass1NetworksPackage, planClass1NetworksImport, validateBaseline } from "../scripts/lib/class1TreatmentImporter.mjs";

const packageInfo = loadClass1NetworksPackage();

type StoredRow = {
  id: number; bankKey: string; questionNum: number; module: string; difficulty: string; question: string;
  options: string; correctIndex: number; explanation: string; steps: null; tip: null; isCalc: string;
  topic: string; cognitiveLevel: string; sourceTitle: null; sourceReference: null; sourceUrl: null;
  blueprintObjective: null; reviewStatus: string;
};

function storedRow(bankKey: string, questionNum: number, id: number): StoredRow {
  return {
    id, bankKey, questionNum, module: "Existing module", difficulty: "easy", question: `Existing ${bankKey} question ${questionNum}`,
    options: JSON.stringify(["A", "B", "C", "D"]), correctIndex: 0, explanation: "Existing explanation.", steps: null,
    tip: null, isCalc: "no", topic: "Existing", cognitiveLevel: "recall", sourceTitle: null,
    sourceReference: null, sourceUrl: null, blueprintObjective: null, reviewStatus: "unreviewed",
  };
}

function baselineRows(): StoredRow[] {
  let id = 1;
  const bankCounts = Object.entries(CLASS1_NETWORKS_BASELINE_COUNTS) as [string, number][];
  return bankCounts.flatMap(([bankKey, count]) =>
    Array.from({ length: count }, (_, index) => storedRow(bankKey, index + 1, id++)));
}

function metadata() {
  return Object.entries(CLASS1_NETWORKS_BASELINE_COUNTS).map(([bankKey, totalQuestions]) => ({
    bankKey, modules: "[]", moduleTargets: null, formulaLinks: null, totalQuestions, contentVersion: 4,
    blueprintVersion: 1, minCalcPerMock: null, recallTargetPct: null,
  }));
}

describe("Class 1 Treatment guarded additive importer", () => {
  it("accepts only the checksum-validated 500-item package against the exact production baseline", () => {
    const plan = planClass1NetworksImport({ payloads: packageInfo.payloads, rows: baselineRows(), metadata: metadata() });
    expect(plan).toMatchObject({ ready: true, state: "ready", errors: [] });
    expect(plan.banks.map((bank: any) => [bank.bankKey, bank.currentCount, bank.expectedStagedCount])).toEqual([
      ["class1-water", 555, 805], ["class1-wastewater", 565, 815],
    ]);
  });

  it("fails closed on current-bank count drift or a duplicate deployed stem", () => {
    const rows = baselineRows();
    rows.pop();
    const duplicate = packageInfo.payloads[0].questions[0];
    rows[0] = { ...rows[0], question: duplicate.question };
    const plan = planClass1NetworksImport({ payloads: packageInfo.payloads, rows, metadata: metadata() });
    expect(plan.ready).toBe(false);
    expect(plan.errors.join(" ")).toContain("production inventory drift");
    expect(plan.errors.join(" ")).toContain("duplicate stem");
  });

  it("recognizes an identical all-in-review replay while rejecting changed stored content", () => {
    const rows = baselineRows();
    let nextId = rows.length + 1;
    for (const payload of packageInfo.payloads) {
      for (const question of payload.questions) rows.push({ ...question, id: nextId++, options: JSON.stringify(question.options), reviewStatus: "in_review" });
    }
    const stagedMetadata = metadata().map((row) => ({ ...row, contentVersion: row.contentVersion + 1 }));
    const staged = planClass1NetworksImport({ payloads: packageInfo.payloads, rows, metadata: stagedMetadata });
    expect(staged).toMatchObject({ ready: false, state: "already_staged", errors: [] });
    const changed = rows.find((row) => row.bankKey === "class1-water" && row.questionNum === 2001)!;
    changed.explanation = "A conflicting changed explanation.";
    const conflict = planClass1NetworksImport({ payloads: packageInfo.payloads, rows, metadata: stagedMetadata });
    expect(conflict.state).toBe("blocked");
    expect(conflict.errors.join(" ")).toContain("immutable content conflict");
  });

  it("binds a baseline to the exact package, question snapshot, metadata, and attempt aggregates", () => {
    const rows = baselineRows();
    const meta = metadata();
    const attempts = rows.map((row) => ({ questionId: row.id, attemptCount: 0 }));
    const baseline = createBaseline({ checksum: packageInfo.checksum, rows, metadata: meta, attemptRows: attempts, capturedAtUtc: "2026-09-11T00:00:00.000Z" });
    expect(digest(baseline.questions)).toBe(baseline.questionSnapshotChecksum);
    expect(() => validateBaseline({ baseline, checksum: packageInfo.checksum, rows, metadata: meta, attemptRows: attempts })).not.toThrow();
    expect(() => validateBaseline({ baseline, checksum: `${packageInfo.checksum}x`, rows, metadata: meta, attemptRows: attempts })).toThrow("package checksum");
  });
});
