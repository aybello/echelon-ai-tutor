import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getAllCourses } from '../shared/courseRegistry.ts';
import { interactiveModes, interactivePackageSchema } from '../server/interactiveContent/schema.ts';
import { legalScreen, missingAuthorityEvidenceIds } from './echelonsix-legal-screen.mjs';
const root = 'server/interactiveContent/release-2026-11-12';
const json = p => JSON.parse(fs.readFileSync(path.join(root,p)));
const sort = xs => [...xs].sort();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const missingEvidenceIds = [
  'wpi-class1-water-dist-078', 'wpi-class2-water-dist-055',
  'wpi-class4-water-dist-055', 'wpi-class3-water-072',
  'wpi-class3-water-dist-057', 'wpi-class1-water-coll-065',
  'us-class1-water-072',
];
const missingEvidenceReason = 'excluded-missing-authority-evidence';

test('authority, numbered rules and source-linked duties are screened without treating must alone as law', () => {
  assert.ok(legalScreen({prompt:'Ontario Regulation 170/03 applies different schedules', sources:[]}).length);
  assert.ok(legalScreen({prompt:'A competent person must inspect the trench', sources:['https://www.osha.gov/laws-regs/example']}).length);
  assert.deepEqual(legalScreen({prompt:'Flocculation mixing must be gentle enough to preserve floc', sources:['https://www.epa.gov/example']}), []);
  assert.deepEqual(legalScreen({prompt:'A failed hatch can admit contaminants', sources:['https://www.osha.gov/example']}), []);
});

test('missing authority evidence exclusion applies to exactly seven explicit IDs, not neighbouring IDs or all OSHA sources', () => {
  assert.deepEqual(sort(missingAuthorityEvidenceIds),sort(missingEvidenceIds));
  assert.equal(new Set(missingAuthorityEvidenceIds).size,7);
  for (const id of missingEvidenceIds) {
    assert.deepEqual(legalScreen({id,prompt:'Neutral placeholder',sources:[]}),[missingEvidenceReason]);
    assert.deepEqual(legalScreen({id:`${id}-other`,prompt:'Neutral placeholder',sources:['https://www.osha.gov/example']}),[]);
  }
});

