import { z } from 'zod';
import { COURSES, MODES, DIFFICULTIES, VERSION } from './constants.mjs';

const text = z.string().trim().min(1).max(4000);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const unknownText = text.nullable();
const evidence = z.object({ locator: text, sha256, summary: text }).strict();
const refs = z.array(z.object({ sourceId: text, evidenceId: text }).strict());
const base = { id, prompt: text, instruction: text.optional() };
const pair = z.object({ id, left: text, right: text }).strict();
const option = z.object({ id, label: text }).strict();
// Matches shared/interactiveSessions.ts interactiveDrillExampleSchema (pure wire shape).
// Keep offline imports independent; payloadIssues can accept that pure schema explicitly.
export const PayloadSchema = z.union([
  z.object({ ...base, mode: z.literal('rapid-swipe'), correctAnswer: z.boolean(), explanation: text }).strict(),
  z.object({ ...base, mode: z.literal('speed-match'), pairs: z.array(pair).min(3).max(20), explanation: text.optional() }).strict(),
  ...['odd-one-out', 'cause-effect', 'tap-the-flaw'].map(mode => z.object({ ...base, mode: z.literal(mode), options: z.array(option).min(2).max(20), correctOptionId: id, explanation: text }).strict()),
  z.object({ ...base, mode: z.literal('before-after'), correctAnswer: z.enum(['before', 'after']), explanation: text }).strict(),
  z.object({ ...base, mode: z.literal('before-after'), options: z.array(text).length(2), correctAnswer: text, explanation: text }).strict(),
]);
export const SourceSchema = z.object({
  schemaVersion: z.literal(VERSION), sourceId: text, publisher: unknownText, title: unknownText,
  url: z.string().url().nullable(), docLocator: unknownText, retrievedAt: z.string().datetime({ offset: true }).nullable(),
  snapshotHash: sha256.nullable(), rightsBasis: unknownText, permittedUsage: z.array(text),
  evidence: z.array(z.object({ evidenceId: text, locator: text, excerpt: text, snapshotHash: sha256 }).strict()),
}).strict();
export const ApplicabilitySchema = z.object({
  courseKey: z.enum(COURSES), jurisdiction: text, examLevel: text, blueprintVersion: text, objectiveId: text,
}).strict();
export const ConceptSchema = z.object({
  schemaVersion: z.literal(VERSION), conceptId: text, title: text,
  facts: z.array(z.object({ factId: text, statement: text, sourceEvidenceRefs: refs.min(1) }).strict()).min(1),
  sourceEvidenceRefs: refs.min(1), applicability: z.array(ApplicabilitySchema).min(1),
  variantFamilies: z.array(z.object({ variantFamilyId: text, intent: text, parameterDefinitions: z.record(z.string(), text) }).strict()).min(1),
}).strict();
export const REVIEW_POLICY_VERSION = 'risk-based-carbon-v1';
export const OWNER_AI_OIT_POLICY_VERSION = 'owner-authorized-ai-oit-v1';
export const OwnerAIReviewPolicySchema = z.object({
  policyVersion: z.literal(OWNER_AI_OIT_POLICY_VERSION), enabled: z.literal(true),
  ownerAuthorization: z.object({
    reviewAuthority: z.literal('owner-policy-declared'), owner: z.literal('father'),
    authorizedAt: z.string().datetime({ offset: true }).refine(v => v.startsWith('2026-11-13T'), 'Requires the actual owner authorization date'),
    scopeCourseKeys: z.tuple([z.literal('oit'), z.literal('oit-ww')]), evidence,
  }).strict(),
}).strict();
export const ReviewPolicySchema = z.union([
  z.object({ policyVersion: z.literal(REVIEW_POLICY_VERSION), enabled: z.literal(true) }).strict(),
  OwnerAIReviewPolicySchema,
]);
const reviewBinding = z.object({ courseKey: z.enum(COURSES), exerciseId: text, payloadHash: sha256, subjectHash: sha256, reviewBindingsHash: sha256 }).strict();
export const BatchAuditSchema = z.object({
  schemaVersion: z.literal('batch-audit-v1'), policyVersion: z.literal(REVIEW_POLICY_VERSION), batchId: id,
  status: z.enum(['pending', 'approved', 'rejected']), reviewer: text, reviewerAuthority: z.literal('human-technical-declared'),
  authorityEvidence: evidence, reviewedAt: z.string().datetime({ offset: true }),
  scope: z.literal('sampled-batch-not-per-item'), corpusHash: sha256, members: z.array(reviewBinding).min(1).max(12),
  sampledMembers: z.array(z.object({ courseKey: z.enum(COURSES), exerciseId: text }).strict()).min(1).max(12),
  samplingMethod: text, calibrationEvidence: evidence, findingsEvidence: evidence,
  sourceCheckEvidence: evidence, blueprintAlignmentEvidence: evidence, duplicateCheckEvidence: evidence,
  unresolvedFindings: z.array(text),
}).strict();
export const ReviewSchema = z.object({
  schemaVersion: z.literal(VERSION), kind: z.enum(['ai', 'human-technical', 'software-release', 'coverage-diversity']),
  status: z.enum(['pending', 'approved', 'rejected']), reviewer: text,
  reviewerAuthority: z.enum(['ai-model-declared', 'human-technical-declared', 'software-release-declared', 'human-diversity-declared']),
  // These are declarations, never independently authenticated by this module.
  authorityEvidence: evidence.nullable(), reviewedAt: z.string().datetime({ offset: true }),
  payloadHash: sha256, subjectHash: sha256, evidence: z.array(evidence).min(1),
  policyVersion: z.enum([REVIEW_POLICY_VERSION, OWNER_AI_OIT_POLICY_VERSION]).optional(),
  policyBindingHash: sha256.optional(),
  independentAI: z.object({ generatorIdentity: text, independenceEvidence: evidence,
    riskScope: z.literal('routine-non-operational-concept'), correctnessEvidence: evidence,
    sourceCheckEvidence: evidence, blueprintAlignmentEvidence: evidence, duplicateCheckEvidence: evidence,
    sourceBindingsHash: sha256.optional(), duplicateContextHash: sha256.optional(),
  }).strict().optional(),
}).strict().superRefine((r, ctx) => {
  const invalid = message => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  if (r.policyVersion === OWNER_AI_OIT_POLICY_VERSION) {
    if (!r.policyBindingHash || r.authorityEvidence === null) invalid('Owner-policy reviews require policy and authority evidence bindings');
    if (['ai', 'coverage-diversity'].includes(r.kind)) {
      if (r.reviewerAuthority !== 'ai-model-declared' || !['gpt-6.1-sol', 'gemini-4-carbon'].includes(r.reviewer) ||
        r.independentAI?.generatorIdentity !== 'gemini-4-argon' || !r.independentAI?.sourceBindingsHash || !r.independentAI?.duplicateContextHash)
        invalid('Owner-policy AI reviews require exact independent model identities and source/duplicate bindings');
    } else if (r.kind !== 'software-release' || r.reviewerAuthority !== 'software-release-declared' || r.independentAI)
      invalid('Owner-policy review is AI, AI diversity, or software release; never human technical approval');
  } else {
    if (r.policyBindingHash || r.independentAI?.sourceBindingsHash || r.independentAI?.duplicateContextHash)
      invalid('Owner-policy bindings cannot be used outside the owner policy');
    if (r.independentAI && !(r.kind === 'ai' && r.policyVersion === REVIEW_POLICY_VERSION))
      invalid('Independent AI evidence requires an AI review bound to the opt-in policy version');
  }
});
const RationalSchema = z.object({ numerator: z.string().regex(/^-?\d{1,100}$/), denominator: z.string().regex(/^[1-9]\d{0,99}$/) }).strict();
const ExpressionSchema = z.lazy(() => z.union([
  z.object({ op: z.literal('quantity'), value: RationalSchema, unit: text }).strict(),
  z.object({ op: z.enum(['add', 'subtract', 'multiply', 'divide']), left: ExpressionSchema, right: ExpressionSchema }).strict(),
  z.object({ op: z.literal('power'), left: ExpressionSchema, exponent: z.number().int().min(0).max(8) }).strict(),
]));
export const CalculationSchema = z.object({ schemaVersion: z.literal('calculation-v1'), expression: ExpressionSchema,
  expected: z.object({ value: RationalSchema, unit: text }).strict(),
  rounding: z.object({ mode: z.literal('half-away-from-zero'), decimalPlaces: z.number().int().min(0).max(12) }).strict(),
}).strict();
export const ExerciseSchema = z.object({
  schemaVersion: z.literal(VERSION), exerciseId: text, courseKey: z.enum(COURSES), mode: z.enum(MODES),
  conceptRefs: z.array(text), objectiveId: unknownText, jurisdiction: unknownText, examLevel: unknownText,
  blueprintVersion: unknownText, difficulty: z.enum(DIFFICULTIES), difficultyRationale: unknownText,
  variantFamilyId: unknownText, parameters: z.record(z.string(), z.unknown()), units: z.record(z.string(), text),
  item: PayloadSchema, sourceEvidenceRefs: refs, contentHash: sha256,
  claimType: z.enum(['concept', 'field-practice', 'statutory', 'safety', 'unclassified']),
  originality: z.enum(['original-practice', 'unverified', 'prohibited-exam-copy']),
  authorityEvidence: z.array(z.object({ sourceId: text, evidenceId: text, jurisdiction: text, effectiveAt: z.string().datetime({ offset: true }) }).strict()),
  calculationChecks: z.array(CalculationSchema), reviews: z.array(ReviewSchema),
  legacy: z.object({ packageVersion: text, packageHash: sha256, softwareStatus: text,
    aiReviewDeclared: z.boolean(), notice: text, provenanceRefs: z.array(text) }).strict().nullable(),
}).strict();
export const DocumentSchema = z.object({
  schemaVersion: z.literal(VERSION), notice: text,
  sources: z.array(SourceSchema), concepts: z.array(ConceptSchema), exercises: z.array(ExerciseSchema),
  reviewPolicy: ReviewPolicySchema.optional(), batchAudits: z.array(BatchAuditSchema).optional(),
}).strict();

