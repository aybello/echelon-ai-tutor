import test from 'node:test';
import assert from 'node:assert/strict';
import { VERSION } from './constants.mjs';
import { hash, subjectHash } from './identity.mjs';
import { DocumentSchema, ReviewSchema, ReviewPolicySchema, REVIEW_POLICY_VERSION } from './schemas.mjs';
import { coverage, blockers, reviewState, metadataIssues } from './coverage.mjs';
import { completeFixture, attachReview, attachPolicyReviews, attachBatchAudit } from './fixtures.mjs';
import { OWNER_AI_OIT_POLICY_VERSION, ownerPolicyBindingHash, ownerSourceBindingsHash, ownerDuplicateContextHash } from './review-policy.mjs';

// All approvals and documentary evidence below are synthetic behavior-test data.
// None asserts review, owner authorization or correctness of any real OIT content.
const evidence = name => ({ locator: `fixture-only/${name}`, sha256: hash(`synthetic-only ${name}`), summary: 'Synthetic software-test evidence, not an actual owner authorization or technical review.' });
const policy = () => ({ policyVersion: OWNER_AI_OIT_POLICY_VERSION, enabled: true,
  ownerAuthorization: { reviewAuthority: 'owner-policy-declared', owner: 'father', authorizedAt: '2026-11-13T19:00:00Z',
    scopeCourseKeys: ['oit', 'oit-ww'], evidence: evidence('owner-authorization') } });
function fixture(courseKey = 'oit') {
  const doc = completeFixture(); doc.reviewPolicy = policy();
  doc.exercises[0].courseKey = courseKey;
  doc.concepts[0].applicability[0].courseKey = courseKey;
  doc.exercises[0].blueprintVersion = 'synthetic-supplementary-not-official';
  doc.concepts[0].applicability[0].blueprintVersion = doc.exercises[0].blueprintVersion;
  doc.exercises[0].difficultyRationale = 'Synthetic AI-estimated recall difficulty, not calibrated exam difficulty.';
  return doc;
}
function ownerReview(doc, exercise, kind, reviewer = 'gpt-6.1-sol') {
  const review = { schemaVersion: VERSION, kind, status: 'approved',
    reviewer: kind === 'software-release' ? 'Synthetic offline software check' : reviewer,
    reviewerAuthority: kind === 'software-release' ? 'software-release-declared' : 'ai-model-declared',
    authorityEvidence: evidence(`${kind}-authority`), reviewedAt: '2026-11-13T19:01:00Z',
    payloadHash: hash(exercise.item), subjectHash: subjectHash(exercise, doc), evidence: [evidence(`${kind}-decision`)],
    policyVersion: OWNER_AI_OIT_POLICY_VERSION, policyBindingHash: ownerPolicyBindingHash(doc) };
  if (kind !== 'software-release') review.independentAI = {
    generatorIdentity: 'gemini-4-argon', riskScope: 'routine-non-operational-concept',
    independenceEvidence: evidence('independence'), correctnessEvidence: evidence('correctness'),
    sourceCheckEvidence: evidence('source-check'), blueprintAlignmentEvidence: evidence('supplementary-blueprint'),
    duplicateCheckEvidence: evidence('duplicate-check'), sourceBindingsHash: ownerSourceBindingsHash(exercise, doc),
    duplicateContextHash: ownerDuplicateContextHash(exercise, doc),
  };
  exercise.reviews.push(review); return review;
}
function bindAll(doc, diversity = false, reviewer = 'gpt-6.1-sol') {
  for (const e of doc.exercises) {
    e.contentHash = hash(e.item);
    ownerReview(doc, e, 'ai', reviewer); ownerReview(doc, e, 'software-release');
    if (diversity) ownerReview(doc, e, 'coverage-diversity', reviewer);
  }
  return doc;
}
const row = (doc, courseKey = doc.exercises[0].courseKey) => coverage(doc).rows.find(r => r.courseKey === courseKey && r.mode === 'rapid-swipe');
function familyFixture() {
  const doc = fixture(); const second = structuredClone(doc.exercises[0]);
  second.exerciseId = 'synthetic-distinct'; second.item.id = 'synthetic-distinct';
  second.item.prompt = 'Identify a separately described scientific concept.';
  doc.exercises[0].parameters = { value: '1' }; second.parameters = { value: '2' };
  doc.exercises.push(second); return doc;
}

test('owner-policy tests require preloaded safety guard and a credential-free environment', () => {
  assert.equal(globalThis.__echelonTestSafetyInstalled, true);
  for (const name of ['DATABASE_URL', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'NODE_ENV']) assert.equal(process.env[name], undefined);
});

