import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { MODES } from './validate-interactive-drafts.mjs';

const script = path.resolve('scripts/assemble-interactive-draft-package.mjs');
const run = (...args) => spawnSync(process.execPath, ['--import', 'tsx', script, ...args], { cwd: path.resolve('.'), encoding: 'utf8' });
const hash = x => createHash('sha256').update(x).digest('hex');
function fixture() {
  return MODES.flatMap((mode, i) => [0, 1].map(n => {
    const id = `item-${i}-${n}`, x = { id, mode, prompt: `Unique prompt ${id}`, answer: '', explanation: `Explanation ${id}`, sources: [`Synthetic citation ${id}`], options: [], pairs: [] };
    if (mode === 'rapid-swipe') x.answer = true;
    if (mode === 'speed-match') { x.answer = 'Match the pairs'; x.pairs = [{ left: 'A', right: 'One' }, { left: 'B', right: 'Two' }, { left: 'C', right: 'Three' }]; }
    if (['odd-one-out', 'cause-effect', 'tap-the-flaw'].includes(mode)) { x.options = ['First', 'Second']; x.answer = 'Second'; }
    if (mode === 'before-after') x.answer = 'after';
    return x;
  }));
}
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interactive-package-test-'));
  const input = path.join(dir, 'input.json'), reviewers = path.join(dir, 'reviewers.json'), out = path.join(dir, 'result');
  fs.writeFileSync(input, JSON.stringify(fixture(), null, 1) + '\n');
  fs.writeFileSync(reviewers, JSON.stringify([{ type: 'ai', name: 'Synthetic Model' }]));
  const previews = Object.fromEntries(MODES.map((m, i) => [m, `item-${i}-0`]));
  const args = ['--input', input, '--course-key', 'synthetic-course', '--preview-ids', JSON.stringify(previews), '--status', 'draft', '--version', 'test-v1', '--reviewers', reviewers, '--out-dir', out];
  return { dir, input, reviewers, out, previews, args, clean: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
function changed(args, flag, value) { const a = [...args]; a[a.indexOf(flag) + 1] = value; return a; }
test('assembles deterministically, retains source bytes and AI reviewer provenance, then verifies', () => {
  const f = setup(); try {
    let r = run('assemble', ...f.args); assert.equal(r.status, 0, r.stderr);
    const pkgBytes = fs.readFileSync(path.join(f.out, 'package.json'));
    const pkg = JSON.parse(pkgBytes), prov = JSON.parse(fs.readFileSync(path.join(f.out, 'provenance.json')));
    assert.equal(pkg.status, 'draft'); assert.deepEqual(Object.keys(pkg), ['courseKey', 'status', 'version', 'previewIds', 'examples']);
    assert.equal(pkg.examples.length, 12); assert.deepEqual(pkg.previewIds, f.previews);
    assert.equal(prov.packageSha256, hash(pkgBytes));
    for (const [part, file] of [[prov.source, f.input], [prov.reviewers, f.reviewers]]) { assert.deepEqual(Buffer.from(part.originalBytes, 'base64'), fs.readFileSync(file)); assert.equal(part.sha256, hash(fs.readFileSync(file))); }
    assert.deepEqual(prov.reviewers.entries, [{ type: 'ai', name: 'Synthetic Model' }]);
    assert.equal(prov.items.length, 12); assert.equal(prov.items[0].sources[0], 'Synthetic citation item-0-0');
    r = run('verify', ...f.args); assert.equal(r.status, 0, r.stderr);
    const second = path.join(f.dir, 'second'); r = run('assemble', ...changed(f.args, '--out-dir', second)); assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(fs.readFileSync(path.join(second, 'package.json')), pkgBytes);
    assert.deepEqual(fs.readFileSync(path.join(second, 'provenance.json')), fs.readFileSync(path.join(f.out, 'provenance.json')));
    r = run('assemble', ...f.args); assert.notEqual(r.status, 0); assert.deepEqual(fs.readFileSync(path.join(f.out, 'package.json')), pkgBytes);
  } finally { f.clean(); }
});
test('rejects tampered packages, provenance, changed input, and changed reviewers', () => {
  const f = setup(); try {
    assert.equal(run('assemble', ...f.args).status, 0);
    for (const file of ['package.json', 'provenance.json']) {
      const p = path.join(f.out, file), saved = fs.readFileSync(p); fs.appendFileSync(p, ' ');
      assert.notEqual(run('verify', ...f.args).status, 0); fs.writeFileSync(p, saved);
    }
    const src = fs.readFileSync(f.input); fs.appendFileSync(f.input, ' '); assert.notEqual(run('verify', ...f.args).status, 0); fs.writeFileSync(f.input, src);
    fs.appendFileSync(f.reviewers, ' '); assert.notEqual(run('verify', ...f.args).status, 0);
  } finally { f.clean(); }
});
test('rejects approved or absent status, 309A, review claims, and output in the project', () => {
  const f = setup(); try {
    for (const args of [changed(f.args, '--status', 'approved'), f.args.filter((x, i) => i !== f.args.indexOf('--status') && i !== f.args.indexOf('--status') + 1), changed(f.args, '--course-key', 'ontario-309-a'), changed(f.args, '--out-dir', path.resolve('scripts/no-package-test'))]) {
      assert.notEqual(run('assemble', ...args).status, 0); assert.equal(fs.existsSync(f.out), false);
    }
    fs.writeFileSync(f.reviewers, JSON.stringify([{ type: 'human', name: 'Unsupported' }])); assert.notEqual(run('assemble', ...f.args).status, 0);
    const prohibited = path.join(f.dir, '309A.json'); fs.copyFileSync(f.input, prohibited);
    assert.notEqual(run('assemble', ...changed(f.args, '--input', prohibited)).status, 0);
    fs.writeFileSync(f.reviewers, JSON.stringify([{ type: 'ai', name: 'Synthetic Model' }]));
    const content = fixture(); content[0].prompt = 'Question about 309-a'; fs.writeFileSync(f.input, JSON.stringify(content));
    assert.notEqual(run('assemble', ...f.args).status, 0); assert.equal(fs.existsSync(f.out), false);
  } finally { f.clean(); }
});
test('requires exactly six correct preview mappings and a non-preview example per mode', () => {
  const f = setup(); try {
    const missing = { ...f.previews }; delete missing['rapid-swipe'];
    const extra = { ...f.previews, extra: 'id' };
    const duplicate = { ...f.previews, 'rapid-swipe': f.previews['speed-match'] };
    const wrongMode = { ...f.previews, 'rapid-swipe': 'item-1-1' };
    const nonexistent = { ...f.previews, 'rapid-swipe': 'absent' };
    for (const mapping of [missing, extra, duplicate, wrongMode, nonexistent]) {
      const r = run('assemble', ...changed(f.args, '--preview-ids', JSON.stringify(mapping))); assert.notEqual(r.status, 0, r.stderr); assert.equal(fs.existsSync(f.out), false);
    }
    const data = fixture().filter(x => x.id !== 'item-0-1'); fs.writeFileSync(f.input, JSON.stringify(data));
    const r = run('assemble', ...f.args); assert.notEqual(r.status, 0); assert.match(r.stderr, /non-preview example/); assert.equal(fs.existsSync(f.out), false);
  } finally { f.clean(); }
});
test('rejects invalid conversion, symlinked sources and pre-existing output', () => {
  const f = setup(); try {
    const data = fixture(); data[0].sources = []; fs.writeFileSync(f.input, JSON.stringify(data));
    assert.notEqual(run('assemble', ...f.args).status, 0); assert.equal(fs.existsSync(f.out), false);
    fs.writeFileSync(f.input, JSON.stringify(fixture())); const link = path.join(f.dir, 'source-link'); fs.symlinkSync(f.input, link);
    assert.notEqual(run('assemble', ...changed(f.args, '--input', link)).status, 0);
    fs.mkdirSync(f.out); fs.writeFileSync(path.join(f.out, 'keep'), 'untouched');
    assert.notEqual(run('assemble', ...f.args).status, 0); assert.equal(fs.readFileSync(path.join(f.out, 'keep'), 'utf8'), 'untouched');
  } finally { f.clean(); }
});
