import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { getAllCourses } from '../shared/courseRegistry.ts';
import { interactiveModes, interactivePackageSchema } from '../server/interactiveContent/schema.ts';
import { validateInteractivePackage } from '../server/interactiveContent/loader.ts';

const root = '/home/ubuntu/outputs/echelon-six-games-2026-11-12/release-candidate';
const meta = JSON.parse(fs.readFileSync(`${root}/server-only-metadata.json`));
const sha = x => createHash('sha256').update(x).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file));

test('candidate includes exactly the active canonical non-electrician courses, not aliases or 309', () => {
  const keys = getAllCourses().filter(c => c.isActive && c.track !== 'construction-electrician').map(c => c.courseKey).sort();
  assert.equal(keys.length, 38);
  assert.deepEqual(meta.courses.map(x => x.courseKey).sort(), keys);
  assert.equal(meta.counts.examples, 4069);
  assert.ok(keys.every(key => !/309/i.test(key)));
});
test('actual packages preserve exact source, deterministic IDs, six-mode coverage and hashes', () => {
  const seen = new Set();
  for (const row of meta.courses) {
    const bytes = fs.readFileSync(row.package.path), pkg = JSON.parse(bytes), prov = json(row.provenance.path), sourceBytes = fs.readFileSync(row.source.path), source = JSON.parse(sourceBytes);
    assert.equal(sha(bytes), row.package.sha256);
    assert.equal(sha(fs.readFileSync(row.provenance.path)), row.provenance.sha256);
    assert.equal(sha(sourceBytes), row.source.sha256);
    assert.deepEqual(Buffer.from(prov.source.originalBytes, 'base64'), sourceBytes);
    assert.equal(pkg.courseKey, row.courseKey);
    assert.equal(pkg.status, 'draft');
    assert.equal(pkg.examples.length, source.length);
    assert.ok(pkg.examples.length < 300);
    for (const item of pkg.examples) { assert.ok(!seen.has(item.id)); seen.add(item.id); assert.doesNotMatch(item.id, /309/i); }
    for (const mode of interactiveModes) {
      const items = pkg.examples.filter(x => x.mode === mode);
      assert.ok(items.length >= 2, `${row.courseKey}: ${mode}`);
      assert.equal(pkg.previewIds[mode], items.map(x => x.id).sort()[0]);
      assert.equal(row.modeCounts[mode], items.length);
    }
    for (const ref of row.reviewReferences) assert.equal(sha(fs.readFileSync(ref.path)), ref.sha256);
  }
  assert.equal(seen.size, 4069);
});
test('real schema and loader fail closed for drafts and wrong keys; ephemeral compatibility passes only', () => {
  for (const row of meta.courses) {
    const draft = json(row.package.path);
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
