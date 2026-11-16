import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const EXPORT_COMMIT = 'd118897a';
export const REVIEW_COMMIT = '7730062d4d0cfcccbca17560211c45f9e76e366c';
export const RELEASE_KEY = 'exam-review-20261116';
export const FIELDS = Object.freeze(['id','bankKey','questionNum','module','difficulty','question','options','correctIndex','explanation','steps','tip','isCalc','topic','cognitiveLevel','sourceTitle','sourceReference','sourceUrl','blueprintObjective','reviewStatus','reviewedBy','reviewedAt']);
export const MUTABLE = Object.freeze(['question','options','correctIndex','explanation','steps','reviewStatus','reviewedBy','reviewedAt']);
export const ACTOR = 'owner-authorized-ai-review:claude:2026-11-16';
export const EXPLICIT_HOLDS = Object.freeze([183632,183670,180317,180357,183486,183527,181916,181937,184575,186086,184680,46075,47423,42178,42111,42293,42317,42316,90216,40718,40767,40782,40762]);
export function stable(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k,stable(value[k])]));
  return value ?? null;
}
export const digest = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export const project = row => Object.fromEntries(FIELDS.map(k => [k,row[k] ?? null]));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
export function validateFix(fix) {
  assert(fix && Object.keys(fix).sort().join(',') === 'correctIndex,explanation,options,question,steps', 'Unexpected fix columns');
  assert(typeof fix.question === 'string' && fix.question.trim() && typeof fix.explanation === 'string' && fix.explanation.trim(), 'Empty question/explanation');
  assert(Array.isArray(fix.options) && fix.options.length === 4 && fix.options.every(x => typeof x === 'string' && x.trim()) && new Set(fix.options.map(x => x.trim().toLowerCase())).size === 4, 'Invalid four options');
  assert(Number.isInteger(fix.correctIndex) && fix.correctIndex >= 0 && fix.correctIndex < 4, 'Invalid key');
  assert(fix.steps === null || (Array.isArray(fix.steps) && fix.steps.every(s => s && typeof s.l === 'string' && s.l.trim() && typeof s.c === 'string' && s.c.trim())), 'Invalid worked steps');
}
export function holdReasons(finding, baseline) {
  const reasons = [];
  if (EXPLICIT_HOLDS.includes(finding.id)) reasons.push('Explicit unresolved item in needs-source-check.txt (including unflagged items)');
  try { validateFix(finding.fix); } catch (error) { reasons.push('Invalid reviewed payload: '+error.message); }
  const text = [finding.fix?.question, finding.fix?.explanation, ...(finding.fix?.steps ?? []).map(s => typeof s === 'string' ? s : s.c ?? s.l)].join(' ');
  // No blanket chunk exclusions. Hold specific unsupported regulatory/guideline claims,
  // including nonnumeric prescriptions, citations and jurisdiction-specific limits.
  const authority = /O\.?\s*Reg\.?|Ontario|MECP|MOE\b|OPSS|OPSD|F-[56]-[15]|Health Canada|Canadian.*(?:guideline|standard)|Schedule\s+(?:6|10)|provincial.*(?:require|regulat|standard|limit)/i.test(text);
  const claim = /\d|\brequired?\b|\bmust\b|\bminimum\b|\bmaximum\b|\blimit\b|\bstandard\b|\bguideline\b|\bfrequency\b|\bapproval\b/i.test(text);
  const link = /https?:\/\/[^\s]+/i.test(text);
  if (authority && claim && !link) reasons.push('Specific jurisdiction/regulation/guideline claim without a supporting link in corrected content');
  if (/holding time|hold(?:ing)?[^.]{0,35}\b(?:24|48)\s*(?:h|hour)|\b(?:lead|manganese|iron|turbidity|HPC|TCU)\b[^.]{0,90}(?:\d|limit|standard|guideline)/i.test(text) && !link && authority) reasons.push('Unlinked numeric water-quality/holding-time claim');
  if (baseline.isCalc === 'yes' && (!finding.fix?.steps || finding.fix.steps.length < 2)) reasons.push('Existing calculation item lacks complete multi-step corrected solution');
  return reasons;
}
export function loadInputs(root) {
  const gitJson = path => JSON.parse(execFileSync('git',['show',`${EXPORT_COMMIT}:${path}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}));
  const names = execFileSync('git',['ls-tree','-r','--name-only',EXPORT_COMMIT,'docs/exam-bank-export/2026-11-16'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p => /\/bank-.*\.json$/.test(p));
  const baseline = names.flatMap(gitJson);
  assert(baseline.length === 24350 && names.length === 39, 'Export inventory mismatch');
  const read = file => {
    const path = `docs/exam-bank-review/${file}`;
    const text = readFileSync(`${root}/${path}`,'utf8');
    const trusted = execFileSync('git',['show',`${REVIEW_COMMIT}:${path}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
    assert(text === trusted, `Review input differs from authorized commit: ${file}`);
    return JSON.parse(text);
  };
  const document = read('corrections.json');
  const deletions = read('delete-list.json');
  assert(document.corrections.length === 1803 && deletions.length === 34, 'Review inventory mismatch');
  return {baseline, findings:document.corrections, deletions, candidates:read('units-unflagged-candidates.json')};
}
export function makePlan(inputs, currentRows, at = '2026-11-16T18:30:00.000Z') {
  const base = new Map(inputs.baseline.map(r => [r.id,r]));
  const current = new Map(currentRows.map(r => [r.id,project(r)]));
  assert(current.size === currentRows.length, 'Duplicate current ids');
  const findings = new Map(inputs.findings.map(r => [r.id,r]));
  assert(findings.size === inputs.findings.length, 'Duplicate correction ids');
  const deletes = new Set(inputs.deletions.map(r => r.id));
  assert(deletes.size === 34 && [...deletes].every(id => findings.get(id)?.replacement === true), 'Deletion list mismatch');
  const actions = [], conflicts = [];
  const unresolvedSourceMarkers = EXPLICIT_HOLDS.filter(id => !base.has(id));
  const ids = new Set([...findings.keys(),...EXPLICIT_HOLDS.filter(id => base.has(id))]);
  for (const id of [...ids].sort((a,b) => a-b)) {
    const original = base.get(id), now = current.get(id), finding = findings.get(id);
    if (!original || !now) { conflicts.push({id,reason:'Missing export/current row'}); continue; }
    const changed = Object.keys(original).filter(k => digest(original[k]) !== digest(now[k]));
    if (changed.length) { conflicts.push({id,reason:'Current row differs from immutable export',fields:changed}); continue; }
    assert(!finding || (finding.bankKey === original.bankKey && finding.questionNum === original.questionNum), `Identity mismatch ${id}`);
    if (finding) {
      for (const k of ['question','options','correctIndex','explanation']) {
        const value = k === 'options' ? JSON.parse(original[k]) : original[k];
        assert(digest(value) === digest(finding.original[k]), `Review original differs from export ${id}:${k}`);
      }
    }
    const reasons = finding ? holdReasons(finding,original) : ['Explicit unflagged source-check item'];
    const kind = deletes.has(id) ? 'reject' : reasons.length ? 'hold' : 'correct';
    const after = {...now};
    if (kind === 'correct') Object.assign(after, finding.fix, {options:JSON.stringify(finding.fix.options),steps:finding.fix.steps === null ? null : JSON.stringify(finding.fix.steps)});
    after.reviewStatus = kind === 'correct' ? 'approved' : kind === 'reject' ? 'rejected' : 'in_review';
    after.reviewedBy = kind === 'hold' ? null : ACTOR;
    after.reviewedAt = kind === 'hold' ? null : at;
    actions.push({id,bankKey:original.bankKey,questionNum:original.questionNum,kind,reasons:kind === 'reject' ? ['Owner-authorized removal; soft rejection preserves history'] : reasons,before:now,after,beforeSha256:digest(now),afterSha256:digest(after)});
  }
  const unitCandidates = Object.entries(inputs.candidates).flatMap(([bankKey,ids]) => ids.map(id => {
    const row = base.get(id); assert(row?.bankKey === bankKey, `Unit candidate identity mismatch ${id}`);
    const text = [row.question,...JSON.parse(row.options),row.explanation].join(' ');
    const tokens = [...new Set(text.match(/\b(?:gallons?|gpm|gpd|MGD|psi|psig|feet|foot|ft|inches|inch|lbs?|pounds?|Fahrenheit|hp)\b/gi) ?? [])];
    return {id,bankKey,tokens,classification:/\b(?:gallons?|gpm|gpd|MGD|psi|psig|feet|foot|ft|lbs?|pounds?|Fahrenheit)\b/i.test(text) ? 'measurement-needs-editorial-decision' : 'nominal-size-or-incidental-needs-editorial-decision',decision:'unchanged: pattern match is not proof of an error'};
  }));
  return {formatVersion:1,releaseKey:RELEASE_KEY,exportCommit:EXPORT_COMMIT,reviewCommit:REVIEW_COMMIT,at,counts:{findings:inputs.findings.length,correct:actions.filter(a=>a.kind==='correct').length,hold:actions.filter(a=>a.kind==='hold').length,reject:actions.filter(a=>a.kind==='reject').length,conflicts:conflicts.length,unitCandidates:unitCandidates.length},actions,conflicts,unresolvedSourceMarkers,unitCandidates};
}
export function checkState(plan, rows) {
  const byId = new Map(rows.map(r => [r.id,project(r)]));
  const pending = [], done = [];
  for (const action of plan.actions) {
    assert(digest(action.before) === action.beforeSha256 && digest(action.after) === action.afterSha256, 'Plan image hash mismatch');
    const hash = digest(byId.get(action.id));
    if (hash === action.afterSha256) done.push(action);
    else if (hash === action.beforeSha256) pending.push(action);
    else throw new Error(`Concurrent drift ${action.id}; abort entire transaction`);
  }
  assert(!done.length || !pending.length, 'Partial application detected; reconcile receipts before continuing');
  return {pending,done};
}
