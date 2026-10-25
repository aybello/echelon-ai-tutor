import { describe, expect, it } from "vitest";
import { enqueuePracticeSave, listPendingPracticeSaves, removePendingPracticeSave, PRACTICE_SAVE_OUTBOX_KEY, type PendingPracticeSave } from "./practiceSaveOutbox";
const scope = { identity: "user:7", courseKey: "oit" };
const item = (id: number): PendingPracticeSave => ({ version: 1, operationId: `550e8400-e29b-41d4-a716-44665544000${id}`, scope, questionId: id, selectedIndex: 2, bankKey: "oit", quizMode: "standard", sessionId: "550e8400-e29b-41d4-a716-446655440000", createdAt: id });
function storage() {
  const data = new Map<string, string>();
  let interleave: (() => void) | undefined;
  return {
    data, get length() { return data.size; }, key: (i: number) => [...data.keys()][i] ?? null,
    getItem(key: string): string | null { const value = data.get(key) ?? null; if (key === PRACTICE_SAVE_OUTBOX_KEY && interleave) { const run = interleave; interleave = undefined; run(); } return value; },
    setItem: (key: string, value: string) => { if (interleave) { const run = interleave; interleave = undefined; run(); } data.set(key, value); }, removeItem: (key: string) => { data.delete(key); },
    duringLegacyRead: (run: () => void) => { interleave = run; },
  };
}
describe("independent pending-operation storage", () => {
  it("keeps two enqueues after both clients read the initial array", () => {
    const db = storage(); db.duringLegacyRead(() => enqueuePracticeSave(db, item(2)));
    enqueuePracticeSave(db, item(1));
    expect(listPendingPracticeSaves(db, scope).map(x => x.operationId).sort()).toEqual([item(1).operationId, item(2).operationId]);
  });
  it("acknowledges only A while another tab enqueues B and C remains unacknowledged", () => {
    const db = storage(); enqueuePracticeSave(db, item(1)); enqueuePracticeSave(db, item(3));
    db.duringLegacyRead(() => enqueuePracticeSave(db, item(2)));
    removePendingPracticeSave(db, item(1).operationId);
    expect(listPendingPracticeSaves(db, scope).map(x => x.operationId).sort()).toEqual([item(2).operationId, item(3).operationId]);
  });
  it("tombstones a legacy acknowledgement without rewriting or resurrecting the shared array", () => {
    const db = storage(); const raw = JSON.stringify([item(1), item(2)]); db.setItem(PRACTICE_SAVE_OUTBOX_KEY, raw);
    expect(removePendingPracticeSave(db, item(1).operationId)).toBe(true);
    expect(db.getItem(PRACTICE_SAVE_OUTBOX_KEY)).toBe(raw);
    expect(listPendingPracticeSaves(db, scope)).toEqual([item(2)]);
  });
});

it("retains a legacy record exactly until its own explicit acknowledgement", () => {
  const db = storage(); const original = item(1); db.setItem(PRACTICE_SAVE_OUTBOX_KEY, JSON.stringify([original]));
  enqueuePracticeSave(db, item(2));
  expect(listPendingPracticeSaves(db, scope)).toEqual([original, item(2)]);
  removePendingPracticeSave(db, original.operationId);
  db.setItem(PRACTICE_SAVE_OUTBOX_KEY, JSON.stringify([original, item(3)]));
  expect(listPendingPracticeSaves(db, scope).map(x => x.operationId).sort()).toEqual([item(2).operationId, item(3).operationId]);
});
it("does not claim durability for a store without enumeration", () => {
  const db = { getItem: () => null, setItem: () => {} };
  expect(enqueuePracticeSave(db as unknown as Storage, item(1))).toBe(false);
});

it("skips a corrupt independent JSON record without hiding valid records", () => {
  const db = storage();
  enqueuePracticeSave(db, item(1));
  db.data.set("echelon:practice-save-outbox:v2:corrupt", "{not-json");
  expect(listPendingPracticeSaves(db, scope)).toEqual([item(1)]);
});

it.each(["legacy getItem", "length", "key", "record getItem", "tombstone getItem"])("surfaces a storage access failure from %s", failure => {
  const db = storage();
  enqueuePracticeSave(db, item(1));
  const originalGetItem = db.getItem.bind(db);
  const broken = {
    get length() {
      if (failure === "length") throw Error("storage unavailable");
      return db.length;
    },
    key(index: number) {
      if (failure === "key") throw Error("storage unavailable");
      return db.key(index);
    },
    getItem(key: string) {
      if (failure === "legacy getItem" && key === PRACTICE_SAVE_OUTBOX_KEY) throw Error("storage unavailable");
      if (failure === "record getItem" && key.startsWith("echelon:practice-save-outbox:v2:")) throw Error("storage unavailable");
      if (failure === "tombstone getItem" && key.startsWith("echelon:practice-save-outbox:removed:v2:")) throw Error("storage unavailable");
      return originalGetItem(key);
    },
  };
  expect(() => listPendingPracticeSaves(broken, scope)).toThrow("storage unavailable");
});
