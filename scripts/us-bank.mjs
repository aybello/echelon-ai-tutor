#!/usr/bin/env node
// Usage: node scripts/us-bank.mjs <lint|build|check> <bank-id>
//   lint   Check the source files only. Use while writing; works on a partial bank.
//   build  Build the full bank, validate it, and write questions/, manifest.json and REVIEW.md.
//   check  Rebuild in memory and fail if any generated file is stale.
// There is no database mode. Nothing here imports, activates or publishes a question.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { banksRoot, loadConfig, buildBank, validateBank, lintSources } from './lib/usBank.mjs';

const [mode, id, ...extra] = process.argv.slice(2);
if (!['lint', 'build', 'check'].includes(mode) || !id || extra.length) {
  console.error('Usage: node scripts/us-bank.mjs <lint|build|check> <bank-id>');
  process.exit(1);
}
const config = loadConfig(id);
const root = `${banksRoot}${id}/`;

if (mode === 'lint') {
  const report = lintSources(config);
  console.log(JSON.stringify({ valid: report.valid, counts: report.counts }, null, 1));
  if (!report.valid) { console.error(report.problems.join('\n')); process.exit(1); }
  process.exit(0);
}

const lint = lintSources(config);
if (!lint.valid) { console.error(lint.problems.join('\n')); process.exit(1); }
const questions = buildBank(config);
const report = validateBank(config, questions);
if (!report.valid) { console.error(JSON.stringify(report, null, 2)); process.exit(1); }

const serialise = value => JSON.stringify(value, null, 2) + '\n';
const tally = key => questions.reduce((c, q) => (c[q[key]] = (c[q[key]] ?? 0) + 1, c), {});
const manifest = {
  version: config.version, status: 'validated-local-candidate-not-imported',
  bankKey: config.bankKey, state: config.state, stream: config.stream, label: config.label,
  numberRange: { start: config.startNumber, end: config.startNumber + config.count - 1, status: 'proposed-not-reserved-in-production' },
  purpose: config.purpose,
  file: `questions/bank-${config.count}.json`, count: questions.length, calculations: report.calculations,
  sha256: createHash('sha256').update(serialise(questions)).digest('hex'),
  modules: tally('module'), difficulty: tally('difficulty'), topics: tally('topic'),
  validation: report,
};
const review = [`# ${config.label}: ${config.count}-question review`, '', config.reviewIntro, '',
  'Correct answers are shown beneath each item. See README.md for scope, sources and limits.', ''];
for (const q of questions) {
  review.push(`### ${q.questionNum}: ${q.topic} (${q.difficulty})`, '', q.question, '',
    ...q.options.map((option, i) => `- **${'ABCD'[i]}.** ${option}`), '',
    `**Answer: ${'ABCD'[q.correctIndex]}. ${q.correctAnswer}**`, '', q.explanation, '');
}
const outputs = [[`${root}questions/bank-${config.count}.json`, serialise(questions)], [`${root}manifest.json`, serialise(manifest)], [`${root}REVIEW.md`, review.join('\n').trimEnd() + '\n']];
if (mode === 'build') { mkdirSync(`${root}questions`, { recursive: true }); for (const [path, contents] of outputs) writeFileSync(path, contents); }
else for (const [path, contents] of outputs) if (readFileSync(path, 'utf8') !== contents) throw new Error(`Stale generated file: ${path}`);
console.log(serialise({ id, count: questions.length, calculations: report.calculations, answerPositions: report.answerPositions, cues: { longestRate: report.answerCues.longestRate, shortestRate: report.answerCues.shortestRate } }));
