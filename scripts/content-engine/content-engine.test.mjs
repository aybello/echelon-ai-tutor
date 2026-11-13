import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { COURSES, MODES, TARGET, VERSION } from './constants.mjs';
import { identity, hash } from './identity.mjs';
import { stage, readRelease } from './inventory.mjs';
import { coverage, metadataIssues, reviewState, blockers } from './coverage.mjs';
import { DocumentSchema, payloadIssues } from './schemas.mjs';
import { createPrivateStore } from './storage.mjs';
import { checkCalculation } from './calculations.mjs';
import { DEFAULT_PLAN, planPilot, selectCarbon } from './planner.mjs';
import { payload, completeFixture, attachReview, catalogFixture, attachPolicyReviews, attachBatchAudit } from './fixtures.mjs';
import { REVIEW_POLICY_VERSION } from './schemas.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cell = doc => coverage(doc).rows.find(r => r.courseKey === 'class1-water' && r.mode === 'rapid-swipe');

test('test guard is preloaded; test environment has no inherited production credentials', () => {
  assert.equal(globalThis.__echelonTestSafetyInstalled, true);
  assert.equal(process.env.DATABASE_URL, undefined);
  assert.equal(process.env.GOOGLE_API_KEY, undefined);
});
test('fixed goal is 1000 EACH mode/course, all 228 cells including absent courses remain zero', () => {
  assert.equal(COURSES.length, 38); assert.equal(MODES.length, 6); assert.equal(TARGET, 1000);
  assert.ok(COURSES.every(k => !/309/i.test(k)));
  const result = coverage({ schemaVersion: VERSION, notice: 'empty fixture', sources: [], concepts: [], exercises: [] });
  assert.equal(result.rows.length, 228);
  for (const r of result.rows) { assert.equal(r.target, 1000); assert.equal(r.raw, 0); assert.equal(r.unique, 0); assert.equal(r.remainingGap, 1000); }
  assert.equal(result.rows.reduce((n,r) => n + r.target, 0), 228000);
});
test('legacy data preserves payloads and unknown rights/difficulty/objectives/reviews honestly', () => {
  const item = payload(); const before = hash(item);
  const doc = stage([{ courseKey: 'class1-water', status: 'approved', version: 'fixture', examples: [item] }], {
    'class1-water': { items: [{ id: item.id, sources: ['https://example.test/source'] }], reviewers: { entries: [{ type: 'ai', name: 'declared' }] } },
  });
  const e = doc.exercises[0]; assert.equal(hash(e.item), before); assert.equal(hash(item), before);
  assert.equal(e.difficulty, 'unclassified'); assert.equal(e.objectiveId, null); assert.equal(e.reviews.length, 0);
  assert.equal(doc.sources[0].rightsBasis, null); assert.equal(doc.sources[0].snapshotHash, null);
  const r = cell(doc); assert.equal(r.raw, 1); assert.equal(r.metadataComplete, 0); assert.equal(r.AIreviewed, 0); assert.equal(r.humanReviewed, 0); assert.equal(r.releasableAccepted, 0);
  assert.equal(r.legacyAIReviewDeclared, 1); assert.equal(r.legacySoftwareReleased, 1); assert.equal(r.remainingGap, 1000);
  assert.throws(() => stage([{ courseKey: '309a', status: 'draft', version: 'fixture', examples: [item] }]));
});
test('pinned 3821 immutable exercises read only; every existing legacy cell is not fully reviewed', () => {
  const release = readRelease(repoRoot); const doc = stage(release.packages, release.provenance); const result = coverage(doc);
  assert.equal(release.packages.length, 38); assert.equal(doc.exercises.length, 3821); assert.equal(result.rows.length, 228);
  assert.equal(result.rows.reduce((sum,r) => sum + r.raw, 0), 3821);
  assert.ok(result.rows.every(r => r.metadataComplete === 0 && r.humanReviewed === 0 && r.releasableAccepted === 0 && r.remainingGap === 1000));
});
test('scientific fingerprint preserves powers, unit case, equation signs and numeric values', () => {
  const fingerprint = prompt => identity({ ...payload(), prompt }).problemHash;
  for (const [a,b] of [['2²', '22'], ['ML', 'mL'], ['x² + 2 = 6', 'x² - 2 = 6'], ['2 mg/L', '3 mg/L'], ['CO₂', 'CO2']]) assert.notEqual(fingerprint(a), fingerprint(b));
  assert.equal(fingerprint('  2²  +  3 '), fingerprint('2² + 3'));
  assert.notEqual(identity({ ...payload(), instruction: 'Use 1 ML.' }).problemHash, identity({ ...payload(), instruction: 'Use 1 mL.' }).problemHash);
});
test('option/pair storage IDs and presentation ordering are ignored; answers canonicalize by label', () => {
  const a = payload('cause-effect'); const b = { ...a, id: 'different', explanation: 'Different explanation.', options: [{ id: 'y', label: 'Measurement' }, { id: 'x', label: 'Treatment' }], correctOptionId: 'x' };
  assert.deepEqual(identity(a), identity(b));
  const c = payload('speed-match'); const d = { ...c, pairs: c.pairs.map(p => ({ ...p, id: `new-${p.id}` })).reverse() };
  assert.deepEqual(identity(c), identity(d));
  d.pairs[0].right = c.pairs[0].right; assert.notEqual(identity(c).answerHash, identity(d).answerHash);
});
test('duplicate groups are quarantined, not last-row wins, including contradictory answer/difficulty', () => {
  const doc = completeFixture(); attachReview(doc, 'human-technical'); attachReview(doc, 'software-release');
  assert.equal(cell(doc).releasableAccepted, 1);
  const e = structuredClone(doc.exercises[0]); e.exerciseId = 'fixture-second'; e.item.id = 'fixture-second'; e.contentHash = hash(e.item); doc.exercises.push(e);
  let r = cell(doc); assert.equal(r.duplicate, 1); assert.equal(r.quarantined, 2); assert.equal(r.releasableAccepted, 0);
  e.item.correctAnswer = false; e.contentHash = hash(e.item);
  r = cell(doc); assert.equal(r.conflict, 2); assert.equal(r.unique, 2); assert.equal(r.releasableAccepted, 0);
  e.item.correctAnswer = true; e.contentHash = hash(e.item); e.difficulty = 'hard'; r = cell(doc); assert.equal(r.conflict, 2);
  const reversed = { ...doc, exercises: [...doc.exercises].reverse() }; assert.deepEqual(cell(reversed), r);
});
test('rewording within variant families is flagged, not claimed as embedding-solved coverage', () => {
  const doc = completeFixture(); const second = structuredClone(doc.exercises[0]); second.exerciseId = 'fixture-reword'; second.item.id = 'fixture-reword'; second.item.prompt = 'A rewording of the same task.'; second.contentHash = hash(second.item); doc.exercises.push(second);
  const r = cell(doc); assert.equal(r.nearDuplicateFlagged, 2); assert.equal(r.quarantined, 2); assert.equal(r.releasableAccepted, 0);
  for (const e of doc.exercises) attachReview(doc, 'coverage-diversity', e);
  assert.equal(cell(doc).quarantined, 2); // Identical parameter signatures cannot be approved into novelty.
});
test('all six modes have structural checks and reject invalid answers, duplicate labels, leaked order hints', () => {
  for (const mode of MODES) assert.deepEqual(payloadIssues(payload(mode)), []);
  const option = payload('cause-effect'); option.correctOptionId = 'missing'; assert.ok(payloadIssues(option).length);
  option.correctOptionId = 'a'; option.options[1].label = option.options[0].label; assert.ok(payloadIssues(option).length);
  const match = payload('speed-match'); match.pairs[1].left = match.pairs[0].left; assert.ok(payloadIssues(match).length);
  assert.ok(payloadIssues({ ...payload('before-after'), prompt: 'Do this then that.' }).length);
  assert.ok(payloadIssues({ ...payload('before-after'), options: ['A', 'A'], correctAnswer: 'A' }).length);
  assert.ok(payloadIssues({ ...payload(), surprise: true }).length);
});
test('AI review/software release cannot become human technical approval; reviewer authority is accurately declared', () => {
  const doc = completeFixture(); assert.deepEqual(metadataIssues(doc.exercises[0], doc), []);
  attachReview(doc, 'ai'); attachReview(doc, 'software-release');
  assert.equal(cell(doc).AIreviewed, 1); assert.equal(cell(doc).humanReviewed, 0); assert.equal(cell(doc).releasableAccepted, 0);
  attachReview(doc, 'human-technical'); assert.equal(cell(doc).humanReviewed, 1); assert.equal(cell(doc).releasableAccepted, 1);
  const review = doc.exercises[0].reviews.find(r => r.kind === 'human-technical');
  review.reviewerAuthority = 'ai-model-declared'; assert.equal(reviewState(doc.exercises[0], doc, 'human-technical'), false);
  review.reviewerAuthority = 'human-technical-declared'; review.authorityEvidence = null;
  assert.equal(reviewState(doc.exercises[0], doc, 'human-technical'), false);
});
test('payload, citations, source text/rights, concepts, answer, metadata and difficulty edits invalidate approval', () => {
  const mutations = [d => d.exercises[0].item.correctAnswer = false, d => d.exercises[0].difficulty = 'hard',
    d => d.exercises[0].sourceEvidenceRefs[0].evidenceId = 'changed', d => d.sources[0].evidence[0].excerpt = 'Changed fact.',
    d => d.sources[0].rightsBasis = 'Changed rights basis', d => d.concepts[0].facts[0].statement = 'Changed concept.',
    d => d.exercises[0].objectiveId = 'changed-objective', d => d.exercises[0].item.explanation = 'Changed explanation.'];
  for (const mutate of mutations) {
    const doc = completeFixture(); attachReview(doc, 'human-technical'); attachReview(doc, 'software-release');
    assert.equal(reviewState(doc.exercises[0], doc, 'human-technical'), true); mutate(doc); doc.exercises[0].contentHash = hash(doc.exercises[0].item);
    assert.equal(reviewState(doc.exercises[0], doc, 'human-technical'), false); assert.equal(cell(doc).releasableAccepted, 0);
  }
});
test('rights, applicability, source snapshots and statutory/safety existing release screen remain fail closed', () => {
  const doc = completeFixture(); attachReview(doc, 'human-technical'); attachReview(doc, 'software-release');
  doc.exercises[0].claimType = 'safety'; assert.ok(metadataIssues(doc.exercises[0], doc).includes('statutory-or-safety-authority-missing'));
  doc.exercises[0].claimType = 'concept'; doc.exercises[0].item.prompt = 'OSHA regulation requires a permit.'; doc.exercises[0].contentHash = hash(doc.exercises[0].item);
  assert.ok(blockers(doc.exercises[0], doc).includes('existing-statutory-safety-release-screen-blocked'));
  doc.sources[0].permittedUsage = []; assert.ok(metadataIssues(doc.exercises[0], doc).includes('source-evidence-or-rights-incomplete'));
  doc.exercises[0].originality = 'prohibited-exam-copy'; assert.ok(metadataIssues(doc.exercises[0], doc).includes('original-practice-not-evidenced'));
});
const quantity = (n, unit, d = '1') => ({ op: 'quantity', value: { numerator: n, denominator: d }, unit });
const calc = (expression, n, unit, d = '1', places = 3) => ({ schemaVersion: 'calculation-v1', expression, expected: { value: { numerator: n, denominator: d }, unit }, rounding: { mode: 'half-away-from-zero', decimalPlaces: places } });
test('rational math/unit conversions/rounding are deterministic and reject inconsistent dimensions', () => {
  assert.equal(checkCalculation(calc(quantity('1','ML'), '1000000000', 'mL')).passed, true);
  assert.equal(checkCalculation(calc(quantity('1','mL'), '1', 'ML')).passed, false);
  const ct = { op: 'multiply', left: quantity('2','mg/L'), right: quantity('10','min') };
  assert.equal(checkCalculation(calc(ct, '20', 'mg·min/L')).passed, true);
  assert.equal(checkCalculation(calc({ op: 'add', left: quantity('2','mg'), right: quantity('2','L') }, '4','mg')).passed, false);
  assert.equal(checkCalculation(calc({ op: 'power', left: quantity('2','1'), exponent: 2 }, '4','1')).passed, true);
  assert.equal(checkCalculation(calc(quantity('-1','1','2'), '-1','1','1',0)).passed, true);
  assert.equal(checkCalculation(calc(quantity('1','unknown'), '1','1')).passed, false);
  assert.equal(checkCalculation(calc({ op: 'divide', left: quantity('1','1'), right: quantity('0','1') }, '1','1')).passed, false);
  assert.equal(checkCalculation({ ...calc(quantity('1','1'), '1','1'), rounding: { mode: 'unspecified', decimalPlaces: 2 } }).passed, false);
  let expression = quantity('99999999999999999999', '1');
  for (let i = 0; i < 5; i++) expression = { op: 'power', left: expression, exponent: 8 };
  assert.equal(checkCalculation(calc(expression, '1', '1')).issue, 'calculation-magnitude-bound-exceeded');
});
test('private destinations reject traversal, client/shared/public/dist/public and symlink escapes; writes are atomic and private', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'content-engine-test-')); t.after(() => fs.rmSync(temp,{ recursive: true, force: true }));
  const repo = path.join(temp,'repo'); fs.mkdirSync(repo);
  for (const name of ['client','shared','public','dist/public']) fs.mkdirSync(path.join(repo,name),{ recursive: true });
  const root = path.join(temp,'private'); const store = createPrivateStore({ root, repoRoot: repo });
  for (const name of ['../escape.json', '/tmp/escape.json', 'nested/../../escape.json','../repo/client/source.json']) assert.throws(() => store.destination(name));
  for (const name of ['client','shared','public','dist/public']) assert.throws(() => createPrivateStore({ root: path.join(repo,name), repoRoot: repo }));
  const saved = store.write('nested/file.json','{"fixture":true}\n'); assert.equal(fs.statSync(saved).mode & 0o777, 0o600);
  assert.throws(() => store.write('nested/file.json','overwrite')); assert.equal(store.read('nested/file.json'),'{"fixture":true}\n');
  const outside = path.join(temp,'outside'); fs.mkdirSync(outside); fs.symlinkSync(outside,path.join(root,'link'));
  assert.throws(() => store.write('link/escape.json','x')); assert.equal(fs.readdirSync(outside).length,0);
  fs.symlinkSync(outside,path.join(root,'file-link')); assert.throws(() => store.write('file-link','x',{ replace: true }));
  fs.symlinkSync(path.join(repo,'public'),path.join(temp,'root-link')); assert.throws(() => createPrivateStore({ root: path.join(temp,'root-link'), repoRoot: repo }));
  store.appendLedger('pilot.jsonl',{ status:'fixture', sequence:1 }); store.appendLedger('pilot.jsonl',{ status:'fixture', sequence:2 });
  assert.equal(store.ledger('pilot.jsonl').length,2); store.write('partial.jsonl','{"status":',{ replace:true }); assert.throws(() => store.ledger('partial.jsonl'));
});
test('dry-run planner blocks missing/stale/ambiguous Carbon catalog, unsafe caps and credentials', () => {
  const config = { ...DEFAULT_PLAN, courseKey:'class1-water', mode:'rapid-swipe' };
  assert.equal(planPilot(config).status,'blocked-awaiting-fresh-direct-google-carbon-catalog'); assert.equal(planPilot(config).callsMade,0);
  for (const patch of [{ dryRun:false }, { maxItems:1000 }, { batchSize:100 }, { maxSpendUSD:100 }, { maxRetries:10 }, { courseKey:'309a' }, { apiKey:'fixture-not-a-real-key' }]) assert.throws(() => planPilot({ ...config, ...patch }));
  const catalog = catalogFixture(); const now='2026-11-12T01:00:00Z'; assert.equal(selectCarbon(catalog,now).name,'models/carbon-fixture');
  assert.throws(() => selectCarbon(catalog,'2026-11-14T01:00:00Z'));
  catalog.response.models.push({ ...catalog.response.models[0], name:'models/carbon-fixture-other' }); catalog.responseHash=hash(catalog.response); assert.throws(() => selectCarbon(catalog,now));
});
test('bounded pilot ledger reservations resume with spend, retry, completion and unresolved-call caps', () => {
  const config={ ...DEFAULT_PLAN, courseKey:'class1-water', mode:'rapid-swipe' }; const catalog=catalogFixture();
  const pricing={ modelName:'models/carbon-fixture', inputUSDPerMillion:1, outputUSDPerMillion:2, evidence:{ locator:'https://example.test/synthetic-pricing', sha256:hash('fixture price evidence'), summary:'Synthetic test rates; not live prices.' } };
  const options={ catalog, pricing, now:'2026-11-12T01:00:00Z' };
  const plan=planPilot(config,options); assert.equal(plan.reservation.reservedSpendMicros,28000); assert.equal(plan.batches.reduce((n,b)=>n+b.items,0),6);
  const event=plan.reservation;
  assert.equal(planPilot(config,{ ...options, events:[event] }).status,'blocked-unresolved-reservation');
  const fail={ ...event, status:'failed' }; const events=[event,fail]; const retry=planPilot(config,{ ...options, events }).reservation; assert.equal(retry.attempt,2);
  events.push(retry,{ ...retry, status:'failed' }); assert.notEqual(planPilot(config,{ ...options, events }).reservation.batchId,event.batchId);
  assert.throws(() => planPilot(config,{ ...options, events:[{ ...event, configHash:hash('wrong') }] }));
  assert.throws(() => planPilot(config,{ ...options, pricing:{ ...pricing, outputUSDPerMillion:3 }, events:[event] }));
  assert.equal(planPilot({ ...config,maxSpendUSD:0.001 },options).status,'blocked-budget-or-retry-cap');
  assert.throws(() => planPilot(config,{ ...options, events:[{ ...event,status:'completed' }] }));
  const successful = [];
  for (let i = 0; i < plan.batches.length; i++) {
    const next = planPilot(config, { ...options, events: successful }).reservation;
    assert.ok(next); successful.push(next, { ...next, status: 'completed' });
  }
  assert.equal(planPilot(config, { ...options, events: successful }).status, 'completed');
  assert.equal(planPilot(config, { ...options, events: successful }).reservation, null);
});
test('versioned schema refuses unknown versions and unknown review fields instead of accepting humanApproved', () => {
  const doc=completeFixture(); assert.equal(DocumentSchema.safeParse(doc).success,true);
  doc.schemaVersion='future-unknown'; assert.equal(DocumentSchema.safeParse(doc).success,false);
  const valid=completeFixture(); attachReview(valid,'ai'); valid.exercises[0].reviews[0].humanApproved=true;
  assert.equal(DocumentSchema.safeParse(valid).success,false);
});

