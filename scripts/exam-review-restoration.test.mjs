import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTOR, EXPLICIT_HOLDS, FIELDS, MUTABLE, checkState, digest, loadInputs, makePlan, project } from './lib/examReviewRelease.mjs';
import { RESTORATION_KEY, deriveRestorationPlan, normalizeReviewedSteps, validateOriginalPlan, validateRestorationPlan } from './lib/examReviewRestoration.mjs';
import { applyPlan } from './exam-review-release.mjs';
const inputs = loadInputs(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const original = makePlan(inputs, inputs.baseline.map(project), '2026-11-16T18:31:15.000Z');
const current = original.actions.map(a => a.after);
const plan = deriveRestorationPlan(inputs, original, current, '2026-11-16T19:30:00.000Z');
const findings = new Map(inputs.findings.map(f => [f.id, f]));

test('all 604 eligible real corrections restored; 22 explicit holds, 34 rejects and 1145 approvals excluded', () => {
  assert.deepEqual(plan.counts, { correct:604, hold:22, reject:34, preservedApproved:1145, conflicts:0, normalized:43 });
  assert.equal(plan.actions.length, new Set(plan.actions.map(a => a.id)).size);
  assert.deepEqual(plan.unresolvedSourceMarkers, [186086]);
  for (const a of plan.actions) { assert.ok(!EXPLICIT_HOLDS.includes(a.id)); assert.equal(original.actions.find(p => p.id === a.id).kind, 'hold'); }
  const untouched = original.actions.filter(a => !plan.actions.some(b => a.id === b.id));
  assert.equal(untouched.filter(a => a.kind === 'hold').length, 22);
  assert.equal(untouched.filter(a => a.kind === 'reject').length, 34);
  assert.equal(untouched.filter(a => a.kind === 'correct').length, 1145);
});

test('questions, options, answer keys and explanations are exactly the authorized review', () => {
  for (const a of plan.actions) {
    const f = findings.get(a.id).fix;
    for (const k of ['question','explanation','correctIndex']) assert.equal(a.after[k], f[k], `${a.id}:${k}`);
    assert.deepEqual(JSON.parse(a.after.options), f.options);
    assert.equal(a.after.reviewStatus, 'approved'); assert.equal(a.after.reviewedBy, ACTOR);
    for (const k of FIELDS.filter(k => !MUTABLE.includes(k))) assert.deepEqual(a.after[k], a.before[k]);
  }
});

test('all 43 real schema conversions preserve every original string, Unicode and ordering', () => {
  assert.equal(plan.normalizations.length, 43);
  for (const n of plan.normalizations) {
    assert.equal(n.before.length, n.after.length);
    n.before.forEach((s, i) => {
      if (typeof s === 'string') assert.deepEqual(n.after[i], { l:`Step ${i+1}`, c:s });
      else if (s.c) assert.deepEqual(n.after[i], s);
      else assert.deepEqual(n.after[i], { l:`Step ${i+1}`, c:s.l });
    });
  }
});

test('null, short and already canonical steps retained with no invented calculations', () => {
  assert.equal(normalizeReviewedSteps(null), null);
  const canonical = [{l:'Answer', c:'42 m³ × π'}];
  assert.deepEqual(normalizeReviewedSteps(canonical), canonical);
  assert.deepEqual(normalizeReviewedSteps([]), []);
  assert.deepEqual(normalizeReviewedSteps(['  π × 2 = 6.28  ']), [{l:'Step 1',c:'  π × 2 = 6.28  '}]);
  assert.ok(plan.actions.some(a => a.before.isCalc === 'yes' && (a.after.steps === null || JSON.parse(a.after.steps).length < 2)));
});

test('unknown schemas and empty semantic content fail closed, never silently dropped', () => {
  for (const steps of [{}, [null], [1], [''], [{l:''}], [{l:'Calculation',c:42}], [{l:'Calculation',c:'   '}], [{l:'A',c:'B',extra:'must survive'}]]) assert.throws(() => normalizeReviewedSteps(steps));
});

test('any current original-afterimage drift, including excluded rows, is recorded', () => {
  for (const id of [plan.actions[0].id, original.actions.find(a => a.kind === 'reject').id, original.actions.find(a => a.kind === 'correct').id]) {
    const changed = structuredClone(current); changed.find(a => a.id === id).tip = 'Concurrent edit';
    const p = deriveRestorationPlan(inputs, original, changed, plan.at);
    assert.deepEqual(p.conflicts.map(c => c.id), [id]);
  }
});

test('production entry points reject unpinned original plans, forged release keys and tampered content', async () => {
  assert.throws(() => validateOriginalPlan(original), /immutable plan/);
  assert.throws(() => validateRestorationPlan(plan, inputs, original), /immutable plan/);
  const connection = { beginTransaction() { throw Error('must never open transaction'); } };
  await assert.rejects(applyPlan(connection, plan), /Unready/);
  await assert.rejects(applyPlan(connection, {...plan,releaseKey:'unregistered'}), /Unready/);
});

test('all derived images have valid hashes and support exact before/after state checks', () => {
  for (const a of plan.actions) { assert.equal(a.beforeSha256, digest(a.before)); assert.equal(a.afterSha256, digest(a.after)); }
  assert.equal(checkState(plan, plan.actions.map(a => a.before)).pending.length, 604);
  assert.equal(checkState(plan, plan.actions.map(a => a.after)).done.length, 604);
  const mixed = plan.actions.map(a => a.before); mixed[0] = plan.actions[0].after;
  assert.throws(() => checkState(plan, mixed), /Partial/);
});

test('unlinked source and short-step heuristics no longer veto this exact owner-policy followup', () => {
  assert.equal(plan.releaseKey, RESTORATION_KEY);
  const held = original.actions.filter(a => plan.actions.some(b => b.id === a.id));
  assert.ok(held.some(a => a.reasons.some(r => r.includes('without a supporting link'))));
  assert.ok(held.some(a => a.reasons.some(r => r.includes('multi-step'))));
  assert.equal(plan.policy, 'owner-approved-claude-review-format-only-v1');
});
