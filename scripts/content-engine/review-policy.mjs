import { BatchAuditSchema, REVIEW_POLICY_VERSION, ReviewPolicySchema, OwnerAIReviewPolicySchema,
  OWNER_AI_OIT_POLICY_VERSION, ReviewSchema, SourceSchema, ConceptSchema } from './schemas.mjs';
import { hash, identity, subjectHash } from './identity.mjs';

export { OWNER_AI_OIT_POLICY_VERSION };
export const DEFAULT_REVIEW_POLICY_VERSION = 'conservative-per-item-v1';
const key = e => `${e.courseKey}/${e.exerciseId}`;
export function auditBinding(exercise, document) {
  return { courseKey: exercise.courseKey, exerciseId: exercise.exerciseId, payloadHash: hash(exercise.item),
    subjectHash: subjectHash(exercise, document), reviewBindingsHash: hash(exercise.reviews) };
}
// Full corpus binding makes additions/removals, duplicate context and any review edits stale.
export function auditCorpusHash(document) {
  return hash(document.exercises.map(e => auditBinding(e, document)).sort((a, b) => key(a).localeCompare(key(b))));
}
export function routineRiskEligible(exercise) {
  // Deliberately narrow: field practice and operating instructions never use this path.
  const visible = JSON.stringify(exercise.item);
  return exercise.claimType === 'concept' && exercise.originality === 'original-practice' && exercise.legacy === null &&
    !exercise.item.instruction && !/\b(?:safety|statutory|operat(?:e|es|ing|ion|ional)|procedures?|instructions?|steps?|setpoints?|dos(?:e|ing)|start[ -]?up|shut[ -]?down|emergency|rescue|lockout|tagout|confined[ -]space|must|required|shall)\b/i.test(visible);
}
function ownerRoutineRiskEligible(exercise) {
  const visible = JSON.stringify(exercise.item);
  return exercise.claimType === 'concept' && exercise.originality === 'original-practice' && exercise.legacy === null &&
    !exercise.item.instruction &&
    !/\b(?:safety|statutory|operat(?:e|es|ing)|procedures?|instructions?|steps?|setpoints?|dos(?:e|ing)|start[ -]?up|shut[ -]?down|emergency|rescue|lockout|tagout|confined[ -]space)\b/i.test(visible) &&
    !/\b(?:must|shall|required\s+to)\s+(?:(?:be|not)\s+){0,2}(?:start(?:ed)?|stop(?:ped)?|adjust(?:ed)?|open(?:ed)?|clos(?:e|ed)|add(?:ed)?|mix(?:ed)?|feed|fed|discharg(?:e|ed)|isolat(?:e|ed)|disabl(?:e|ed)|overrid(?:e|den)|install(?:ed)?|servic(?:e|ed)|enter(?:ed)?)\b/i.test(visible) &&
    !/\b(?:start|stop|adjust|open|close|disable|override|isolate|service)\s+(?:(?:the|a|an)\s+)?(?:pump|valve|equipment|system|feed|pressure|flow)\b/i.test(visible);
}
export function ownerPolicyBindingHash(document) {
  return OwnerAIReviewPolicySchema.safeParse(document.reviewPolicy).success ? hash(document.reviewPolicy) : null;
}
export function ownerSourceBindingsHash(exercise, document) {
  const concepts = [];
  for (const conceptId of exercise.conceptRefs) {
    const found = document.concepts.filter(c => c.conceptId === conceptId);
    if (found.length !== 1 || !ConceptSchema.safeParse(found[0]).success) return null;
    concepts.push(found[0]);
  }
  const refs = [...exercise.sourceEvidenceRefs, ...exercise.authorityEvidence,
    ...concepts.flatMap(c => [...c.sourceEvidenceRefs, ...c.facts.flatMap(f => f.sourceEvidenceRefs)])];
  if (!refs.length) return null;
  const bindings = new Map();
  for (const ref of refs) {
    const sources = document.sources.filter(s => s.sourceId === ref.sourceId);
    if (sources.length !== 1 || !SourceSchema.safeParse(sources[0]).success) return null;
    const source = sources[0]; const found = source.evidence.filter(e => e.evidenceId === ref.evidenceId);
    if (!source.snapshotHash || !source.permittedUsage.includes('original-practice-derivation') ||
      found.length !== 1 || found[0].snapshotHash !== source.snapshotHash) return null;
    bindings.set(JSON.stringify([ref.sourceId, ref.evidenceId]), { sourceId: ref.sourceId, evidenceId: ref.evidenceId, source, evidence: found[0] });
  }
  return hash([...bindings.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, binding]) => binding));
}
// No review records: review edits cannot create a circular self-binding.
export function ownerDuplicateContextHash(exercise, document) {
  return hash(document.exercises.filter(e => e.courseKey === exercise.courseKey && e.mode === exercise.mode)
    .map(e => ({ courseKey: e.courseKey, exerciseId: e.exerciseId, mode: e.mode, ...identity(e.item),
      difficulty: e.difficulty, variantFamilyId: e.variantFamilyId, parametersHash: hash(e.parameters) }))
    .sort((a, b) => key(a).localeCompare(key(b)) || hash(a).localeCompare(hash(b))));
}
export function ownerAIReviewCurrent(exercise, document, review) {
  const policyHash = ownerPolicyBindingHash(document);
  if (!policyHash || !['oit', 'oit-ww'].includes(exercise.courseKey) || !ownerRoutineRiskEligible(exercise) ||
    !ReviewSchema.safeParse(review).success || !['ai', 'coverage-diversity'].includes(review.kind) ||
    review.status !== 'approved' || review.policyVersion !== OWNER_AI_OIT_POLICY_VERSION ||
    review.policyBindingHash !== policyHash || review.reviewerAuthority !== 'ai-model-declared' ||
    review.authorityEvidence === null || !['gpt-6.1-sol', 'gemini-4-carbon'].includes(review.reviewer) ||
    review.independentAI?.generatorIdentity !== 'gemini-4-argon' ||
    review.payloadHash !== hash(exercise.item) || review.subjectHash !== subjectHash(exercise, document)) return false;
  const sourcesHash = ownerSourceBindingsHash(exercise, document);
  return sourcesHash !== null && review.independentAI.sourceBindingsHash === sourcesHash &&
    review.independentAI.duplicateContextHash === ownerDuplicateContextHash(exercise, document);
}
function ownerPolicyBlockers(exercise, document, { reviewState }) {
  const issues = [];
  if (!['oit', 'oit-ww'].includes(exercise.courseKey) || !ownerRoutineRiskEligible(exercise)) issues.push('owner-ai-oit-per-item-human-required');
  const policyHash = ownerPolicyBindingHash(document);
  const ai = exercise.reviews.filter(r => r.kind === 'ai');
  if (!ai.length || !ai.every(r => ownerAIReviewCurrent(exercise, document, r))) issues.push('owner-ai-policy-review-missing-or-stale');
  const software = exercise.reviews.filter(r => r.kind === 'software-release');
  if (!reviewState(exercise, document, 'software-release') || !software.every(r =>
    r.policyVersion === OWNER_AI_OIT_POLICY_VERSION && r.policyBindingHash === policyHash)) issues.push('owner-ai-software-policy-binding-missing-or-stale');
  // Supplied negative/stale decisions are never replaced by this owner declaration.
  for (const kind of ['human-technical', 'coverage-diversity']) {
    if (exercise.reviews.some(r => r.kind === kind) && !reviewState(exercise, document, kind)) issues.push(`${kind}-review-missing-or-stale`);
  }
  // Existing risk-batch decisions are not authorized for reinterpretation by this route.
  if ((document.batchAudits ?? []).some(a => a.members?.some(m => key(m) === key(exercise)))) issues.push('owner-ai-existing-batch-audit-not-applicable');
  if (!duplicateClear(exercise, document, reviewState)) issues.push('owner-ai-duplicate-proof-unresolved');
  return issues;
}
function independentAIState(exercise, document, reviewState) {
  return reviewState(exercise, document, 'ai') && exercise.reviews.filter(r => r.kind === 'ai').every(r =>
    r.policyVersion === REVIEW_POLICY_VERSION && r.independentAI &&
    r.reviewer.trim().toLowerCase() !== r.independentAI.generatorIdentity.trim().toLowerCase());
}
function softwarePolicyState(exercise, document, reviewState) {
  return reviewState(exercise, document, 'software-release') && exercise.reviews.filter(r => r.kind === 'software-release').every(r => r.policyVersion === REVIEW_POLICY_VERSION);
}
function duplicateClear(exercise, document, reviewState) {
  const sameCell = document.exercises.filter(e => e.courseKey === exercise.courseKey && e.mode === exercise.mode);
  if (document.exercises.filter(e => key(e) === key(exercise)).length !== 1 ||
    sameCell.filter(e => identity(e.item).problemHash === identity(exercise.item).problemHash).length !== 1) return false;
  const family = sameCell.filter(e => e.variantFamilyId === exercise.variantFamilyId);
  if (family.length > 1 && (!family.every(e => reviewState(e, document, 'coverage-diversity')) ||
    family.filter(e => hash(e.parameters) === hash(exercise.parameters)).length !== 1)) return false;
  return true;
}
export function policyBlockers(exercise, document, { reviewState, metadataIssues }) {
  if (!ReviewPolicySchema.safeParse(document.reviewPolicy).success) return ['review-policy-not-enabled-or-invalid'];
  if (document.reviewPolicy.policyVersion === OWNER_AI_OIT_POLICY_VERSION) return ownerPolicyBlockers(exercise, document, { reviewState });
  const issues = [];
  if (!routineRiskEligible(exercise)) issues.push('risk-policy-per-item-human-required');
  if (!independentAIState(exercise, document, reviewState)) issues.push('independent-ai-policy-review-missing-or-stale');
  if (!softwarePolicyState(exercise, document, reviewState)) issues.push('software-policy-binding-missing-or-stale');
  if (!duplicateClear(exercise, document, reviewState)) issues.push('risk-policy-duplicate-proof-unresolved');
  const audits = (document.batchAudits ?? []).filter(a => a.members?.some(m => key(m) === key(exercise)));
  const corpusHash = auditCorpusHash(document);
  const currentAudit = a => {
    if (!BatchAuditSchema.safeParse(a).success || a.status !== 'approved' || a.unresolvedFindings.length || a.corpusHash !== corpusHash ||
      (document.batchAudits ?? []).filter(other => other.batchId === a.batchId).length !== 1) return false;
    const memberKeys = a.members.map(key); const sampleKeys = a.sampledMembers.map(key);
    if (new Set(memberKeys).size !== memberKeys.length || new Set(sampleKeys).size !== sampleKeys.length || !sampleKeys.every(k => memberKeys.includes(k))) return false;
    return a.members.every(binding => {
      const found = document.exercises.filter(e => key(e) === key(binding));
      if (found.length !== 1) return false;
      const e = found[0];
      return hash(binding) === hash(auditBinding(e, document)) && routineRiskEligible(e) && !metadataIssues(e, document).length &&
        independentAIState(e, document, reviewState) && softwarePolicyState(e, document, reviewState) && duplicateClear(e, document, reviewState) &&
        (!e.reviews.some(r => r.kind === 'human-technical') || reviewState(e, document, 'human-technical'));
    });
  };
  // All supplied decisions touching this member must remain current and approved.
  if (!audits.length || !audits.every(currentAudit)) issues.push('batch-audit-authorization-missing-or-stale');
  return issues;
}
