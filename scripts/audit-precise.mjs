import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Starting precise question audit...');

// Fetch ALL questions
const [rows] = await conn.execute(
  'SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, steps, module, isCalc FROM questions ORDER BY bankKey, questionNum'
);

console.log(`Loaded ${rows.length} questions.`);

const definiteIssues = [];

for (const row of rows) {
  let options;
  try {
    options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
  } catch (e) {
    definiteIssues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'INVALID_JSON', detail: 'Cannot parse options' });
    continue;
  }

  const questionLower = (row.question || '').toLowerCase();
  const correctAnswer = (options[row.correctIndex] || '').toLowerCase();
  const explanationLower = (row.explanation || '').toLowerCase();

  // 1. Empty question
  if (!row.question || row.question.trim().length < 10) {
    definiteIssues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'EMPTY_QUESTION', detail: `"${row.question}"` });
  }

  // 2. Empty explanation
  if (!row.explanation || row.explanation.trim().length < 10) {
    definiteIssues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'EMPTY_EXPLANATION', detail: 'Missing explanation' });
  }

  // 3. Invalid correctIndex
  if (row.correctIndex === null || row.correctIndex === undefined || row.correctIndex < 0 || row.correctIndex >= options.length) {
    definiteIssues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'BAD_INDEX', detail: `idx=${row.correctIndex}, opts=${options.length}` });
    continue;
  }

  // 4. Duplicate options (exact match after trim)
  const trimmed = options.map(o => o.trim().toLowerCase());
  const seen = new Set();
  let hasDupe = false;
  for (const t of trimmed) {
    if (seen.has(t)) { hasDupe = true; break; }
    seen.add(t);
  }
  if (hasDupe) {
    definiteIssues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'DUPLICATE_OPTIONS', detail: `Options: ${JSON.stringify(options)}` });
  }

  // 5. DEFINITE question-answer mismatch: question asks for X, ALL options are clearly about Y
  // This catches the scrambled questions where question text got paired with wrong answer set
  
  // Check if question asks about a specific measurable quantity but options are in completely wrong units
  const qAsksFor = detectQuestionTopic(questionLower);
  const optionsAbout = detectOptionsTopic(options);
  
  if (qAsksFor && optionsAbout && qAsksFor !== optionsAbout && !areRelated(qAsksFor, optionsAbout)) {
    definiteIssues.push({ 
      id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, 
      type: 'SCRAMBLED_QA', 
      detail: `Q asks about "${qAsksFor}" but options are about "${optionsAbout}". Q: "${row.question.substring(0, 80)}..." Opts: ${JSON.stringify(options.map(o => o.substring(0, 50)))}` 
    });
  }

  // 6. Explanation clearly doesn't match the question
  // If explanation contains a formula/calculation result that doesn't appear in any option
  if (row.isCalc && row.explanation) {
    // Extract numbers from explanation's final calculation
    const explNumbers = extractFinalNumbers(explanationLower);
    const optNumbers = options.flatMap(o => extractFinalNumbers(o.toLowerCase()));
    
    if (explNumbers.length > 0 && optNumbers.length > 0) {
      const hasMatch = explNumbers.some(en => optNumbers.some(on => Math.abs(en - on) / Math.max(Math.abs(en), 1) < 0.05));
      if (!hasMatch && explNumbers[0] > 0.001) {
        // Explanation result doesn't match ANY option
        definiteIssues.push({
          id: row.id, bankKey: row.bankKey, questionNum: row.questionNum,
          type: 'CALC_MISMATCH',
          detail: `Explanation calculates ${explNumbers.join(', ')} but options have ${optNumbers.join(', ')}`
        });
      }
    }
  }
}