test('authority source excerpt changes invalidate bound reviews even when separate from exercise citations', () => {
  const doc = completeFixture(); const source = structuredClone(doc.sources[0]); source.sourceId = 'fixture-authority-source'; doc.sources.push(source);
  doc.exercises[0].authorityEvidence = [{ sourceId: source.sourceId, evidenceId: 'fixture-evidence', jurisdiction: 'fixture-jurisdiction', effectiveAt: '2026-11-12T00:00:00Z' }];
  attachReview(doc, 'human-technical'); assert.equal(reviewState(doc.exercises[0], doc, 'human-technical'), true);
  source.evidence[0].excerpt = 'Changed authority statement.'; assert.equal(reviewState(doc.exercises[0], doc, 'human-technical'), false);
});
test('imports have no filesystem writes or network calls, and CLI rejects absolute public output', () => {
  const code = `import fs from 'node:fs'; import net from 'node:net'; import { syncBuiltinESMExports } from 'node:module';
    for (const name of ['writeFileSync','mkdirSync','renameSync','linkSync','unlinkSync']) fs[name] = () => { throw Error('import-write-denied'); };
    const open = fs.openSync; fs.openSync = (file, flags, ...rest) => { if (flags !== 'r' && flags !== 0) throw Error('import-write-open-denied'); return open(file, flags, ...rest); };
    net.connect = () => { throw Error('import-network-denied'); }; globalThis.fetch = () => { throw Error('import-fetch-denied'); }; syncBuiltinESMExports();
    for (const name of ['constants','schemas','identity','calculations','coverage','inventory','planner','storage','fixtures','cli']) await import('./scripts/content-engine/' + name + '.mjs');`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const denied = spawnSync(process.execPath, ['scripts/content-engine/cli.mjs', 'plan-default', path.join(repoRoot, 'client/public/authoring-denied-fixture.json')], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(denied.status, 1); assert.equal(fs.existsSync(path.join(repoRoot, 'client/public/authoring-denied-fixture.json')), false);
});

test('risk policy is strictly opt-in; AI only and AI plus software without a batch audit stay blocked', () => {
  const doc = completeFixture(); attachReview(doc, 'ai');
  assert.equal(cell(doc).releasableAccepted, 0);
  const aiOnly = completeFixture(); attachPolicyReviews(aiOnly);
  aiOnly.exercises[0].reviews = aiOnly.exercises[0].reviews.filter(r => r.kind !== 'software-release');
  attachBatchAudit(aiOnly); assert.equal(cell(aiOnly).releasableAccepted, 0);
  assert.ok(blockers(aiOnly.exercises[0], aiOnly).includes('software-release-review-missing-or-stale'));
  const opted = completeFixture(); attachPolicyReviews(opted);
  assert.ok(blockers(opted.exercises[0], opted).includes('batch-audit-authorization-missing-or-stale'));
  assert.equal(cell(opted).releasableAccepted, 0);
  attachBatchAudit(opted); delete opted.reviewPolicy;
  assert.equal(cell(opted).releasableAccepted, 0);
  opted.reviewPolicy = { policyVersion: REVIEW_POLICY_VERSION, enabled: false };
  assert.equal(DocumentSchema.safeParse(opted).success, false);
  opted.reviewPolicy = { policyVersion: 'future-unapproved', enabled: true };
  assert.equal(DocumentSchema.safeParse(opted).success, false);
});
test('explicit sampled batch authorizes ordinary concepts without marking any member human reviewed', () => {
  const doc = completeFixture();
  const second = structuredClone(doc.exercises[0]); second.exerciseId = 'fixture-second'; second.item.id = 'fixture-second';
  second.item.prompt = 'Identify a different described concept.'; second.contentHash = hash(second.item);
  second.variantFamilyId = 'fixture-family-second';
  doc.concepts[0].variantFamilies.push({ variantFamilyId: second.variantFamilyId, intent: 'Synthetic distinct concept', parameterDefinitions: {} });
  doc.exercises.push(second);
  for (const e of doc.exercises) attachPolicyReviews(doc, e);
  const audit = attachBatchAudit(doc, [doc.exercises[0]]);
  assert.equal(audit.sampledMembers.length, 1); assert.equal(audit.members.length, 2);
  for (const e of doc.exercises) assert.deepEqual(blockers(e, doc), []);
  const row = cell(doc); assert.equal(row.AIreviewed, 2); assert.equal(row.humanReviewed, 0);
  assert.equal(row.riskPolicyAccepted, 2); assert.equal(row.releasableAccepted, 2);
  assert.equal(coverage(doc).reviewPolicyVersion, REVIEW_POLICY_VERSION);
  assert.ok(coverage(doc).notice.includes('not authenticated'));
});
test('safety, statutory, field practice and operating instructions cannot bypass per-item human gates', () => {
  for (const claimType of ['safety', 'statutory', 'field-practice']) {
    const doc = completeFixture(); const e = doc.exercises[0]; e.claimType = claimType;
    e.authorityEvidence = [{ ...e.sourceEvidenceRefs[0], jurisdiction: e.jurisdiction, effectiveAt: '2026-11-12T00:00:00Z' }];
    attachPolicyReviews(doc); attachBatchAudit(doc);
    assert.ok(blockers(e, doc).includes('risk-policy-per-item-human-required'));
    assert.equal(cell(doc).releasableAccepted, 0);
    attachReview(doc, 'human-technical'); assert.equal(cell(doc).humanReviewed, 1);
    assert.equal(cell(doc).releasableAccepted, 1); assert.equal(cell(doc).riskPolicyAccepted, 0);
  }
  for (const patch of [{ instruction: 'Use this procedure.' }, { prompt: 'Operate the pump using these steps.' }, { prompt: 'OSHA regulation requires a permit.' }]) {
    const doc = completeFixture(); Object.assign(doc.exercises[0].item, patch); doc.exercises[0].contentHash = hash(doc.exercises[0].item);
    attachPolicyReviews(doc); attachBatchAudit(doc); assert.equal(cell(doc).releasableAccepted, 0);
    if (patch.prompt?.includes('OSHA')) assert.ok(blockers(doc.exercises[0], doc).includes('existing-statutory-safety-release-screen-blocked'));
  }
});
test('risk policy rejects stale payload, sources, blueprint, review evidence and corpus duplicate bindings', () => {
  const mutations = [d => d.exercises[0].item.explanation = 'Changed explanation.',
    d => d.sources[0].evidence[0].excerpt = 'Changed source.', d => d.exercises[0].blueprintVersion = 'changed',
    d => d.exercises[0].reviews[0].independentAI.correctnessEvidence.summary = 'Changed review evidence.',
    d => { const e = structuredClone(d.exercises[0]); e.exerciseId = 'new-duplicate'; d.exercises.push(e); }];
  for (const mutate of mutations) {
    const doc = completeFixture(); attachPolicyReviews(doc); attachBatchAudit(doc);
    assert.equal(cell(doc).releasableAccepted, 1); mutate(doc); doc.exercises[0].contentHash = hash(doc.exercises[0].item);
    assert.ok(blockers(doc.exercises[0], doc).includes('batch-audit-authorization-missing-or-stale'));
    assert.equal(cell(doc).releasableAccepted, 0);
  }
});
test('batch authorization needs explicit sample, calibration, source, blueprint and duplicate evidence', () => {
  const mutations = [a => a.sampledMembers = [], a => a.sampledMembers[0].exerciseId = 'not-a-member',
    a => a.unresolvedFindings = ['Unresolved correctness finding'], a => a.status = 'rejected',
    a => a.calibrationEvidence = null, a => a.sourceCheckEvidence = null,
    a => a.blueprintAlignmentEvidence = null, a => a.duplicateCheckEvidence = null,
    a => a.members[0].reviewBindingsHash = hash('stale'), a => a.scope = 'every-item-human-reviewed'];
  for (const mutate of mutations) {
    const doc = completeFixture(); attachPolicyReviews(doc); const audit = attachBatchAudit(doc); mutate(audit);
    assert.ok(blockers(doc.exercises[0], doc).includes('batch-audit-authorization-missing-or-stale'));
  }
});
test('independent AI declarations need distinct identity and all explicit review checks', () => {
  for (const mutate of [r => r.independentAI.generatorIdentity = r.reviewer, r => delete r.independentAI,
    r => delete r.policyVersion, r => delete r.independentAI.sourceCheckEvidence,
    r => delete r.independentAI.blueprintAlignmentEvidence, r => delete r.independentAI.duplicateCheckEvidence,
    r => delete r.independentAI.correctnessEvidence, r => delete r.independentAI.independenceEvidence]) {
    const doc = completeFixture(); attachPolicyReviews(doc); mutate(doc.exercises[0].reviews[0]); attachBatchAudit(doc);
    assert.ok(blockers(doc.exercises[0], doc).length > 0);
  }
});
test('rejected human decisions cannot be hidden by opt-in batch policy and rejected audits cannot be shadowed', () => {
  const doc = completeFixture(); attachPolicyReviews(doc); attachReview(doc, 'human-technical');
  doc.exercises[0].reviews.find(r => r.kind === 'human-technical').status = 'rejected'; attachBatchAudit(doc);
  assert.ok(blockers(doc.exercises[0], doc).includes('human-technical-review-missing-or-stale'));
  const other = completeFixture(); attachPolicyReviews(other); const audit = attachBatchAudit(other);
  other.batchAudits.push({ ...structuredClone(audit), batchId: 'rejected-batch', status: 'rejected' });
  assert.equal(cell(other).releasableAccepted, 0);
});
test('offline payload schema matches the new shared pure wire-schema exports without loading the server', () => {
  const code = `import assert from 'node:assert/strict';
    import { interactiveDrillExampleSchema } from './shared/interactiveSessions.ts';
    import { PayloadSchema, payloadIssues } from './scripts/content-engine/schemas.mjs';
    import { payload } from './scripts/content-engine/fixtures.mjs';
    import { MODES } from './scripts/content-engine/constants.mjs';
    for (const mode of MODES) {
      const item = payload(mode);
      for (const candidate of [item, { ...item, surprise: true }, { ...item, id: '../invalid' }, { ...item, prompt: '' }])
        assert.equal(PayloadSchema.safeParse(candidate).success, interactiveDrillExampleSchema.safeParse(candidate).success);
      assert.deepEqual(payloadIssues(item, interactiveDrillExampleSchema), []);
    }`;
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
