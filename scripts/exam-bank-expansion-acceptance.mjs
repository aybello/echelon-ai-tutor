#!/usr/bin/env node
/**
 * DATABASE-backed acceptance, NEVER the release apply CLI.
 * Supply EXPANSION_TEST_DATABASE_URL only, for example:
 * EXPANSION_TEST_DATABASE_URL='mysql://root:root@localhost:3306/expansion_acceptance_<32 lowercase hex chars>' \
 *   node scripts/exam-bank-expansion-acceptance.mjs --acknowledge-disposable-local-database
 *
 * Requires CREATE/DROP DATABASE permission. Creates (without IF NOT EXISTS), owns,
 * and drops exactly the explicitly supplied dedicated disposable schema. No
 * application connection selectors, credential loaders, learner tables, or
 * environment fallbacks are imported or used.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyPackage, digest, itemIdentity, mapDatabaseItem, normalizeStem, payloadHash, planAgainstRows } from "./exam-bank-expansion-release.mjs";
import { actualMappedSamples, assertReceipt, failAfterExecute, fixtureItem, makePackage, TEST_NOW, TEST_REVIEWER } from "./exam-bank-expansion-release.test.mjs";

const ACKNOWLEDGMENT = "--acknowledge-disposable-local-database";
const DATABASE_NAME = /^expansion_acceptance_[0-9a-f]{32}$/;

export function validateDisposableDatabaseUrl(value, args = []) {
  const refuse = () => { throw new Error("Acceptance refused: require EXPANSION_TEST_DATABASE_URL, literal localhost mysql URL, dedicated expansion_acceptance_<32 lowercase hex> schema, no URL options, and explicit acknowledgment flag. Connection details withheld."); };
  if (typeof value !== "string" || !value || args.length !== 1 || args[0] !== ACKNOWLEDGMENT) refuse();
  let url;
  try { url = new URL(value); } catch { refuse(); }
  // Require literal 'localhost', not a DNS alias, IP spelling, encoded hostname,
  // Unix socket, query-string mysql2 options, multi-host URL, or port fallback.
  if (url.protocol !== "mysql:" || url.hostname !== "localhost" || !/^mysql:\/\/[^/]*@localhost:[0-9]+\//.test(value)
      || !url.username || !url.port || url.search || url.hash || !DATABASE_NAME.test(url.pathname.slice(1))) refuse();
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) refuse();
  let user, password;
  try { user = decodeURIComponent(url.username); password = decodeURIComponent(url.password); } catch { refuse(); }
  return { database: url.pathname.slice(1), options: { host: "127.0.0.1", port, user, password,
    timezone: "Z", multipleStatements: false, connectTimeout: 10000, supportBigNumbers: true } };
}

// Mirrors precisely the three relevant authoritative table declarations in
// drizzle/schema.ts (questions, questionContentSnapshots, questionBankMeta).
// In particular TIMESTAMP has NO fractional precision; never relax to (3)/(6).
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
const TABLES = ["questions", "question_content_snapshots", "question_bank_meta"];

async function snapshot(db) {
  return Object.fromEntries(await Promise.all(TABLES.map(async table => {
    const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY id`);
    return [table, rows.map(row => ({ ...row }))];
  })));
}

async function insertExisting(db, bankKey, questionNum, question, reviewStatus = "approved") {
  const source = fixtureItem({ bankKey, questionNum, question });
  await db.execute(`INSERT INTO questions (bankKey,questionNum,module,difficulty,question,options,correctIndex,explanation,
    steps,tip,isCalc,topic,cognitiveLevel,sourceTitle,sourceReference,sourceUrl,blueprintObjective,reviewStatus,reviewedBy,reviewedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [bankKey,questionNum,"Preserved legacy module","hard",question,
    JSON.stringify(source.options),2,"Preserved historical explanation",'[{"l":"legacy","c":"unchanged"}]',"Preserved tip","yes",
    "Preserved topic","application","Historical fixture","Historical reference","https://example.invalid/historical",
    "Preserved objective",reviewStatus,"preserve-original-reviewer",new Date("2024-01-02T03:04:05.000Z")]);
}

async function seed(db, pkg, { missingMetadata = false } = {}) {
  for (const table of ["question_content_snapshots", "questions", "question_bank_meta"]) await db.execute(`DELETE FROM ${table}`);
  const banks = [...new Set(pkg.candidates.map(item => item.bankKey))];
  for (const bankKey of banks) {
    if (!missingMetadata || bankKey !== banks[0]) await db.execute(`INSERT INTO question_bank_meta
      (bankKey,modules,moduleTargets,formulaLinks,totalQuestions,contentVersion,blueprintVersion,minCalcPerMock,recallTargetPct)
      VALUES (?,?,?,?,?,?,?,?,?)`, [bankKey,'[{"id":"KEEP","name":"Preserve modules exactly"}]','{"KEEP":100}',
      '{"KEEP":"/formulas-preserved#keep"}',2,7,3,4,60]);
    await insertExisting(db,bankKey,1,"Preserve historical duplicated stem?","approved");
    await insertExisting(db,bankKey,2,"PRESERVE historical duplicated stem!","unreviewed");
    await insertExisting(db,bankKey,3,"Preserve rejected historical question?","rejected");
    await insertExisting(db,bankKey,4,"Preserve in-review historical question?","in_review");
  }
  await insertExisting(db,"outside-synthetic-bank",1,"Outside-bank row must remain byte-for-byte unchanged?");
  // Sentinel 309A data is synthetic only, proving this release cannot affect it.
  await insertExisting(db,"ontario-309a-synthetic-preserve",1,"Unrelated synthetic 309A sentinel?");
  await db.execute(`INSERT INTO question_bank_meta (bankKey,modules,moduleTargets,totalQuestions,contentVersion)
    VALUES (?,?,?,?,?)`, ["outside-synthetic-bank",'["OUTSIDE"]','{"OUTSIDE":100}',1,11]);
  const [outsideRows] = await db.execute("SELECT id FROM questions WHERE bankKey = ?",["outside-synthetic-bank"]);
  await db.execute(`INSERT INTO question_content_snapshots
    (releaseKey,bankKey,questionId,questionNum,sourceContentVersion,contentHash,payload) VALUES (?,?,?,?,?,?,?)`,
    ["unrelated-historical-synthetic-release","outside-synthetic-bank",outsideRows[0].id,1,9,digest("preserve historical receipt"),'{"syntheticHistoricalReceipt":"preserve exactly"}']);
}

async function assertSuccess(db, pkg, before) {
  const after = await snapshot(db);
  assert.equal(after.questions.length, before.questions.length + pkg.candidates.length);
  assert.equal(after.question_content_snapshots.length, before.question_content_snapshots.length + pkg.candidates.length);
  for (const previous of before.questions) assert.deepEqual(after.questions.find(row => row.id === previous.id), previous, "all old educational and reviewer fields stay unchanged");
  for (const previous of before.question_content_snapshots) assert.deepEqual(after.question_content_snapshots.find(row => row.id === previous.id), previous);
  const affected = new Set(pkg.candidates.map(item => item.bankKey));
  for (const previous of before.question_bank_meta) {
    const current = after.question_bank_meta.find(row => row.id === previous.id);
    if (!affected.has(previous.bankKey)) { assert.deepEqual(current,previous); continue; }
    assert.deepEqual({ ...current, totalQuestions:previous.totalQuestions, contentVersion:previous.contentVersion }, previous,
      "modules, targets, formula links, blueprint version and mock settings are preserved exactly");
    assert.equal(current.contentVersion,previous.contentVersion+1);
    assert.equal(current.totalQuestions,after.questions.filter(row => row.bankKey === previous.bankKey && ["approved","unreviewed"].includes(row.reviewStatus)).length);
  }
  for (let index=0; index<pkg.candidates.length; index++) {
    const item=pkg.candidates[index];
    const source=pkg.sourceCandidates.find(source => payloadHash(mapDatabaseItem(source)) === payloadHash(item));
    assert.ok(source,"stable source match independent of ordering or itemId availability");
    const row=after.questions.find(row => row.bankKey === item.bankKey && row.questionNum === item.questionNum);
    assertReceipt(after.question_content_snapshots.find(receipt => receipt.releaseKey === pkg.releaseKey && receipt.questionId === row.id),row,source,item,pkg);
    assert.equal(row.module,item.module); assert.deepEqual(JSON.parse(row.options),item.options); assert.equal(row.correctIndex,item.correctIndex);
  }
  return after;
}

export async function runAcceptance(db) {
  await test("disposable localhost MariaDB/MySQL expansion acceptance", { concurrency:false }, async t => {
    await t.test("small synthetic package succeeds, preserves duplicates and metadata, and rerun is read-only", async () => {
      const sources=[fixtureItem(),fixtureItem({bankKey:"oit",questionNum:1501,stream:"Wastewater Treatment",itemId:"SHARED-IDENTITY",question:"Wastewater synthetic addition?"}),fixtureItem({bankKey:"oit",questionNum:1501,stream:"Water Treatment",itemId:"SHARED-IDENTITY",question:"Water synthetic addition?"})];
      const pkg=makePackage(sources); pkg.sourceCandidates.reverse(); await seed(db,pkg);
      const before=await snapshot(db), plan=planAgainstRows(pkg,before.questions.filter(x => pkg.candidates.some(item => item.bankKey===x.bankKey)));
      assert.equal(plan.existingDuplicateStems,new Set(pkg.candidates.map(x=>x.bankKey)).size);
      const result=await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}); assert.equal(result.inserted,3); assert.equal(result.alreadyApplied,false);
      const committed=await assertSuccess(db,pkg,before);
      const again=await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}); assert.equal(again.alreadyApplied,true); assert.equal(again.inserted,0); assert.deepEqual(await snapshot(db),committed);
    });
    await t.test("actual unmodified mapped WPI and OIT samples roundtrip original identities and timestamp precision", async () => {
      const sources=actualMappedSamples(), pkg=makePackage(sources); await seed(db,pkg); const before=await snapshot(db);
      const fractionalNow=new Date("2026-11-23T05:56:00.987Z"), originalTimestamp=fractionalNow.toISOString();
      assert.equal(pkg.candidates[0].bankKey,"wpi-class1-wastewater-coll"); assert.equal(pkg.candidates[1].bankKey,"oit"); assert.equal(pkg.candidates[1].questionNum,sources[1].questionNum+100);
      await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:fractionalNow}); const after=await assertSuccess(db,pkg,before);
      assert.equal(fractionalNow.toISOString(),originalTimestamp,"importer must not mutate caller-owned Date");
      for (const receipt of after.question_content_snapshots.filter(row => row.releaseKey===pkg.releaseKey)) assert.equal(JSON.parse(receipt.payload).reviewedAt,TEST_NOW.toISOString());
      assert.equal((await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:fractionalNow})).alreadyApplied,true);
    });
    await t.test("mapped source without itemId gets ORIGINAL fallback receipt identity", async () => {
      const sources=[fixtureItem(),fixtureItem({bankKey:"oit",questionNum:1501,stream:"Wastewater Treatment",question:"Absent OIT itemId synthetic question?"})]; sources.forEach(x=>delete x.itemId);
      const pkg=makePackage(sources); pkg.sourceCandidates.reverse(); await seed(db,pkg); const before=await snapshot(db);
      await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}); await assertSuccess(db,pkg,before);
      assert.equal((await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW})).alreadyApplied,true);
    });
    for (const pattern of [/^INSERT INTO questions/,/^INSERT INTO question_content_snapshots/,/^UPDATE question_bank_meta/]) await t.test(`rollback after successful executed ${pattern.source}, then retry and rerun`,async()=>{
      const pkg=makePackage([fixtureItem(),fixtureItem({questionNum:2252,itemId:"SECOND-SYNTHETIC",question:"Second synthetic acceptance item?"})]); await seed(db,pkg); const before=await snapshot(db);
      await assert.rejects(applyPackage(failAfterExecute(db,pattern),pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/synthetic failure AFTER/);
      assert.deepEqual(await snapshot(db),before,"successful write was rolled back, including metadata and receipts");
      assert.equal((await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW})).inserted,2); const committed=await assertSuccess(db,pkg,before);
      assert.equal((await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW})).alreadyApplied,true); assert.deepEqual(await snapshot(db),committed);
    });
    await t.test("missing mapped destination metadata rolls back without any insert",async()=>{
      const pkg=makePackage(); await seed(db,pkg,{missingMetadata:true}); const before=await snapshot(db);
      await assert.rejects(applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/metadata/); assert.deepEqual(await snapshot(db),before);
    });
    for (const kind of ["number","nonrejected stem"]) await t.test(`mapped candidate ${kind} conflict rolls back`,async()=>{
      const pkg=makePackage(); await seed(db,pkg); const item=pkg.candidates[0];
      await insertExisting(db,item.bankKey,kind==="number" ? item.questionNum : 88,kind==="number" ? "Different collision stem?" : item.question.toUpperCase());
      const before=await snapshot(db); await assert.rejects(applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/already exists/); assert.deepEqual(await snapshot(db),before);
    });
    await t.test("partial prior receipt is rejected without further mutation",async()=>{
      const pkg=makePackage([fixtureItem(),fixtureItem({questionNum:2252,itemId:"SECOND",question:"Partial receipt second synthetic?"})]); await seed(db,pkg);
      await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW});
      await db.execute("DELETE FROM question_content_snapshots WHERE releaseKey=? ORDER BY id LIMIT 1",[pkg.releaseKey]); const partial=await snapshot(db);
      await assert.rejects(applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/partial prior/); assert.deepEqual(await snapshot(db),partial);
    });
    for (const field of ["originalPayloadSha256","mappedPayloadSha256","packageSha256","itemId","itemKey","sourceIdentity","mappedIdentity","mapping","reviewer","reviewedAt","item","contentHash","question","reviewedBy","reviewedAt-row"]) await t.test(`tampered ${field} is rejected, preserving already-present evidence`,async()=>{
      const pkg=makePackage(); await seed(db,pkg); await applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW});
      const [receipts]=await db.execute("SELECT * FROM question_content_snapshots WHERE releaseKey=?",[pkg.releaseKey]); const receipt=receipts[0], payload=JSON.parse(receipt.payload);
      if(field==="contentHash") await db.execute("UPDATE question_content_snapshots SET contentHash=? WHERE id=?",["0".repeat(64),receipt.id]);
      else if(field==="question") await db.execute("UPDATE questions SET question=? WHERE id=?",["Tampered synthetic content?",receipt.questionId]);
      else if(field==="reviewedBy") await db.execute("UPDATE questions SET reviewedBy=? WHERE id=?",["tampered-reviewer",receipt.questionId]);
      else if(field==="reviewedAt-row") await db.execute("UPDATE questions SET reviewedAt=? WHERE id=?",[new Date("2026-11-23T05:55:59.000Z"),receipt.questionId]);
      else {
        payload[field]=field==="mapping" ? null : field==="item" ? {...payload.item,explanation:"tampered"} : field==="reviewedAt" ? "2026-11-23T05:55:59.000Z" : "tampered";
        await db.execute("UPDATE question_content_snapshots SET payload=? WHERE id=?",[JSON.stringify(payload),receipt.id]);
      }
      const tampered=await snapshot(db); await assert.rejects(applyPackage(db,pkg,{reviewer:TEST_REVIEWER,now:TEST_NOW}),/mismatch|missing receipt|bind|undefined|incorrect arguments/i);
      assert.deepEqual(await snapshot(db),tampered,"rejection does not erase or modify evidence");
    });
  });
}

async function main() {
  const {database,options}=validateDisposableDatabaseUrl(process.env.EXPANSION_TEST_DATABASE_URL,process.argv.slice(2));
  // Import mysql2 only AFTER guard passes; never import a connection helper.
  const mysql=await import("mysql2/promise");
  let admin, db, created=false;
  try {
    admin=await mysql.createConnection(options);
    // A preexisting name is an unconditional failure, never adopted or dropped.
    await admin.execute(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created=true;
    db=await mysql.createConnection({...options,database});
    await db.execute("SET time_zone = '+00:00'");
    await db.execute("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    for(const sql of DDL) await db.execute(sql);
    console.log("Running acceptance against newly-created dedicated localhost-only schema; no learner tables exist.");
    await runAcceptance(db);
  } finally {
    // Close active connection before removing the only database created here.
    if(db) await db.end();
    if(admin) {
      try { if(created) { await admin.execute(`DROP DATABASE \`${database}\``); console.log("Owned disposable acceptance schema dropped."); } }
      finally { await admin.end(); }
    }
  }
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{
  // Do not print URL/password-bearing objects or stack traces from connection errors.
  const safe=String(error.message).replace(/mysql:\/\/[^\s]+/g,"[redacted database URL]");
  console.error(safe); process.exitCode=1;
});
