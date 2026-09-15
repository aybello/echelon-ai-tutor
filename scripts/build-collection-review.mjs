import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildReview,parseCorrections,REVIEW_FILES,validateCompletedRepair } from './lib/collectionReview.mjs';
if(process.argv.length!==4) throw new Error('Usage: node scripts/build-collection-review.mjs /private/export.json /private/output-directory');
const root=resolve(process.argv[3]);
const source=JSON.parse(await readFile(resolve(process.argv[2]),'utf8'));
const texts=await Promise.all(REVIEW_FILES.map(name=>readFile(new URL('../content/wpi-class4-collection/review/'+name,import.meta.url),'utf8')));
const review=buildReview(source,parseCorrections(texts));
validateCompletedRepair(review);
await mkdir(root,{recursive:true,mode:0o700});
await writeFile(resolve(root,'collection-historical-repair.json'),JSON.stringify(review,null,2)+'\n',{flag:'wx',mode:0o600});
await writeFile(resolve(root,'repaired-questions.json'),JSON.stringify(review.patches.map(p=>p.after),null,2)+'\n',{flag:'wx',mode:0o600});
await writeFile(resolve(root,'rollback-content.json'),JSON.stringify({format:'echelon-collection-content-rollback-v1',bankKey:review.bankKey,repairSha256:review.contentSha256,warning:'Compare each current row with expectedCurrentSha256 before restoring content. Never overwrite intervening changes or regrade historical attempts. No executable SQL is included.',questions:review.patches.map(p=>({id:p.id,questionNum:p.questionNum,expectedCurrentSha256:p.afterSha256,restore:p.before})),metadata:review.metadataPatches.map(p=>({expectedCurrentSha256:p.afterSha256,restore:p.before}))},null,2)+'\n',{flag:'wx',mode:0o600});
const lines=['# WPI Class IV Collection — authored repair preview','','All 503 historical questions repaired. This is the complete content repair package, not evidence of a production import.','',`Historical rows: 503. Authored replacements: ${review.patches.length}. Remaining editorial dispositions: ${review.counts.editorial_review_remaining||0}. New additions authored: 0.`,'','The original database IDs, question numbers and answer positions are retained. A rewritten question changes what a historical answer means; prior attempts must not be reinterpreted as answers to the revised wording. No customer data or live database writes are used.',''];
for(const p of review.patches){const q=p.after;lines.push(`## Question ${q.questionNum} · database ID ${q.id}`,'',q.question,'',...JSON.parse(q.options).map((a,i)=>`${String.fromCharCode(65+i)}. ${a}`),'',`**Answer: ${String.fromCharCode(65+q.correctIndex)}.** ${q.explanation}`,'',`Area: ${q.module}. Cognitive level: ${q.cognitiveLevel}. Calculation: ${q.isCalc}.`,'',q.sourceUrl?`Background: [${q.sourceTitle}](${q.sourceUrl}). ${q.sourceReference}`:q.sourceReference,'');}
await writeFile(resolve(root,'collection-repair-preview.md'),lines.join('\n'),{flag:'wx',mode:0o600});
console.log(JSON.stringify({output:root,counts:review.counts,coverage:review.coverage,releaseReady:false,hash:review.contentSha256,screeningCandidates:review.proposedScreening.filter(x=>x.findings.length)}));
