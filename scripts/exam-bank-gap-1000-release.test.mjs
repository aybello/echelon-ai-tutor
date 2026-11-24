#!/usr/bin/env node
// In-memory unit tests for scripts/exam-bank-gap-1000-release.mjs.
//
// Run with plain node, no npm dependencies:
//   node scripts/exam-bank-gap-1000-release.test.mjs
//
// The fake connection below implements exactly the connection interface and
// SQL surface that applyGapPackage uses: execute with the same statements,
// plus beginTransaction, commit and rollback with snapshot semantics. It is a
// model of the three tables involved, not proof of MySQL transactional, TLS,
// timestamp, collation or AUTO_INCREMENT behavior. Run real-DB acceptance too.
import assert from "node:assert";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { loadGapPackage, applyGapPackage, planAgainstRowsGap, payloadHash, digest, gapTargetOptions } from "./exam-bank-gap-1000-release.mjs";

const QUESTION_FIELDS = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"];
const REVIEWER = "test-reviewer: Gap 1000 Test";
const NOW = new Date("2026-11-23T12:00:00.000Z");

class FakeConnection {
  constructor({ failOnQuestionInsert = 0 } = {}) {
    this.state = { questions: [], meta: [], snapshots: [], nextQuestionId: 1, nextSnapshotId: 1 };
    this.failOnQuestionInsert = failOnQuestionInsert;
    this.questionInsertCount = 0;
    this.txSnapshot = null;
  }
  async beginTransaction() {
    if (this.txSnapshot) throw new Error("transaction already open");
    this.txSnapshot = structuredClone(this.state);
  }
  async commit() { this.txSnapshot = null; }
  async rollback() {
    if (this.txSnapshot) { this.state = this.txSnapshot; this.txSnapshot = null; }
  }
  async execute(sql, params = []) {
    const text = sql.replace(/\s+/g, " ").trim();
    if (text.startsWith("SELECT bankKey, reviewStatus, COUNT(*) AS n FROM questions WHERE bankKey NOT IN")) {
      const excluded = new Set(params);
      const groups = new Map();
      for (const row of this.state.questions) {
        if (excluded.has(row.bankKey)) continue;
        const key = `${row.bankKey}|${row.reviewStatus}`;
        groups.set(key, (groups.get(key) ?? 0) + 1);
      }
      const rows = [...groups.entries()].map(([key, n]) => {
        const [bankKey, reviewStatus] = key.split("|");
        return { bankKey, reviewStatus, n };
      }).sort((a, b) => a.bankKey.localeCompare(b.bankKey) || a.reviewStatus.localeCompare(b.reviewStatus));
      return [rows];
    }
    if (text.startsWith("SELECT * FROM questions WHERE bankKey IN")) {
      const wanted = new Set(params);
      return [structuredClone(this.state.questions.filter(row => wanted.has(row.bankKey)))];
    }
    if (text.startsWith("SELECT * FROM question_bank_meta WHERE bankKey IN")) {
      const wanted = new Set(params);
      return [structuredClone(this.state.meta.filter(row => wanted.has(row.bankKey)))];
    }
    if (text.startsWith("SELECT questionId, payload FROM question_content_snapshots WHERE releaseKey = ?")) {
      return [structuredClone(this.state.snapshots.filter(row => row.releaseKey === params[0]).map(row => ({ questionId: row.questionId, payload: row.payload })))];
    }
    if (text.startsWith("SELECT * FROM questions WHERE id = ?")) {
      return [structuredClone(this.state.questions.filter(row => row.id === params[0]))];
    }
    if (text.startsWith("SELECT bankKey, questionNum, sourceContentVersion, contentHash, payload FROM question_content_snapshots WHERE releaseKey = ? AND questionId = ?")) {
      return [structuredClone(this.state.snapshots.filter(row => row.releaseKey === params[0] && row.questionId === params[1]).map(row => ({ bankKey: row.bankKey, questionNum: row.questionNum, sourceContentVersion: row.sourceContentVersion, contentHash: row.contentHash, payload: row.payload })))];
    }
    if (text.startsWith("INSERT INTO questions")) {
      this.questionInsertCount++;
      if (this.failOnQuestionInsert && this.questionInsertCount === this.failOnQuestionInsert) throw new Error(`injected failure on question insert ${this.questionInsertCount}`);
      const row = this.buildRow(text, params);
      row.id = this.state.nextQuestionId++;
      this.state.questions.push(row);
      return [{ affectedRows: 1, insertId: row.id }];
    }
    if (text.startsWith("INSERT INTO question_content_snapshots")) {
      const row = this.buildRow(text, params);
      row.id = this.state.nextSnapshotId++;
      this.state.snapshots.push(row);
      return [{ affectedRows: 1, insertId: row.id }];
    }
    if (text.startsWith("SELECT COUNT(*) AS n FROM questions WHERE bankKey = ?")) {
      const n = this.state.questions.filter(row => row.bankKey === params[0] && ["approved", "unreviewed"].includes(row.reviewStatus)).length;
      return [[{ n }]];
    }
    if (text.startsWith("UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?")) {
      const meta = this.state.meta.find(row => row.bankKey === params[1]);
      if (!meta) return [{ affectedRows: 0 }];
      meta.totalQuestions = params[0];
      meta.contentVersion = Number(meta.contentVersion) + 1;
      return [{ affectedRows: 1 }];
    }
    throw new Error(`fake connection does not implement this SQL: ${text}`);
  }
  buildRow(text, params) {
    const columns = text.match(/\(([^)]+)\) VALUES/)[1].split(",").map(part => part.trim());
    const valuesPart = text.slice(text.indexOf("VALUES"));
    const tokens = valuesPart.match(/\(([^)]+)\)/)[1].split(",").map(part => part.trim());
    const row = {};
    let paramIndex = 0;
    columns.forEach((column, index) => {
      const token = tokens[index];
      if (token === "?") { row[column] = params[paramIndex++]; }
      else if (token.startsWith("'") && token.endsWith("'")) { row[column] = token.slice(1, -1); }
      else { throw new Error(`unsupported VALUES token ${token}`); }
    });
    return structuredClone(row);
  }
}

