import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, MODES, PRIVATE_ROOT } from './constants.mjs';
import { DocumentSchema, ExerciseSchema, SourceSchema, CalculationSchema, payloadIssues } from './schemas.mjs';
import { bytesHash, hash, identity } from './identity.mjs';
import { metadataIssues, coverage } from './coverage.mjs';
import { checkCalculation } from './calculations.mjs';
import { createPrivateStore } from './storage.mjs';

export const PILOT_INPUT_ROOT = '/home/ubuntu/reviews/content-engine-2026-11-12/pilot';
export const PILOT_OUTPUT = 'pilot-import-20261112.json';
const KNOWLEDGE = Object.freeze({ 'oit-ww': 'ontario-source-knowledge.json', 'us-class1-water': 'us-wpi-source-knowledge.json' });
const NOTICE = 'Private bounded pilot audit only. All candidates are quarantined; accepted, AI-reviewed and human-reviewed counts are zero. Snapshot hashes verify local bytes, not remote authenticity, scientific correctness, rights clearance, originality, or objective-level alignment. Source passages and protected expression are internal evidence, not learner-facing or commercial reproduction. No generation, network, database, runtime import, release, or activation.';
const sha = value => typeof value === 'string' && /^(?:sha256:)?[a-f0-9]{64}$/.test(value) ? value.replace(/^sha256:/, '') : null;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const norm = value => value.normalize('NFC').replace(/\s+/gu, ' ').trim();
const unique = values => [...new Set(values)];
const inside = (root, value) => { const rel = path.relative(root, value); return !path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`); };
function noSymlinks(value) {
  let cursor = path.parse(value).root;
  for (const part of value.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    if (fs.lstatSync(cursor).isSymbolicLink()) throw Error('pilot-input-symlink-denied');
  }
}
/** Explicit read-only root. No environment, provider response, executable or runtime file is read. */
function reader(inputRoot) {
  if (!path.isAbsolute(inputRoot)) throw Error('absolute-pilot-input-root-required');
  const root = path.resolve(inputRoot); noSymlinks(root);
  if (!fs.lstatSync(root).isDirectory()) throw Error('pilot-input-directory-required');
  function read(file) {
    if (!path.isAbsolute(file)) file = path.join(root, file);
    const resolved = path.resolve(file);
    if (!inside(root, resolved) || resolved === root) throw Error('pilot-input-path-escape');
    noSymlinks(resolved);
    if (!inside(fs.realpathSync(root), fs.realpathSync(resolved))) throw Error('pilot-input-realpath-escape');
    const stat = fs.lstatSync(resolved);
    if (!stat.isFile() || stat.size > 20 * 1024 * 1024) throw Error('pilot-input-regular-bounded-file-required');
    const bytes = fs.readFileSync(resolved);
    return { path: resolved, sha256: bytesHash(bytes), text: bytes.toString('utf8') };
  }
  return { root, read };
}
function jsonRead(read, filename) {
  const entry = read(filename);
  return { path: entry.path, sha256: entry.sha256, value: JSON.parse(entry.text) };
}
function calculationAudit(raw) {
  if (!Array.isArray(raw)) return [{ status: 'not-executed', passed: null, issue: 'raw-calculation-list-invalid', raw }];
  return raw.map(check => {
    if (!CalculationSchema.safeParse(check).success) return { status: 'not-executed', passed: null, issue: 'raw-description-not-calculation-v1-ast', raw: check };
    const result = checkCalculation(check);
    return { status: 'executed-local-ast-only', ...result, raw: check };
  });
}
function passageOf(concept) {
  return typeof concept.sourceSupport === 'string' ? concept.sourceSupport : concept.sourceSupport?.passage;
}
function passageMatches(passage, snapshot) {
  if (!nonempty(passage) || !nonempty(snapshot)) return false;
  // Only NFC/whitespace and explicit ellipsis omissions, never fuzzy matching or formula rewriting.
  const fragments = passage.split(/\.{3}|…/u).map(norm).filter(Boolean);
  let offset = 0; const haystack = norm(snapshot);
  for (const fragment of fragments) {
    const found = haystack.indexOf(fragment, offset);
    if (found < 0) return false;
    offset = found + fragment.length;
  }
  return fragments.length > 0;
}

export function importPilot({ inputRoot = PILOT_INPUT_ROOT, serverPayloadSchema = null } = {}) {
  const { root, read } = reader(inputRoot);
  const document = { schemaVersion: VERSION, notice: NOTICE, sources: [], concepts: [], exercises: [] };
  const audit = { notice: NOTICE, inputRoot: root, inputs: [], knowledge: [], sources: [], concepts: [], candidates: [], fileIssues: [], costLedger: null };
  const contexts = new Map();
  for (const [courseKey, filename] of Object.entries(KNOWLEDGE)) {
    let input;
    try { input = jsonRead(read, filename); }
    catch (error) { audit.fileIssues.push({ file: filename, issue: error.message }); continue; }
    audit.inputs.push({ path: input.path, sha256: input.sha256 });
    const k = input.value;
    audit.knowledge.push({ file: filename, sha256: input.sha256, originalMetadata: k });
    if (k.courseKey !== courseKey || !Array.isArray(k.sources) || !Array.isArray(k.concepts)) {
      audit.fileIssues.push({ file: filename, issue: 'knowledge-course-or-shape-invalid' }); continue;
    }
    const context = { knowledge: k, sources: new Map(), concepts: new Map(), evidence: new Map() };
    contexts.set(courseKey, context);
    for (const source of k.sources) {
      const issues = []; let snapshot = null;
      if (!nonempty(source.id) || context.sources.has(source.id)) issues.push('source-id-missing-or-duplicate');
      try {
        if (!nonempty(source.snapshotPath) || !sha(source.snapshotHash)) throw Error('source-snapshot-metadata-missing');
        snapshot = read(source.snapshotPath);
        if (snapshot.sha256 !== sha(source.snapshotHash)) issues.push('source-snapshot-hash-mismatch');
        if (source.rawPath) {
          const raw = read(source.rawPath);
          if (!sha(source.rawHash) || raw.sha256 !== sha(source.rawHash)) issues.push('source-raw-hash-mismatch');
        }
      } catch (error) { issues.push(error.message); }
      const record = { schemaVersion: VERSION, sourceId: source.id, publisher: source.publisher ?? null,
        title: source.title ?? null, url: source.url ?? null, docLocator: source.locator ?? null,
        retrievedAt: source.retrievedAt ?? null, snapshotHash: issues.length ? null : snapshot.sha256,
        rightsBasis: source.rightsBasis ?? null,
        // Preserve the actual declaration; do not manufacture the acceptance token original-practice-derivation.
        permittedUsage: Array.isArray(source.permittedUsage) ? source.permittedUsage : nonempty(source.permittedUsage) ? [source.permittedUsage] : [], evidence: [] };
      if (!SourceSchema.safeParse(record).success) issues.push('source-schema-invalid');
      const entry = { source, snapshot, record, issues };
      if (context.sources.has(source.id)) context.sources.get(source.id).issues.push('source-id-missing-or-duplicate');
      else context.sources.set(source.id, entry);
      audit.sources.push({ courseKey, sourceId: source.id ?? null, originalMetadata: source,
        localSnapshotHash: snapshot?.sha256 ?? null, issues });
      if (SourceSchema.safeParse(record).success) document.sources.push(record);
    }
    const ids = k.concepts.map(c => c.conceptId);
    for (const concept of k.concepts) {
      const issues = []; const source = context.sources.get(concept.sourceId);
      const support = passageOf(concept);
      if (ids.filter(id => id === concept.conceptId).length !== 1) issues.push('concept-id-missing-or-duplicate');
      if (!nonempty(concept.conceptId) || !nonempty(concept.locator) || !nonempty(concept.fact)) issues.push('concept-metadata-missing');
      if (!source || source.issues.length) issues.push('concept-source-missing-or-unverified');
      if (typeof concept.sourceSupport === 'object' && concept.sourceSupport !== null &&
        (concept.sourceSupport.locator !== concept.locator || concept.sourceSupport.url !== source?.source.url)) issues.push('concept-support-locator-or-url-mismatch');
      if (!passageMatches(support, source?.snapshot?.text)) issues.push('source-passage-not-exactly-found-in-local-snapshot');
      const evidenceId = `pilot-evidence-${hash({ courseKey, conceptId: concept.conceptId, sourceId: concept.sourceId, locator: concept.locator, support }).slice(0, 24)}`;
      if (!issues.length) {
        source.record.evidence.push({ evidenceId, locator: concept.locator, excerpt: support, snapshotHash: source.snapshot.sha256 });
        context.evidence.set(concept.conceptId, { sourceId: concept.sourceId, evidenceId });
      }
      context.concepts.set(concept.conceptId, { original: concept, issues });
      audit.concepts.push({ courseKey, conceptId: concept.conceptId, originalMetadata: concept, evidenceId: issues.length ? null : evidenceId,
        issues, strictConceptConverted: false,
        conversionBlockers: ['strict-concept-applicability-and-variant-intent-not-completely-declared', ...(courseKey === 'oit-ww' ? ['ontario-objective-and-blueprint-unverified'] : ['local-objective-identifier-not-official-state-adoption-unverified'])] });
    }
  }
  const draftFiles = fs.readdirSync(root).filter(name => name.endsWith('__drafts.json')).sort();
  if (draftFiles.length > 12) throw Error('bounded-pilot-file-limit');
  for (const filename of draftFiles) {
    const match = /^(oit-ww|us-class1-water)__(rapid-swipe|speed-match|odd-one-out|cause-effect|tap-the-flaw|before-after)__drafts\.json$/.exec(filename);
    if (!match) { audit.fileIssues.push({ file: filename, issue: 'unsupported-draft-filename-not-read' }); continue; }
    let input;
    try { input = jsonRead(read, filename); }
    catch (error) { audit.fileIssues.push({ file: filename, issue: error.message }); continue; }
    audit.inputs.push({ path: input.path, sha256: input.sha256 });
    const draft = input.value;
    if (!Array.isArray(draft.candidates) || draft.candidates.length > 128 || draft.courseKey !== match[1] || draft.mode !== match[2]) {
      audit.fileIssues.push({ file: filename, sha256: input.sha256, issue: 'draft-file-scope-or-shape-invalid', originalMetadata: draft }); continue;
    }
    if (audit.candidates.length + draft.candidates.length > 512) throw Error('bounded-pilot-candidate-limit');
    const context = contexts.get(draft.courseKey);
    for (const [index, candidate] of draft.candidates.entries()) {
      const issues = []; const observations = ['cited-statement-support-not-semantically-verified', 'originality-unverified', 'difficulty-and-family-model-declared-not-reviewed'];
      const rawChecks = candidate?.calculationChecks;
      const calculations = calculationAudit(rawChecks);
      if (calculations.some(c => c.status === 'not-executed')) issues.push('raw-calculation-checks-not-executable');
      if (calculations.some(c => c.passed === false)) issues.push('calculation-check-failed');
      const payload = candidate?.item;
      issues.push(...payloadIssues(payload, serverPayloadSchema));
      if (payload?.mode !== draft.mode) issues.push('mode-mismatch');
      if (candidate?.contentHash !== undefined && candidate.contentHash !== hash(payload)) issues.push('declared-content-hash-mismatch');
      const conceptRefs = candidate?.conceptRefs;
      if (!Array.isArray(conceptRefs) || !conceptRefs.length || unique(conceptRefs).length !== conceptRefs.length) issues.push('candidate-concept-refs-invalid');
      const resolved = [];
      for (const conceptId of Array.isArray(conceptRefs) ? conceptRefs : []) {
        const concept = context?.concepts.get(conceptId);
        if (!concept) issues.push('candidate-concept-missing');
        else if (concept.issues.length) issues.push('candidate-concept-source-unverified');
      }
      const rawRefs = candidate?.sourceEvidenceRefs;
      if (!Array.isArray(rawRefs) || !rawRefs.length) issues.push('candidate-source-refs-missing');
      for (const ref of Array.isArray(rawRefs) ? rawRefs : []) {
        const concept = context?.concepts.get(ref?.conceptId);
        if (!concept || !Array.isArray(conceptRefs) || !conceptRefs.includes(ref.conceptId)) { issues.push('citation-concept-not-declared-or-missing'); continue; }
        if (concept.original.sourceId !== ref.sourceId || concept.original.locator !== ref.locator) { issues.push('citation-source-id-or-locator-mismatch'); continue; }
        const evidence = context.evidence.get(ref.conceptId);
        if (!evidence || context.sources.get(ref.sourceId)?.issues.length) { issues.push('citation-snapshot-or-passage-unverified'); continue; }
        resolved.push(evidence);
      }
      for (const conceptId of Array.isArray(conceptRefs) ? conceptRefs : []) {
        if (!(Array.isArray(rawRefs) && rawRefs.some(r => r?.conceptId === conceptId))) issues.push('candidate-concept-without-citation');
      }
      const declaredObjective = candidate?.objectiveIdOrUnmapped;
      const objectives = context?.knowledge.blueprint?.objectives ?? [];
      let objectiveId = null;
      if (draft.courseKey === 'oit-ww') {
        issues.push('ontario-objective-and-blueprint-unverified');
        if (declaredObjective !== 'unmapped') issues.push('ontario-unverified-objective-declaration');
      } else if (nonempty(declaredObjective) && declaredObjective !== 'unmapped' && objectives.filter(o => o.objectiveId === declaredObjective).length === 1 &&
        (Array.isArray(conceptRefs) && conceptRefs.some(id => context?.concepts.get(id)?.original.objectiveIdOrUnmapped === declaredObjective))) {
        objectiveId = declaredObjective; observations.push('objective-id-is-local-pilot-id-not-official-wpi-number', 'state-or-exam-date-adoption-unverified');
      } else issues.push('objective-unmapped-or-unsupported');
      const exercise = { schemaVersion: VERSION, exerciseId: payload?.id, courseKey: draft.courseKey, mode: draft.mode,
        conceptRefs: Array.isArray(conceptRefs) ? conceptRefs : [], objectiveId,
        jurisdiction: draft.courseKey === 'oit-ww' ? context?.knowledge.courseScope?.jurisdiction ?? null : null,
        examLevel: draft.courseKey === 'oit-ww' ? context?.knowledge.courseScope?.level ?? null : null,
        blueprintVersion: draft.courseKey === 'oit-ww' ? null : context?.knowledge.blueprint?.version ?? null,
        difficulty: candidate?.difficulty ?? 'unclassified', difficultyRationale: candidate?.difficultyRationale ?? null,
        variantFamilyId: candidate?.variantFamilyId ?? null,
        parameters: { privatePilotAudit: { draftFile: filename, draftSha256: input.sha256, candidateIndex: index,
          originalCandidateHash: hash(candidate), rawCalculationChecks: rawChecks ?? null, calculationAudit: calculations } },
        units: {}, item: payload, sourceEvidenceRefs: unique(resolved.map(r => JSON.stringify(r))).map(r => JSON.parse(r)),
        contentHash: hash(payload), claimType: 'unclassified', originality: 'unverified', authorityEvidence: [],
        calculationChecks: calculations.filter(c => c.status === 'executed-local-ast-only').map(c => c.raw), reviews: [], legacy: null };
      const parsed = ExerciseSchema.safeParse(exercise);
      if (!parsed.success) issues.push('exercise-schema-invalid');
      else document.exercises.push(exercise);
      const row = { courseKey: draft.courseKey, mode: draft.mode, draftFile: filename, draftSha256: input.sha256, candidateIndex: index,
        originalCandidateHash: hash(candidate), originalCandidate: candidate, originalFileMetadata: Object.fromEntries(Object.entries(draft).filter(([key]) => key !== 'candidates')),
        exerciseId: payload?.id ?? null, contentHash: hash(payload), strictExerciseConverted: parsed.success,
        schemaIssues: parsed.success ? [] : parsed.error.issues.map(i => ({ path: i.path, code: i.code })),
        calculations, sourceMissing: issues.some(i => /(?:source|citation|snapshot|passage|concept-missing)/u.test(i)),
        issues: unique(issues), observations, quarantined: true, reviewApproved: false, fingerprint: null };
      if (parsed.success) row.fingerprint = identity(payload);
      audit.candidates.push(row);
    }
  }
  DocumentSchema.parse(document);
  const strictCoverage = coverage(document);
  for (const row of audit.candidates) {
    const e = document.exercises.find(e => e.courseKey === row.courseKey && e.exerciseId === row.exerciseId && e.parameters.privatePilotAudit.originalCandidateHash === row.originalCandidateHash);
    row.metadataIssues = e ? metadataIssues(e, document) : ['exercise-schema-invalid'];
    row.issues = unique([...row.issues, ...row.metadataIssues, 'cited-statement-support-awaiting-qualified-review', 'human-technical-review-not-performed', 'software-release-review-not-performed']);
    if (row.fingerprint) {
      const peers = audit.candidates.filter(p => p.courseKey === row.courseKey && p.mode === row.mode && p.fingerprint?.problemHash === row.fingerprint.problemHash);
      if (peers.length > 1) row.issues.push('duplicate-problem');
      if (new Set(peers.map(p => p.fingerprint.answerHash)).size > 1) row.issues.push('contradictory-answer');
      if (audit.candidates.filter(p => p.courseKey === row.courseKey && p.exerciseId === row.exerciseId).length > 1) row.issues.push('duplicate-storage-id');
    }
  }
  const rows = Object.keys(KNOWLEDGE).flatMap(courseKey => MODES.map(mode => {
    const candidates = audit.candidates.filter(c => c.courseKey === courseKey && c.mode === mode);
    const fingerprints = candidates.filter(c => c.fingerprint).map(c => c.fingerprint.exerciseHash);
    return { courseKey, mode, raw: candidates.length, strictConverted: candidates.filter(c => c.strictExerciseConverted).length,
      unique: new Set(fingerprints).size, uniquenessUnknown: candidates.length - fingerprints.length,
      duplicate: fingerprints.length - new Set(fingerprints).size, quarantined: candidates.length,
      sourceMissing: candidates.filter(c => c.sourceMissing).length, remainingReview: candidates.length,
      metadataComplete: 0, AIreviewed: 0, humanReviewed: 0, riskPolicyAccepted: 0, accepted: 0, releasableAccepted: 0,
      target: 1000, remainingGap: 1000 };
  }));
  try {
    const ledger = jsonRead(read, 'pilot-ledger.json');
    audit.inputs.push({ path: ledger.path, sha256: ledger.sha256 });
    const calls = Object.entries(ledger.value.calls ?? {});
    const toMicros = value => Number.isFinite(value) && value >= 0 ? Math.round(value * 1000000) : 0;
    const estimatedMicros = calls.reduce((sum, [, c]) => sum + toMicros(c.estimatedUSD), 0);
    const reservedMicros = calls.reduce((sum, [, c]) => sum + toMicros(c.reservedUSD), 0);
    audit.costLedger = { path: ledger.path, sha256: ledger.sha256, readonlyCopy: ledger.value,
      knownEstimatedUSD: estimatedMicros / 1000000, reservedUSD: reservedMicros / 1000000,
      calls: calls.length, unknownCostCalls: calls.filter(([, c]) => !Number.isFinite(c.estimatedUSD)).length,
      knownEstimatedCostPerDraftUSD: audit.candidates.length ? estimatedMicros / 1000000 / audit.candidates.length : null,
      note: 'Ledger-declared pricing and usage only, not current pricing verification or an invoice. Known estimates include invalid responses. Failed/unknown calls may incur unreported costs; reservations are not charges. No new calls.' };
  } catch (error) { audit.fileIssues.push({ file: 'pilot-ledger.json', issue: error.message }); }
  const issueCounts = {};
  for (const c of audit.candidates) for (const issue of unique(c.issues)) issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
  return { schemaVersion: 'pilot-import-audit-v1', notice: NOTICE, document, audit,
    report: { notice: NOTICE, reviewPolicyVersion: strictCoverage.reviewPolicyVersion, riskPolicyEnabled: false,
      rows, totals: Object.fromEntries(['raw', 'strictConverted', 'unique', 'uniquenessUnknown', 'duplicate', 'quarantined', 'sourceMissing', 'remainingReview', 'accepted'].map(key => [key, rows.reduce((sum, r) => sum + r[key], 0)])),
      rawCalculationChecks: audit.candidates.reduce((sum, c) => sum + c.calculations.length, 0),
      calculationChecksExecuted: audit.candidates.reduce((sum, c) => sum + c.calculations.filter(x => x.status === 'executed-local-ast-only').length, 0),
      issueCounts, fileIssues: audit.fileIssues, strictDocumentCoverage: strictCoverage,
      uniqueQualification: 'Exact problem-and-answer fingerprint only, not verified semantic novelty or accepted coverage. Invalid payload uniqueness is unknown. No padding, consolidation, filtering-away, or legacy relabeling.' } };
}

export function writePilot(bundle, { name = PILOT_OUTPUT, root = PRIVATE_ROOT, repoRoot } = {}) {
  // Root injection is only for disposable tests; the CLI never exposes it.
  if (!/^pilot-[a-zA-Z0-9_-]+\.json$/.test(name)) throw Error('pilot-output-name-required');
  DocumentSchema.parse(bundle.document);
  return createPrivateStore({ root, repoRoot }).write(name, JSON.stringify(bundle, null, 2) + '\n');
}
export function runCli(args = process.argv.slice(2)) {
  let inputRoot = PILOT_INPUT_ROOT; let name = PILOT_OUTPUT;
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]; const value = args[i + 1];
    if (!['--input-root', '--output'].includes(flag) || !value || seen.has(flag)) throw Error('usage: import-pilot.mjs [--input-root ABSOLUTE_LOCAL_PILOT_ROOT] [--output pilot-NAME.json]');
    seen.add(flag); if (flag === '--input-root') inputRoot = value; else name = value;
  }
  if (!/^pilot-[a-zA-Z0-9_-]+\.json$/.test(name)) throw Error('pilot-output-name-required');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const store = createPrivateStore({ repoRoot });
  const destination = store.destination(name);
  if (fs.existsSync(destination)) throw Error('pilot-output-exists-refuse-overwrite');
  const bundle = importPilot({ inputRoot });
  const output = writePilot(bundle, { name, repoRoot });
  return { output, ...bundle.report.totals };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(runCli())); }
  catch (error) { console.error(`pilot import refused: ${error.message}`); process.exitCode = 1; }
}
