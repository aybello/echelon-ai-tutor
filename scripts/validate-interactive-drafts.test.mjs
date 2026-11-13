import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { MODES, validatePack } from './validate-interactive-drafts.mjs';

const script = path.resolve('scripts/validate-interactive-drafts.mjs');
const common = (mode, id) => ({ id, mode, prompt: `Unique prompt ${id}`, answer: '', explanation: `Explanation ${id}`, sources: ['synthetic citation'], options: [], pairs: [] });
const fixture = () => MODES.map((mode, i) => {
  const x = common(mode, `item-${i}`);
  if (mode === 'rapid-swipe') { x.answer = 'True'; x.options = ['True', 'False']; }
  if (mode === 'speed-match') { x.answer = 'Match the pairs'; x.pairs = [{ left: 'A', right: 'One' }, { left: 'B', right: 'Two' }, { left: 'C', right: 'Three' }]; }
  if (['odd-one-out', 'cause-effect', 'tap-the-flaw'].includes(mode)) { x.answer = ' Second '; x.options = ['First', 'Second']; }
  if (mode === 'before-after') { x.answer = 'After'; x.options = ['Before', 'After']; }
  return x;
});
const codes = p => p.errors.map(e => e.code);
const execute = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

test('all six modes convert without changing prompt, citations, or synthesizing approval', () => {
  const result = validatePack(fixture());
  assert.equal(result.valid, true); assert.equal(result.examples.length, 6);
  assert.equal(result.examples[0].correctAnswer, true);
  assert.deepEqual(result.examples[1].pairs[0], { id: 'pair-1', left: 'A', right: 'One' });
  assert.equal(result.examples[2].correctOptionId, 'option-2');
  assert.equal(result.examples[5].correctAnswer, 'after');
  assert.deepEqual(result.provenance[2].sources, ['synthetic citation']);
  assert.equal(Object.hasOwn(result.examples[0], 'status'), false);
});

test('rejects mismatch, missing citation and id, duplicate choices and ambiguous pairs', () => {
  const input = fixture();
  input[0].id = ''; input[0].sources = [];
  input[1].pairs[1].right = '  ONE  ';
  input[1].answer = 'A → Two; B → One';
  input[2].options = ['first', ' First ']; input[2].answer = 'absent';
  const c = codes(validatePack(input));
  for (const code of ['INVALID_ID', 'MISSING_CITATIONS', 'AMBIGUOUS_MATCH_PAIR', 'MATCH_ANSWER_PAIR_MISMATCH', 'DUPLICATE_OPTIONS', 'ANSWER_CHOICE_MISMATCH']) assert.ok(c.includes(code), code);
});

test('rejects duplicate prompts and IDs, unknown fields, absent modes, and ambiguous before-after', () => {
  const input = fixture(); input[1].id = input[0].id; input[1].prompt = input[0].prompt.toUpperCase();
  input[2].extra = 'not safe to discard'; input[5].answer = 'Absent'; input[5].options = ['Sedimentation', 'Screen', 'Filter'];
  const c = codes(validatePack(input));
  for (const code of ['DUPLICATE_ID', 'DUPLICATE_PROMPT', 'UNKNOWN_FIELD', 'ANSWER_CHOICE_MISMATCH', 'BEFORE_AFTER_CHOICES_MISMATCH']) assert.ok(c.includes(code), code);
  assert.ok(codes(validatePack(input.slice(0, 5))).includes('MISSING_MODE'));
});

test('before-after preserves literal directions and maps named options by unique answer, never position', () => {
  const input = fixture();
  input[5].options = ['Screening', 'Sedimentation']; input[5].answer = '  SEDIMENTATION  ';
  const result = validatePack(input);
  assert.equal(result.valid, true);
  assert.deepEqual(result.examples[5].options, ['Screening', 'Sedimentation']);
  assert.equal(result.examples[5].correctAnswer, '  SEDIMENTATION  ');
  assert.equal(Object.hasOwn(result.examples[5], 'correctOptionId'), false);
  assert.deepEqual(result.provenance[5], { id: input[5].id, sources: input[5].sources, answer: input[5].answer, options: input[5].options, pairs: input[5].pairs });
  input[5].options.reverse();
  assert.equal(validatePack(input).examples[5].correctAnswer, '  SEDIMENTATION  ');
  input[5].options = []; input[5].answer = ' Before ';
  assert.equal(validatePack(input).examples[5].correctAnswer, 'before');
  input[5].options = ['Before', 'After']; input[5].answer = 'AFTER';
  assert.equal(validatePack(input).examples[5].correctAnswer, 'after');
});

