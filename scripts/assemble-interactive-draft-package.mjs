#!/usr/bin/env node
/**
 * Offline, draft-only package assembly and verification. Run with --import tsx.
 * See scripts/interactive-draft-package-usage.md. Never edits the registry.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { interactivePackageSchema } from '../server/interactiveContent/schema.ts';
import { MODES, validatePack } from './validate-interactive-drafts.mjs';

const project = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
// Zod's safeExtend preserves the strict object and all cross-field refinements.
// No approved object is ever fabricated or written for validation.
const draftSchema = interactivePackageSchema.safeExtend({ status: z.literal('draft') });
const forbidden = value => /309[\W_]*a/i.test(value.normalize('NFKC'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (child, parent) => { const rel = path.relative(parent, child); return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)); };
const id = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value);
const exactKeys = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) && isDeepStrictEqual(Object.keys(obj).sort(), [...keys].sort());
function regularFile(file) {
  if (typeof file !== 'string' || !file) throw new Error('An explicit input file path is required.');
  if (forbidden(file)) throw new Error('309A inputs are prohibited.');
  if (!fs.lstatSync(file).isFile()) throw new Error(`Expected a regular file (not a symlink): ${file}`);
  const resolved = fs.realpathSync(file);
  if (forbidden(resolved)) throw new Error('309A inputs are prohibited.');
  return { path: resolved, bytes: fs.readFileSync(resolved) };
}
function parseJson(bytes, name) {
  try { return JSON.parse(bytes.toString('utf8')); } catch { throw new Error(`${name} must contain valid JSON.`); }
}
function build({ input, courseKey, previewIds, status, version, reviewers }) {
  if (status !== 'draft') throw new Error('Explicit --status draft is required; approval is prohibited.');
  if (typeof courseKey !== 'string' || !courseKey.trim() || courseKey !== courseKey.trim() || courseKey.length > 64 || forbidden(courseKey)) throw new Error('Invalid or prohibited course key.');
  if (typeof version !== 'string' || !version.trim() || version !== version.trim() || version.length > 80) throw new Error('An explicit nonempty version (max 80 characters) is required.');
  if (!exactKeys(previewIds, MODES) || MODES.some(mode => !id(previewIds[mode])) || new Set(Object.values(previewIds)).size !== 6) throw new Error('Preview IDs must be an object with exactly six distinct IDs, one for each mode.');
  const source = regularFile(input), reviewSource = regularFile(reviewers);
  const sourceData = parseJson(source.bytes, 'Input');
  if (forbidden(JSON.stringify(sourceData))) throw new Error('309A input content is prohibited.');
  const reviewerData = parseJson(reviewSource.bytes, 'Reviewers');
  if (!Array.isArray(reviewerData) || !reviewerData.length || reviewerData.some(r => !exactKeys(r, ['type', 'name']) || r.type !== 'ai' || typeof r.name !== 'string' || !r.name.trim() || r.name !== r.name.trim() || r.name.length > 200)) throw new Error('Reviewers must be a nonempty JSON array of {"type":"ai","name":"..."} objects; human review is not asserted.');
  const converted = validatePack(sourceData, path.basename(source.path));
  if (!converted.valid) throw new Error(`Input failed structural validation: ${JSON.stringify(converted.errors)}`);
  const pkg = { courseKey, status, version, previewIds: Object.fromEntries(MODES.map(mode => [mode, previewIds[mode]])), examples: converted.examples };
  const checked = draftSchema.safeParse(pkg);
  if (!checked.success) throw new Error(`Draft package failed strict server-derived validation: ${JSON.stringify(checked.error.issues)}`);
  // The schema may trim values; preserve source values and reject transformations.
  if (!isDeepStrictEqual(pkg, checked.data)) throw new Error('Package contains values the server schema would transform; normalize input explicitly before assembly.');
  const provenance = {
    format: 'interactive-draft-provenance-v1',
    notice: 'AI reviewer metadata is supplied by the operator, not independently verified. Structural checks are not factual or human review. No approval or activation.',
    source: { fileName: path.basename(source.path), sha256: sha256(source.bytes), encoding: 'base64', originalBytes: source.bytes.toString('base64') },
    reviewers: { fileName: path.basename(reviewSource.path), sha256: sha256(reviewSource.bytes), encoding: 'base64', originalBytes: reviewSource.bytes.toString('base64'), entries: reviewerData },
    packageSha256: sha256(Buffer.from(serialize(pkg))),
    items: converted.provenance,
  };
  return { pkg, provenance };
}
const serialize = value => `${JSON.stringify(value, null, 2)}\n`;
function parseArgs(args) {
  const command = args.shift();
  if (command === '--help' || command === 'help') return { help: true };
  if (!['assemble', 'verify'].includes(command)) throw new Error('Expected assemble or verify. Use --help for usage.');
  const fields = new Set(['--input', '--course-key', '--preview-ids', '--status', '--version', '--reviewers', '--out-dir']);
  const values = {};
  while (args.length) {
    const flag = args.shift();
    if (!fields.has(flag) || Object.hasOwn(values, flag) || !args.length || args[0].startsWith('--')) throw new Error(`Invalid or repeated argument: ${flag}`);
    values[flag] = args.shift();
  }
  for (const flag of fields) if (!Object.hasOwn(values, flag)) throw new Error(`Missing ${flag}.`);
  let previewIds;
  try { previewIds = JSON.parse(values['--preview-ids']); } catch { throw new Error('--preview-ids must be a JSON object.'); }
  return { command, input: values['--input'], courseKey: values['--course-key'], previewIds, status: values['--status'], version: values['--version'], reviewers: values['--reviewers'], output: values['--out-dir'] };
}
function outputLocation(output, existing) {
  if (!output || forbidden(output)) throw new Error('Invalid or prohibited output directory.');
  const full = path.resolve(output);
  if (existing) {
    if (!fs.lstatSync(full).isDirectory()) throw new Error('Verification output directory must be a real directory.');
    const real = fs.realpathSync(full);
    if (inside(real, project) || forbidden(real)) throw new Error('Output must be outside the project and not 309A.');
    return real;
  }
  const parent = fs.realpathSync(path.dirname(full));
  const target = path.join(parent, path.basename(full));
  if (inside(target, project) || forbidden(target)) throw new Error('Output must be outside the project and not 309A.');
  return target;
}
export function run(args) {
  const p = parseArgs([...args]);
  if (p.help) { console.log('Usage: node --import tsx scripts/assemble-interactive-draft-package.mjs assemble|verify --input FILE --course-key KEY --preview-ids JSON_OBJECT --status draft --version VERSION --reviewers JSON_FILE --out-dir DIRECTORY\nSee scripts/interactive-draft-package-usage.md.'); return 0; }
  const output = outputLocation(p.output, p.command === 'verify');
  const result = build(p);
  const expected = { 'package.json': serialize(result.pkg), 'provenance.json': serialize(result.provenance) };
  if (p.command === 'assemble') {
    // mkdir is exclusive; never reuse or replace an existing directory, including symlinks.
    fs.mkdirSync(output, { mode: 0o700 });
    const created = [];
    try {
      for (const [name, text] of Object.entries(expected)) {
        const file = path.join(output, name), fd = fs.openSync(file, 'wx', 0o600);
        created.push(file);
        try { fs.writeFileSync(fd, text); } finally { fs.closeSync(fd); }
      }
    } catch (e) { for (const file of created) { try { fs.unlinkSync(file); } catch {} } try { fs.rmdirSync(output); } catch {} throw e; }
  } else {
    for (const [name, text] of Object.entries(expected)) {
      const file = path.join(output, name);
      if (!fs.lstatSync(file).isFile() || fs.readFileSync(file, 'utf8') !== text) throw new Error(`Verification failed for ${name}: differs from deterministic reconstruction.`);
    }
  }
  console.log(JSON.stringify({ operation: p.command, valid: true, status: 'draft', outputDirectory: output, packageSha256: result.provenance.packageSha256, notice: 'Structural checks only; no human review, approval, registration, or activation.' }, null, 2));
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { process.exitCode = run(process.argv.slice(2)); }
  catch (e) { console.error(`Error: ${e.message}`); process.exitCode = 1; }
}
