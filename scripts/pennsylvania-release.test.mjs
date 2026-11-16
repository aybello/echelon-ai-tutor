import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadPackage, COLUMNS, digest, ACTOR } from './lib/pennsylvaniaRelease.mjs';
import { transact } from './pennsylvania-release.mjs';
const pkg = loadPackage(fileURLToPath(new URL('..', import.meta.url)));
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
test('preflight is read-only and checks global release snapshots and both metadata rows',async()=>{
  const db=database();assert.equal((await transact(db,pkg,'preflight')).empty,true);
  assert.equal(db.committed,0);assert.equal(db.rolledBack,1);
  assert.ok(db.calls.every(c=>c.sql.startsWith('SELECT')));
  assert.ok(db.calls.some(c=>c.sql.includes('question_bank_meta WHERE bankKey IN (?,?)')));
  assert.ok(db.calls.some(c=>c.sql.includes('WHERE releaseKey = ? ORDER BY questionId FOR UPDATE')));
});
test('stage adds exact 750 payloads, bank metadata, auto IDs and before-null provenance snapshots',async()=>{
  const db=database(),events=[];const result=await transact(db,pkg,'stage',{beforeCommit:p=>events.push(p)});
  assert.equal(result.rows,750);assert.equal(db.committed,1);assert.equal(result.crosswalk.length,750);
  assert.deepEqual(db.rows.map(({id,reviewStatus,...row})=>row),pkg.banks.flatMap(b=>b.rows));
  assert.deepEqual(db.meta.map(m=>[m.bankKey,m.totalQuestions]),pkg.banks.map(b=>[b.key,b.count]));
  assert.equal(events[0].phase,'empty-target-baseline');assert.deepEqual(events[0].metadata,[]);
  for(const r of db.receipts){const p=JSON.parse(r.payload);assert.equal(p.before,null);assert.equal(p.kind,'additive-insert');assert.equal(p.packageSha256,pkg.packageSha256);assert.equal(r.contentHash,digest(p));assert.equal(p.inserted.id,r.questionId);}
  assert.ok(db.rows.every(r=>r.reviewStatus==='in_review'));assert.equal(db.receipts.length,750);
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
  for(const alter of [d=>d.rows[0].question+=' changed',d=>d.receipts[0].contentHash='bad',d=>d.meta[0].formulaLinks='{}',d=>d.rows[0].reviewStatus='approved']){
    const db=database();await transact(db,pkg,'stage');alter(db);await assert.rejects(transact(db,pkg,'publish'));assert.equal(db.committed,1);
  }
});
test('outside-bank inventory mutation aborts and rolls back staging',async()=>{
  const db=database();db.outsideChanged=true;await assert.rejects(transact(db,pkg,'stage'),/Outside-bank/);assert.equal(db.rows.length,0);
});
test('hide is repeatable, retains IDs and snapshots, and rejects mutated input before any SQL',async()=>{
  const db=database();await transact(db,pkg,'stage');await transact(db,pkg,'publish');const ids=db.rows.map(r=>r.id);
  await transact(db,pkg,'hide');await transact(db,pkg,'hide');assert.deepEqual(db.rows.map(r=>r.id),ids);assert.ok(db.rows.every(r=>r.reviewStatus==='rejected'));assert.equal(db.receipts.length,750);
  const other=database(),mutated=structuredClone(pkg);mutated.banks[0].rows[0].question+=' modified';await assert.rejects(transact(other,mutated,'stage'),/mutated/);assert.equal(other.calls.length,0);
});
