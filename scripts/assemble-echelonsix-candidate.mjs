#!/usr/bin/env node
// Offline only. Run: node --import tsx scripts/assemble-echelonsix-candidate.mjs [assemble|verify]
// No registry/loader modifications, network access, or database operations.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { getAllCourses, getCourseByKey } from '../shared/courseRegistry.ts';
import { interactiveModes, interactivePackageSchema } from '../server/interactiveContent/schema.ts';
import { validateInteractivePackage } from '../server/interactiveContent/loader.ts';
import { run as draftBuilder } from './assemble-interactive-draft-package.mjs';
import { validatePack } from './validate-interactive-drafts.mjs';

const root = '/home/ubuntu/outputs/echelon-six-games-2026-11-12';
const output = `${root}/release-candidate`;
const inputDir = `${root}/combined-reviewed`;
const version = 'echelon-six-games-2026-11-12-rc1';
const modes = [...interactiveModes];
const stringify = o => `${JSON.stringify(o, null, 2)}\n`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = m => { throw new Error(m); };
const read = p => { if (!fs.lstatSync(p).isFile()) fail(`Not a regular file: ${p}`); return fs.readFileSync(p); };
const ref = p => ({ path: p, sha256: hash(read(p)) });
const sorted = a => [...a].sort();
const expect = (a, b, message) => { if (!isDeepStrictEqual(a, b)) fail(message); };
const write = (p, content) => fs.writeFileSync(p, content, { flag: 'wx', mode: 0o600 });
const emit = (p, text, verify) => verify ? expect(read(p).toString('utf8'), text, `Mismatch: ${p}`) : write(p, text);

