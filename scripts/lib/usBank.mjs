// Builder and checker for the US state exam-bank packages under content/us-banks/<id>/.
// Modelled on scripts/lib/class1Networks.mjs. Authors write plain source files; this file builds the questions
// deterministically, recomputes every calculation, and runs the answer-cue checks. It never touches a database.
//
// source/conceptual.txt   @Module|SOURCE|Topic   (section header, applies to the rows below it)
//                         question|correct answer|wrong 1|wrong 2|wrong 3|explanation|level      (level e, m or h; optional, default e)
// source/calculations.txt @Module|SOURCE|Topic
//                         question|formula|expression|unit|decimal places|wrong values, comma separated|level   (level optional, default m)
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { analyseOitAnswerCues } from './oitAnswerCues.mjs';

export const banksRoot = fileURLToPath(new URL('../../content/us-banks/', import.meta.url));
export const normalise = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hash = text => createHash('sha256').update(text).digest('hex');
const shuffle = (items, seed) => items.map((value, i) => ({ value, key: hash(`${seed}:${i}`) }))
  .sort((a, b) => a.key.localeCompare(b.key)).map(item => item.value);
const LEVELS = { e: ['easy', 'recall'], m: ['medium', 'application'], h: ['hard', 'application'] };
// Wording that gives an answer away, or that makes an option impossible to judge on its own.
const GIVEAWAY = /\b(always|never|automatically|guarantee[sd]?|cannot|completely|entirely|solely|none|nothing)\b|all of the above|none of the above|both a and b|a and b/i;

export const loadConfig = id => {
  const path = `${banksRoot}${id}/config.json`;
  if (!existsSync(path)) throw new Error(`Unknown bank: ${id}`);
  return JSON.parse(readFileSync(path, 'utf8'));
};

// The expression language admits numbers and arithmetic only, never identifiers.
export function calculate(expression) {
  if (!expression || !/^[\d\s.()+*/-]+$/.test(expression) || /\/\/|\/\*/.test(expression)) throw new Error(`Unsafe arithmetic: ${expression}`);
  const result = Function(`"use strict"; return (${expression});`)();
  if (!Number.isFinite(result)) throw new Error('Non-finite result');
  return result;
}
export const fmt = (value, places) => Number(value).toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });

