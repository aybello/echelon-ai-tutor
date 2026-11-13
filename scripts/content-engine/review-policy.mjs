import { BatchAuditSchema, REVIEW_POLICY_VERSION, ReviewPolicySchema } from './schemas.mjs';
import { hash, identity, subjectHash } from './identity.mjs';

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
