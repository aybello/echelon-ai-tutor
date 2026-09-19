import test from "node:test";
import assert from "node:assert/strict";
import { exportWpiBanks, sha256, WPI_BANK_KEYS } from "./export-wpi-bank-review.mjs";

function fixture({ mismatch = false, fail = false } = {}) {
  const calls = [];
  const questions = WPI_BANK_KEYS.map((bankKey, index) => ({
    id: index + 1,
    bankKey,
    questionNum: 1,
    module: "Operations",
    reviewStatus: "approved",
    isCalc: index % 2 ? "yes" : "no",
    cognitiveLevel: index % 2 ? "application" : "recall",
    options: '["A","B","C","D"]',
    correctIndex: index % 4,
  }));
  return {
    calls,
    db: {
      async query(sql) {
        calls.push(sql);
        return sql.startsWith("SELECT") ? [[{ capturedAtUtc: "2026-09-18T00:00:00.000000Z" }]] : [[]];
      },
      async execute(sql, keys) {
        calls.push(sql);
        assert.deepEqual(keys, WPI_BANK_KEYS);
        if (sql.includes("COUNT(*)")) {
          return [questions.map(row => ({ bankKey: row.bankKey, rowCount: mismatch && row.id === 1 ? 2 : 1 }))];
        }
        if (sql.includes("FROM questions")) {
          if (fail) throw new Error("DB unavailable");
          return [questions];
        }
        return [[]];
      },
    },
  };
}

test("exports all sold WPI banks in one consistent read-only snapshot", async () => {
  const { db, calls } = fixture();
  const result = await exportWpiBanks(db);
  assert.equal(result.questions.length, 16);
  assert.deepEqual(result.missingBankKeys, []);
  assert.equal(result.contentSha256, sha256({ questions: result.questions, moduleOverviews: [], metadata: [] }));
  assert.equal(result.rowHashes[0].sha256, sha256(result.questions[0]));
  assert(calls.includes("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY"));
  assert.equal(calls.at(-1), "ROLLBACK");
  assert(calls.every(sql => /^(SELECT|SET SESSION|START TRANSACTION|ROLLBACK)/.test(sql)));
  assert(!calls.some(sql => /studentEmail|reviewedBy|purchases|organizations|question_attempts/.test(sql)));
});

test("an incomplete snapshot is rejected and rolled back", async () => {
  const { db, calls } = fixture({ mismatch: true });
  await assert.rejects(exportWpiBanks(db), /INCOMPLETE_EXPORT/);
  assert.equal(calls.at(-1), "ROLLBACK");
});

test("database read failures roll back", async () => {
  const { db, calls } = fixture({ fail: true });
  await assert.rejects(exportWpiBanks(db), /DB unavailable/);
  assert.equal(calls.at(-1), "ROLLBACK");
});
