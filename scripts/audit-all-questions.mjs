import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Starting comprehensive question audit...');

// Fetch ALL questions
const [rows] = await conn.execute(
  'SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, steps, module, isCalc, difficulty FROM questions ORDER BY bankKey, questionNum'
);

console.log(`Loaded ${rows.length} questions. Running checks...`);

const issues = [];

for (const row of rows) {
  const qId = `${row.bankKey} Q${row.questionNum}`;
  
  // Parse options
  let options;
  try {
    options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
  } catch (e) {
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'INVALID_OPTIONS_JSON', severity: 'CRITICAL', detail: 'Cannot parse options JSON' });
    continue;
  }

  // 1. Empty or missing question text
  if (!row.question || row.question.trim().length < 10) {
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'EMPTY_QUESTION', severity: 'CRITICAL', detail: `Question text is empty or too short: "${row.question}"` });
  }

  // 2. Empty or missing explanation
  if (!row.explanation || row.explanation.trim().length < 10) {
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'EMPTY_EXPLANATION', severity: 'HIGH', detail: 'Explanation is empty or too short' });
  }

  // 3. Invalid correctIndex
  if (row.correctIndex === null || row.correctIndex === undefined || row.correctIndex < 0 || row.correctIndex >= options.length) {
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'INVALID_CORRECT_INDEX', severity: 'CRITICAL', detail: `correctIndex=${row.correctIndex} but options has ${options.length} items` });
    continue;
  }

  // 4. Duplicate options
  const uniqueOpts = new Set(options.map(o => o.trim().toLowerCase()));
  if (uniqueOpts.size < options.length) {
    const dupes = options.filter((o, i) => options.findIndex(x => x.trim().toLowerCase() === o.trim().toLowerCase()) !== i);
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'DUPLICATE_OPTIONS', severity: 'HIGH', detail: `Duplicate options found: ${JSON.stringify(dupes)}` });
  }

  // 5. Options with fewer than 2 items or more than 6
  if (options.length < 2) {
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'TOO_FEW_OPTIONS', severity: 'CRITICAL', detail: `Only ${options.length} options` });
  }

  // 6. Empty option text
  for (let i = 0; i < options.length; i++) {
    if (!options[i] || options[i].trim().length === 0) {
      issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'EMPTY_OPTION', severity: 'CRITICAL', detail: `Option ${i} is empty` });
    }
  }

  // 7. Unit mismatch detection — question asks for one unit, options have different units
  const questionLower = (row.question || '').toLowerCase();
  const correctAnswer = (options[row.correctIndex] || '').toLowerCase();
  const explanationLower = (row.explanation || '').toLowerCase();

  // Check for question-answer topic mismatch patterns
  // If question mentions specific topic keywords but correct answer/explanation discusses completely different topic
  const unitPatterns = [
    { qKeywords: ['volume', 'm³', 'litre', 'liter', 'gallon'], aUnits: ['kg/d', 'kw', 'mwh', 'mg/l', 'l/person'] },
    { qKeywords: ['power', 'kw', 'kilowatt', 'watt'], aUnits: ['m/s', 'ft/s', 'l/s', 'm³/s'] },
    { qKeywords: ['velocity', 'm/s', 'ft/s', 'speed'], aUnits: ['kg', 'kw', 'mg/l'] },
    { qKeywords: ['alkalinity', 'mg/l as caco'], aUnits: ['mwh', 'kw', 'l/person'] },
    { qKeywords: ['pressure', 'kpa', 'psi', 'bar'], aUnits: ['m/s', 'kg/d', 'l/s'] },
  ];

  for (const pattern of unitPatterns) {
    const qMatch = pattern.qKeywords.some(k => questionLower.includes(k));
    const aMatch = pattern.aUnits.some(u => correctAnswer.includes(u));
    if (qMatch && aMatch) {
      issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'UNIT_MISMATCH', severity: 'CRITICAL', detail: `Question asks about [${pattern.qKeywords.find(k => questionLower.includes(k))}] but answer contains [${pattern.aUnits.find(u => correctAnswer.includes(u))}]` });
    }
  }

  // 8. Detect question-explanation topic mismatch
  // Extract key topic words from question and explanation
  const topicKeywords = {
    'pump power': ['pump power', 'pump brake', 'bhp', 'motor power'],
    'velocity': ['velocity', 'speed', 'm/s', 'ft/s', 'fps'],
    'alkalinity': ['alkalinity', 'caco3', 'caco₃', 'bicarbonate'],
    'electricity': ['mwh', 'kwh', 'electricity', 'energy consumption'],
    'phosphorus': ['phosphorus', 'p_eff', 'p removal', 'phosphate'],
    'nitrogen': ['nitrogen', 'n_eff', 'tn', 'no3-n', 'nh4-n', 'ammonia'],
    'volume': ['volume', 'cake volume', 'thickened volume'],
    'lime': ['lime', 'lime dose', 'lime dosage', 'ca(oh)2'],
    'per capita': ['per capita', 'l/person', 'litres per person'],
    'compliance margin': ['compliance margin', 'margin', 'below limit', 'above limit'],
    'taste and odour': ['taste', 'odour', 'odor', 'geosmin', 'mib'],
    'metering': ['metering', 'ami', 'meter', 'smart meter'],
    'cost': ['cost', '$/yr', 'annual cost', 'total cost'],
    'cross-connection': ['cross-connection', 'backflow', 'backsiphonage'],
    'dye test': ['dye test', 'dye tracing', 'smoke test'],
    'sludge pump': ['sludge pump', 'primary sludge', 'transfer sludge'],
    'toxicity': ['toxicity', 'wet test', 'whole effluent', 'toxic'],
    'eca': ['eca', 'environmental compliance', 'compliance approval'],
  };

  // Check if question topic and explanation topic are mismatched
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const qHasTopic = keywords.some(k => questionLower.includes(k));
    if (!qHasTopic) continue;
    
    // Check if explanation discusses a DIFFERENT topic entirely
    for (const [otherTopic, otherKeywords] of Object.entries(topicKeywords)) {
      if (otherTopic === topic) continue;
      const explHasOther = otherKeywords.some(k => explanationLower.includes(k));
      const explHasTopic = keywords.some(k => explanationLower.includes(k));
      
      if (explHasOther && !explHasTopic) {
        // Only flag if explanation clearly discusses different topic and NOT the question topic
        issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'TOPIC_MISMATCH', severity: 'CRITICAL', detail: `Question about "${topic}" but explanation discusses "${otherTopic}"` });
        break; // One mismatch is enough
      }
    }
  }

  // 9. Calculation verification for simple formulas
  if (row.isCalc) {
    // Check if steps exist for calculation questions
    let steps;
    try {
      steps = row.steps ? (typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps) : null;
    } catch (e) {
      steps = null;
    }
    if (!steps || (Array.isArray(steps) && steps.length === 0)) {
      issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'CALC_NO_STEPS', severity: 'MEDIUM', detail: 'Calculation question has no step-by-step solution' });
    }
  }

  // 10. Check for very short correct answers that might be placeholders
  if (correctAnswer.length < 3 && !correctAnswer.match(/^\d/)) {
    issues.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, type: 'SHORT_ANSWER', severity: 'MEDIUM', detail: `Correct answer is very short: "${correctAnswer}"` });
  }
}

