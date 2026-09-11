import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const path='content/wpi-class4-wastewater/audit/';
const baseline=JSON.parse(read(path+'baseline.json'));
const repairs=JSON.parse(read(path+'repair-candidates.json'));
const math=read(path+'math-review.txt').trim().split('\n').map(l=>l.split('|'));
test('export count, identities and canonical hash match original evidence',()=>{
 assert.equal(baseline.questions.length,657);
 assert.equal(new Set(baseline.questions.map(q=>q.id)).size,657);
 assert.equal(new Set(baseline.questions.map(q=>q.questionNum)).size,657);
 assert.equal(createHash('sha256').update(JSON.stringify(baseline.questions)).digest('hex'),baseline.questionRowsSha256);
});
test('candidate updates retain every original record and canonical answer position',()=>{
 for(const p of repairs.patches){
  assert.deepEqual(p.before,baseline.questions.find(q=>q.id===p.id));
  for(const k of ['id','questionNum','bankKey','correctIndex','reviewStatus'])assert.deepEqual(p.after[k],p.before[k]);
  assert.equal(p.after.bankKey,'wpi-class4-wastewater');
  const options=JSON.parse(p.after.options); assert.equal(options.length,4);assert.equal(new Set(options).size,4);
  assert.ok(p.changedFields.length);assert.ok(p.historyWarning);
 }
});
test('independent JavaScript arithmetic checks every declared numerical answer and keyed option',()=>{
 for(const [number,expression,expected,unit,places] of math){
  assert.match(expression,/^[0-9+*/(). -]+$/);
  const value=Function('return ('+expression+')')();
  const expectedValue=Number(expected);const precision=10**(-Number(places));
  assert.ok(Number.isFinite(value));assert.ok(Math.abs(value-expectedValue)<=precision/2+1e-8,number+': '+value);
  const q=repairs.patches.find(p=>p.questionNum===Number(number)).after;
  assert.equal(JSON.parse(q.options)[q.correctIndex],expectedValue.toFixed(Number(places))+' '+unit);
 }
});
test('known incorrect examples cannot recur in repaired candidates',()=>{
 const q=n=>repairs.patches.find(p=>p.questionNum===n).after;
 assert.match(q(587).explanation,/requires a solids balance/);
 assert.match(q(590).question,/50 mg\/meq/);
 assert.equal(JSON.parse(q(617).options)[q(617).correctIndex],'470.90 kg pure FeCl3/day');
 assert.match(q(649).question,/wire-to-water/);
 assert.match(q(604).question,/8,000 hours/);
 assert.match(q(120).explanation,/Fisheries Act/);
});
test('all unaudited items remain visibly pending and no full-bank completion is asserted',()=>{
 const ledger=JSON.parse(read(path+'review-ledger.json'));
 assert.equal(ledger.length,657);
 assert.ok(ledger.every(q=>q.status.includes('pending')));
 assert.equal(repairs.status,'partial-priority-repair-not-full-bank-release');
});
