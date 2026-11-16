#!/usr/bin/env node
/** Default is read-only planning. Production apply belongs to the release owner. */
import { createCipheriv, randomBytes } from 'node:crypto';
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELDS, MUTABLE, RELEASE_KEY, checkState, digest, loadInputs, makePlan, project } from './lib/examReviewRelease.mjs';
import { RESTORATION_KEY, validateRestorationPlan } from './lib/examReviewRestoration.mjs';
export function privateWrite(path, value) {
  mkdirSync(dirname(path), {recursive:true,mode:0o700});
  const fd = openSync(path,'wx',0o600);
  try { writeFileSync(fd, typeof value === 'string' ? value : JSON.stringify(value,null,2)+'\n'); fsyncSync(fd); } finally { closeSync(fd); }
}
const fields = FIELDS.map(k => '`'+k+'`').join(',');
export async function readRows(connection, ids, lock = false) {
  if (!ids.length || ids.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) throw new Error('Invalid bounded id list');
  const [rows] = await connection.execute(`SELECT ${fields} FROM questions WHERE id IN (${ids.map(()=>'?').join(',')}) ORDER BY id${lock ? ' FOR UPDATE' : ''}`,ids);
  return rows.map(project);
}
export async function applyPlan(connection, plan, {rollback = false, restorationInputs} = {}) {
  if (plan.releaseKey === RESTORATION_KEY && restorationInputs) validateRestorationPlan(plan, restorationInputs.inputs, restorationInputs.original);
  else if (plan.releaseKey !== RELEASE_KEY) throw new Error('Unready release plan');
  if (plan.conflicts.length || plan.counts.conflicts || plan.actions.length !== new Set(plan.actions.map(a=>a.id)).size) throw new Error('Unready release plan');
  for (const a of plan.actions) {
    if (a.id !== a.before.id || a.id !== a.after.id || a.bankKey !== a.before.bankKey || a.questionNum !== a.before.questionNum || Object.keys(a.before).sort().join() !== [...FIELDS].sort().join() || Object.keys(a.after).sort().join() !== [...FIELDS].sort().join()) throw new Error('Invalid plan identity/columns');
    for (const field of FIELDS.filter(k=>!MUTABLE.includes(k))) if (digest(a.before[field]) !== digest(a.after[field])) throw new Error('Immutable field changed');
  }
  await connection.beginTransaction();
  let committed = false;
  try {
    const rows = await readRows(connection,plan.actions.map(a=>a.id),true);
    const effective = rollback ? {...plan,actions:plan.actions.map(a=>({...a,before:a.after,after:a.before,beforeSha256:a.afterSha256,afterSha256:a.beforeSha256}))} : plan;
    const state = checkState(effective,rows);
    const [receipts] = await connection.execute('SELECT questionId, contentHash, payload FROM question_content_snapshots WHERE releaseKey = ? ORDER BY questionId FOR UPDATE',[plan.releaseKey]);
    if (!state.pending.length) {
      if (receipts.length !== plan.actions.length || receipts.some(r=>{const a=plan.actions.find(a=>a.id===r.questionId); return !a || r.contentHash!==a.beforeSha256 || digest(JSON.parse(r.payload))!==a.beforeSha256;})) throw new Error('Idempotent state has missing/invalid receipts');
      await connection.rollback(); return {mode:rollback?'already-rolled-back':'already-applied',changed:0};
    }
    if (rollback) {
      if (receipts.length !== plan.actions.length || receipts.some(r=>{const a=plan.actions.find(a=>a.id===r.questionId);return !a || r.contentHash!==a.beforeSha256 || digest(JSON.parse(r.payload))!==a.beforeSha256;})) throw new Error('Rollback receipt mismatch');
    } else if (receipts.length) throw new Error('Release key already used; reconcile before continuing');
    for (const a of state.pending) {
      if (!rollback) await connection.execute('INSERT INTO question_content_snapshots (releaseKey, bankKey, questionId, questionNum, sourceContentVersion, contentHash, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',[plan.releaseKey,a.bankKey,a.id,a.questionNum,0,a.beforeSha256,JSON.stringify(a.before)]);
      const [result] = await connection.execute(`UPDATE questions SET ${MUTABLE.map(k=>'`'+k+'` = ?').join(',')} WHERE id = ? AND bankKey = ? AND questionNum = ?`,[...MUTABLE.map(k=>k==='reviewedAt' && a.after[k] ? new Date(a.after[k]) : a.after[k]),a.id,a.bankKey,a.questionNum]);
      if (result.affectedRows !== 1) throw new Error(`Exact row update failed ${a.id}`);
    }
    const after = await readRows(connection,plan.actions.map(a=>a.id),true);
    const verified = checkState(effective,after);
    if (verified.done.length !== plan.actions.length) throw new Error('After-image verification failed');
    const [snapshots] = await connection.execute('SELECT questionId, contentHash, payload FROM question_content_snapshots WHERE releaseKey = ? ORDER BY questionId FOR UPDATE',[plan.releaseKey]);
    if (snapshots.length !== plan.actions.length || snapshots.some(r=>{const a=plan.actions.find(a=>a.id===r.questionId);return !a || r.contentHash!==a.beforeSha256 || digest(JSON.parse(r.payload))!==a.beforeSha256;})) throw new Error('Immutable receipt verification failed');
    await connection.commit(); committed = true;
    return {mode:rollback?'rolled-back':'applied',changed:state.pending.length,receipts:snapshots.length};
  } catch(error) { if (!committed) await connection.rollback(); throw error; }
}
async function main() {
  const args = new Map(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');return i<0?[arg,'true']:[arg.slice(0,i),arg.slice(i+1)];}));
  if ([...args.keys()].some(k=>!['--out','--apply','--rollback','--plan','--confirm'].includes(k))) throw new Error('Unknown argument');
  const apply = args.has('--apply'), rollback = args.has('--rollback');
  if (apply && rollback) throw new Error('Choose apply or rollback');
  const out = resolve(args.get('--out') ?? '/home/ubuntu/outputs/exam-review-release-20261116');
  const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
  if (out === root || out.startsWith(root+'/')) throw new Error('Private artifacts must be outside Git');
  const { activeDatabaseSettings } = await import('../server/db.ts');
  const { databasePoolOptions } = await import('../server/_core/databaseTls.ts');
  const { default:mysql } = await import('mysql2/promise');
  if (process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== 'true') throw new Error('Authoritative external target required');
  const settings = activeDatabaseSettings();
  const connection = await mysql.createConnection(databasePoolOptions(settings.connectionString,{caCertificate:settings.caCertificate,requireTls:settings.requireTls,connectTimeout:15000}));
  try {
    if (!apply && !rollback) {
      const inputs = loadInputs(root);
      const ids = [...new Set([...inputs.findings.map(r=>r.id),...(await import('./lib/examReviewRelease.mjs')).EXPLICIT_HOLDS])].sort((a,b)=>a-b);
      const current = await readRows(connection,ids);
      // Timestamp stored at MySQL seconds precision so persisted after-image hashes agree.
      const at = new Date(Math.floor(Date.now()/1000)*1000).toISOString();
      const plan = makePlan(inputs,current,at);
      const key = randomBytes(32), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm',key,iv);
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(current),'utf8'),cipher.final()]);
      privateWrite(resolve(out,'backup-key.hex'),key.toString('hex')+'\n');
      privateWrite(resolve(out,'before-images.aes256gcm.json'),{algorithm:'aes-256-gcm',iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('base64'),plaintextSha256:digest(current)});
      privateWrite(resolve(out,'plan.json'),plan);
      privateWrite(resolve(out,'plan.sha256'),digest(plan)+'\n');
      const report = {mode:'dry-run',database:'authoritative running-app external target; TLS verified',queries:'SELECT questions only; no transaction or database writes',counts:plan.counts,planSha256:digest(plan),sourceHolds:plan.actions.filter(a=>a.kind==='hold').map(({id,bankKey,reasons})=>({id,bankKey,reasons})),deletionStrategy:'34 rejected; no physical deletion or replacement import',unitCandidates:plan.unitCandidates,conflicts:plan.conflicts,backup:{encrypted:true,rows:current.length,plaintextSha256:digest(current)},cachePolicy:'No metadata writes. Restart application after apply/rollback to discard in-memory question caches; next release tooling must not assume bank metadata version was incremented.'};
      privateWrite(resolve(out,'dry-run-report.json'),report);
      console.log(JSON.stringify({counts:plan.counts,planSha256:digest(plan),report:resolve(out,'dry-run-report.json')},null,2));
    } else {
      if (!args.get('--plan') || !args.get('--confirm')) throw new Error('Apply/rollback requires --plan=/private/plan.json --confirm=<exact-plan-sha256>');
      const plan = JSON.parse(readFileSync(resolve(args.get('--plan')),'utf8'));
      if (digest(plan)!==args.get('--confirm')) throw new Error('Plan confirmation hash mismatch');
      const operationId = `${Date.now()}-${randomBytes(4).toString('hex')}`;
      const reportFile = resolve(out,`${rollback?'rollback':'apply'}-receipt-${operationId}.json`);
      // Reserve durable receipt path before opening the write transaction.
      privateWrite(reportFile+'.prepared',{planSha256:digest(plan),mode:rollback?'rollback':'apply',at:new Date().toISOString()});
      const result = await applyPlan(connection,plan,{rollback});
      privateWrite(reportFile,{...result,planSha256:digest(plan),at:new Date().toISOString(),cacheAction:'Restart application before verifying learner content'});
      console.log(JSON.stringify(result));
    }
  } finally { await connection.end(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error=>{console.error('Exam review release failed:',error.message);process.exitCode=1;});