function seedRow(id, bankKey, questionNum, stem, reviewStatus = "approved") {
  return {
    id, bankKey, questionNum, module: "Seed Module", difficulty: "easy", question: stem,
    options: ["alpha", "beta", "gamma", "delta"], correctIndex: 0, explanation: "Seed explanation.",
    steps: null, tip: null, isCalc: "no", topic: "Seed Topic", cognitiveLevel: "recall",
    sourceTitle: "Seed Source", sourceReference: "Seed reference", sourceUrl: null,
    blueprintObjective: "Seed objective", reviewStatus, reviewedBy: reviewStatus === "approved" ? "seed-reviewer" : null,
    reviewedAt: reviewStatus === "approved" ? new Date("2026-01-01T00:00:00.000Z") : null,
  };
}

function seedFake(pkg, options) {
  const fake = new FakeConnection(options);
  const bankKeys = [...pkg.banks.keys()].sort();
  let nextId = 1;
  const seededIds = new Set();
  const addRow = (bankKey, questionNum, stem, status) => {
    const row = seedRow(nextId++, bankKey, questionNum, stem, status);
    fake.state.questions.push(row);
    seededIds.add(row.id);
  };
  // Seed the manifest's actual usable baseline, plus excluded-status sentinels.
  for (const bank of pkg.manifest.banks) {
    const bankKey = bank.itemBankKey;
    for (let n = 1; n <= bank.liveTotal; n++) addRow(bankKey, n, `Seed question ${n} for ${bankKey}?`, n % 2 ? "approved" : "unreviewed");
    addRow(bankKey, 2001, `Rejected historical question for ${bankKey}?`, "rejected");
    addRow(bankKey, 2002, `In-review historical question for ${bankKey}?`, "in_review");
  }
  // One unrelated bank and one 309A bank, both of which must remain untouched.
  addRow("oit", 1, "Seed question for the unrelated oit bank?", "approved");
  addRow("ontario-309a-electrician", 1, "Seed question for the 309A bank?", "approved");
  fake.state.nextQuestionId = nextId;
  const visibleCount = bankKey => fake.state.questions.filter(row => row.bankKey === bankKey && ["approved", "unreviewed"].includes(row.reviewStatus)).length;
  for (const bankKey of bankKeys) {
    fake.state.meta.push({ bankKey, totalQuestions: visibleCount(bankKey), contentVersion: 3, title: `Bank ${bankKey}`, stream: "Water", level: 2 });
  }
  fake.state.meta.push({ bankKey: "oit", totalQuestions: visibleCount("oit"), contentVersion: 9, title: "Bank oit", stream: "Mixed", level: 1 });
  fake.state.meta.push({ bankKey: "ontario-309a-electrician", totalQuestions: visibleCount("ontario-309a-electrician"), contentVersion: 5, title: "Bank 309A", stream: "Electrical", level: 3 });
  fake.state.meta.push({ bankKey: "class1-water", totalQuestions: 800, contentVersion: 4, title: "Bank class1-water", stream: "Water", level: 1 });
  return { fake, seededIds };
}

