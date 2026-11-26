import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getAllCourses } from '../shared/courseRegistry.ts';
import { interactiveModes, interactivePackageSchema } from '../server/interactiveContent/schema.ts';
import { loadInteractivePackage, validateInteractivePackage } from '../server/interactiveContent/loader.ts';
import { releasePackages } from '../server/interactiveContent/release-2026-11-12/registry.ts';
import releaseMetadata from '../server/interactiveContent/release-2026-11-12/release-metadata.json' with { type: 'json' };
import { validatePack } from './validate-interactive-drafts.mjs';

// Only the default external candidate is optional. An explicitly selected path
// must exist; failures are reported as tests rather than silently skipping.
const explicit = Object.hasOwn(process.env, 'ECHELON_SIX_CANDIDATE_DIR');
const root = path.resolve(process.env.ECHELON_SIX_CANDIDATE_DIR ?? '/home/ubuntu/outputs/echelon-six-games-2026-11-12/release-candidate');
let candidateExists = false;
let candidatePresent = false;
try { candidatePresent = fs.lstatSync(root).isDirectory(); candidateExists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
const candidateOptions = { skip: !explicit && !candidateExists ? `External candidate not present: ${root}` : false };
const sha = x => createHash('sha256').update(x).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file));
const activeKeys = () => getAllCourses().filter(c => c.isActive && c.track !== 'construction-electrician').map(c => c.courseKey).sort();
const candidateFile = (key, name) => path.join(root, key, name);

test('registry contains the expected active canonical non-electrician courses', () => {
  const keys = activeKeys();
  assert.equal(keys.length, 38);
  assert.ok(keys.every(key => !/309/i.test(key)));
});

test('integrated release registry and actual loader cover canonical courses independently of the candidate', () => {
  const keys = activeKeys();
  assert.deepEqual(Object.keys(releasePackages).sort(), keys);
  const ids = new Set(), totals = Object.fromEntries(interactiveModes.map(mode => [mode, 0]));
  for (const key of keys) {
    const loaded = loadInteractivePackage(key);
    assert.equal(loaded.status, 'valid', key);
    const pkg = loaded.package;
    assert.equal(pkg.courseKey, key);
    for (const mode of interactiveModes) {
      const items = pkg.examples.filter(item => item.mode === mode);
      assert.ok(items.length >= 2, `${key}: ${mode}`);
      assert.equal(pkg.previewIds[mode], items.map(item => item.id).sort()[0]);
      totals[mode] += items.length;
    }
    for (const item of pkg.examples) {
      assert.ok(!ids.has(item.id), item.id);
      assert.doesNotMatch(item.id, /309/i);
      ids.add(item.id);
    }
  }
  assert.equal(ids.size, releaseMetadata.counts.examples);
  assert.equal(keys.length, releaseMetadata.counts.courses);
  assert.deepEqual(totals, releaseMetadata.counts.modes);
  for (const key of ['__proto__', 'constructor', 'electrician-309a', 'class1', 'not-a-course']) {
    assert.deepEqual(loadInteractivePackage(key), { status: 'absent' });
  }
});

test('candidate includes exactly the active canonical non-electrician courses, not aliases or 309', candidateOptions, () => {
  assert.ok(candidatePresent, `Explicit candidate directory missing or not a directory: ${root}`);
  const keys = activeKeys();
  const meta = json(path.join(root, 'server-only-metadata.json'));
  assert.deepEqual(meta.courses.map(x => x.courseKey).sort(), keys);
  assert.equal(meta.counts.examples, 4069);
});

