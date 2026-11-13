#!/usr/bin/env node
/**
 * Offline structural validation/conversion, not a factual or release review.
 * Usage: node scripts/validate-interactive-drafts.mjs --input FILE_OR_DIR [--out-dir EXISTING_DIR]
 * A directory is scanned non-recursively for .json files, in lexical order.
 * JSON report goes to stdout; diagnostics go to stderr. Exit 1 means invalid,
 * exit 2 means a usage or I/O error. With --out-dir, conversion is all-or-nothing:
 * no files are written unless every input passes. Existing targets are never replaced.
 * Outputs are review artifacts, NOT interactivePackageSchema packages: no status,
 * version, preview IDs, approval, or registry entry is created. Citations and
 * original answers/options/pairs are retained separately from strict examples.
 * Source draft arrays require id, mode, prompt, answer, explanation, sources,
 * options, and pairs. Optional instruction is passed through. IDs for choices
 * and pairs are deterministic positional identifiers, not factual content.
 * Named before-after examples use two string options and correctAnswer;
 * literal directions stay legacy. Visible hints and sequences are rejected.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const MODES = ['rapid-swipe', 'speed-match', 'odd-one-out', 'cause-effect', 'tap-the-flaw', 'before-after'];
const choiceModes = new Set(['odd-one-out', 'cause-effect', 'tap-the-flaw']);
const validId = s => typeof s === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(s);
const validText = s => typeof s === 'string' && s.trim().length > 0 && s.trim().length <= 4000;
// Conservative normalization, used only for duplicate detection/choice matching.
const norm = s => typeof s === 'string' ? s.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase() : '';
// Mirror the renderer's whitespace/case comparison; NFKC stays a stricter
// duplicate and visible-label check, never a substitute for a renderer match.
const rendererNorm = s => typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').toLowerCase() : '';
// Keep in sync with server/interactiveContent/schema.ts and the renderer:
// up to three normalized Unicode code points require non-word boundaries;
// Unicode letters, marks, numbers and underscore count as word characters.
const containsVisibleLabel = (visible, label) => {
  if (Array.from(label).length > 3) return visible.includes(label);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, 'u').test(visible);
};
const answerLeak = value => /(?:→|⇒|⟶|➝|->|=>)|\b(?:(?:correct\s+)?(?:answer|choice|option)\s*(?:is\b|[:=])|answer\s+key\b|hint\s*[:=]|(?:choose|select|pick)\s+(?:the\s+)?(?:first|second|left|right)\s+(?:option|choice|answer)\b|(?:first|second|left|right)\s+(?:option|choice|answer)\s+is\s+correct\b|followed\s+by\b|precedes\b|\bthen\b|first\b[^.!?]*\bsecond\b)/iu.test(value);
const sorted = a => a.sort((x, y) => x < y ? -1 : x > y ? 1 : 0);
const allowed = new Set(['id', 'mode', 'prompt', 'instruction', 'answer', 'explanation', 'sources', 'options', 'pairs']);
const issue = (code, message, index = null, id = null) => ({ code, message, index, id });

export function validatePack(data, name = 'input.json') {
  const errors = [], examples = [], provenance = [], idRefs = [], counts = Object.fromEntries(MODES.map(m => [m, 0]));
  const ids = new Map(), prompts = new Map();
  const add = (code, message, index = null, id = null) => errors.push(issue(code, message, index, id));
  if (!Array.isArray(data)) {
    add('INVALID_ROOT', 'Expected a JSON array of draft items.');
    return { name, itemCount: null, modeCounts: counts, valid: false, errors, examples, provenance, idRefs };
  }
  if (data.length < 1 || data.length > 300) add('ITEM_COUNT', 'Expected 1–300 items, matching the renderer package limit.');
  data.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) { add('INVALID_ITEM', 'Expected an item object.', index); return; }
    const id = typeof item.id === 'string' ? item.id : null;
    const itemError = (code, message) => add(code, message, index, id);
    const previousErrorCount = errors.length;
    for (const key of Object.keys(item)) if (!allowed.has(key)) itemError('UNKNOWN_FIELD', `Unknown field ${JSON.stringify(key)}; refusing to discard it.`);
    if (!validId(item.id)) itemError('INVALID_ID', 'Missing or invalid renderer ID (1–80 ASCII letters, digits, hyphens, underscores; starts alphanumeric).');
    else if (ids.has(item.id)) itemError('DUPLICATE_ID', `ID also occurs at index ${ids.get(item.id)}.`);
    else ids.set(item.id, index);
    if (validId(item.id)) idRefs.push({ id: item.id, index });
    if (!MODES.includes(item.mode)) itemError('INVALID_MODE', 'Missing or unrecognized mode.');
    else counts[item.mode]++;
    for (const key of ['prompt', 'explanation']) if (!validText(item[key])) itemError('INVALID_TEXT', `${key} must be a nonempty string of at most 4000 trimmed characters.`);
    if (item.instruction !== undefined && !validText(item.instruction)) itemError('INVALID_TEXT', 'instruction must be a nonempty string of at most 4000 trimmed characters.');
    if (validText(item.prompt)) {
      const p = norm(item.prompt);
      if (prompts.has(p)) itemError('DUPLICATE_PROMPT', `Normalized prompt also occurs at index ${prompts.get(p)}.`);
      else prompts.set(p, index);
    }
    if (!Array.isArray(item.sources) || !item.sources.length || item.sources.some(s => !validText(s))) itemError('MISSING_CITATIONS', 'sources must be a nonempty array of nonempty citation strings.');
    if (!Array.isArray(item.options)) itemError('INVALID_OPTIONS', 'options must be an array.');
    if (!Array.isArray(item.pairs)) itemError('INVALID_PAIRS', 'pairs must be an array.');
    const opts = Array.isArray(item.options) ? item.options : [];
    const pairs = Array.isArray(item.pairs) ? item.pairs : [];
    const optionNorms = opts.map(norm);
    if (opts.some(o => !validText(o))) itemError('INVALID_OPTION', 'Every option must be a nonempty string of at most 4000 trimmed characters.');
    if (new Set(optionNorms).size !== optionNorms.length) itemError('DUPLICATE_OPTIONS', 'Options contain duplicate normalized labels.');
    if (item.mode !== 'speed-match' && pairs.length) itemError('UNEXPECTED_PAIRS', 'Only speed-match may contain pairs.');
    let converted;
    const base = { id: item.id, mode: item.mode, prompt: item.prompt };
    if (item.instruction !== undefined) base.instruction = item.instruction;
    if (item.mode === 'rapid-swipe') {
      let answer = item.answer;
      if (typeof answer === 'string' && ['true', 'false'].includes(norm(answer))) answer = norm(answer) === 'true';
      if (typeof answer !== 'boolean') itemError('INVALID_BOOLEAN_ANSWER', 'rapid-swipe answer must be a boolean or an explicit True/False string.');
      if (opts.length && (opts.length !== 2 || !optionNorms.includes('true') || !optionNorms.includes('false'))) itemError('BOOLEAN_CHOICES_MISMATCH', 'rapid-swipe choices must be empty or exactly True and False.');
      converted = { ...base, correctAnswer: answer, explanation: item.explanation };
    } else if (choiceModes.has(item.mode)) {
      if (opts.length < 2 || opts.length > 20) itemError('OPTION_COUNT', 'Choice modes require 2–20 options.');
      const matches = optionNorms.map((x, i) => x && x === norm(item.answer) ? i : -1).filter(i => i >= 0);
      if (typeof item.answer !== 'string' || !norm(item.answer) || matches.length !== 1) itemError('ANSWER_CHOICE_MISMATCH', `Answer must uniquely match one normalized option; found ${matches.length}.`);
      converted = { ...base, options: opts.map((label, i) => ({ id: `option-${i + 1}`, label })), correctOptionId: matches.length === 1 ? `option-${matches[0] + 1}` : null, explanation: item.explanation };
    } else if (item.mode === 'speed-match') {
      if (opts.length) itemError('UNEXPECTED_OPTIONS', 'speed-match must not contain options.');
      if (!validText(item.answer)) itemError('INVALID_MATCH_ANSWER', 'speed-match answer must be a nonempty string.');
      if (pairs.length < 3 || pairs.length > 20) itemError('PAIR_COUNT', 'speed-match requires 3–20 pairs, matching the server schema.');
      const left = new Map(), right = new Map();
      pairs.forEach((p, i) => {
        if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).some(k => !['left', 'right'].includes(k))) { itemError('INVALID_PAIR', `Pair ${i} must contain only left and right.`); return; }
        for (const side of ['left', 'right']) if (!validText(p[side])) itemError('INVALID_PAIR_TEXT', `Pair ${i} ${side} must be a nonempty string of at most 4000 trimmed characters.`);
        for (const [side, seen] of [['left', left], ['right', right]]) {
          const value = norm(p[side]); if (!value) continue;
          if (seen.has(value)) itemError('AMBIGUOUS_MATCH_PAIR', `Pair ${i} has duplicate normalized ${side} text from pair ${seen.get(value)}.`);
          else seen.set(value, i);
        }
      });
      if (validText(item.answer) && item.answer.includes('→')) {
        const mappings = item.answer.split(';').map(s => s.split('→'));
        const encoded = mappings.map(parts => parts.length === 2 ? `${norm(parts[0])}\u0000${norm(parts[1])}` : null);
        const actual = pairs.map(p => `${norm(p?.left)}\u0000${norm(p?.right)}`);
        // A final period may punctuate the complete answer, not the last pair.
        const last = encoded.length - 1;
        if (encoded[last]?.endsWith('.') && !actual.includes(encoded[last]) && actual.includes(encoded[last].slice(0, -1))) encoded[last] = encoded[last].slice(0, -1);
        if (encoded.some(x => !x) || encoded.length !== actual.length || new Set(encoded).size !== encoded.length || encoded.some(x => !actual.includes(x)))
          itemError('MATCH_ANSWER_PAIR_MISMATCH', 'Explicit arrow-separated answer mappings must agree exactly with pairs after normalization.');
      } else if (validText(item.answer) && !/^match (?:all pairs|the pairs|each left (?:term|item) to its (?:paired|corresponding|listed) right (?:description|item))\.?$/iu.test(item.answer.trim())) {
        itemError('UNRECOGNIZED_MATCH_ANSWER', 'Match answer must be a recognized generic instruction or explicit arrow-separated mappings; review ambiguous answer text.');
      }
      converted = { ...base, pairs: pairs.map((p, i) => ({ id: `pair-${i + 1}`, left: p?.left, right: p?.right })), explanation: item.explanation };
    } else if (item.mode === 'before-after') {
      const answer = rendererNorm(item.answer);
      const rendererOptions = opts.map(rendererNorm);
      const literal = opts.length === 0 || (opts.length === 2 && rendererOptions.includes('before') && rendererOptions.includes('after'));
      const visible = `${typeof item.prompt === 'string' ? item.prompt : ''} ${typeof item.instruction === 'string' ? item.instruction : ''}`;
      if (answerLeak(visible)) itemError('BEFORE_AFTER_ANSWER_HINT', 'Prompt or instruction contains an explicit answer hint or exposed sequence.');
      if (literal) {
        if (typeof item.answer !== 'string' || !['before', 'after'].includes(answer)) itemError('BEFORE_AFTER_INCOMPATIBLE', 'A literal direction requires a before/after answer.');
        converted = { ...base, correctAnswer: answer, explanation: item.explanation };
      } else {
        if (opts.length !== 2) itemError('BEFORE_AFTER_CHOICES_MISMATCH', 'Named before-after questions require exactly two options.');
        const matches = rendererOptions.map((x, i) => x && x === answer ? i : -1).filter(i => i >= 0);
        if (typeof item.answer !== 'string' || !answer || matches.length !== 1) itemError('ANSWER_CHOICE_MISMATCH', `Answer must uniquely match one renderer-normalized option; found ${matches.length}.`);
        if (opts.some(label => validText(label) && (containsVisibleLabel(rendererNorm(visible), rendererNorm(label)) || containsVisibleLabel(norm(visible), norm(label)))))
          itemError('BEFORE_AFTER_VISIBLE_OPTION', 'Prompt or instruction contains an option label.');
        converted = { ...base, options: opts, correctAnswer: item.answer, explanation: item.explanation };
      }
    }
    if (errors.length === previousErrorCount && converted) {
      examples.push(converted);
      provenance.push({ id: item.id, sources: item.sources, answer: item.answer, options: item.options, pairs: item.pairs });
    }
  });
  for (const mode of MODES) if (!counts[mode]) add('MISSING_MODE', `Pack has no ${mode} items.`);
  return { name, itemCount: data.length, modeCounts: counts, valid: errors.length === 0, errors, examples, provenance, idRefs };
}

function isWithin(candidate, parent) {
  const rel = path.relative(parent, candidate);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}
function parseArgs(args) {
  let input, outDir;
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--help') return { help: true };
    if (!['--input', '--out-dir'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid argument ${key}. Use --input FILE_OR_DIR [--out-dir EXISTING_DIR].`);
    if (key === '--input') { if (input) throw new Error('Duplicate --input.'); input = args[++i]; }
    else { if (outDir) throw new Error('Duplicate --out-dir.'); outDir = args[++i]; }
  }
  if (!input) throw new Error('Missing --input FILE_OR_DIR.');
  return { input, outDir };
}
export function run(args) {
  const params = parseArgs(args);
  if (params.help) { process.stdout.write('Usage: node scripts/validate-interactive-drafts.mjs --input FILE_OR_DIR [--out-dir EXISTING_DIR]\nJSON report to stdout; no output files unless every pack passes. Structural validation only.\n'); return 0; }
  const input = fs.realpathSync(params.input);
  const stat = fs.statSync(input);
  if (!stat.isDirectory() && !stat.isFile()) throw new Error('Input must be a regular file or directory.');
  const files = stat.isDirectory() ? sorted(fs.readdirSync(input).filter(x => x.endsWith('.json')).map(x => path.join(input, x))) : [input];
  if (!files.length) throw new Error('No .json input files found.');
  let output;
  if (params.outDir) {
    output = fs.realpathSync(params.outDir);
    if (!fs.statSync(output).isDirectory()) throw new Error('--out-dir must be an existing directory.');
    const inputDir = stat.isDirectory() ? input : path.dirname(input);
    if (isWithin(output, inputDir) || isWithin(inputDir, output)) throw new Error('Output and input directories must not overlap.');
  }
  const packs = files.map(file => {
    try {
      if (!fs.lstatSync(file).isFile()) throw new Error('Input must be a regular file, not a symlink or directory.');
      return validatePack(JSON.parse(fs.readFileSync(file, 'utf8')), path.basename(file));
    } catch (e) { return { name: path.basename(file), itemCount: null, modeCounts: Object.fromEntries(MODES.map(m => [m, 0])), valid: false, errors: [issue('READ_OR_JSON_ERROR', e.message)], examples: [], provenance: [], idRefs: [] }; }
  });
  // Duplicate IDs across packs are also unsafe when packs are eventually combined.
  const seenIds = new Map();
  packs.forEach((pack, pi) => {
    pack.idRefs.forEach(ref => {
      const prior = seenIds.get(ref.id);
      if (prior && prior.pack !== pack) {
        pack.errors.push(issue('CROSS_PACK_DUPLICATE_ID', `ID also appears in ${prior.pack.name}.`, ref.index, ref.id));
        prior.pack.errors.push(issue('CROSS_PACK_DUPLICATE_ID', `ID also appears in ${pack.name}.`, prior.index, ref.id));
        pack.valid = false; prior.pack.valid = false;
      } else if (!prior) seenIds.set(ref.id, { pack: packs[pi], index: ref.index });
    });
  });
  const allValid = packs.every(p => p.valid);
  const report = { format: 'interactive-draft-validation-report-v1', scope: 'Structural validation only; citations, facts, and safety are not verified. No approval or release is conferred.', input, outputDirectory: output ?? null, files: packs.length, validPacks: packs.filter(p => p.valid).length, invalidPacks: packs.filter(p => !p.valid).length, valid: allValid, outputWritten: [], packs: packs.map(({ examples, provenance, idRefs, ...rest }) => rest) };
  if (allValid && output) {
    const targets = packs.map(p => path.join(output, `${path.parse(p.name).name}.converted.json`));
    if (new Set(targets).size !== targets.length || targets.some(t => fs.existsSync(t))) throw new Error('An output target already exists or output names collide; refusing to overwrite.');
    const written = [];
    try {
      packs.forEach((p, i) => {
        const artifact = { format: 'interactive-draft-conversion-v1', notice: 'Unapproved review artifact; structural conversion only, not factual verification or a released package.', sourceFile: p.name, examples: p.examples, provenance: p.provenance };
        // Track immediately after opening, so partial writes are removed on failure.
        const fd = fs.openSync(targets[i], 'wx', 0o600); written.push(targets[i]);
        try { fs.writeFileSync(fd, `${JSON.stringify(artifact, null, 2)}\n`); } finally { fs.closeSync(fd); }
      });
      report.outputWritten = targets;
    } catch (e) { for (const file of written) { try { fs.unlinkSync(file); } catch {} } throw e; }
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return allValid ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { process.exitCode = run(process.argv.slice(2)); }
  catch (e) { process.stderr.write(`Error: ${e.message}\n`); process.exitCode = 2; }
}