function rowMatchesItem(row, item) {
  const storedOptions = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
  return QUESTION_FIELDS.every(field => field === "options" ? JSON.stringify(storedOptions) === JSON.stringify(item.options) : String(row[field] ?? null) === String(item[field] ?? null));
}

function buildTempPackage(pkg) {
  const dir = mkdtempSync(resolve(tmpdir(), "gap1000-test-"));
  cpSync(pkg.packageRoot, dir, { recursive: true });
  return dir;
}

function editAdditions(root, courseKey, mutate) {
  const path = resolve(root, courseKey, "additions.json");
  const items = JSON.parse(readFileSync(path, "utf8"));
  mutate(items);
  writeFileSync(path, JSON.stringify(items));
}

const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, ok: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
function expectLoadFailure(root, pattern, label) {
  let thrown = null;
  try { loadGapPackage(root); } catch (error) { thrown = error; }
  assert.ok(thrown, `${label}: loadGapPackage should have failed`);
  assert.match(thrown.message, pattern, `${label}: unexpected failure message: ${thrown.message}`);
}

const pkg = loadGapPackage();

await check("loader binds the staging package: 26 banks, 5442 items, no withheld", () => {
  assert.equal(pkg.banks.size, 26);
  assert.equal(pkg.entries.length, 5442);
  assert.equal(pkg.candidates.length, 5442);
  const sum = Object.values(pkg.perBank).reduce((a, b) => a + b, 0);
  assert.equal(sum, 5442);
  assert.match(pkg.releaseKey, /^exam-bank-gap-1000-2026-11-23-[0-9a-f]{12}$/);
});

await check("planAgainstRowsGap reports no conflicts against seeded rows", () => {
  const { fake } = seedFake(pkg);
  const targetRows = fake.state.questions.filter(row => pkg.banks.has(row.bankKey));
  const plan = planAgainstRowsGap(pkg, targetRows);
  assert.equal(plan.candidates, 5442);
  assert.equal(plan.banks, 26);
  assert.deepEqual(plan.conflicts, []);
});

const mainRun = seedFake(pkg);
const beforeRowsById = new Map(mainRun.fake.state.questions.map(row => [row.id, digest(row)]));
const beforeMetaByBank = new Map(mainRun.fake.state.meta.map(row => [row.bankKey, structuredClone(row)]));
const beforeCountByBank = new Map();
for (const row of mainRun.fake.state.questions) beforeCountByBank.set(row.bankKey, (beforeCountByBank.get(row.bankKey) ?? 0) + 1);
let applyResult = null;

await check("exact insertion: 5442 rows, per-bank gains equal the manifest counts, rows match source items field for field", async () => {
  applyResult = await applyGapPackage(mainRun.fake, pkg, { reviewer: REVIEWER, now: NOW });
  assert.equal(applyResult.alreadyApplied, false);
  assert.equal(applyResult.inserted, 5442);
  const afterCountByBank = new Map();
  for (const row of mainRun.fake.state.questions) afterCountByBank.set(row.bankKey, (afterCountByBank.get(row.bankKey) ?? 0) + 1);
  for (const [bankKey, count] of Object.entries(pkg.perBank)) {
    assert.equal((afterCountByBank.get(bankKey) ?? 0) - (beforeCountByBank.get(bankKey) ?? 0), count, `bank ${bankKey} gain`);
  }
  const candidateByKey = new Map(pkg.candidates.map(item => [`${item.bankKey}|${item.questionNum}`, item]));
  let matched = 0;
  for (const row of mainRun.fake.state.questions) {
    if (mainRun.seededIds.has(row.id)) continue;
    const item = candidateByKey.get(`${row.bankKey}|${row.questionNum}`);
    assert.ok(item, `inserted row ${row.bankKey}#${row.questionNum} has no source item`);
    assert.ok(rowMatchesItem(row, item), `inserted row mismatch ${row.bankKey}#${row.questionNum}`);
    assert.equal(row.reviewStatus, "approved");
    assert.equal(row.reviewedBy, REVIEWER);
    assert.equal(new Date(row.reviewedAt).toISOString(), NOW.toISOString());
    matched++;
  }
  assert.equal(matched, 5442);
});

