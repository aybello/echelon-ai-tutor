import { describe, expect, it, vi } from "vitest";
import { enqueuePracticeSave, listPendingPracticeSaves, practiceSaveInput, practiceSaveRetryProblem, retryPendingPracticeSave, type PendingPracticeSave } from "./practiceSaveOutbox";
const scope = { identity: "user:17", courseKey: "oit" };
const storage = () => { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } }; };
const item = (): PendingPracticeSave => ({ version: 1, idempotencyVersion: 1, operationId: "550e8400-e29b-41d4-a716-446655440001", scope, examType: "oit", bankKey: "oit", questionId: 4, selectedIndex: 2, quizMode: "standard", sessionId: "550e8400-e29b-41d4-a716-446655440000", confidence: "low", bookmarked: false, attemptToken: `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now()/1000)+3600 }))}.signature`, createdAt: 1 });
describe("explicit practice recovery", () => {
  it("lost acknowledgement sends the exact same operation and original input twice, then clears only the acknowledged record", async () => {
    const db = storage(), original = item(), other = { ...original, operationId: "550e8400-e29b-41d4-a716-446655440002" };
    enqueuePracticeSave(db, original); enqueuePracticeSave(db, other);
    const send = vi.fn().mockRejectedValueOnce(Error("lost ack")).mockResolvedValueOnce({ success: true });
    await retryPendingPracticeSave(db, scope, original.operationId, send, () => true);
    expect(listPendingPracticeSaves(db, scope)).toHaveLength(2);
    await retryPendingPracticeSave(db, scope, original.operationId, send, () => true);
    expect(send.mock.calls.map(call => call[0])).toEqual([practiceSaveInput(original), practiceSaveInput(original)]);
    expect(listPendingPracticeSaves(db, scope)).toEqual([other]);
  });
  it("uses the current access token while retaining the original operation and signed receipt", async () => {
    const db = storage(), original = item(); enqueuePracticeSave(db, original);
    db.setItem("echelon_access_token", "synthetic-old-access");
    const send = vi.fn().mockRejectedValueOnce(Error("lost ack")).mockResolvedValueOnce({ success: true });
    await retryPendingPracticeSave(db, scope, original.operationId, send, () => true);
    db.setItem("echelon_access_token", "synthetic-renewed-access");
    await retryPendingPracticeSave(db, scope, original.operationId, send, () => true);
    expect(send.mock.calls[0][0]).toEqual({ ...practiceSaveInput(original), accessToken: "synthetic-old-access" });
    expect(send.mock.calls[1][0]).toEqual({ ...practiceSaveInput(original), accessToken: "synthetic-renewed-access" });
    expect(listPendingPracticeSaves(db, scope)).toEqual([]);
  });
  it.each([{ idempotencyVersion: undefined }, { attemptToken: undefined }, { attemptToken: "invalid" }, { attemptToken: `e30.${btoa('{}')}.sig` }, { attemptToken: `e30.${btoa('{"exp":1}')}.sig` }, { quizMode: "mock" }, { confidence: "invented" }, { bankKey: "class1-water" }, { examType: "unknown" }])("rejects unsafe stored input without a new call: %j", async patch => {
    const db = storage(), original = { ...item(), ...patch } as PendingPracticeSave; enqueuePracticeSave(db, original);
    const send = vi.fn(); await retryPendingPracticeSave(db, scope, original.operationId, send, () => true);
    expect(send).not.toHaveBeenCalled(); expect(listPendingPracticeSaves(db, scope)).toHaveLength(1);
  });
  it("wrong scope and switching identities never replay", async () => {
    const db = storage(), original = item(); enqueuePracticeSave(db, original); const send = vi.fn();
    await retryPendingPracticeSave(db, { ...scope, identity: "user:18" }, original.operationId, send, () => true);
    await retryPendingPracticeSave(db, scope, original.operationId, send, () => false);
    expect(send).not.toHaveBeenCalled();
  });
  it("retains server denials exactly, and does not invent a free-beta receipt", async () => {
    const db = storage(), original = item(); enqueuePracticeSave(db, original);
    await retryPendingPracticeSave(db, scope, original.operationId, async () => ({ success: false }), () => true);
    expect(listPendingPracticeSaves(db, scope)).toEqual([original]);
    expect(practiceSaveRetryProblem({ ...original, examType: "electrician-309a", bankKey: "electrician-309a", scope: { ...scope, courseKey: "electrician-309a" }, attemptToken: undefined }, { ...scope, courseKey: "electrician-309a" })).toMatch(/receipt/);
  });
});