function detectQuestionTopic(q) {
  // Detect what the question is asking for based on clear keywords
  if (q.includes('pump power') || q.includes('motor power') || q.includes('brake horsepower') || q.includes('bhp')) return 'power';
  if (q.includes('what is the velocity') || q.includes('calculate the velocity') || q.includes('flow velocity')) return 'velocity';
  if (q.includes('what is the volume') || q.includes('cake volume') || q.includes('thickened volume')) return 'volume';
  if (q.includes('alkalinity') && (q.includes('consumed') || q.includes('required') || q.includes('what is the'))) return 'alkalinity';
  if (q.includes('compliance margin') && q.includes('bod')) return 'bod_compliance';
  if (q.includes('compliance margin') && q.includes('effluent')) return 'compliance';
  if (q.includes('taste') && q.includes('odour')) return 'taste_odour';
  if (q.includes('advanced metering') || q.includes('ami')) return 'metering';
  if (q.includes('what is the head loss') || q.includes('friction loss')) return 'headloss';
  if (q.includes('what is the flow rate') || q.includes('calculate the flow')) return 'flowrate';
  if (q.includes('detention time') || q.includes('retention time') || q.includes('contact time')) return 'time';
  if (q.includes('what is the dose') || q.includes('chemical dose') || q.includes('feed rate')) return 'dose';
  if (q.includes('per capita') && q.includes('water')) return 'per_capita';
  if (q.includes('dye test')) return 'dye_test';
  if (q.includes('effluent toxicity') || q.includes('wet test')) return 'toxicity';
  if (q.includes('source water protection')) return 'source_protection';
  if (q.includes('what is the effluent') && q.includes('tn')) return 'nitrogen';
  if (q.includes('what is the effluent') && q.includes('phosphorus')) return 'phosphorus';
  return null;
}

function detectOptionsTopic(opts) {
  const allOpts = opts.join(' ').toLowerCase();
  // Check if ALL options are clearly about a specific topic
  if (opts.every(o => /m\/s|ft\/s|fps/.test(o))) return 'velocity';
  if (opts.every(o => /kw|kilowatt|horsepower|bhp/.test(o))) return 'power';
  if (opts.every(o => /mwh|kwh|electricity/.test(o))) return 'electricity';
  if (opts.every(o => /l\/person|per capita|litres per person/.test(o.toLowerCase()))) return 'per_capita';
  if (opts.every(o => /\$[\d,]+/.test(o) || /cost|price|\$/.test(o.toLowerCase()))) return 'cost';
  if (opts.every(o => /mg\/l/i.test(o)) && allOpts.includes('p_eff')) return 'phosphorus';
  if (allOpts.includes('return activated sludge') || allOpts.includes('transfer primary sludge')) return 'sludge_operations';
  if (allOpts.includes('operate under') && allOpts.includes('eca')) return 'regulatory';
  return null;
}

function areRelated(a, b) {
  // Some topics are naturally related
  const related = {
    'power': ['electricity'],
    'electricity': ['power'],
    'flowrate': ['velocity', 'volume'],
    'velocity': ['flowrate'],
    'volume': ['flowrate'],
    'dose': ['alkalinity'],
    'alkalinity': ['dose'],
  };
  return (related[a] || []).includes(b);
}

function extractFinalNumbers(text) {
  // Extract numbers that look like calculation results
  const matches = text.match(/=\s*([\d,.]+)/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(/[=,\s]/g, ''))).filter(n => !isNaN(n));
}

// Summary
const byType = {};
for (const issue of definiteIssues) {
  byType[issue.type] = (byType[issue.type] || 0) + 1;
}

console.log(`\n=== PRECISE AUDIT COMPLETE ===`);
console.log(`Total questions: ${rows.length}`);
console.log(`Definite issues: ${definiteIssues.length}`);
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}

// Write report
writeFileSync('/home/ubuntu/question-audit-precise.json', JSON.stringify({
  summary: { total: rows.length, issues: definiteIssues.length, byType },
  issues: definiteIssues
}, null, 2));

console.log('\nReport: /home/ubuntu/question-audit-precise.json');

// Print all SCRAMBLED_QA issues
const scrambled = definiteIssues.filter(i => i.type === 'SCRAMBLED_QA');
console.log(`\n=== SCRAMBLED Q&A (${scrambled.length}) ===`);
for (const s of scrambled) {
  console.log(`${s.bankKey} Q${s.questionNum} (ID:${s.id}): ${s.detail.substring(0, 200)}`);
}

await conn.end();
