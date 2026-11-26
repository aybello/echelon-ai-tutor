import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { applyPackage, digest, itemIdentity, loadPackage, mapDatabaseItem, normalizeStem, payloadHash, planAgainstRows } from "./exam-bank-expansion-release.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_PATH = resolve(ROOT, "scripts/exam-bank-expansion-release.mjs");
const MANIFEST_PATH = resolve(ROOT, "content/exam-bank-expansion/release-exclusions.json");
export const TEST_REVIEWER = "synthetic-local-acceptance-reviewer";
export const TEST_NOW = new Date("2026-11-23T05:56:00.000Z");

export function fixtureItem(overrides = {}) {
  return {
    bankKey: "wpi-class1-water-coll", questionNum: 2251, itemId: "SYNTHETIC-COLLECTION-2251",
    module: "Synthetic collection module", difficulty: "easy", question: "Synthetic collection expansion question 2251?",
    options: ["A", "B", "C", "D"], correctIndex: 1, explanation: "Synthetic explanation; not learner data.",
    steps: null, tip: null, isCalc: "no", topic: "Synthetic topic", cognitiveLevel: "recall",
    sourceTitle: "Synthetic fixture", sourceReference: "Synthetic source", sourceUrl: "https://example.invalid/fixture",
    blueprintObjective: "Synthetic objective", ...overrides,
  };
}

export function makePackage(sources = [fixtureItem()]) {
  const entries = structuredClone(sources);
  const sourceCandidates = structuredClone(sources);
  const candidates = sourceCandidates.map(mapDatabaseItem);
  const packageSha256 = digest({ synthetic: true, sourceCandidates, candidates });
  return { manifest: { totalStaged: sources.length, withheld: [], withheldCount: 0, approvedFlagged: [], approvedFlaggedCount: 0, releaseCandidateCount: sources.length }, entries, sourceCandidates, candidates,
    banks: new Map(sources.map(item => [item.bankKey, sources.filter(source => source.bankKey === item.bankKey)])),
    packageSha256, releaseKey: `expansion-local-acceptance-${packageSha256.slice(0, 12)}` };
}

export function actualMappedSamples() {
  const read = path => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"))[0];
  return [read("content/exam-bank-expansion/wpi-class1-water-coll/additions.json"), read("content/exam-bank-expansion/oit/additions-wastewater.json")];
}

export function assertReceipt(receipt, row, source, item, pkg) {
  const payload = JSON.parse(receipt.payload);
  assert.equal(receipt.bankKey, item.bankKey);
  assert.equal(Number(receipt.questionNum), item.questionNum);
  assert.equal(Number(receipt.sourceContentVersion), 0);
  assert.equal(receipt.contentHash, payloadHash(item));
  assert.equal(payload.kind, "exam-bank-expansion-additive-insert");
  assert.equal(payload.itemId, itemIdentity(source), "receipt keeps ORIGINAL source identity, including absent itemId");
  assert.equal(payload.itemKey, `${item.bankKey}|${item.questionNum}`);
  assert.equal(payload.originalPayloadSha256, payloadHash(source));
  assert.equal(payload.mappedPayloadSha256, payloadHash(item));
  assert.equal(payload.packageSha256, pkg.packageSha256);
  assert.equal(payload.releaseKey, pkg.releaseKey);
  assert.deepEqual(payload.sourceIdentity, {bankKey:source.bankKey,questionNum:source.questionNum,itemId:itemIdentity(source)});
  assert.deepEqual(payload.mappedIdentity, {bankKey:item.bankKey,questionNum:item.questionNum,itemId:itemIdentity(item)});
  assert.deepEqual(payload.item, item);
  const fields = ["bankKey", "questionNum"].filter(field => source[field] !== item[field]).map(field => ({ field, from: source[field], to: item[field] }));
  assert.deepEqual(payload.mapping?.fields ?? [], fields);
  assert.equal(row.reviewedBy, TEST_REVIEWER);
  assert.equal(payload.reviewer, TEST_REVIEWER);
  assert.equal(new Date(row.reviewedAt).toISOString(), payload.reviewedAt);
  assert.equal(row.reviewStatus, "approved");
}