test('owner policy is strict, exact-scope, documentary and explicitly not human technical authorization', () => {
  assert.equal(ReviewPolicySchema.safeParse(policy()).success, true);
  for (const mutate of [p => delete p.ownerAuthorization, p => p.enabled = false,
    p => p.ownerAuthorization.owner = 'another-owner', p => p.ownerAuthorization.reviewAuthority = 'human-technical-declared',
    p => p.ownerAuthorization.authorizedAt = '2025-11-13T19:00:00Z', p => p.ownerAuthorization.authorizedAt = '2026-11-12T19:00:00Z',
    p => p.ownerAuthorization.scopeCourseKeys = ['oit'], p => p.ownerAuthorization.scopeCourseKeys = ['oit', 'oit-ww', 'class1-water'],
    p => p.ownerAuthorization.scopeCourseKeys = ['oit', 'oit'], p => p.ownerAuthorization.scopeCourseKeys.reverse(),
    p => p.ownerAuthorization.evidence.sha256 = 'not-a-hash', p => p.ownerAuthorization.evidence.locator = '',
    p => p.ownerAuthorization.humanApproved = true, p => p.policyVersion = 'future-unapproved']) {
    const candidate = policy(); mutate(candidate); assert.equal(ReviewPolicySchema.safeParse(candidate).success, false);
  }
});

test('both OIT courses and both allowed independent reviewers pass without inventing human review or batch audit', () => {
  for (const courseKey of ['oit', 'oit-ww']) for (const reviewer of ['gpt-6.1-sol', 'gemini-4-carbon']) {
    const doc = bindAll(fixture(courseKey), false, reviewer); const e = doc.exercises[0];
    assert.equal(DocumentSchema.safeParse(doc).success, true);
    assert.deepEqual(metadataIssues(e, doc), []); assert.deepEqual(blockers(e, doc), []);
    const r = row(doc); assert.equal(r.releasableAccepted, 1); assert.equal(r.ownerAIpolicyAccepted, 1);
    assert.equal(r.AIreviewed, 1); assert.equal(r.humanReviewed, 0); assert.equal(r.riskPolicyAccepted, 0);
    assert.equal(doc.batchAudits, undefined); assert.equal(e.reviews.some(r => r.kind === 'human-technical'), false);
    assert.match(coverage(doc).notice, /Owner policy authorization is not human technical/);
  }
});

test('new policy remains opt-in and cannot bypass the previous conservative or sampled batch gates', () => {
  const doc = bindAll(fixture()); delete doc.reviewPolicy;
  assert.ok(blockers(doc.exercises[0], doc).includes('human-technical-review-missing-or-stale'));
  assert.equal(reviewState(doc.exercises[0], doc, 'ai'), false); assert.equal(row(doc).releasableAccepted, 0);
  const conservative = completeFixture(); attachReview(conservative, 'ai'); attachReview(conservative, 'software-release');
  assert.equal(row(conservative).releasableAccepted, 0);
  const risk = completeFixture(); attachPolicyReviews(risk); assert.equal(row(risk).releasableAccepted, 0);
  attachBatchAudit(risk); assert.equal(row(risk).releasableAccepted, 1); assert.equal(row(risk).riskPolicyAccepted, 1);
  assert.equal(row(risk).humanReviewed, 0); assert.equal(coverage(risk).reviewPolicyVersion, REVIEW_POLICY_VERSION);
});

test('course, claim, originality, legacy and actionable operating/safety/statutory gates remain closed', () => {
  const mutations = [d => { d.exercises[0].courseKey = 'class1-water'; d.concepts[0].applicability[0].courseKey = 'class1-water'; },
    ...['field-practice', 'statutory', 'safety', 'unclassified'].map(claim => d => d.exercises[0].claimType = claim),
    ...['unverified', 'prohibited-exam-copy'].map(value => d => d.exercises[0].originality = value),
    d => d.exercises[0].legacy = { packageVersion: 'synthetic', packageHash: hash('fixture'), softwareStatus: 'approved', aiReviewDeclared: true, notice: 'Synthetic only', provenanceRefs: [] },
    d => d.exercises[0].item.instruction = 'Consider this procedure.',
    ...['Operate the pump.', 'Adjust the valve.', 'The valve must be closed.', 'Use a setpoint of 10.', 'Apply dosing at 2 mg/L.',
      'Emergency rescue sequence.', 'OSHA regulation requires a permit.', 'Confined space lockout.'].map(prompt => d => d.exercises[0].item.prompt = prompt)];
  for (const mutate of mutations) {
    const doc = fixture(); mutate(doc); bindAll(doc); assert.ok(blockers(doc.exercises[0], doc).length > 0);
    assert.equal(row(doc).releasableAccepted, 0);
  }
  const legal = fixture(); legal.exercises[0].item.prompt = 'OSHA regulation requires a permit.'; bindAll(legal);
  assert.ok(blockers(legal.exercises[0], legal).includes('existing-statutory-safety-release-screen-blocked'));
});

