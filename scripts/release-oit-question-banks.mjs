import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { releaseOitPackage } from './lib/oitRelease.mjs';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
if (args.some(arg => !['--database', '--apply'].includes(arg))) throw new Error('Use --database for read-only reconciliation or --apply for release.');
execFileSync(process.execPath, [new URL('scripts/validate-oit-question-banks.mjs', root).pathname], { stdio: 'inherit' });
const manifestBytes = fs.readFileSync(new URL('content/oit/manifest.json', root));
const manifest = JSON.parse(manifestBytes);
const hash = createHash('sha256').update(manifestBytes);
const payloads = manifest.banks.map(bank => {
  const bytes = fs.readFileSync(new URL(`content/oit/${bank.file}`, root));
  hash.update(bytes);
  return { ...bank, questions: JSON.parse(bytes) };
});
const checksum = hash.digest('hex');
console.log(JSON.stringify({ checksum, banks: payloads.map(p => ({ bankKey: p.bankKey, count: p.questions.length })) }));
const apply = args.includes('--apply');
if (apply && process.env.CONFIRM_OIT_RELEASE !== checksum) throw new Error(`Set CONFIRM_OIT_RELEASE=${checksum} for this exact payload.`);
if (apply || args.includes('--database')) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required; no production status has been verified.');
  const mysql = await import('mysql2/promise');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const result = await releaseOitPackage(connection, payloads, apply);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ready) process.exitCode = 1;
  } finally { await connection.end(); }
} else console.log('Repository validation only. Run --database to reconcile production before release.');
