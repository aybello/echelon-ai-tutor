import mysql from 'mysql2/promise';
import fs from 'fs';

const BATCH_SIZE = 10; // questions per LLM call
const CONCURRENCY = 5; // parallel LLM calls
const RESULTS_FILE = '/home/ubuntu/deep-verify-results.json';
const PROGRESS_FILE = '/home/ubuntu/deep-verify-progress.json';

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
              name: 'verification_batch',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', description: 'Question ID' },
                        status: { type: 'string', description: 'CORRECT or INCORRECT or UNCERTAIN' },
                        issue: { type: 'string', description: 'Description of the issue if INCORRECT, empty string if CORRECT' },
                        suggested_correct_index: { type: 'integer', description: 'The correct option index (0-3) if the current one is wrong, -1 if current is correct' }
                      },
                      required: ['id', 'status', 'issue', 'suggested_correct_index'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['results'],
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
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

function formatBatch(questions) {
  return questions.map(q => {
    const opts = JSON.parse(q.options);
    return `--- Question ID: ${q.id} | Bank: ${q.bankKey} | Q#${q.questionNum} | isCalc: ${q.isCalc ? 'YES' : 'NO'} ---
Question: ${q.question}
A) ${opts[0]}
B) ${opts[1]}
C) ${opts[2]}
D) ${opts[3]}
Marked Correct: ${['A','B','C','D'][q.correctIndex]}) ${opts[q.correctIndex]}
Explanation: ${(q.explanation || '').substring(0, 400)}`;
  }).join('\n\n');
}

async function processBatch(questions) {
  const formatted = formatBatch(questions);
  const result = await invokeLLM([
    {
      role: 'system',
      content: `You are an expert Canadian water and wastewater operator certification examiner. Your job is to verify that each question has the CORRECT answer marked.

For each question, check:
1. Is the marked correct answer actually correct? (Most important)
2. Does the explanation support the marked correct answer?
3. For calculation questions (isCalc: YES): Does the math check out? Verify the calculation step by step.
4. Are there any contradictions between the question, correct answer, and explanation?

Be strict about calculations — verify every number. For conceptual questions, use your expert knowledge of Canadian water/wastewater regulations and operations.

Mark as CORRECT if the answer is right. Mark as INCORRECT only if you are confident the marked answer is wrong. Mark as UNCERTAIN if you're not sure (e.g., the answer could be debatable).

Return results for ALL ${questions.length} questions in the batch.`
    },
    {
      role: 'user',
      content: `Verify these ${questions.length} questions:\n\n${formatted}`
    }
  ]);
  return result.results;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Load progress if resuming
  let processedIds = new Set();
  let allResults = [];
  if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    processedIds = new Set(progress.processedIds);
    allResults = progress.results;
    console.log(`Resuming from progress: ${processedIds.size} questions already processed`);
  }
  
  // Get all questions
  const [allQ] = await conn.execute(
    'SELECT id, bankKey, questionNum, question, options, correctIndex, explanation, isCalc FROM questions ORDER BY bankKey, questionNum'
  );
  
  // Filter out already processed
  const remaining = allQ.filter(q => !processedIds.has(q.id));
  console.log(`Total: ${allQ.length}, Already processed: ${processedIds.size}, Remaining: ${remaining.length}`);
  
  // Split into batches
  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batches.push(remaining.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Processing ${batches.length} batches of ${BATCH_SIZE} questions each...`);
  
  let batchNum = 0;
  let errors = 0;
  
  // Process in parallel groups
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const group = batches.slice(i, i + CONCURRENCY);
    const promises = group.map(async (batch, idx) => {
      try {
        const results = await processBatch(batch);
        return { batch, results, error: null };
      } catch (err) {
        return { batch, results: null, error: err.message };
      }
    });
    
    const outcomes = await Promise.all(promises);
    
    for (const outcome of outcomes) {
      batchNum++;
      if (outcome.error) {
        errors++;
        console.log(`  Batch ${batchNum}: ERROR - ${outcome.error}`);
        continue;
      }
      
      for (const r of outcome.results) {
        processedIds.add(r.id);
        if (r.status !== 'CORRECT') {
          allResults.push(r);
        }
      }
      for (const q of outcome.batch) {
        processedIds.add(q.id);
      }
      
      const incorrect = outcome.results.filter(r => r.status === 'INCORRECT').length;
      const uncertain = outcome.results.filter(r => r.status === 'UNCERTAIN').length;
      if (incorrect > 0 || uncertain > 0) {
        console.log(`  Batch ${batchNum}/${batches.length}: ${incorrect} INCORRECT, ${uncertain} UNCERTAIN`);
      }
    }
    
    // Save progress every 10 groups
    if (i % (CONCURRENCY * 10) === 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        processedIds: [...processedIds],
        results: allResults
      }));
      const pct = ((processedIds.size / allQ.length) * 100).toFixed(1);
      console.log(`Progress: ${processedIds.size}/${allQ.length} (${pct}%) | Issues found: ${allResults.length} | Errors: ${errors}`);
    }
  }
  
  // Final save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    processedIds: [...processedIds],
    results: allResults
  }));
  
  // Save final results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));
  
  // Summary
  const incorrect = allResults.filter(r => r.status === 'INCORRECT');
  const uncertain = allResults.filter(r => r.status === 'UNCERTAIN');
  
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Total questions verified: ${processedIds.size}`);
  console.log(`INCORRECT: ${incorrect.length}`);
  console.log(`UNCERTAIN: ${uncertain.length}`);
  console.log(`Batch errors: ${errors}`);
  
  if (incorrect.length > 0) {
    console.log('\n=== INCORRECT QUESTIONS ===');
    for (const r of incorrect) {
      console.log(`  ID:${r.id} - ${r.issue} (suggested correct: ${['A','B','C','D'][r.suggested_correct_index] || 'N/A'})`);
    }
  }
  
  if (uncertain.length > 0) {
    console.log('\n=== UNCERTAIN QUESTIONS ===');
    for (const r of uncertain.slice(0, 20)) {
      console.log(`  ID:${r.id} - ${r.issue}`);
    }
    if (uncertain.length > 20) console.log(`  ... and ${uncertain.length - 20} more`);
  }
  
  await conn.end();
}

main().catch(console.error);