/** Read both source files. Returns the raw rows and any format problems; never throws on a bad line. */
export function parseSources(config) {
  const raw = [], problems = [];
  const read = file => existsSync(`${banksRoot}${config.id}/source/${file}`) ? readFileSync(`${banksRoot}${config.id}/source/${file}`, 'utf8').split(/\r?\n/) : [];
  for (const [file, calc] of [['conceptual.txt', false], ['calculations.txt', true]]) {
    let module, source, topic;
    read(file).forEach((line, n) => {
      if (!line.trim() || line.startsWith('#')) return;
      const where = `${file}:${n + 1}`;
      if (line.startsWith('@')) {
        [module, source, topic] = line.slice(1).split('|').map(s => s.trim());
        if (!module || !config.sources[source] || !topic) problems.push(`${where}: invalid section header (unknown source or missing part)`);
        else if (module.length > 128 || topic.length > 128) problems.push(`${where}: section module or topic name is over 128 characters; shorten it`);
        return;
      }
      if (!module) return problems.push(`${where}: row before any section header`);
      const f = line.split('|').map(s => s.trim());
      if (!calc) {
        if (f.length !== 6 && f.length !== 7) return problems.push(`${where}: expected 6 or 7 fields, found ${f.length}`);
        if (f.slice(0, 6).some(v => !v)) return problems.push(`${where}: empty field`);
        const level = f[6] || 'e';
        if (!LEVELS[level]) return problems.push(`${where}: bad level "${level}"`);
        raw.push({ module, topic, source, question: f[0], correctAnswer: f[1], wrong: f.slice(2, 5), explanation: f[5], level, isCalc: 'no', formula: '', where });
      } else {
        if (f.length !== 6 && f.length !== 7) return problems.push(`${where}: expected 6 or 7 fields, found ${f.length}`);
        const [question, formula, expression, unit, placesText, wrongText] = f;
        const level = f[6] || 'm';
        const places = Number(placesText);
        if (!question || !formula || !expression || !unit || !wrongText) return problems.push(`${where}: empty field`);
        if (!Number.isInteger(places) || places < 0 || places > 3) return problems.push(`${where}: bad decimal places`);
        if (!LEVELS[level]) return problems.push(`${where}: bad level "${level}"`);
        let value;
        try { value = calculate(expression); } catch (e) { return problems.push(`${where}: ${e.message}`); }
        const wrongNumbers = wrongText.split(',').map(v => v.trim());
        if (wrongNumbers.length !== 3 || wrongNumbers.some(v => v === '' || !Number.isFinite(Number(v)))) return problems.push(`${where}: need exactly 3 numeric wrong values`);
        const correctAnswer = `${fmt(value, places)} ${unit}`;
        const wrong = wrongNumbers.map(v => `${fmt(Number(v), places)} ${unit}`);
        const substitution = expression.replaceAll('*', ' × ').replaceAll('/', ' ÷ ');
        raw.push({ module, topic, source, question, correctAnswer, wrong, level, isCalc: 'yes', formula, calculationExpression: expression, decimalPlaces: places, unit,
          explanation: `${formula}. Substitute the stated values: ${substitution} = ${correctAnswer}. Round only the final result to ${places} decimal place(s). The result uses the assumptions stated in the question.`,
          steps: JSON.stringify([{ l: 'Relationship', c: formula }, { l: 'Substitute stated values', c: substitution }, { l: 'Final answer', c: correctAnswer }]), where });
      }
    });
  }
  return { raw, problems };
}

export function buildBank(config) {
  const { raw, problems } = parseSources(config);
  if (problems.length) throw new Error(`Source problems:\n${problems.join('\n')}`);
  const positions = shuffle(Array.from({ length: raw.length }, (_, i) => i % 4), config.bankKey);
  return raw.map((item, i) => {
    const { wrong, source, level, where, ...content } = item;
    const options = shuffle(wrong, `${config.bankKey}:${i}:wrong`);
    options.splice(positions[i], 0, item.correctAnswer);
    return {
      questionNum: config.startNumber + i, bankKey: config.bankKey, itemId: `${config.itemPrefix}-${String(i + 1).padStart(3, '0')}`,
      ...content, options, ...Object.fromEntries(options.map((value, j) => [`option${'ABCD'[j]}`, value])),
      correctIndex: positions[i], difficulty: LEVELS[level][0], cognitiveLevel: LEVELS[level][1],
      sourceTitle: config.sources[source][0], sourceUrl: config.sources[source][1],
      sourceReference: `Supporting topic reference: ${item.topic}. See README for source scope and limitations.`,
      blueprintObjective: `${item.module}: ${item.topic}`, reviewStatus: 'unreviewed',
      evidenceStatus: 'original-practice-item-with-supporting-topic-reference',
    };
  });
}