// Only used to check renderer hazards; not used as a scientific fingerprint.
const rendererLabel = v => v.trim().replace(/\s+/gu, ' ').toLowerCase();
const conservativeLabel = v => rendererLabel(v.normalize('NFKC'));
const unique = labels => new Set(labels.map(conservativeLabel)).size === labels.length;
const answerLeak = value => /(?:→|⇒|⟶|➝|->|=>)|\b(?:(?:correct\s+)?(?:answer|choice|option)\s*(?:is\b|[:=])|answer\s+key\b|hint\s*[:=]|(?:choose|select|pick)\s+(?:the\s+)?(?:first|second|left|right)\s+(?:option|choice|answer)\b|(?:first|second|left|right)\s+(?:option|choice|answer)\s+is\+?\s*correct\b|followed\s+by\b|precedes\b|then\b|first\b[^.!?]*\bsecond\b)/iu.test(value);
function containsLabel(visible, label) {
  if (Array.from(label).length > 3) return visible.includes(label);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, 'u').test(visible);
}
// Mirrors shared/interactiveCauseEffect.ts isQuantityLabel; a guarded test compares them.
const QUANTITY = /^(?:(?:about|approximately|approx\.?|roughly|nearly)\s+|[~≈]\s*)?[-+]?\$?\d[\d,]*(?:\.\d+)?(?:$|[\s%/-])/u;
export function isQuantityLabel(label) {
  const value = label.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  return value.length <= 60 && QUANTITY.test(value);
}
export function payloadIssues(item, serverPayloadSchema = null) {
  const parsed = (serverPayloadSchema ?? PayloadSchema).safeParse(item);
  if (!parsed.success) return ['payload-schema-invalid'];
  const issues = [];
  if (item.mode === 'speed-match') {
    if (new Set(item.pairs.map(p => p.id)).size !== item.pairs.length || !unique(item.pairs.map(p => p.left)) || !unique(item.pairs.map(p => p.right))) issues.push('matching-labels-or-ids-invalid');
  }
  if (['odd-one-out', 'cause-effect', 'tap-the-flaw'].includes(item.mode)) {
    if (new Set(item.options.map(o => o.id)).size !== item.options.length || !unique(item.options.map(o => o.label)) || !item.options.some(o => o.id === item.correctOptionId)) issues.push('options-or-answer-invalid');
    // Mode fit: a computed quantity is arithmetic practice, not cause and effect.
    else if (item.mode === 'cause-effect' && item.options.every(o => isQuantityLabel(o.label))) issues.push('cause-effect-calculation-not-mode-fit');
  }
  if (item.mode === 'before-after') {
    const visible = `${item.prompt} ${item.instruction ?? ''}`;
    if (answerLeak(visible)) issues.push('before-after-answer-leak');
    if (item.options) {
      if (!unique(item.options) || item.options.filter(o => rendererLabel(o) === rendererLabel(item.correctAnswer)).length !== 1) issues.push('before-after-answer-invalid');
      if (item.options.some(o => containsLabel(rendererLabel(visible), rendererLabel(o)) || containsLabel(conservativeLabel(visible), conservativeLabel(o)))) issues.push('before-after-visible-option');
    }
  }
  return issues;
}
