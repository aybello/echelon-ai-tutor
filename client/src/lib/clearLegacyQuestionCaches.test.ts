import { expect, it } from "vitest";
import { clearLegacyQuestionCaches } from "./clearLegacyQuestionCaches";
it("removes every legacy question cache without deleting login or learning progress", () => {
  const values = new Map([
    ["echelon_qbank_class1-water", "private answers"], ["echelon_qbank_oit", "old questions"],
    ["echelon_access_token", "verified login"], ["flashcard_progress", "retained progress"],
  ]);
  const storage = { get length() { return values.size; }, key: (i: number) => [...values.keys()][i] ?? null,
    removeItem: (key: string) => { values.delete(key); } } as Storage;
  clearLegacyQuestionCaches(storage);
  expect([...values]).toEqual([["echelon_access_token", "verified login"], ["flashcard_progress", "retained progress"]]);
  clearLegacyQuestionCaches(storage);
  expect(values.size).toBe(2);
});
