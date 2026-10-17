import { describe, expect, it, vi } from "vitest";
import {
  DIAGNOSTIC_DRAFT_STORAGE_KEY, loadDiagnosticDraft, saveDiagnosticDraft, clearDiagnosticDraft,
  upgradeLegacyDiagnosticDraft, resolveVerifiedLegacyDiagnosticScope,
  type DiagnosticDraft,
} from "./diagnosticDraft";

const ids = Array.from({ length: 15 }, (_, i) => i + 1);
const legacyScope = { identity: "owner@example.test", courseKey: "oit" };
const scope = { identity: "user:7", courseKey: "oit" };
const original: DiagnosticDraft = {
  version: 1, scope: legacyScope, sessionId: "550e8400-e29b-41d4-a716-446655440000",
  questionIds: ids, answers: { 1: 2, 2: 0 }, questionIndex: 2, updatedAt: 123,
};
function storage(records: unknown[] = [original]) {
  const data = new Map<string, string>([[DIAGNOSTIC_DRAFT_STORAGE_KEY, JSON.stringify(records)]]);
  return {
    get length() { return data.size; }, key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (key = DIAGNOSTIC_DRAFT_STORAGE_KEY) => data.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
  };
}

describe("trusted OAuth email draft upgrade", () => {
  it("derives an alias only from the authenticated OAuth user's own email", () => {
    expect(resolveVerifiedLegacyDiagnosticScope(7, " Owner@Example.Test ", "oit")).toEqual(legacyScope);
    expect(resolveVerifiedLegacyDiagnosticScope(undefined, "owner@example.test", "oit")).toBeNull();
    expect(resolveVerifiedLegacyDiagnosticScope(7, null, "oit")).toBeNull();
  });

  it("upgrades old v1 storage and reloads all work under the actual user ID", () => {
    const db = storage();
    const upgraded = upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope);
    expect(upgraded).toEqual({ ...original, scope });
    expect(upgraded?.sessionId).toBe(original.sessionId);
    expect(upgraded?.answers).toEqual(original.answers);
    expect(loadDiagnosticDraft(db, scope, ids)).toEqual(upgraded);
    expect(loadDiagnosticDraft(db, legacyScope, ids)).toBeNull();
    expect(db.setItem).toHaveBeenCalledTimes(2);
    expect(db.setItem.mock.calls[0][0]).toBe('echelon:diagnostic-draft:v2:["user:7","oit"]');
    expect(db.setItem.mock.calls[1][0]).toContain("echelon:diagnostic-draft:removed:v2:");
    expect(db.getItem(DIAGNOSTIC_DRAFT_STORAGE_KEY)).toBe(JSON.stringify([original]));
  });

  it("never discovers identity aliases from local storage or another OTP email", () => {
    const db = storage();
    expect(upgradeLegacyDiagnosticDraft(db, scope, ids)).toBeNull();
    const ownEmail = resolveVerifiedLegacyDiagnosticScope(7, "different@example.test", "oit");
    expect(upgradeLegacyDiagnosticDraft(db, scope, ids, ownEmail)).toBeNull();
    expect(upgradeLegacyDiagnosticDraft(db, legacyScope, ids, legacyScope)).toEqual(original);
    expect(db.setItem).not.toHaveBeenCalled();
  });

  it("prefers a valid user-ID draft even when the email draft is newer", () => {
    const current = { ...original, scope, answers: { 1: 1 }, updatedAt: 1 };
    const db = storage([{ ...original, updatedAt: 999 }, current]);
    expect(upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope)).toEqual(current);
    expect(db.setItem).not.toHaveBeenCalled();
  });

  it.each([
    { questionIds: [...ids].reverse() },
    { questionIds: [...ids.slice(0, 14), 99] },
    { scope: { ...legacyScope, courseKey: "other" } },
    { sessionId: "invalid" }, { version: 2 }, { questionIndex: 15 },
    { answers: { 99: 1 } }, { answers: { 1: -1 } }, { answers: { 1: 1.5 } },
  ])("does not migrate invalid or mismatched work: %j", invalid => {
    const db = storage([{ ...original, ...invalid }]);
    expect(upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope)).toBeNull();
    expect(db.setItem).not.toHaveBeenCalled();
  });

  it("requires the trusted alias to have the exact target course", () => {
    const db = storage();
    expect(upgradeLegacyDiagnosticDraft(db, scope, ids, { ...legacyScope, courseKey: "other" })).toBeNull();
  });

  it("retains the original email record on failed writes, then retries safely", () => {
    const db = storage();
    const before = db.getItem();
    db.setItem.mockImplementationOnce(() => { throw Error("quota"); });
    const resumed = upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope)!;
    expect(resumed).toEqual({ ...original, scope });
    expect(db.getItem()).toBe(before);
    expect(loadDiagnosticDraft(db, legacyScope, ids)).toEqual(original);
    expect(saveDiagnosticDraft(db, resumed, legacyScope)).toBe(true);
    expect(loadDiagnosticDraft(db, scope, ids)).toEqual(resumed);
    expect(loadDiagnosticDraft(db, legacyScope, ids)).toBeNull();
  });

  it("preserves unrelated identities, courses, and sessions during upgrade", () => {
    const other = { ...original, scope: { ...legacyScope, courseKey: "other" } };
    const stranger = { ...original, scope: { ...legacyScope, identity: "stranger@example.test" } };
    const db = storage([original, other, stranger]);
    upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope);
    expect(loadDiagnosticDraft(db, other.scope, ids)).toEqual(other);
    expect(loadDiagnosticDraft(db, stranger.scope, ids)).toEqual(stranger);
  });
});