// Summarize
const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
const highCount = issues.filter(i => i.severity === 'HIGH').length;
const mediumCount = issues.filter(i => i.severity === 'MEDIUM').length;

console.log(`\n=== AUDIT COMPLETE ===`);
console.log(`Total questions: ${rows.length}`);
console.log(`Issues found: ${issues.length}`);
console.log(`  CRITICAL: ${criticalCount}`);
console.log(`  HIGH: ${highCount}`);
console.log(`  MEDIUM: ${mediumCount}`);

// Group by type
const byType = {};
for (const issue of issues) {
  byType[issue.type] = (byType[issue.type] || 0) + 1;
}
console.log('\nBy type:');
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}

// Write full report
const report = {
  summary: {
    totalQuestions: rows.length,
    totalIssues: issues.length,
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    byType,
  },
  issues: issues.sort((a, b) => {
    const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    return (sevOrder[a.severity] || 3) - (sevOrder[b.severity] || 3);
  }),
};

writeFileSync('/home/ubuntu/question-audit-report.json', JSON.stringify(report, null, 2));
console.log('\nFull report written to /home/ubuntu/question-audit-report.json');

// Also write a CSV of critical issues for easy review
const csvLines = ['id,bankKey,questionNum,type,severity,detail'];
for (const issue of issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')) {
  csvLines.push(`${issue.id},"${issue.bankKey}",${issue.questionNum},"${issue.type}","${issue.severity}","${issue.detail.replace(/"/g, '""')}"`);
}
writeFileSync('/home/ubuntu/question-audit-critical.csv', csvLines.join('\n'));
console.log('Critical/High issues CSV written to /home/ubuntu/question-audit-critical.csv');

await conn.end();
