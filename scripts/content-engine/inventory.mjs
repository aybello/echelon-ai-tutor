import fs from 'node:fs';
import path from 'node:path';
import { COURSES, VERSION, RELEASE_RELATIVE } from './constants.mjs';
import { bytesHash, hash } from './identity.mjs';
import { DocumentSchema } from './schemas.mjs';
const METADATA_HASH = 'e0eb408247ea89082baa3cf68d158d66932ac82b9cd4dcda7f4a0508ef95fd85';
function immutableRead(root, relative) {
  const file = path.join(root, relative);
  let cursor = root;
  for (const component of relative.split('/')) { cursor = path.join(cursor, component); if (fs.lstatSync(cursor).isSymbolicLink()) throw Error('release-symlink-denied'); }
  if (!fs.lstatSync(file).isFile() || !fs.realpathSync(file).startsWith(fs.realpathSync(root) + path.sep)) throw Error('release-file-containment-failed');
  return fs.readFileSync(file);
}
export function readRelease(repoRoot) {
  const release = path.join(fs.realpathSync(repoRoot), RELEASE_RELATIVE);
  if (fs.lstatSync(release).isSymbolicLink()) throw Error('release-symlink-denied');
  const bytes = immutableRead(release, 'release-metadata.json');
  if (bytesHash(bytes) !== METADATA_HASH) throw Error('pinned-release-metadata-hash-mismatch');
  const metadata = JSON.parse(bytes);
  if (metadata.courses.length !== COURSES.length || metadata.courses.some(c => !COURSES.includes(c.courseKey))) throw Error('release-course-scope-mismatch');
  const packages = []; const provenance = {}; const missingCourses = [];
  const names = fs.readdirSync(path.join(release, 'packages'));
  if (names.some(n => !COURSES.some(c => n === `${c}.json`))) throw Error('unexpected-release-file');
  for (const courseKey of COURSES) {
    if (!names.includes(`${courseKey}.json`)) { missingCourses.push(courseKey); continue; }
    const row = metadata.courses.find(c => c.courseKey === courseKey);
    const pkgBytes = immutableRead(release, `packages/${courseKey}.json`);
    const provBytes = immutableRead(release, `provenance/${courseKey}.json`);
    if (bytesHash(pkgBytes) !== row.releasedPackageSha256 || bytesHash(provBytes) !== row.provenanceSha256) throw Error('immutable-release-hash-mismatch');
    const pkg = JSON.parse(pkgBytes); const prov = JSON.parse(provBytes);
    if (pkg.courseKey !== courseKey || pkg.examples.length !== row.itemCount) throw Error('release-package-scope-mismatch');
    packages.push({ ...pkg, packageHash: bytesHash(pkgBytes) }); provenance[courseKey] = prov;
  }
  return { packages, provenance, missingCourses, metadataHash: METADATA_HASH };
}
export function stage(packages, provenance = {}) {
  const sources = new Map(); const exercises = [];
  for (const pkg of packages) {
    if (!COURSES.includes(pkg.courseKey)) throw Error('course-outside-approved-scope');
    for (const item of pkg.examples) {
      const originalRows = (provenance[pkg.courseKey]?.items ?? []).filter(r => r.id === item.id);
      const urls = [...new Set(originalRows.flatMap(r => r.sources ?? []))];
      const sourceEvidenceRefs = urls.map(url => {
        const sourceId = `legacy-url-${hash(url).slice(0,24)}`;
        if (!sources.has(sourceId)) sources.set(sourceId, { schemaVersion: VERSION, sourceId, publisher: null, title: null, url,
          docLocator: null, retrievedAt: null, snapshotHash: null, rightsBasis: null, permittedUsage: [], evidence: [] });
        return { sourceId, evidenceId: 'unresolved-legacy-citation' };
      });
      exercises.push({ schemaVersion: VERSION, exerciseId: item.id, courseKey: pkg.courseKey, mode: item.mode,
        conceptRefs: [], objectiveId: null, jurisdiction: null, examLevel: null, blueprintVersion: null,
        difficulty: 'unclassified', difficultyRationale: null, variantFamilyId: null, parameters: {}, units: {},
        item: structuredClone(item), sourceEvidenceRefs, contentHash: hash(item), claimType: 'unclassified', originality: 'unverified',
        authorityEvidence: [], calculationChecks: [], reviews: [], legacy: {
          packageVersion: pkg.version, packageHash: pkg.packageHash ?? hash(pkg), softwareStatus: pkg.status,
          aiReviewDeclared: (provenance[pkg.courseKey]?.reviewers?.entries ?? []).some(r => r.type === 'ai'),
          provenanceRefs: [`${RELEASE_RELATIVE}/provenance/${pkg.courseKey}.json`],
          notice: 'Existing release inventory retained; AI/software status is legacy declaration only. No human technical review, difficulty, objective, originality or rights determination is inferred.',
        } });
    }
  }
  const document = { schemaVersion: VERSION, notice: 'Private authoring inventory, not fully reviewed or activated. Source URLs are unresolved citations, not snapshot evidence or rights permission. Original practice only; no ripped/live/recalled exams.', sources: [...sources.values()], concepts: [], exercises };
  return DocumentSchema.parse(document);
}