test('all candidate items are screened or retained with exact release counts, provenance and all course/mode coverage', () => {
  const metadata=json('release-metadata.json');
  const exclusions=json('evidence/additional-exclusions.json');
  const manifest=json('evidence/additional-screen-manifest.json');
  const excluded=new Map(exclusions.map(x=>[x.original.id,x]));
  assert.equal(exclusions.length,163); assert.equal(excluded.size,163);
  assert.equal(json('evidence/excluded-items.json').length,73);
  assert.deepEqual(sort(exclusions.filter(x=>x.reasons.includes(missingEvidenceReason)).map(x=>x.original.id)),sort(missingEvidenceIds));
  const flags=['wpi-class2-water-dist-063','wpi-class1-water-coll-044','wpi-class4-water-dist-015','wpi-class2-water-dist-015','wpi-class4-water-dist-order-015','wqa-087','class1-water-dist-074',...missingEvidenceIds];
  for(const id of flags) assert.ok(excluded.has(id), id);
  for(const id of missingEvidenceIds) {
    const item=excluded.get(id);
    assert.deepEqual(item.reasons,[missingEvidenceReason]);
    assert.equal(item.courseKey,id.slice(0,id.lastIndexOf('-')));
    assert.ok(item.original.sources.some(url=>url.includes('osha.gov')),id);
  }
  const target=excluded.get('class1-water-dist-074');
  assert.equal(target.courseKey,'class1-water-dist');
  assert.deepEqual(target.reasons,['unverified-mandatory-backflow-standard-claim']);
  assert.match(target.original.explanation,/applicable standard/);
  assert.match(target.original.answer,/required backflow/);
  const courses=sort(getAllCourses().filter(c=>c.isActive && c.track!=='construction-electrician').map(c=>c.courseKey));
  assert.equal(courses.length,38);
  assert.deepEqual(sort(metadata.courses.map(x=>x.courseKey)),courses);
  assert.deepEqual(sort(manifest.map(x=>x.courseKey)),courses);
  assert.equal(sha256(fs.readFileSync(path.join(root,'evidence/candidate-metadata.json'))),metadata.candidateMetadataSha256);
  assert.equal(metadata.candidateMetadataSha256,'934304ad19093615fcfa2202e81ad6a7e22a142849dc1fb104a1454ceaa8f97b');
  assert.equal(fs.readFileSync(path.join(root,'evidence/additional-screen-rules.mjs'),'utf8'),fs.readFileSync('scripts/echelonsix-legal-screen.mjs','utf8'));
  const candidate=json('evidence/candidate-metadata.json');
  const candidateRows=new Map(candidate.courses.map(x=>[x.courseKey,x]));
  const manifestByCourse=new Map(manifest.map(x=>[x.courseKey,x]));
  const totals=Object.fromEntries(interactiveModes.map(m=>[m,0]));
  let total=0, candidates=0, priorRetained=0, priorExcluded=0;
  const retainedIds=new Set(), previewChanges=[];
  for (const row of metadata.courses) {
    const pkgBytes=fs.readFileSync(path.join(root,`packages/${row.courseKey}.json`));
    const provBytes=fs.readFileSync(path.join(root,`provenance/${row.courseKey}.json`));
    const pkg=JSON.parse(pkgBytes), prov=JSON.parse(provBytes), summary=manifestByCourse.get(row.courseKey);
    const candidateRow=candidateRows.get(row.courseKey);
    assert.equal(sha256(pkgBytes),row.releasedPackageSha256);
    assert.equal(sha256(provBytes),row.provenanceSha256);
    assert.equal(row.provenanceSha256,candidateRow.provenance.sha256);
    assert.equal(row.sourceSha256,candidateRow.source.sha256);
    assert.equal(row.candidatePackageSha256,candidateRow.package.sha256);
    assert.ok(interactivePackageSchema.safeParse(pkg).success,row.courseKey);
    assert.equal(pkg.courseKey,row.courseKey); assert.equal(pkg.status,'approved');
    assert.equal(pkg.examples.length,row.itemCount); assert.equal(pkg.examples.length,summary.after);
    assert.deepEqual(pkg.previewIds,row.previewIds);
    const sourceBytes=Buffer.from(prov.source.originalBytes,'base64');
    assert.equal(sha256(sourceBytes),row.sourceSha256);
    const originals=JSON.parse(sourceBytes.toString());
    assert.equal(originals.length,summary.before); assert.equal(summary.excluded,summary.before-summary.after);
    const retained=new Map(pkg.examples.map(x=>[x.id,x]));
    assert.equal(retained.size,pkg.examples.length);
    const priorKept=[];
    for (const original of originals) {
      const reasons=legalScreen(original);
      if (reasons.filter(reason=>reason!==missingEvidenceReason).length) priorExcluded++;
      else { priorRetained++; priorKept.push(original); }
      if (reasons.length) { const x=excluded.get(original.id); assert.ok(x); assert.equal(x.courseKey,row.courseKey); assert.deepEqual(x.original,original); assert.deepEqual(x.reasons,reasons); assert.equal(x.converted.id,original.id); assert.ok(!retained.has(original.id)); }
      else assert.ok(retained.has(original.id), original.id);
    }
    assert.deepEqual(sort(Object.keys(pkg.previewIds)),sort(interactiveModes));
    assert.deepEqual(sort(Object.keys(summary.modeCounts)),sort(interactiveModes));
    for(const mode of interactiveModes) {
      const ids=sort(pkg.examples.filter(x=>x.mode===mode).map(x=>x.id));
      assert.ok(ids.length>=2,`${row.courseKey}/${mode}`); assert.equal(pkg.previewIds[mode],ids[0]);
      assert.equal(summary.modeCounts[mode],ids.length); totals[mode]+=ids.length;
      const priorPreview=sort(priorKept.filter(x=>x.mode===mode).map(x=>x.id))[0];
      if (priorPreview!==pkg.previewIds[mode]) previewChanges.push({courseKey:row.courseKey,mode,before:priorPreview,after:pkg.previewIds[mode]});
    }
    for(const item of pkg.examples) { assert.ok(!retainedIds.has(item.id),item.id); retainedIds.add(item.id); }
    total+=pkg.examples.length; candidates+=originals.length;
  }
  assert.equal(candidates,3984);
  assert.equal(priorRetained,3828); assert.equal(priorExcluded,156);
  assert.equal(total,3821);
  assert.deepEqual(metadata.counts,{courses:38,examples:3821,modes:{'rapid-swipe':701,'speed-match':389,'odd-one-out':521,'cause-effect':987,'tap-the-flaw':656,'before-after':567}});
  assert.deepEqual(totals,metadata.counts.modes);
  assert.deepEqual(previewChanges,[{courseKey:'wpi-class1-water-coll',mode:'tap-the-flaw',before:'wpi-class1-water-coll-065',after:'wpi-class1-water-coll-066'}]);
  assert.equal(json('packages/class1-water-dist.json').examples.length,98);
  for(const id of ['class1-water-dist-074',...missingEvidenceIds]) assert.ok(!retainedIds.has(id),id);
  assert.ok(retainedIds.has('wqa-023'));
  const wqaProv=json('provenance/wqa.json');
  const wqaOriginal=JSON.parse(Buffer.from(wqaProv.source.originalBytes,'base64').toString()).find(x=>x.id==='wqa-023');
  assert.deepEqual(legalScreen(wqaOriginal),[]);
  assert.match(wqaOriginal.prompt,/WHMIS SDS section/);
  assert.deepEqual(wqaOriginal.pairs.map(x=>x.left),['Section 2','Section 4','Section 7']);
  assert.deepEqual(metadata.screenDecisions.map(x=>[x.id,x.decision]),[['class1-water-dist-074','excluded'],['wqa-023','retained'],...missingEvidenceIds.map(id=>[id,'excluded'])]);
  assert.match(metadata.exclusions,/163.*156 prior plus 7 excluded for missing authority evidence/);
  for (const decision of metadata.screenDecisions.filter(x=>missingEvidenceIds.includes(x.id))) assert.match(decision.rationale,/Excluded for missing authority evidence/);
});
