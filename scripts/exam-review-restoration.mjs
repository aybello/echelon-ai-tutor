#!/usr/bin/env node
/** Scoped owner-authorized follow-up; default operation performs SELECTs only. */
import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASE_KEY, digest, loadInputs } from './lib/examReviewRelease.mjs';
import { makePlanRestore, validateRestorationPlan, verifyOriginalReceipts } from './lib/examReviewRestoration.mjs';
import { applyPlan, privateWrite, readRows } from './exam-review-release.mjs';

async function main() {
  const args = new Map(process.argv.slice(2).map(arg => { const i = arg.indexOf('='); return i < 0 ? [arg, 'true'] : [arg.slice(0, i), arg.slice(i + 1)]; }));
  if ([...args.keys()].some(k => !['--out','--original-plan','--plan','--confirm','--apply','--rollback'].includes(k))) throw new Error('Unknown argument');
  const apply = args.has('--apply'), rollback = args.has('--rollback');
  if (apply && rollback) throw new Error('Choose apply or rollback');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const out = resolve(args.get('--out') ?? '/home/ubuntu/outputs/exam-review-restoration-20261116');
  if (out === root || out.startsWith(root + '/')) throw new Error('Private artifacts must be outside Git');
  const original = JSON.parse(readFileSync(resolve(args.get('--original-plan') ?? '/home/ubuntu/outputs/exam-review-release-20261116/plan.json'), 'utf8'));
  const inputs = loadInputs(root);
  // Validate pinned original before opening a database connection.
  const { validateOriginalPlan } = await import('./lib/examReviewRestoration.mjs');
  validateOriginalPlan(original);
  let plan;
  if (apply || rollback) {
    if (!args.get('--plan') || !args.get('--confirm')) throw new Error('Apply/rollback requires exact --plan and --confirm hash');
    plan = JSON.parse(readFileSync(resolve(args.get('--plan')), 'utf8'));
    if (digest(plan) !== args.get('--confirm')) throw new Error('Plan confirmation hash mismatch');
    validateRestorationPlan(plan, inputs, original);
  }
  const { activeDatabaseSettings } = await import('../server/db.ts');
  const { databasePoolOptions } = await import('../server/_core/databaseTls.ts');
  const { default: mysql } = await import('mysql2/promise');
  if (process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== 'true') throw new Error('Authoritative external target required');
  const settings = activeDatabaseSettings();
  if (!settings.requireTls || !settings.caCertificate) throw new Error('Verified TLS and CA required');
  const connection = await mysql.createConnection(databasePoolOptions(settings.connectionString, { caCertificate: settings.caCertificate, requireTls: settings.requireTls, connectTimeout: 15000 }));
  try {
    const [receipts] = await connection.execute('SELECT questionId, contentHash, payload FROM question_content_snapshots WHERE releaseKey = ? ORDER BY questionId', [RELEASE_KEY]);
    verifyOriginalReceipts(original, receipts);
    if (!apply && !rollback) {
      const current = await readRows(connection, original.actions.map(a => a.id));
      const at = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString();
      plan = makePlanRestore(inputs, original, current, at);
      const key = randomBytes(32), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(current), 'utf8'), cipher.final()]);
      privateWrite(resolve(out, 'backup-key.hex'), key.toString('hex') + '\n');
      privateWrite(resolve(out, 'before-images.aes256gcm.json'), { algorithm: 'aes-256-gcm', iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), ciphertext: ciphertext.toString('base64'), plaintextSha256: digest(current) });
      privateWrite(resolve(out, 'plan.json'), plan);
      privateWrite(resolve(out, 'plan.sha256'), digest(plan) + '\n');
      const report = { mode: 'dry-run', queries: 'SELECT only; no database writes', database: 'authoritative external target; CA-verified TLS', originalReceiptsVerified: receipts.length, currentAfterImagesChecked: current.length, counts: plan.counts, planSha256: digest(plan), conflicts: plan.conflicts, normalizationIds: plan.normalizations.map(n => n.id), policy: plan.policy, unresolvedSourceMarkers: plan.unresolvedSourceMarkers, cacheAction: 'Restart application after apply/rollback; no metadata or application changes', backup: { encrypted: true, rows: current.length, plaintextSha256: digest(current) } };
      privateWrite(resolve(out, 'dry-run-report.json'), report);
      console.log(JSON.stringify(report, null, 2));
      if (plan.conflicts.length) process.exitCode = 1;
    } else {
      const reportFile = resolve(out, `${rollback ? 'rollback' : 'apply'}-receipt-${Date.now()}-${randomBytes(4).toString('hex')}.json`);
      privateWrite(reportFile + '.prepared', { at: new Date().toISOString(), mode: rollback ? 'rollback' : 'apply', planSha256: digest(plan) });
      const result = await applyPlan(connection, plan, { rollback, restorationInputs: { inputs, original } });
      privateWrite(reportFile, { ...result, at: new Date().toISOString(), planSha256: digest(plan), cacheAction: 'Restart application before learner verification' });
      console.log(JSON.stringify(result));
    }
  } finally { await connection.end(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error('Exam review restoration failed:', error.message); process.exitCode = 1; });
