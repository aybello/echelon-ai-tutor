#!/usr/bin/env node
/** Validates repair artifacts against independently rejected candidate IDs. No DB access. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root=process.cwd(), outputRoot=path.join(root,'artifacts/us-review-only-candidates');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json'),'utf8'));
const errors=[],batches=[];
const payload=(q)=>({question:q.question,options:q.options,correctIndex:q.correctIndex,explanation:q.explanation,steps:q.steps,tip:q.tip,source:{title:q.source.title,url:q.source.url,reference:q.source.reference}});
for(const route of manifest.selected){
 const draft=JSON.parse(fs.readFileSync(path.join(outputRoot,route.id,'01-draft.json'),'utf8'));
 if(!Array.isArray(draft.questions)||!draft.questions.length) continue;
 const review=JSON.parse(fs.readFileSync(path.join(outputRoot,route.id,'01-independent-review.json'),'utf8'));
 const rejected=review.reviews.filter(r=>r.decision==='rejected');
 if(!rejected.length) continue;
 const repairPath=path.join(outputRoot,route.id,'01-repairs.json'); let repair;
 try{repair=JSON.parse(fs.readFileSync(repairPath,'utf8'));}catch(e){errors.push(`${route.id}: missing repair JSON (${e.message})`);continue;}
 const expected=new Set(rejected.map(r=>r.candidateId)); const seen=new Set(); let held=0;
 if(repair.routeId!==route.id)errors.push(`${route.id}: route mismatch`);
 if(!Array.isArray(repair.repairs)||repair.repairs.length!==expected.size)errors.push(`${route.id}: repair count mismatch`);
 for(const entry of repair.repairs||[]){
  if(!expected.has(entry.candidateId))errors.push(`${route.id}: unexpected repair ${entry.candidateId}`);
  if(seen.has(entry.candidateId))errors.push(`${route.id}: duplicate repair ${entry.candidateId}`);seen.add(entry.candidateId);
  if(!['replacement','held'].includes(entry.action))errors.push(`${route.id}:${entry.candidateId}: invalid repair action`);
  if(entry.action==='held'){held++;if(entry.replacement!==null)errors.push(`${route.id}:${entry.candidateId}: held item must have null replacement`);continue;}
  const q=entry.replacement;
  if(!q||q.candidateId!==entry.candidateId)errors.push(`${route.id}:${entry.candidateId}: replacement identity mismatch`);
  if(!Array.isArray(q?.options)||q.options.length!==4||new Set(q.options.map(x=>String(x).trim().toLowerCase())).size!==4)errors.push(`${route.id}:${entry.candidateId}: options invalid`);
  if(!Number.isInteger(q?.correctIndex)||q.correctIndex<0||q.correctIndex>3)errors.push(`${route.id}:${entry.candidateId}: key invalid`);
  if(q?.reviewStatus!=='in_review'||q?.review?.status!=='pending_rereview'||q?.author?.role!=='repair_author')errors.push(`${route.id}:${entry.candidateId}: review provenance invalid`);
  const hash=crypto.createHash('sha256').update(JSON.stringify(payload(q))).digest('hex'); if(q?.contentHash!==hash)errors.push(`${route.id}:${entry.candidateId}: content hash mismatch`);
 }
 for(const id of expected)if(!seen.has(id))errors.push(`${route.id}: missing repair ${id}`);
 batches.push({routeId:route.id,rejectedCount:expected.size,replacementCount:expected.size-held,heldCount:held,repairPath});
}
const report={schemaVersion:'1.0',batchCount:batches.length,rejectedCount:batches.reduce((n,b)=>n+b.rejectedCount,0),replacementCount:batches.reduce((n,b)=>n+b.replacementCount,0),heldCount:batches.reduce((n,b)=>n+b.heldCount,0),errorCount:errors.length,batches,errors};
const reportPath=path.join(outputRoot,'repair-validation-01.json');fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({reportPath,...report},null,2));if(errors.length)process.exitCode=1;
