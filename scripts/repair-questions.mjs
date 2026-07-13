import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config();

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Load audit results
const audit = JSON.parse(readFileSync('/home/ubuntu/question-audit-precise.json', 'utf8'));
const issues = audit.issues;

console.log(`Total issues to fix: ${issues.length}`);

// Group issues by question ID
const byId = {};
for (const issue of issues) {
  if (!byId[issue.id]) byId[issue.id] = [];
  byId[issue.id].push(issue);
}

const uniqueIds = Object.keys(byId).map(Number);
console.log(`Unique questions to fix: ${uniqueIds.length}`);

// Fetch all affected questions
const placeholders = uniqueIds.map(() => '?').join(',');
const [affectedRows] = await conn.execute(
  `SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, steps, module, isCalc FROM questions WHERE id IN (${placeholders})`,
  uniqueIds
);

console.log(`Fetched ${affectedRows.length} questions from DB`);

async function invokeLLM(messages, responseFormat) {
  const body = {
    messages,
    ...(responseFormat ? { response_format: responseFormat } : {}),
  };
  
  const resp = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM error ${resp.status}: ${text}`);
  }
  
  return resp.json();
}

const repairLog = [];
let fixed = 0;
let failed = 0;

for (const row of affectedRows) {
  const issueTypes = byId[row.id].map(i => i.type);
  const options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
  
  console.log(`\nFixing ${row.bankKey} Q${row.questionNum} (ID:${row.id}) - Issues: ${issueTypes.join(', ')}`);
  
  try {
    if (issueTypes.includes('SCRAMBLED_QA')) {
      // Question text is paired with completely wrong answers — need to regenerate options + explanation
      const result = await regenerateAnswers(row, options);
      if (result) {
        await conn.execute(
          'UPDATE questions SET options = ?, correctIndex = ?, explanation = ?, steps = ? WHERE id = ?',
          [JSON.stringify(result.options), result.correctIndex, result.explanation, JSON.stringify(result.steps), row.id]
        );
        repairLog.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, action: 'REGENERATED_ANSWERS', success: true });
        fixed++;
      }
    } else if (issueTypes.includes('CALC_MISMATCH')) {
      // Explanation calculates wrong number — regenerate the whole question with correct math
      const result = await fixCalculation(row, options);
      if (result) {
        await conn.execute(
          'UPDATE questions SET options = ?, correctIndex = ?, explanation = ?, steps = ? WHERE id = ?',
          [JSON.stringify(result.options), result.correctIndex, result.explanation, JSON.stringify(result.steps), row.id]
        );
        repairLog.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, action: 'FIXED_CALCULATION', success: true });
        fixed++;
      }
    } else if (issueTypes.includes('DUPLICATE_OPTIONS')) {
      // Fix duplicate options by regenerating distinct distractors
      const result = await fixDuplicateOptions(row, options);
      if (result) {
        await conn.execute(
          'UPDATE questions SET options = ?, correctIndex = ? WHERE id = ?',
          [JSON.stringify(result.options), result.correctIndex, row.id]
        );
        repairLog.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, action: 'FIXED_DUPLICATES', success: true });
        fixed++;
      }
    }
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    repairLog.push({ id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, action: 'FAILED', error: err.message });
    failed++;
  }
  
  // Small delay to avoid rate limits
  await new Promise(r => setTimeout(r, 500));
}

async function regenerateAnswers(row, options) {
  const examType = row.bankKey.includes('wpi') ? 'WPI (Western Provinces Initiative)' : 'Ontario';
  const level = row.bankKey.replace('wpi-', '');
  
  const resp = await invokeLLM([
    { role: 'system', content: `You are an expert in Canadian water and wastewater operator certification exams (${examType}, ${level} level). You must generate accurate, technically correct exam questions with proper answers and explanations. Always break down formulas step by step.` },
    { role: 'user', content: `The following exam question has WRONG answer options that don't match the question. Generate 4 NEW correct answer options and a detailed explanation.

Question: ${row.question}
Module: ${row.module}
Is Calculation: ${row.isCalc ? 'Yes' : 'No'}

Requirements:
1. Generate exactly 4 answer options
2. One must be the correct answer
3. The other 3 must be plausible but wrong distractors
4. Provide a detailed explanation of why the correct answer is right
5. If it's a calculation question, show all steps with formulas
6. Return the correctIndex (0-3) indicating which option is correct` }
  ], {
    type: 'json_schema',
    json_schema: {
      name: 'question_repair',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          options: { type: 'array', items: { type: 'string' }, description: 'Exactly 4 answer options' },
          correctIndex: { type: 'integer', description: '0-based index of the correct answer' },
          explanation: { type: 'string', description: 'Detailed explanation of the correct answer' },
          steps: { type: 'array', items: { type: 'object', properties: { l: { type: 'string' }, c: { type: 'string' } }, required: ['l', 'c'], additionalProperties: false }, description: 'Step-by-step solution (for calc questions) or key points' }
        },
        required: ['options', 'correctIndex', 'explanation', 'steps'],
        additionalProperties: false
      }
    }
  });
  
  const content = JSON.parse(resp.choices[0].message.content);
  console.log(`  Regenerated: correct=${content.correctIndex}, opts=${content.options.map(o => o.substring(0, 40)).join(' | ')}`);
  return content;
}

async function fixCalculation(row, options) {
  const examType = row.bankKey.includes('wpi') ? 'WPI (Western Provinces Initiative)' : 'Ontario';
  
  const resp = await invokeLLM([
    { role: 'system', content: `You are an expert in Canadian water and wastewater operator certification exams (${examType}). You must verify and fix calculation questions. Show all work step by step. Use standard water/wastewater engineering formulas.` },
    { role: 'user', content: `This calculation question has a mismatch between the explanation and the answer options. Please solve the question correctly, verify the math, and generate proper options.

Question: ${row.question}
Module: ${row.module}
Current options: ${JSON.stringify(options)}
Current correct index: ${row.correctIndex}
Current explanation: ${row.explanation}

Requirements:
1. Solve the problem from scratch showing all steps
2. Generate 4 options where one is the correct calculated answer
3. Make the 3 wrong options plausible (common calculation errors)
4. Provide a clear step-by-step explanation with formulas` }
  ], {
    type: 'json_schema',
    json_schema: {
      name: 'calc_repair',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          options: { type: 'array', items: { type: 'string' }, description: 'Exactly 4 answer options' },
          correctIndex: { type: 'integer', description: '0-based index of the correct answer' },
          explanation: { type: 'string', description: 'Step-by-step calculation with formulas' },
          steps: { type: 'array', items: { type: 'object', properties: { l: { type: 'string' }, c: { type: 'string' } }, required: ['l', 'c'], additionalProperties: false }, description: 'Step-by-step solution' }
        },
        required: ['options', 'correctIndex', 'explanation', 'steps'],
        additionalProperties: false
      }
    }
  });
  
  const content = JSON.parse(resp.choices[0].message.content);
  console.log(`  Fixed calc: correct=${content.correctIndex}, answer=${content.options[content.correctIndex].substring(0, 50)}`);
  return content;
}

async function fixDuplicateOptions(row, options) {
  const examType = row.bankKey.includes('wpi') ? 'WPI (Western Provinces Initiative)' : 'Ontario';
  const correctAnswer = options[row.correctIndex];
  
  const resp = await invokeLLM([
    { role: 'system', content: `You are an expert in Canadian water and wastewater operator certification exams (${examType}). Fix duplicate answer options by generating unique, plausible distractors.` },
    { role: 'user', content: `This question has duplicate answer options. Keep the correct answer and generate new unique distractors.

Question: ${row.question}
Module: ${row.module}
Current options: ${JSON.stringify(options)}
Current correct answer (index ${row.correctIndex}): ${correctAnswer}
Explanation: ${row.explanation || 'N/A'}

Requirements:
1. Keep the correct answer text exactly as-is
2. Replace duplicate/similar options with new plausible but wrong distractors
3. All 4 options must be unique and distinct
4. Return the new correctIndex pointing to the unchanged correct answer
5. For calculation questions, make wrong options reflect common errors (wrong formula, unit conversion errors, etc.)` }
  ], {
    type: 'json_schema',
    json_schema: {
      name: 'dupe_repair',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          options: { type: 'array', items: { type: 'string' }, description: 'Exactly 4 unique answer options' },
          correctIndex: { type: 'integer', description: '0-based index of the correct answer' },
        },
        required: ['options', 'correctIndex'],
        additionalProperties: false
      }
    }
  });
  
  const content = JSON.parse(resp.choices[0].message.content);
  
  // Verify the correct answer is preserved
  if (content.options[content.correctIndex] !== correctAnswer) {
    console.log(`  WARNING: Correct answer changed. Attempting to find it...`);
    const idx = content.options.findIndex(o => o === correctAnswer);
    if (idx >= 0) {
      content.correctIndex = idx;
    } else {
      console.log(`  WARNING: Could not find original correct answer in new options. Trusting LLM.`);
    }
  }
  
  console.log(`  Fixed dupes: ${content.options.map(o => o.substring(0, 30)).join(' | ')}`);
  return content;
}

// Final summary
console.log(`\n=== REPAIR COMPLETE ===`);
console.log(`Fixed: ${fixed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${fixed + failed}`);

writeFileSync('/home/ubuntu/question-repair-log.json', JSON.stringify(repairLog, null, 2));
console.log('Repair log: /home/ubuntu/question-repair-log.json');

await conn.end();
