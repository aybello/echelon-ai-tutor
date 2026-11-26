import mysql from 'mysql2/promise';
import fs from 'fs';

// Level definitions for Canadian water/wastewater operator certification
const LEVEL_CRITERIA = {
  'oit': {
    name: 'Operator-in-Training (Water)',
    scope: 'Entry-level water treatment. Basic concepts, terminology, safety, simple calculations (flow conversion, dosage, detention time). No advanced process control, no design, no management.',
    shouldNOT: 'Class 2+ topics like advanced coagulation optimization, filter design calculations, membrane processes, UV reactor validation, advanced hydraulics, plant management, budgeting, regulatory compliance reporting'
  },
  'oit-ww': {
    name: 'Operator-in-Training (Wastewater)',
    scope: 'Entry-level wastewater treatment. Basic concepts, terminology, safety, simple calculations. Basic understanding of primary/secondary treatment, collection systems.',
    shouldNOT: 'Advanced nutrient removal (BNR), nitrification/denitrification kinetics, SRT optimization, advanced sludge processing, plant management, regulatory reporting'
  },
  'class1': {
    name: 'Class 1 (Combined)',
    scope: 'Foundational operator knowledge. Basic treatment processes, routine operations, sampling, safety, basic math. Understanding of regulations at operational level.',
    shouldNOT: 'Advanced process optimization, plant design, management/budgeting, advanced lab analysis, complex multi-step calculations'
  },
  'class1-water': {
    name: 'Class 1 Water Treatment',
    scope: 'Basic water treatment operations. Coagulation, flocculation, sedimentation, filtration, disinfection fundamentals. Basic water quality parameters, sampling, CT calculations.',
    shouldNOT: 'Advanced membrane processes, UV validation, ozone system design, advanced hydraulic modeling, plant management, complex optimization'
  },
  'class1-wastewater': {
    name: 'Class 1 Wastewater Treatment',
    scope: 'Basic wastewater treatment operations. Primary/secondary treatment basics, activated sludge fundamentals, basic sludge handling, disinfection, basic lab tests.',
    shouldNOT: 'Advanced BNR, nitrification kinetics, SRT/MCRT optimization, advanced sludge dewatering, membrane bioreactors, plant management'
  },
  'class2-water': {
    name: 'Class 2 Water Treatment',
    scope: 'Intermediate water treatment. More detailed process control, filter optimization, chemical feed systems, distribution system management, intermediate calculations.',
    shouldNOT: 'Advanced plant design, complex hydraulic modeling, advanced membrane systems, plant management/budgeting, regulatory policy'
  },
  'class2-wastewater': {
    name: 'Class 2 Wastewater Treatment',
    scope: 'Intermediate wastewater treatment. Process control for activated sludge, SRT/F:M calculations, nutrient monitoring, intermediate sludge processing.',
    shouldNOT: 'Advanced BNR design, complex kinetics, advanced resource recovery, plant management, regulatory policy development'
  },
  'class3-water': {
    name: 'Class 3 Water Treatment',
    scope: 'Advanced water treatment operations. Complex process optimization, advanced filtration, membrane processes, advanced disinfection (UV, ozone), hydraulic analysis, supervisory responsibilities.',
    shouldNOT: 'Plant design engineering, executive management, policy development'
  },
  'class3-wastewater': {
    name: 'Class 3 Wastewater Treatment',
    scope: 'Advanced wastewater treatment. BNR process control, advanced sludge processing, process optimization, troubleshooting, supervisory responsibilities.',
    shouldNOT: 'Plant design engineering, executive management, policy development'
  },
  'class4-water': {
    name: 'Class 4 Water Treatment',
    scope: 'Expert-level water treatment. Plant management, advanced process design, regulatory compliance, budgeting, emergency response, all treatment technologies.',
    shouldNOT: 'Nothing — Class 4 covers everything'
  },
  'class4-wastewater': {
    name: 'Class 4 Wastewater Treatment',
    scope: 'Expert-level wastewater treatment. Plant management, advanced process design, regulatory compliance, budgeting, emergency response, all treatment technologies.',
    shouldNOT: 'Nothing — Class 4 covers everything'
  },
  'wqa': {
    name: 'Water Quality Analyst',
    scope: 'Laboratory analysis, water quality parameters, sampling techniques, QA/QC, lab safety, analytical methods, data interpretation, regulatory standards for water quality.',
    shouldNOT: 'Treatment plant operations, process control, plant management (unless related to lab work)'
  }
};