describe("independent diagnostic scopes", () => {
  it("keeps interleaved saves in another course and another identity", () => {
    const db = storage([]);
    const other = { ...original, scope: { identity: "other", courseKey: "other" } };
    const write = db.setItem.getMockImplementation()!;
    db.setItem.mockImplementationOnce((key, value) => { saveDiagnosticDraft(db, other); write(key, value); });
    saveDiagnosticDraft(db, original);
    expect(loadDiagnosticDraft(db, original.scope, ids)).toEqual(original);
    expect(loadDiagnosticDraft(db, other.scope, ids)).toEqual(other);
    clearDiagnosticDraft(db, original.scope, original.sessionId);
    expect(loadDiagnosticDraft(db, other.scope, ids)).toEqual(other);
  });
  it("does not resurrect a completed legacy draft or overwrite unrelated legacy work", () => {
    const other = { ...original, scope: { ...scope, courseKey: "other" } };
    const db = storage([original, other]); const before = db.getItem();
    clearDiagnosticDraft(db, original.scope, original.sessionId);
    expect(loadDiagnosticDraft(db, original.scope, ids)).toBeNull();
    expect(upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope)).toBeNull();
    expect(loadDiagnosticDraft(db, other.scope, ids)).toEqual(other);
    expect(db.getItem()).toBe(before);
  });
  it("encodes scope boundaries without delimiter collisions", () => {
    const db = storage([]), a = { ...original, scope: { identity: "a:b", courseKey: "c" } }, b = { ...original, scope: { identity: "a", courseKey: "b:c" } };
    saveDiagnosticDraft(db, a); saveDiagnosticDraft(db, b);
    expect(loadDiagnosticDraft(db, a.scope, ids)).toEqual(a); expect(loadDiagnosticDraft(db, b.scope, ids)).toEqual(b);
  });
});

it("does not restore an older OAuth alias after completing a user-ID draft", () => {
  const current = { ...original, scope };
  const db = storage([original, current]);
  clearDiagnosticDraft(db, scope, current.sessionId);
  expect(loadDiagnosticDraft(db, scope, ids, legacyScope)).toBeNull();
  expect(upgradeLegacyDiagnosticDraft(db, scope, ids, legacyScope)).toBeNull();
});
