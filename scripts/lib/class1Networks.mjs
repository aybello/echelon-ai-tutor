import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { analyseOitAnswerCues } from './oitAnswerCues.mjs';

export const root = fileURLToPath(new URL('../../content/class1-networks/', import.meta.url));
export const bankKeys = { distribution: 'class1-water-dist', collection: 'class1-wastewater-coll' };
const sources = {
  EPANET: ['US EPA — EPANET hydraulic modelling', 'https://www.epa.gov/water-research/epanet'],
  DIST: ['US EPA — Small Drinking Water Systems Handbook', 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT'],
  BACKFLOW: ['US EPA — Cross-Connection Control Manual', 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000262T.TXT'],
  CMOM: ['US EPA — CMOM Guide for Sanitary Sewer Collection Systems', 'https://www.epa.gov/sites/default/files/2015-10/documents/cmom_guide_for_collection_systems.pdf'],
  DNTK: ['WPI — Water Distribution Class I Need-to-Know Criteria', 'https://gowpi.org/services/2025-need-to-know-criteria/'],
  CNTK: ['WPI — Wastewater Collection Class I Need-to-Know Criteria', 'https://gowpi.org/services/2025-need-to-know-criteria/'],
  SAFE: ['CCOHS — Lockout/Tag out', 'https://www.ccohs.ca/oshanswers/hsprograms/lockout.html'],
  SPACE: ['CCOHS — Confined Spaces: Introduction', 'https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html'],
  H2S: ['CCOHS — Hydrogen Sulfide', 'https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html'],
};
export const normalise = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hash = text => createHash('sha256').update(text).digest('hex');
const shuffle = (items, seed) => items.map((value, i) => ({ value, key: hash(`${seed}:${i}`) }))
  .sort((a, b) => a.key.localeCompare(b.key)).map(item => item.value);

// The expression language admits numbers and arithmetic only, never identifiers.
export function calculate(expression) {
  if (!expression || !/^[\d\s.()+*/-]+$/.test(expression) || /\/\/|\/\*/.test(expression)) throw new Error('Unsafe arithmetic');
  const result = Function(`"use strict"; return (${expression});`)();
  if (!Number.isFinite(result)) throw new Error('Non-finite result');
  return result;
}

export function buildBank(name) {
  if (!bankKeys[name]) throw new Error('Unknown bank');
  const bankKey = bankKeys[name];
  const raw = [];
  let module, source, topic;
  for (const line of readFileSync(`${root}source/${name}.txt`, 'utf8').trim().split(/\r?\n/)) {
    if (line.startsWith('@')) {
      [module, source, topic] = line.slice(1).split('|');
      if (!module || !sources[source] || !topic) throw new Error('Invalid section');
      continue;
    }
    const fields = line.split('|');
    if (fields.length !== 6 || !topic || fields.some(value => !value.trim())) throw new Error(`Invalid question: ${line}`);
    const [question, correctAnswer, ...rest] = fields;
    raw.push({ module, topic, source, question, correctAnswer, wrong: rest.slice(0, 3), explanation: rest[3], isCalc: 'no', formula: '' });
  }
  for (const line of readFileSync(`${root}source/${name}-calculations.txt`, 'utf8').trim().split(/\r?\n/)) {
    const fields = line.split('|');
    if (fields.length !== 7) throw new Error('Invalid calculation row');
    const [module, question, formula, expression, unit, places, wrongText] = fields;
    const decimalPlaces = Number(places);
    if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 3) throw new Error('Invalid precision');
    const value = calculate(expression).toFixed(decimalPlaces);
    const correctAnswer = `${value} ${unit}`;
    const wrong = wrongText.split(',').map(number => {
      if (!Number.isFinite(Number(number))) throw new Error('Invalid numeric distractor');
      return `${Number(number).toFixed(decimalPlaces)} ${unit}`;
    });
    const substitution = expression.replaceAll('**', '^').replaceAll('*', ' × ').replaceAll('/', ' ÷ ');
    raw.push({module, topic:'Applied operating calculations', source:name === 'distribution' ? 'DNTK' : 'CNTK', question,
      correctAnswer, wrong, isCalc:'yes', formula, calculationExpression:expression, decimalPlaces, unit,
      explanation:`${formula}. Substitute the stated values: ${substitution} = ${correctAnswer}. Round only the final result to ${decimalPlaces} decimal place(s). The result uses the assumptions stated in the question.`,
      steps:JSON.stringify([{l:'Relationship',c:formula},{l:'Substitute stated values',c:substitution},{l:'Final answer',c:correctAnswer}])});
  }
  return finishBank(raw, name);
}

function finishBank(raw, name) {
  const bankKey = bankKeys[name];
  const positions = shuffle(Array.from({length: 250}, (_, i) => i % 4), bankKey);
  return raw.map((item, i) => {
    const { wrong, source, ...content } = item;
    const options = shuffle(wrong, `${bankKey}:${i}:wrong`);
    options.splice(positions[i], 0, item.correctAnswer);
    return { questionNum: 2001 + i, bankKey, itemId: `${name.toUpperCase()}-L1-${String(i + 1).padStart(3, '0')}`,
      ...content, options, ...Object.fromEntries(options.map((value, j) => [`option${'ABCD'[j]}`, value])),
      correctIndex: positions[i], difficulty: item.isCalc === 'yes' ? 'medium' : 'easy',
      cognitiveLevel: item.isCalc === 'yes' ? 'application' : 'recall',
      sourceTitle: sources[source][0], sourceUrl: sources[source][1],
      sourceReference: `Supporting topic reference: ${item.topic}. See README for source scope and limitations.`,
      blueprintObjective: `${item.module}: ${item.topic}`, reviewStatus: 'unreviewed',
      evidenceStatus: 'original-practice-item-with-supporting-topic-reference' };
  });
}

export function validateBank(name, questions, { cues = true } = {}) {
  const errors = [];
  const counts = [0, 0, 0, 0];
  const stems = new Set();
  if (questions.length !== 250) errors.push('Expected 250 questions');
  if (questions.filter(q => q.isCalc === 'yes').length !== 50) errors.push('Expected 50 calculations');
  questions.forEach((q, i) => {
    const label = `${name}#${q.questionNum}`;
    if (q.bankKey !== bankKeys[name] || q.questionNum !== 2001 + i) errors.push(`${label}: identity mismatch`);
    const stem = normalise(q.question);
    if (stems.has(stem)) errors.push(`${label}: duplicate stem`);
    stems.add(stem);
    if (q.options.length !== 4 || new Set(q.options.map(value => value.trim().toLowerCase().replace(/\s+/g, ' '))).size !== 4) errors.push(`${label}: duplicate/missing options`);
    if (q.correctIndex < 0 || q.correctIndex > 3 || q.correctAnswer !== q.options[q.correctIndex]) errors.push(`${label}: answer mismatch`);
    counts[q.correctIndex]++;
    for (const [field, limit] of Object.entries({module:128,topic:128,sourceTitle:255,sourceReference:512,sourceUrl:1024,blueprintObjective:255})) {
      if (!q[field] || q[field].length > limit) errors.push(`${label}: invalid ${field}`);
    }
    for (let j = 0; j < 4; j++) if (q[`option${'ABCD'[j]}`] !== q.options[j]) errors.push(`${label}: option field mismatch`);
    if (!q.explanation || q.reviewStatus !== 'unreviewed') errors.push(`${label}: missing explanation or wrong status`);
    if (!['recall','application'].includes(q.cognitiveLevel)) errors.push(`${label}: invalid cognitive level`);
    if (q.isCalc === 'yes') {
      const answer = `${calculate(q.calculationExpression).toFixed(q.decimalPlaces)} ${q.unit}`;
      if (answer !== q.correctAnswer) errors.push(`${label}: arithmetic mismatch`);
      if (!q.formula || !q.steps || JSON.parse(q.steps).length < 3) errors.push(`${label}: missing worked solution`);
    }
  });
  if (Math.max(...counts) - Math.min(...counts) > 1) errors.push('Unbalanced answer positions');
  const answerCues = analyseOitAnswerCues(questions);
  if (cues && (answerCues.longTells.length || answerCues.shortTells.length || answerCues.qualifierTells.length
    || answerCues.longestRate > 0.35 || answerCues.shortestRate > 0.35)) errors.push('Answer-cue review required');
  return { valid: !errors.length, errors, count: questions.length, calculations: questions.filter(q => q.isCalc === 'yes').length, answerPositions: counts, answerCues };
}

const storedOptions = q => typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
const same = (a, b) => ['question', 'explanation', 'module', 'topic', 'isCalc', 'difficulty', 'cognitiveLevel', 'sourceTitle', 'sourceReference', 'sourceUrl', 'blueprintObjective'].every(k => a[k] === b[k])
  && (a.steps ?? null) === (b.steps ?? null)
  && Number(a.correctIndex) === b.correctIndex && JSON.stringify(storedOptions(a)) === JSON.stringify(b.options);

/** Full-bank comparison: never infer a live baseline from public counts or seeds. */
export function reconcileBank(name, candidates, rows) {
  const existing = rows.filter(q => q.bankKey === bankKeys[name]);
  const report = { bankKey:bankKeys[name], baselineRows:existing.length, missing:[], matching:[], conflicts:[], duplicateStems:[] };
  for (const q of candidates) {
    const matches = existing.filter(row => Number(row.questionNum) === q.questionNum);
    if (!matches.length) report.missing.push(q.questionNum);
    else {
      let matchesContent = false;
      try { matchesContent = matches.length === 1 && same(matches[0], q); } catch { /* malformed options fail closed */ }
      if (matchesContent) report.matching.push({questionNum:q.questionNum,reviewStatus:matches[0].reviewStatus});
      else report.conflicts.push(q.questionNum);
    }
    for (const row of existing) if (Number(row.questionNum) !== q.questionNum && normalise(row.question) === normalise(q.question))
      report.duplicateStems.push({candidate:q.questionNum,existing:Number(row.questionNum)});
  }
  return report;
}

/** TiDB-compatible rollback-only transaction. This function has no write mode. */
export async function reconcileDatabase(connection, banks) {
  await connection.beginTransaction();
  try {
    const reports = [];
    for (const [name, questions] of Object.entries(banks)) {
      if (!bankKeys[name]) throw new Error('Unknown bank');
      const [rows] = await connection.execute('SELECT * FROM questions WHERE bankKey = ?', [bankKeys[name]]);
      reports.push(reconcileBank(name, questions, rows));
    }
    return reports;
  } finally { await connection.rollback(); }
}
