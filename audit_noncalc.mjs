/**
 * audit_noncalc.mjs
 * Audits all non-calc questions in the exam bank for correctness and consistency.
 * Calls the Forge LLM API directly via fetch (no TS compilation needed).
 *
 * Supports resume: saves progress to /home/ubuntu/audit_noncalc_progress.json
 * Results saved to /home/ubuntu/audit_noncalc_results.json
 */

import { createPool } from "mysql2/promise";
import { config } from "dotenv";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";

config();

const PROGRESS_FILE = "/home/ubuntu/audit_noncalc_progress.json";
const RESULTS_FILE = "/home/ubuntu/audit_noncalc_results.json";
const CONCURRENCY = 2;
const RETRY_DELAYS = [3000, 8000, 20000, 45000];

const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.im").replace(/\/$/, "") + "/v1/chat/completions";
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_KEY) {
  console.error("BUILT_IN_FORGE_API_KEY not set");
  process.exit(1);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function callLLM(messages, retryCount = 0) {
  try {
    const res = await fetch(FORGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FORGE_API_KEY}`
      },
      body: JSON.stringify({
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "audit_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correct: { type: "boolean", description: "Is the marked answer actually correct?" },
                explanation_matches: { type: "boolean", description: "Does the explanation match/support the marked answer?" },
                question_makes_sense: { type: "boolean", description: "Does the question make sense (no copy-paste errors, coherent options, correct units)?" },
                issue: { type: "string", description: "Brief description of the issue if any flag is false, otherwise empty string" },
                confidence: { type: "string", description: "high, medium, or low" }
              },
              required: ["correct", "explanation_matches", "question_makes_sense", "issue", "confidence"],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (res.status === 429) {
      if (retryCount < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[retryCount]);
        return callLLM(messages, retryCount + 1);
      }
      throw new Error("Rate limit exceeded after retries");
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from LLM");
    return JSON.parse(content);
  } catch (err) {
    const msg = err?.message || String(err);
    if ((msg.includes('429') || msg.includes('rate')) && retryCount < RETRY_DELAYS.length) {
      await sleep(RETRY_DELAYS[retryCount]);
      return callLLM(messages, retryCount + 1);
    }
    throw err;
  }
}

async function auditQuestion(q) {
  const opts = JSON.parse(q.options);
  const letters = ['A', 'B', 'C', 'D'];
  const optText = opts.map((o, i) => `${letters[i]}) ${o}`).join('\n');
  const correctLetter = letters[q.correctIndex] || '?';
  const correctText = opts[q.correctIndex] || 'MISSING';

  const prompt = `You are a quality auditor for a Canadian water/wastewater operator exam bank. Review this question and check for errors.

QUESTION:
${q.question}

OPTIONS:
${optText}

MARKED CORRECT ANSWER: ${correctLetter}) ${correctText}

EXPLANATION PROVIDED:
${q.explanation || '(no explanation provided)'}

BANK: ${q.bankKey} | MODULE: ${q.module || 'N/A'} | TOPIC: ${q.topic || 'N/A'}

Check ALL of the following:
1. Is the marked answer (${correctLetter}) actually the best/correct answer for this question based on standard water/wastewater treatment knowledge?
2. Does the explanation clearly support and match the marked answer (not a different option)?
3. Does the question make sense? Look for: options from a completely different question, wrong units for the question topic, incoherent distractors, or obvious copy-paste errors.

Be strict but fair. Flag only genuine errors, not minor wording preferences. If the answer is defensible, mark it as correct.`;

  return callLLM([
    { role: "system", content: "You are a strict but fair exam quality auditor for water/wastewater operator certification exams. Return JSON only." },
    { role: "user", content: prompt }
  ]);
}

// Load progress
let progress = { processed: {}, flagged: [] };
if (existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Resuming: ${Object.keys(progress.processed).length} already done, ${progress.flagged.length} flagged`);
  } catch {}
}

const pool = createPool(process.env.DATABASE_URL);

// Fetch all non-calc questions
const [allQuestions] = await pool.execute(
  "SELECT id, bankKey, questionNum, module, topic, question, options, correctIndex, explanation FROM questions WHERE isCalc='no' ORDER BY id ASC"
);

console.log(`Total non-calc questions: ${allQuestions.length}`);
const remaining = allQuestions.filter(q => !progress.processed[q.id]);
console.log(`Remaining to process: ${remaining.length}`);

let done = 0;
let errors = 0;

async function processOne(q) {
  try {
    const result = await auditQuestion(q);
    progress.processed[q.id] = true;

    const hasProblem = !result.correct || !result.explanation_matches || !result.question_makes_sense;
    if (hasProblem && result.confidence !== 'low') {
      progress.flagged.push({
        id: q.id,
        bankKey: q.bankKey,
        questionNum: q.questionNum,
        module: q.module,
        topic: q.topic,
        question: q.question.substring(0, 250),
        options: JSON.parse(q.options),
        correctIndex: q.correctIndex,
        explanation: q.explanation?.substring(0, 300),
        correct: result.correct,
        explanation_matches: result.explanation_matches,
        question_makes_sense: result.question_makes_sense,
        issue: result.issue,
        confidence: result.confidence
      });
    }
    done++;
    if (done % 100 === 0) {
      const total = Object.keys(progress.processed).length;
      console.log(`Progress: ${total}/${allQuestions.length} (${Math.round(total/allQuestions.length*100)}%) | Flagged: ${progress.flagged.length} | Errors: ${errors}`);
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
      writeFileSync(RESULTS_FILE, JSON.stringify(progress.flagged, null, 2));
    }
  } catch (err) {
    errors++;
    if (errors % 20 === 0) {
      console.error(`Error on ID ${q.id}: ${err.message?.substring(0, 100)}`);
    }
  }
}

// Process with limited concurrency
for (let i = 0; i < remaining.length; i += CONCURRENCY) {
  const batch = remaining.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(processOne));
  await sleep(200);
}

// Final save
writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
writeFileSync(RESULTS_FILE, JSON.stringify(progress.flagged, null, 2));

console.log(`\n=== AUDIT COMPLETE ===`);
console.log(`Total processed: ${Object.keys(progress.processed).length}`);
console.log(`Total flagged: ${progress.flagged.length}`);
console.log(`Errors: ${errors}`);

await pool.end();
