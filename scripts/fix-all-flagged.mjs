import mysql from 'mysql2/promise';
import fs from 'fs';

const CONCURRENCY = 5;
const PROGRESS_FILE = '/home/ubuntu/fix-all-progress.json';
const RESULTS_FILE = '/home/ubuntu/fix-all-results.json';

async function invokeLLM(messages) {
  const url = process.env.BUILT_IN_FORGE_API_URL;
  const key = process.env.BUILT_IN_FORGE_API_KEY;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'question_fix',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  correct_answer_index: { type: 'integer', description: 'The index (0-3) of the correct answer option' },
                  options: { type: 'array', items: { type: 'string' }, description: 'Array of exactly 4 answer options. Keep original options if they are fine, only change if needed.' },
                  explanation: { type: 'string', description: 'Complete detailed explanation (3-5 sentences). For calculations, show ALL steps with formulas and numbers.' },
                  steps: { type: 'array', items: { type: 'object', properties: { l: { type: 'string' }, c: { type: 'string' } }, required: ['l', 'c'], additionalProperties: false }, description: 'Step-by-step breakdown. For calculations: each step shows the formula and computation. For conceptual: each step explains a key point.' },
                  confidence: { type: 'string', description: 'HIGH if certain, MEDIUM if mostly sure, LOW if unsure' },
                  change_summary: { type: 'string', description: 'Brief description of what was changed and why' }
                },
                required: ['correct_answer_index', 'options', 'explanation', 'steps', 'confidence', 'change_summary'],
                additionalProperties: false
              }
            }
          }
        })
      });
      const data = await resp.json();
      if (!data.choices?.[0]?.message?.content) throw new Error('Empty response');
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Load all flagged question IDs from both files
  const incorrect = JSON.parse(fs.readFileSync('/home/ubuntu/deep-verify-results.json', 'utf8'));
  const flaggedIds = incorrect.map(r => r.id);
  console.log(`Total flagged questions to fix: ${flaggedIds.length}`);

  // Load progress
  let progress = { fixed: [], failed: [], skipped: [] };
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Resuming: ${progress.fixed.length} fixed, ${progress.failed.length} failed`);
  }
  const doneIds = new Set([...progress.fixed.map(f => f.id), ...progress.failed.map(f => f.id), ...progress.skipped.map(f => f.id)]);

  // Get the actual question data from DB for all flagged IDs
  const remaining = flaggedIds.filter(id => !doneIds.has(id));
  console.log(`Remaining to fix: ${remaining.length}`);

  if (remaining.length === 0) {
    console.log('All questions already processed!');
    await conn.end();
    return;
  }

  // Fetch in batches of 100
  for (let batch = 0; batch < remaining.length; batch += 100) {
    const batchIds = remaining.slice(batch, batch + 100);
    const placeholders = batchIds.map(() => '?').join(',');
    const [rows] = await conn.execute(
      `SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, isCalc, steps FROM questions WHERE id IN (${placeholders})`,
      batchIds
    );

    // Build a map of flagged issues
    const issueMap = {};
    for (const r of incorrect) {
      issueMap[r.id] = r;
    }

    // Process questions with concurrency
    const queue = [...rows];
    let processed = 0;

    async function processOne() {
      while (queue.length > 0) {
        const q = queue.shift();
        if (!q) break;

        const issue = issueMap[q.id];
        const opts = JSON.parse(q.options);

        try {
          const fix = await invokeLLM([
            {
              role: 'system',
              content: `You are an expert Canadian water and wastewater operator certification examiner and instructor. You must fix a question that has been flagged as having an issue.

CRITICAL RULES:
1. For CALCULATION questions: You MUST show every single step of the math. Verify every number. Use the correct formulas. Show unit conversions.
2. The correct_answer_index MUST match one of the options exactly.
3. The explanation MUST clearly state why the correct answer is right and briefly why others are wrong.
4. Keep the original question text — do NOT change the question itself.
5. Keep original options if they are reasonable. Only change options if they contain errors or duplicates.
6. For Canadian water/wastewater regulations, use Ontario (OWWCO/MECP) standards unless the bank specifies another province.
7. Step-by-step breakdown is REQUIRED. Each step should have a label (l) and content (c).

