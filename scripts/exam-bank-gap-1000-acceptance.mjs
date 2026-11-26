#!/usr/bin/env node
/**
 * REAL MYSQL acceptance of the gap importer, NOT a fake DB or the release CLI.
 * Requires a disposable local MySQL server (CI: MySQL 8.4), mysql2, and CREATE /
 * DROP DATABASE permission. Example (choose a fresh random 32-character hex):
 * EXPANSION_TEST_DATABASE_URL='mysql://root:root@localhost:3306/expansion_acceptance_<32 lowercase hex chars>' \
 *   node scripts/exam-bank-gap-1000-acceptance.mjs --acknowledge-disposable-local-database
 *
 * Creates WITHOUT IF NOT EXISTS, owns, and finally drops ONLY that new schema.
 * Never imports application connection helpers, dotenv, or credential loaders;
 * DATABASE_URL and other application selectors are not used. No learner tables
 * exist here. The full 5,442-item package is loaded through the real gap loader.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyGapPackage, digest, itemIdentity, loadGapPackage, payloadHash, planAgainstRowsGap } from "./exam-bank-gap-1000-release.mjs";

const ACKNOWLEDGMENT = "--acknowledge-disposable-local-database";
const DATABASE_NAME = /^expansion_acceptance_[0-9a-f]{32}$/;
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../content/exam-bank-gap-1000");
const REVIEWER = "synthetic-disposable-gap-acceptance-reviewer";
const NOW = new Date("2026-11-23T12:34:56.987Z");
const STORED_NOW = "2026-11-23T12:34:56.000Z";
const TABLES = ["questions", "question_content_snapshots", "question_bank_meta"];
const QUESTION_FIELDS = ["bankKey", "questionNum", "module", "difficulty", "question", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"];

// Intentionally copied from exam-bank-expansion-acceptance.mjs: importing that
// module also imports/registers its unrelated release unit tests. Keep the same
// strict URL validation and create/own/drop boundary without those side effects.
export function validateDisposableDatabaseUrl(value, args = []) {
  const refuse = () => { throw new Error("Acceptance refused: require EXPANSION_TEST_DATABASE_URL, literal localhost mysql URL, dedicated expansion_acceptance_<32 lowercase hex> schema, no URL options, and explicit acknowledgment flag. Connection details withheld."); };
  if (typeof value !== "string" || !value || args.length !== 1 || args[0] !== ACKNOWLEDGMENT) refuse();
  let url;
  try { url = new URL(value); } catch { refuse(); }
  if (url.protocol !== "mysql:" || url.hostname !== "localhost" || !/^mysql:\/\/[^/]*@localhost:[0-9]+\//.test(value)
      || !url.username || !url.port || url.search || url.hash || !DATABASE_NAME.test(url.pathname.slice(1))) refuse();
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) refuse();
  let user, password;
  try { user = decodeURIComponent(url.username); password = decodeURIComponent(url.password); } catch { refuse(); }
  return { database: url.pathname.slice(1), options: { host: "127.0.0.1", port, user, password,
    timezone: "Z", multipleStatements: false, connectTimeout: 10000, supportBigNumbers: true } };
}

// Same three authoritative table declarations as drizzle/schema.ts and the
// expansion acceptance harness. TIMESTAMP deliberately has NO fractional part.
const DDL = [
  `CREATE TABLE questions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    bankKey VARCHAR(64) NOT NULL, questionNum INT NOT NULL, module VARCHAR(128) NOT NULL,
    difficulty VARCHAR(16) NULL, question TEXT NOT NULL, options TEXT NOT NULL,
    correctIndex INT NOT NULL, explanation TEXT NOT NULL, steps TEXT NULL, tip TEXT NULL,
    isCalc ENUM('yes','no') NOT NULL DEFAULT 'no', topic VARCHAR(128) NULL,
    cognitiveLevel ENUM('recall','application') NULL,
    sourceTitle VARCHAR(255) NULL, sourceReference VARCHAR(512) NULL,
    sourceUrl VARCHAR(1024) NULL, blueprintObjective VARCHAR(255) NULL,
    reviewStatus ENUM('unreviewed','in_review','approved','rejected') NOT NULL DEFAULT 'unreviewed',
    reviewedBy VARCHAR(320) NULL, reviewedAt TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY bank_question_idx (bankKey,questionNum),
    KEY question_review_status_idx (reviewStatus), KEY question_bank_review_status_idx (bankKey,reviewStatus)
  ) ENGINE=InnoDB`,
  `CREATE TABLE question_content_snapshots (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, releaseKey VARCHAR(128) NOT NULL,
    bankKey VARCHAR(64) NOT NULL, questionId INT NOT NULL, questionNum INT NOT NULL,
    sourceContentVersion INT NOT NULL, contentHash VARCHAR(64) NOT NULL,
    payload MEDIUMTEXT NOT NULL, capturedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY question_snapshot_release_question_idx (releaseKey,questionId),
    KEY question_snapshot_bank_question_idx (bankKey,questionId)
  ) ENGINE=InnoDB`,
  `CREATE TABLE question_bank_meta (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, bankKey VARCHAR(64) NOT NULL UNIQUE,
    modules TEXT NOT NULL, moduleTargets TEXT NULL, formulaLinks TEXT NULL,
    totalQuestions INT NOT NULL, contentVersion INT NOT NULL DEFAULT 1,
    blueprintVersion INT NOT NULL DEFAULT 1, minCalcPerMock INT NULL, recallTargetPct INT NULL
  ) ENGINE=InnoDB`,
];

async function snapshot(db) {
  const state = {};
  for (const table of TABLES) {
    const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY id`);
    state[table] = rows.map(row => ({ ...row }));
  }
  return state;
}

async function insertExisting(db, bankKey, questionNum, question, reviewStatus = "approved") {
  await db.execute(`INSERT INTO questions (bankKey,questionNum,module,difficulty,question,options,correctIndex,explanation,
    steps,tip,isCalc,topic,cognitiveLevel,sourceTitle,sourceReference,sourceUrl,blueprintObjective,reviewStatus,reviewedBy,reviewedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [bankKey, questionNum, "Preserved legacy module", "hard", question,
    '["legacy alpha","legacy beta","legacy gamma","legacy delta"]', 2, "Preserved historical explanation",
    '[{"l":"legacy","c":"unchanged"}]', "Preserved tip", "yes", "Preserved topic", "application",
    "Historical synthetic fixture", "Historical reference", "https://example.invalid/historical", "Preserved objective",
    reviewStatus, "preserve-original-reviewer", new Date("2024-01-02T03:04:05.000Z")]);
}

async function seed(db, pkg) {
  for (const table of ["question_content_snapshots", "questions", "question_bank_meta"]) await db.execute(`DELETE FROM ${table}`);
  const keys = [...pkg.banks.keys()];
  assert.equal(keys.length, 26);
  assert.ok(pkg.candidates.every(item => item.questionNum > 88), "synthetic fixture numbers cannot collide with loaded content");
  for (const [index, bankKey] of keys.entries()) {
    const liveTotal = pkg.manifest.banks.find(bank => bank.itemBankKey === bankKey).liveTotal;
    assert.ok(Number.isInteger(liveTotal) && liveTotal >= 2 && liveTotal + pkg.perBank[bankKey] === 1000);
    await db.execute(`INSERT INTO question_bank_meta
      (bankKey,modules,moduleTargets,formulaLinks,totalQuestions,contentVersion,blueprintVersion,minCalcPerMock,recallTargetPct)
      VALUES (?,?,?,?,?,?,?,?,?)`, [bankKey, '[{"id":"KEEP","name":"Preserve modules exactly"}]', '{"KEEP":100}',
      '{"KEEP":"/formulas-preserved#keep"}', liveTotal, 7 + index, 3 + index, 4, 60]);
    // Historical duplicate non-rejected stems must be preserved, not repaired.
    await insertExisting(db, bankKey, 1, "Preserve historical duplicated stem?", "approved");
    await insertExisting(db, bankKey, 2, "PRESERVE historical duplicated stem!", "unreviewed");
    await insertExisting(db, bankKey, 3, "Preserve historical in-review stem?", "in_review");
    await insertExisting(db, bankKey, 4, "Preserve historical rejected stem?", "rejected");
    // Realistic usable baseline, but entirely synthetic educational content.
    // Chunked parameterized INSERTs keep this 20,558-row setup inexpensive.
    for (let start = 5; start <= liveTotal + 2; start += 200) {
      const values = [];
      for (let number = start; number <= Math.min(start + 199, liveTotal + 2); number++) {
        values.push([bankKey, number, "Preserved synthetic baseline", `Synthetic baseline ${bankKey} question ${number}?`,
          '["a","b","c","d"]', 0, "Synthetic baseline explanation", number % 2 ? "approved" : "unreviewed"]);
      }
      await db.execute(`INSERT INTO questions (bankKey,questionNum,module,question,options,correctIndex,explanation,reviewStatus)
        VALUES ${values.map(() => "(?,?,?,?,?,?,?,?)").join(",")}`, values.flat());
    }
  }
  for (const bankKey of ["outside-synthetic-bank", "ontario-309a-synthetic-preserve"]) {
    assert.ok(!pkg.banks.has(bankKey));
    await insertExisting(db, bankKey, 1, `Unrelated synthetic sentinel ${bankKey}?`);
    await db.execute(`INSERT INTO question_bank_meta
      (bankKey,modules,moduleTargets,formulaLinks,totalQuestions,contentVersion,blueprintVersion,minCalcPerMock,recallTargetPct)
      VALUES (?,?,?,?,?,?,?,?,?)`, [bankKey, '["OUTSIDE"]', '{"OUTSIDE":100}', '{"OUTSIDE":"/preserved"}', 1, 11, 5, 8, 70]);
    const [rows] = await db.execute("SELECT id FROM questions WHERE bankKey=?", [bankKey]);
    await db.execute(`INSERT INTO question_content_snapshots
      (releaseKey,bankKey,questionId,questionNum,sourceContentVersion,contentHash,payload) VALUES (?,?,?,?,?,?,?)`,
      ["unrelated-historical-synthetic-release", bankKey, rows[0].id, 1, 9, digest("preserve historical receipt"), '{"syntheticHistoricalReceipt":"preserve exactly"}']);
  }
}

function instrument(db, afterExecute) {
  return {
    beginTransaction: db.beginTransaction.bind(db), commit: db.commit.bind(db), rollback: db.rollback.bind(db),
    async execute(sql, params) {
      const result = await db.execute(sql, params);
      await afterExecute(sql.replace(/\s+/g, " ").trim(), result);
      return result;
    },
  };
}

async function assertSuccess(db, pkg, before) {
  const after = await snapshot(db);
  const byId = new Map(after.questions.map(row => [row.id, row]));
  const byKey = new Map(after.questions.map(row => [`${row.bankKey}|${row.questionNum}`, row]));
  const receipts = after.question_content_snapshots.filter(row => row.releaseKey === pkg.releaseKey);
  const receiptById = new Map(receipts.map(row => [row.questionId, row]));
  assert.equal(after.questions.length, before.questions.length + pkg.candidates.length);
  assert.equal(after.question_content_snapshots.length, before.question_content_snapshots.length + pkg.candidates.length);
  assert.equal(receipts.length, pkg.candidates.length);
  assert.equal(receiptById.size, pkg.candidates.length, "exactly one receipt per new question");
  for (const row of before.questions) assert.deepEqual(byId.get(row.id), row, "all old educational, reviewer, outside-bank and 309A fields remain unchanged");
  const snapshotsById = new Map(after.question_content_snapshots.map(row => [row.id, row]));
  for (const row of before.question_content_snapshots) assert.deepEqual(snapshotsById.get(row.id), row);
  assert.equal(after.question_bank_meta.length, before.question_bank_meta.length);
  for (const previous of before.question_bank_meta) {
    const current = after.question_bank_meta.find(row => row.id === previous.id);
    if (!pkg.banks.has(previous.bankKey)) { assert.deepEqual(current, previous); continue; }
    assert.deepEqual({ ...current, totalQuestions: previous.totalQuestions, contentVersion: previous.contentVersion }, previous,
      "modules, moduleTargets, formulaLinks, blueprintVersion and mock settings must remain byte-identical");
    const rows = after.questions.filter(row => row.bankKey === previous.bankKey);
    assert.equal(rows.length - before.questions.filter(row => row.bankKey === previous.bankKey).length, pkg.perBank[previous.bankKey]);
    assert.equal(current.totalQuestions, rows.filter(row => ["approved", "unreviewed"].includes(row.reviewStatus)).length);
    assert.equal(current.totalQuestions, previous.totalQuestions + pkg.perBank[previous.bankKey]);
    assert.equal(current.contentVersion, previous.contentVersion + 1);
  }
  for (const item of pkg.candidates) {
    const key = `${item.bankKey}|${item.questionNum}`, row = byKey.get(key);
    assert.ok(row, `inserted item ${key}`);
    for (const field of QUESTION_FIELDS) assert.equal(row[field], item[field] ?? (field === "isCalc" ? "no" : null), `${key}.${field}`);
    assert.deepEqual(JSON.parse(row.options), item.options);
    assert.equal(row.reviewStatus, "approved");
    assert.equal(row.reviewedBy, REVIEWER);
    assert.equal(row.reviewedAt.toISOString(), STORED_NOW, "real TIMESTAMP(0) roundtrip");
    const receipt = receiptById.get(row.id), hash = payloadHash(item);
    assert.ok(receipt, `receipt for ${key}`);
    assert.equal(receipt.bankKey, item.bankKey); assert.equal(receipt.questionNum, item.questionNum);
    assert.equal(receipt.sourceContentVersion, 0); assert.equal(receipt.contentHash, hash);
    const payload = JSON.parse(receipt.payload);
    const identity = { bankKey: item.bankKey, questionNum: item.questionNum, itemId: itemIdentity(item) };
    for (const [field, expected] of Object.entries({ kind: "exam-bank-gap-1000-additive-insert", itemKey: key,
      itemId: itemIdentity(item), sourceIdentity: identity, mappedIdentity: identity, packageSha256: pkg.packageSha256,
      bankPackageSha256: pkg.bankPackageSha256[item.bankKey], releaseKey: pkg.releaseKey,
      originalPayloadSha256: hash, mappedPayloadSha256: hash, mapping: null, reviewer: REVIEWER,
      reviewedAt: STORED_NOW, item })) assert.deepEqual(payload[field], expected, `receipt ${key}.${field}`);
    const evidence = pkg.reviewEvidence[item.bankKey];
    for (const [field, expected] of Object.entries({ sourceReview: evidence.sourceReview,
      reviewReceiptSha256: evidence.receiptSha256, reviewBindings: evidence.bindings,
      builderChecks: evidence.checks, receiptVerification: pkg.receiptVerification })) {
      assert.deepEqual(payload[field], expected, `receipt ${key}.${field}`);
    }
  }
  return after;
}

async function apply(db, pkg) {
  const originalNow = NOW.toISOString();
  const result = await applyGapPackage(db, pkg, { reviewer: REVIEWER, now: NOW });
  assert.equal(NOW.toISOString(), originalNow, "importer must not mutate caller-owned fractional Date");
  assert.equal(result.packageSha256, pkg.packageSha256); assert.equal(result.releaseKey, pkg.releaseKey);
  return result;
}

async function assertIdempotent(db, pkg, committed) {
  let writes = 0;
  const result = await apply(instrument(db, sql => { if (/^(INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP|TRUNCATE)\b/i.test(sql)) writes++; }), pkg);
  assert.equal(result.alreadyApplied, true); assert.equal(result.inserted, 0);
  assert.equal(writes, 0, "idempotent apply issues no mutation statements");
  assert.deepEqual(await snapshot(db), committed);
}

export async function runAcceptance(db) {
  // Explicit root ignores GAP1000_PACKAGE_ROOT: always test this checkout's exact
  // reviewed 5,442-item package, rather than an environment-selected substitute.
  const full = loadGapPackage(PACKAGE_ROOT);
  assert.equal(full.banks.size, 26); assert.equal(full.candidates.length, 5442); assert.equal(full.entries.length, 5442);
  assert.equal(Object.values(full.perBank).reduce((sum, count) => sum + count, 0), 5442);
  assert.ok(full.candidates.every(item => !/309a/i.test(item.bankKey)));
  // Seed once. Full-package fault tests reuse this pristine baseline; evidence
  // tests alter and restore a single committed row instead of reimporting 5442.
  await seed(db, full);
  const baseline = await snapshot(db);
  const plan = planAgainstRowsGap(full, baseline.questions.filter(row => full.banks.has(row.bankKey)));
  assert.equal(plan.existingDuplicateStems, 26);
  const restoreRow = async (table, row) => {
    assert.ok(TABLES.includes(table));
    const columns = Object.keys(row);
    await db.execute(`INSERT INTO ${table} (${columns.map(key => `\`${key}\``).join(",")}) VALUES (${columns.map(() => "?").join(",")})`, Object.values(row));
  };
  let committed;
  await test("real MySQL disposable gap-1000 acceptance", { concurrency: false }, async t => {
    for (const pattern of [/^INSERT INTO questions\b/, /^INSERT INTO question_content_snapshots\b/, /^UPDATE question_bank_meta\b/]) {
      await t.test(`rollback AFTER successful second ${pattern.source}`, async () => {
        let matches = 0, injected = false;
        const faulty = instrument(db, (sql, [result]) => {
          if (pattern.test(sql) && ++matches === 2) {
            assert.equal(result.affectedRows, 1, "failure happens only AFTER a real successful SQL write");
            injected = true; throw new Error("synthetic failure AFTER successful MySQL execute");
          }
        });
        await assert.rejects(apply(faulty, full), /synthetic failure AFTER/);
        assert.equal(injected, true);
        // InnoDB AUTO_INCREMENT allocation is not transactional; compare all
        // persisted rows/metadata/evidence, not its intentionally consumed IDs.
        assert.deepEqual(await snapshot(db), baseline, "all executed writes must roll back");
      });
    }
    await t.test("missing one of 26 destination metadata rows rejects without mutation", async () => {
      const metadata = baseline.question_bank_meta.find(row => row.bankKey === [...full.banks.keys()].at(-1));
      await db.execute("DELETE FROM question_bank_meta WHERE id=?", [metadata.id]);
      try {
        const before = await snapshot(db);
        await assert.rejects(apply(db, full), /metadata/); assert.deepEqual(await snapshot(db), before);
      } finally { await restoreRow("question_bank_meta", metadata); }
    });
    for (const status of ["approved", "unreviewed", "in_review", "rejected"]) {
      for (const kind of status === "rejected" ? ["number"] : ["number", "stem"]) {
        await t.test(`${status} ${kind} collision rejects without mutation`, async () => {
          const item = full.candidates[0], number = kind === "number" ? item.questionNum : -88;
          await insertExisting(db, item.bankKey, number,
            kind === "stem" ? `${item.question.toUpperCase()} !!!` : "Different synthetic collision stem?", status);
          try {
            const before = await snapshot(db);
            await assert.rejects(apply(db, full), /already exists/); assert.deepEqual(await snapshot(db), before);
          } finally { await db.execute("DELETE FROM questions WHERE bankKey=? AND questionNum=?", [item.bankKey, number]); }
        });
      }
    }
    await t.test("retry imports exact 5442 and receipts across all26; preserves rejected duplicate and all baseline/metadata; idempotent", async () => {
      assert.deepEqual(await snapshot(db), baseline);
      const item = full.candidates[0];
      await insertExisting(db, item.bankKey, -88, item.question, "rejected");
      const before = await snapshot(db);
      const result = await apply(db, full);
      assert.equal(result.inserted, 5442); assert.equal(result.alreadyApplied, false);
      committed = await assertSuccess(db, full, before);
      for (const metadata of committed.question_bank_meta.filter(row => full.banks.has(row.bankKey))) assert.equal(metadata.totalQuestions, 1000);
      await assertIdempotent(db, full, committed);
    });
    await t.test("partial prior release receipts reject and preserve existing evidence", { skip: !committed }, async () => {
      const receipt = committed.question_content_snapshots.find(row => row.releaseKey === full.releaseKey);
      await db.execute("DELETE FROM question_content_snapshots WHERE id=?", [receipt.id]);
      try {
        const before = await snapshot(db);
        await assert.rejects(apply(db, full), /partial prior/); assert.deepEqual(await snapshot(db), before);
      } finally { await restoreRow("question_content_snapshots", receipt); }
    });
    const payloadFields = ["kind", "itemKey", "itemId", "sourceIdentity", "mappedIdentity", "packageSha256", "bankPackageSha256", "releaseKey", "originalPayloadSha256", "mappedPayloadSha256", "mapping", "reviewer", "reviewedAt", "item", "sourceReview", "reviewReceiptSha256", "reviewBindings", "builderChecks", "receiptVerification"];
    const columnFields = ["contentHash", "bankKey", "questionNum", "sourceContentVersion", "questionId", "question", "reviewedBy", "reviewedAt-row"];
    for (const field of [...payloadFields, ...columnFields]) {
      await t.test(`tampered receipt/content ${field} rejects without altering evidence`, { skip: !committed }, async () => {
        const receipt = committed.question_content_snapshots.find(row => row.releaseKey === full.releaseKey);
        const question = committed.questions.find(row => row.id === receipt.questionId), payload = JSON.parse(receipt.payload);
        try {
          if (payloadFields.includes(field)) {
            payload[field] = field === "item" ? { ...payload.item, explanation: "tampered synthetic explanation" }
              : field === "mapping" ? { syntheticTampering: true } : "tampered";
            await db.execute("UPDATE question_content_snapshots SET payload=? WHERE id=?", [JSON.stringify(payload), receipt.id]);
          } else if (["question", "reviewedBy", "reviewedAt-row"].includes(field)) {
            const column = field === "reviewedAt-row" ? "reviewedAt" : field;
            await db.execute(`UPDATE questions SET ${column}=? WHERE id=?`, [column === "reviewedAt" ? new Date("2026-11-23T12:34:55.000Z") : "tampered", receipt.questionId]);
          } else {
            const value = field === "contentHash" ? "0".repeat(64) : field === "bankKey" ? "tampered-bank" : field === "questionNum" ? -88 : field === "questionId" ? -1 : 99;
            await db.execute(`UPDATE question_content_snapshots SET ${field}=? WHERE id=?`, [value, receipt.id]);
          }
          const before = await snapshot(db);
          await assert.rejects(apply(db, full), /mismatch|missing receipt|bind|undefined|incorrect arguments/i);
          assert.deepEqual(await snapshot(db), before, "rejection must preserve even tampered evidence");
        } finally {
          await db.execute("DELETE FROM question_content_snapshots WHERE id=?", [receipt.id]);
          await restoreRow("question_content_snapshots", receipt);
          await db.execute("UPDATE questions SET question=?,reviewedBy=?,reviewedAt=? WHERE id=?", [question.question, question.reviewedBy, question.reviewedAt, question.id]);
        }
      });
    }
    await t.test("restored evidence still verifies and full rerun remains read-only", { skip: !committed }, async () => {
      await assertIdempotent(db, full, committed);
    });
  });
}

async function main() {
  const { database, options } = validateDisposableDatabaseUrl(process.env.EXPANSION_TEST_DATABASE_URL, process.argv.slice(2));
  // Guard must pass BEFORE mysql2 import or any network/database activity.
  const mysql = await import("mysql2/promise");
  let admin, db, created = false;
  try {
    admin = await mysql.createConnection(options);
    // Preexisting schemas are never adopted, reset, or dropped.
    await admin.execute(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
    db = await mysql.createConnection({ ...options, database });
    await db.execute("SET time_zone = '+00:00'");
    await db.execute("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    for (const sql of DDL) await db.execute(sql);
    console.log("Running REAL MYSQL gap acceptance in a newly-created dedicated localhost schema; no learner tables exist.");
    await runAcceptance(db);
  } finally {
    try { if (db) await db.end(); }
    finally {
      if (admin) {
        try {
          if (created) { await admin.execute(`DROP DATABASE \`${database}\``); console.log("Owned disposable gap acceptance schema dropped."); }
        } finally { await admin.end(); }
      }
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  // Never emit connection objects, stack traces, or URL/password-bearing errors.
  console.error(String(error.message).replace(/mysql:\/\/[^\s]+/g, "[redacted database URL]"));
  process.exitCode = 1;
});