await check("matching receipts: one snapshot per inserted item, bound to release key, package hash and item payload hash", () => {
  const snapshots = mainRun.fake.state.snapshots;
  assert.equal(snapshots.length, 5442);
  const candidateByKey = new Map(pkg.candidates.map(item => [`${item.bankKey}|${item.questionNum}`, item]));
  const seenKeys = new Set();
  for (const snapshot of snapshots) {
    assert.equal(snapshot.releaseKey, pkg.releaseKey);
    assert.equal(Number(snapshot.sourceContentVersion), 0);
    const payload = JSON.parse(snapshot.payload);
    assert.equal(payload.kind, "exam-bank-gap-1000-additive-insert");
    assert.equal(payload.releaseKey, pkg.releaseKey);
    assert.equal(payload.packageSha256, pkg.packageSha256);
    assert.equal(payload.bankPackageSha256, pkg.bankPackageSha256[snapshot.bankKey]);
    assert.equal(payload.mapping, null);
    assert.equal(payload.reviewer, REVIEWER);
    const evidence = pkg.reviewEvidence[snapshot.bankKey];
    assert.deepEqual(payload.sourceReview, evidence.sourceReview);
    assert.equal(payload.sourceReview.reviewer, "owner-authorized-ai-review");
    assert.equal(payload.reviewReceiptSha256, evidence.receiptSha256);
    assert.deepEqual(payload.builderChecks, evidence.checks);
    assert.deepEqual(payload.reviewBindings, evidence.bindings);
    assert.deepEqual(payload.receiptVerification, pkg.receiptVerification);
    const item = candidateByKey.get(payload.itemKey);
    assert.ok(item, `receipt itemKey ${payload.itemKey} has no source item`);
    assert.equal(snapshot.bankKey, item.bankKey);
    assert.equal(snapshot.questionNum, item.questionNum);
    assert.equal(snapshot.contentHash, payloadHash(item));
    assert.equal(payload.originalPayloadSha256, payloadHash(item));
    assert.equal(payload.mappedPayloadSha256, payloadHash(item));
    assert.equal(payload.itemId, item.itemId);
    assert.deepEqual(payload.sourceIdentity, payload.mappedIdentity);
    assert.equal(payloadHash(payload.item), payloadHash(item));
    seenKeys.add(payload.itemKey);
  }
  assert.equal(seenKeys.size, 5442);
});

await check("preservation: seeded rows and untouched banks unchanged, target metadata counts and versions advance exactly", () => {
  for (const row of mainRun.fake.state.questions) {
    if (beforeRowsById.has(row.id)) assert.equal(digest(row), beforeRowsById.get(row.id), `seeded row ${row.id} changed`);
  }
  for (const meta of mainRun.fake.state.meta) {
    const before = beforeMetaByBank.get(meta.bankKey);
    if (pkg.banks.has(meta.bankKey)) {
      assert.equal(Number(meta.totalQuestions), Number(before.totalQuestions) + pkg.perBank[meta.bankKey], `meta total for ${meta.bankKey}`);
      assert.equal(Number(meta.totalQuestions), 1000, `usable total for ${meta.bankKey}`);
      assert.equal(Number(meta.contentVersion), Number(before.contentVersion) + 1, `meta version for ${meta.bankKey}`);
      const strip = row => Object.fromEntries(Object.entries(row).filter(([key]) => !["totalQuestions", "contentVersion"].includes(key)));
      assert.equal(digest(strip(meta)), digest(strip(before)), `meta blueprint fields changed for ${meta.bankKey}`);
    } else {
      assert.equal(digest(meta), digest(before), `untouched meta changed for ${meta.bankKey}`);
    }
  }
});