This question is from the "${q.bankKey}" question bank.`
            },
            {
              role: 'user',
              content: `FLAGGED ISSUE: ${issue?.issue || 'Needs verification and correction'}

QUESTION (ID: ${q.id}, Q#${q.questionNum}):
${q.question}

CURRENT OPTIONS:
A) ${opts[0]}
B) ${opts[1]}
C) ${opts[2]}
D) ${opts[3]}

CURRENTLY MARKED CORRECT: ${['A','B','C','D'][q.correctIndex]}) ${opts[q.correctIndex]}

CURRENT EXPLANATION: ${(q.explanation || '').substring(0, 500)}

IS CALCULATION: ${q.isCalc ? 'YES — verify all math step by step' : 'NO'}

Fix this question. Return the correct answer index, corrected options (if needed), a complete explanation, and step-by-step breakdown.`
            }
          ]);

          // Validate the fix
          if (fix.correct_answer_index < 0 || fix.correct_answer_index > 3) {
            throw new Error(`Invalid correct_answer_index: ${fix.correct_answer_index}`);
          }
          if (!fix.options || fix.options.length !== 4) {
            throw new Error(`Invalid options array length: ${fix.options?.length}`);
          }
          if (!fix.explanation || fix.explanation.length < 30) {
            throw new Error(`Explanation too short: ${fix.explanation?.length}`);
          }

          // Apply the fix to the database
          await conn.execute(
            'UPDATE questions SET options = ?, correctIndex = ?, explanation = ?, steps = ? WHERE id = ?',
            [
              JSON.stringify(fix.options),
              fix.correct_answer_index,
              fix.explanation,
              JSON.stringify(fix.steps),
              q.id
            ]
          );

          progress.fixed.push({
            id: q.id,
            bankKey: q.bankKey,
            questionNum: q.questionNum,
            oldCorrectIndex: q.correctIndex,
            newCorrectIndex: fix.correct_answer_index,
            confidence: fix.confidence,
            change: fix.change_summary
          });

          processed++;
        } catch (err) {
          progress.failed.push({ id: q.id, bankKey: q.bankKey, questionNum: q.questionNum, error: err.message });
          processed++;
        }
      }
    }

    // Run with concurrency
    const workers = Array.from({ length: CONCURRENCY }, () => processOne());
    await Promise.all(workers);

    // Save progress
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    const total = progress.fixed.length + progress.failed.length;
    const pct = ((total / flaggedIds.length) * 100).toFixed(1);
    console.log(`Progress: ${total}/${flaggedIds.length} (${pct}%) | Fixed: ${progress.fixed.length} | Failed: ${progress.failed.length}`);
  }

  // Final save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(progress, null, 2));

  // Summary
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Total processed: ${progress.fixed.length + progress.failed.length}`);
  console.log(`Fixed: ${progress.fixed.length}`);
  console.log(`Failed: ${progress.failed.length}`);

  const highConf = progress.fixed.filter(f => f.confidence === 'HIGH').length;
  const medConf = progress.fixed.filter(f => f.confidence === 'MEDIUM').length;
  const lowConf = progress.fixed.filter(f => f.confidence === 'LOW').length;
  console.log(`Confidence: HIGH=${highConf}, MEDIUM=${medConf}, LOW=${lowConf}`);

  const answerChanged = progress.fixed.filter(f => f.oldCorrectIndex !== f.newCorrectIndex).length;
  console.log(`Answer index changed: ${answerChanged}`);

  if (progress.failed.length > 0) {
    console.log('\n=== FAILED ===');
    for (const f of progress.failed) {
      console.log(`  ID:${f.id} (${f.bankKey} Q${f.questionNum}): ${f.error}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