function build(verify = false) {
  const expected = sorted(getAllCourses().filter(c => c.isActive && c.track !== 'construction-electrician').map(c => c.courseKey));
  if (expected.length !== 38 || expected.some(k => /309/i.test(k))) fail('Unexpected canonical active-course scope; refusing to infer a different rollout.');
  const files = sorted(fs.readdirSync(inputDir));
  expect(files, sorted(expected.map(k => `${k}.json`)), 'Input names differ from exact canonical active course keys; aliases and extras forbidden.');
  if (verify) { if (!fs.lstatSync(output).isDirectory()) fail('Candidate directory missing or not a real directory.'); }
  else if (fs.existsSync(output)) fail('Candidate already exists; refusing to overwrite.');
  const stage = verify ? output : `${root}/.echelon-six-candidate-${process.pid}`;
  if (!verify) fs.mkdirSync(stage, { mode: 0o700 });
  try {
    const reviewersText = stringify([{ type: 'ai', name: 'AI review (specific model identity not independently authenticated; see review references)' }]);
    const reviewers = path.join(stage, 'ai-reviewers.json');
    emit(reviewers, reviewersText, verify);
    const rows = [], allIds = new Set(), totals = Object.fromEntries(modes.map(m => [m, 0]));
    for (const key of expected) {
      const entry = getCourseByKey(key);
      if (!entry || entry.courseKey !== key || !entry.isActive || entry.track === 'construction-electrician') fail(`Noncanonical course: ${key}`);
      const input = `${inputDir}/${key}.json`, sourceBytes = read(input), source = JSON.parse(sourceBytes);
      const result = validatePack(source, `${key}.json`);
      if (!result.valid) fail(`${key}: ${JSON.stringify(result.errors)}`);
      if (source.length >= 300 || modes.some(m => result.modeCounts[m] < 2)) fail(`${key}: requires fewer than 300 items and at least two of every mode.`);
      for (const x of source) {
        if (/309/i.test(x.id)) fail(`Excluded course ID: ${x.id}`);
        // The WPI IV wastewater source uses a documented legacy ww prefix for
        // original reviewed items; the file/review title provides course context.
        if (!x.id.startsWith(`${key}-`) && !(key === 'wpi-class4-wastewater' && x.id.startsWith('wpi-class4-ww-'))) fail(`${key}: unexpected item ID ${x.id}`);
        if (allIds.has(x.id)) fail(`Duplicate ID across courses: ${x.id}`);
        allIds.add(x.id);
      }
      const previews = Object.fromEntries(modes.map(mode => [mode, sorted(source.filter(x => x.mode === mode).map(x => x.id))[0]]));
      const out = path.join(stage, key);
      const args = [verify ? 'verify' : 'assemble', '--input', input, '--course-key', key, '--preview-ids', JSON.stringify(previews), '--status', 'draft', '--version', version, '--reviewers', reviewers, '--out-dir', out];
      const originalLog = console.log; try { console.log = () => {}; draftBuilder(args); } finally { console.log = originalLog; }
      const pkgBytes = read(path.join(out, 'package.json')), pkg = JSON.parse(pkgBytes);
      const prov = JSON.parse(read(path.join(out, 'provenance.json')));
      if (pkg.status !== 'draft' || pkg.courseKey !== key || pkg.examples.length !== source.length || prov.packageSha256 !== hash(pkgBytes)) fail(`${key}: builder output mismatch.`);
      expect(Buffer.from(prov.source.originalBytes, 'base64'), sourceBytes, `${key}: source byte preservation failed.`);
      expect(pkg.examples, result.examples, `${key}: converter output changed.`);
      // Runtime schema insists on approved, so exercise the real schema and loader
      // with a temporary in-memory copy. Never serialize the substituted value.
      if (interactivePackageSchema.safeParse(pkg).success) fail(`${key}: stored draft unexpectedly passes production status gate.`);
      const isolated = { ...pkg, status: 'approved' };
      const parsed = interactivePackageSchema.safeParse(isolated);
      if (!parsed.success) fail(`${key}: isolated real schema validation: ${JSON.stringify(parsed.error.issues)}`);
      if (!validateInteractivePackage(key, { approved: true, content: isolated })) fail(`${key}: isolated loader validation failed.`);
      if (validateInteractivePackage(key, { approved: true, content: pkg }) || validateInteractivePackage(`${key}-wrong`, { approved: true, content: isolated }) || validateInteractivePackage(key, { approved: false, content: isolated })) fail(`${key}: fail-closed checks failed.`);
      const references = ['research', 'review', 'topup-review', 'order-review'].map(d => ref(`${root}/${d}/${key}.md`));
      for (const mode of modes) totals[mode] += result.modeCounts[mode];
      rows.push({ courseKey: key, displayName: entry.displayName, examFamily: entry.examFamily, track: entry.track, questionBankKey: entry.questionBankKey, source: { ...ref(input), bytes: sourceBytes.length }, reviewReferences: references, package: { path: `${output}/${key}/package.json`, sha256: hash(pkgBytes), storedStatus: 'draft' }, provenance: { path: `${output}/${key}/provenance.json`, sha256: hash(read(path.join(out, 'provenance.json'))) }, itemCount: source.length, modeCounts: result.modeCounts, previewIds: previews, legacyItemIdPrefixCount: source.filter(x => !x.id.startsWith(`${key}-`)).length });
    }
    const metadata = {
      format: 'echelon-six-games-candidate-metadata-v1', visibility: 'server-only; contains answers and source materials',
      contentAuthorship: 'AI-authored', review: 'AI-reviewed against primary sources in prior research/review stages; no human subject-matter review is claimed. Referenced records vary by item and document their scope and limitations.',
      limitations: 'This assembly independently performs structural checks only; it does not verify claims, citations, source currency, jurisdiction, safety, instructional quality, or human sign-off. Prior AI research/review can contain errors. Source notes include specific restrictions and may recommend expert review.',
      releaseDecision: 'Candidate only. Draft packages are not loadable by the runtime; no registry/loader changes, deployment, or production database access.',
      runtimeSchemaTest: 'The actual schema and loader were tested with an ephemeral in-memory copy whose status was changed from draft to approved and an ephemeral approved registration. Nothing with substituted status was written or registered. This tests compatibility, not release approval, factual accuracy, or human review.',
      previewSelection: 'Lexicographically smallest existing item ID per mode, deterministic, not editorially evaluated.',
      sourceRoot: inputDir, courseRegistry: ref(path.resolve('shared/courseRegistry.ts')), converter: ref(path.resolve('scripts/assemble-interactive-draft-package.mjs')), structuralConverter: ref(path.resolve('scripts/validate-interactive-drafts.mjs')), runtimeSchema: ref(path.resolve('server/interactiveContent/schema.ts')), runtimeLoader: ref(path.resolve('server/interactiveContent/loader.ts')),
      priorReports: ['combined-review-report.md','combined-validation-report.json'].map(f => ref(`${root}/${f}`)),
      counts: { courses: rows.length, examples: allIds.size, modes: totals }, courses: rows,
    };
    emit(path.join(stage, 'server-only-metadata.json'), stringify(metadata), verify);
    const readme = `# Six-game static content release candidate\n\n**Server-only: these files contain answers and source content.** Do not publish or import them into client assets. This is an offline testable candidate, not a deployment.\n\n${rows.length} canonical active non-electrician courses, ${allIds.size} examples, six modes per course, at least two examples per mode, and fewer than 300 per package. Course keys match the canonical registry exactly, including the western collection course keys. The WPI Class IV wastewater file includes ${rows.find(r => r.courseKey === 'wpi-class4-wastewater').legacyItemIdPrefixCount} legacy \`wpi-class4-ww-\` IDs, retained unchanged from its course-specific reviewed source. No 309 course or item IDs are included.\n\nThe content is **AI-authored and AI-reviewed**, not human subject-matter reviewed. Prior AI-driven source research and reviews are referenced and hashed per course in \`server-only-metadata.json\`; source files, citations, original answers, and source bytes are preserved by each provenance sidecar. Read those records for item-level decisions, source limitations and any recommended expert review. The builder has not independently verified facts, citations, source currency, legal applicability, safety, or pedagogical suitability. SHA-256 hashes establish consistency, not authorship or independent authenticity.\n\nEvery on-disk package is \`draft\`: the existing builder refuses to fabricate an approved artifact, and the actual runtime schema rejects drafts. To test compatibility without implying approval, assembly tests the actual schema and loader on a temporary **in-memory-only** copy with the required status and registration flag; this is not review, sign-off, registration, or authorization. Deterministic previews are the lexicographically smallest ID per mode; they are not editorially selected. No registry or loader edits, deployment, or database work were performed. Making any future runtime-loadable package requires a separate release implementation.\n\n## Reproduce and verify\n\nFrom \`/home/ubuntu/echelon-ai-tutor\`, with the original source/review files present:\n\n\`node --import tsx scripts/assemble-echelonsix-candidate.mjs verify\`\n\nFor a fresh build, first move/remove the existing release-candidate directory separately, then run \`node --import tsx scripts/assemble-echelonsix-candidate.mjs assemble\`. The builder refuses overwrite and writes atomically into a new external directory. Verify reconstructs and compares package/provenance bytes, metadata, review hashes and README, including actual runtime schema checks. No network or database is used.\n`;
    emit(path.join(stage, 'README.md'), readme, verify);
    const actualRoot = sorted(fs.readdirSync(stage));
    expect(actualRoot, sorted([...expected, 'README.md', 'server-only-metadata.json', 'ai-reviewers.json']), 'Unexpected candidate root contents.');
    for (const key of expected) expect(sorted(fs.readdirSync(path.join(stage,key))), ['package.json','provenance.json'], `Unexpected contents for ${key}`);
    if (!verify) fs.renameSync(stage, output);
    console.log(stringify({ operation: verify ? 'verify' : 'assemble', valid: true, output, counts: metadata.counts, note: 'Draft only; isolated in-memory runtime-schema compatibility checks are not approval or human review.' }));
  } catch (e) { if (!verify) fs.rmSync(stage, { recursive: true, force: true }); throw e; }
}
try { const command = process.argv[2] ?? 'assemble'; if (!['assemble','verify'].includes(command) || process.argv.length > 3) fail('Usage: assemble-echelonsix-candidate.mjs [assemble|verify]'); build(command === 'verify'); } catch (e) { console.error(`Error: ${e.message}`); process.exitCode = 1; }
