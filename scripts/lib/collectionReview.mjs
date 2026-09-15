import { sha256, BANK_KEY, COURSE_KEY } from '../export-wpi-class4-collection-review.mjs';
export const BASELINE_SHA256 = '397fc0949a31760494116d368cc69ecc465cbe84baddf7daf597ef9cce3b0bab';
export const AREAS = {
 E: 'Equipment Operation, Evaluation & Maintenance',
 C: 'Collection System O&M & Restoration',
 L: 'Lift Station Operation & Maintenance',
 M: 'Collection System Monitoring, Evaluation & Adjustment',
 S: 'Security, Safety & Administrative Procedures',
};
export const TARGETS = { E:23, C:23, L:16, M:20, S:18 };
export const REVIEW_FILES = ['technical-corrections.psv','planning-rewrites.psv','operations-rewrites.psv','remaining-hydraulics-operations.psv','remaining-assessment-rewrites.psv'];
export const CALCULATION_IDS = new Set([51,154,166,172,173,174,178,179,189,190,227,228,242,281,282,283,301,304,305,309,316,317,350,351,366,373,392,416,423,435,461]);
export const RECALL_TARGETS = {E:5,C:4,L:3,M:5,S:3};
export const CALCULATION_TARGETS = {E:3,C:5,L:1,M:0,S:7};
export const SOURCES = {
 confinedProgram: { title:'CCOHS: Confined Space — Program', url:'https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_program.html', note:'Section: What should happen when work is being done in a confined space? Immediate withdrawal on an alarm. General guidance, not a Manitoba numerical entry limit. Checked 2026-09-15.' },
 incident: { title:'CCOHS: Incident Investigation', url:'https://www.ccohs.ca/oshanswers/hsprograms/investig.html', note:'Sections on reasons for investigation, recommendations and follow-up. Near misses warrant prevention-focused investigation. General guidance; no external reporting deadline is asserted. Checked 2026-09-15.' },
 streamSampling: { title:'US EPA: Volunteer Stream Monitoring — A Methods Manual', url:'https://www.epa.gov/sites/default/files/2015-06/documents/stream.pdf', note:'Chapter 2, monitoring-program design, PDF page 21: upstream/downstream observations for suspected sources. Sampling-design background, not a prescribed Manitoba incident sampling plan. Checked 2026-09-15.' },
 flowMonitoring: { title:'NEIWPCC: Collection Systems — Flow Monitoring and Modeling', url:'https://www.epa.gov/sites/default/files/2015-10/documents/sso_optimizing_enitre_doc.pdf', note:'Sections 6.3–6.5, especially page 6-4: monitoring locations, field checks and comparison of modelled with measured flows. Original scenarios apply these methods; no Manitoba legal duty is inferred. Checked 2026-09-15.' },
 sourceControl: { title:'NEIWPCC: Collection Systems — Sewer Use Ordinances', url:'https://www.epa.gov/sites/default/files/2015-10/documents/sso_optimizing_enitre_doc.pdf', note:'Chapter 4 is technical source-control background. Questions 213 and 214 explicitly supply hypothetical authorization conditions; this US manual is not authority for Manitoba municipal law. Checked 2026-09-15.' },
 pumpEnergy: { title:'US EPA: Lift Station Fact Sheet — Pump Performance and Energy', url:'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=901U0X00.TXT', note:'Design/pump-performance and energy discussion. The printed E/V = rho g H/eta identity is an independent steady-duty derivation; comparison assumes comparable head, duty and liquid density. Qualitative, not a calculation item. Checked 2026-09-15.' },
 mbRigging: { title:'Manitoba M.R. 217/2006 — Rigging and Spreader Bars', url:'https://web2.gov.mb.ca/laws/regs/current/217-2006.php?lang=en', note:'Sections 23.33–23.35: specifications, spreader-bar certification, suitability and rated-load/weight markings. Q57 concerns a below-the-hook spreader bar, not a structural monorail beam. Checked 2026-09-15.' },
 mbOrientation: { title:'Manitoba M.R. 217/2006 — New Worker Orientation', url:'https://web2.gov.mb.ca/laws/regs/current/217-2006.php?lang=en', note:'Section 2.2.1: workplace-specific orientation, hazards, procedures and emergency arrangements. This source does not establish operator certification classes or an additional site licence. Checked 2026-09-15.' },
 mbWhmis: { title:'Manitoba M.R. 217/2006 — Hazardous Product Training', url:'https://web2.gov.mb.ca/laws/regs/current/217-2006.php?lang=en', note:'Subsections 35.3(2)–(3): product information, safe handling and emergency procedures, and effective training. General WHMIS education does not establish site-specific response knowledge. Checked 2026-09-15.' },
 mbElectrical: { title:'Manitoba M.R. 217/2006 — Appropriate Electrical Equipment', url:'https://web2.gov.mb.ca/laws/regs/current/217-2006.php?lang=en', note:'Subsection 38.16(1): assess environmental conditions to select appropriate electrical equipment and protection. This is not a drone certification or hazardous-location classification rule. Checked 2026-09-15.' },
 mbTraffic: { title:'Manitoba M.R. 217/2006 — Traffic Control', url:'https://web2.gov.mb.ca/laws/regs/current/217-2006.php?lang=en', note:'Section 20.5: effective traffic-control procedures, training and protective measures where vehicles present a worker risk. No universal cone spacing or mandatory barrier type is inferred. Checked 2026-09-15.' },
 mbFirstAid: { title:'Manitoba M.R. 217/2006 — First Aid', url:'https://web2.gov.mb.ca/laws/regs/current/217-2006.php?lang=en', note:'Part 5, especially 5.1–5.5 and 5.8: arrangements, first aiders and transport; consult the applicable workplace category and schedules. No generic confined-space source or invented distance threshold is used. Checked 2026-09-15.' },
 carbonH2s: { title:'Calgon Carbon: ST I X Impregnated Activated Carbon Product Bulletin', url:'https://www.calgoncarbon.com/app/uploads/ST1X.pdf', note:'H2S capacity and Design Considerations, pages 1–2: humidity and condensation affect this media. Manufacturer evidence illustrates media-specific limits; verify the installed product. No universal humidity target is asserted. Checked 2026-09-15.' },

 om: { title:'NEIWPCC: Optimizing Operation, Maintenance, and Rehabilitation of Sanitary Sewer Collection Systems', url:'https://www.epa.gov/sites/default/files/2015-10/documents/sso_optimizing_enitre_doc.pdf', note:'Technical background; original Echelon scenarios. US examples do not establish Manitoba legal requirements.' },
 lift: { title:'US EPA: Collection Systems Technology Fact Sheet — Sewers, Lift Station', url:'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=901U0X00.TXT', note:'Technical background; confirm equipment-specific operating requirements with the manufacturer.' },
 force: { title:'US EPA: Wastewater Technology Fact Sheet — Sewers, Force Main', url:'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P10099PU.TXT', note:'Technical background; no US regulatory requirement is asserted as Manitoba law.' },
 confined: { title:'CCOHS: Confined Space — Introduction', url:'https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html', note:'General hazard-control guidance; applicable law and the site-specific procedure remain authoritative.' },
 niosh: { title:'NIOSH Pocket Guide: Hydrogen sulfide', url:'https://www.cdc.gov/niosh/npg/npgd0337.html', note:'The NIOSH IDLH value is identified as such; it is not presented as a Manitoba legal entry limit. Retrieved 2026-09-15.' },
 heat: { title:'CCOHS: Hot Environments — Health Effects and First Aid', url:'https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_health.html', note:'Heat-illness recognition and emergency response guidance. Retrieved 2026-09-15.' },
 hazards: { title:'CCOHS: Hazard and Risk — Hierarchy of Controls', url:'https://www.ccohs.ca/oshanswers/hsprograms/hazard/hierarchy_controls.html', note:'General control hierarchy and implementation guidance; not a substitute for task-specific assessment. Retrieved 2026-09-15.' },
 mbwsh: { title:'Manitoba Workplace Safety and Health Regulation, M.R. 217/2006', url:'https://web2.gov.mb.ca/laws/regs/current/_pdf-regs.php?reg=217/2006', note:'Parts 14 and 15; question 251 specifically references subsection 15.6(1). Retrieved 2026-09-15.' },
 mb: { title:'Manitoba Water and Wastewater Facility Operators Certification Program', url:'https://www.gov.mb.ca/sd/waste_management/wastewater/wastewater_certification_program/index.html', note:'Jurisdiction/program context only; no incident-reporting deadline is inferred from this page.' },
 math: { title:'Echelon independently derived hydraulics and dimensional analysis', url:null, note:'Use the assumptions and working printed in the item. Mathematical checks are in collectionReview.test.mjs; these are not universal regulatory design criteria.' },
};
export function parseCorrections(texts) {
 const all = texts.flatMap(text => text.split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
  const fields=line.split('|');
  if(fields.length!==10) throw new Error('INVALID_CORRECTION_COLUMNS');
  const [number,area,cognitiveLevel,question,correct,...tail]=fields;
  const [wrong1,wrong2,wrong3,explanation,source]=tail;
  if(!/^\d+$/.test(number)||!AREAS[area]||!['recall','application'].includes(cognitiveLevel)||!SOURCES[source]) throw new Error('INVALID_CORRECTION_CLASSIFICATION');
  const options=[correct,wrong1,wrong2,wrong3];
  if(options.some(x=>!x.trim())||new Set(options.map(x=>x.toLowerCase())).size!==4||!question||!explanation) throw new Error('INVALID_CORRECTION_CONTENT');
  return {questionNum:Number(number),area,cognitiveLevel,question,correct,wrong:[wrong1,wrong2,wrong3],explanation,source};
 }));
 if(new Set(all.map(x=>x.questionNum)).size!==all.length) throw new Error('DUPLICATE_CORRECTION');
 return all.sort((a,b)=>a.questionNum-b.questionNum);
}
export function validateBaseline(snapshot) {
 if(snapshot.format!=='echelon-wpi-class4-collection-review-v1'||snapshot.courseKey!==COURSE_KEY||snapshot.canonicalBankKey!==BANK_KEY) throw new Error('WRONG_EXPORT');
 const digest=sha256({questions:snapshot.questions,metadata:snapshot.metadata,moduleOverviews:snapshot.moduleOverviews});
 if(digest!==BASELINE_SHA256||snapshot.contentSha256!==digest) throw new Error('BASELINE_CHANGED');
 if(snapshot.questions.length!==503||new Set(snapshot.questions.map(q=>q.id)).size!==503||new Set(snapshot.questions.map(q=>q.questionNum)).size!==503||snapshot.questions.some(q=>q.bankKey!==BANK_KEY)) throw new Error('INCOMPLETE_BASELINE');
 const hashes=new Map(snapshot.rowHashes.map(r=>[r.id,r]));
 if(hashes.size!==503||snapshot.rowHashes.length!==503) throw new Error('INVALID_ROW_HASHES');
 for(const q of snapshot.questions) { const h=hashes.get(q.id); if(!h||h.bankKey!==q.bankKey||h.questionNum!==q.questionNum||h.sha256!==sha256(q)) throw new Error('ROW_HASH_MISMATCH'); }
 return true;
}
const words=text=>text.match(/[\p{L}\p{N}]+/gu)?.length??0;
export function screenQuestion(q) {
 const findings=[];
 let options; try {options=JSON.parse(q.options);} catch {return ['invalid_options_json'];}
 if(!Array.isArray(options)||options.length!==4||options.some(x=>typeof x!=='string')||!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3) return ['invalid_options_or_key'];
 const correct=options[q.correctIndex], wrong=options.filter((_,i)=>i!==q.correctIndex);
 if(words(correct)>=12&&words(correct)>=1.6*Math.max(...wrong.map(words))) findings.push('long_correct_answer_candidate');
 if(wrong.some(x=>/\bonly\b/i.test(x))) findings.push('restrictive_distractor_candidate');
 if(/all of the above|none of the above/i.test(options.join(' '))) findings.push('combined_option_candidate');
 if(!q.cognitiveLevel) findings.push('missing_cognitive_classification');
 if(!q.explanation?.trim()) findings.push('missing_explanation');
 return findings;
}
export function buildReview(snapshot,corrections) {
 validateBaseline(snapshot);
 if(corrections.length!==503||new Set(corrections.map(c=>c.questionNum)).size!==503) throw new Error('INCOMPLETE_HISTORICAL_REPAIR');
 const byNumber=new Map(snapshot.questions.map(q=>[q.questionNum,q]));
 const replacementMap=new Map();
 const patches=corrections.map(c=> {
  const original=byNumber.get(c.questionNum); if(!original) throw new Error('UNKNOWN_QUESTION');
  const options=[...c.wrong]; options.splice(original.correctIndex,0,c.correct);
  const isCalc= CALCULATION_IDS.has(c.questionNum)?'yes':'no';
  const source=SOURCES[c.source];
  const after={...original,question:c.question,module:AREAS[c.area],options:JSON.stringify(options),explanation:c.explanation,steps:null,tip:null,isCalc,cognitiveLevel:c.cognitiveLevel,topic:AREAS[c.area],sourceTitle:source.title,sourceUrl:source.url,sourceReference:source.note,blueprintObjective:AREAS[c.area]};
  // Preserve id, bank, number, answer position, publication status and review timestamps.
  replacementMap.set(original.id,after);
  return {id:original.id,questionNum:original.questionNum,beforeSha256:sha256(original),afterSha256:sha256(after),before:original,after,disposition:'repaired'};
 });
 const ledger=snapshot.questions.map(q=>({id:q.id,questionNum:q.questionNum,baselineSha256:sha256(q),screening:screenQuestion(q),status:replacementMap.has(q.id)?'repaired':'editorial_review_remaining'}));
 const proposed=snapshot.questions.map(q=>replacementMap.get(q.id)||q);
 const counts={}; for(const row of ledger) counts[row.status]=(counts[row.status]||0)+1;
 const coverage=Object.fromEntries(Object.entries(AREAS).map(([area,name])=>{const rows=proposed.filter(q=>q.module===name);return [area,{total:rows.length,recall:rows.filter(q=>q.cognitiveLevel==='recall').length,application:rows.filter(q=>q.cognitiveLevel==='application').length,calculations:rows.filter(q=>q.isCalc==='yes').length}];}));
 // Only the module menu and cache version accompany this repair. The exam profile
 // and guide content require a separate release, not an implicit data mutation.
 const metadataPatches=snapshot.metadata.map(before=>{const after={...before,modules:JSON.stringify(Object.values(AREAS)),contentVersion:Number(before.contentVersion)+1};return {before,after,beforeSha256:sha256(before),afterSha256:sha256(after)};});
 const content={baselineSha256:BASELINE_SHA256,patches,ledger,metadataPatches,coverage};
 return {format:'echelon-collection-historical-repair-v1',historicalRepairComplete:true,releaseReady:false,courseKey:COURSE_KEY,bankKey:BANK_KEY,counts,newQuestions:[],additionalQuestionsPending:250,
  blockers:['Complete a fresh production comparison, backup verification and database-backed import/rollback rehearsal.','Confirm active mock-session handling and historical revision display before replacing published wording.'],
  proposedBlueprint:{source:'https://gowpi.org/wp-content/uploads/2026/04/Collection-%E2%80%93-Class-4_final.pdf',targets:Object.fromEntries(Object.entries(TARGETS).map(([a,n])=>[AREAS[a],n])),scored:100,pretest:10,recall:20,application:80,calculations:16,activated:false},
  proposedScreening:proposed.filter(q=>replacementMap.has(q.id)).map(q=>({questionNum:q.questionNum,findings:screenQuestion(q)})),
  contentSha256:sha256(content),...content};
}
export function requireCompleteRelease(review) {
 if(review.releaseReady!==true||review.historicalRepairComplete!==true||review.counts?.repaired!==503||review.counts?.editorial_review_remaining||review.patches?.length!==503) throw new Error('INCOMPLETE_REVIEW_NOT_IMPORTABLE');
}

