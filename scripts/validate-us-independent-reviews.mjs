#!/usr/bin/env node
/** Validates independent review record coverage. No database or content writes. */
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json"), "utf8"));
const outputRoot = path.join(root, "artifacts/us-review-only-candidates");
const errors=[]; const batches=[];
for (const route of manifest.selected) {
  const draft=JSON.parse(fs.readFileSync(path.join(outputRoot, route.id, "01-draft.json"), "utf8"));
  if (!Array.isArray(draft.questions) || draft.questions.length===0) continue;
  const reviewPath=path.join(outputRoot, route.id, "01-independent-review.json");
  let review;
  try { review=JSON.parse(fs.readFileSync(reviewPath,"utf8")); } catch (error) { errors.push(`${route.id}: invalid review JSON (${error.message})`); continue; }
  const expected=new Set(draft.questions.map(q=>q.candidateId));
  const seen=new Set();
  if (review.routeId!==route.id) errors.push(`${route.id}: routeId mismatch`);
  if (!Array.isArray(review.reviews)||review.reviews.length!==draft.questions.length) errors.push(`${route.id}: review count mismatch`);
  let approved=0,rejected=0;
  for (const item of review.reviews||[]) {
    if (!expected.has(item.candidateId)) errors.push(`${route.id}: unknown candidate ${item.candidateId}`);
    if (seen.has(item.candidateId)) errors.push(`${route.id}: duplicate review ${item.candidateId}`);
    seen.add(item.candidateId);
    if (!['approved','rejected'].includes(item.decision)) errors.push(`${route.id}:${item.candidateId}: invalid decision`);
    if (!Array.isArray(item.defectCodes)) errors.push(`${route.id}:${item.candidateId}: defectCodes must be array`);
    if (item.decision==='approved') { approved++; if (item.defectCodes.length) errors.push(`${route.id}:${item.candidateId}: approved item has defects`); }
    if (item.decision==='rejected') { rejected++; if (!item.defectCodes.length || !item.requiredRepair) errors.push(`${route.id}:${item.candidateId}: rejection lacks repair reason`); }
  }
  for (const id of expected) if (!seen.has(id)) errors.push(`${route.id}: missing review for ${id}`);
  if (review.reviewedCount!==draft.questions.length || review.approvedCount!==approved || review.rejectedCount!==rejected) errors.push(`${route.id}: reported counts mismatch`);
  batches.push({routeId:route.id,reviewed:review.reviewedCount,approved,rejected,reviewPath});
}
const report={schemaVersion:'1.0',batchCount:batches.length,approvedCount:batches.reduce((n,b)=>n+b.approved,0),rejectedCount:batches.reduce((n,b)=>n+b.rejected,0),errorCount:errors.length,batches,errors};
const reportPath=path.join(outputRoot,'independent-review-validation-01.json'); fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({reportPath,...report},null,2)); if(errors.length)process.exitCode=1;
