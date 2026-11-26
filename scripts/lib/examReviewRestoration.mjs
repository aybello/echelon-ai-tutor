import { ACTOR, EXPLICIT_HOLDS, FIELDS, RELEASE_KEY, REVIEW_COMMIT, digest, project, validateFix } from './examReviewRelease.mjs';

export const RESTORATION_KEY = 'exam-review-restoration-20261116';
export const ORIGINAL_PLAN_SHA256 = 'f5134c73ee5a2b3b7c28d439017ccce76f44707a1de26a0afee02273ab5ed08f';
const assert = (ok, message) => { if (!ok) throw new Error(message); };

/** Formatting only: exact Unicode bodies/labels survive; unknown schemas fail closed. */
export function normalizeReviewedSteps(steps) {
  if (steps === null) return null;
  assert(Array.isArray(steps), 'Steps must be null or an array');
  return steps.map((step, index) => {
    if (typeof step === 'string') {
      assert(step.trim(), 'Empty string step');
      return { l: `Step ${index + 1}`, c: step };
    }
    assert(step && typeof step === 'object' && !Array.isArray(step), 'Unknown step shape');
    assert(Object.keys(step).every(k => k === 'l' || k === 'c'), 'Unknown step columns');
    assert(typeof step.l === 'string' && step.l.trim(), 'Missing step label');
    if (typeof step.c === 'string' && step.c.trim()) return { ...step };
    assert(step.c === undefined || step.c === '', 'Unknown step body');
    return { l: `Step ${index + 1}`, c: step.l };
  });
}

export function validateOriginalPlan(original) {
  assert(digest(original) === ORIGINAL_PLAN_SHA256 && original.releaseKey === RELEASE_KEY && original.reviewCommit === REVIEW_COMMIT, 'Original immutable plan identity mismatch');
  assert(original.actions.length === 1805 && original.counts.correct === 1145 && original.counts.hold === 626 && original.counts.reject === 34 && !original.conflicts.length, 'Original inventory mismatch');
}

export function restorationIds(original) {
  validateOriginalPlan(original);
  const ids = original.actions.filter(a => a.kind === 'hold' && !EXPLICIT_HOLDS.includes(a.id)).map(a => a.id);
  assert(ids.length === 604, 'Restoration inventory mismatch');
  return ids;
}

export function makePlanRestore(inputs, original, currentRows, at) {
  const eligible = new Set(restorationIds(original));
  return deriveRestorationPlan(inputs, original, currentRows, at, eligible);
}

/** Pure derivation for real-dataset tests; production entry points authenticate first. */
export function deriveRestorationPlan(inputs, original, currentRows, at, eligible = new Set(original.actions.filter(a => a.kind === 'hold' && !EXPLICIT_HOLDS.includes(a.id)).map(a => a.id))) {
  const current = new Map(currentRows.map(r => [r.id, project(r)]));
  assert(current.size === currentRows.length, 'Duplicate current ids');
  const findings = new Map(inputs.findings.map(f => [f.id, f]));
  const actions = [], conflicts = [], normalizations = [];
  for (const prior of original.actions) {
    const now = current.get(prior.id);
    if (!now || digest(now) !== prior.afterSha256) {
      conflicts.push({ id: prior.id, reason: 'Current row differs from original release after-image' });
      continue;
    }
    if (!eligible.has(prior.id)) continue;
    const finding = findings.get(prior.id);
    assert(finding && finding.bankKey === prior.bankKey && finding.questionNum === prior.questionNum && !finding.replacement, `Review identity mismatch ${prior.id}`);
    const steps = normalizeReviewedSteps(finding.fix.steps);
    const fix = { ...finding.fix, steps };
    validateFix(fix);
    const after = { ...now, ...fix, options: JSON.stringify(fix.options), steps: steps === null ? null : JSON.stringify(steps), reviewStatus: 'approved', reviewedBy: ACTOR, reviewedAt: at };
    // Every field outside the original release's explicit mutable content/review set survives.
    for (const field of FIELDS.filter(k => !['question','options','correctIndex','explanation','steps','reviewStatus','reviewedBy','reviewedAt'].includes(k))) assert(digest(now[field]) === digest(after[field]), `Immutable field changed ${prior.id}:${field}`);
    if (digest(steps) !== digest(finding.fix.steps)) normalizations.push({ id: prior.id, before: finding.fix.steps, after: steps });
    actions.push({ id: prior.id, bankKey: prior.bankKey, questionNum: prior.questionNum, kind: 'correct', reasons: ['Owner accepts existing Claude review; authority-link and minimum-step heuristics are not release blockers'], before: now, after, beforeSha256: digest(now), afterSha256: digest(after) });
  }
  return { formatVersion: 1, releaseKey: RESTORATION_KEY, originalReleaseKey: RELEASE_KEY, originalPlanSha256: ORIGINAL_PLAN_SHA256, reviewCommit: REVIEW_COMMIT, at, policy: 'owner-approved-claude-review-format-only-v1', counts: { correct: actions.length, hold: 22, reject: 34, preservedApproved: 1145, conflicts: conflicts.length, normalized: normalizations.length }, actions, conflicts, normalizations, unresolvedSourceMarkers: [...original.unresolvedSourceMarkers] };
}

/** Rebuild from the pinned review and original immutable plan, not caller assertions. */
export function validateRestorationPlan(plan, inputs, original) {
  const expected = makePlanRestore(inputs, original, original.actions.map(a => a.after), plan.at);
  assert(!plan.conflicts.length && plan.actions.length === 604 && digest(plan) === digest(expected), 'Restoration plan differs from exact authorized scope/content');
}

export function verifyOriginalReceipts(original, receipts) {
  validateOriginalPlan(original);
  const byId = new Map(receipts.map(r => [r.questionId, r]));
  assert(receipts.length === 1805 && byId.size === 1805, 'Original release receipt inventory mismatch');
  for (const a of original.actions) {
    const receipt = byId.get(a.id);
    assert(receipt && receipt.contentHash === a.beforeSha256 && digest(JSON.parse(receipt.payload)) === a.beforeSha256, `Original receipt mismatch ${a.id}`);
  }
}