test('generic operation and mathematical must do not become operating instructions in the new route', () => {
  const doc = fixture(); doc.exercises[0].item.prompt = 'In this mathematical operation, the denominator must be positive.';
  bindAll(doc); assert.deepEqual(blockers(doc.exercises[0], doc), []);
  const risk = completeFixture(); risk.exercises[0].item.prompt = doc.exercises[0].item.prompt;
  risk.exercises[0].contentHash = hash(risk.exercises[0].item); attachPolicyReviews(risk); attachBatchAudit(risk);
  assert.ok(blockers(risk.exercises[0], risk).includes('risk-policy-per-item-human-required'));
});

test('all identity, policy-version and independent-check fields are required and cannot self-review', () => {
  for (const mutate of [r => r.reviewer = 'gemini-4-argon', r => r.reviewer = 'gpt-6.1-sol-alias',
    r => r.independentAI.generatorIdentity = r.reviewer, r => r.independentAI.generatorIdentity = 'Synthetic generator',
    r => r.reviewerAuthority = 'human-technical-declared', r => r.authorityEvidence = null,
    r => delete r.policyVersion, r => delete r.policyBindingHash, r => delete r.independentAI,
    ...['independenceEvidence', 'correctnessEvidence', 'sourceCheckEvidence', 'blueprintAlignmentEvidence', 'duplicateCheckEvidence',
      'sourceBindingsHash', 'duplicateContextHash'].map(field => r => delete r.independentAI[field]),
    r => r.independentAI.riskScope = 'operational']) {
    const doc = bindAll(fixture()); mutate(doc.exercises[0].reviews[0]); assert.ok(blockers(doc.exercises[0], doc).length > 0);
  }
  const human = bindAll(fixture()); human.exercises[0].reviews[0].kind = 'human-technical';
  assert.equal(ReviewSchema.safeParse(human.exercises[0].reviews[0]).success, false);
});

test('policy, payload, source and duplicate context edits make provided decisions stale', () => {
  for (const mutate of [d => d.reviewPolicy.ownerAuthorization.evidence.sha256 = hash('changed owner evidence'),
    d => d.reviewPolicy.ownerAuthorization.evidence.summary = 'Changed synthetic authorization.',
    d => d.exercises[0].item.explanation = 'Changed explanation.', d => d.exercises[0].difficulty = 'hard',
    d => d.exercises[0].objectiveId = 'changed', d => d.exercises[0].blueprintVersion = 'changed',
    d => d.sources[0].evidence[0].excerpt = 'Changed source fact.', d => d.sources[0].rightsBasis = 'Changed rights.',
    d => d.sources[0].snapshotHash = hash('changed snapshot'), d => d.concepts[0].facts[0].statement = 'Changed scientific fact.',
    d => d.exercises[0].reviews[0].independentAI.sourceBindingsHash = hash('invented binding'),
    d => d.exercises[0].reviews[0].independentAI.duplicateContextHash = hash('invented context'),
    d => { const e = structuredClone(d.exercises[0]); e.exerciseId = 'additional-context'; e.item.id = e.exerciseId; e.item.prompt = 'New distinct corpus member.'; d.exercises.push(e); }]) {
    const doc = bindAll(fixture()); assert.deepEqual(blockers(doc.exercises[0], doc), []); mutate(doc);
    doc.exercises[0].contentHash = hash(doc.exercises[0].item);
    assert.ok(blockers(doc.exercises[0], doc).length > 0); assert.equal(reviewState(doc.exercises[0], doc, 'ai'), false);
  }
});

test('source binding resolves actual unique source evidence rather than trusting arbitrary hashes or prose', () => {
  const doc = fixture(); assert.equal(typeof ownerSourceBindingsHash(doc.exercises[0], doc), 'string');
  for (const mutate of [d => d.sources = [], d => d.sources.push(structuredClone(d.sources[0])),
    d => d.sources[0].evidence = [], d => d.sources[0].evidence.push(structuredClone(d.sources[0].evidence[0])),
    d => d.sources[0].evidence[0].snapshotHash = hash('wrong'), d => d.sources[0].permittedUsage = [],
    d => d.concepts = []]) {
    const changed = fixture(); mutate(changed); assert.equal(ownerSourceBindingsHash(changed.exercises[0], changed), null);
  }
  const first = ownerDuplicateContextHash(doc.exercises[0], doc); bindAll(doc);
  assert.equal(ownerDuplicateContextHash(doc.exercises[0], doc), first);
});

