import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildBank, lintSources, validateBank } from './usBank.mjs';
export const SOURCE_COMMIT = 'e54527b7d6c1d1af88ff0374f2440d985ae4e2a1';
export const RELEASE_KEY = 'florida-distribution-20261117';
export const ACTOR = 'owner-accepted-content-review:2026-11-17';
export const BANKS = Object.freeze([
  { key: 'fl-water-distribution-l3', count: 150, calc: 36, prefix: 'FL-L3-DIST', sha256: '3e03bc9e0fdfaa3ba954ce6964217e6d835ff7755f7e9cb08ab5361350a1251e', reviewSha256: 'ae0432d6c7632e89ee4f3e211f248761e178645f7217cd126675efcb71ccf725' },
]);
export const COLUMNS = Object.freeze(['bankKey','questionNum','module','difficulty','question','options','correctIndex','explanation','steps','tip','isCalc','topic','cognitiveLevel','sourceTitle','sourceReference','sourceUrl','blueprintObjective']);
export const rawHash = value => createHash('sha256').update(value).digest('hex');
export const digest = value => rawHash(JSON.stringify(value));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
export function validateRows(spec, config, rows) {
  assert(Array.isArray(rows) && rows.length === spec.count, 'Wrong bank count');
  assert(config.bankKey === spec.key && config.id === spec.key && config.state === 'FL', 'Wrong Florida identity');
  const sources = Object.values(config.sources), stems = new Set(), ids = new Set();
  let calculations = 0;
  const limits = { bankKey:64, module:128, difficulty:16, topic:128, sourceTitle:255, sourceReference:512, sourceUrl:1024, blueprintObjective:255 };
  for (const [index,row] of rows.entries()) {
    assert(row.bankKey === spec.key && row.questionNum === index + 1 && Number.isInteger(row.questionNum), 'Wrong or duplicate source number');
    assert(row.itemId === `${spec.prefix}-${String(index + 1).padStart(3,'0')}` && !ids.has(row.itemId), 'Wrong or duplicate source ID'); ids.add(row.itemId);
    for (const field of ['question','explanation','module','difficulty','topic','sourceTitle','sourceReference','sourceUrl','blueprintObjective']) assert(typeof row[field] === 'string' && row[field].trim(), `Invalid ${field}`);
    for (const [field,max] of Object.entries(limits)) assert(row[field].length <= max, `Too long: ${field}`);
    assert(sources.some(([title,url]) => title === row.sourceTitle && url === row.sourceUrl), 'Unconfigured source');
    assert(['easy','medium','hard'].includes(row.difficulty) && ['recall','application'].includes(row.cognitiveLevel), 'Invalid classification');
    assert(['yes','no'].includes(row.isCalc) && row.reviewStatus === 'unreviewed', 'Unexpected source status');
    assert(Array.isArray(row.options) && row.options.length === 4 && row.options.every(v=>typeof v==='string' && v.trim()) && new Set(row.options.map(v=>v.trim().toLowerCase())).size === 4, 'Invalid options');
    assert(Number.isInteger(row.correctIndex) && row.correctIndex >= 0 && row.correctIndex <= 3 && row.correctAnswer === row.options[row.correctIndex], 'Invalid answer key');
    for (const [i,letter] of [...'ABCD'].entries()) assert(row[`option${letter}`] === row.options[i], 'Option crosswalk mismatch');
    const stem = row.question.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); assert(!stems.has(stem),'Duplicate stem'); stems.add(stem);
    if (row.isCalc === 'yes') {
      calculations++;
      assert(typeof row.steps === 'string', 'Worked steps must preserve source JSON string');
      const steps = JSON.parse(row.steps);
      assert(Array.isArray(steps) && steps.length === 3 && steps.every(s=>typeof s.l === 'string' && s.l.trim() && typeof s.c === 'string' && s.c.trim()), 'Invalid three-step calculation');
    } else assert(row.steps == null, 'Unexpected conceptual steps');
  }
  assert(calculations === spec.calc, 'Wrong calculation count');
}
export function mapRow(row) {
  return Object.fromEntries(COLUMNS.map(key => [key, key === 'options' ? JSON.stringify(row.options) : row[key] ?? null]));
}
export function projectStored(row) { return Object.fromEntries(COLUMNS.map(key=>[key,row[key] ?? null])); }
export function loadPackage(root) {
  const banks = BANKS.map(spec => {
    const dir = resolve(root,'content/us-banks',spec.key);
    const bytes = readFileSync(resolve(dir,`questions/bank-${spec.count}.json`));
    assert(rawHash(bytes) === spec.sha256, 'Reviewed question hash mismatch');
    for (const [file,hash] of [['REVIEW-RESULT.md',spec.reviewSha256]]) assert(rawHash(readFileSync(resolve(dir,file))) === hash, 'Review provenance mismatch');
    const config = JSON.parse(readFileSync(resolve(dir,'config.json'),'utf8'));
    const manifest = JSON.parse(readFileSync(resolve(dir,'manifest.json'),'utf8'));
    const rows = JSON.parse(bytes); validateRows(spec,config,rows);
    assert(manifest.sha256 === spec.sha256 && manifest.count === spec.count, 'Manifest mismatch');
    // Counts and metadata come from hash-verified rows, never manifest assertions.
    const moduleCounts = new Map();
    for (const row of rows) moduleCounts.set(row.module,(moduleCounts.get(row.module) ?? 0) + 1);
    const canonicalEntries = entries => [...entries].sort(([a],[b])=>a < b ? -1 : a > b ? 1 : 0);
    assert(manifest.modules !== null && typeof manifest.modules === 'object' && !Array.isArray(manifest.modules)
      && JSON.stringify(canonicalEntries(Object.entries(manifest.modules))) === JSON.stringify(canonicalEntries(moduleCounts)), 'Manifest module tally mismatch');
    // Row encounter order is deterministic and preserves the reviewed package digest.
    const modules = [...moduleCounts.keys()];
    assert(lintSources(config).valid && validateBank(config,rows).valid, 'Source lint or bank validation failed');
    assert(JSON.stringify(buildBank(config),null,2)+'\n' === bytes.toString('utf8'), 'Source reconstruction mismatch');
    const mapped = rows.map(mapRow);
    return { ...spec, modules, rows:mapped, payloadSha256:digest(mapped), crosswalk:rows.map(row=>({itemId:row.itemId,bankKey:row.bankKey,questionNum:row.questionNum,payloadSha256:digest(mapRow(row))})) };
  });
  const allStems = banks.flatMap(bank=>bank.rows.map(row=>row.question.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()));
  assert(new Set(allStems).size === 150,'Cross-bank duplicate stem');
  const payload = { releaseKey:RELEASE_KEY, sourceCommit:SOURCE_COMMIT, reviewAttribution:ACTOR, total:150, stagingStatus:'in_review', banks };
  return { ...payload, packageSha256:digest(payload) };
}
export function verifyStored(bank, rows, requiredStatus) {
  assert(rows.length === bank.count, 'Stored cohort count mismatch');
  const ordered = [...rows].sort((a,b)=>a.questionNum-b.questionNum);
  assert(new Set(ordered.map(r=>r.id)).size === bank.count && ordered.every(r=>Number.isSafeInteger(r.id) && r.id>0), 'Invalid auto database IDs');
  assert(digest(ordered.map(projectStored)) === bank.payloadSha256, 'Stored exact payload mismatch');
  if (requiredStatus) assert(ordered.every(row=>row.reviewStatus === requiredStatus), 'Stored cohort status mismatch');
  return ordered;
}
