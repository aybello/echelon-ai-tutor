#!/usr/bin/env node
/**
 * Assemble reviewed U.S. candidate content into one portable, review-only JSON package.
 * This script has no database dependency and never imports, approves, activates, or releases content.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outRoot = path.join(root, "artifacts/us-review-only-candidates");
const tranche = JSON.parse(fs.readFileSync(path.join(root, "docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json"), "utf8"));
const payload = (q) => ({ question:q.question, options:q.options, correctIndex:q.correctIndex, explanation:q.explanation, steps:q.steps, tip:q.tip, source:{title:q.source.title,url:q.source.url,reference:q.source.reference} });
const sha = (value) => crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const fileHash = (file) => sha(fs.readFileSync(file));
const errors=[]; const banks=[]; const questions=[]; const holds=[];

for (const route of tranche.selected) {
  const base = path.join(outRoot, route.id);
  const draftPath = path.join(base, "01-draft.json");
  const draft = readJson(draftPath);
  if (!Array.isArray(draft.questions) || draft.questions.length === 0) {
    holds.push({routeId:route.id, draftPath:path.relative(root,draftPath), status:draft.status, packageNotes:draft.packageNotes});
    continue;
  }
  const reviewPath=path.join(base,"01-independent-review.json");
  const firstReview=readJson(reviewPath);
  const firstById=new Map(firstReview.reviews.map((r)=>[r.candidateId,r]));
  const rejected=firstReview.reviews.filter((r)=>r.decision==='rejected');
  const repairsPath=path.join(base,"01-repairs.json");
  const repairById=new Map(); let repairReviewById=new Map(); const repairReviewPathById=new Map(); let repairReviewPath=null;
  if (rejected.length) {
    const repairs=readJson(repairsPath);
    for (const repair of repairs.repairs) if (repair.action==='replacement') repairById.set(repair.candidateId,repair.replacement);
    const rereviewPath=path.join(base,"01-repair-rereview.json");
    const rereview=readJson(rereviewPath);
    repairReviewPath=rereviewPath;
    repairReviewById=new Map(rereview.reviews.map((r)=>[r.candidateId,r]));
    for (const record of rereview.reviews) repairReviewPathById.set(record.candidateId, rereviewPath);
  }
  // A later isolated repair can supersede an earlier rejected or duplicate-prone
  // candidate only when its own fresh independent review is explicitly approved.
  const overrideSets = [
    ["02-repair.json", "02-repair-rereview.json"],
    ["02-duplicate-repairs.json", "02-duplicate-rereview.json"],
  ];
  for (const [repairFile, rereviewFile] of overrideSets) {
    const specialRepairPath=path.join(base, repairFile);
    const specialRereviewPath=path.join(base, rereviewFile);
    if (!fs.existsSync(specialRepairPath) || !fs.existsSync(specialRereviewPath)) continue;
    const special=readJson(specialRepairPath);
    for (const repair of special.repairs || [special]) {
      if (repair.action==='replacement') repairById.set(repair.candidateId,repair.replacement);
    }
    const rereview=readJson(specialRereviewPath);
    const records=Array.isArray(rereview.reviews) ? rereview.reviews : [rereview];
    for (const record of records) {
      repairReviewById.set(record.candidateId,record);
      repairReviewPathById.set(record.candidateId, specialRereviewPath);
    }
    repairReviewPath=specialRereviewPath;
  }
  const finalItems=[];
  for (const original of draft.questions) {
    const first=firstById.get(original.candidateId);
    if (!first) { errors.push(`${route.id}:${original.candidateId}: absent first review`); continue; }
    let item=original; let review=first; let reviewRecordPath=reviewPath; let repairOf=null;
    const hasApprovedReplacement = repairById.has(original.candidateId) && repairReviewById.get(original.candidateId)?.decision === "approved";
    if (first.decision==='rejected' || hasApprovedReplacement) {
      item=repairById.get(original.candidateId);
      review=repairReviewById.get(original.candidateId);
      reviewRecordPath=repairReviewPathById.get(original.candidateId) || repairReviewPath;
      repairOf={
        initialReviewPath:path.relative(root,reviewPath),
        initialDefectCodes:first.defectCodes,
        ...(first.decision === "approved" ? {supersededForDuplicateRisk:true} : {}),
      };
      if (!item) { errors.push(`${route.id}:${original.candidateId}: missing replacement`); continue; }
      if (!review || review.decision!=='approved') { errors.push(`${route.id}:${original.candidateId}: repair not independently approved`); continue; }
    }
    const expectedHash=sha(payload(item));
    if (item.contentHash!==expectedHash) errors.push(`${route.id}:${item.candidateId}: content hash mismatch in final assembly`);
    if (!Array.isArray(item.options)||item.options.length!==4||new Set(item.options.map(x=>String(x).trim().toLowerCase())).size!==4) errors.push(`${route.id}:${item.candidateId}: invalid options`);
    if (!Number.isInteger(item.correctIndex)||item.correctIndex<0||item.correctIndex>3) errors.push(`${route.id}:${item.candidateId}: invalid correct index`);
    if (item.reviewStatus!=="in_review") errors.push(`${route.id}:${item.candidateId}: non-review status`);
    const finalItem={...item, review:{provider:"manus_native",role:"independent_technical_reviewer",decision:"approved",reviewRecordPath:path.relative(root,reviewRecordPath),defectCodes:review.defectCodes||[],notes:review.notes||"",reviewedAtUtc:"2026-10-30T01:29:00Z"}, ...(repairOf?{repairOf}: {})};
    finalItems.push(finalItem); questions.push(finalItem);
  }
  if (finalItems.length!==25) errors.push(`${route.id}: final item count ${finalItems.length}, expected 25`);
  banks.push({routeId:route.id, proposedBankKey:draft.proposedBankKey, credentialBoundary:draft.credentialBoundary, sourceDossierPath:path.relative(root,route.reportPath), draftPath:path.relative(root,draftPath), firstReviewPath:path.relative(root,reviewPath), questionCount:finalItems.length, questions:finalItems});
}
const normalizedStems=new Map();
for (const item of questions) {
  const stem=item.question.trim().toLowerCase().replace(/\s+/g," ");
  if (normalizedStems.has(stem)) errors.push(`exact duplicate stem: ${item.candidateId} / ${normalizedStems.get(stem)}`);
  normalizedStems.set(stem,item.candidateId);
}
const similarityPairs=[];
const tokenize=(text)=>new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter((x)=>x.length>3));
for (let i=0;i<questions.length;i++) for(let j=i+1;j<questions.length;j++) {
  const a=tokenize(questions[i].question),b=tokenize(questions[j].question); const intersection=[...a].filter(x=>b.has(x)).length; const union=new Set([...a,...b]).size; const score=union?intersection/union:0;
  if(score>=0.78) similarityPairs.push({candidateA:questions[i].candidateId,candidateB:questions[j].candidateId,jaccard:Number(score.toFixed(4))});
}
const packageData={
  schemaVersion:"1.0",
  packageType:"review_only_us_operator_candidates",
  status:"in_review",
  generatedAtUtc:"2026-10-30T01:29:00Z",
  noReleaseAuthorization:true,
  scope:{candidateTarget:tranche.selected.length*tranche.perBankCandidateCount,draftedCandidateCount:questions.length,heldRouteCount:holds.length},
  evidence:{decisionIndexPath:"docs/us-launch/US_STATE_DOSSIER_DECISION_INDEX_2026-10-29.json",tranchePath:"docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json",contractPath:"docs/us-launch/US_FIRST_REVIEW_ONLY_AUTHORING_CONTRACT_2026-10-29.md"},
  reviewSummary:{independentApprovedCandidateCount:questions.length,reviewerType:"manus_native_independent",humanOrSmeApproval:false},
  banks, heldRoutes:holds,
  questions,
};
const packagePath=path.join(outRoot,"Echelon_US_review_only_candidates_2026-10-29.json");
fs.writeFileSync(packagePath,JSON.stringify(packageData,null,2)+"\n");
const validation={schemaVersion:"1.0",packagePath,errorCount:errors.length,errors,bankCount:banks.length,candidateCount:questions.length,heldRouteCount:holds.length,exactDuplicateCount:errors.filter(e=>e.startsWith("exact duplicate")).length,highSimilarityPairs:similarityPairs};
const validationPath=path.join(outRoot,"final-package-validation-01.json"); fs.writeFileSync(validationPath,JSON.stringify(validation,null,2)+"\n");
const checksum=crypto.createHash("sha256").update(fs.readFileSync(packagePath)).digest("hex"); const checksumPath=`${packagePath}.sha256`; fs.writeFileSync(checksumPath,`${checksum}  ${path.basename(packagePath)}\n`);
console.log(JSON.stringify({packagePath,validationPath,checksumPath,bankCount:banks.length,candidateCount:questions.length,heldRouteCount:holds.length,errorCount:errors.length,highSimilarityPairCount:similarityPairs.length},null,2));
if(errors.length) process.exitCode=1;
