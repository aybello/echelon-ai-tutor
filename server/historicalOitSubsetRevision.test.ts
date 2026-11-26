import { describe, expect, it, vi } from "vitest";
// @ts-expect-error CLI ESM helper
import { applyHistoricalSubsetRevision, createHistoricalSubsetBaseline, planHistoricalSubsetRevision, stablePayloadChecksum } from "../scripts/lib/historicalOitSubsetRevision.mjs";

const base = { id: 71, bankKey: "oit", questionNum: 27, module: "Disinfection", difficulty: "medium", question: "Baseline question?", options: ["A response with enough words", "B response with enough words", "C response with enough words", "D response with enough words"], correctIndex: 0, explanation: "Baseline explanation.", steps: null, tip: null, isCalc: "no", topic: "Basics", cognitiveLevel: "recall", sourceTitle: "Ontario source", sourceReference: "Section 1", sourceUrl: "https://example.invalid/source", blueprintObjective: "Recognize the concept", reviewStatus: "unreviewed" };
const candidate = { ...base, question: "Revised question?", options: ["Revised answer with enough words", "Distractor response with enough words", "Another distractor with enough words", "Final distractor with enough words"], explanation: "Revised explanation.", approvalGroup: "test", approvalRationale: "Test" };
const payloadBody = { schemaVersion: 1, purpose: "review-only staged payload", createdAtUtc: "2026-09-10T00:00:00.000Z", counts: { total: 1 }, candidates: [candidate] };
const payload = { ...payloadBody, payloadChecksum: stablePayloadChecksum(payloadBody) };
const baseline = createHistoricalSubsetBaseline(payload, [base], [{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]);

describe("guarded historical approved-subset revision", () => {
  it("plans only a verified content update while preserving identity, visibility, and learner-attempt count", () => {
    const plan = planHistoricalSubsetRevision(payload, baseline, [base], { oit: 1038 }, [{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]);
    expect(plan).toMatchObject({ ready: true, changes: [{ id: 71, bankKey: "oit", questionNum: 27 }], banks: [{ total: 1, revisions: 1, expectedVisibleAfter: 1038 }] });
  });
  it.each([[{ ...base, id: 72 }, 3], [{ ...base, reviewStatus: "in_review" }, 3], [{ ...base, question: "Unexpected drift" }, 3], [base, 4]])("blocks identity, status, content, or learner-attempt drift", (row, attemptCount) => {
    expect(planHistoricalSubsetRevision(payload, baseline, [row], { oit: 1038 }, [{ bankKey: "oit", questionNum: 27, attemptCount: attemptCount }]).ready).toBe(false);
  });
  it("treats an already-applied candidate as idempotent", () => {
    const plan = planHistoricalSubsetRevision(payload, baseline, [{ ...candidate, reviewStatus: "unreviewed" }], { oit: 1038 }, [{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]);
    expect(plan).toMatchObject({ ready: true, changes: [], banks: [{ unchanged: 1, revisions: 0 }] });
  });
  it("preserves the stored schema-valid cognitive level when archival review metadata uses a non-schema taxonomy label", () => {
    const archivalCandidate = { ...candidate, cognitiveLevel: "understand" };
    const archivalBody = { ...payloadBody, candidates: [archivalCandidate] };
    const archivalPayload = { ...archivalBody, payloadChecksum: stablePayloadChecksum(archivalBody) };
    const archivalBaseline = createHistoricalSubsetBaseline(archivalPayload, [base], [{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]);
    const plan = planHistoricalSubsetRevision(archivalPayload, archivalBaseline, [base], { oit: 1038 }, [{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]);
    expect(plan).toMatchObject({ ready: true, changes: [{ content: { cognitiveLevel: "recall" } }] });
  });
  it("rolls back a reconciliation-only transaction without issuing updates", async () => {
    const connection = { beginTransaction: vi.fn(), rollback: vi.fn(), execute: vi.fn(async (sql: string) => {
      if (sql.includes("COUNT(a.id)")) return [[{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]];
      if (sql.includes("COUNT(*)")) return [[{ total: 1038 }]];
      if (sql.includes("question_bank_meta")) return [[{ bankKey: "oit" }]];
      return [[base]];
    }) };
    const plan = await applyHistoricalSubsetRevision(connection, payload, baseline);
    expect(plan.ready).toBe(true);
    expect(connection.execute.mock.calls.every(([sql]) => sql.startsWith("SELECT"))).toBe(true);
    expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it("updates only the confirmed existing row and commits atomically", async () => {
    const connection = { beginTransaction: vi.fn(), rollback: vi.fn(), commit: vi.fn(), execute: vi.fn(async (sql: string) => {
      if (sql.startsWith("UPDATE questions")) return [{ affectedRows: 1 }];
      if (sql.startsWith("UPDATE question_bank_meta")) return [{ affectedRows: 1 }];
      if (sql.includes("COUNT(a.id)")) return [[{ bankKey: "oit", questionNum: 27, attemptCount: 3 }]];
      if (sql.includes("COUNT(*)")) return [[{ total: 1038 }]];
      if (sql.includes("question_bank_meta")) return [[{ bankKey: "oit" }]];
      return [[base]];
    }) };
    const result = await applyHistoricalSubsetRevision(connection, payload, baseline, true);
    expect(result).toMatchObject({ ready: true, applied: true, changes: [{ id: 71, bankKey: "oit", questionNum: 27 }] });
    expect(connection.execute.mock.calls.some(([sql]) => sql.startsWith("UPDATE questions SET") && sql.includes("WHERE id = ?"))).toBe(true);
    expect(connection.commit).toHaveBeenCalledOnce();
  });
});