test('rejects missing, ambiguous and unsupported answers, and speed-match needs at least three pairs', () => {
  for (const [options, answer] of [
    [['Screen', 'Sedimentation'], 'First'],
    [['Screen', ' SCREEN '], 'screen'],
    [['A', 'B', 'C'], 'B'],
    [['Screen', 'Sedimentation'], null],
  ]) {
    const input = fixture(); input[5].options = options; input[5].answer = answer;
    const result = validatePack(input); assert.equal(result.valid, false); assert.equal(result.examples.some(x => x.id === input[5].id), false);
  }
  const input = fixture(); input[1].pairs.pop();
  assert.ok(codes(validatePack(input)).includes('PAIR_COUNT'));
  input[1].pairs.push({ left: 'C', right: 'Three' }); input[1].answer = 'Match A to Two';
  assert.ok(codes(validatePack(input)).includes('UNRECOGNIZED_MATCH_ANSWER'));
  input[1].answer = 'A → One; B → Two; C → Three';
  assert.equal(validatePack(input).valid, true);
  input[1].answer = 'A → Two; B → One; C → Three';
  assert.ok(codes(validatePack(input)).includes('MATCH_ANSWER_PAIR_MISMATCH'));
});

test('rejects option labels, answer hints and exposed flow sequences in prompt or instruction', () => {
  for (const field of ['prompt', 'instruction']) {
    for (const text of ['The correct answer is Screening', 'Answer: Screening', 'Hint: use the first choice', 'Raw water → Screening → Filtration', 'Screening followed by Filtration']) {
      const input = fixture(); input[5].options = ['Screening', 'Sedimentation']; input[5].answer = 'Screening'; input[5][field] = text;
      assert.equal(validatePack(input).valid, false, `${field}: ${text}`);
    }
    const input = fixture(); input[5].options = []; input[5][field] = 'Train: raw water → screen → filters. Is the screen before filters?';
    assert.ok(codes(validatePack(input)).includes('BEFORE_AFTER_ANSWER_HINT'));
  }
  const input = fixture(); input[5].options = ['Café', 'Tea']; input[5].answer = 'Cafe\u0301';
  assert.ok(codes(validatePack(input)).includes('ANSWER_CHOICE_MISMATCH')); // Renderer does not NFKC-normalize.
  input[5].answer = 'Café'; input[5].instruction = 'Consider CAFE\u0301.';
  assert.ok(codes(validatePack(input)).includes('BEFORE_AFTER_VISIBLE_OPTION'));
});

test('CLI converts valid pack, preserves output, rejects overwrite, and writes nothing for invalid batches', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'draft-validator-test-'));
  try {
    const input = path.join(dir, 'input'), output = path.join(dir, 'output'); fs.mkdirSync(input); fs.mkdirSync(output);
    const source = path.join(input, 'pack.json'); fs.writeFileSync(source, JSON.stringify(fixture()));
    const original = fs.readFileSync(source, 'utf8');
    let r = execute('--input', input, '--out-dir', output); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).valid, true);
    const converted = path.join(output, 'pack.converted.json'), saved = fs.readFileSync(converted, 'utf8');
    const artifact = JSON.parse(saved); assert.equal(artifact.examples.length, 6); assert.equal(Object.hasOwn(artifact, 'status'), false);
    r = execute('--input', input, '--out-dir', output); assert.equal(r.status, 2); assert.equal(fs.readFileSync(converted, 'utf8'), saved);
    fs.unlinkSync(converted); fs.writeFileSync(path.join(input, 'bad.json'), '{not json');
    r = execute('--input', input, '--out-dir', output); assert.equal(r.status, 1); assert.deepEqual(fs.readdirSync(output), []); assert.equal(JSON.parse(r.stdout).invalidPacks, 1);
    assert.equal(fs.readFileSync(source, 'utf8'), original);
    r = execute('--input', input, '--out-dir', input); assert.equal(r.status, 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('cross-pack duplicates are detected even when the item is already invalid', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'draft-validator-test-'));
  try {
    const one = fixture(), two = fixture().map(x => ({ ...x, id: `second-${x.id}` }));
    two[0].id = one[0].id; two[0].sources = [];
    fs.writeFileSync(path.join(dir, 'one.json'), JSON.stringify(one)); fs.writeFileSync(path.join(dir, 'two.json'), JSON.stringify(two));
    const r = execute('--input', dir); assert.equal(r.status, 1);
    const report = JSON.parse(r.stdout); assert.equal(report.invalidPacks, 2); assert.ok(report.packs.every(p => codes(p).includes('CROSS_PACK_DUPLICATE_ID')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
