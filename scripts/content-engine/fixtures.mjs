import { VERSION } from './constants.mjs';
import { hash, subjectHash } from './identity.mjs';
import { stage } from './inventory.mjs';
import { REVIEW_POLICY_VERSION } from './schemas.mjs';
import { auditBinding, auditCorpusHash } from './review-policy.mjs';
export function payload(mode = 'rapid-swipe') {
  const base = { id: 'fixture-item', mode, prompt: 'Identify the described process.', explanation: 'Synthetic explanation for software tests only.' };
  if (mode === 'rapid-swipe') return { ...base, correctAnswer: true };
  if (mode === 'speed-match') return { ...base, pairs: ['a', 'b', 'c'].map(id => ({ id, left: `Term ${id}`, right: `Meaning ${id}` })) };
  if (mode === 'before-after') return { ...base, correctAnswer: 'before' };
  return { ...base, options: [{ id: 'a', label: 'Treatment' }, { id: 'b', label: 'Measurement' }], correctOptionId: 'a' };
}
export function completeFixture() {
  const doc = stage([{ courseKey: 'class1-water', version: 'fixture-v1', status: 'draft', examples: [payload()] }]);
  const e = doc.exercises[0];
  doc.sources = [{ schemaVersion: VERSION, sourceId: 'fixture-source', publisher: 'Synthetic publisher', title: 'Synthetic source',
    url: 'https://example.test/fixture', docLocator: 'Fixture section 1', retrievedAt: '2026-11-12T00:00:00Z',
    snapshotHash: hash('synthetic source bytes'), rightsBasis: 'Synthetic original test material, not a real authorization',
    permittedUsage: ['original-practice-derivation'], evidence: [{ evidenceId: 'fixture-evidence', locator: 'Section 1', excerpt: 'Synthetic fact.', snapshotHash: hash('synthetic source bytes') }] }];
  const refs = [{ sourceId: 'fixture-source', evidenceId: 'fixture-evidence' }];
  const applicability = { courseKey: e.courseKey, jurisdiction: 'fixture-jurisdiction', examLevel: 'fixture-level', blueprintVersion: 'fixture-blueprint', objectiveId: 'fixture-objective' };
  doc.concepts = [{ schemaVersion: VERSION, conceptId: 'fixture-concept', title: 'Synthetic concept',
    facts: [{ factId: 'fixture-fact', statement: 'Synthetic fact.', sourceEvidenceRefs: refs }], sourceEvidenceRefs: refs,
    applicability: [applicability], variantFamilies: [{ variantFamilyId: 'fixture-family', intent: 'Synthetic learning task', parameterDefinitions: { value: 'Synthetic rational value' } }] }];
  Object.assign(e, applicability, { conceptRefs: ['fixture-concept'], difficulty: 'easy', difficultyRationale: 'Synthetic one-step recall classification, not a real difficulty calibration.',
    variantFamilyId: 'fixture-family', sourceEvidenceRefs: refs, claimType: 'concept', originality: 'original-practice', legacy: null });
  return doc;
}
export function attachReview(doc, kind, exercise = doc.exercises[0]) {
  const authority = { ai: 'ai-model-declared', 'human-technical': 'human-technical-declared', 'software-release': 'software-release-declared', 'coverage-diversity': 'human-diversity-declared' };
  exercise.reviews.push({ schemaVersion: VERSION, kind, status: 'approved', reviewer: 'Synthetic declared reviewer',
    reviewerAuthority: authority[kind], authorityEvidence: kind === 'ai' ? null : { locator: 'fixture authority declaration', sha256: hash('fixture authority'), summary: 'Synthetic evidence only; no authenticated identity.' },
    reviewedAt: '2026-11-12T01:00:00Z', payloadHash: hash(exercise.item), subjectHash: subjectHash(exercise, doc),
    evidence: [{ locator: 'fixture review record', sha256: hash('fixture review'), summary: 'Synthetic bound decision for a software test, not human approval of real content.' }] });
  return exercise;
}
const syntheticEvidence = name => ({ locator: `fixture-only ${name}`, sha256: hash(`synthetic ${name}`), summary: 'Synthetic software-test evidence; no real audit, calibration, independence or authority is asserted.' });
export function attachPolicyReviews(doc, exercise = doc.exercises[0]) {
  doc.reviewPolicy = { policyVersion: REVIEW_POLICY_VERSION, enabled: true };
  attachReview(doc, 'ai', exercise); attachReview(doc, 'software-release', exercise);
  for (const review of exercise.reviews.filter(r => ['ai', 'software-release'].includes(r.kind))) review.policyVersion = REVIEW_POLICY_VERSION;
  exercise.reviews.find(r => r.kind === 'ai').independentAI = {
    generatorIdentity: 'Synthetic distinct generator', riskScope: 'routine-non-operational-concept',
    independenceEvidence: syntheticEvidence('independence'), correctnessEvidence: syntheticEvidence('correctness'),
    sourceCheckEvidence: syntheticEvidence('source check'), blueprintAlignmentEvidence: syntheticEvidence('blueprint'), duplicateCheckEvidence: syntheticEvidence('duplicate check'),
  };
  return exercise;
}
export function attachBatchAudit(doc, sampledExercises = [doc.exercises[0]]) {
  const audit = { schemaVersion: 'batch-audit-v1', policyVersion: REVIEW_POLICY_VERSION, batchId: 'synthetic-batch',
    status: 'approved', reviewer: 'Synthetic declared technical batch auditor', reviewerAuthority: 'human-technical-declared',
    authorityEvidence: syntheticEvidence('batch authority'), reviewedAt: '2026-11-12T02:00:00Z',
    scope: 'sampled-batch-not-per-item', corpusHash: auditCorpusHash(doc), members: doc.exercises.map(e => auditBinding(e, doc)),
    sampledMembers: sampledExercises.map(e => ({ courseKey: e.courseKey, exerciseId: e.exerciseId })),
    samplingMethod: 'Synthetic one-item sample for behavior tests; not real sampling authorization.',
    calibrationEvidence: syntheticEvidence('calibration'), findingsEvidence: syntheticEvidence('findings'),
    sourceCheckEvidence: syntheticEvidence('batch source check'), blueprintAlignmentEvidence: syntheticEvidence('batch blueprint'), duplicateCheckEvidence: syntheticEvidence('batch duplicate check'),
    unresolvedFindings: [],
  };
  doc.batchAudits = [audit];
  return audit;
}
export function catalogFixture() {
  const response = { models: [{ name: 'models/carbon-fixture', displayName: 'Carbon synthetic fixture', supportedGenerationMethods: ['generateContent'] }] };
  return { provider: 'direct-google', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', retrievedAt: '2026-11-12T00:00:00Z', response, responseHash: hash(response) };
}