// Small transactional fake for offline atomicity tests. DATABASE-backed acceptance
// lives in the separate, explicitly guarded harness; this fake is not DB evidence.
export class MemoryConnection {
  constructor(pkg, { missingMetadata = false, existing = [] } = {}) {
    this.rows = structuredClone(existing);
    this.receipts = [];
    this.metadata = missingMetadata ? [] : [...new Set(pkg.candidates.map(x => x.bankKey))].map((bankKey, index) => ({ id: index + 1, bankKey, modules: '["DO NOT CHANGE"]', moduleTargets: '{"DO NOT CHANGE":100}', totalQuestions: 0, contentVersion: 7, blueprintVersion: 3 }));
    this.commits = 0; this.rollbacks = 0; this.inserts = 0;
  }
  async beginTransaction() { this.before = structuredClone({ rows: this.rows, receipts: this.receipts, metadata: this.metadata }); }
  async commit() { this.commits++; }
  async rollback() { Object.assign(this, structuredClone(this.before)); this.rollbacks++; }
  async execute(sql, args = []) {
    if (/SELECT bankKey, reviewStatus, COUNT/.test(sql)) return [[]];
    if (/SELECT \* FROM questions WHERE bankKey IN/.test(sql)) return [structuredClone(this.rows.filter(row => args.includes(row.bankKey)))];
    if (/SELECT \* FROM question_bank_meta/.test(sql)) return [structuredClone(this.metadata.filter(row => args.includes(row.bankKey)))];
    if (/SELECT questionId, payload FROM question_content_snapshots/.test(sql)) return [this.receipts.filter(row => row.releaseKey === args[0])];
    if (/^INSERT INTO questions/.test(sql)) {
      const names = sql.match(/\(([^)]+)\) VALUES/)[1].split(",").map(x => x.trim());
      const values = [...args]; values.splice(names.indexOf("reviewStatus"), 0, "approved");
      const row = Object.fromEntries(names.map((name, index) => [name, values[index]]));
      row.id = Math.max(0, ...this.rows.map(x => x.id)) + 1;
      this.rows.push(row); this.inserts++;
      return [{ affectedRows: 1, insertId: row.id }];
    }
    if (/^INSERT INTO question_content_snapshots/.test(sql)) {
      const names = ["releaseKey", "bankKey", "questionId", "questionNum", "sourceContentVersion", "contentHash", "payload"];
      this.receipts.push(Object.fromEntries(names.map((name, index) => [name, args[index]])));
      return [{ affectedRows: 1, insertId: this.receipts.length }];
    }
    if (/SELECT COUNT\(\*\) AS n FROM questions WHERE bankKey =/.test(sql)) return [[{ n: this.rows.filter(row => row.bankKey === args[0] && ["approved", "unreviewed"].includes(row.reviewStatus)).length }]];
    if (/^UPDATE question_bank_meta SET totalQuestions/.test(sql)) {
      const row = this.metadata.find(x => x.bankKey === args[1]);
      if (!row) return [{ affectedRows: 0 }];
      row.totalQuestions = args[0]; row.contentVersion++; return [{ affectedRows: 1 }];
    }
    if (/SELECT \* FROM questions WHERE id/.test(sql)) return [this.rows.filter(x => x.id === args[0])];
    if (/SELECT bankKey, questionNum, sourceContentVersion, contentHash, payload FROM question_content_snapshots/.test(sql)) return [this.receipts.filter(x => x.releaseKey === args[0] && x.questionId === args[1])];
    throw new Error(`Unexpected offline SQL: ${sql}`);
  }
}

export function failAfterExecute(connection, pattern) {
  let hits = 0;
  return {
    beginTransaction: () => connection.beginTransaction(), commit: () => connection.commit(), rollback: () => connection.rollback(),
    async execute(sql, args) {
      const result = await connection.execute(sql, args);
      if (pattern.test(sql) && ++hits === 1) throw new Error(`synthetic failure AFTER ${pattern.source}`);
      return result;
    },
  };
}

function stagedEntries() {
  const base = resolve(ROOT, "content/exam-bank-expansion");
  return readdirSync(base, { withFileTypes: true }).filter(dir => dir.isDirectory() && dir.name !== "tools")
    .sort((a, b) => a.name.localeCompare(b.name)).flatMap(dir => readdirSync(resolve(base, dir.name)).filter(name => /^additions.*\.json$/.test(name)).sort()
      .flatMap(name => { const values = JSON.parse(readFileSync(resolve(base, dir.name, name), "utf8")); return Array.isArray(values) && values[0]?.question !== undefined ? values : []; }));
}

