import { describe, expect, it, vi } from "vitest";
import { clearDiagnosticDraft, createDiagnosticDraftScope, resolveDiagnosticDraftIdentity, loadDiagnosticDraft, saveDiagnosticDraft, type DiagnosticDraft } from "./diagnosticDraft";
import { enqueuePracticeSave, listPendingPracticeSaves, replayPendingPracticeSaves, type PendingPracticeSave } from "./practiceSaveOutbox";
const storage = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; };
const scope = { identity: "learner@example.test", courseKey: "oit" };
const ids = Array.from({ length: 15 }, (_, index) => 1001 + index);
const draft = (): DiagnosticDraft => ({ version: 1, scope, sessionId: "550e8400-e29b-41d4-a716-446655440000", questionIds: ids, answers: Object.fromEntries(ids.slice(0, 14).map(id => [id, 2])), questionIndex: 14, updatedAt: 123 });
const operation = (): PendingPracticeSave => ({ version: 1, operationId: "op-original", scope, questionId: 1001, attemptToken: "original-issued-receipt", selectedIndex: 2, bankKey: "oit", quizMode: "standard", sessionId: "original-session", createdAt: 123 });
describe("diagnostic browser continuity", () => {
  it.each([
    { userId: 7, email: undefined, expected: "user:7", label: "email-less OAuth" },
    { userId: 7, email: "Other@Example.Test", expected: "user:7", label: "OAuth takes precedence over OTP" },
    { userId: undefined, email: " Learner@Example.Test ", expected: "learner@example.test", label: "normalized OTP" },
    { userId: undefined, email: undefined, expected: null, label: "anonymous" },
  ])("scopes $label from verified identity", ({ userId, email, expected }) => {
    const identity = resolveDiagnosticDraftIdentity(userId, email);
    expect(identity).toBe(expected);
    expect(createDiagnosticDraftScope(identity, "oit")).toEqual(expected ? { identity: expected, courseKey: "oit" } : null);
  });
  it("keeps the same OAuth draft across email changes and excludes another OAuth user", () => {
    const db = storage();
    const originalScope = createDiagnosticDraftScope(resolveDiagnosticDraftIdentity(7, undefined), "oit")!;
    const original = { ...draft(), scope: originalScope };
    saveDiagnosticDraft(db, original);
    expect(loadDiagnosticDraft(db, createDiagnosticDraftScope(resolveDiagnosticDraftIdentity(7, "new@example.test"), "oit")!, ids)).toEqual(original);
    expect(loadDiagnosticDraft(db, createDiagnosticDraftScope(resolveDiagnosticDraftIdentity(8, "new@example.test"), "oit")!, ids)).toBeNull();
  });

  it("resumes question 15 with all 14 answers and the original submission ID after refresh", () => { const db = storage(); const original = draft(); expect(saveDiagnosticDraft(db, original)).toBe(true); expect(loadDiagnosticDraft(db, scope, ids)).toEqual(original); });
  it("does not transfer answers between identities or courses", () => { const db = storage(); saveDiagnosticDraft(db, draft()); expect(loadDiagnosticDraft(db, { ...scope, identity: "other@example.test" }, ids)).toBeNull(); expect(loadDiagnosticDraft(db, { ...scope, courseKey: "class1-water" }, ids)).toBeNull(); });
  it("refuses a changed or reordered question set instead of guessing", () => { const db = storage(); saveDiagnosticDraft(db, draft()); expect(loadDiagnosticDraft(db, scope, [...ids].reverse())).toBeNull(); expect(loadDiagnosticDraft(db, scope, [...ids.slice(0, 14), 9999])).toBeNull(); });
  it("only clears the acknowledged draft session and preserves another course", () => { const db = storage(); saveDiagnosticDraft(db, draft()); const other = { ...draft(), scope: { ...scope, courseKey: "class1-water" } }; saveDiagnosticDraft(db, other); clearDiagnosticDraft(db, scope, "not-the-session"); expect(loadDiagnosticDraft(db, scope, ids)).not.toBeNull(); clearDiagnosticDraft(db, scope, draft().sessionId); expect(loadDiagnosticDraft(db, scope, ids)).toBeNull(); expect(loadDiagnosticDraft(db, other.scope, ids)).toEqual(other); });
  it("fails closed on corrupt or unavailable storage", () => { expect(loadDiagnosticDraft({ getItem: () => "invalid" }, scope, ids)).toBeNull(); expect(saveDiagnosticDraft({ getItem: () => null, setItem: () => { throw Error("quota"); } }, draft())).toBe(false); });
  it("normalizes identity without assigning anonymous drafts", () => { expect(createDiagnosticDraftScope(" Learner@Example.Test ", "oit")).toEqual(scope); expect(createDiagnosticDraftScope(null, "oit")).toBeNull(); });
  it.each([{ version: 2 }, { sessionId: "not-a-uuid" }, { answers: [] }])("rejects an incompatible or malformed local draft: %j", invalid => {
    const db = { getItem: () => JSON.stringify([{ ...draft(), ...invalid }]) };
    expect(loadDiagnosticDraft(db, scope, ids)).toBeNull();
  });
});
describe("pending saves never blindly duplicate attempts", () => {
  it("retains original operation, receipt, selection and session after navigation", () => { const db = storage(); enqueuePracticeSave(db, operation()); expect(listPendingPracticeSaves(db, scope)).toEqual([operation()]); });
  it("keeps other identities and courses isolated", () => { const db = storage(); enqueuePracticeSave(db, operation()); expect(listPendingPracticeSaves(db, { ...scope, courseKey: "class1-water" })).toEqual([]); expect(listPendingPracticeSaves(db, { ...scope, identity: "other" })).toEqual([]); });
  it("never calls the server for an ambiguous failed save without idempotency", async () => { const db = storage(); enqueuePracticeSave(db, operation()); const save = vi.fn(); expect(await replayPendingPracticeSaves(db, scope, save, { supportsIdempotency: false, isScopeActive: () => true })).toEqual({ saved: 0, pending: 1 }); expect(save).not.toHaveBeenCalled(); });
  it("retains a lost acknowledgement and uses the exact operation for an idempotent recovery", async () => { const db = storage(); enqueuePracticeSave(db, operation()); const save = vi.fn().mockRejectedValueOnce(Error("lost response")).mockResolvedValueOnce({ success: true }); const options = { supportsIdempotency: true, isScopeActive: () => true }; expect(await replayPendingPracticeSaves(db, scope, save, options)).toEqual({ saved: 0, pending: 1 }); expect(await replayPendingPracticeSaves(db, scope, save, options)).toEqual({ saved: 1, pending: 0 }); expect(save.mock.calls.map(call => call[0])).toEqual([operation(), operation()]); });
  it("stops before sending when the active identity changes", async () => { const db = storage(); enqueuePracticeSave(db, operation()); const save = vi.fn(); await replayPendingPracticeSaves(db, scope, save, { supportsIdempotency: true, isScopeActive: () => false }); expect(save).not.toHaveBeenCalled(); expect(listPendingPracticeSaves(db, scope)).toHaveLength(1); });
  it("retains explicit unsuccessful acknowledgements", async () => { const db = storage(); enqueuePracticeSave(db, operation()); expect(await replayPendingPracticeSaves(db, scope, async () => ({ success: false }), { supportsIdempotency: true, isScopeActive: () => true })).toEqual({ saved: 0, pending: 1 }); });
});
