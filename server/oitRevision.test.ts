import { describe, expect, it, vi } from "vitest";
// @ts-expect-error CLI ESM module
import { applyOitRevision, oitContentHash, planOitRevision } from "../scripts/lib/oitRevision.mjs";

const base = { bankKey: "oit", questionNum: 1001, module: "Water", difficulty: "easy", question: "Baseline question?", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Baseline explanation", isCalc: "no", topic: "Basics" };
const candidate = { ...base, question: "Revised question?", options: ["Revised A", "B", "C", "D"], explanation: "Revised explanation" };
const baselineBody = { schemaVersion: 1, generatedAt: "2026-09-09T00:00:00.000Z", manifestVersion: "2026-09-09-v4", banks: [{ bankKey: "oit", count: 1, entries: [{ questionNum: 1001, contentHash: oitContentHash(base), reviewStatus: "unreviewed", content: { ...base, bankKey: undefined, questionNum: undefined } }] }] };
// Match the baseline utility's deterministic serialization.
const baseline = { ...baselineBody, baselineChecksum: "" } as typeof baselineBody & { baselineChecksum: string };
baseline.baselineChecksum = (await import("node:crypto")).createHash("sha256").update(`${JSON.stringify(baselineBody, null, 2)}\n`).digest("hex");
const payloads = [{ bankKey: "oit", questions: [candidate] }];
const stored = (extra = {}) => ({ ...base, reviewStatus: "unreviewed", ...extra });

describe("exact-version OIT question revision", () => {
  it("plans only the approved content difference while preserving identity and visibility", () => {
    const plan = planOitRevision(payloads, baseline, [stored()]);
    expect(plan).toMatchObject({ ready: true, changes: [{ bankKey: "oit", questionNum: 1001 }], banks: [{ unchanged: 0, revisions: 1, visibleBefore: 1, expectedVisibleAfter: 1 }] });
  });
  it.each([stored({ question: "Unexpected drift?" }), stored({ reviewStatus: "in_review" }), { ...stored(), questionNum: 1002 }])("blocks drift, unsafe status, or missing IDs", row => {
    expect(planOitRevision(payloads, baseline, [row]).ready).toBe(false);
  });
  it("recognizes an already-applied candidate row as an idempotent completed state", () => {
    const plan = planOitRevision(payloads, baseline, [stored(candidate)]);
    expect(plan).toMatchObject({ ready: true, changes: [], banks: [{ unchanged: 1, revisions: 0 }] });
  });
  it("rolls back read-only reconciliation without an update", async () => {
    const connection = { beginTransaction: vi.fn(), rollback: vi.fn(), execute: vi.fn(async (sql: string) => {
      if (sql.includes("COUNT(*)")) return [[{ total: 1 }]];
      return sql.includes("question_bank_meta") ? [[{ bankKey: "oit" }]] : [[stored()]];
    }) };
    const plan = await applyOitRevision(connection, payloads, baseline);
    expect(plan.ready).toBe(true);
    expect(connection.execute.mock.calls.every(([sql]) => sql.startsWith("SELECT"))).toBe(true);
    expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it("updates only the confirmed revision, retains visible status, and commits atomically", async () => {
    const connection = { beginTransaction: vi.fn(), rollback: vi.fn(), commit: vi.fn(), execute: vi.fn(async (sql: string) => {
      if (sql.startsWith("UPDATE questions")) return [{ affectedRows: 1 }];
      if (sql.startsWith("UPDATE question_bank_meta")) return [{ affectedRows: 1 }];
      if (sql.includes("COUNT(*)")) return [[{ total: 1 }]];
      return sql.includes("question_bank_meta") ? [[{ bankKey: "oit" }]] : [[stored()]];
    }) };
    const result = await applyOitRevision(connection, payloads, baseline, true);
    expect(result).toMatchObject({ ready: true, applied: true, changes: [{ bankKey: "oit", questionNum: 1001 }] });
    expect(connection.execute.mock.calls.some(([sql]) => sql.startsWith("UPDATE questions SET") && !sql.includes("reviewStatus ="))).toBe(true);
    expect(connection.commit).toHaveBeenCalledOnce();
  });
  it("uses full-bank visible totals when package rows are a strict subset of an active bank", async () => {
    const connection = { beginTransaction: vi.fn(), rollback: vi.fn(), commit: vi.fn(), execute: vi.fn(async (sql: string, _params?: unknown[]) => {
      if (sql.startsWith("UPDATE questions")) return [{ affectedRows: 1 }];
      if (sql.startsWith("UPDATE question_bank_meta")) return [{ affectedRows: 1 }];
      if (sql.includes("COUNT(*)")) return [[{ total: 17 }]];
      return sql.includes("question_bank_meta") ? [[{ bankKey: "oit" }]] : [[stored()]];
    }) };
    const result = await applyOitRevision(connection, payloads, baseline, true);
    expect(result.banks[0]).toMatchObject({ packageCount: 1, visibleBefore: 1, fullVisibleBefore: 17, expectedFullVisibleAfter: 17 });
    expect(connection.execute.mock.calls.find(([sql]) => sql.startsWith("UPDATE question_bank_meta"))?.[1]).toEqual([17, "oit"]);
    expect(connection.commit).toHaveBeenCalledOnce();
  });
});