export function validateCompletedRepair(review) {
 if(review.format!=='echelon-collection-historical-repair-v1'||review.baselineSha256!==BASELINE_SHA256||review.bankKey!==BANK_KEY||review.courseKey!==COURSE_KEY) throw new Error('WRONG_REPAIR_PACKAGE');
 if(review.patches?.length!==503||review.ledger?.length!==503||review.counts?.repaired!==503||review.additionalQuestionsPending!==250||review.newQuestions?.length!==0) throw new Error('INCOMPLETE_REPAIR_PACKAGE');
 const ids=new Set(),numbers=new Set();
 const preserved=['id','bankKey','questionNum','correctIndex','difficulty','reviewStatus','reviewedAt'];
 for(const patch of review.patches){
  const {before,after}=patch;
  if(ids.has(after.id)||numbers.has(after.questionNum)||after.questionNum<1||after.questionNum>503) throw new Error('DUPLICATE_OR_INVALID_ID');
  ids.add(after.id);numbers.add(after.questionNum);
  if(before.bankKey!==BANK_KEY||preserved.some(k=>before[k]!==after[k])||patch.id!==after.id||patch.questionNum!==after.questionNum) throw new Error('IDENTITY_OR_HISTORY_FIELD_CHANGED');
  if(sha256(before)!==patch.beforeSha256||sha256(after)!==patch.afterSha256) throw new Error('PATCH_HASH_MISMATCH');
  if(screenQuestion(after).length||!Object.values(AREAS).includes(after.module)||after.topic.length>128||after.module.length>128||after.sourceTitle.length>255||after.sourceReference.length>512||after.blueprintObjective.length>255||(after.sourceUrl?.length??0)>1024) throw new Error('INVALID_REPAIRED_ROW');
 }
 if(review.metadataPatches?.length!==1) throw new Error('INVALID_METADATA_SCOPE');
 for(const p of review.metadataPatches){
  if(p.before.bankKey!==BANK_KEY||sha256(p.before)!==p.beforeSha256||sha256(p.after)!==p.afterSha256) throw new Error('METADATA_HASH_MISMATCH');
  const expected={...p.before,modules:JSON.stringify(Object.values(AREAS)),contentVersion:Number(p.before.contentVersion)+1};
  if(sha256(expected)!==sha256(p.after)) throw new Error('UNEXPECTED_METADATA_CHANGE');
 }
 const content={baselineSha256:review.baselineSha256,patches:review.patches,ledger:review.ledger,metadataPatches:review.metadataPatches,coverage:review.coverage};
 if(sha256(content)!==review.contentSha256) throw new Error('REPAIR_HASH_MISMATCH');
 return true;
}