test('source rights, applicability, payload content hash and calculation checks remain mandatory', () => {
  for (const mutate of [d => d.sources[0].rightsBasis = null, d => d.sources[0].retrievedAt = null,
    d => d.sources[0].permittedUsage = [], d => d.concepts[0].applicability[0].objectiveId = 'different-objective',
    d => d.exercises[0].contentHash = hash('wrong payload'), d => d.exercises[0].calculationChecks = [{
      schemaVersion: 'calculation-v1', expression: { op: 'quantity', value: { numerator: '1', denominator: '1' }, unit: 'mg' },
      expected: { value: { numerator: '1', denominator: '1' }, unit: 'L' }, rounding: { mode: 'half-away-from-zero', decimalPlaces: 2 },
    }]]) {
    const doc = bindAll(fixture()); mutate(doc); assert.ok(metadataIssues(doc.exercises[0], doc).length > 0);
    assert.ok(blockers(doc.exercises[0], doc).length > 0);
  }
});

test('a passing review cannot shadow any rejected, pending, stale or wrong-version supplied decision', () => {
  for (const kind of ['ai', 'software-release', 'coverage-diversity', 'human-technical']) {
    for (const status of ['rejected', 'pending', 'stale']) {
      const doc = bindAll(fixture(), true); const e = doc.exercises[0];
      if (kind === 'human-technical') attachReview(doc, kind);
      const negative = structuredClone(e.reviews.find(r => r.kind === kind));
      if (status === 'stale') negative.subjectHash = hash('stale'); else negative.status = status;
      e.reviews.unshift(negative); assert.ok(blockers(e, doc).length > 0); assert.equal(row(doc).releasableAccepted, 0);
    }
  }
  const doc = bindAll(fixture()); const wrong = structuredClone(doc.exercises[0].reviews[0]);
  wrong.policyVersion = REVIEW_POLICY_VERSION; doc.exercises[0].reviews.push(wrong);
  assert.ok(blockers(doc.exercises[0], doc).length > 0);
  const audited = bindAll(fixture()); attachBatchAudit(audited);
  assert.ok(blockers(audited.exercises[0], audited).includes('owner-ai-existing-batch-audit-not-applicable'));
});

test('near duplicate families need actual bound AI diversity evidence under the new policy only', () => {
  const doc = bindAll(familyFixture()); assert.equal(row(doc).quarantined, 2);
  for (const e of doc.exercises) ownerReview(doc, e, 'coverage-diversity');
  const result = row(doc); assert.equal(result.nearDuplicateFlagged, 2); assert.equal(result.quarantined, 0);
  assert.equal(result.releasableAccepted, 2); assert.equal(result.ownerAIpolicyAccepted, 2); assert.equal(result.humanReviewed, 0);
  delete doc.reviewPolicy; assert.equal(row(doc).quarantined, 2); assert.equal(row(doc).releasableAccepted, 0);
});

test('AI diversity cannot inflate identical parameters, duplicate problems, conflicting answers or duplicate IDs', () => {
  for (const mutate of [d => d.exercises[1].parameters = structuredClone(d.exercises[0].parameters),
    d => d.exercises[1].item.prompt = d.exercises[0].item.prompt,
    d => { d.exercises[1].item.prompt = d.exercises[0].item.prompt; d.exercises[1].item.correctAnswer = false; },
    d => d.exercises[1].exerciseId = d.exercises[0].exerciseId]) {
    const doc = familyFixture(); mutate(doc); bindAll(doc, true);
    assert.equal(row(doc).releasableAccepted, 0); assert.equal(row(doc).quarantined, 2);
  }
});

test('AI diversity from another policy, identity or stale source context is never accepted', () => {
  for (const mutate of [r => r.reviewerAuthority = 'human-diversity-declared', r => r.reviewer = 'gemini-4-argon',
    r => r.independentAI.sourceBindingsHash = hash('stale sources'), r => r.independentAI.duplicateContextHash = hash('stale context'),
    r => r.policyBindingHash = hash('stale owner policy'), r => r.status = 'rejected']) {
    const doc = bindAll(familyFixture(), true); mutate(doc.exercises[0].reviews.find(r => r.kind === 'coverage-diversity'));
    assert.equal(reviewState(doc.exercises[0], doc, 'coverage-diversity'), false);
    assert.ok(blockers(doc.exercises[0], doc).length > 0);
    if (DocumentSchema.safeParse(doc).success) assert.ok(row(doc).quarantined > 0);
    else assert.throws(() => coverage(doc));
  }
  const risk = completeFixture(); attachPolicyReviews(risk);
  const owner = bindAll(fixture(), true); risk.exercises[0].reviews.push(owner.exercises[0].reviews.find(r => r.kind === 'coverage-diversity'));
  assert.equal(reviewState(risk.exercises[0], risk, 'coverage-diversity'), false);
});
