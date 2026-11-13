import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { importPilot, writePilot, PILOT_INPUT_ROOT } from './import-pilot.mjs';
import { DocumentSchema, PayloadSchema } from './schemas.mjs';
import { hash, bytesHash } from './identity.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const json = (root, name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value));
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-import-fixture-'));
  const snapshot = 'A screen retains large debris.';
  fs.writeFileSync(path.join(root, 'snapshot.txt'), snapshot);
  const source = { id: 'synthetic-source', publisher: 'Synthetic test only', title: 'Synthetic facts', url: 'https://example.test/facts',
    locator: 'Synthetic section', retrievedAt: '2026-11-12T00:00:00Z', snapshotPath: path.join(root, 'snapshot.txt'),
    snapshotHash: `sha256:${bytesHash(snapshot)}`, rightsBasis: 'Synthetic fixture, no real rights approval', permittedUsage: 'Internal evidence only' };
  const concept = { conceptId: 'synthetic-screen', objectiveIdOrUnmapped: 'unmapped', fact: snapshot,
    sourceId: source.id, locator: 'Synthetic section', sourceSupport: { passage: snapshot, locator: 'Synthetic section', url: source.url }, assumptions: ['Synthetic only'] };
  const knowledge = { courseKey: 'oit-ww', courseScope: { jurisdiction: 'Ontario, Canada', level: 'OIT' }, blueprint: { version: null, objectives: [] }, sources: [source], concepts: [concept] };
  json(root, 'ontario-source-knowledge.json', knowledge);
  json(root, 'us-wpi-source-knowledge.json', { ...knowledge, courseKey: 'us-class1-water', sources: [], concepts: [] });
  const candidate = { conceptRefs: [concept.conceptId], objectiveIdOrUnmapped: 'unmapped', difficulty: 'easy', difficultyRationale: 'Model declaration, not reviewed', variantFamilyId: 'synthetic-family',
    sourceEvidenceRefs: [{ sourceId: source.id, conceptId: concept.conceptId, locator: concept.locator }], calculationChecks: [],
    item: { id: 'synthetic-item', mode: 'rapid-swipe', prompt: 'Does a synthetic screen retain debris?', correctAnswer: true, explanation: 'Synthetic explanation.' } };
  const draft = { courseKey: 'oit-ww', mode: 'rapid-swipe', candidates: [candidate], gaps: ['No padding'] };
  const save = () => json(root, 'oit-ww__rapid-swipe__drafts.json', draft); save();
  json(root, 'pilot-ledger.json', { calls: { synthetic: { estimatedUSD: 0.01, reservedUSD: 0.02 } } });
  return { root, candidate, draft, knowledge, save, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
test('guard is first and no credentials or database environment is inherited', () => {
  assert.equal(globalThis.__echelonTestSafetyInstalled, true);
  assert.equal(process.env.DATABASE_URL, undefined); assert.equal(process.env.GOOGLE_API_KEY, undefined);
});
test('deterministic strict envelopes preserve payload, unknown Ontario alignment and original metadata; no approval', () => {
  const f = fixture(); try {
    const before = fs.readFileSync(path.join(f.root, 'oit-ww__rapid-swipe__drafts.json'));
    const a = importPilot({ inputRoot: f.root }); const b = importPilot({ inputRoot: f.root, serverPayloadSchema: PayloadSchema });
    assert.deepEqual(a, b); DocumentSchema.parse(a.document);
    const e = a.document.exercises[0]; assert.deepEqual(e.item, f.candidate.item); assert.equal(e.contentHash, hash(e.item));
    assert.equal(e.objectiveId, null); assert.equal(e.blueprintVersion, null); assert.equal(e.originality, 'unverified');
    assert.deepEqual(e.reviews, []); assert.equal(e.legacy, null); assert.equal(a.document.reviewPolicy, undefined);
    assert.equal(a.document.concepts.length, 0); assert.equal(a.report.totals.accepted, 0); assert.equal(a.report.totals.quarantined, 1);
    assert.equal(a.report.totals.sourceMissing, 0); assert.deepEqual(a.audit.candidates[0].originalCandidate, f.candidate);
    assert.deepEqual(fs.readFileSync(path.join(f.root, 'oit-ww__rapid-swipe__drafts.json')), before);
    assert.ok(!a.document.sources[0].permittedUsage.includes('original-practice-derivation'));
  } finally { f.cleanup(); }
});
test('raw formula descriptions remain private evidence and are never reported passed or executable', () => {
  const f = fixture(); try {
    f.candidate.calculationChecks = [{ formula: 'C = m / V', quantities: { m: 900, V: 450 }, expectedAnswer: 2 }]; f.save();
    const a = importPilot({ inputRoot: f.root }); const c = a.audit.candidates[0];
    assert.equal(c.calculations[0].status, 'not-executed'); assert.equal(c.calculations[0].passed, null);
    assert.deepEqual(a.document.exercises[0].parameters.privatePilotAudit.rawCalculationChecks, f.candidate.calculationChecks);
    assert.deepEqual(a.document.exercises[0].calculationChecks, []); assert.equal(a.report.calculationChecksExecuted, 0);
    assert.ok(c.issues.includes('raw-calculation-checks-not-executable'));
  } finally { f.cleanup(); }
});
test('bad source hash, missing concept, wrong locator and missing passage quarantine with evidence', () => {
  for (const mutation of ['hash', 'concept', 'locator', 'passage']) {
    const f = fixture(); try {
      if (mutation === 'hash') fs.writeFileSync(path.join(f.root, 'snapshot.txt'), 'tampered');
      if (mutation === 'concept') f.candidate.conceptRefs = ['not-present'];
      if (mutation === 'locator') f.candidate.sourceEvidenceRefs[0].locator = 'not-present';
      if (mutation === 'passage') { f.knowledge.concepts[0].sourceSupport.passage = 'unlocated claim'; json(f.root, 'ontario-source-knowledge.json', f.knowledge); }
      f.save(); const a = importPilot({ inputRoot: f.root });
      assert.equal(a.report.totals.sourceMissing, 1); assert.equal(a.report.totals.accepted, 0);
      assert.equal(a.document.exercises[0].sourceEvidenceRefs.length, 0);
      assert.ok(a.audit.candidates[0].issues.length > 0);
    } finally { f.cleanup(); }
  }
});
test('invalid payload and stale declared hash cannot gain strict conversion or false acceptance', () => {
  const f = fixture(); try {
    f.candidate.item.correctAnswer = 'true'; f.candidate.contentHash = 'a'.repeat(64); f.save();
    const a = importPilot({ inputRoot: f.root }); assert.equal(a.document.exercises.length, 0);
    assert.equal(a.audit.candidates[0].strictExerciseConverted, false);
    assert.ok(a.audit.candidates[0].issues.includes('declared-content-hash-mismatch'));
    assert.equal(a.report.totals.uniquenessUnknown, 1); assert.equal(a.report.totals.quarantined, 1);
  } finally { f.cleanup(); }
});
test('exact duplicate and contradictory answer flags preserve every original rather than padding or overwriting', () => {
  const f = fixture(); try {
    const second = structuredClone(f.candidate); second.item.id = 'synthetic-second'; second.item.correctAnswer = false;
    f.draft.candidates.push(second, structuredClone(f.candidate)); f.save();
    const a = importPilot({ inputRoot: f.root }); assert.equal(a.report.totals.raw, 3); assert.equal(a.report.totals.unique, 2);
    assert.equal(a.report.totals.duplicate, 1); assert.equal(a.report.totals.quarantined, 3);
    assert.ok(a.audit.candidates.every(c => c.issues.includes('duplicate-problem') && c.issues.includes('contradictory-answer')));
  } finally { f.cleanup(); }
});
test('input escapes and symlinks fail closed, output is atomic private no-clobber and CLI root is fixed', () => {
  const f = fixture(); const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-import-output-'));
  try {
    const a = importPilot({ inputRoot: f.root }); const dest = writePilot(a, { root: out, repoRoot, name: 'pilot-synthetic.json' });
    assert.equal(fs.statSync(dest).mode & 0o777, 0o600);
    assert.throws(() => writePilot(a, { root: out, repoRoot, name: 'pilot-synthetic.json' }));
    assert.equal(fs.readdirSync(out).length, 1);
    for (const name of ['../pilot-escape.json', '/tmp/pilot-escape.json', 'not-pilot.json']) assert.throws(() => writePilot(a, { root: out, repoRoot, name }));
    const cli = spawnSync(process.execPath, ['scripts/content-engine/import-pilot.mjs', '--output-root', out], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(cli.status, 1); assert.match(cli.stderr, /usage/);
    f.knowledge.sources[0].snapshotPath = '/etc/passwd'; json(f.root, 'ontario-source-knowledge.json', f.knowledge);
    assert.ok(importPilot({ inputRoot: f.root }).audit.sources[0].issues.includes('pilot-input-path-escape'));
    fs.unlinkSync(path.join(f.root, 'snapshot.txt')); fs.symlinkSync('/etc/passwd', path.join(f.root, 'snapshot.txt'));
    f.knowledge.sources[0].snapshotPath = path.join(f.root, 'snapshot.txt'); json(f.root, 'ontario-source-knowledge.json', f.knowledge);
    assert.ok(importPilot({ inputRoot: f.root }).audit.sources[0].issues.includes('pilot-input-symlink-denied'));
  } finally { f.cleanup(); fs.rmSync(out, { recursive: true, force: true }); }
});
test('actual local 128 drafts are read-only, unapproved, unpadded; raw calculations and ledger remain honest', () => {
  const files = fs.readdirSync(PILOT_INPUT_ROOT).filter(n => n.endsWith('__drafts.json') || n.endsWith('knowledge.json') || n === 'pilot-ledger.json');
  const before = files.map(n => bytesHash(fs.readFileSync(path.join(PILOT_INPUT_ROOT, n))));
  const a = importPilot(); DocumentSchema.parse(a.document);
  assert.equal(a.report.totals.raw, 128); assert.equal(a.audit.candidates.length, 128); assert.equal(a.report.totals.quarantined, 128);
  assert.equal(a.report.totals.accepted, 0); assert.equal(a.report.rawCalculationChecks, 40); assert.equal(a.report.calculationChecksExecuted, 0);
  assert.ok(a.document.exercises.every(e => e.contentHash === hash(e.item) && e.reviews.length === 0 && e.originality === 'unverified'));
  assert.ok(a.document.exercises.filter(e => e.courseKey === 'oit-ww').every(e => e.objectiveId === null && e.blueprintVersion === null));
  assert.ok(a.report.rows.every(r => r.AIreviewed === 0 && r.humanReviewed === 0 && r.remainingGap === 1000));
  assert.deepEqual(files.map(n => bytesHash(fs.readFileSync(path.join(PILOT_INPUT_ROOT, n)))), before);
  assert.equal(a.audit.costLedger.unknownCostCalls, 4); assert.equal(a.audit.costLedger.calls, 12);
});