test('selected packages match reviewed source conversion, provenance and review hashes', candidateOptions, () => {
  const meta = json(path.join(root, 'server-only-metadata.json'));
  const seen = new Set();
  const reviewerBytes = fs.readFileSync(path.join(root, 'ai-reviewers.json'));
  const sourceRoot = path.resolve(meta.sourceRoot);
  for (const row of meta.courses) {
    // The metadata contains old absolute build paths. Never use them to read a
    // package or sidecar: copies must be checked in the selected directory.
    const bytes = fs.readFileSync(candidateFile(row.courseKey, 'package.json'));
    const provBytes = fs.readFileSync(candidateFile(row.courseKey, 'provenance.json'));
    const pkg = JSON.parse(bytes), prov = JSON.parse(provBytes);
    // Reviewed sources and review records are external to the candidate.
    // Check their exact expected names and locations, not arbitrary references.
    assert.equal(path.resolve(row.source.path), path.join(sourceRoot, `${row.courseKey}.json`));
    const sourceBytes = fs.readFileSync(row.source.path), source = JSON.parse(sourceBytes);
    assert.equal(sha(bytes), row.package.sha256);
    assert.equal(sha(provBytes), row.provenance.sha256);
    assert.equal(sha(sourceBytes), row.source.sha256);
    assert.equal(sourceBytes.length, row.source.bytes);
    assert.equal(prov.packageSha256, sha(bytes));
    assert.equal(prov.source.sha256, sha(sourceBytes));
    assert.equal(prov.source.fileName, `${row.courseKey}.json`);
    assert.equal(prov.source.encoding, 'base64');
    assert.deepEqual(Buffer.from(prov.source.originalBytes, 'base64'), sourceBytes);
    assert.equal(prov.reviewers.fileName, 'ai-reviewers.json');
    assert.equal(prov.reviewers.encoding, 'base64');
    assert.equal(prov.reviewers.sha256, sha(reviewerBytes));
    assert.deepEqual(Buffer.from(prov.reviewers.originalBytes, 'base64'), reviewerBytes);
    assert.deepEqual(prov.reviewers.entries, JSON.parse(reviewerBytes));
    const converted = validatePack(source, `${row.courseKey}.json`);
    assert.equal(converted.valid, true, `${row.courseKey}: ${JSON.stringify(converted.errors)}`);
    assert.deepEqual(pkg.examples, converted.examples, `${row.courseKey}: source conversion differs`);
    assert.deepEqual(prov.items, converted.provenance, `${row.courseKey}: provenance differs`);
    assert.equal(pkg.courseKey, row.courseKey);
    assert.equal(pkg.status, 'draft');
    assert.equal(pkg.examples.length, source.length);
    assert.equal(row.itemCount, source.length);
    assert.ok(pkg.examples.length < 300);
    for (const item of pkg.examples) { assert.ok(!seen.has(item.id)); seen.add(item.id); assert.doesNotMatch(item.id, /309/i); }
    for (const mode of interactiveModes) {
      const items = pkg.examples.filter(x => x.mode === mode);
      assert.ok(items.length >= 2, `${row.courseKey}: ${mode}`);
      assert.equal(pkg.previewIds[mode], items.map(x => x.id).sort()[0]);
      assert.equal(row.previewIds[mode], pkg.previewIds[mode]);
      assert.equal(row.modeCounts[mode], items.length);
    }
    const reviewDirs = ['research', 'review', 'topup-review', 'order-review'];
    assert.equal(row.reviewReferences.length, reviewDirs.length);
    for (const [index, ref] of row.reviewReferences.entries()) {
      assert.equal(path.resolve(ref.path), path.join(path.dirname(sourceRoot), reviewDirs[index], `${row.courseKey}.md`));
      assert.equal(sha(fs.readFileSync(ref.path)), ref.sha256);
    }
  }
  assert.equal(seen.size, 4069);
});

test('real schema and loader fail closed for drafts and wrong keys; ephemeral compatibility passes only', candidateOptions, () => {
  const meta = json(path.join(root, 'server-only-metadata.json'));
  for (const row of meta.courses) {
    const draft = json(candidateFile(row.courseKey, 'package.json'));
    assert.equal(interactivePackageSchema.safeParse(draft).success, false);
    assert.equal(validateInteractivePackage(row.courseKey, { approved: true, content: draft }), null);
    const isolated = { ...draft, status: 'approved' };
    assert.equal(interactivePackageSchema.safeParse(isolated).success, true, row.courseKey);
    assert.ok(validateInteractivePackage(row.courseKey, { approved: true, content: isolated }));
    assert.equal(validateInteractivePackage(`${row.courseKey}-wrong`, { approved: true, content: isolated }), null);
    assert.equal(validateInteractivePackage(row.courseKey, { approved: false, content: isolated }), null);
    const wrongPreview = { ...isolated, previewIds: { ...isolated.previewIds, 'rapid-swipe': isolated.previewIds['speed-match'] } };
    assert.equal(interactivePackageSchema.safeParse(wrongPreview).success, false);
    assert.equal(interactivePackageSchema.safeParse({ ...isolated, extra: 1 }).success, false);
  }
});
