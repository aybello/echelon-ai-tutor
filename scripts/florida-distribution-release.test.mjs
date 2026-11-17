import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadPackage, COLUMNS, digest, ACTOR } from './lib/floridaDistributionRelease.mjs';
import { transact } from './florida-distribution-release.mjs';
const pkg = loadPackage(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = fileURLToPath(new URL('../content/us-banks/', import.meta.url));
function withManifestMutation(alter, check) {
  const root = mkdtempSync(join(tmpdir(),'fl-manifest-'));
  try {
    for (const bank of pkg.banks) {
      const original = join(sourceRoot,bank.key), target = join(root,'content/us-banks',bank.key);
      mkdirSync(target,{recursive:true});
      for (const file of ['questions','config.json','REVIEW-RESULT.md']) symlinkSync(join(original,file),join(target,file));
      const manifest = JSON.parse(readFileSync(join(original,'manifest.json'),'utf8'));
      alter(manifest,bank);
      writeFileSync(join(target,'manifest.json'),JSON.stringify(manifest));
    }
    check(root);
  } finally { rmSync(root,{recursive:true,force:true}); }
}
for (const [name,alter] of [
  ['wrong key',m=>{const key=Object.keys(m.modules)[0];m.modules.substituted=m.modules[key];delete m.modules[key];}],
  ['wrong count',m=>{m.modules[Object.keys(m.modules)[0]]++;}],
  ['string count',m=>{const key=Object.keys(m.modules)[0];m.modules[key]=String(m.modules[key]);}],
  ['array count',m=>{const key=Object.keys(m.modules)[0];m.modules[key]=[m.modules[key]];}],
  ['extra key',m=>{m.modules.extra=0;}],
  ['missing key',m=>{delete m.modules[Object.keys(m.modules)[0]];}],
  ['null tally',m=>{m.modules=null;}],
  ['array tally',m=>{m.modules=Object.entries(m.modules);}],
  ['missing tally',m=>{delete m.modules;}],
]) for (const bank of pkg.banks) test(`${bank.key}: manifest-only ${name} is rejected with reviewed question bytes unchanged`,()=>{
  withManifestMutation((manifest,spec)=>{if(spec.key===bank.key) alter(manifest);},root=>assert.throws(()=>loadPackage(root),/Manifest module tally mismatch/));
});
test('valid reordered module tallies preserve row-derived metadata and exact package hash',()=>{
  withManifestMutation(m=>{m.modules=Object.fromEntries(Object.entries(m.modules).reverse());},root=>{
    const actual=loadPackage(root);
    assert.deepEqual(actual,pkg);
    assert.equal(actual.packageSha256,pkg.packageSha256);
    for (const bank of actual.banks) assert.deepEqual(bank.modules,[...new Set(bank.rows.map(row=>row.module))]);
  });
});
function database() {
  const db = { rows: [], meta: [], receipts: [], calls: [], committed: 0, rolledBack: 0, failCAS: false, outsideChanged: false };
  let baseline;
  db.beginTransaction = async () => { baseline = structuredClone({rows:db.rows,meta:db.meta,receipts:db.receipts}); };
  db.commit = async () => { db.committed++; };
  db.rollback = async () => { Object.assign(db, baseline); db.rolledBack++; };
  db.execute = async (sql, args = []) => {
    db.calls.push({sql,args});
    if (sql.startsWith('SELECT bankKey,reviewStatus,COUNT')) return [[{bankKey:'protected-existing',reviewStatus:'approved',n:db.outsideChanged && db.rows.length ? 2 : 1}]];
    if (sql.startsWith('SELECT id,')) return [structuredClone(db.rows.filter(r=>r.bankKey===args[0]))];
    if (sql.startsWith('SELECT * FROM question_bank_meta')) return [structuredClone(db.meta)];
    if (sql.startsWith('SELECT questionId')) return [structuredClone(db.receipts)];
    if (sql.startsWith('INSERT INTO questions ')) {
      const row={id:10001+db.rows.length,...Object.fromEntries(COLUMNS.map((k,i)=>[k,args[i]])),reviewStatus:'in_review'};
      db.rows.push(row);return [{insertId:row.id,affectedRows:1}];
    }
    if (sql.startsWith('INSERT INTO question_content_snapshots ')) {
      const [releaseKey,bankKey,questionId,questionNum,contentHash,payload]=args;
      db.receipts.push({releaseKey,bankKey,questionId,questionNum,contentHash,payload});return [{affectedRows:1}];
    }
    if (sql.startsWith('INSERT INTO question_bank_meta ')) {
      const [bankKey,modules,totalQuestions]=args;
      db.meta.push({bankKey,modules,totalQuestions,moduleTargets:null,formulaLinks:null,contentVersion:1,blueprintVersion:1,minCalcPerMock:null,recallTargetPct:null});return [{affectedRows:1}];
    }
    if (sql.startsWith('UPDATE questions SET reviewStatus')) {
      assert.match(sql,/WHERE id = \? AND bankKey = \? AND questionNum = \? AND reviewStatus = \?$/);
      const [status,actor,at,id,key,num,before]=args;
      const row=db.rows.find(r=>r.id===id && r.bankKey===key && r.questionNum===num && r.reviewStatus===before);
      if (!row || db.failCAS) return [{affectedRows:0}];
      Object.assign(row,{reviewStatus:status,reviewedBy:actor,reviewedAt:at});return [{affectedRows:1}];
    }
    if (sql.startsWith('UPDATE question_bank_meta SET contentVersion')) { db.meta.find(m=>m.bankKey===args[0]).contentVersion++;return [{affectedRows:1}]; }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  return db;
}
test('preflight is read-only and checks global release snapshots and the metadata row',async()=>{
  const db=database();assert.equal((await transact(db,pkg,'preflight')).empty,true);
  assert.equal(db.committed,0);assert.equal(db.rolledBack,1);
  assert.ok(db.calls.every(c=>c.sql.startsWith('SELECT')));
  assert.ok(db.calls.some(c=>c.sql.includes('question_bank_meta WHERE bankKey IN (?)')));
  assert.ok(db.calls.some(c=>c.sql.includes('WHERE releaseKey = ? ORDER BY questionId FOR UPDATE')));
});
test('stage adds exact 150 payloads, bank metadata, auto IDs and before-null provenance snapshots',async()=>{
  const db=database(),events=[];const result=await transact(db,pkg,'stage',{beforeCommit:p=>events.push(p)});
  assert.equal(result.rows,150);assert.equal(db.committed,1);assert.equal(result.crosswalk.length,150);
  assert.deepEqual(db.rows.map(({id,reviewStatus,...row})=>row),pkg.banks.flatMap(b=>b.rows));
  assert.deepEqual(db.meta.map(m=>[m.bankKey,m.totalQuestions]),pkg.banks.map(b=>[b.key,b.count]));
  assert.deepEqual(db.meta.map(m=>JSON.parse(m.modules)),pkg.banks.map(b=>[...new Set(b.rows.map(row=>row.module))]));
  assert.equal(events[0].phase,'empty-target-baseline');assert.deepEqual(events[0].metadata,[]);
  for(const r of db.receipts){const p=JSON.parse(r.payload);assert.equal(p.before,null);assert.equal(p.kind,'additive-insert');assert.equal(p.packageSha256,pkg.packageSha256);assert.equal(r.contentHash,digest(p));assert.equal(p.inserted.id,r.questionId);}
  assert.ok(db.rows.every(r=>r.reviewStatus==='in_review'));assert.equal(db.receipts.length,150);
});
test('stage rerun refuses existing cohort without overwrite; metadata or orphan snapshots also block',async()=>{
  const db=database();await transact(db,pkg,'stage');const before=structuredClone(db.rows);
  await assert.rejects(transact(db,pkg,'stage'),/already exist/);assert.deepEqual(db.rows,before);
  for(const field of ['meta','receipts']){const d=database();d[field].push({});await assert.rejects(transact(d,pkg,'stage'),/already exist/);assert.equal(d.rows.length,0);}
});
test('publish updates only exact in-review crosswalk IDs and keeps payload hashes intact',async()=>{
  const db=database();await transact(db,pkg,'stage');const before=db.rows.map(({reviewStatus,...r})=>r);
  await transact(db,pkg,'publish');assert.ok(db.rows.every(r=>r.reviewStatus==='approved'&&r.reviewedBy===ACTOR));
  assert.deepEqual(db.rows.map(({reviewStatus,reviewedBy,reviewedAt,...r})=>r),before);
  assert.ok(db.calls.filter(c=>c.sql.startsWith('UPDATE questions')).every(c=>c.args[6]==='in_review'));
  await assert.rejects(transact(db,pkg,'publish'),/status mismatch/);
});
test('a failed compare-and-swap rolls back the entire publish transaction',async()=>{
  const db=database();await transact(db,pkg,'stage');db.failCAS=true;
  await assert.rejects(transact(db,pkg,'publish'),/Exact cohort update failed/);
  assert.ok(db.rows.every(r=>r.reviewStatus==='in_review'));assert.equal(db.committed,1);
});
test('failure to persist precommit audit receipt rolls back every insertion',async()=>{
  const db=database();await assert.rejects(transact(db,pkg,'stage',{beforeCommit:p=>{if(p.phase==='verified-before-commit')throw Error('receipt unavailable');}}),/receipt unavailable/);
  assert.equal(db.rows.length,0);assert.equal(db.meta.length,0);assert.equal(db.receipts.length,0);assert.equal(db.committed,0);
});
test('publish rejects payload, snapshot and metadata tampering and already-approved rows',async()=>{
  for(const alter of [d=>d.rows[0].question+=' changed',d=>d.receipts[0].contentHash='bad',d=>d.meta[0].formulaLinks='{}',d=>d.meta[0].modules='["substituted"]',d=>d.rows[0].reviewStatus='approved']){
    const db=database();await transact(db,pkg,'stage');alter(db);await assert.rejects(transact(db,pkg,'publish'));assert.equal(db.committed,1);
  }
});
test('outside-bank inventory mutation aborts and rolls back staging',async()=>{
  const db=database();db.outsideChanged=true;await assert.rejects(transact(db,pkg,'stage'),/Outside-bank/);assert.equal(db.rows.length,0);
});
test('hide is repeatable, retains IDs and snapshots, and rejects mutated input before any SQL',async()=>{
  const db=database();await transact(db,pkg,'stage');await transact(db,pkg,'publish');const ids=db.rows.map(r=>r.id);
  await transact(db,pkg,'hide');await transact(db,pkg,'hide');assert.deepEqual(db.rows.map(r=>r.id),ids);assert.ok(db.rows.every(r=>r.reviewStatus==='rejected'));assert.equal(db.receipts.length,150);
  const other=database(),mutated=structuredClone(pkg);mutated.banks[0].rows[0].question+=' modified';await assert.rejects(transact(other,mutated,'stage'),/mutated/);assert.equal(other.calls.length,0);
});