// Exercise the real loadPackage algorithm with virtual read-only FS inputs. No
// temporary package files or production manifests are ever rewritten by tests.
function virtualLoad(entries, manifest, bytes = Buffer.from(JSON.stringify(manifest))) {
  let code = readFileSync(RELEASE_PATH, "utf8").replace(/^#![^\n]*\n/, "").replace(/^import[\s\S]*?;\s*/gm, "")
    .replace(/\bexport\s+(?=(?:async\s+)?function|const|class)/g, "").replaceAll("import.meta.url", JSON.stringify(new URL("./exam-bank-expansion-release.mjs", import.meta.url).href));
  code = code.slice(0, code.lastIndexOf("if (process.argv[1]"));
  code += "\nresult = loadPackage();";
  const context = {
    createHash, resolve, dirname, fileURLToPath, Buffer, Date,
    readFileSync(path, encoding) { const content = String(path).endsWith("release-exclusions.json") ? bytes : Buffer.from(JSON.stringify(entries)); return encoding ? content.toString(encoding) : content; },
    readdirSync(path) { return String(path).endsWith("exam-bank-expansion") ? [{ name: "virtual-fixture", isDirectory: () => true }] : [{ name: "additions.json" }]; },
    statSync: () => ({ isFile: () => true }), result: null,
  };
  vm.runInNewContext(code, context, { filename: RELEASE_PATH, timeout: 10000 });
  return context.result;
}

function registerTests() {
  test("only four approved WPI collection aliases change bankKey; sources remain immutable", () => {
    for (let level = 1; level <= 4; level++) {
      const source = fixtureItem({ bankKey: `wpi-class${level}-water-coll` }); const before = structuredClone(source);
      assert.deepEqual(mapDatabaseItem(source), { ...source, bankKey: `wpi-class${level}-wastewater-coll` }); assert.deepEqual(source, before);
    }
    for (const bankKey of ["wpi-class1-water-dist", "wpi-class1-water", "class1-wastewater-coll", "oit-ww", "wpi-class5-water-coll"]) assert.deepEqual(mapDatabaseItem(fixtureItem({ bankKey })), fixtureItem({ bankKey }));
  });
  test("OIT wastewater source 1501–1600 maps exactly to 1601–1700; water and oit-ww stay unchanged", () => {
    for (let num = 1501; num <= 1600; num++) {
      const source = fixtureItem({ bankKey: "oit", questionNum: num, stream: "Wastewater Treatment" });
      assert.equal(mapDatabaseItem(source).questionNum, num + 100); assert.equal(source.questionNum, num);
      assert.equal(mapDatabaseItem({ ...source, stream: "Water Treatment" }).questionNum, num);
      assert.equal(mapDatabaseItem({ ...source, bankKey: "oit-ww" }).questionNum, num);
    }
    for (const questionNum of [1500, 1601]) assert.throws(() => mapDatabaseItem(fixtureItem({ bankKey: "oit", questionNum, stream: "Wastewater Treatment" })), /outside approved range/);
  });
  test("actual package withholds original nine, both exact flagged candidates and mapped collection conflict, binding every exclusion hash", () => {
    const pkg = loadPackage();
    assert.equal(pkg.entries.length, 7000); assert.equal(pkg.candidates.length, 6988); assert.equal(pkg.sourceCandidates.length, 6988);
    assert.equal(pkg.manifest.withheld.length, 12); assert.equal(Number(pkg.manifest.withheldCount), 12); assert.equal(Number(pkg.manifest.releaseCandidateCount), 6988);
    const expected = [["class1-water",2273],["class1-wastewater",2268],["class1-wastewater",2251],["class1-wastewater",2406],["wpi-class1-water",2373],["wpi-class3-water",2371],["wpi-class4-water",2416],["wpi-class1-wastewater",2268],["wpi-class1-water-dist",2351],["wpi-class1-wastewater",2303],["wpi-class1-wastewater",2308],["wpi-class1-water-coll",2266]];
    assert.deepEqual(pkg.manifest.withheld.map(x => `${x.bankKey}|${x.questionNum}`).sort(), expected.map(([bank,num]) => `${bank}|${num}`).sort());
    for (const exclusion of pkg.manifest.withheld) {
      const source = pkg.entries.find(x => x.bankKey === exclusion.bankKey && itemIdentity(x) === exclusion.itemId && x.questionNum === exclusion.questionNum);
      assert.ok(source); assert.equal(payloadHash(source), exclusion.payloadSha256);
      assert.ok(!pkg.sourceCandidates.some(x => x.bankKey === source.bankKey && itemIdentity(x) === itemIdentity(source) && x.questionNum === source.questionNum));
    }
    const bytes = readFileSync(MANIFEST_PATH);
    assert.equal(pkg.packageSha256, digest({ manifestSha256: createHash("sha256").update(bytes).digest("hex"), candidatePayloadSha256: pkg.sourceCandidates.map(source => ({ source: payloadHash(source), mapped: payloadHash(mapDatabaseItem(source)) })).sort((a,b) => a.source.localeCompare(b.source)) }));
    assert.ok(!pkg.candidates.some(x => /309a/i.test(x.bankKey)));
    assert.equal(new Set(pkg.candidates.map(x => `${x.bankKey}|${x.questionNum}`)).size, 6988);
    assert.equal(new Set(pkg.candidates.map(x => `${x.bankKey}|${normalizeStem(x.question)}`)).size, 6988);
  });
  test("loadPackage rejects exclusion tampering and missing identity; manifest bytes bind release hash", () => {
    const entries = stagedEntries(), manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    const changed = structuredClone(entries), excluded = manifest.withheld[0];
    changed.find(x => x.bankKey === excluded.bankKey && x.questionNum === excluded.questionNum).explanation += " tampered";
    assert.throws(() => virtualLoad(changed, manifest), /hash mismatch/);
    const missing = structuredClone(manifest); missing.withheld[0].itemId = "not-in-package";
    assert.throws(() => virtualLoad(entries, missing), /not found/);
    const normal = virtualLoad(entries, manifest), whitespace = virtualLoad(entries, manifest, Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
    assert.notEqual(normal.packageSha256, whitespace.packageSha256);
  });
  test("loadPackage rejects inconsistent exclusion counts and candidate counts", () => {
    const entries = stagedEntries(), manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    for (const field of ["withheldCount", "releaseCandidateCount", "approvedFlaggedCount"]) {
      const changed = structuredClone(manifest); changed[field] = Number(changed[field]) + 1;
      assert.throws(() => virtualLoad(entries, changed), /count|expected|manifest/i, `${field} must fail closed`);
    }
  });
  test("loadPackage rejects source-valid candidates that conflict only AFTER OIT mapping", () => {
    const entries=stagedEntries(), manifest=JSON.parse(readFileSync(MANIFEST_PATH,"utf8"));
    const wastewater=entries.find(x=>x.bankKey==="oit" && x.stream==="Wastewater Treatment" && x.questionNum===1501);
    const water=entries.find(x=>x.bankKey==="oit" && x.stream==="Water Treatment" && x.questionNum===1501);
    assert.ok(water && wastewater);
    const numberConflict=structuredClone(entries);
    numberConflict.find(x=>x.bankKey===water.bankKey && x.stream===water.stream && x.questionNum===water.questionNum).questionNum=1601;
    assert.throws(()=>virtualLoad(numberConflict,manifest),/duplicate mapped candidate bank\/question number/);
    const stemConflict=structuredClone(entries);
    stemConflict.find(x=>x.bankKey===water.bankKey && x.stream===water.stream && x.questionNum===water.questionNum).question=wastewater.question.toUpperCase();
    assert.throws(()=>virtualLoad(stemConflict,manifest),/duplicate candidate question stem/);
  });
  test("acceptance harness refuses all nonliteral-localhost URLs, missing acknowledgment and unsafe options", async () => {
    const {validateDisposableDatabaseUrl}=await import("./exam-bank-expansion-acceptance.mjs");
    const ack=["--acknowledge-disposable-local-database"];
    const url="mysql://synthetic:synthetic@localhost:3306/expansion_acceptance_"+"a".repeat(32);
    assert.equal(validateDisposableDatabaseUrl(url,ack).options.host,"127.0.0.1");
    for(const value of [undefined,"",url.replace("localhost","127.0.0.1"),url.replace("localhost","remote.example"),url.replace("localhost","localhost.example"),url.replace("localhost","%6cocalhost"),url+"?socketPath=/tmp/mysql.sock",url+"#fragment",url.replace("mysql:","https:"),url.replace(/expansion_acceptance_a+/,"production"),url.replace(":3306/","/"),url.replace(":3306/",":0/")]) assert.throws(()=>validateDisposableDatabaseUrl(value,ack),/Acceptance refused/);
    for(const args of [[],["--apply"],[...ack,"--apply"]]) assert.throws(()=>validateDisposableDatabaseUrl(url,args),/Acceptance refused/);
  });
  test("candidate conflicts are detected AFTER approved bank/number mapping", () => {
    const pkg = makePackage([fixtureItem(), fixtureItem({ bankKey: "oit", questionNum: 1501, stream: "Wastewater Treatment", itemId: "OIT-WW-1501", question: "OIT synthetic candidate?" })]);
    for (const item of pkg.candidates) {
      assert.throws(() => planAgainstRows(pkg, [{ ...item, id: 1, question: "Different stem", reviewStatus: "rejected" }]), /question number already exists/);
      assert.throws(() => planAgainstRows(pkg, [{ ...item, id: 1, questionNum: 10, question: item.question.toUpperCase(), reviewStatus: "approved" }]), /question stem already exists/);
    }
    assert.equal(planAgainstRows(pkg, pkg.candidates.map((x,i) => ({ ...x, id:i+1, questionNum:10+i, reviewStatus:"rejected" }))).conflicts.length, 0);
  });
  test("preexisting nonrejected duplicate stems are reported, not blocking unrelated additive insert", async () => {
    const pkg = makePackage(); const bankKey = pkg.candidates[0].bankKey;
    const existing = [1,2].map(id => ({ ...fixtureItem({ bankKey, questionNum:id, question:id === 1 ? "Existing duplicated stem?" : "EXISTING DUPLICATED STEM!" }), id, reviewStatus:id === 1 ? "approved" : "unreviewed", reviewedBy:"preserve", reviewedAt:TEST_NOW, options:'["A","B","C","D"]' }));
    const before = structuredClone(existing), plan = planAgainstRows(pkg, existing);
    assert.equal(plan.existingDuplicateStems, 1);
    const db = new MemoryConnection(pkg, { existing }); const result = await applyPackage(db, pkg, { reviewer:TEST_REVIEWER, now:TEST_NOW });
    assert.equal(result.inserted, 1); assert.deepEqual(db.rows.slice(0,2), before);
  });
  test("original-to-mapped receipt identities survive reordered sources and shared itemId", async () => {
    const sources = [fixtureItem(), fixtureItem({ bankKey:"oit",questionNum:1501,stream:"Wastewater Treatment",itemId:"SHARED",question:"Synthetic wastewater source?" }), fixtureItem({ bankKey:"oit",questionNum:1501,stream:"Water Treatment",itemId:"SHARED",question:"Synthetic water source?" })];
    const pkg = makePackage(sources); pkg.sourceCandidates.reverse();
    const db = new MemoryConnection(pkg); await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW});
    for (const item of pkg.candidates) {
      const source = sources.find(source => digest(mapDatabaseItem(source)) === digest(item));
      const row = db.rows.find(row => row.bankKey === item.bankKey && row.questionNum === item.questionNum);
      assertReceipt(db.receipts.find(receipt => receipt.questionId === row.id), row, source, item, pkg);
    }
  });
  test("absent itemId preserves original fallback identity through both mapping types", async () => {
    for (const overrides of [{}, {bankKey:"oit",questionNum:1501,stream:"Wastewater Treatment"}]) {
      const source = fixtureItem(overrides); delete source.itemId; const pkg=makePackage([source]); const db=new MemoryConnection(pkg);
      await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}); assertReceipt(db.receipts[0],db.rows[0],source,pkg.candidates[0],pkg);
    }
  });
  test("missing mapped metadata causes rollback before any insert", async () => {
    const pkg=makePackage(); const db=new MemoryConnection(pkg,{missingMetadata:true});
    await assert.rejects(applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/metadata/);
    assert.equal(db.inserts,0); assert.equal(db.commits,0); assert.equal(db.rollbacks,1); assert.deepEqual(db.rows,[]); assert.deepEqual(db.receipts,[]);
  });
  for (const pattern of [/^INSERT INTO questions/, /^INSERT INTO question_content_snapshots/, /^UPDATE question_bank_meta/]) test(`atomic rollback and successful retry after ${pattern.source}`, async () => {
    const pkg=makePackage([fixtureItem(),fixtureItem({questionNum:2252,itemId:"SECOND",question:"Second unrelated synthetic item?"})]); const db=new MemoryConnection(pkg);
    const before=structuredClone({rows:db.rows,receipts:db.receipts,metadata:db.metadata});
    await assert.rejects(applyPackage(failAfterExecute(db,pattern),pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/synthetic failure AFTER/);
    assert.deepEqual({rows:db.rows,receipts:db.receipts,metadata:db.metadata},before); assert.equal(db.commits,0); assert.equal(db.rollbacks,1);
    assert.equal((await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW})).inserted,2);
    const committed=structuredClone({rows:db.rows,receipts:db.receipts,metadata:db.metadata});
    const rerun=await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}); assert.equal(rerun.alreadyApplied,true); assert.equal(rerun.inserted,0);
    assert.deepEqual({rows:db.rows,receipts:db.receipts,metadata:db.metadata},committed);
  });
}

// Importing reusable helpers from the acceptance harness must not register tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) registerTests();