await check("idempotency: a second apply of the identical package returns alreadyApplied and inserts 0", async () => {
  const rowsBefore = mainRun.fake.state.questions.length;
  const snapshotsBefore = mainRun.fake.state.snapshots.length;
  const second = await applyGapPackage(mainRun.fake, pkg, { reviewer: REVIEWER, now: NOW });
  assert.equal(second.alreadyApplied, true);
  assert.equal(second.inserted, 0);
  assert.equal(mainRun.fake.state.questions.length, rowsBefore);
  assert.equal(mainRun.fake.state.snapshots.length, snapshotsBefore);
});

await check("modeled rollback on failure: an injected mid-apply failure preserves rows, receipts and metadata", async () => {
  const { fake } = seedFake(pkg, { failOnQuestionInsert: 250 });
  const beforeDigest = digest(fake.state);
  const beforeJson = JSON.stringify(fake.state);
  let thrown = null;
  try { await applyGapPackage(fake, pkg, { reviewer: REVIEWER, now: NOW }); } catch (error) { thrown = error; }
  assert.ok(thrown, "apply should have thrown on the injected failure");
  assert.match(thrown.message, /injected failure/);
  assert.equal(digest(fake.state), beforeDigest);
  assert.equal(JSON.stringify(fake.state), beforeJson);
});

for (const pattern of [/^INSERT INTO question_content_snapshots/, /^UPDATE question_bank_meta/]) {
  await check(`modeled rollback after a successful ${pattern.source} restores all table rows`, async () => {
    const { fake } = seedFake(pkg);
    const before = digest(fake.state);
    const execute = fake.execute.bind(fake);
    fake.execute = async (sql, params) => {
      const result = await execute(sql, params);
      if (pattern.test(sql)) throw new Error("injected failure after successful write");
      return result;
    };
    await assert.rejects(applyGapPackage(fake, pkg, { reviewer: REVIEWER, now: NOW }), /injected failure after successful write/);
    assert.equal(digest(fake.state), before);
  });
}

await check("below-1000 live baseline is refused before the first insert", async () => {
  const { fake } = seedFake(pkg);
  fake.state.questions.splice(0, 1);
  const before = digest(fake.state);
  await assert.rejects(applyGapPackage(fake, pkg, { reviewer: REVIEWER, now: NOW }), /below 1000/);
  assert.equal(fake.questionInsertCount, 0);
  assert.equal(digest(fake.state), before);
});

await check("mutated or fabricated packages are refused before any DB operation", async () => {
  const noDb = { beginTransaction() { throw new Error("DB must not be touched"); } };
  await assert.rejects(applyGapPackage(noDb, { ...pkg }, { reviewer: REVIEWER }), /unchanged independently verified package/);
  const original = pkg.candidates[0].question;
  try {
    pkg.candidates[0].question += " altered after load";
    await assert.rejects(applyGapPackage(noDb, pkg, { reviewer: REVIEWER }), /unchanged independently verified package/);
  } finally { pkg.candidates[0].question = original; }
});

await check("missing and invalid apply reviewer identities are refused before any DB operation", async () => {
  const noDb = { beginTransaction() { throw new Error("DB must not be touched"); } };
  for (const reviewer of [undefined, " ", "--apply", "x".repeat(321)]) await assert.rejects(applyGapPackage(noDb, pkg, { reviewer }), /valid reviewer identity/);
});

await check("authoritative target retains trusted CA and requires mysql2 hostname verification", () => {
  const target = { external: true, options: { host: "db.example.invalid", database: "production", ssl: { ca: "fixture-ca", rejectUnauthorized: true } } };
  const options = gapTargetOptions(target);
  assert.equal(options.ssl.verifyIdentity, true);
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(options.ssl.ca, target.options.ssl.ca);
  assert.equal(target.options.ssl.verifyIdentity, undefined, "do not mutate the shared connection helper result");
  assert.throws(() => gapTargetOptions({ ...target, external: false }), /trusted TLS/);
  assert.throws(() => gapTargetOptions({ ...target, options: { ssl: { ca: "fixture", rejectUnauthorized: false } } }), /trusted TLS/);
});