/** Source-level checks that do not need the whole bank: use these while writing. */
export function lintSources(config) {
  const { raw, problems } = parseSources(config);
  let longest = 0, shortest = 0, conceptual = 0;
  const stems = new Map();
  for (const r of raw) {
    const stem = normalise(r.question);
    if (stems.has(stem)) problems.push(`${r.where}: duplicate stem with ${stems.get(stem)}`); else stems.set(stem, r.where);
    const all = [r.correctAnswer, ...r.wrong];
    if (new Set(all.map(normalise)).size !== 4) problems.push(`${r.where}: duplicate or empty options`);
    if (r.isCalc === 'no') {
      for (const o of all) if (GIVEAWAY.test(o)) problems.push(`${r.where}: giveaway wording in an option: "${o}"`);
      if (r.explanation.length < 25) problems.push(`${r.where}: explanation too short`);
      // The same length rules as scripts/lib/oitAnswerCues.mjs, applied row by row.
      const correct = r.correctAnswer.length, wl = r.wrong.map(o => o.length), maxW = Math.max(...wl), minW = Math.min(...wl);
      if (correct > maxW) { longest++; if (correct - maxW >= 12 || correct >= maxW * 1.25) problems.push(`${r.where}: correct answer is much longer than every wrong option`); }
      if (correct < minW) { shortest++; if (correct < minW * 0.65 && minW - correct >= 20) problems.push(`${r.where}: correct answer is much shorter than every wrong option`); }
      conceptual++;
      const shortcut = /\b(without|solely|alone|only|every|all|cannot|independent|despite|unverified)\b/i;
      if (!shortcut.test(r.correctAnswer) && r.wrong.every(o => shortcut.test(o))) problems.push(`${r.where}: every wrong option has a qualifier word the correct answer lacks`);
    }
    if (r.question.length > 400) problems.push(`${r.where}: question over 400 characters`);
  }
  if (conceptual >= 20) {
    if (longest / conceptual > 0.35) problems.push(`The correct answer is the longest option in ${(100 * longest / conceptual).toFixed(0)}% of conceptual questions (limit 35%)`);
    if (shortest / conceptual > 0.35) problems.push(`The correct answer is the shortest option in ${(100 * shortest / conceptual).toFixed(0)}% of conceptual questions (limit 35%)`);
  }
  const counts = { total: raw.length, calculations: raw.filter(r => r.isCalc === 'yes').length };
  for (const r of raw) { counts[r.module] = (counts[r.module] ?? 0) + 1; counts[`level:${r.level}`] = (counts[`level:${r.level}`] ?? 0) + 1; }
  return { valid: !problems.length, problems, counts };
}

export function validateBank(config, questions, { cues = true } = {}) {
  const errors = [];
  const counts = [0, 0, 0, 0];
  const stems = new Set();
  if (questions.length !== config.count) errors.push(`Expected ${config.count} questions, found ${questions.length}`);
  if (questions.filter(q => q.isCalc === 'yes').length !== config.calcCount) errors.push(`Expected ${config.calcCount} calculations`);
  questions.forEach((q, i) => {
    const label = `${config.id}#${q.questionNum}`;
    if (q.bankKey !== config.bankKey || q.questionNum !== config.startNumber + i) errors.push(`${label}: identity mismatch`);
    const stem = normalise(q.question);
    if (stems.has(stem)) errors.push(`${label}: duplicate stem`);
    stems.add(stem);
    if (q.options.length !== 4 || new Set(q.options.map(normalise)).size !== 4) errors.push(`${label}: duplicate or missing options`);
    if (q.correctIndex < 0 || q.correctIndex > 3 || q.correctAnswer !== q.options[q.correctIndex]) errors.push(`${label}: answer mismatch`);
    counts[q.correctIndex]++;
    for (const [field, limit] of Object.entries({ module: 128, topic: 128, sourceTitle: 255, sourceReference: 512, sourceUrl: 1024, blueprintObjective: 255 })) {
      if (!q[field] || q[field].length > limit) errors.push(`${label}: invalid ${field}`);
    }
    for (let j = 0; j < 4; j++) if (q[`option${'ABCD'[j]}`] !== q.options[j]) errors.push(`${label}: option field mismatch`);
    if (!q.explanation || q.reviewStatus !== 'unreviewed') errors.push(`${label}: missing explanation or wrong status`);
    if (!['recall', 'application'].includes(q.cognitiveLevel)) errors.push(`${label}: invalid cognitive level`);
    if (q.isCalc === 'yes') {
      const answer = `${fmt(calculate(q.calculationExpression), q.decimalPlaces)} ${q.unit}`;
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
