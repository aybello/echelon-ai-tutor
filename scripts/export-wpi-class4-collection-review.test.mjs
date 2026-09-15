import { test } from "node:test";
import assert from "node:assert/strict";
import { exportSnapshot, sha256, BANK_KEY } from "./export-wpi-class4-collection-review.mjs";

function fixture({ mismatch = false, fail = false } = {}) {
  const calls = [];
  const questions = [{ id: 7, bankKey: BANK_KEY, questionNum: 1, module: "Pumps", reviewStatus: "approved", isCalc: "yes", options: '["A","B","C","D"]', correctIndex: 2 }];
  return { calls, db: {
    async query(sql) { calls.push(sql); return sql.startsWith("SELECT") ? [[{ capturedAtUtc: "2026-09-15T00:00:00.000000Z" }]] : [[]]; },
    async execute(sql, keys) {
      calls.push(sql); assert.deepEqual(keys, [BANK_KEY, "wpi-class4-water-coll"]);
      if (sql.includes("COUNT(*)")) return [[{ bankKey: BANK_KEY, rowCount: mismatch ? 2 : 1 }]];
      if (sql.includes("FROM questions")) { if (fail) throw new Error("DB unavailable"); return [questions]; }
      return [[]];
    },
  }};
}
test("complete read-only snapshot preserves raw content and reproducible hashes without PII", async () => {
  const { db, calls } = fixture(); const result = await exportSnapshot(db);
  assert.equal(result.questions[0].options, '["A","B","C","D"]');
  assert.equal(result.rowHashes[0].sha256, sha256(result.questions[0]));
  assert.equal(result.contentSha256, sha256({ questions: result.questions, moduleOverviews: [], metadata: [] }));
  assert(calls.includes("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY"));
  assert.equal(calls.at(-1), "ROLLBACK");
  assert(calls.every(sql => /^(SELECT|SET SESSION|START TRANSACTION|ROLLBACK)/.test(sql)));
  assert(!calls.some(sql => /LIMIT|studentEmail|reviewedBy|purchases|organizations|question_attempts/.test(sql)));
});
test("mismatched counts reject an incomplete package and roll back", async () => {
  const { db, calls } = fixture({ mismatch: true });
  await assert.rejects(exportSnapshot(db), /INCOMPLETE_EXPORT/);
  assert.equal(calls.at(-1), "ROLLBACK");
});
test("database read failures roll back without producing a package", async () => {
  const { db, calls } = fixture({ fail: true });
  await assert.rejects(exportSnapshot(db), /DB unavailable/);
  assert.equal(calls.at(-1), "ROLLBACK");
});
