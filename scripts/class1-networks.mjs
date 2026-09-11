#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildBank, validateBank, reconcileDatabase, bankKeys, root } from './lib/class1Networks.mjs';

const mode = process.argv[2] ?? 'check';
if (!['build','check','reconcile'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: node scripts/class1-networks.mjs [build|check|reconcile]. No database write mode.');
  process.exit(1);
}
const banks = Object.fromEntries(Object.keys(bankKeys).map(name => [name, buildBank(name)]));
const reports = Object.fromEntries(Object.entries(banks).map(([name, questions]) => [name, validateBank(name, questions)]));
if (Object.values(reports).some(report => !report.valid)) {
  console.error(JSON.stringify(reports, null, 2)); process.exit(1);
}
const serialise = value => JSON.stringify(value, null, 2) + '\n';
const manifest = {
  version:'2026-09-09-v1', status:'validated-local-candidate-not-imported',
  releaseMode:'additive-exact-batch-after-full-live-bank-reconciliation',
  individualApprovalRequired:false,
  numberRange:{start:2001,end:2250,status:'proposed-not-reserved-in-production'},
  purpose:'Supplemental Ontario Class 1 practice; allocation is not an official exam blueprint',
  banks:Object.entries(banks).map(([name, questions]) => ({bankKey:bankKeys[name],file:`questions/${name}-250.json`,
    count:questions.length,calculations:reports[name].calculations,
    sha256:createHash('sha256').update(serialise(questions)).digest('hex'),
    modules:questions.reduce((counts,q)=>(counts[q.module]=(counts[q.module]??0)+1,counts),{})})),
  productionReconciliation:'not-run-no-complete-live-baseline',
  validation:reports,
};
const review = ['# Class 1 Distribution and Collection — 500-question review', '',
  '250 original practice questions per stream: 200 conceptual and 50 calculations. This is a local content package, not proof of a production import.',
  'Correct answers are shown beneath each item. See README.md for source scope, validation and release instructions.', ''];
for (const [name, questions] of Object.entries(banks)) {
  review.push(`## ${name === 'distribution' ? 'Water Distribution' : 'Wastewater Collection'}`, '');
  for (const q of questions) {
    review.push(`### ${q.questionNum} — ${q.topic}`, '', q.question, '',
      ...q.options.map((option,i)=>`- **${'ABCD'[i]}.** ${option}`), '',
      `**Answer: ${'ABCD'[q.correctIndex]}. ${q.correctAnswer}**`, '', q.explanation, '',
      `Supporting topic reference: [${q.sourceTitle}](${q.sourceUrl}).`, '');
  }
}
const outputs = [...Object.entries(banks).map(([name,q])=>[`${root}questions/${name}-250.json`,serialise(q)]),
  [`${root}manifest.json`,serialise(manifest)],[`${root}REVIEW.md`,review.join('\n').trimEnd()+'\n']];
if (mode === 'build') for (const [path,contents] of outputs) writeFileSync(path,contents);
else for (const [path,contents] of outputs) if (readFileSync(path,'utf8') !== contents) throw new Error(`Stale generated file: ${path}`);
if (mode === 'reconcile') {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required explicitly; no .env file is loaded.');
  const { createConnection } = await import('mysql2/promise');
  const connection = await createConnection(process.env.DATABASE_URL);
  try { console.log(serialise(await reconcileDatabase(connection,banks))); }
  finally { await connection.end(); }
} else console.log(serialise(reports));
