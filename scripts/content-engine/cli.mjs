#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from './constants.mjs';
import { createPrivateStore } from './storage.mjs';
import { readRelease, stage } from './inventory.mjs';
import { coverage, blockers } from './coverage.mjs';
import { DocumentSchema } from './schemas.mjs';
import { DEFAULT_PLAN, planPilot } from './planner.mjs';
import { DEFAULT_REVIEW_POLICY_VERSION } from './review-policy.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const usage = 'Usage: cli.mjs inventory OUTPUT.json | stage OUTPUT.json | report INPUT.json OUTPUT.json | validate INPUT.json OUTPUT.json | plan-default OUTPUT.json | plan CONFIG.json OUTPUT.json [LEDGER.jsonl [CATALOG.json PRICING.json NOW_ISO]]; all filenames relative to the fixed private output root; no calls, activation or overwrite.';
const stringify = v => JSON.stringify(v, null, 2) + '\n';
export function main(args) {
  const [command, ...names] = args;
  const store = createPrivateStore({ repoRoot });
  const parse = name => JSON.parse(store.read(name));
  let result; let output;
  if (['inventory', 'stage'].includes(command) && names.length === 1) {
    const release = readRelease(repoRoot); const doc = stage(release.packages, release.provenance);
    result = command === 'stage' ? doc : { ...coverage(doc), immutableMetadataHash: release.metadataHash, missingCourses: release.missingCourses };
    output = names[0];
  } else if (['report', 'validate'].includes(command) && names.length === 2) {
    const doc = DocumentSchema.parse(parse(names[0]));
    result = command === 'report' ? coverage(doc) : { schemaVersion: VERSION,
      reviewPolicyVersion: doc.reviewPolicy?.policyVersion ?? DEFAULT_REVIEW_POLICY_VERSION,
      notice: 'Offline declared evidence and structural checks; sampled batch authorization is not per-item human review or authenticated identity. No release activation.',
      exercises: doc.exercises.map(e => ({ exerciseId: e.exerciseId, courseKey: e.courseKey, mode: e.mode, blockers: blockers(e, doc) })),
      coverage: coverage(doc) };
    output = names[1];
  } else if (command === 'plan-default' && names.length === 1) {
    result = { ...DEFAULT_PLAN, courseKey: 'class1-water', mode: 'rapid-swipe' }; output = names[0];
  } else if (command === 'plan' && [2, 3, 6].includes(names.length)) {
    result = planPilot(parse(names[0]), { events: names[2] ? store.ledger(names[2]) : [],
      catalog: names[3] ? parse(names[3]) : null, pricing: names[4] ? parse(names[4]) : null, now: names[5] });
    output = names[1];
    // Planning never writes a reservation: the later authorized runner must durably reserve before a call.
  } else throw Error(usage);
  const destination = store.write(output, stringify(result));
  console.log(JSON.stringify({ status: 'written-private-offline', output: destination, callsMade: 0 }));
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch { console.error('Offline content engine refused input or destination; consult docs/content-engine.md. No input values printed.'); process.exitCode = 1; }
}
