import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyPublicQuestionCorrection, planPublicQuestionCorrection, EXPECTED_FIELDS } from "./publicQuestionCorrection.mjs";
import { authoritativeRepairConnection, parseRepairArguments } from "../repair-public-question-items.mjs";
import { DEFAULT_OIT_REPAIR_BACKUP_ROOT, writeDurableOitRepairBackup } from "./oitReportedItemBackup.mjs";

const clone = value => structuredClone(value);
function fixtures() {
  const expected = (id, bankKey, questionNum) => ({ id, bankKey, questionNum, question: "What is the result?", options: '["73.3","90","60","66.7"]', correctIndex: 0, explanation: "Old arithmetic", steps: '[{"l":"broken","c":"unclosed)}"]', isCalc: "yes", reviewStatus: "unreviewed" });
  const corrections = { version: "fixture-v1", corrections: [
    { expected: expected(1, "alpha", 522), replacement: { options: '["76.7","90","60","66.7"]', correctIndex: 0, explanation: "Weighted result is 76.7.", steps: '[{"l":"Compute","c":"920000 / 12000 = 76.7"}]' } },
    { expected: expected(2, "beta", 650), replacement: { steps: '[{"l":"Security measures","c":"Access management"}]' } },
    { expected: expected(3, "alpha", 523), replacement: { steps: '[{"l":"Compute","c":"Check units"}]' } },
  ] };
  const rows = corrections.corrections.map(({ expected }) => ({ ...expected, module: "Preserve module", reviewedBy: null, reviewedAt: null, tip: "Keep this tip", sourceTitle: "Keep provenance" }));
  rows.push({ ...clone(rows[0]), id: 4, questionNum: 524, reviewStatus: "approved" });
  const metadata = [{ id: 8, bankKey: "alpha", totalQuestions: 3, contentVersion: 12, blueprintVersion: 7, modules: "[]" }, { id: 9, bankKey: "beta", totalQuestions: 1, contentVersion: 25, blueprintVersion: 4, modules: "[]" }];
  return { corrections, rows, metadata };
}
function fakeDatabase(failure) {
  const fixture = fixtures();
  const state = { rows: clone(fixture.rows), metadata: clone(fixture.metadata) };
  const events = [], sqls = [];
  let saved, wrote = false;
  const connection = {
    beginTransaction: async () => { saved = clone(state); events.push("begin"); },
    commit: async () => { if (failure === "commit") throw new Error("commit failure"); events.push("commit"); },
    rollback: async () => { if (saved) Object.assign(state, clone(saved)); events.push("rollback"); },
    execute: async (sql, values = []) => {
      sqls.push(sql);
      if (sql === "START TRANSACTION READ ONLY") { saved = clone(state); events.push("read-only"); return [[]]; }
      if (sql.startsWith("SELECT * FROM question_bank_meta")) {
        events.push("metadata-read");
        const result = clone(state.metadata);
        if (wrote && failure === "metadata-readback") result[0].blueprintVersion++;
        return [result];
      }
      if (sql.startsWith("SELECT id, bankKey, reviewStatus")) {
        events.push("inventory-read");
        const rows = state.rows.map(({ id, bankKey, reviewStatus }) => ({ id, bankKey, reviewStatus }));
        if (wrote && failure === "inventory-readback") rows.pop();
        if (wrote && failure === "status-readback") rows.at(-1).reviewStatus = "rejected";
        return [clone(rows)];
      }
      if (sql.startsWith("SELECT * FROM questions")) {
        events.push("questions-read");
        const rows = clone(state.rows.filter(row => row.id <= 3));
        if (wrote && failure === "row-readback") rows[0].tip = "Unexpected change";
        return [rows];
      }
      if (sql.startsWith("UPDATE questions SET")) {
        events.push("question-write"); wrote = true;
        if (failure === "question-update") return [{ affectedRows: 0 }];
        const fields = [...sql.split(" WHERE ")[0].matchAll(/`(\w+)` = \?/g)].map(match => match[1]);
        const [id, bankKey, questionNum, reviewStatus] = values.slice(fields.length);
        const row = state.rows.find(row => row.id === id && row.bankKey === bankKey && row.questionNum === questionNum && row.reviewStatus === reviewStatus);
        if (!row) return [{ affectedRows: 0 }];
        fields.forEach((field, index) => { row[field] = values[index]; });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith("UPDATE question_bank_meta")) {
        events.push("metadata-write");
        if (failure === "metadata-update") return [{ affectedRows: 0 }];
        const row = state.metadata.find(row => row.bankKey === values[1] && row.contentVersion === values[2]);
        if (!row) return [{ affectedRows: 0 }];
        row.contentVersion = values[0];
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const plan = () => planPublicQuestionCorrection(state.rows.filter(row => row.id <= 3), state.metadata, state.rows.map(({ id, bankKey, reviewStatus }) => ({ id, bankKey, reviewStatus })), fixture.corrections);
  return { fixture, state, events, sqls, connection, plan };
}
async function apply(fake, overrides = {}) {
  return applyPublicQuestionCorrection(fake.connection, { corrections: fake.fixture.corrections, apply: true, expectedPlanHash: fake.plan().planHash, backup: async () => { fake.events.push("backup"); }, ...overrides });
}

test("default opens an explicitly read-only transaction and never calls backup or writes", async () => {
  const fake = fakeDatabase();
  const result = await applyPublicQuestionCorrection(fake.connection, { corrections: fake.fixture.corrections, backup: () => assert.fail("backup in plan") });
  assert.equal(result.ready, true);
  assert.equal(result.changes.length, 3);
  assert.deepEqual(fake.events.slice(0, 1), ["read-only"]);
  assert.equal(fake.events.at(-1), "rollback");
  assert.ok(fake.sqls.every(sql => !sql.startsWith("UPDATE") && !sql.includes("FOR UPDATE")));
});

test("every required baseline field and raw JSON serialization are exact", () => {
  for (const field of EXPECTED_FIELDS) {
    const fake = fakeDatabase();
    fake.state.rows[0][field] = typeof fake.state.rows[0][field] === "number" ? fake.state.rows[0][field] + 1 : `${fake.state.rows[0][field]} `;
    assert.equal(fake.plan().ready, false, field);
  }
  const fake = fakeDatabase();
  fake.state.rows[0].options = JSON.stringify(JSON.parse(fake.state.rows[0].options), null, 2);
  assert.equal(fake.plan().ready, false);
});

test("plan hash binds full rows, metadata, inventory, and reviewed replacements", () => {
  for (const mutate of [f => { f.state.rows[0].tip += " drift"; }, f => { f.state.metadata[0].contentVersion++; }, f => { f.state.rows.at(-1).reviewStatus = "rejected"; }, f => { f.fixture.corrections.corrections[0].replacement.explanation += " revised"; }]) {
    const fake = fakeDatabase(), old = fake.plan().planHash;
    mutate(fake); assert.notEqual(fake.plan().planHash, old);
  }
});

test("atomic multi-bank apply backs up full beforeimages, updates declared fields, preserves zero and increments each bank once", async () => {
  const fake = fakeDatabase(), before = clone(fake.state);
  let payload;
  const result = await apply(fake, { backup: async value => { payload = value; fake.events.push("backup"); } });
  assert.equal(result.applied, true);
  assert.equal(payload.rows.length, 3);
  assert.deepEqual(payload.metadataBefore, before.metadata);
  assert.equal(payload.rows[0].tip, "Keep this tip");
  assert.equal(fake.state.rows[0].correctIndex, 0);
  assert.equal(fake.state.rows[0].reviewStatus, "unreviewed");
  assert.deepEqual(fake.state.rows.at(-1), before.rows.at(-1));
  assert.deepEqual(fake.state.metadata.map(row => row.contentVersion), [13, 26]);
  assert.equal(fake.events.filter(event => event === "metadata-write").length, 2);
  assert.ok(fake.events.indexOf("backup") < fake.events.indexOf("question-write"));
  assert.equal(fake.events.at(-1), "commit");
  assert.ok(fake.sqls.filter(sql => sql.startsWith("SELECT")).every(sql => sql.endsWith("FOR UPDATE")));
  for (const sql of fake.sqls.filter(sql => sql.startsWith("UPDATE questions SET"))) {
    assert.doesNotMatch(sql.split(" WHERE ")[0], /reviewStatus|questionNum|question`|bankKey|isCalc/);
  }
  assert.ok(fake.sqls.every(sql => !/INSERT|DELETE|TRUNCATE|attempt|history/i.test(sql)));
});

test("already-applied exact content uses a fresh reviewed hash and no backup, writes or version bumps", async () => {
  const fake = fakeDatabase();
  await apply(fake);
  const before = clone(fake.state), start = fake.events.length;
  const result = await apply(fake, { backup: () => assert.fail("backup for no-op") });
  assert.equal(result.alreadyApplied, true);
  assert.deepEqual(fake.state, before);
  assert.ok(!fake.events.slice(start).some(event => event.endsWith("write")));
});

test("partially applied content updates only remaining rows and their banks", async () => {
  const fake = fakeDatabase();
  for (const { expected, replacement } of fake.fixture.corrections.corrections.filter(item => item.expected.bankKey === "alpha")) Object.assign(fake.state.rows.find(row => row.id === expected.id), replacement);
  await apply(fake);
  assert.deepEqual(fake.state.metadata.map(row => row.contentVersion), [12, 26]);
  assert.equal(fake.events.filter(event => event === "question-write").length, 1);
});

for (const failure of ["question-update", "metadata-update", "row-readback", "metadata-readback", "inventory-readback", "status-readback", "commit"]) {
  test(`rolls back all content and metadata on ${failure}`, async () => {
    const fake = fakeDatabase(failure), before = clone(fake.state);
    await assert.rejects(apply(fake));
    assert.deepEqual(fake.state, before);
    assert.equal(fake.events.at(-1), "rollback");
    assert.ok(!fake.events.includes("commit"));
  });
}

test("backup failure, backup-time drift and stale hashes fail closed before writes", async () => {
  for (const mode of ["backup-error", "backup-drift", "hash"]) {
    const fake = fakeDatabase();
    await assert.rejects(apply(fake, {
      ...(mode === "hash" ? { expectedPlanHash: "0".repeat(64) } : {}),
      backup: async () => { if (mode === "backup-error") throw new Error("fsync failed"); fake.state.rows[0].explanation = "Concurrent drift"; },
    }));
    assert.ok(!fake.events.includes("question-write"));
    assert.equal(fake.events.at(-1), "rollback");
  }
});

test("requires hash and backup and rejects protected fields, position moves and incomplete snapshots", async () => {
  const fake = fakeDatabase();
  await assert.rejects(apply(fake, { backup: undefined }));
  await assert.rejects(apply(fake, { expectedPlanHash: undefined }));
  for (const change of [item => { item.replacement.reviewStatus = "approved"; }, item => { item.replacement.correctIndex = 1; }, item => { delete item.expected.isCalc; }, item => { item.replacement.steps = "broken JSON"; }, item => { item.replacement.explanation = "New \u2014 text"; }]) {
    const f = fakeDatabase(); change(f.fixture.corrections.corrections[0]);
    assert.throws(f.plan);
  }
});

test("missing rows, count drift, duplicate identities and missing metadata block plans", () => {
  for (const change of [f => f.state.rows.shift(), f => f.state.rows.push({ ...f.state.rows[3], id: 5 }), f => f.state.metadata.pop(), f => f.fixture.corrections.corrections.push(clone(f.fixture.corrections.corrections[0]))]) {
    const fake = fakeDatabase(); change(fake);
    try { assert.equal(fake.plan().ready, false); } catch (error) { if (error.code === "ERR_ASSERTION") throw error; }
  }
});

test("CLI fails closed without explicit authoritative target and trusted TLS", () => {
  assert.throws(() => authoritativeRepairConnection({ DATABASE_URL: "mysql://unused" }), /Explicit/);
  assert.throws(() => authoritativeRepairConnection({ DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true" }), /incomplete/);
  const env = { DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true", EXTERNAL_DATABASE_URL: "mysql://user:password@example.invalid/ignored?ssl-mode=REQUIRED", EXTERNAL_DATABASE_CA: "-----BEGIN CERTIFICATE-----\\nfixture\\n-----END CERTIFICATE-----", DATABASE_CUTOVER_TARGET_DATABASE: "authoritative_fixture" };
  const selected = authoritativeRepairConnection(env);
  assert.equal(selected.options.database, "authoritative_fixture");
  assert.equal(selected.options.ssl.rejectUnauthorized, true);
  assert.throws(() => authoritativeRepairConnection({ ...env, EXTERNAL_DATABASE_CA: "" }));
  assert.throws(() => authoritativeRepairConnection({ ...env, EXTERNAL_DATABASE_URL: "mysql://user@example.invalid/db" }));
});

test("CLI defaults to plan and requires valid reviewed hash plus private new backup path for apply", () => {
  assert.equal(parseRepairArguments([]).apply, false);
  assert.throws(() => parseRepairArguments(["--apply"]));
  assert.throws(() => parseRepairArguments(["--expected-plan-sha256", "a".repeat(64)]));
  assert.throws(() => parseRepairArguments(["--apply", "--expected-plan-sha256", "a".repeat(64), "--backup-file", "/tmp/not-private.json"]));
  assert.equal(parseRepairArguments(["--apply", "--expected-plan-sha256", "a".repeat(64), "--backup-file", `${DEFAULT_OIT_REPAIR_BACKUP_ROOT}/fixture.json`]).apply, true);
});

test("private durable helper writes generic correction beforeimages once with restrictive modes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "public-correction-test-"));
  const backupFile = path.join(root, "before.json");
  try {
    const payload = { rows: fixtures().rows, metadataBefore: fixtures().metadata };
    await writeDurableOitRepairBackup({ backupFile, payload, backupRoot: root });
    assert.deepEqual(JSON.parse(await readFile(backupFile, "utf8")), payload);
    assert.equal((await stat(backupFile)).mode & 0o777, 0o600);
    await assert.rejects(writeDurableOitRepairBackup({ backupFile, payload, backupRoot: root }), /EEXIST/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