// WPI banks follow similar patterns
const WPI_LEVELS = {
  'wpi-class1': 'Class 1 (entry-level operations, basic concepts, safety, simple calculations)',
  'wpi-class2': 'Class 2 (intermediate operations, process control, moderate calculations)',
  'wpi-class3': 'Class 3 (advanced operations, optimization, troubleshooting, supervisory)',
  'wpi-class4': 'Class 4 (expert-level, plant management, design, all technologies)',
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all questions grouped by bank
  const [allQ] = await conn.execute(
    'SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, difficulty, module, isCalc FROM questions ORDER BY bankKey, questionNum'
  );
  
  console.log(`Total questions: ${allQ.length}`);
  
  const issues = [];
  
  // Check 1: Difficulty distribution sanity
  // OIT/Class1 should have more easy/medium, fewer hard
  // Class3/Class4 should have more hard
  const bankGroups = {};
  for (const q of allQ) {
    if (!bankGroups[q.bankKey]) bankGroups[q.bankKey] = [];
    bankGroups[q.bankKey].push(q);
  }
  
  // Check 2: Look for questions that seem too advanced for their level
  // We'll check for specific keyword patterns that indicate wrong level
  const ADVANCED_KEYWORDS = [
    // Management/budgeting (Class 3-4 only)
    { pattern: /\b(budget|capital plan|asset management plan|strategic plan|succession plan)\b/i, minLevel: 3, category: 'management' },
    { pattern: /\b(SCADA|PLC programming|instrumentation calibration)\b/i, minLevel: 2, category: 'instrumentation' },
    // Advanced processes
    { pattern: /\b(membrane bioreactor|MBR|reverse osmosis|nanofiltration|ultrafiltration)\b/i, minLevel: 2, category: 'advanced_process' },
    { pattern: /\b(nitrification kinetics|denitrification rate|anammox|SHARON)\b/i, minLevel: 3, category: 'advanced_bio' },
    { pattern: /\b(Monod equation|half-saturation|yield coefficient|endogenous decay)\b/i, minLevel: 3, category: 'kinetics' },
    // Design (Class 3-4)
    { pattern: /\b(design criteria|design flow|peak factor design|hydraulic profile)\b/i, minLevel: 3, category: 'design' },
    // Regulatory/management
    { pattern: /\b(environmental compliance approval|ECA amendment|permit modification)\b/i, minLevel: 2, category: 'regulatory' },
  ];
  
  for (const q of allQ) {
    const bankLevel = getBankLevel(q.bankKey);
    if (bankLevel === null) continue; // skip WQA and others
    
    // Check for advanced keywords in lower-level banks
    for (const kw of ADVANCED_KEYWORDS) {
      if (bankLevel < kw.minLevel && kw.pattern.test(q.question)) {
        issues.push({
          id: q.id,
          bankKey: q.bankKey,
          questionNum: q.questionNum,
          issue: 'LEVEL_TOO_ADVANCED',
          category: kw.category,
          detail: `Question mentions "${q.question.match(kw.pattern)?.[0]}" which is typically Class ${kw.minLevel}+ content, but this is in a ${getBankName(q.bankKey)} bank`,
          question: q.question.substring(0, 150)
        });
      }
    }
    
    // Check 3: Calculation complexity vs level
    if (q.isCalc) {
      const opts = JSON.parse(q.options);
      const explanation = q.explanation || '';
      
      // Count calculation steps in explanation
      const stepCount = (explanation.match(/step/gi) || []).length;
      const formulaCount = (explanation.match(/[=×÷\+\-]/g) || []).length;
      
      // OIT should have simple 1-2 step calculations
      if (bankLevel === 0 && stepCount > 4) {
        issues.push({
          id: q.id,
          bankKey: q.bankKey,
          questionNum: q.questionNum,
          issue: 'CALC_TOO_COMPLEX',
          detail: `OIT calculation has ${stepCount} steps — should be 1-2 steps for entry level`,
          question: q.question.substring(0, 150)
        });
      }
    }
    
    // Check 4: Questions with empty or very short explanations
    if (!q.explanation || q.explanation.length < 20) {
      issues.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        issue: 'MISSING_EXPLANATION',
        detail: `Explanation is empty or too short (${q.explanation?.length || 0} chars)`,
        question: q.question.substring(0, 150)
      });
    }
    
    // Check 5: Questions with very short question text (likely truncated)
    if (q.question.length < 15) {
      issues.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        issue: 'SHORT_QUESTION',
        detail: `Question text is only ${q.question.length} chars — may be truncated`,
        question: q.question
      });
    }
    
    // Check 6: Options validation
    const opts = JSON.parse(q.options);
    if (opts.length !== 4) {
      issues.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        issue: 'WRONG_OPTION_COUNT',
        detail: `Has ${opts.length} options instead of 4`,
        question: q.question.substring(0, 150)
      });
    }
    
    // Check for empty options
    if (opts.some(o => !o || o.trim() === '')) {
      issues.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        issue: 'EMPTY_OPTION',
        detail: `One or more options are empty`,
        question: q.question.substring(0, 150)
      });
    }
    
    // Check correctIndex is valid
    if (q.correctIndex < 0 || q.correctIndex >= opts.length) {
      issues.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        issue: 'INVALID_CORRECT_INDEX',
        detail: `correctIndex is ${q.correctIndex} but only ${opts.length} options exist`,
        question: q.question.substring(0, 150)
      });
    }
    
    // Check 7: Explanation contradicts correct answer (keyword check)
    const correctOpt = opts[q.correctIndex]?.toLowerCase() || '';
    const explLower = (q.explanation || '').toLowerCase();
    
    // If explanation says "incorrect" or "wrong" about the correct answer
    if (explLower.includes(`"${correctOpt.substring(0, 20)}" is incorrect`) || 
        explLower.includes(`${correctOpt.substring(0, 20)} is not correct`)) {
      issues.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        issue: 'EXPLANATION_CONTRADICTS',
        detail: 'Explanation appears to say the correct answer is wrong',
        question: q.question.substring(0, 150)
      });
    }
  }
  
  // Summary
  console.log(`\nTotal issues found: ${issues.length}`);
  const byType = {};
  for (const i of issues) {
    byType[i.issue] = (byType[i.issue] || 0) + 1;
  }
  console.log('By type:', byType);
  
  // Save results
  fs.writeFileSync('/home/ubuntu/level-audit-results.json', JSON.stringify(issues, null, 2));
  console.log('Results saved to /home/ubuntu/level-audit-results.json');
  
  // Print details for each type
  for (const type of Object.keys(byType)) {
    console.log(`\n=== ${type} (${byType[type]}) ===`);
    const typeIssues = issues.filter(i => i.issue === type);
    for (const i of typeIssues.slice(0, 5)) {
      console.log(`  ${i.bankKey} Q${i.questionNum}: ${i.detail}`);
      console.log(`    Q: ${i.question}`);
    }
    if (typeIssues.length > 5) console.log(`  ... and ${typeIssues.length - 5} more`);
  }
  
  await conn.end();
}

function getBankLevel(bankKey) {
  if (bankKey.includes('oit')) return 0;
  if (bankKey.includes('class1')) return 1;
  if (bankKey.includes('class2')) return 2;
  if (bankKey.includes('class3')) return 3;
  if (bankKey.includes('class4')) return 4;
  if (bankKey === 'wqa') return null;
  return null;
}

function getBankName(bankKey) {
  if (bankKey.includes('oit')) return 'OIT (entry-level)';
  if (bankKey.includes('class1')) return 'Class 1';
  if (bankKey.includes('class2')) return 'Class 2';
  if (bankKey.includes('class3')) return 'Class 3';
  if (bankKey.includes('class4')) return 'Class 4';
  return bankKey;
}

main().catch(console.error);
