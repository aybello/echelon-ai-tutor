#!/usr/bin/env node
/** Offline authoring inventory. No credentials, network, database, release activation or AI approval. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const MODES = ['rapid-swipe','speed-match','odd-one-out','cause-effect','tap-the-flaw','before-after'];
export const LEVELS = ['easy','medium','hard'];
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k,canonical(v[k])])) : v;
export const hash = v => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const text = v => typeof v === 'string' && v.trim().length > 0;
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
export const reviewHash = r => hash(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'review')));
const key = x => `${x.courseKey}/${x.item.id}`;
export function stage(packages, provenance = {}) {
  const seen = new Set();
  return packages.flatMap(pkg => pkg.examples.map(item => {
    if (!MODES.includes(item.mode) || seen.has(key({courseKey:pkg.courseKey,item}))) throw Error('Invalid mode or duplicate course/item');
    seen.add(key({courseKey:pkg.courseKey,item}));
    const sources = (provenance[pkg.courseKey]?.items ?? []).find(x => x.id === item.id)?.sources ?? [];
    return {courseKey:pkg.courseKey, item, contentHash:hash(item), sourcePackageVersion:pkg.version,
      difficulty:null, difficultyRationale:'', blueprintObjective:'', conceptId:'', jurisdiction:'',
      sources:sources.map(url => ({url,title:'',edition:'',locator:'',checkedAt:null})),
      claimType:'unclassified', review:{status:'unreviewed',type:null,reviewer:'',reviewedAt:null,contentHash:null,subjectHash:null,evidence:''}};
  }));
}
/** Checks completeness and hash binding only. Never verifies a reviewer's identity or subject accuracy. */
export function blockers(record) {
  const errors=[]; const r=record.review ?? {};
  if (record.contentHash !== hash(record.item)) errors.push('content-hash-mismatch');
  if (!LEVELS.includes(record.difficulty) || !text(record.difficultyRationale)) errors.push('difficulty-unmapped');
  for(const field of ['blueprintObjective','conceptId','jurisdiction']) if(!text(record[field])) errors.push(`${field}-missing`);
  if (!['concept','field-practice','regulatory'].includes(record.claimType)) errors.push('claim-unclassified');
  if (!Array.isArray(record.sources) || !record.sources.length || record.sources.some(s => !text(s.title) || !text(s.locator) || !date(s.checkedAt) || (!text(s.url) && !text(s.documentId)))) errors.push('source-evidence-incomplete');
  if(r.status !== 'approved' || r.type !== 'human-technical' || !text(r.reviewer) || !date(r.reviewedAt) || !text(r.evidence) || r.contentHash !== record.contentHash || r.subjectHash !== reviewHash(record)) errors.push('technical-review-missing-or-stale');
  if(record.claimType === 'regulatory' && !record.sources?.some(s => s.authoritative === true && text(s.section) && text(s.url))) errors.push('regulatory-authority-missing');
  return errors;
}
// Presentation order, storage IDs and explanation wording do not create a new exercise.
export function exerciseIdentity(item) {
  const normalize = v => typeof v === 'string' ? v.normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase() : v;
  const body = {mode:item.mode,prompt:normalize(item.prompt),instruction:normalize(item.instruction ?? '')};
  if(item.mode === 'speed-match') body.pairs = item.pairs.map(p => [normalize(p.left),normalize(p.right)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  else if(item.options && typeof item.options[0] === 'object') {
    body.options=item.options.map(p=>normalize(p.label)).sort();
    body.answer=normalize(item.options.find(p=>p.id===item.correctOptionId)?.label);
  } else {
    if(item.options) body.options=item.options.map(normalize).sort();
    body.answer=normalize(item.correctAnswer);
  }
  return hash(body);
}
export function coverage(records,target=500) {
  if(!Number.isSafeInteger(target)||target<1) throw Error('Target must be a positive integer');
  const seen=new Set();
  for(const r of records) {if(!text(r.courseKey)||!r.item||!text(r.item.id)||!MODES.includes(r.item.mode)||seen.has(key(r))) throw Error('Invalid/duplicate record'); seen.add(key(r));}
  return [...new Set(records.map(r=>r.courseKey))].sort().flatMap(courseKey=>MODES.map(mode=>{
    const rows=records.filter(r=>r.courseKey===courseKey&&r.item.mode===mode);
    const eligible=rows.filter(r=>blockers(r).length===0);
    // Duplicate exercise text is not more coverage just because it has another ID.
    const unique=new Map(); for(const r of eligible){unique.set(exerciseIdentity(r.item),r);}
    const uniqueRows=[...unique.values()];
    return {courseKey,mode,target,inventory:rows.length,reviewMetadataComplete:uniqueRows.length,
      remaining:Math.max(0,target-uniqueRows.length),difficulty:Object.fromEntries(LEVELS.map(d=>[d,uniqueRows.filter(r=>r.difficulty===d).length])),
      unmappedDifficulty:rows.filter(r=>!LEVELS.includes(r.difficulty)).length};
  }));
}
function main(args) {
  const [command,input,output]=args;
  if(args.length!==3 || !['stage','report'].includes(command)) throw Error('Usage: game-pipeline.mjs stage RELEASE_DIR OUTPUT.json | report STAGING.json OUTPUT.json');
  let result;
  if(command==='stage') {
    const names=fs.readdirSync(path.join(input,'packages')).filter(n=>n.endsWith('.json')).sort();
    const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
    const packages=names.map(n=>read(path.join(input,'packages',n)));
    const provenance=Object.fromEntries(names.map(n=>[n.slice(0,-5),read(path.join(input,'provenance',n))]));
    result={format:'echelon-game-authoring-v1',notice:'Staged, not reviewed or activated. Review metadata is declarative and requires independent verification.',records:stage(packages,provenance)};
  } else {const inputData=JSON.parse(fs.readFileSync(input,'utf8'));if(inputData.format!=='echelon-game-authoring-v1')throw Error('Unknown staging format'); result={notice:'Metadata completeness is not verified accuracy, reviewer identity, runtime compatibility or release approval.',rows:coverage(inputData.records)};}
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
