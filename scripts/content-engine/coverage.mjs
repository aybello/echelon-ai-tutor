import { COURSES, MODES, TARGET } from './constants.mjs';
import { DocumentSchema, ExerciseSchema, SourceSchema, ConceptSchema, ReviewSchema, payloadIssues } from './schemas.mjs';
import { hash, identity, subjectHash } from './identity.mjs';
import { checkCalculation } from './calculations.mjs';
import { legalScreen } from '../echelonsix-legal-screen.mjs';
import { policyBlockers, DEFAULT_REVIEW_POLICY_VERSION } from './review-policy.mjs';
const text = v => typeof v === 'string' && v.trim().length > 0;
const uniqueIds = (array, field) => new Set(array.map(x => x[field])).size === array.length;
const emptyDocument = () => ({ sources: [], concepts: [], exercises: [] });
function resolveRef(ref, document) {
  const sources = document.sources.filter(s => s.sourceId === ref.sourceId);
  if (sources.length !== 1) return false;
  const s = sources[0];
  if (!SourceSchema.safeParse(s).success || ![s.publisher, s.title, s.docLocator, s.retrievedAt, s.snapshotHash, s.rightsBasis].every(text) || !s.permittedUsage.includes('original-practice-derivation')) return false;
  const e = s.evidence.filter(e => e.evidenceId === ref.evidenceId);
  return e.length === 1 && e[0].snapshotHash === s.snapshotHash && (text(s.url) || text(s.docLocator));
}
export function metadataIssues(exercise, document = emptyDocument()) {
  const issues = [];
  if (!ExerciseSchema.safeParse(exercise).success) return ['exercise-schema-invalid'];
  issues.push(...payloadIssues(exercise.item));
  if (exercise.item.mode !== exercise.mode) issues.push('mode-mismatch');
  if (exercise.contentHash !== hash(exercise.item)) issues.push('content-hash-mismatch');
  if (exercise.difficulty === 'unclassified' || !text(exercise.difficultyRationale)) issues.push('difficulty-unmapped');
  if (![exercise.objectiveId, exercise.jurisdiction, exercise.examLevel, exercise.blueprintVersion, exercise.variantFamilyId].every(text)) issues.push('applicability-or-family-incomplete');
  if (exercise.claimType === 'unclassified') issues.push('claim-unclassified');
  if (exercise.originality !== 'original-practice') issues.push('original-practice-not-evidenced');
  if (!exercise.sourceEvidenceRefs.length || !exercise.sourceEvidenceRefs.every(r => resolveRef(r, document))) issues.push('source-evidence-or-rights-incomplete');
  if (!exercise.conceptRefs.length || new Set(exercise.conceptRefs).size !== exercise.conceptRefs.length) issues.push('concept-refs-incomplete');
  for (const ref of exercise.conceptRefs) {
    const found = document.concepts.filter(c => c.conceptId === ref);
    if (found.length !== 1 || !ConceptSchema.safeParse(found[0]).success) { issues.push('concept-missing-or-invalid'); continue; }
    const concept = found[0];
    if (![...concept.sourceEvidenceRefs, ...concept.facts.flatMap(f => f.sourceEvidenceRefs)].every(r => resolveRef(r, document))) issues.push('concept-source-evidence-incomplete');
    if (!concept.applicability.some(a => ['courseKey', 'jurisdiction', 'examLevel', 'blueprintVersion', 'objectiveId'].every(k => a[k] === exercise[k]))) issues.push('concept-applicability-mismatch');
    if (!concept.variantFamilies.some(f => f.variantFamilyId === exercise.variantFamilyId)) issues.push('concept-variant-family-mismatch');
  }
  if (exercise.calculationChecks.some(c => !checkCalculation(c).passed)) issues.push('calculation-check-failed');
  if (['statutory', 'safety'].includes(exercise.claimType) && (!exercise.authorityEvidence.length || exercise.authorityEvidence.some(e => e.jurisdiction !== exercise.jurisdiction || !resolveRef(e, document)))) issues.push('statutory-or-safety-authority-missing');
  return [...new Set(issues)];
}
const authorities = { ai: 'ai-model-declared', 'human-technical': 'human-technical-declared', 'software-release': 'software-release-declared', 'coverage-diversity': 'human-diversity-declared' };
export function reviewState(exercise, document, kind) {
  const reviews = exercise.reviews.filter(r => r.kind === kind);
  // A conflicting/rejected/stale review cannot be hidden by a later approved row.
  return reviews.length > 0 && reviews.every(r => ReviewSchema.safeParse(r).success && r.status === 'approved' && r.reviewerAuthority === authorities[kind] &&
    r.payloadHash === hash(exercise.item) && r.subjectHash === subjectHash(exercise, document) &&
    (kind === 'ai' || r.authorityEvidence !== null));
}
export function blockers(exercise, document) {
  const issues = metadataIssues(exercise, document);
  if (!reviewState(exercise, document, 'human-technical')) {
    // Opt-in never hides a supplied rejected/stale human decision or relaxes high-risk gates.
    if (document.reviewPolicy && !exercise.reviews.some(r => r.kind === 'human-technical')) {
      issues.push(...policyBlockers(exercise, document, { reviewState, metadataIssues }));
    } else issues.push('human-technical-review-missing-or-stale');
  }
  if (!reviewState(exercise, document, 'software-release')) issues.push('software-release-review-missing-or-stale');
  const item = exercise.item;
  const legacyShape = { ...item, answer: item.correctAnswer ?? item.options?.find(o => o.id === item.correctOptionId)?.label,
    options: item.options?.map(o => typeof o === 'string' ? o : o.label),
    sources: document.sources.filter(s => exercise.sourceEvidenceRefs.some(r => r.sourceId === s.sourceId)).map(s => s.url ?? '') };
  if (legalScreen(legacyShape).length) issues.push('existing-statutory-safety-release-screen-blocked');
  // Default remains per-item human review. Risk policy requires an explicit bound batch audit.
  return issues;
}
export function coverage(document) {
  DocumentSchema.parse(document);
  const rows = COURSES.flatMap(courseKey => MODES.map(mode => ({ courseKey, mode, target: TARGET,
    raw: 0, unique: 0, duplicate: 0, conflict: 0, quarantined: 0, nearDuplicateFlagged: 0,
    metadataComplete: 0, AIreviewed: 0, humanReviewed: 0, riskPolicyAccepted: 0, releasableAccepted: 0,
    legacyInventory: 0, legacyAIReviewDeclared: 0, legacySoftwareReleased: 0, unclassifiedDifficulty: 0,
    remainingGap: TARGET })));
  const quarantines = [];
  const idCounts = new Map();
  for (const e of document.exercises) idCounts.set(`${e.courseKey}/${e.exerciseId}`, (idCounts.get(`${e.courseKey}/${e.exerciseId}`) ?? 0) + 1);
  for (const row of rows) {
    const exercises = document.exercises.filter(e => e.courseKey === row.courseKey && e.mode === row.mode);
    row.raw = exercises.length;
    row.legacyInventory = exercises.filter(e => e.legacy).length;
    row.legacyAIReviewDeclared = exercises.filter(e => e.legacy?.aiReviewDeclared).length;
    row.legacySoftwareReleased = exercises.filter(e => e.legacy?.softwareStatus === 'approved').length;
    row.unclassifiedDifficulty = exercises.filter(e => e.difficulty === 'unclassified').length;
    const groups = new Map(); const families = new Map();
    for (const e of exercises) {
      const { problemHash } = identity(e.item);
      if (!groups.has(problemHash)) groups.set(problemHash, []);
      groups.get(problemHash).push(e);
      if (e.variantFamilyId) { if (!families.has(e.variantFamilyId)) families.set(e.variantFamilyId, []); families.get(e.variantFamilyId).push(e); }
    }
    row.unique = new Set(exercises.map(e => identity(e.item).exerciseHash)).size;
    row.duplicate = exercises.length - row.unique;
    for (const [problemHash, group] of groups) {
      const reasons = [];
      const answers = new Set(group.map(e => identity(e.item).answerHash));
      const difficulty = new Set(group.map(e => e.difficulty));
      if (answers.size > 1 || difficulty.size > 1) { reasons.push('contradictory-answer-or-difficulty'); row.conflict += group.length; }
      if (group.length > 1) reasons.push('duplicate-problem');
      if (group.some(e => idCounts.get(`${e.courseKey}/${e.exerciseId}`) > 1)) reasons.push('duplicate-storage-id');
      const familyFlag = group.some(e => e.variantFamilyId && new Set(families.get(e.variantFamilyId).map(r => identity(r.item).problemHash)).size > 1);
      if (familyFlag) {
        row.nearDuplicateFlagged += group.length;
        if (!group.every(e => reviewState(e, document, 'coverage-diversity'))) reasons.push('variant-family-near-duplicate-unresolved');
        // Parameter-identical rewordings still cannot inflate coverage, even with a diversity declaration.
        if (group.some(e => e.variantFamilyId && families.get(e.variantFamilyId).filter(other => hash(other.parameters) === hash(e.parameters)).length > 1)) reasons.push('variant-family-parameters-not-distinct');
      }
      if (reasons.length) {
        row.quarantined += group.length;
        quarantines.push({ courseKey: row.courseKey, mode: row.mode, problemHash, exerciseIds: group.map(e => e.exerciseId).sort(), reasons });
        continue;
      }
      const e = group[0];
      if (!metadataIssues(e, document).length) row.metadataComplete++;
      if (reviewState(e, document, 'ai')) row.AIreviewed++;
      if (reviewState(e, document, 'human-technical')) row.humanReviewed++;
      if (!blockers(e, document).length) {
        row.releasableAccepted++;
        if (!reviewState(e, document, 'human-technical')) row.riskPolicyAccepted++;
      }
    }
    row.remainingGap = Math.max(0, TARGET - row.releasableAccepted);
  }
  return { schemaVersion: document.schemaVersion, reviewPolicyVersion: document.reviewPolicy?.policyVersion ?? DEFAULT_REVIEW_POLICY_VERSION,
    notice: 'Documentary evidence/completeness checks only: reviewer identity, independence, authority and audit calibration are declared, not authenticated. Sampled batch authorization is not per-item human review. Legacy release and AI declarations are not current hash-bound technical approval. No activation. Semantic similarity/embeddings are not solved.',
    rows, quarantines, duplicateReferenceIds: !uniqueIds(document.sources, 'sourceId') || !uniqueIds(document.concepts, 'conceptId') };
}
