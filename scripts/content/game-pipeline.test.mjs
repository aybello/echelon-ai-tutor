import test from 'node:test';
import assert from 'node:assert/strict';
import { stage,hash,reviewHash,exerciseIdentity,blockers,coverage } from './game-pipeline.mjs';
const item={id:'fixture-1',mode:'rapid-swipe',prompt:'Synthetic test fixture',correctAnswer:true,explanation:'Test only'};
const staged=()=>stage([{courseKey:'oit',version:'test',status:'approved',examples:[item]}],{oit:{items:[{id:item.id,sources:['https://example.com/source']}]}})[0];
const reviewed=()=>{const r=staged();const result={...r,difficulty:'easy',difficultyRationale:'Recall',blueprintObjective:'fixture objective',conceptId:'fixture',jurisdiction:'fixture',claimType:'concept',sources:[{title:'Fixture',url:'https://example.com/source',locator:'page 1',checkedAt:'2026-11-12'}],review:{status:'approved',type:'human-technical',reviewer:'Test fixture only',reviewedAt:'2026-11-12',contentHash:r.contentHash,evidence:'Synthetic test evidence'}};result.review.subjectHash=reviewHash(result);return result;};
test('release software approval never becomes technical approval',()=>{const r=staged();assert.equal(r.review.status,'unreviewed');assert.equal(r.sources[0].url,'https://example.com/source');assert.ok(blockers(r).includes('difficulty-unmapped'));assert.equal(coverage([r])[0].remaining,500);});
test('complete declarative review is bound to exact item',()=>{const r=reviewed();assert.deepEqual(blockers(r),[]);r.item={...r.item,prompt:'Changed'};assert.ok(blockers(r).includes('content-hash-mismatch'));r.contentHash=hash(r.item);assert.ok(blockers(r).includes('technical-review-missing-or-stale'));});
test('AI review does not impersonate technical review',()=>{const r=reviewed();r.review.type='ai';assert.ok(blockers(r).includes('technical-review-missing-or-stale'));});
test('source locators and dates are mandatory',()=>{const r=reviewed();r.sources[0].checkedAt='2026-99-99';assert.ok(blockers(r).includes('source-evidence-incomplete'));r.sources[0].checkedAt='2026-02-30';assert.ok(blockers(r).includes('source-evidence-incomplete'));});
test('regulatory claims need authority and section',()=>{const r=reviewed();r.claimType='regulatory';assert.ok(blockers(r).includes('regulatory-authority-missing'));r.sources[0].authoritative=true;r.sources[0].section='fixture section';r.review.subjectHash=reviewHash(r);assert.deepEqual(blockers(r),[]);});
test('500 total not 500 per difficulty; repeated IDs rejected and duplicate bodies discounted',()=>{const a=reviewed(),b=reviewed();assert.throws(()=>coverage([a,b]));b.item={...b.item,id:'fixture-2'};b.contentHash=hash(b.item);b.review.contentHash=b.contentHash;b.review.subjectHash=reviewHash(b);const rows=coverage([a,b]);assert.equal(rows.length,6);assert.equal(rows[0].inventory,2);assert.equal(rows[0].reviewMetadataComplete,1);assert.equal(rows[0].difficulty.easy,1);assert.equal(rows[0].remaining,499);});
test('canonical hashes independent of object key order',()=>assert.equal(hash({b:2,a:1}),hash({a:1,b:2})));

test('changing difficulty or sources invalidates recorded review',()=>{const r=reviewed();r.difficulty='hard';assert.ok(blockers(r).includes('technical-review-missing-or-stale'));});

test('matching ID and order changes do not create exercises',()=>{
  const a={id:'a',mode:'speed-match',prompt:'Match',pairs:[{id:'1',left:'A',right:'X'},{id:'2',left:'B',right:'Y'}]};
  const b={...a,id:'b',pairs:[{id:'new2',left:'B',right:'Y'},{id:'new1',left:'A',right:'X'}]};
  assert.equal(exerciseIdentity(a),exerciseIdentity(b));
});
test('option IDs, order and explanation changes do not create exercises',()=>{
  const a={id:'a',mode:'odd-one-out',prompt:'Pick',options:[{id:'1',label:'A'},{id:'2',label:'B'}],correctOptionId:'2',explanation:'first'};
  const b={...a,id:'b',options:[{id:'new2',label:'B'},{id:'new1',label:'A'}],correctOptionId:'new2',explanation:'second'};
  assert.equal(exerciseIdentity(a),exerciseIdentity(b));
  assert.notEqual(exerciseIdentity(a),exerciseIdentity({...b,correctOptionId:'new1'}));
});
