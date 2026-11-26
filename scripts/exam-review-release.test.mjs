import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { FIELDS, MUTABLE, digest, loadInputs, makePlan, checkState, holdReasons, validateFix } from './lib/examReviewRelease.mjs';
import { applyPlan } from './exam-review-release.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const inputs=loadInputs(root);
const current=inputs.baseline.map(r=>Object.fromEntries(FIELDS.map(k=>[k,r[k]??null])));
const plan=makePlan(inputs,current);
function fixture() {
  const p=structuredClone({...plan,actions:plan.actions.slice(0,2)});
  const rows=p.actions.map(a=>structuredClone(a.before)); let receipts=[], saved, committed=false, writes=0;
  const connection={
    async beginTransaction(){saved={rows:structuredClone(rows),receipts:structuredClone(receipts)};},
    async rollback(){rows.splice(0,rows.length,...saved.rows);receipts=saved.receipts;},
    async commit(){committed=true;},
    async execute(sql,args){
      if(sql.startsWith('SELECT')&&sql.includes('FROM questions '))return [structuredClone(rows)];
      if(sql.startsWith('SELECT')&&sql.includes('FROM question_content_snapshots'))return [structuredClone(receipts)];
      if(sql.startsWith('INSERT INTO question_content_snapshots')){receipts.push({questionId:args[2],contentHash:args[5],payload:args[6]});writes++;return [{affectedRows:1}];}
      if(sql.startsWith('UPDATE questions SET')){const r=rows.find(r=>r.id===args[MUTABLE.length]);for(let i=0;i<MUTABLE.length;i++)r[MUTABLE[i]]=args[i];writes++;return [{affectedRows:1}];}
      throw new Error('Unexpected SQL: '+sql);
    }
  };return {p,rows,connection,get receipts(){return receipts;},get committed(){return committed;},get writes(){return writes;}};
}
test('full reviewed package identities, originals, four options, keys and steps validate',()=>{
 assert.equal(plan.counts.findings,1803);assert.equal(plan.counts.conflicts,0);assert.equal(plan.counts.reject,34);assert.equal(plan.counts.unitCandidates,144);assert.equal(plan.actions.length,1805);assert.deepEqual(plan.unresolvedSourceMarkers,[186086]);
 for(const a of plan.actions){assert.equal(a.before.id,a.after.id);assert.equal(a.before.bankKey,a.after.bankKey);assert.equal(a.before.questionNum,a.after.questionNum);}
});
test('explicit source IDs held even when not flagged; no blanket web-search chunk holds',()=>{
 for(const id of [183632,183670,180317,42178,46075])assert.equal(plan.actions.find(a=>a.id===id).kind,'hold');
 const row={id:1,fix:{question:'What is 2 + 2?',explanation:'Add two and two to get four.',steps:null,options:['1','2','3','4'],correctIndex:3}};
 assert.deepEqual(holdReasons(row,{isCalc:'no'}),[]);
 assert.ok(holdReasons({...row,fix:{...row.fix,explanation:'Ontario requires 48 hours under Schedule 10.'}},{isCalc:'no'}).length);
});
test('invalid answer key and malformed steps rejected',()=>{
 const f={question:'Q',explanation:'E',options:['A','B','C','D'],correctIndex:4,steps:null};assert.throws(()=>validateFix(f),/key/);assert.throws(()=>validateFix({...f,correctIndex:0,steps:[{l:'',c:'bad'}]}),/steps/);
});
test('current-export drift is recorded rather than overwritten',()=>{
 const changed=structuredClone(current);changed.find(r=>r.id===plan.actions[0].id).question='Concurrent edit';const p=makePlan(inputs,changed);assert.equal(p.conflicts.length,1);assert.ok(!p.actions.some(a=>a.id===plan.actions[0].id));
});
test('apply snapshots before updates, verifies afterimages and idempotently skips',async()=>{
 const f=fixture();const result=await applyPlan(f.connection,f.p);assert.equal(result.changed,2);assert.equal(f.receipts.length,2);assert.ok(f.committed);const again=await applyPlan(f.connection,f.p);assert.equal(again.mode,'already-applied');assert.equal(f.writes,4);
});
test('all-or-nothing on drift before any write',async()=>{
 const f=fixture();f.rows[1].tip='concurrent';await assert.rejects(applyPlan(f.connection,f.p),/drift/);assert.equal(f.writes,0);assert.equal(f.committed,false);
});
test('rollback restores exact preimages, leaving immutable receipts',async()=>{
 const f=fixture();await applyPlan(f.connection,f.p);await applyPlan(f.connection,f.p,{rollback:true});assert.equal(checkState(f.p,f.rows).pending.length,2);assert.equal(f.receipts.length,2);
});
test('write failure rolls back snapshots and earlier updates',async()=>{
 const f=fixture(), execute=f.connection.execute;let n=0;f.connection.execute=async(sql,args)=>{if(sql.startsWith('UPDATE')&&++n===2)throw new Error('mock failure');return execute(sql,args);};await assert.rejects(applyPlan(f.connection,f.p),/mock failure/);assert.equal(f.receipts.length,0);assert.equal(checkState(f.p,f.rows).pending.length,2);
});
test('plan tampering, immutable changes and mixed application fail closed',async()=>{
 const f=fixture();f.p.actions[0].after.bankKey='other';await assert.rejects(applyPlan(f.connection,f.p),/Immutable/);
 const g=fixture();g.rows[0]=structuredClone(g.p.actions[0].after);await assert.rejects(applyPlan(g.connection,g.p),/Partial/);
 const h=fixture();h.p.actions[0].afterSha256='0'.repeat(64);await assert.rejects(applyPlan(h.connection,h.p),/hash/);
});