await check("idempotent retry rejects missing receipts and corrupted structured evidence without mutation", async () => {
  const fake = mainRun.fake;
  const removed = fake.state.snapshots.pop();
  try {
    const before = digest(fake.state);
    await assert.rejects(applyGapPackage(fake, pkg, { reviewer: REVIEWER }), /partial prior/);
    assert.equal(digest(fake.state), before);
  } finally { fake.state.snapshots.push(removed); }
  const original = fake.state.snapshots[0].payload;
  try {
    const payload = JSON.parse(original);
    payload.builderChecks = { fabricated: "pass" };
    fake.state.snapshots[0].payload = JSON.stringify(payload);
    const before = digest(fake.state);
    await assert.rejects(applyGapPackage(fake, pkg, { reviewer: REVIEWER }), /review evidence mismatch/);
    assert.equal(digest(fake.state), before);
  } finally { fake.state.snapshots[0].payload = original; }
});

await check("idempotent retry refuses stale metadata rather than reporting success", async () => {
  const meta = mainRun.fake.state.meta[0];
  meta.totalQuestions--;
  try {
    const before = digest(mainRun.fake.state);
    await assert.rejects(applyGapPackage(mainRun.fake, pkg, { reviewer: REVIEWER }), /metadata usable count mismatch/);
    assert.equal(digest(mainRun.fake.state), before);
  } finally { meta.totalQuestions++; mainRun.fake.state.meta.find(row => row.bankKey === meta.bankKey).totalQuestions = meta.totalQuestions; }
});

await check("rejection of altered payloads: a tampered question text fails receipt binding at load", () => {
  const dir = buildTempPackage(pkg);
  try {
    editAdditions(dir, "class2-water", items => { items[0].question = `${items[0].question} Tampered.`; });
    expectLoadFailure(dir, /receipt payload hash mismatch|receipt package hash mismatch/, "tampered payload");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await check("rejection of alias bank keys: wpi-class1-water-coll in place of the canonical wastewater collection key fails at load", () => {
  const dir = buildTempPackage(pkg);
  try {
    editAdditions(dir, "wpi-class1-water-coll", items => { items[0].bankKey = "wpi-class1-water-coll"; });
    expectLoadFailure(dir, /bankKey .* expected canonical wpi-class1-wastewater-coll/, "alias bank key");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await check("rejection of 309A items: an injected 309A bank key fails at load", () => {
  const dir = buildTempPackage(pkg);
  try {
    editAdditions(dir, "wqa", items => { items[0].bankKey = "ontario-309a-electrician"; });
    expectLoadFailure(dir, /309A/, "309A injection");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const [name, mutate] of [
  ["missing structured checks", receipt => { delete receipt.checks; }],
  ["calculation failure", receipt => { receipt.checks.calculationVerification.problems = ["injected failing calculation"]; }],
  ["stale checker binding", receipt => { receipt.bindings.checkers["verify_calcs_gap.py"] = "0".repeat(64); }],
  ["missing review provenance", receipt => { delete receipt.reviewer; }],
  ["malformed withheld count", receipt => { receipt.counts.withheld = 0; }],
]) {
  await check(`load fails closed on ${name}`, () => {
    const dir = buildTempPackage(pkg);
    try {
      const file = resolve(dir, "receipts/class2-water.receipt.json");
      const receipt = JSON.parse(readFileSync(file, "utf8"));
      mutate(receipt);
      writeFileSync(file, JSON.stringify(receipt));
      expectLoadFailure(dir, /independent receipt verification failed|structured review evidence|review provenance|withheld list/, name);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

await check("load fails closed when the independent verifier cannot run", () => {
  const dir = buildTempPackage(pkg);
  try {
    rmSync(resolve(dir, "tools/verify_receipts.py"));
    expectLoadFailure(dir, /independent receipt verifier is missing/, "missing verifier");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await check("GAP1000_PACKAGE_ROOT override: the loader resolves a copied package through the environment variable", () => {
  const dir = buildTempPackage(pkg);
  try {
    process.env.GAP1000_PACKAGE_ROOT = dir;
    const loaded = loadGapPackage();
    assert.equal(loaded.candidates.length, 5442);
    assert.equal(loaded.packageSha256, pkg.packageSha256);
  } finally {
    delete process.env.GAP1000_PACKAGE_ROOT;
    rmSync(dir, { recursive: true, force: true });
  }
});

const failed = results.filter(result => !result.ok);
console.log("");
console.log(`SUMMARY: ${results.length - failed.length}/${results.length} checks passed, ${failed.length} failed`);
if (failed.length) {
  for (const result of failed) console.log(`FAILED: ${result.name}: ${result.error}`);
  process.exitCode = 1;
} else {
  console.log("ALL TESTS PASS");
}
