/**
 * Classify WPI questions as isCalc: true/false using LLM
 * Handles both "question:" and "text:" field names used in different WPI files
 *
 * Run: node scripts/classify-wpi-calc.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_URL || !FORGE_KEY) {
  console.error("Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

async function callLLM(messages) {
  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      messages,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text.substring(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Extract question objects from a TypeScript file
 * Handles both "question:" and "text:" field names
 */
function extractQuestions(content) {
  const questions = [];
  const idMatches = [...content.matchAll(/\bid:\s*(\d+),/g)];
  for (const match of idMatches) {
    const id = parseInt(match[1]);
    const startIdx = match.index;
    const block = content.slice(startIdx, startIdx + 1200);
    // Try "question:" first, then "text:"
    const qMatch = block.match(/(?:question|text):\s*["'`]([^"'`]+)["'`]/);
    if (qMatch) {
      questions.push({ id, question: qMatch[1] });
    }
  }
  return questions;
}

/**
 * Classify a batch of questions using LLM
 */
async function classifyBatch(questions) {
  const questionList = questions
    .map((q) => `ID ${q.id}: ${q.question}`)
    .join("\n");

  const prompt = `You are classifying water/wastewater operator exam questions.

For each question below, determine if it is a GENUINE CALCULATION question that requires arithmetic or formula application to solve (isCalc: true), or a conceptual/knowledge question (isCalc: false).

isCalc: true ONLY if the question:
- Requires performing arithmetic (addition, subtraction, multiplication, division)
- Requires applying a formula with numbers to get a numerical answer
- Asks you to calculate, compute, determine a value, find a flow rate, dose, detention time, CT value, etc.

isCalc: false if the question:
- Asks about definitions, regulations, procedures, or concepts
- Mentions numbers only as context but asks about a process or concept
- Asks to identify, describe, explain, or select a best practice

Return ONLY a JSON array like: [{"id": 1, "isCalc": true}, {"id": 2, "isCalc": false}, ...]

Questions:
${questionList}`;

  const response = await callLLM([
    { role: "system", content: "You are a precise classifier. Return only valid JSON arrays." },
    { role: "user", content: prompt },
  ]);

  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`No JSON in response: ${response.substring(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

/**
 * Inject isCalc: true into question objects in the TypeScript file content
 * Works for both "question:" and "text:" field names
 */
function injectIsCalc(content, calcIds) {
  const calcIdSet = new Set(calcIds);
  let modified = content;
  let count = 0;

  for (const id of calcIdSet) {
    // Find the question block for this id and inject isCalc: true after correctAnswer
    const idPattern = new RegExp(`(\\bid:\\s*${id},)([\\s\\S]*?)(correctAnswer:\\s*\\d+,)`, 'g');
    const newContent = modified.replace(idPattern, (match, idPart, middle, correctAnswer) => {
      if (middle.includes('isCalc:')) return match;
      count++;
      return `${idPart}${middle}${correctAnswer}\n    isCalc: true,`;
    });
    if (newContent !== modified) {
      modified = newContent;
    }
  }

  return { content: modified, count };
}

// Only process the files that had 0 questions (wrong format detected)
const WPI_FILES_REMAINING = [
  "wpiClass4WaterQuestions",
  "wpiClass1WastewaterQuestions",
  "wpiClass2WastewaterQuestions",
  "wpiClass3WastewaterQuestions",
  "wpiClass4WastewaterQuestions",
];

const BATCH_SIZE = 30;

async function processFile(filename) {
  const filePath = path.join(__dirname, `../client/src/lib/${filename}.ts`);
  const content = readFileSync(filePath, "utf8");

  console.log(`\n=== Processing ${filename} ===`);
  const questions = extractQuestions(content);
  console.log(`  Found ${questions.length} questions`);

  if (questions.length === 0) {
    console.log("  No questions found — skipping");
    return { filename, total: 0, calcCount: 0 };
  }

  const calcIds = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    process.stdout.write(`  Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(questions.length/BATCH_SIZE)} (ids ${batch[0].id}-${batch[batch.length-1].id})...`);
    
    try {
      const results = await classifyBatch(batch);
      const batchCalcIds = results.filter(r => r.isCalc).map(r => r.id);
      calcIds.push(...batchCalcIds);
      console.log(` ${batchCalcIds.length} calc`);
    } catch (err) {
      console.error(`\n  ERROR: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const results = await classifyBatch(batch);
        const batchCalcIds = results.filter(r => r.isCalc).map(r => r.id);
        calcIds.push(...batchCalcIds);
        console.log(`  Retry OK: ${batchCalcIds.length} calc`);
      } catch (err2) {
        console.error(`  Retry failed: ${err2.message}. Skipping batch.`);
      }
    }
    
    if (i + BATCH_SIZE < questions.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`  Total calc: ${calcIds.length} / ${questions.length}`);

  const { content: newContent, count } = injectIsCalc(content, calcIds);
  writeFileSync(filePath, newContent, "utf8");
  console.log(`  Injected isCalc: true into ${count} questions`);

  return { filename, total: questions.length, calcCount: calcIds.length };
}

async function main() {
  console.log("WPI isCalc Classifier (remaining files)");
  console.log("=========================================\n");

  const results = [];
  for (const filename of WPI_FILES_REMAINING) {
    const result = await processFile(filename);
    results.push(result);
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    console.log(`  ${r.filename}: ${r.calcCount}/${r.total} calc questions`);
  }
  console.log("\nDone!");
}

main().catch(console.error);
